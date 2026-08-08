import { AGENT_IDS, AGENT_REGISTRY } from './agent-registry.mjs';
import { SINBAK_ITEM_PROFILE } from './niche-profile.mjs';
import { getAgentOutputSchema } from './schemas.mjs';

const GLOBAL_RULES = [
  '검증된 입력만 사용하고 모르는 내용은 추정하지 않는다.',
  '전문 에이전트는 다른 전문 에이전트에게 직접 작업을 넘기지 않고 오케스트레이터에게만 반환한다.',
  '외부 게시, 댓글, 좋아요, 팔로우, 구매, 결제를 실행하지 않는다.',
  '출력은 설명문을 덧붙이지 말고 지정된 JSON 객체 하나만 반환한다.',
  '중지 조건이 발생하면 임의로 우회하지 말고 blockers에 이유를 기록한다.'
];

const ROLE_DIRECTIVES = Object.freeze({
  [AGENT_IDS.ORCHESTRATOR]: [
    '목표, 제약, 성공조건, 중지조건을 run_plan으로 고정한다.',
    '고정된 여섯 에이전트 외의 역할을 만들지 않는다.',
    'Guardian 차단과 사용자 승인 게이트를 우회하지 않는다.'
  ],
  [AGENT_IDS.SCOUT]: [
    '실용 신박템 후보를 발굴하되 신기함만 있고 효용이 없는 제품은 감점한다.',
    '구매처·가격·링크·구성 질문을 좋아요보다 강한 구매 의도 신호로 취급한다.',
    '정확한 제품 일치를 확정하지 말고 후보와 근거만 반환한다.'
  ],
  [AGENT_IDS.VERIFIER]: [
    '제품명, 브랜드, 모델, 옵션, 판매자, 가격, 재고, 확인 시각을 하나의 증거 묶음으로 검증한다.',
    '가격만으로 추천하지 않으며 별도 가격 에이전트처럼 행동하지 않는다.',
    '직접 사용 여부와 미디어 권리를 독립적으로 확인한다.'
  ],
  [AGENT_IDS.STRATEGIST]: [
    '네 가지 관점은 단어만 바꾼 변형이 아니라 독자 가치와 논리가 달라야 한다.',
    '실용성, 짧은 시연, 구매 판단, 솔직한 한계를 균형 있게 설계한다.',
    '검증 패킷에 없는 사실을 추가하지 않는다.'
  ],
  [AGENT_IDS.WRITER]: [
    '한국어 Threads 문체로 짧고 자연스럽게 작성한다.',
    '직접 사용이 확인되지 않으면 써봤다, 먹어봤다, 재구매 같은 체험 표현을 금지한다.',
    '제휴 글에는 눈에 잘 보이는 고지 문구를 포함한다.'
  ],
  [AGENT_IDS.GUARDIAN]: [
    '제품 일치, 근거, 직접 사용 표현, 저작권, 광고 고지, 과장, 중복을 독립적으로 검사한다.',
    '치명적인 불일치나 권리 문제를 경고로 낮추지 않는다.',
    'pass, revise, block 중 하나를 명시한다.'
  ]
});

export function buildAgentSystemPrompt(agentId, niche = SINBAK_ITEM_PROFILE) {
  const agent = AGENT_REGISTRY.find((item) => item.id === agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);
  const schema = getAgentOutputSchema(agentId);

  return [
    `# 역할\n${agent.nameKo} (${agent.nameEn})`,
    `# 임무\n${agent.mission}`,
    `# 현재 핵심 주제\n${niche.nameKo}: ${niche.definition}`,
    `# 역할별 지시\n- ${ROLE_DIRECTIVES[agentId].join('\n- ')}`,
    `# 공통 규칙\n- ${GLOBAL_RULES.join('\n- ')}`,
    `# 입력 계약\n${agent.receives.join(', ')}`,
    `# 사용 가능 도구\n${agent.allowedTools.join(', ')}`,
    `# 금지 행동\n${agent.forbiddenActions.join(', ')}`,
    `# 중지 조건\n${agent.stopConditions.join(', ')}`,
    `# 출력 계약\n${JSON.stringify(schema)}`
  ].join('\n\n');
}

export const AGENT_SYSTEM_PROMPTS = Object.freeze(
  Object.fromEntries(AGENT_REGISTRY.map((agent) => [agent.id, buildAgentSystemPrompt(agent.id)]))
);

export function validatePromptSet(prompts = AGENT_SYSTEM_PROMPTS) {
  const errors = [];
  const entries = Object.entries(prompts);
  if (entries.length !== 6) errors.push('Prompt set must contain exactly six agents.');
  for (const agent of AGENT_REGISTRY) {
    const prompt = prompts[agent.id];
    if (!prompt) {
      errors.push(`Missing prompt for ${agent.id}.`);
      continue;
    }
    for (const phrase of ['출력 계약', '중지 조건', '외부 게시', SINBAK_ITEM_PROFILE.nameKo]) {
      if (!prompt.includes(phrase)) errors.push(`${agent.id} prompt is missing ${phrase}.`);
    }
  }
  return { ok: errors.length === 0, errors };
}
