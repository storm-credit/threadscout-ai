// Candidate ranking from docs/spec/RANKING_SCORING_SPEC.md.
//
// The whole point of this module is that it produces four values that are allowed
// to disagree. A candidate can score 94 and still be blocked; that is the design,
// not an inconsistency to smooth over (Decision Log 2026-08-12).

import { hoursBetween } from './clock.mjs';
import { PUBLISHABLE_MEDIA_STATES } from './artifacts.mjs';

export const EVIDENCE_READINESS = Object.freeze(['ready', 'partial', 'weak', 'blocked']);
export const RISK_LEVELS = Object.freeze(['low', 'review', 'high', 'blocked']);
export const FRESHNESS_STATES = Object.freeze(['fresh', 'aging', 'stale']);

export const CONTENT_LANES = Object.freeze([
  'practical_novel',
  'family_household',
  'travel_desk_storage',
  'curiosity_only',
  'issue_triggered'
]);

export const CONTENT_LANE_LABELS_KO = Object.freeze({
  practical_novel: '실용 신박템',
  family_household: '가족 · 초등 살림',
  travel_desk_storage: '여행 · 데스크 · 수납',
  curiosity_only: '호기심 전용',
  issue_triggered: '이슈 기반'
});

/** Approved v1 defaults (P1-04, P1-05, P1-07, P1-08). */
export const REVIEW_SCORE_FLOOR = 65;
export const FRESHNESS_TTL_HOURS = Object.freeze({
  price_stock: 4,
  issue_linked: 12,
  attention_signal: 6,
  listing_identity: 24
});

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

/**
 * Opportunity score, 0-100. Ranking only. It never unlocks a gate.
 */
export function scoreOpportunity({ signals = {}, deductions = {} } = {}) {
  const breakdown = {};
  let total = 0;
  for (const [key, cap] of Object.entries(SCORE_CAPS)) {
    const value = clamp(signals[key], 0, cap);
    breakdown[key] = value;
    total += value;
  }

  const penalties = {};
  let penaltyTotal = 0;
  for (const [key, cap] of Object.entries(DEDUCTION_CAPS)) {
    const value = clamp(deductions[key], 0, cap);
    penalties[key] = value;
    penaltyTotal += value;
  }

  return {
    score: Math.max(0, Math.round(total - penaltyTotal)),
    breakdown,
    penalties
  };
}

/**
 * Evidence readiness, derived from the evidence packet only.
 * Never from the score, and never from how many agents agreed (AT-41).
 */
export function evaluateEvidenceReadiness(evidencePacket) {
  if (!evidencePacket) return { state: 'weak', reasons: ['아직 검증되지 않았습니다.'] };

  const reasons = [];
  const decision = evidencePacket.verifierDecision;
  const match = evidencePacket.matchState;

  if (decision === 'reject') {
    return { state: 'blocked', reasons: ['검증 결과가 거절 상태입니다.'] };
  }
  const relation = evidencePacket.publicFigureRelation;
  if (relation?.classification === 'blocked_rumor_private') {
    return { state: 'blocked', reasons: ['루머 · 사생활 기반 트리거는 차단됩니다.'] };
  }
  const unknownRights = (evidencePacket.mediaRights ?? []).filter(
    (media) => !PUBLISHABLE_MEDIA_STATES.includes(media.publishRightsState) && media.publishRightsState !== 'analysis_only'
  );
  if (unknownRights.length > 0) {
    return { state: 'blocked', reasons: ['게시 권리가 확인되지 않은 미디어가 있습니다.'] };
  }

  if (decision === 'hold') reasons.push('검증이 보류 상태입니다.');
  if (match === 'unresolved') reasons.push('제품 동일성이 확인되지 않았습니다.');
  if (match === 'likely') reasons.push('제품 동일성이 유력 단계에 머물러 있습니다.');
  if (match === 'substitute') reasons.push('대체품으로만 연결할 수 있습니다.');
  if ((evidencePacket.conflicts ?? []).length > 0) reasons.push('상충하는 근거가 남아 있습니다.');
  if ((evidencePacket.unresolvedQuestions ?? []).length > 0) reasons.push('미해결 질문이 남아 있습니다.');
  if ((evidencePacket.verifiedClaims ?? []).length === 0) reasons.push('검증된 주장이 없습니다.');

  if (decision === 'hold' || match === 'unresolved') return { state: 'weak', reasons };
  if (decision === 'limited' || reasons.length > 0) return { state: 'partial', reasons };
  return { state: 'ready', reasons: [] };
}

