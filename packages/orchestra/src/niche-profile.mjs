const WEIGHTS = Object.freeze({
  problemClarity: 0.2,
  demoPotential: 0.2,
  practicalUtility: 0.2,
  novelty: 0.15,
  purchaseIntent: 0.15,
  audienceFit: 0.1
});

export const SINBAK_ITEM_PROFILE = Object.freeze({
  id: 'sinbak-items',
  nameKo: '실용 신박템',
  definition: '새롭거나 의외의 기능으로 일상 불편을 눈에 보이게 해결하고, 짧은 사진·영상 시연만으로 가치가 이해되는 제품',
  audience: ['가성비 생활용품을 찾는 사람', '직장인', '초등 자녀가 있는 가정'],
  preferredCategories: ['주방', '욕실', '청소', '수납', '여행', '책상', '초등 생활'],
  blockedCategories: ['의약품', '처방·제한 제품', '위험한 화학제품', '불법·위조 상품', '효능 단정이 필요한 건강·피부 제품'],
  requiredSignals: ['problemClarity', 'demoPotential', 'practicalUtility', 'novelty', 'purchaseIntent', 'audienceFit'],
  scoreThresholds: { recommended: 70, review: 50 },
  weights: WEIGHTS,
  principles: [
    '신기함보다 실제 불편 해결을 우선한다.',
    '3~10초 안에 전후 차이나 사용 원리가 보여야 한다.',
    '좋아요보다 구매처·가격·링크·구성 질문을 강한 구매 신호로 본다.',
    '정확한 제품과 합법적으로 사용할 미디어를 확보할 수 있어야 한다.',
    '직접 사용하지 않았다면 발견형·비교형 표현만 허용한다.'
  ]
});

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

export function scoreSinbakCandidate(candidate = {}) {
  const signals = candidate.signals ?? {};
  const breakdown = Object.fromEntries(
    Object.entries(WEIGHTS).map(([key, weight]) => [key, Number((clamp(signals[key]) * weight).toFixed(2))])
  );
  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  const penalties = {
    gimmickOnly: candidate.flags?.gimmickOnly ? 25 : 0,
    overSaturated: candidate.flags?.overSaturated ? 12 : 0,
    rightsRisk: candidate.flags?.rightsRisk ? 20 : 0,
    healthClaimRisk: candidate.flags?.healthClaimRisk ? 30 : 0,
    weakEvidence: candidate.flags?.weakEvidence ? 15 : 0,
    identityRisk: candidate.flags?.identityRisk ? 20 : 0
  };
  const penaltyTotal = Object.values(penalties).reduce((sum, value) => sum + value, 0);
  const score = Math.round(clamp(rawScore - penaltyTotal));

  const gates = [];
  if (clamp(signals.practicalUtility) < 60) gates.push('실용성이 60점 미만입니다.');
  if (clamp(signals.demoPotential) < 55) gates.push('짧은 시연으로 가치가 전달되기 어렵습니다.');
  if (clamp(signals.problemClarity) < 55) gates.push('해결하는 불편이 명확하지 않습니다.');
  if (clamp(candidate.identityConfidence, 0, 1) < 0.65) gates.push('제품 정규화 신뢰도가 부족합니다.');
  if (!Array.isArray(candidate.sourceRefs) || candidate.sourceRefs.length < 2) gates.push('독립적인 근거가 두 개 미만입니다.');
  if (candidate.blockedCategory === true) gates.push('차단 카테고리입니다.');
  if (candidate.flags?.healthClaimRisk) gates.push('건강·피부 효능 위험이 있습니다.');

  let status = 'reject';
  if (score >= SINBAK_ITEM_PROFILE.scoreThresholds.recommended && gates.length === 0) status = 'recommended';
  else if (score >= SINBAK_ITEM_PROFILE.scoreThresholds.review && !candidate.blockedCategory) status = 'review';

  return {
    score,
    status,
    gates,
    breakdown,
    penalties,
    penaltyTotal
  };
}

export function validateSinbakCandidate(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== 'object') return { ok: false, errors: ['Candidate must be an object.'] };
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) errors.push('Candidate id is required.');
  if (typeof candidate.name !== 'string' || candidate.name.length === 0) errors.push('Candidate name is required.');
  for (const signal of SINBAK_ITEM_PROFILE.requiredSignals) {
    if (!Number.isFinite(Number(candidate.signals?.[signal]))) errors.push(`Signal ${signal} is required.`);
  }
  return { ok: errors.length === 0, errors };
}
