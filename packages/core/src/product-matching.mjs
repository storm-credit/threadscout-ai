// Exact product matching.
//
// docs/spec/PRODUCT_MATCHING.md makes four states first-class. Collapsing them to
// exact/unresolved removes the two states that carry the commercially dangerous
// cases: `likely` (most evidence aligns but identity is not settled) and
// `substitute` (a different product that solves the same problem).
//
// Section 4 is also explicit that `exact` needs a strong identity source *plus*
// corroboration. Owner-typed fields backed by a single reference are not that, so
// independence is counted by origin rather than by how many strings were supplied.

export const MATCH_STATES = Object.freeze(['exact', 'likely', 'substitute', 'unresolved']);

export const MATCH_STATE_LABELS_KO = Object.freeze({
  exact: '동일 제품 확인',
  likely: '유력 (동일 단정 불가)',
  substitute: '대체품',
  unresolved: '미확인'
});

/** Identity dimensions that must all align before `exact` is possible. */
export const DECISIVE_DIMENSIONS = Object.freeze(['brand', 'model', 'variant']);

/** Minimum independent origins required to corroborate an exact identity. */
export const REQUIRED_INDEPENDENT_ORIGINS = 2;

/**
 * Count distinct underlying origins, not distinct references.
 *
 * AT-40 / BS-15: several references that reproduce or quote one original count as
 * one piece of evidence. An origin is declared by the owner; two references sharing
 * an origin id are one.
 */
export function countIndependentOrigins(sources = []) {
  return new Set(
    sources
      .map((source) => (source?.originId ?? '').trim())
      .filter(Boolean)
  ).size;
}

/**
 * Decide the match state from evidence alone.
 *
 * @param {object} input
 * @param {object} input.identity              { brand, model, variant }
 * @param {Array}  input.sources               [{ id, originId }]
 * @param {boolean} input.ownerDeclaredSubstitute
 * @param {Array}  input.conflicts             dimensions the owner marked as conflicting
 */
export function decideMatchState({
  identity = {},
  sources = [],
  ownerDeclaredSubstitute = false,
  conflicts = []
} = {}) {
  const reasons = [];

  if (conflicts.length > 0) {
    return {
      matchState: 'unresolved',
      reasons: conflicts.map((dimension) => dimension + ' 근거가 서로 충돌합니다.'),
      independentOrigins: countIndependentOrigins(sources)
    };
  }

  const missing = DECISIVE_DIMENSIONS.filter((dimension) => !String(identity[dimension] ?? '').trim());
  const origins = countIndependentOrigins(sources);

  // A declared substitute is a decision about a different product, so it is settled
  // regardless of how well that other product is identified.
  if (ownerDeclaredSubstitute) {
    if (missing.length > 0) reasons.push('대체품 식별 정보가 비어 있습니다: ' + missing.join(', '));
    return { matchState: 'substitute', reasons, independentOrigins: origins };
  }

  if (missing.length === DECISIVE_DIMENSIONS.length && origins === 0) {
    return {
      matchState: 'unresolved',
      reasons: ['제품 동일성 근거가 없습니다.'],
      independentOrigins: origins
    };
  }

  if (missing.length > 0) reasons.push('확인되지 않은 항목: ' + missing.join(', '));
  if (origins < REQUIRED_INDEPENDENT_ORIGINS) {
    reasons.push('독립된 출처가 ' + origins + '곳뿐이라 교차 확인이 부족합니다.');
  }

  if (missing.length === 0 && origins >= REQUIRED_INDEPENDENT_ORIGINS) {
    return { matchState: 'exact', reasons: [], independentOrigins: origins };
  }
  if (missing.length === DECISIVE_DIMENSIONS.length) {
    return { matchState: 'unresolved', reasons, independentOrigins: origins };
  }
  return { matchState: 'likely', reasons, independentOrigins: origins };
}

/**
 * What the copy is allowed to say about the commercial destination, per state.
 * PRODUCT_MATCHING.md section 5.
 */
export const AFFILIATE_WORDING_RULE = Object.freeze({
  exact: { sameProductClaimAllowed: true, mustLabelAlternative: false, affiliateMappingAllowed: true },
  likely: { sameProductClaimAllowed: false, mustLabelAlternative: false, affiliateMappingAllowed: false },
  substitute: { sameProductClaimAllowed: false, mustLabelAlternative: true, affiliateMappingAllowed: true },
  unresolved: { sameProductClaimAllowed: false, mustLabelAlternative: false, affiliateMappingAllowed: false }
});

export function wordingRuleFor(matchState) {
  return AFFILIATE_WORDING_RULE[matchState] ?? AFFILIATE_WORDING_RULE.unresolved;
}

export const VERIFIER_DECISIONS = Object.freeze(['verified', 'limited', 'hold', 'reject']);

export const VERIFIER_DECISION_LABELS_KO = Object.freeze({
  verified: '검증됨',
  limited: '제한적 사용 가능',
  hold: '보류',
  reject: '거절'
});

/**
 * The Verifier's own conclusion, which is what gates the Strategist
 * (AGENT_HANDOFFS.md H4) — not the readiness label, which is a ranking output.
 */
export function decideVerifierDecision({
  matchState,
  mediaRightsResolved,
  publicFigureBlocked = false,
  conflicts = [],
  unresolvedQuestions = []
}) {
  if (publicFigureBlocked) {
    return { verifierDecision: 'reject', reason: '루머 · 사생활 소재는 제품 트리거로 사용할 수 없습니다.' };
  }
  if (!mediaRightsResolved) {
    return { verifierDecision: 'hold', reason: '최종 콘텐츠의 미디어 권리가 확인되지 않았습니다.' };
  }
  if (conflicts.length > 0) {
    return { verifierDecision: 'hold', reason: '상충하는 근거가 남아 있습니다.' };
  }
  if (matchState === 'unresolved') {
    return { verifierDecision: 'hold', reason: '제품 동일성이 확인되지 않았습니다.' };
  }
  if (matchState === 'exact' && unresolvedQuestions.length === 0) {
    return { verifierDecision: 'verified', reason: null };
  }
  return { verifierDecision: 'limited', reason: '동일 제품으로 단정하지 않는 좁은 표현만 사용할 수 있습니다.' };
}
