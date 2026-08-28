// Candidate ranking and first-screen selection.
//
// docs/spec/RANKING_SCORING_SPEC.md selects Option B: an opportunity score plus
// independent readiness, risk, and freshness. They are allowed to disagree — a
// candidate can score 94 and still be blocked, and that is the design rather than an
// inconsistency to smooth over.
//
// Section 11 is equally explicit that the top five are not simply the five highest
// scores, and AT-29 requires every inclusion and exclusion to expose a reason.

export const EVIDENCE_READINESS = Object.freeze(['ready', 'partial', 'weak', 'blocked']);
export const RISK_LEVELS = Object.freeze(['low', 'review', 'high', 'blocked']);
export const FRESHNESS_STATES = Object.freeze(['fresh', 'aging', 'stale']);

/** Approved v1 defaults: P1-03, P1-04, P1-06. */
export const FIRST_SCREEN_LIMIT = 5;
export const REVIEW_SCORE_FLOOR = 65;
export const LISTING_IDENTITY_TTL_HOURS = 24;

const SCORE_CAPS = Object.freeze({
  readerValue: 20,
  demonstrability: 15,
  purchaseIntent: 20,
  attentionAcceleration: 15,
  audienceFit: 10,
  novelty: 10,
  commercialPracticality: 10
});

const DEDUCTION_CAPS = Object.freeze({
  saturation: 20,
  curiosityOnly: 15,
  unstableAvailability: 10,
  repetitiveCoverage: 20,
  weakDemonstration: 10,
  commercialMismatch: 15
});

