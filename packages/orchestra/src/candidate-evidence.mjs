import { purchaseIntentScore } from './source-records.mjs';
import { sha256 } from './versioning.mjs';

function productKey(mention) {
  return [mention.brand, mention.model, mention.variant, mention.name]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join('|');
}

export function buildCandidateEvidence(records) {
  const groups = new Map();
  for (const record of records) {
    for (const mention of record.productMentions ?? []) {
      const key = productKey(mention);
      const group = groups.get(key) ?? { mention, records: [] };
      group.records.push(record);
      groups.set(key, group);
    }
  }

  return [...groups.values()].map(({ mention, records: sourceRecords }) => {
    const uniqueSourceTypes = new Set(sourceRecords.map((record) => record.sourceType));
    const sourceIds = [...new Set(sourceRecords.map((record) => record.id))].sort();
    const purchaseIntent = Math.round(sourceRecords.reduce((sum, record) => sum + purchaseIntentScore(record), 0) / sourceRecords.length);
    const listing = sourceRecords.find((record) => record.sourceType === 'product_listing');
    const evidence = {
      candidateId: `candidate-${sha256({ mention, sourceIds }).slice(0, 16)}`,
      canonicalHint: structuredClone(mention),
      sourceIds,
      sourceTypeCount: uniqueSourceTypes.size,
      purchaseIntent,
      exactMatchReady: Boolean(mention.brand && mention.model && mention.variant && listing),
      commerce: listing?.commerce ?? null,
      synthetic: true
    };
    return { ...evidence, evidenceHash: sha256(evidence) };
  }).sort((a, b) => b.purchaseIntent - a.purchaseIntent);
}

export function validateCandidateEvidence(candidate) {
  const errors = [];
  if (!candidate?.candidateId) errors.push('candidateId is required.');
  if (!Array.isArray(candidate?.sourceIds) || candidate.sourceIds.length < 2) errors.push('At least two source records are required.');
  if (candidate?.sourceTypeCount < 2) errors.push('At least two source types are required for exact-match readiness.');
  if (candidate?.synthetic !== true) errors.push('Phase 2E candidate evidence must be synthetic.');
  const clean = { ...candidate };
  delete clean.evidenceHash;
  if (candidate?.evidenceHash !== sha256(clean)) errors.push('Candidate evidence hash mismatch.');
  return { ok: errors.length === 0, errors };
}
