// Candidate read model and CTA derivation.
//
// docs/spec/UI_STATE_ACTION_MATRIX.md is the authority for which action is offered
// in which state. The rule that shapes this file: a disabled CTA always carries a
// visible reason, and a high score never turns a blocked CTA into an enabled one.
//
// This runs on the server. The client renders what it is given and cannot compute
// its own state (APPLICATION_INTERFACE_SPEC.md "Command rule").

import { PUBLISHABLE_MEDIA_STATES } from './artifacts.mjs';
import { CONTENT_LANE_LABELS_KO, dominantBlocker, evaluateEvidenceReadiness, evaluateFreshness, evaluateRisk } from './ranking.mjs';
import { evaluateApprovalState } from './approval.mjs';

export const CTA_ACTIONS = Object.freeze({
  VERIFY: 'verify_evidence',
  CREATE_STRATEGIES: 'create_strategies',
  REVIEW_DRAFTS: 'review_drafts',
  REVIEW_APPROVAL: 'review_approval',
  SHOW_REVISIONS: 'show_revisions',
  SHOW_BLOCK_REASON: 'show_block_reason',
  RECHECK: 'recheck',
  RESTORE: 'restore'
});

const CTA_LABELS_KO = Object.freeze({
  [CTA_ACTIONS.VERIFY]: '근거 확인',
  [CTA_ACTIONS.CREATE_STRATEGIES]: '전략 4개 만들기',
  [CTA_ACTIONS.REVIEW_DRAFTS]: '초안 검토',
  [CTA_ACTIONS.REVIEW_APPROVAL]: '승인 검토',
  [CTA_ACTIONS.SHOW_REVISIONS]: '수정사항 보기',
  [CTA_ACTIONS.SHOW_BLOCK_REASON]: '차단 이유 보기',
  [CTA_ACTIONS.RECHECK]: '다시 확인',
  [CTA_ACTIONS.RESTORE]: '복원'
});

export const MATCH_STATE_LABELS_KO = Object.freeze({
  exact: '동일 제품 확인',
  likely: '유력 (동일 단정 불가)',
  substitute: '대체품',
  unresolved: '미확인',
  none: '검증 전'
});

export const MEDIA_STATE_LABELS_KO = Object.freeze({
  owner_supplied: '본인 보유',
  licensed: '사용 허가 확인',
  link_or_embed_only: '링크 · 임베드만',
  analysis_only: '분석 전용 (게시 불가)',
  unknown: '권리 미확인',
  none: '미디어 없음'
});

const READINESS_LABELS_KO = Object.freeze({
  ready: '충분',
  partial: '일부',
  weak: '부족',
  blocked: '차단'
});

const RISK_LABELS_KO = Object.freeze({
  low: '낮음',
  review: '검토 필요',
  high: '높음',
  blocked: '차단'
});

const FRESHNESS_LABELS_KO = Object.freeze({
  fresh: '최신',
  aging: '만료 임박',
  stale: '기한 초과'
});

/** The overall media publication state for the candidate, worst-case first. */
function summarizeMediaState(mediaRights = []) {
  if (mediaRights.length === 0) return 'none';
  if (mediaRights.some((media) => media.publishRightsState === 'unknown')) return 'unknown';
  if (mediaRights.some((media) => media.publishRightsState === 'analysis_only')) return 'analysis_only';
  const publishable = mediaRights.find((media) => PUBLISHABLE_MEDIA_STATES.includes(media.publishRightsState));
  return publishable ? publishable.publishRightsState : 'unknown';
}

/**
 * Decide the single primary CTA.
 *
 * Order matters: suppression, then blocking states, then staleness, then forward
 * progress. Checking forward progress first is exactly how a blocker ends up
 * hidden behind a tempting enabled button.
 */
