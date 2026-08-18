// Content Strategist.
//
// Produces exactly four angles that differ in argument, not in wording
// (CONTENT_OUTPUT_SPEC.md, AT-06). It may not add a fact that is not already a
// verified claim in the evidence packet.
//
// The four reader jobs are fixed by the spec, so the interesting work here is
// giving each one a genuinely different argument and a different claim subset,
// then refusing its own output if the four collapse into paraphrases.

import { ARTIFACT_TYPES, READER_JOBS, createEnvelope } from '../../../core/src/artifacts.mjs';
import { AGENT_IDS } from '../../../core/src/handoff.mjs';
import { RULE_IDS, findParaphrasedAngles } from '../../../core/src/policy-rules.mjs';
import { hashArtifact } from '../../../core/src/hash.mjs';

/**
 * Each reader job asks a different question of the same evidence.
 * Keeping the templates structurally different is what stops four paraphrases.
 */
const ANGLE_BLUEPRINTS = Object.freeze({
  practical_result: {
    coreValue: (context) => context.readerValue + ' — 실제로 어떤 결과가 남는지에 집중한다.',
    hookLogic: () => '이 불편을 겪는 사람에게 바뀌는 결과 한 가지를 먼저 말한다.',
    cta: () => '같은 불편이 있는지 먼저 확인하게 한다.',
    differentiation: () => '작동 원리나 비교가 아니라, 사용 후 남는 결과만 다룬다.',
    claimPreference: 'first',
    commercialIntensity: 'soft'
  },
  mechanism_demo: {
    coreValue: (context) => context.productName + '이(가) 어떻게 그 결과를 만드는지 구조를 보여 준다.',
    hookLogic: () => '설명 대신 구조와 동작을 짧게 보여 주는 순서로 연다.',
    cta: () => '구조가 본인 환경에 맞는지 확인하게 한다.',
    differentiation: () => '결과가 아니라 그 결과가 나오는 방식 자체가 본문의 주제다.',
    claimPreference: 'mechanism',
    commercialIntensity: 'none'
  },
  comparison_decision: {
    coreValue: () => '비슷해 보이는 제품 사이에서 무엇을 확인해야 잘못 사지 않는지 정리한다.',
    hookLogic: () => '구매 직전에 확인할 항목을 목록으로 제시한다.',
    cta: () => '모델과 옵션이 일치하는지 확인하게 한다.',
    differentiation: () => '제품 자랑이 아니라 선택 실패를 막는 확인 절차가 핵심 논거다.',
    claimPreference: 'identity',
    commercialIntensity: 'affiliate'
  },
  limitation_fit: {
    coreValue: () => '누구에게 맞지 않는지 먼저 말해 잘못된 기대를 줄인다.',
    hookLogic: () => '필요하지 않은 사람을 먼저 제외하는 방식으로 연다.',
    cta: () => '해당되지 않으면 사지 않도록 안내한다.',
    differentiation: () => '유일하게 구매하지 않을 이유를 중심으로 전개한다.',
    claimPreference: 'last',
    commercialIntensity: 'none'
  }
});

/** Give each angle a different slice of the verified claims where possible. */
function pickClaims(claims, preference, index) {
  if (claims.length === 0) return [];
  if (claims.length <= 2) return claims.map((claim) => claim.claimId);

  switch (preference) {
    case 'first':
      return [claims[0].claimId];
    case 'last':
      return [claims[claims.length - 1].claimId];
    case 'mechanism':
      return [claims[Math.min(1, claims.length - 1)].claimId];
    case 'identity':
      return claims.slice(0, Math.min(3, claims.length)).map((claim) => claim.claimId);
    default:
      return [claims[index % claims.length].claimId];
  }
}

export function runStrategist(request, { clock, nextId }) {
  const { runId, candidate, evidencePacket } = request;
  const now = clock();

  if (evidencePacket.verifierDecision === 'hold' || evidencePacket.verifierDecision === 'reject') {
    throw new Error('Strategist may not run while the verifier decision is ' + evidencePacket.verifierDecision + '.');
  }

  const claims = evidencePacket.verifiedClaims ?? [];
  const context = {
    productName: evidencePacket.canonicalProduct.productName,
    readerValue: candidate.readerValue
  };

  const prohibited = [
    ...evidencePacket.prohibitedClaims.map((claim) => claim.text),
    ...(evidencePacket.publicFigureRelation?.prohibitedImplications ?? [])
  ];

  // Only `exact` permits same-product wording; anything else must be labelled as an
  // alternative or stay non-commercial (PRODUCT_MATCHING.md section 5).
  const exact = evidencePacket.matchState === 'exact';
  if (!exact) prohibited.push('링크한 상품이 같은 제품이라는 표현');

  const angles = READER_JOBS.map((readerJob, index) => {
    const blueprint = ANGLE_BLUEPRINTS[readerJob];
    const commercialIntensity = blueprint.commercialIntensity === 'affiliate' && !exact
      ? 'soft'
      : blueprint.commercialIntensity;

    return {
      angleId: nextId('angle'),
      readerJob,
      coreValue: blueprint.coreValue(context),
      hookLogic: blueprint.hookLogic(context),
      allowedClaims: pickClaims(claims, blueprint.claimPreference, index),
      prohibitedImplications: [...prohibited],
      mediaPlan: (evidencePacket.mediaRights ?? []).length > 0 ? 'evidence_media_reviewed' : 'text_only',
      cta: blueprint.cta(context),
      disclosureRequirement: commercialIntensity === 'affiliate' ? 'required' : 'not_required',
      issueReferenceRule: evidencePacket.publicFigureRelation
        ? '공개적으로 확인된 사실만 서술하고 추천 · 협찬 함의를 만들지 않는다.'
        : null,
      differentiationReason: blueprint.differentiation(context),
      commercialIntensity
    };
  });

  // Refuse own output rather than emit four restatements of one argument.
  const paraphrases = findParaphrasedAngles(angles);
  if (paraphrases.length > 0) {
    const error = new Error('Strategist produced paraphrased angles.');
    error.ruleId = RULE_IDS.ANGLES_ARE_PARAPHRASES;
    error.detail = paraphrases;
    throw error;
  }

  const artifact = {
    ...createEnvelope({
      type: ARTIFACT_TYPES.CONTENT_BRIEF,
      agentId: AGENT_IDS.STRATEGIST,
      runId,
      artifactId: nextId('artifact'),
      createdAt: now,
      inputArtifactRefs: [evidencePacket.artifactId],
      evidenceRefs: [...evidencePacket.evidenceRefs]
    }),
    candidateId: candidate.candidateId,
    evidencePacketHash: hashArtifact(evidencePacket),
    audience: candidate.readerValue,
    contentGoal: candidate.whyNow,
    angles,
    prohibitedImplications: [...new Set(prohibited)],
    mediaPlan: (evidencePacket.mediaRights ?? []).length > 0 ? 'evidence_media_reviewed' : 'text_only',
    disclosureRequirement: exact ? 'required_when_affiliate' : 'not_applicable'
  };

  if (!exact) {
    artifact.warnings.push('동일 제품이 확정되지 않아 제휴 성격의 관점은 약한 상업 강도로 낮췄습니다.');
  }

  return { artifact, requestedNextAction: 'draft', status: 'complete' };
}