export function evaluateRisk(evidencePacket) {
  if (!evidencePacket) return { level: 'review', reasons: ['검증 전에는 위험도를 확정할 수 없습니다.'] };

  const reasons = [];
  const relation = evidencePacket.publicFigureRelation;

  if (relation?.classification === 'blocked_rumor_private') {
    return { level: 'blocked', reasons: ['루머 · 사생활 소재입니다.'] };
  }
  const unknownRights = (evidencePacket.mediaRights ?? []).some(
    (media) => media.publishRightsState === 'unknown'
  );
  if (unknownRights) return { level: 'blocked', reasons: ['미디어 사용권이 미확인입니다.'] };

  // Only factors that make publication itself riskier count here.
  //
  // A prohibited-claim list is not one of them: every candidate has one, because
  // "no first-hand wording without a usage record" is a standing rule rather than a
  // property of this product. Treating it as risk would make every candidate
  // permanently `review` and drain the label of meaning.
  if (relation) reasons.push('공인 · 공개 행사 맥락이 포함되어 문구 검토가 필요합니다.');
  if ((evidencePacket.conflicts ?? []).length > 0) reasons.push('근거 충돌이 남아 있습니다.');
  if (evidencePacket.matchState === 'substitute') reasons.push('대체품이므로 동일 제품 표현을 쓸 수 없습니다.');
  if ((evidencePacket.mediaRights ?? []).some((media) => media.publishRightsState === 'analysis_only')) {
    reasons.push('분석 전용 미디어가 포함되어 게시물에는 사용할 수 없습니다.');
  }

  if (reasons.length >= 2) return { level: 'high', reasons };
  if (reasons.length === 1) return { level: 'review', reasons };
  return { level: 'low', reasons: [] };
}

/**
 * Freshness per evidence class, not one universal timestamp
 * (RANKING_SCORING_SPEC.md section 8).
 */
export function evaluateFreshness(evidencePacket, now) {
  if (!evidencePacket) return { state: 'stale', classes: {}, reasons: ['검증 시각이 없습니다.'] };

  const classes = {};
  const reasons = [];
  const observed = {
    price_stock: evidencePacket.commerceSnapshot?.priceStatus === 'observed'
      ? evidencePacket.commerceSnapshot?.observedAt
      : null,
    listing_identity: evidencePacket.commerceSnapshot?.observedAt ?? null,
    issue_linked: evidencePacket.publicFigureRelation ? evidencePacket.freshness?.evaluatedAt ?? null : null,
    attention_signal: evidencePacket.freshness?.evaluatedAt ?? null
  };

  let worst = 'fresh';
  for (const [key, at] of Object.entries(observed)) {
    if (!at) {
      classes[key] = 'not_applicable';
      continue;
    }
    const ttl = FRESHNESS_TTL_HOURS[key];
    const age = hoursBetween(at, now);
    if (age === null) {
      classes[key] = 'stale';
      worst = 'stale';
      reasons.push(key + ' 관측 시각을 해석할 수 없습니다.');
      continue;
    }
    if (age > ttl) {
      classes[key] = 'stale';
      worst = 'stale';
      reasons.push(key + ' 근거가 ' + ttl + '시간 기준을 넘겼습니다.');
    } else if (age > ttl * 0.75) {
      classes[key] = 'aging';
      if (worst === 'fresh') worst = 'aging';
      reasons.push(key + ' 근거가 곧 만료됩니다.');
    } else {
      classes[key] = 'fresh';
    }
  }

  return { state: worst, classes, reasons };
}