function clamp(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Opportunity score, 0-100. Ranking only; it never unlocks a gate. */
export function scoreOpportunity({ signals = {}, deductions = {} } = {}) {
  const breakdown = {};
  let total = 0;
  for (const [key, cap] of Object.entries(SCORE_CAPS)) {
    breakdown[key] = clamp(signals[key], 0, cap);
    total += breakdown[key];
  }

  const penalties = {};
  let penaltyTotal = 0;
  for (const [key, cap] of Object.entries(DEDUCTION_CAPS)) {
    penalties[key] = clamp(deductions[key], 0, cap);
    penaltyTotal += penalties[key];
  }

  return { score: Math.max(0, Math.round(total - penaltyTotal)), breakdown, penalties };
}

/**
 * Score an owner-supplied candidate from what the owner can actually judge.
 *
 * Attention acceleration stays at zero because nobody has measured it — Scout is
 * skipped for a manually entered product. Inventing that signal would be fabricating
 * evidence, so an owner-entered candidate correctly tops out below a discovered one.
 */
export function scoreOwnerSuppliedCandidate({ whyNow = '', readerValue = '', identityComplete = false, hasSourceRef = false, laneIsCuriosityOnly = false } = {}) {
  const substance = (text) => clamp(text.trim().length / 60, 0, 1);

  const scored = scoreOpportunity({
    signals: {
      readerValue: substance(readerValue) * SCORE_CAPS.readerValue,
      demonstrability: substance(whyNow) * SCORE_CAPS.demonstrability,
      purchaseIntent: identityComplete ? SCORE_CAPS.purchaseIntent : SCORE_CAPS.purchaseIntent * 0.4,
      attentionAcceleration: 0,
      audienceFit: substance(readerValue) * SCORE_CAPS.audienceFit,
      novelty: substance(whyNow) * SCORE_CAPS.novelty,
      commercialPracticality: hasSourceRef ? SCORE_CAPS.commercialPracticality : 0
    },
    deductions: { curiosityOnly: laneIsCuriosityOnly ? DEDUCTION_CAPS.curiosityOnly : 0 }
  });

  return scored;
}

/**
 * Evidence readiness, derived from the evidence packet only — never from the score
 * and never from how many agents agreed (AT-41).
 */
export function evaluateEvidenceReadiness({ verifierDecision, matchState, mediaRightsResolved, conflicts = [], unresolvedQuestions = [] } = {}) {
  if (!verifierDecision) return { state: 'weak', reasons: ['아직 검증되지 않았습니다.'] };
  if (verifierDecision === 'reject') return { state: 'blocked', reasons: ['검증 결과가 거절 상태입니다.'] };
  if (!mediaRightsResolved) return { state: 'blocked', reasons: ['게시 권리가 확인되지 않은 미디어가 있습니다.'] };

  const reasons = [];
  if (matchState === 'unresolved') reasons.push('제품 동일성이 확인되지 않았습니다.');
  if (matchState === 'likely') reasons.push('제품 동일성이 유력 단계에 머물러 있습니다.');
  if (matchState === 'substitute') reasons.push('대체품으로만 연결할 수 있습니다.');
  if (conflicts.length > 0) reasons.push('상충하는 근거가 남아 있습니다.');
  reasons.push(...unresolvedQuestions);

  if (verifierDecision === 'hold' || matchState === 'unresolved') return { state: 'weak', reasons };
  if (verifierDecision === 'limited' || reasons.length > 0) return { state: 'partial', reasons };
  return { state: 'ready', reasons: [] };
}

export function evaluateRisk({ matchState, mediaRightsResolved, publicFigureRelation = null, conflicts = [] } = {}) {
  if (publicFigureRelation?.classification === 'blocked_rumor_private') {
    return { level: 'blocked', reasons: ['루머 · 사생활 소재입니다.'] };
  }
  if (!mediaRightsResolved) return { level: 'blocked', reasons: ['미디어 사용권이 미확인입니다.'] };

  // Only factors that make publication riskier count. A standing prohibition such as
  // "no first-hand wording without a usage record" applies to every candidate, so
  // counting it here would make every candidate permanently `review`.
  const reasons = [];
  if (publicFigureRelation) reasons.push('공인 · 공개 행사 맥락이 포함되어 문구 검토가 필요합니다.');
  if (conflicts.length > 0) reasons.push('근거 충돌이 남아 있습니다.');
  if (matchState === 'substitute') reasons.push('대체품이므로 동일 제품 표현을 쓸 수 없습니다.');
  if (matchState === 'likely') reasons.push('동일성이 확정되지 않아 표현 범위가 좁습니다.');

  if (reasons.length >= 2) return { level: 'high', reasons };
  if (reasons.length === 1) return { level: 'review', reasons };
  return { level: 'low', reasons: [] };
}

/**
 * Freshness of the listing identity evidence.
 * P1-06: revalidate within 24 hours of scheduled publication. With publishing
 * disabled this is advisory, but a stale timestamp must still be visible rather than
 * silently reused as current truth.
 */
export function evaluateFreshness({ observedAt, now }) {
  if (!observedAt) return { state: 'stale', reasons: ['확인 시각이 없습니다.'] };
  const ageMs = Date.parse(now) - Date.parse(observedAt);
  if (!Number.isFinite(ageMs)) return { state: 'stale', reasons: ['확인 시각을 해석할 수 없습니다.'] };

  const ageHours = ageMs / 3_600_000;
  if (ageHours > LISTING_IDENTITY_TTL_HOURS) {
    return { state: 'stale', reasons: ['제품 확인 근거가 ' + LISTING_IDENTITY_TTL_HOURS + '시간 기준을 넘겼습니다.'] };
  }
  if (ageHours > LISTING_IDENTITY_TTL_HOURS * 0.75) {
    return { state: 'aging', reasons: ['제품 확인 근거가 곧 만료됩니다.'] };
  }
  return { state: 'fresh', reasons: [] };
}

/**
 * First-screen selection.
 *
 * AT-28: fewer than five, or none at all, is a valid successful outcome.
 * AT-29: the five cannot be derived from score alone, and every decision states why.
 */
export function selectFirstScreen(candidates = [], { limit = FIRST_SCREEN_LIMIT, scoreFloor = REVIEW_SCORE_FLOOR } = {}) {
  const selected = [];
  const excluded = [];
  const laneCounts = new Map();

  const ordered = [...candidates].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));

  // Lane concentration is a diversity guardrail, so it only bites when there is
  // diversity available to promote. The account's main lane is ~60% of the intended
  // portfolio; capping it while nothing else is waiting would leave the inbox short
  // for no benefit, which is the opposite of the guardrail's purpose.
  const laneVariety = new Set(ordered.map((candidate) => candidate.lane ?? 'unknown')).size;
  const enforceLaneCaps = laneVariety > 1;

  for (const candidate of ordered) {
    const exclude = (reason, detail) => excluded.push({ candidateId: candidate.id, reason, detail });

    if (candidate.riskLevel === 'blocked') {
      exclude('risk_blocked', '위험도가 차단 상태입니다.');
      continue;
    }
    if (['rejected', 'held'].includes(candidate.workflowState)) {
      exclude('owner_decision', '사용자가 보류하거나 거절한 후보입니다.');
      continue;
    }
    // AT-14 / PR-14. Owner suppression is a guarantee, not a ranking weight, so it is a
    // hard exclusion rather than a score deduction — a deduction can be outweighed by a
    // high enough opportunity score, which is exactly what "honor the suppression until
    // the user reverses it" forbids. It is checked here, above the review floor, so it
    // applies to owner-supplied candidates too; that is what the comment below promises.
    //
    // Distinct from `suppressed_duplicate`, which is a dedupe outcome carrying its own
    // state and reason code. The two must stay separable (PRE_IMPLEMENTATION_TRAPS).
    if (candidate.suppression?.active === true) {
      exclude('owner_suppressed', candidate.suppression.label ?? '사용자가 억제한 후보입니다.');
      continue;
    }
    // The review floor exists to stop weak *discovered* candidates from filling the
    // inbox. A product the owner typed in was already chosen deliberately, so
    // scoring it out of its own inbox would hide the thing they just asked to work
    // on. Owner-supplied candidates are always eligible; risk and suppression still
    // apply to them.
    const ownerChosen = candidate.sourceMode === 'owner_supplied';
    if (!ownerChosen && (candidate.opportunityScore ?? 0) < scoreFloor) {
      exclude('below_review_floor', '검토 기준 ' + scoreFloor + '점 미만입니다.');
      continue;
    }
    if (selected.length >= limit) {
      exclude('beyond_first_screen', '첫 화면 ' + limit + '개 상한을 넘었습니다.');
      continue;
    }

    const lane = candidate.lane ?? 'unknown';
    const laneCount = laneCounts.get(lane) ?? 0;
    if (enforceLaneCaps && lane === 'curiosity-only' && laneCount >= 1) {
      exclude('lane_cap', '호기심 전용 후보는 하루 1개로 제한합니다.');
      continue;
    }
    if (enforceLaneCaps && laneCount >= 3) {
      exclude('lane_concentration', '같은 레인이 과도하게 몰렸습니다.');
      continue;
    }

    laneCounts.set(lane, laneCount + 1);
    selected.push(candidate);
  }

  return {
    selected,
    excluded,
    emptyReason: selected.length === 0 ? '오늘 추천 없음' : null
  };
}
