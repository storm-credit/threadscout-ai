import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_IDS,
  AGENT_REGISTRY,
  DETERMINISTIC_SERVICES,
  FIXED_AGENT_COUNT,
  getAgentById,
  validateAgentRegistry
} from '../packages/orchestra/src/agent-registry.mjs';
import {
  ARTIFACT_TYPES,
  createArtifactEnvelope,
  validateAgentArtifact
} from '../packages/orchestra/src/contracts.mjs';
import {
  RUN_STAGE_IDS,
  completeLocalQueue,
  createOrchestraPlan,
  createRunState,
  getCurrentStage,
  recordHumanDecision,
  submitAgentArtifact,
  validateOrchestraPlan
} from '../packages/orchestra/src/orchestrator.mjs';

const createdAt = '2026-08-08T00:00:00.000Z';

function artifact(runId, type, payload = {}) {
  return { type, runId, createdAt, ...payload };
}

function runPlanArtifact(run) {
  return artifact(run.runId, ARTIFACT_TYPES.RUN_PLAN, { planVersion: 1 });
}

function candidateSet(run) {
  return artifact(run.runId, ARTIFACT_TYPES.CANDIDATE_SET, {
    candidates: [{ id: 'candidate-1', name: '테스트 제품', sourceCount: 2 }]
  });
}

function commerceSnapshot(overrides = {}) {
  return {
    observedAt: createdAt,
    priceStatus: 'observed',
    amount: 9900,
    currency: 'KRW',
    stockStatus: 'in_stock',
    sellerStatus: 'verified',
    sellerName: '테스트 판매자',
    variantStatus: 'verified',
    variantName: '기본 구성',
    ...overrides
  };
}

function evidencePacket(run, overrides = {}) {
  return artifact(run.runId, ARTIFACT_TYPES.EVIDENCE_PACKET, {
    exactMatchStatus: 'exact',
    sources: [{ id: 'source-1', type: 'listing' }],
    mediaRights: 'owned',
    commerceSnapshot: commerceSnapshot(),
    blockers: [],
    ...overrides
  });
}

function contentBrief(run) {
  return artifact(run.runId, ARTIFACT_TYPES.CONTENT_BRIEF, {
    angles: [
      { id: 'problem', goal: '문제 해결' },
      { id: 'curiosity', goal: '호기심' },
      { id: 'comparison', goal: '비교' },
      { id: 'honest', goal: '한계' }
    ]
  });
}

function draftBundle(run, revision = 0) {
  return artifact(run.runId, ARTIFACT_TYPES.DRAFT_BUNDLE, {
    revision,
    drafts: ['problem', 'curiosity', 'comparison', 'honest'].map((angleId) => ({
      angleId,
      text: `${angleId} 초안 ${revision}`
    }))
  });
}

function guardianReport(run, decision = 'pass', blockers = []) {
  return artifact(run.runId, ARTIFACT_TYPES.REVIEW_REPORT, { decision, blockers });
}

function advanceToWriterCompleted(plan = createOrchestraPlan({ objective: '테스트 제품 초안 준비' })) {
  let run = createRunState(plan, 'run-test');
  run = submitAgentArtifact(run, AGENT_IDS.ORCHESTRATOR, runPlanArtifact(run));
  if (getCurrentStage(run).assignedTo === AGENT_IDS.SCOUT) {
    run = submitAgentArtifact(run, AGENT_IDS.SCOUT, candidateSet(run));
  }
  run = submitAgentArtifact(run, AGENT_IDS.VERIFIER, evidencePacket(run));
  run = submitAgentArtifact(run, AGENT_IDS.STRATEGIST, contentBrief(run));
  run = submitAgentArtifact(run, AGENT_IDS.WRITER, draftBundle(run));
  return run;
}

test('the orchestra is fixed at exactly six agents including one orchestrator', () => {
  const result = validateAgentRegistry();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(FIXED_AGENT_COUNT, 6);
  assert.equal(AGENT_REGISTRY.length, 6);
  assert.deepEqual(AGENT_REGISTRY.map((agent) => agent.id), [
    'orchestrator', 'scout', 'verifier', 'strategist', 'writer', 'guardian'
  ]);
  assert.equal(AGENT_REGISTRY.filter((agent) => agent.kind === 'controller').length, 1);
});

test('a seventh agent fails registry validation', () => {
  const result = validateAgentRegistry([
    ...AGENT_REGISTRY,
    {
      id: 'seventh',
      kind: 'specialist',
      mission: 'Not allowed',
      produces: ['extra'],
      stopConditions: ['always'],
      handoffTo: [AGENT_IDS.ORCHESTRATOR],
      allowedTools: []
    }
  ]);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /exactly 6 agents/);
});

