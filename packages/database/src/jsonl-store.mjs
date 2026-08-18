// Durable JSONL store adapter.
//
// Operational records are append-only snapshots replayed on load; artifacts are
// content-addressed objects; run events are a hash chain. This reuses the existing
// evidence store rather than inventing a second on-disk format.
//
// Everything lives under .threadscout-data/, which is outside Git (CLAUDE.md
// section 11).

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalStringify, sha256 } from '../../core/src/hash.mjs';
import { createJsonlEvidenceStore } from '../../orchestra/src/evidence-store.mjs';
import { attachArtifactMetadata, buildVersionManifest } from '../../orchestra/src/versioning.mjs';
import { VersionConflictError } from './ports.mjs';

async function readLines(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    return text.split('\n').filter((line) => line.length > 0);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Parse an append-only log, tolerating a torn final line.
 *
 * An append-only log's characteristic failure is a partial last write after a crash.
 * A torn line in the middle would mean real corruption, so that still throws.
 */
export function parseAppendOnlyLines(lines) {
  const records = [];
  const warnings = [];

  lines.forEach((line, index) => {
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      if (index === lines.length - 1) {
        warnings.push('마지막 줄이 완결되지 않아 복구 중 건너뜁니다.');
        return;
      }
      throw new Error('Corrupted append-only log at line ' + (index + 1) + ': ' + error.message);
    }
  });

  return { records, warnings };
}

export function createJsonlStore({ rootDir, clock } = {}) {
  if (!rootDir) throw new Error('JSONL store rootDir is required.');
  const now = clock ?? (() => new Date().toISOString());
  const root = path.resolve(rootDir);
  const candidatesPath = path.join(root, 'candidates.jsonl');
  const commandsPath = path.join(root, 'commands.jsonl');
  const evidenceStore = createJsonlEvidenceStore({ rootDir: root, clock: now });
  const manifest = buildVersionManifest();

  const candidates = new Map();
  const commands = new Map();
  let loaded = false;
  let writeChain = Promise.resolve();
  const recoveryWarnings = [];

  function serialize(task) {
    const next = writeChain.catch(() => undefined).then(task);
    writeChain = next.catch(() => undefined);
    return next;
  }

  async function load() {
    if (loaded) return;
    await mkdir(root, { recursive: true });

    const candidateLog = parseAppendOnlyLines(await readLines(candidatesPath));
    recoveryWarnings.push(...candidateLog.warnings);
    for (const record of candidateLog.records) {
      candidates.set(record.candidateId, record);
    }

    const commandLog = parseAppendOnlyLines(await readLines(commandsPath));
    recoveryWarnings.push(...commandLog.warnings);
    for (const entry of commandLog.records) {
      commands.set(entry.key, entry.result);
    }

    loaded = true;
  }

  async function listCandidates() {
    await load();
    return [...candidates.values()].map((record) => structuredClone(record));
  }

  async function getCandidate(candidateId) {
    await load();
    const record = candidates.get(candidateId);
    return record ? structuredClone(record) : null;
  }

  async function saveCandidate(record, { expectedVersion = null } = {}) {
    await load();
    return serialize(async () => {
      const existing = candidates.get(record.candidateId);
      if (existing && expectedVersion !== null && existing.version !== expectedVersion) {
        throw new VersionConflictError(record.candidateId, expectedVersion, existing.version);
      }
      const snapshot = structuredClone(record);
      await appendFile(candidatesPath, canonicalStringify(snapshot) + '\n', 'utf8');
      candidates.set(snapshot.candidateId, snapshot);
      return structuredClone(snapshot);
    });
  }

  /**
   * Store an artifact with its prompt, schema, and manifest hashes attached, so an
   * artifact can be traced back to the exact agent configuration that produced it
   * (AT-19).
   */
  async function putArtifact(artifact, { parentArtifactHashes = [], evidenceHash = null } = {}) {
    const versioned = attachArtifactMetadata({
      agentId: artifact.agentId,
      artifact,
      manifest,
      parentArtifactHashes,
      evidenceHash
    });
    const stored = await evidenceStore.putObject('artifacts', versioned);
    return { storageHash: stored.storageHash, artifactHash: versioned._meta.artifactHash };
  }

  async function getArtifact(storageHash) {
    try {
      return await evidenceStore.getObject('artifacts', storageHash);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  function appendEvent(runId, type, payload = {}) {
    return evidenceStore.appendRunEvent(runId, type, payload);
  }

  function readEvents(runId) {
    return evidenceStore.readRunEvents(runId);
  }

  function validateChain(runId) {
    return evidenceStore.validateRunChain(runId);
  }

  async function rememberCommand(key, result) {
    if (!key) return result;
    await load();
    return serialize(async () => {
      const entry = { key, at: now(), resultHash: sha256(result), result: structuredClone(result) };
      await appendFile(commandsPath, canonicalStringify(entry) + '\n', 'utf8');
      commands.set(key, entry.result);
      return result;
    });
  }

  async function recallCommand(key) {
    if (!key) return null;
    await load();
    const result = commands.get(key);
    return result ? structuredClone(result) : null;
  }

  /** Rewrite the operational log as one snapshot per candidate. */
  async function compact() {
    await load();
    return serialize(async () => {
      const lines = [...candidates.values()].map((record) => canonicalStringify(record)).join('\n');
      await writeFile(candidatesPath, lines.length > 0 ? lines + '\n' : '', 'utf8');
      return candidates.size;
    });
  }

  return {
    kind: 'jsonl',
    root,
    listCandidates,
    getCandidate,
    saveCandidate,
    putArtifact,
    getArtifact,
    appendEvent,
    readEvents,
    validateChain,
    rememberCommand,
    recallCommand,
    compact,
    getRecoveryWarnings: () => [...recoveryWarnings]
  };
}
