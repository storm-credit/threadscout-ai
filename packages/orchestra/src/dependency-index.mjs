export function buildDependencyIndex(events) {
  const artifacts = new Map();
  const childrenByParent = new Map();
  const artifactsByEvidence = new Map();

  for (const event of events) {
    if (event.type !== 'artifact_saved') continue;
    const payload = event.payload;
    artifacts.set(payload.artifactHash, payload);
    for (const parentHash of payload.parentArtifactHashes ?? []) {
      const children = childrenByParent.get(parentHash) ?? new Set();
      children.add(payload.artifactHash);
      childrenByParent.set(parentHash, children);
    }
    if (payload.evidenceHash) {
      const linked = artifactsByEvidence.get(payload.evidenceHash) ?? new Set();
      linked.add(payload.artifactHash);
      artifactsByEvidence.set(payload.evidenceHash, linked);
    }
  }

  return { artifacts, childrenByParent, artifactsByEvidence };
}

export function collectDependentArtifacts(index, startingHashes) {
  const visited = new Set();
  const queue = [...startingHashes];
  while (queue.length) {
    const hash = queue.shift();
    if (visited.has(hash)) continue;
    visited.add(hash);
    for (const child of index.childrenByParent.get(hash) ?? []) queue.push(child);
  }
  return [...visited];
}

export function artifactsInvalidatedByEvidence(index, evidenceHash) {
  const direct = [...(index.artifactsByEvidence.get(evidenceHash) ?? [])];
  return collectDependentArtifacts(index, direct);
}