test('there is no price agent and verifier owns volatile commerce evidence', () => {
  assert.equal(AGENT_REGISTRY.some((agent) => /price|pricing/i.test(agent.id)), false);
  const verifier = getAgentById(AGENT_IDS.VERIFIER);
  assert.ok(verifier.owns.includes('price_stock_seller_snapshot'));
  assert.ok(verifier.allowedTools.includes('price_stock_snapshot'));
  assert.ok(verifier.forbiddenActions.includes('act_as_dedicated_price_agent'));
});

test('only the orchestrator delegates and no agent can publish externally', () => {
  for (const agent of AGENT_REGISTRY) {
    assert.equal(agent.allowedTools.some((tool) => /publish_external/.test(tool)), false);
    assert.ok(agent.forbiddenActions.includes('publish_external'));
    if (agent.id !== AGENT_IDS.ORCHESTRATOR) {
      assert.deepEqual(agent.handoffTo, [AGENT_IDS.ORCHESTRATOR]);
    }
  }
  assert.ok(DETERMINISTIC_SERVICES.some((service) => service.id === 'publisher_adapter'));
});

test('exact user-supplied products skip Scout but never skip Verifier or Guardian', () => {
  const plan = createOrchestraPlan({
    objective: '지정 제품으로 초안을 만든다',
    candidateMode: 'exact_user_supplied',
    candidateId: 'product-123'
  });
  const validation = validateOrchestraPlan(plan);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(plan.stages.find((item) => item.id === RUN_STAGE_IDS.DISCOVERY).skipped, true);
  assert.equal(plan.stages.find((item) => item.id === RUN_STAGE_IDS.VERIFICATION).skipped, false);
  assert.equal(plan.stages.find((item) => item.id === RUN_STAGE_IDS.REVIEW).skipped, false);
});

test('verifier artifacts require one timestamped commerce snapshot without a separate price agent', () => {
  const valid = validateAgentArtifact(AGENT_IDS.VERIFIER, artifact('run-1', ARTIFACT_TYPES.EVIDENCE_PACKET, {
    exactMatchStatus: 'exact',
    sources: [{ id: 'source' }],
    mediaRights: 'not_required',
    commerceSnapshot: commerceSnapshot({
      priceStatus: 'unavailable',
      amount: undefined,
      currency: undefined,
      stockStatus: 'unknown',
      sellerStatus: 'unavailable',
      sellerName: undefined,
      variantStatus: 'unresolved',
      variantName: undefined
    })
  }));
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const invalid = validateAgentArtifact(AGENT_IDS.VERIFIER, artifact('run-1', ARTIFACT_TYPES.EVIDENCE_PACKET, {
    exactMatchStatus: 'exact',
    sources: [{ id: 'source' }],
    mediaRights: 'not_required'
  }));
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(' '), /commerceSnapshot/);
});

test('observed commerce evidence requires price, seller, and variant details', () => {
  const invalid = validateAgentArtifact(AGENT_IDS.VERIFIER, artifact('run-1', ARTIFACT_TYPES.EVIDENCE_PACKET, {
    exactMatchStatus: 'exact',
    sources: [{ id: 'source' }],
    mediaRights: 'owned',
    commerceSnapshot: {
      observedAt: createdAt,
      priceStatus: 'observed',
      stockStatus: 'in_stock',
      sellerStatus: 'verified',
      variantStatus: 'verified'
    }
  }));

  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(' '), /amount/);
  assert.match(invalid.errors.join(' '), /currency/);
  assert.match(invalid.errors.join(' '), /sellerName/);
  assert.match(invalid.errors.join(' '), /variantName/);
});

test('strategist and writer contracts require four distinct angles', () => {
  const badBrief = validateAgentArtifact(AGENT_IDS.STRATEGIST, artifact('run-1', ARTIFACT_TYPES.CONTENT_BRIEF, {
    angles: [{ id: 'same' }, { id: 'same' }, { id: 'third' }, { id: 'fourth' }]
  }));
  assert.equal(badBrief.ok, false);

  const badDrafts = validateAgentArtifact(AGENT_IDS.WRITER, artifact('run-1', ARTIFACT_TYPES.DRAFT_BUNDLE, {
    drafts: [{ angleId: 'one' }, { angleId: 'two' }, { angleId: 'three' }]
  }));
  assert.equal(badDrafts.ok, false);
  assert.match(badDrafts.errors.join(' '), /exactly four drafts/);
});