function deriveCta({ suppressed, readiness, risk, approvalState, review, draftBundle, contentBrief, evidencePacket }) {
  if (suppressed) {
    return { action: CTA_ACTIONS.RESTORE, enabled: true, reason: null };
  }
  if (risk.level === 'blocked' || readiness.state === 'blocked') {
    return {
      action: CTA_ACTIONS.SHOW_BLOCK_REASON,
      enabled: true,
      progressionEnabled: false,
      reason: risk.reasons[0] ?? readiness.reasons[0] ?? '차단 상태입니다.'
    };
  }
  if (review?.decision === 'block') {
    return {
      action: CTA_ACTIONS.SHOW_BLOCK_REASON,
      enabled: true,
      progressionEnabled: false,
      reason: review.nonOverridableBlockers?.[0] ?? 'Guardian이 차단했습니다.'
    };
  }
  if (approvalState === 'stale') {
    return { action: CTA_ACTIONS.RECHECK, enabled: true, reason: '승인 이후 상위 자료가 변경되었습니다.' };
  }
  if (review?.decision === 'revise') {
    return { action: CTA_ACTIONS.SHOW_REVISIONS, enabled: true, reason: 'Guardian 수정 요청이 있습니다.' };
  }
  if (review?.decision === 'pass') {
    return { action: CTA_ACTIONS.REVIEW_APPROVAL, enabled: true, reason: null };
  }
  if (draftBundle) {
    return { action: CTA_ACTIONS.REVIEW_DRAFTS, enabled: true, reason: null };
  }
  if (contentBrief) {
    return { action: CTA_ACTIONS.REVIEW_DRAFTS, enabled: true, reason: null };
  }
  // `partial` still allows strategy, with narrower wording and no exact-product or
  // affiliate claim (RANKING_SCORING_SPEC.md section 6). Only `weak` and `blocked`
  // hold the run at verification. The server enforces the same boundary, so the
  // card never offers an action the API would refuse.
  if (!evidencePacket || ['weak', 'blocked'].includes(readiness.state)) {
    return {
      action: CTA_ACTIONS.VERIFY,
      enabled: true,
      reason: readiness.reasons[0] ?? '아직 검증되지 않았습니다.'
    };
  }
  return { action: CTA_ACTIONS.CREATE_STRATEGIES, enabled: true, reason: null };
}

/**
 * Build everything the inbox card and the detail screen need, from server state.
 */
export function deriveCandidateView(record, now) {
  const {
    candidate,
    evidencePacket = null,
    contentBrief = null,
    draftBundle = null,
    reviewReport = null,
    approval = null,
    currentBinding = null
  } = record;

  const readiness = evaluateEvidenceReadiness(evidencePacket);
  const risk = evaluateRisk(evidencePacket);
  const freshness = evaluateFreshness(evidencePacket, now);
  const approvalEvaluation = evaluateApprovalState(approval, currentBinding ?? {});

  const cta = deriveCta({
    suppressed: candidate.suppressed === true,
    readiness,
    risk,
    approvalState: approvalEvaluation.state,
    review: reviewReport,
    draftBundle,
    contentBrief,
    evidencePacket
  });

  const blocker = dominantBlocker({
    readiness,
    risk,
    freshness,
    guardianDecision: reviewReport?.decision ?? null,
    approvalState: approvalEvaluation.state
  });

  const matchState = evidencePacket?.matchState ?? 'none';
  const mediaState = summarizeMediaState(evidencePacket?.mediaRights ?? []);

  // Strategy generation is gated by evidence, never by the score (AT-25).
  // The reason travels with the flag so the UI never has to guess at one.
  const strategyEnabled =
    ['ready', 'partial'].includes(readiness.state) && risk.level !== 'blocked' && !candidate.suppressed;
  const strategyDisabledReason = strategyEnabled
    ? null
    : (readiness.reasons[0] ?? risk.reasons[0] ?? '근거 확인이 먼저 필요합니다.');

  return {
    candidateId: candidate.candidateId,
    name: candidate.name,
    contentLane: candidate.contentLane,
    contentLaneLabel: CONTENT_LANE_LABELS_KO[candidate.contentLane] ?? candidate.contentLane,
    whyNow: candidate.whyNow,
    readerValue: candidate.readerValue,
    opportunityScore: candidate.opportunityScore,
    suppressed: candidate.suppressed === true,

    evidenceReadiness: readiness.state,
    evidenceReadinessLabel: READINESS_LABELS_KO[readiness.state],
    evidenceReasons: readiness.reasons,

    riskLevel: risk.level,
    riskLabel: RISK_LABELS_KO[risk.level],
    riskReasons: risk.reasons,

    freshnessState: freshness.state,
    freshnessLabel: FRESHNESS_LABELS_KO[freshness.state] ?? freshness.state,
    freshnessReasons: freshness.reasons,

    matchState,
    matchStateLabel: MATCH_STATE_LABELS_KO[matchState],
    mediaState,
    mediaStateLabel: MEDIA_STATE_LABELS_KO[mediaState],

    guardianDecision: reviewReport?.decision ?? null,
    approvalState: approvalEvaluation.state,
    approvalChanged: approvalEvaluation.changed,

    dominantBlocker: blocker,
    cta: { ...cta, label: CTA_LABELS_KO[cta.action] },
    strategyEnabled,
    strategyDisabledReason,

    stage: candidate.stage,
    status: candidate.status,
    version: candidate.version
  };
}

export { CTA_LABELS_KO };
