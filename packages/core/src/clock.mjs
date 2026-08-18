// Time and identity are injected, never read ambiently.
//
// Two reasons this matters here rather than being a style preference:
//   1. artifact hashes must be reproducible, and `new Date()` inside an artifact
//      makes every run produce a different hash for identical content;
//   2. freshness gates compare timestamps, so a fixture with a hard-coded date
//      silently rots into a failing test as real time moves past it.

export function systemClock() {
  return new Date().toISOString();
}

/**
 * A clock that starts at a fixed instant and advances a fixed step per read.
 * Deterministic across runs, and still strictly increasing so ordering is testable.
 */
export function createFixedClock(startIso = '2026-08-14T00:00:00.000Z', stepMs = 1000) {
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) throw new Error(`Invalid clock start: ${startIso}`);
  let ticks = 0;
  return () => new Date(start + ticks++ * stepMs).toISOString();
}

/** Sequential identifiers scoped by kind: `cand_1`, `run_1`, `draft_3`. */
export function createIdFactory(seedLabel = '') {
  const counters = new Map();
  return (kind) => {
    if (!/^[a-z][a-z0-9_]{0,20}$/.test(kind)) throw new Error(`Invalid id kind: ${kind}`);
    const next = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, next);
    return seedLabel ? `${kind}_${seedLabel}_${next}` : `${kind}_${next}`;
  };
}

/** Identifiers that stay unique across process restarts, for the running application. */
export function createRuntimeIdFactory(random = () => Math.random()) {
  let counter = 0;
  return (kind) => {
    if (!/^[a-z][a-z0-9_]{0,20}$/.test(kind)) throw new Error(`Invalid id kind: ${kind}`);
    counter += 1;
    const entropy = Math.floor(random() * 0xffffff).toString(16).padStart(6, '0');
    return `${kind}_${Date.now().toString(36)}${counter.toString(36)}${entropy}`;
  };
}

export function isoOrNull(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

export function hoursBetween(fromIso, toIso) {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return (to - from) / 3_600_000;
}
