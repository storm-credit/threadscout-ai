// In-memory store adapter.
//
// The default for tests and for a single local session. It implements the same
// compare-and-set and hash-chain semantics as the durable adapter, so a behaviour
// proven here is not silently different on disk.

import { sha256 } from '../../core/src/hash.mjs';
import { VersionConflictError } from './ports.mjs';

export function createMemoryStore({ clock } = {}) {
  const now = clock ?? (() => new Date().toISOString());
  const candidates = new Map();
  const artifacts = new Map();
  const events = new Map();
  const commands = new Map();

  function listCandidates() {
    return [...candidates.values()].map((record) => structuredClone(record));
  }

  function getCandidate(candidateId) {
    const record = candidates.get(candidateId);
    return record ? structuredClone(record) : null;
  }

  /**
   * Compare-and-set on the record version.
   *
   * `expectedVersion` is the version the caller read. If another session moved the
   * record in between, the write is refused rather than merged (APPLICATION_INTERFACE_SPEC.md
   * "Version conflict rule").
   */
  function saveCandidate(record, { expectedVersion = null } = {}) {
    const existing = candidates.get(record.candidateId);
    if (existing && expectedVersion !== null && existing.version !== expectedVersion) {
      throw new VersionConflictError(record.candidateId, expectedVersion, existing.version);
    }
    candidates.set(record.candidateId, structuredClone(record));
    return structuredClone(record);
  }

  function putArtifact(artifact) {
    const storageHash = sha256(artifact);
    if (!artifacts.has(storageHash)) artifacts.set(storageHash, structuredClone(artifact));
    return { storageHash };
  }

  function getArtifact(storageHash) {
    const artifact = artifacts.get(storageHash);
    return artifact ? structuredClone(artifact) : null;
  }

  function appendEvent(runId, type, payload = {}) {
    if (!/^[a-z][a-z0-9_.-]{0,80}$/.test(type)) throw new Error('Invalid event type: ' + type);
    const chain = events.get(runId) ?? [];
    const previous = chain.at(-1) ?? null;
    const base = {
      eventVersion: 1,
      runId,
      sequence: chain.length + 1,
      type,
      createdAt: now(),
      previousEventHash: previous?.eventHash ?? null,
      payloadHash: sha256(payload),
      payload: structuredClone(payload)
    };
    const stored = { ...base, eventHash: sha256(base) };
    chain.push(stored);
    events.set(runId, chain);
    return structuredClone(stored);
  }

  function readEvents(runId) {
    return (events.get(runId) ?? []).map((item) => structuredClone(item));
  }

  function validateChain(runId) {
    const chain = readEvents(runId);
    const errors = [];
    let previousHash = null;
    chain.forEach((item, index) => {
      const clean = { ...item };
      delete clean.eventHash;
      if (item.sequence !== index + 1) errors.push('Event ' + (index + 1) + ' has an invalid sequence.');
      if (item.previousEventHash !== previousHash) errors.push('Event ' + (index + 1) + ' has an invalid previous hash.');
      if (item.payloadHash !== sha256(item.payload)) errors.push('Event ' + (index + 1) + ' payload hash mismatch.');
      if (item.eventHash !== sha256(clean)) errors.push('Event ' + (index + 1) + ' hash mismatch.');
      previousHash = item.eventHash;
    });
    return { ok: errors.length === 0, errors, eventCount: chain.length, headHash: previousHash };
  }

  /**
   * Idempotency for retryable commands.
   * A repeated submission returns the first result instead of doing the work twice,
   * which is what stops a double tap from creating two approvals.
   */
  function rememberCommand(key, result) {
    if (!key) return result;
    commands.set(key, { at: now(), result: structuredClone(result) });
    return result;
  }

  function recallCommand(key) {
    if (!key) return null;
    const entry = commands.get(key);
    return entry ? structuredClone(entry.result) : null;
  }

  return {
    kind: 'memory',
    listCandidates,
    getCandidate,
    saveCandidate,
    putArtifact,
    getArtifact,
    appendEvent,
    readEvents,
    validateChain,
    rememberCommand,
    recallCommand
  };
}