/**
 * The single most important thing to fix, chosen so the card can show one line
 * instead of burying the reviewer in warnings (BS-38, AT-42).
 */
export function dominantBlocker({ readiness, risk, freshness, guardianDecision, approvalState }) {
  if (risk?.level === 'blocked') return { severity: 'blocker', text: risk.reasons[0] ?? '위험도 차단' };
  if (readiness?.state === 'blocked') return { severity: 'blocker', text: readiness.reasons[0] ?? '근거 차단' };
  if (guardianDecision === 'block') return { severity: 'blocker', text: 'Guardian이 차단했습니다.' };
  if (approvalState === 'stale') return { severity: 'required', text: '상위 자료가 바뀌어 재검토가 필요합니다.' };
  if (guardianDecision === 'revise') return { severity: 'required', text: 'Guardian 수정 요청이 있습니다.' };
  if (freshness?.state === 'stale') return { severity: 'required', text: freshness.reasons[0] ?? '근거가 오래되었습니다.' };
  if (readiness?.state === 'weak') return { severity: 'required', text: readiness.reasons[0] ?? '근거가 부족합니다.' };
  if (readiness?.state === 'partial') return { severity: 'warning', text: readiness.reasons[0] ?? '근거가 일부만 확인되었습니다.' };
  if (risk?.level === 'high' || risk?.level === 'review') {
    return { severity: 'warning', text: risk.reasons[0] ?? '표현 검토가 필요합니다.' };
  }
  if (freshness?.state === 'aging') return { severity: 'info', text: freshness.reasons[0] ?? '근거가 곧 만료됩니다.' };
  return null;
}

/**
 * Portfolio selection for the first screen.
 *
 * AT-29: the final five cannot be derivable from score alone, and every inclusion
 * or exclusion must expose a reason.
 */
export function selectInboxCandidates(candidates = [], { limit = 5, scoreFloor = REVIEW_SCORE_FLOOR } = {}) {
  const selected = [];
  const excluded = [];
  const laneCounts = new Map();

  const ordered = [...candidates].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));

  for (const candidate of ordered) {
    if (candidate.suppressed) {
      excluded.push({ candidateId: candidate.candidateId, reason: 'suppressed', detail: '사용자가 억제한 후보입니다.' });
      continue;
    }
    if (candidate.riskLevel === 'blocked') {
      excluded.push({ candidateId: candidate.candidateId, reason: 'risk_blocked', detail: '위험도가 차단 상태입니다.' });
      continue;
    }
    if ((candidate.opportunityScore ?? 0) < scoreFloor) {
      excluded.push({
        candidateId: candidate.candidateId,
        reason: 'below_review_floor',
        detail: '검토 기준 ' + scoreFloor + '점 미만입니다.'
      });
      continue;
    }
    if (selected.length >= limit) {
      excluded.push({ candidateId: candidate.candidateId, reason: 'beyond_first_screen', detail: '첫 화면 5개 상한을 넘었습니다.' });
      continue;
    }

    const lane = candidate.contentLane;
    const laneCount = laneCounts.get(lane) ?? 0;
    if (lane === 'curiosity_only' && laneCount >= 1) {
      excluded.push({ candidateId: candidate.candidateId, reason: 'lane_cap', detail: '호기심 전용 후보는 하루 1개로 제한합니다.' });
      continue;
    }
    if (laneCount >= 3) {
      excluded.push({ candidateId: candidate.candidateId, reason: 'lane_concentration', detail: '같은 레인이 과도하게 몰렸습니다.' });
      continue;
    }

    laneCounts.set(lane, laneCount + 1);
    selected.push(candidate);
  }

  return { selected, excluded, emptyReason: selected.length === 0 ? '오늘 추천 없음' : null };
}
