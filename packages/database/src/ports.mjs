// Storage ports.
//
// SYSTEM_ARCHITECTURE.md requires durable state to separate two kinds of record:
//   - mutable operational records (candidate and run state);
//   - immutable versioned records (artifacts, approvals, audit events).
//
// Keeping that split behind ports is what lets the JSONL adapter be swapped for the
// managed PostgreSQL of P0-04 without touching the orchestrator. It also lets tests
// run against an in-memory adapter, which is the only way stale/conflict/concurrency
// behaviour becomes deterministic.

/**
 * Thrown when a write loses a compare-and-set race.
 * The caller is expected to re-read and re-present, never to retry blindly.
 */
export class VersionConflictError extends Error {
  constructor(candidateId, expectedVersion, actualVersion) {
    super('Candidate ' + candidateId + ' changed since version ' + expectedVersion + ' (now ' + actualVersion + ').');
    this.name = 'VersionConflictError';
    this.code = 'version_conflict';
    this.candidateId = candidateId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

const REQUIRED_METHODS = Object.freeze([
  'listCandidates',
  'getCandidate',
  'saveCandidate',
  'putArtifact',
  'getArtifact',
  'appendEvent',
  'readEvents',
  'validateChain',
  'rememberCommand',
  'recallCommand'
]);

/** Fail fast on an adapter that only looks like a store. */
export function assertStorePort(store) {
  const missing = REQUIRED_METHODS.filter((method) => typeof store?.[method] !== 'function');
  if (missing.length > 0) {
    throw new Error('Store adapter is missing: ' + missing.join(', '));
  }
  return store;
}

export { REQUIRED_METHODS };