test('a standard run requires Guardian pass and human approval before local queueing', () => {
  let run = advanceToWriterCompleted();
  assert.equal(getCurrentStage(run).assignedTo, AGENT_IDS.GUARDIAN);

  run = submitAgentArtifact(run, AGENT_IDS.GUARDIAN, guardianReport(run, 'pass'));
  assert.equal(getCurrentStage(run).id, RUN_STAGE_IDS.HUMAN_APPROVAL);

  assert.throws(
    () => completeLocalQueue(run, { publishingEnabled: false }),
    /not at the local queue stage/
  );

  run = recordHumanDecision(run, 'approved', 'test-user');
  assert.equal(getCurrentStage(run).id, RUN_STAGE_IDS.LOCAL_QUEUE);

  run = completeLocalQueue(run, {
    id: 'queue-1',
    publishingEnabled: false,
    scheduledFor: '2026-08-09T08:10:00+09:00'
  });
  assert.equal(run.status, 'completed_local_only');
  assert.equal(run.artifacts.queue_record.publishingEnabled, false);
});

test('human approval cannot bypass Guardian revise or block', () => {
  let run = advanceToWriterCompleted();
  run = submitAgentArtifact(run, AGENT_IDS.GUARDIAN, guardianReport(run, 'block', ['product mismatch']));
  assert.equal(run.status, 'blocked');
  assert.throws(() => recordHumanDecision(run, 'approved'), /cannot bypass/);
});

test('unresolved verification gets one Scout refinement then escalates to human', () => {
  const plan = createOrchestraPlan({ objective: '후보 검증' });
  let run = createRunState(plan, 'run-refine');
  run = submitAgentArtifact(run, AGENT_IDS.ORCHESTRATOR, runPlanArtifact(run));
  run = submitAgentArtifact(run, AGENT_IDS.SCOUT, candidateSet(run));
  run = submitAgentArtifact(run, AGENT_IDS.VERIFIER, evidencePacket(run, {
    exactMatchStatus: 'unresolved',
    blockers: ['모델명이 불명확함']
  }));

  assert.equal(run.status, 'refinement_requested');
  assert.equal(run.revisionCounts.scoutRefinement, 1);
  assert.equal(getCurrentStage(run).assignedTo, AGENT_IDS.SCOUT);

  run = submitAgentArtifact(run, AGENT_IDS.SCOUT, candidateSet(run));
  run = submitAgentArtifact(run, AGENT_IDS.VERIFIER, evidencePacket(run, {
    exactMatchStatus: 'unresolved',
    blockers: ['두 번째 확인에도 모델 불명확']
  }));

  assert.equal(run.status, 'needs_human_decision');
  assert.equal(getCurrentStage(run).id, RUN_STAGE_IDS.HUMAN_APPROVAL);
  assert.throws(() => recordHumanDecision(run, 'approved'), /cannot bypass/);
});

test('Guardian revision is bounded to two Writer retries', () => {
  let run = advanceToWriterCompleted();

  run = submitAgentArtifact(run, AGENT_IDS.GUARDIAN, guardianReport(run, 'revise', ['고지 위치 수정']));
  assert.equal(run.revisionCounts.writerRevision, 1);
  assert.equal(getCurrentStage(run).assignedTo, AGENT_IDS.WRITER);

  run = submitAgentArtifact(run, AGENT_IDS.WRITER, draftBundle(run, 1));
  run = submitAgentArtifact(run, AGENT_IDS.GUARDIAN, guardianReport(run, 'revise', ['표현 수정']));
  assert.equal(run.revisionCounts.writerRevision, 2);

  run = submitAgentArtifact(run, AGENT_IDS.WRITER, draftBundle(run, 2));
  run = submitAgentArtifact(run, AGENT_IDS.GUARDIAN, guardianReport(run, 'revise', ['여전히 불충분']));
  assert.equal(run.status, 'needs_human_decision');
  assert.equal(getCurrentStage(run).id, RUN_STAGE_IDS.HUMAN_APPROVAL);
  assert.match(run.blockers.join(' '), /revision limit/);
});

test('artifacts cannot cross run boundaries', () => {
  const plan = createOrchestraPlan({ objective: 'run ID 검사' });
  const run = createRunState(plan, 'run-a');
  const foreign = createArtifactEnvelope({ type: ARTIFACT_TYPES.RUN_PLAN, runId: 'run-b' });
  assert.throws(() => submitAgentArtifact(run, AGENT_IDS.ORCHESTRATOR, foreign), /does not match/);
});
