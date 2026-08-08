export const CANDIDATE_STATES = Object.freeze({
  DISCOVERED: 'discovered',
  DRAFTED: 'drafted',
  HELD: 'held',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  APPROVED: 'approved',
  QUEUED: 'queued'
});

const ALLOWED_TRANSITIONS = Object.freeze({
  discovered: new Set(['drafted', 'held', 'rejected', 'blocked']),
  drafted: new Set(['held', 'rejected', 'blocked', 'approved']),
  held: new Set(['drafted', 'rejected', 'blocked', 'approved']),
  rejected: new Set(['drafted', 'blocked', 'approved']),
  blocked: new Set([]),
  approved: new Set(['queued', 'held', 'rejected', 'blocked']),
  queued: new Set(['held', 'rejected', 'blocked'])
});

export const DEFAULT_DISCLOSURE =
  '이 포스팅은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.';

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function scoreCandidate(signals = {}) {
  const score =
    clamp(signals.attention ?? 0, 0, 20) +
    clamp(signals.purchaseIntent ?? 0, 0, 25) +
    clamp(signals.visualPotential ?? 0, 0, 15) +
    clamp(signals.audienceFit ?? 0, 0, 15) +
    clamp(signals.availability ?? 0, 0, 10) +
    clamp(signals.commercialValue ?? 0, 0, 10) +
    clamp(signals.creatorReadiness ?? 0, 0, 5) -
    clamp(signals.riskPenalty ?? 0, 0, 100);

  return clamp(Math.round(score));
}

export function getApprovalBlockers(candidate, draftText = '') {
  const blockers = [];

  if (candidate.exactMatchStatus !== 'exact') {
    blockers.push('정확한 제품 일치 여부가 확인되지 않았습니다.');
  }

  if (!['owned', 'licensed', 'not_required'].includes(candidate.mediaRights)) {
    blockers.push('사용할 이미지·영상의 권리가 확인되지 않았습니다.');
  }

  if (candidate.affiliate && !candidate.disclosure?.trim()) {
    blockers.push('제휴 고지 문구가 비어 있습니다.');
  }

  if (candidate.riskLevel === 'blocked') {
    blockers.push('차단 위험이 해소되지 않았습니다.');
  }

  const firstHandPattern = /(직접\s*(써|사용|먹|사)|써봤|먹어봤|사용해봤|재구매)/i;
  if (firstHandPattern.test(draftText) && candidate.personalUse !== 'confirmed') {
    blockers.push('직접 사용이 확인되지 않아 체험형 표현을 사용할 수 없습니다.');
  }

  return blockers;
}

export function canApprove(candidate, draftText = '') {
  const blockers = getApprovalBlockers(candidate, draftText);
  return { ok: blockers.length === 0, blockers };
}

export function transitionCandidate(candidate, nextState) {
  const current = candidate.state ?? CANDIDATE_STATES.DISCOVERED;
  const allowed = ALLOWED_TRANSITIONS[current];

  if (!allowed?.has(nextState)) {
    throw new Error(`Invalid candidate transition: ${current} -> ${nextState}`);
  }

  return {
    ...candidate,
    state: nextState,
    updatedAt: new Date().toISOString()
  };
}

export function generateDrafts(candidate) {
  const name = candidate.name;
  const reason = candidate.reasons?.[0] ?? '요즘 자주 언급되는 제품';
  const limitation = candidate.risks?.[0] ?? '구매 전 가격과 구성을 다시 확인해야 함';
  const usePrefix = candidate.personalUse === 'confirmed'
    ? '직접 확인해보니'
    : '요즘 자주 보여서 찾아보니';

  return [
    {
      id: `${candidate.id}-problem`,
      angle: '문제 해결형',
      text: `${name}, 왜 찾는 사람이 늘었나 봤더니\n${reason}.\n\n다만 ${limitation}.\n구매 전 이 부분은 꼭 확인하는 게 좋음.`
    },
    {
      id: `${candidate.id}-curiosity`,
      angle: '호기심·시연형',
      text: `${name}은 사진보다 사용하는 장면이 더 궁금한 제품임.\n${usePrefix} 핵심은 “${reason}”이었음.\n\n무조건 추천보다는 실제 구성과 판매처가 같은지 먼저 확인해야 함.`
    },
    {
      id: `${candidate.id}-comparison`,
      angle: '비교·결정형',
      text: `${name} 살 때 제품명만 보고 고르면 비슷한 상품을 살 수 있음.\n확인할 건 3가지: 정확한 모델, 구성 수량, 현재 가격.\n\n이 제품의 관심 포인트는 ${reason}.\n대체품이면 대체품이라고 분명히 표시할 예정.`
    },
    {
      id: `${candidate.id}-honest`,
      angle: '솔직한 한계형',
      text: `${name}, 모두에게 필요한 제품은 아님.\n${reason}이 필요한 사람에게는 후보가 될 수 있지만, ${limitation}.\n\n지금은 구매 확정 추천이 아니라 검토할 만한 제품 후보로 저장.`
    }
  ];
}

export function createAuditEvent(action, candidateId, detail = {}) {
  return {
    id: `${candidateId}-${action}-${Date.now()}`,
    candidateId,
    action,
    detail,
    createdAt: new Date().toISOString()
  };
}

export function createQueueItem(candidate, draftText, scheduledFor) {
  if (candidate.state !== CANDIDATE_STATES.APPROVED) {
    throw new Error('Only approved candidates can enter the publishing queue.');
  }

  if (!scheduledFor || Number.isNaN(new Date(scheduledFor).getTime())) {
    throw new Error('A valid schedule time is required.');
  }

  return {
    id: `queue-${candidate.id}-${Date.now()}`,
    candidateId: candidate.id,
    productName: candidate.name,
    draftText,
    scheduledFor: new Date(scheduledFor).toISOString(),
    publishingEnabled: false,
    status: 'queued_locally',
    createdAt: new Date().toISOString()
  };
}
