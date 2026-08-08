export const FIXED_AGENT_COUNT = 6;

export const AGENT_IDS = Object.freeze({
  ORCHESTRATOR: 'orchestrator',
  SCOUT: 'scout',
  VERIFIER: 'verifier',
  STRATEGIST: 'strategist',
  WRITER: 'writer',
  GUARDIAN: 'guardian'
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

const registry = [
  {
    id: AGENT_IDS.ORCHESTRATOR,
    order: 1,
    nameKo: '오케스트레이터',
    nameEn: 'Conductor',
    kind: 'controller',
    mission: '사용자 목표를 실행 계획으로 바꾸고, 고정된 전문 에이전트를 필요한 순서로 호출하며, 상태·예산·중지 조건·사람 승인 게이트를 통제한다.',
    owns: ['run_plan', 'routing', 'shared_state', 'budgets', 'stop_conditions', 'human_escalation'],
    receives: ['user_intent', 'agent_artifact', 'human_decision'],
    produces: ['run_plan', 'route_decision', 'completion_report'],
    allowedTools: ['read_run_state', 'write_run_state', 'delegate_fixed_agent', 'request_human_decision'],
    forbiddenActions: ['discover_products_directly', 'verify_claims_directly', 'write_publishable_copy', 'approve_own_output', 'publish_external'],
    stopConditions: ['missing_required_context', 'agent_contract_failure', 'budget_exhausted', 'unresolved_blocker', 'human_decision_required'],
    handoffTo: [AGENT_IDS.SCOUT, AGENT_IDS.VERIFIER, AGENT_IDS.STRATEGIST, AGENT_IDS.WRITER, AGENT_IDS.GUARDIAN, 'human_approval']
  },
  {
    id: AGENT_IDS.SCOUT,
    order: 2,
    nameKo: '제품 발굴 에이전트',
    nameEn: 'Product Scout',
    kind: 'specialist',
    mission: '관심 상승, 구매 의도, 시각적 시연 가능성, 계정 적합성을 근거로 제품 후보를 발굴한다.',
    owns: ['candidate_discovery', 'trend_signals', 'purchase_intent_signals', 'saturation_signals'],
    receives: ['discovery_brief', 'account_profile', 'blocked_categories'],
    produces: ['candidate_set'],
    allowedTools: ['public_search', 'topic_search', 'trend_lookup', 'candidate_normalization'],
    forbiddenActions: ['declare_exact_product_match', 'invent_price_or_stock', 'write_final_copy', 'approve_content', 'publish_external'],
    stopConditions: ['no_source_evidence', 'blocked_category', 'candidate_identity_too_ambiguous'],
    handoffTo: [AGENT_IDS.ORCHESTRATOR]
  },
  {
    id: AGENT_IDS.VERIFIER,
    order: 3,
    nameKo: '제품 검증 에이전트',
    nameEn: 'Evidence Verifier',
    kind: 'specialist',
    mission: '정확한 제품·모델·판매처·미디어 권리·주장 근거를 확인하고 가격·재고·판매자 정보는 시점이 찍힌 증거 스냅샷으로 기록한다.',
    owns: ['canonical_identity', 'exact_match_status', 'source_evidence', 'media_rights', 'claim_evidence', 'price_stock_seller_snapshot'],
    receives: ['candidate_set', 'user_evidence', 'media_records'],
    produces: ['evidence_packet'],
    allowedTools: ['official_source_lookup', 'listing_lookup', 'cross_source_check', 'rights_check', 'price_stock_snapshot'],
    forbiddenActions: ['act_as_dedicated_price_agent', 'recommend_by_price_alone', 'write_final_copy', 'approve_content', 'publish_external'],
    stopConditions: ['exact_match_unresolved', 'rights_unresolved', 'conflicting_primary_sources', 'high_risk_claim_unverified'],
    handoffTo: [AGENT_IDS.ORCHESTRATOR]
  },
  {
    id: AGENT_IDS.STRATEGIST,
    order: 4,
    nameKo: '콘텐츠 전략 에이전트',
    nameEn: 'Content Strategist',
    kind: 'specialist',
    mission: '검증된 사실만 사용해 대상 독자, 핵심 가치, 후킹 방향, 네 가지 서로 다른 콘텐츠 논리를 설계한다.',
    owns: ['audience_fit', 'content_goal', 'four_angles', 'hook_strategy', 'cta_strategy'],
    receives: ['evidence_packet', 'account_profile', 'performance_summary'],
    produces: ['content_brief'],
    allowedTools: ['read_verified_evidence', 'read_account_rules', 'read_performance_summary'],
    forbiddenActions: ['add_unverified_facts', 'reuse_competitor_copy', 'write_final_copy', 'approve_content', 'publish_external'],
    stopConditions: ['insufficient_verified_value', 'all_angles_duplicate', 'audience_mismatch'],
    handoffTo: [AGENT_IDS.ORCHESTRATOR]
  },
  {
    id: AGENT_IDS.WRITER,
    order: 5,
    nameKo: '스레드 작성 에이전트',
    nameEn: 'Threads Writer',
    kind: 'specialist',
    mission: '콘텐츠 브리프와 검증된 증거를 바탕으로 관점이 다른 한국어 Threads 초안 네 개를 작성한다.',
    owns: ['draft_bundle', 'tone', 'readability', 'disclosure_placement'],
    receives: ['content_brief', 'evidence_packet', 'tone_profile'],
    produces: ['draft_bundle'],
    allowedTools: ['read_verified_evidence', 'read_content_brief', 'read_tone_examples'],
    forbiddenActions: ['browse_for_new_facts', 'claim_personal_use_without_record', 'hide_affiliate_disclosure', 'approve_own_copy', 'publish_external'],
    stopConditions: ['brief_conflict', 'missing_disclosure_requirement', 'unable_to_create_four_distinct_angles'],
    handoffTo: [AGENT_IDS.ORCHESTRATOR]
  },
  {
    id: AGENT_IDS.GUARDIAN,
    order: 6,
    nameKo: '최종 검수 에이전트',
    nameEn: 'Integrity Guardian',
    kind: 'specialist',
    mission: '초안의 사실성, 제품 일치, 직접 사용 표현, 저작권, 광고 고지, 중복, 과장, 정책 위험을 최종 검수한다.',
    owns: ['review_report', 'blocking_issues', 'revision_requests', 'approval_readiness'],
    receives: ['draft_bundle', 'evidence_packet', 'content_policy', 'duplicate_index'],
    produces: ['review_report'],
    allowedTools: ['claim_evidence_check', 'duplicate_check', 'policy_check', 'rights_record_check', 'disclosure_check'],
    forbiddenActions: ['rewrite_without_request', 'downgrade_blocker_to_warning', 'self_approve_external_action', 'publish_external'],
    stopConditions: ['critical_claim_mismatch', 'product_link_mismatch', 'rights_violation', 'missing_disclosure', 'high_risk_policy_violation'],
    handoffTo: [AGENT_IDS.ORCHESTRATOR]
  }
];

export const AGENT_REGISTRY = deepFreeze(registry);

export const DETERMINISTIC_SERVICES = deepFreeze([
  {
    id: 'scheduler',
    reason: '예약 시각과 상태 전이는 규칙 기반으로 처리하며 창의적 판단이 필요하지 않다.'
  },
  {
    id: 'publisher_adapter',
    reason: '외부 게시는 승인·권한·멱등성 검사를 통과한 명령만 실행하는 결정적 어댑터여야 한다.'
  },
  {
    id: 'metrics_collector',
    reason: '조회·반응·클릭 수집은 원본 수치를 변형하지 않는 데이터 수집 작업이다.'
  },
  {
    id: 'audit_log',
    reason: '실행 이력은 에이전트 해석이 아닌 변경 불가능한 이벤트로 기록한다.'
  }
]);

export function getAgentById(agentId) {
  return AGENT_REGISTRY.find((agent) => agent.id === agentId) ?? null;
}

export function validateAgentRegistry(agents = AGENT_REGISTRY) {
  const errors = [];
  const ids = agents.map((agent) => agent.id);
  const uniqueIds = new Set(ids);

  if (agents.length !== FIXED_AGENT_COUNT) {
    errors.push(`Agent roster must contain exactly ${FIXED_AGENT_COUNT} agents.`);
  }
  if (uniqueIds.size !== agents.length) errors.push('Agent IDs must be unique.');
  if (agents.filter((agent) => agent.kind === 'controller').length !== 1) {
    errors.push('Agent roster must contain exactly one controller.');
  }
  if (!uniqueIds.has(AGENT_IDS.ORCHESTRATOR)) errors.push('Orchestrator is required.');
  if (ids.some((id) => /price|pricing/i.test(id))) errors.push('A dedicated price agent is not allowed.');

  for (const agent of agents) {
    if (!agent.mission || !agent.produces?.length || !agent.stopConditions?.length) {
      errors.push(`${agent.id} is missing a mission, output contract, or stop condition.`);
    }
    if (agent.id !== AGENT_IDS.ORCHESTRATOR && agent.handoffTo.some((target) => target !== AGENT_IDS.ORCHESTRATOR)) {
      errors.push(`${agent.id} must return control to the orchestrator.`);
    }
    if (agent.allowedTools.some((tool) => /publish_external/i.test(tool))) {
      errors.push(`${agent.id} cannot own external publishing.`);
    }
  }

  const verifier = agents.find((agent) => agent.id === AGENT_IDS.VERIFIER);
  if (!verifier?.owns.includes('price_stock_seller_snapshot')) {
    errors.push('Verifier must own price, stock, and seller snapshots; no separate price agent is used.');
  }

  return { ok: errors.length === 0, errors };
}
