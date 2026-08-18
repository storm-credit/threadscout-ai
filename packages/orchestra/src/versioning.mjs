import { AGENT_REGISTRY } from './agent-registry.mjs';
import { AGENT_SYSTEM_PROMPTS } from './prompts.mjs';
import { AGENT_OUTPUT_SCHEMAS } from './schemas.mjs';

// Hashing primitives live in the domain core so the domain and the runtime cannot
// drift into two different definitions of artifact identity.
export { canonicalStringify, sha256 } from '../../core/src/hash.mjs';
import { canonicalStringify, sha256 } from '../../core/src/hash.mjs';

export function buildVersionManifest({
  registry = AGENT_REGISTRY,
  prompts = AGENT_SYSTEM_PROMPTS,
  schemas = AGENT_OUTPUT_SCHEMAS
} = {}) {
  const agentIds = registry.map((agent) => agent.id);
  const manifest = {
    manifestVersion: 1,
    rosterHash: sha256(registry),
    promptHashes: Object.fromEntries(agentIds.map((id) => [id, sha256(prompts[id])])),
    schemaHashes: Object.fromEntries(agentIds.map((id) => [id, sha256(schemas[id])]))
  };
  return Object.freeze({ ...manifest, manifestHash: sha256(manifest) });
}

export function attachArtifactMetadata({
  agentId,
  artifact,
  manifest = buildVersionManifest(),
  parentArtifactHashes = [],
  evidenceHash = null
}) {
  if (!manifest.promptHashes?.[agentId] || !manifest.schemaHashes?.[agentId]) {
    throw new Error(`Version manifest does not contain ${agentId}.`);
  }
  const cleanArtifact = structuredClone(artifact);
  delete cleanArtifact._meta;
  const metadata = {
    formatVersion: 1,
    agentId,
    manifestHash: manifest.manifestHash,
    promptHash: manifest.promptHashes[agentId],
    schemaHash: manifest.schemaHashes[agentId],
    parentArtifactHashes: [...new Set(parentArtifactHashes)].sort(),
    evidenceHash
  };
  const artifactHash = sha256({ artifact: cleanArtifact, metadata });
  return { ...cleanArtifact, _meta: { ...metadata, artifactHash } };
}

export function verifyVersionedArtifact(versionedArtifact) {
  const errors = [];
  if (!versionedArtifact?._meta) return { ok: false, errors: ['Artifact metadata is missing.'] };
  const cleanArtifact = structuredClone(versionedArtifact);
  const metadata = structuredClone(cleanArtifact._meta);
  delete cleanArtifact._meta;
  const claimedHash = metadata.artifactHash;
  delete metadata.artifactHash;
  const actualHash = sha256({ artifact: cleanArtifact, metadata });
  if (claimedHash !== actualHash) errors.push('Artifact hash does not match its content and metadata.');
  if (!metadata.agentId) errors.push('Artifact agentId is missing.');
  if (!metadata.promptHash || !metadata.schemaHash || !metadata.manifestHash) {
    errors.push('Artifact version hashes are incomplete.');
  }
  return { ok: errors.length === 0, errors, actualHash };
}

export function evaluateArtifactFreshness(versionedArtifact, {
  manifest = buildVersionManifest(),
  currentEvidenceHash = null
} = {}) {
  const integrity = verifyVersionedArtifact(versionedArtifact);
  const reasons = [...integrity.errors];
  const metadata = versionedArtifact?._meta ?? {};
  const agentId = metadata.agentId;
  if (agentId && manifest.promptHashes?.[agentId] !== metadata.promptHash) reasons.push('Agent prompt version changed.');
  if (agentId && manifest.schemaHashes?.[agentId] !== metadata.schemaHash) reasons.push('Agent output schema changed.');
  if (metadata.manifestHash !== manifest.manifestHash) reasons.push('Runtime manifest changed.');
  if (metadata.evidenceHash && currentEvidenceHash && metadata.evidenceHash !== currentEvidenceHash) {
    reasons.push('Evidence changed after the artifact was created.');
  }
  return { fresh: reasons.length === 0, reasons };
}
