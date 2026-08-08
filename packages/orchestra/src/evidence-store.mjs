import { access, appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalStringify, sha256, verifyVersionedArtifact } from './versioning.mjs';

function safeKind(kind) {
  if (!/^[a-z][a-z0-9_-]{0,40}$/.test(kind)) throw new Error(`Invalid object kind: ${kind}`);
  return kind;
}

function runKey(runId) {
  if (typeof runId !== 'string' || runId.length === 0) throw new Error('runId is required.');
  return sha256(runId).slice(0, 32);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function createJsonlEvidenceStore({ rootDir, clock = () => new Date().toISOString() }) {
  if (!rootDir) throw new Error('Evidence store rootDir is required.');
  const root = path.resolve(rootDir);
  const queues = new Map();

  function enqueue(key, task) {
    const previous = queues.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    queues.set(key, next.finally(() => {
      if (queues.get(key) === next) queues.delete(key);
    }));
    return next;
  }

  async function initialize() {
    await mkdir(path.join(root, 'objects'), { recursive: true });
    await mkdir(path.join(root, 'runs'), { recursive: true });
    return root;
  }

  async function putObject(kind, value) {
    await initialize();
    const checkedKind = safeKind(kind);
    const storageHash = sha256(value);
    const directory = path.join(root, 'objects', checkedKind, storageHash.slice(0, 2));
    const target = path.join(directory, `${storageHash}.json`);
    await mkdir(directory, { recursive: true });
    if (!(await exists(target))) {
      const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temporary, `${canonicalStringify(value)}\n`, { encoding: 'utf8', flag: 'wx' });
      try {
        await rename(temporary, target);
      } catch (error) {
        if (!(await exists(target))) throw error;
      }
    }
    return { kind: checkedKind, storageHash, path: target };
  }

  async function getObject(kind, storageHash) {
    const checkedKind = safeKind(kind);
    if (!/^[a-f0-9]{64}$/.test(storageHash)) throw new Error('Invalid object hash.');
    const target = path.join(root, 'objects', checkedKind, storageHash.slice(0, 2), `${storageHash}.json`);
    const parsed = JSON.parse(await readFile(target, 'utf8'));
    if (sha256(parsed) !== storageHash) throw new Error('Stored object hash mismatch.');
    return parsed;
  }

  async function readRunEvents(runId) {
    const eventPath = path.join(root, 'runs', runKey(runId), 'events.jsonl');
    if (!(await exists(eventPath))) return [];
    const text = await readFile(eventPath, 'utf8');
    return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  }

  async function appendRunEvent(runId, type, payload = {}) {
    if (!/^[a-z][a-z0-9_.-]{0,80}$/.test(type)) throw new Error(`Invalid event type: ${type}`);
    const key = runKey(runId);
    return enqueue(key, async () => {
      await initialize();
      const runDir = path.join(root, 'runs', key);
      await mkdir(runDir, { recursive: true });
      const events = await readRunEvents(runId);
      const previous = events.at(-1) ?? null;
      const base = {
        eventVersion: 1,
        runId,
        sequence: events.length + 1,
        type,
        createdAt: clock(),
        previousEventHash: previous?.eventHash ?? null,
        payloadHash: sha256(payload),
        payload: structuredClone(payload)
      };
      const event = { ...base, eventHash: sha256(base) };
      await appendFile(path.join(runDir, 'events.jsonl'), `${canonicalStringify(event)}\n`, 'utf8');
      return event;
    });
  }

  async function validateRunChain(runId) {
    const events = await readRunEvents(runId);
    const errors = [];
    let previousHash = null;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const clean = { ...event };
      delete clean.eventHash;
      if (event.sequence !== index + 1) errors.push(`Event ${index + 1} has an invalid sequence.`);
      if (event.previousEventHash !== previousHash) errors.push(`Event ${index + 1} has an invalid previous hash.`);
      if (event.payloadHash !== sha256(event.payload)) errors.push(`Event ${index + 1} payload hash mismatch.`);
      if (event.eventHash !== sha256(clean)) errors.push(`Event ${index + 1} hash mismatch.`);
      previousHash = event.eventHash;
    }
    return { ok: errors.length === 0, errors, eventCount: events.length, headHash: previousHash };
  }

  async function saveArtifact({ runId, agentId, artifact }) {
    const integrity = verifyVersionedArtifact(artifact);
    if (!integrity.ok) throw new Error(`Cannot store invalid artifact: ${integrity.errors.join(' | ')}`);
    const stored = await putObject('artifacts', artifact);
    const event = await appendRunEvent(runId, 'artifact_saved', {
      agentId,
      artifactType: artifact.type,
      artifactHash: artifact._meta.artifactHash,
      storageHash: stored.storageHash,
      promptHash: artifact._meta.promptHash,
      schemaHash: artifact._meta.schemaHash,
      evidenceHash: artifact._meta.evidenceHash
    });
    return { ...stored, event };
  }

  async function saveSource({ runId, source }) {
    const stored = await putObject('sources', source);
    const event = await appendRunEvent(runId, 'source_saved', {
      sourceId: source.id ?? stored.storageHash,
      storageHash: stored.storageHash,
      observedAt: source.observedAt ?? null
    });
    return { ...stored, event };
  }

  return {
    root,
    initialize,
    putObject,
    getObject,
    appendRunEvent,
    readRunEvents,
    validateRunChain,
    saveArtifact,
    saveSource
  };
}
