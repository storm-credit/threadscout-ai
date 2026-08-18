// Declared output contract per agent.
//
// This is the contract an agent is *told* to produce: it is embedded in the system
// prompt and hashed into the version manifest, so an artifact can be traced to the
// contract that was in force when it was made.
//
// Validation itself lives in packages/core/src/artifacts.mjs. Keeping one validator
// matters more than keeping the schema and the validator side by side — two
// validators is how a contract quietly develops two meanings.

import { AGENT_IDS } from './agent-registry.mjs';

export const AGENT_OUTPUT_SCHEMAS = Object.freeze({
  [AGENT_IDS.ORCHESTRATOR]: Object.freeze({
    artifact: 'run_plan',
    required: ['objective', 'stages', 'budgets', 'stopConditions', 'humanDecisionsRequired']
  }),
  [AGENT_IDS.SCOUT]: Object.freeze({
    artifact: 'candidate_set',
    required: ['candidates'],
    forbidden: ['matchState=exact', 'publishableMedia=true'],
    note: '후보와 근거만 반환한다. 제품 동일성과 게시 가능 미디어는 Scout의 권한이 아니다.'
  }),
  [AGENT_IDS.VERIFIER]: Object.freeze({
    artifact: 'evidence_packet',
    required: [
      'candidateId',
      'canonicalProduct',
      'matchState',
      'matchEvidence',
      'conflicts',
      'verifiedClaims',
      'prohibitedClaims',
      'publicFigureRelation',
      'mediaRights',
      'personalUseState',
      'commerceSnapshot',
      'freshness',
      'unresolvedQuestions',
      'verifierDecision',
      'sources'
    ],
    enums: Object.freeze({
      matchState: ['exact', 'likely', 'substitute', 'unresolved'],
      verifierDecision: ['verified', 'limited', 'hold', 'reject'],
      personalUseState: ['confirmed', 'not_confirmed']
    }),
    note: '가격은 null일 수 있으나 관측 시각은 반드시 있어야 한다. 동일성이 미확인이면 verified가 될 수 없다.'
  }),
  [AGENT_IDS.STRATEGIST]: Object.freeze({
    artifact: 'content_brief',
    required: ['candidateId', 'evidencePacketHash', 'audience', 'angles', 'prohibitedImplications'],
    constraints: Object.freeze({
      angles: '정확히 4개, 서로 다른 readerJob, 표현만 바꾼 변형 금지',
      readerJob: ['practical_result', 'mechanism_demo', 'comparison_decision', 'limitation_fit']
    }),
    note: '검증 패킷에 없는 사실을 추가하지 않는다.'
  }),
  [AGENT_IDS.WRITER]: Object.freeze({
    artifact: 'draft_bundle',
    required: ['candidateId', 'contentBriefHash', 'evidencePacketHash', 'drafts'],
    constraints: Object.freeze({
      drafts: '정확히 4개, 각각 하나의 angleId에 대응',
      draftFields: ['draftId', 'angleId', 'hook', 'body', 'cta', 'claimRefs', 'firstHandLanguageUsed']
    }),
    note: '사용 기록이 없으면 체험형 표현을 쓰지 않는다. 확인되지 않은 사실은 생략하거나 한정한다.'
  }),
  [AGENT_IDS.GUARDIAN]: Object.freeze({
    artifact: 'review_report',
    required: [
      'candidateId',
      'draftBundleHash',
      'evidencePacketHash',
      'decision',
      'productMatchCheck',
      'publicFigureClaimCheck',
      'rightsCheck',
      'firstHandCheck',
      'affiliateDisclosureCheck',
      'duplicationCheck',
      'exaggerationCheck',
      'sensitiveClaimCheck',
      'perDraftFindings',
      'revisionRequests',
      'nonOverridableBlockers'
    ],
    enums: Object.freeze({
      decision: ['pass', 'revise', 'block'],
      checkStatus: ['pass', 'warn', 'block']
    }),
    note: '대체 문구를 직접 쓰지 않고 수정 요청만 반환한다. 차단은 승인으로 뒤집을 수 없다.'
  })
});

export function getAgentOutputSchema(agentId) {
  return AGENT_OUTPUT_SCHEMAS[agentId] ?? null;
}
