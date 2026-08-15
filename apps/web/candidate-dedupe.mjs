export const DUPLICATE_STATES = Object.freeze({
  UNIQUE: 'unique',
  POSSIBLE: 'possible_duplicate',
  CONFIRMED_DISTINCT: 'confirmed_distinct',
  CONFIRMED_DUPLICATE: 'confirmed_duplicate',
  EXACT_SUPPRESSED: 'exact_duplicate_suppressed'
});

const POSSIBLE_DUPLICATE_THRESHOLD = 0.8;

export function normalizeDedupeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compact(value) {
  return normalizeDedupeText(value).replace(/\s+/g, '');
}

function tokenSet(value) {
  return new Set(normalizeDedupeText(value).split(' ').filter(Boolean));
}

export function tokenJaccardSimilarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function normalizedDimension(candidate, key) {
  return compact(candidate?.[key]);
}

export function candidateIdentitySignature(candidate) {
  return ['name', 'brand', 'model', 'variant']
    .map((key) => normalizedDimension(candidate, key))
    .join('|');
}

export function exactIdentityKey(candidate) {
  const brand = normalizedDimension(candidate, 'brand');
  const model = normalizedDimension(candidate, 'model');
  const variant = normalizedDimension(candidate, 'variant');
  if (!brand || !model || !variant) return null;
  return `${brand}|${model}|${variant}`;
}

function hasKnownIdentityConflict(left, right) {
  return ['brand', 'model', 'variant'].some((key) => {
    const a = normalizedDimension(left, key);
    const b = normalizedDimension(right, key);
    return Boolean(a && b && a !== b);
  });
}

function eligibleTarget(candidate) {
  if (!candidate || candidate.synthetic) return false;
  return !['rejected', 'suppressed_duplicate'].includes(candidate.workflowState);
}

function targetSummary(candidate) {
  return {
    candidateId: candidate.id,
    name: candidate.name,
    brand: candidate.brand,
    model: candidate.model,
    variant: candidate.variant,
    workflowState: candidate.workflowState
  };
}

function possibleSimilarity(candidate, target) {
  if (hasKnownIdentityConflict(candidate, target)) return null;
  const candidateName = compact(candidate.name);
  const targetName = compact(target.name);
  if (!candidateName || !targetName) return null;

  if (candidateName === targetName) {
    return { similarity: 1, reasons: ['normalized_name_match'] };
  }

  const candidateTokens = tokenSet(candidate.name);
  const targetTokens = tokenSet(target.name);
  const unionSize = new Set([...candidateTokens, ...targetTokens]).size;
  if (unionSize < 3) return null;
  const similarity = tokenJaccardSimilarity(candidate.name, target.name);
  if (similarity < POSSIBLE_DUPLICATE_THRESHOLD) return null;
  return { similarity, reasons: ['high_name_token_overlap'] };
}

export function uniqueDuplicateAssessment(checkedAt = null, candidate = null) {
  return {
    state: DUPLICATE_STATES.UNIQUE,
    matchedCandidate: null,
    similarity: 0,
    reasons: [],
    checkedAt,
    resolvedAt: null,
    candidateIdentitySignature: candidate ? candidateIdentitySignature(candidate) : null,
    resolvedIdentitySignature: null
  };
}

export function assessCandidateDuplicate(candidate, existingCandidates, { checkedAt = null } = {}) {
  const targets = (existingCandidates ?? []).filter((target) => target.id !== candidate.id && eligibleTarget(target));
  const identity = exactIdentityKey(candidate);
  const signature = candidateIdentitySignature(candidate);

  if (identity) {
    const exact = targets.find((target) => exactIdentityKey(target) === identity);
    if (exact) {
      return {
        state: DUPLICATE_STATES.EXACT_SUPPRESSED,
        matchedCandidate: targetSummary(exact),
        similarity: 1,
        reasons: ['brand_model_variant_match'],
        checkedAt,
        resolvedAt: checkedAt,
        candidateIdentitySignature: signature,
        resolvedIdentitySignature: signature
      };
    }
  }

  let best = null;
  for (const target of targets) {
    const possible = possibleSimilarity(candidate, target);
    if (!possible) continue;
    if (!best || possible.similarity > best.similarity) {
      best = { ...possible, target };
    }
  }

  if (!best) return uniqueDuplicateAssessment(checkedAt, candidate);
  return {
    state: DUPLICATE_STATES.POSSIBLE,
    matchedCandidate: targetSummary(best.target),
    similarity: Number(best.similarity.toFixed(3)),
    reasons: best.reasons,
    checkedAt,
    resolvedAt: null,
    candidateIdentitySignature: signature,
    resolvedIdentitySignature: null
  };
}

export function isDuplicateReviewBlocking(candidate) {
  return candidate?.duplicateAssessment?.state === DUPLICATE_STATES.POSSIBLE;
}
