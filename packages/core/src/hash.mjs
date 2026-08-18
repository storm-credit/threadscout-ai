import { createHash } from 'node:crypto';

// Canonical hashing primitives shared by the domain core and the orchestra runtime.
// A hash here proves that two structures are identical. It never proves that either is true.

function normalize(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot hash a non-finite number.');
    return value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, normalize(value[key])])
    );
  }
  throw new Error(`Unsupported hash value type: ${typeof value}`);
}

export function canonicalStringify(value) {
  return JSON.stringify(normalize(value));
}

export function sha256(value) {
  const input = typeof value === 'string' ? value : canonicalStringify(value);
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Hash an artifact while ignoring runtime bookkeeping that must not affect identity.
 * `_meta` is excluded because it contains the hash itself.
 */
export function hashArtifact(artifact) {
  const clean = structuredClone(artifact ?? null);
  if (clean && typeof clean === 'object') delete clean._meta;
  return sha256(clean);
}
