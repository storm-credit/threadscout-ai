import { AGENT_IDS, AGENT_REGISTRY, validateAgentRegistry } from './agent-registry.mjs';
import { validateAgentArtifact } from './contracts.mjs';
import { validateArtifactSchema } from './schemas.mjs';
import { createReplayModelRuntime } from './model-runtime.mjs';
import {
  createOrchestraPlan,
  createRunState,
  getCurrentStage,
  recordHumanDecision,
  submitAgentArtifact
} from './orchestrator.mjs';
import {
  attachArtifactMetadata,
  buildVersionManifest,
  canonicalStringify,
  sha256,
  verifyVersionedArtifact
} from './versioning.mjs';

export const MASTER_DESIGN_BASELINE = '691aad24cd307c7094ed1531f06e5b1d2976b088';
export const SPIKE0_REQUIRED_FIXTURES = Object.freeze(['F01', 'F02', 'F04', 'F11', 'F12', 'F13', 'F15', 'F20', 'F21']);
export const SPIKE0_REQUIRED_ATS = Object.freeze([
  'AT-04', 'AT-06', 'AT-07', 'AT-08', 'AT-09', 'AT-13', 'AT-16', 'AT-17', 'AT-18', 'AT-19',
  'AT-20', 'AT-21', 'AT-23', 'AT-25', 'AT-36', 'AT-38', 'AT-39', 'AT-41'
]);

const FIXED_TIME = '2026-08-15T10:30:00.000Z';
const DISCLOSURE = '이 포스팅은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.';
const FIRST_HAND_PATTERN = /(직접\s*)?(써보니|사용해보니|써 봤|사용해 봤)/;
const ENDORSEMENT_PATTERN = /(추천한|추천했다|강력 추천|픽한 제품)/;
const SECRET_SENTINEL = 'THREADSCOUT_SPIKE0_SECRET_MUST_NOT_LEAK';

class HarnessContractError extends Error {
  constructor(message, code = 'harness_contract_error') {
    super(message);
    this.name = 'HarnessContractError';
    this.code = code;
  }
}

export class StaleDecisionError extends Error {
  constructor(message = 'Decision revision is stale.') {
    super(message);
    this.name = 'StaleDecisionError';
    this.code = 'stale_decision';
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

const BASE_PRODUCT = deepFreeze({
  id: 'fixture-foldable-sink-splash-guard',
  name: '접이식 싱크대 물튐 방지 가드',
  brand: 'FixtureLab',
  model: 'SG-01',
  variant: '투명 45cm',
  seller: 'Fixture Seller'
});

const FIXTURE_CATALOG = deepFreeze({
  F01: {
    id: 'F01',
    title: 'owner-supplied exact product',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    expected: 'approved'
  },
  F02: {
    id: 'F02',
    title: 'visually similar conflicting model',
    product: BASE_PRODUCT,
    listingModel: 'SG-02',
    exactMatchStatus: 'unresolved',
    opportunityScore: 82,
    expected: 'held_unresolved'
  },
  F04: {
    id: 'F04',
    title: 'high-score unresolved candidate',
    product: BASE_PRODUCT,
    listingModel: 'UNKNOWN',
    exactMatchStatus: 'unresolved',
    opportunityScore: 96,
    expected: 'held_unresolved'
  },
  F11: {
    id: 'F11',
    title: 'upstream mutation after approval',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    mutateAfterApproval: true,
    expected: 'stale_after_approval'
  },
  F12: {
    id: 'F12',
    title: 'run budget exhausted',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    maxInvocations: 2,
    expected: 'budget_exhausted'
  },
  F13: {
    id: 'F13',
    title: 'unsupported endorsement wording',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    publicFigureRelation: 'R2',
    unsupportedEndorsement: true,
    expected: 'guardian_revise'
  },
  F15: {
    id: 'F15',
    title: 'first-hand wording without UsageRecord',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    fakeFirstHand: true,
    expected: 'guardian_revise'
  },
  F20: {
    id: 'F20',
    title: 'contaminated upstream fact repeated downstream',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    contaminatedClaim: true,
    expected: 'blocked_authority'
  },
  F21: {
    id: 'F21',
    title: 'cross-revision stale decision',
    product: BASE_PRODUCT,
    listingModel: 'SG-01',
    exactMatchStatus: 'exact',
    opportunityScore: 82,
    mutateAfterApproval: true,
    expected: 'stale_after_approval'
  }
});

export function getSpike0Fixture(fixtureId) {
  const fixture = FIXTURE_CATALOG[fixtureId];
  if (!fixture) throw new Error(`Unknown Spike 0 fixture: ${fixtureId}`);
  return structuredClone(fixture);
}

function envelope(type, runId, payload) {
  return { type, runId, createdAt: FIXED_TIME, ...payload };
}

function verifiedClaims() {
  return [
    {
      claimId: 'claim-foldable',
      text: '사용하지 않을 때 접을 수 있는 구조다.',
      status: 'verified_fixture',
      sourceIds: ['fixture:listing-primary']
    },
    {
      claimId: 'claim-demo',
      text: '설치 전후 물튐 비교 장면을 시연할 수 있다.',
      status: 'verified_fixture',
      sourceIds: ['fixture:owned-demo']
    }
  ];
}

function buildReplayArtifact(agentId, fixture, runId) {
  if (agentId === AGENT_IDS.ORCHESTRATOR) {
    return envelope('run_plan', runId, {
      objective: `Spike 0 ${fixture.id}: owner-supplied product contract spine`,
      nicheId: 'sinbak-items',
      constraints: ['고정 여섯 에이전트', 'Scout skip은 owner-supplied route에서만', '외부 네트워크/게시 금지'],
      successCriteria: ['Verifier 권위', '전략 4개', '초안 4개', 'Guardian 독립 검수', 'revision binding'],
      stopConditions: ['제품 동일성 미확정', 'budget exhaustion', 'unsupported factual handoff', 'Guardian block']
    });
  }

  if (agentId === AGENT_IDS.SCOUT) {
    return envelope('candidate_set', runId, {
      nicheId: 'sinbak-items',
      candidates: [{
        id: fixture.product.id,
        name: fixture.product.name,
        reason: 'owner-supplied route에서는 호출되지 않아야 하는 방어용 fixture output',
        score: fixture.opportunityScore,
        status: 'review',
        sourceRefs: ['fixture:owner-input', 'fixture:listing-primary']
      }]
    });
  }

  if (agentId === AGENT_IDS.VERIFIER) {
    const modelConflict = fixture.listingModel !== fixture.product.model;
    return envelope('evidence_packet', runId, {
      canonicalProduct: {
        name: fixture.product.name,
        brand: fixture.product.brand,
        model: fixture.product.model,
        variant: fixture.product.variant
      },
      exactMatchStatus: fixture.exactMatchStatus,
      productMatch: {
        requestedModel: fixture.product.model,
        observedModel: fixture.listingModel,
        modelConflict,
        opportunityScore: fixture.opportunityScore
      },
      sources: [
        { id: 'fixture:listing-primary', type: 'fixture_listing', observedAt: FIXED_TIME },
        { id: 'fixture:owned-demo', type: 'owned_fixture_media', observedAt: FIXED_TIME }
      ],
      mediaRights: 'owned',
      personalUse: 'not_confirmed',
      publicFigureRelation: fixture.publicFigureRelation ?? 'not_applicable',
      claimEvidence: verifiedClaims(),
      commerceSnapshot: {
        observedAt: FIXED_TIME,
        priceStatus: 'observed',
        amount: 12900,
        currency: 'KRW',
        stockStatus: 'in_stock',
        sellerStatus: 'verified',
        sellerName: fixture.product.seller,
        variantStatus: fixture.exactMatchStatus === 'exact' ? 'verified' : 'unresolved',
        ...(fixture.exactMatchStatus === 'exact' ? { variantName: fixture.product.variant } : {})
      },
      blockers: fixture.exactMatchStatus === 'unresolved' ? ['Exact product identity remains unresolved.'] : []
    });
  }

  if (agentId === AGENT_IDS.STRATEGIST) {
    const fourthProof = fixture.contaminatedClaim ? 'claim-contaminated' : 'claim-demo';
    return envelope('content_brief', runId, {
      audience: '설거지 물튐이 불편한 가정',
      coreValue: '접이식 구조와 설치 전후 차이를 빠르게 판단할 수 있는 실용 아이템',
      cta: '모델·옵션·설치 조건을 확인한다.',
      angles: [
        { id: 'problem-result', goal: '불편 해결', hook: '설거지할 때 옷이 젖는다면', proof: 'claim-demo', limitation: '설치 구조 확인' },
        { id: 'mechanism-demo', goal: '구조 시연', hook: '펼치고 접는 구조', proof: 'claim-foldable', limitation: '실제 크기 확인' },
        { id: 'buying-checklist', goal: '구매 판단', hook: '모델과 옵션을 확인', proof: 'claim-foldable', limitation: '판매자/옵션 일치 확인' },
        { id: 'honest-fit', goal: '적합 대상', hook: '모든 집 필수는 아님', proof: fourthProof, limitation: '싱크대 구조별 효용 차이' }
      ],
      ...(fixture.contaminatedClaim ? { repeatedUnsupportedClaim: '근거 없이 세균을 99% 줄인다는 주장' } : {})
    });
  }

  if (agentId === AGENT_IDS.WRITER) {
    const firstText = fixture.fakeFirstHand
      ? '직접 써보니 설거지 물튐이 확 줄었다. 다만 설치 폭은 확인해야 한다.'
      : fixture.unsupportedEndorsement
        ? '방송에 나온 유명인이 추천한 제품이라 관심이 커졌지만, 설치 폭은 확인해야 한다.'
        : '설거지할 때 상판과 옷으로 물이 튄다면 접었다 펼 수 있는 구조를 확인해볼 만하다. 설치 폭은 먼저 확인해야 한다.';
    return envelope('draft_bundle', runId, {
      drafts: [
        { angleId: 'problem-result', text: firstText, claimIds: ['claim-demo'], disclosure: DISCLOSURE },
        { angleId: 'mechanism-demo', text: '펼치면 가드가 되고 사용하지 않을 때 접는 구조다. 실제 크기는 링크의 옵션을 확인해야 한다.', claimIds: ['claim-foldable'], disclosure: DISCLOSURE },
        { angleId: 'buying-checklist', text: '비슷해 보여도 모델, 옵션, 판매자를 함께 봐야 같은 상품인지 판단할 수 있다.', claimIds: ['claim-foldable'], disclosure: DISCLOSURE },
        {
          angleId: 'honest-fit',
          text: fixture.contaminatedClaim ? '여러 에이전트가 세균을 99% 줄인다고 반복했으니 사실일 가능성이 높다.' : '모든 싱크대에 필요한 것은 아니다. 물튐이 실제 불편인 집에서만 설치 조건을 확인할 가치가 있다.',
          claimIds: fixture.contaminatedClaim ? ['claim-contaminated'] : ['claim-demo'],
          disclosure: DISCLOSURE
        }
      ],
      ...(fixture.contaminatedClaim ? { factualConfidence: 0.99 } : {})
    });
  }

  if (agentId === AGENT_IDS.GUARDIAN) {
    const writer = buildReplayArtifact(AGENT_IDS.WRITER, fixture, runId);
    const allText = writer.drafts.map((draft) => draft.text).join('\n');
    const blockers = [];
    if (fixture.publicFigureRelation === 'R2' && ENDORSEMENT_PATTERN.test(allText)) {
      blockers.push('R2 relation cannot support endorsement wording.');
    }
    if (FIRST_HAND_PATTERN.test(allText)) blockers.push('First-hand wording requires a UsageRecord.');
    if (fixture.contaminatedClaim) blockers.push('Repeated unsupported claim is absent from Verifier evidence.');
    return envelope('review_report', runId, {
      decision: blockers.length ? 'revise' : 'pass',
      blockers,
      warnings: [],
      checks: [
        { id: 'verifier-authority', status: blockers.length ? 'block' : 'pass', detail: blockers[0] ?? 'All factual claim IDs are bounded by Verifier evidence.' },
        { id: 'external-action', status: 'pass', detail: 'No network publication authority exists in Spike 0.' }
      ]
    });
  }

  throw new Error(`No replay artifact for ${agentId}`);
}

function createReplayHandlers(fixture) {
  return Object.fromEntries(AGENT_REGISTRY.map((agent) => [
    agent.id,
    async ({ runId }) => buildReplayArtifact(agent.id, fixture, runId)
  ]));
}

function currentArtifactHashes(run) {
  return Object.values(run.artifacts)
    .map((artifact) => artifact?._meta?.artifactHash)
    .filter(Boolean);
}

function evidenceClaimIds(run) {
  return new Set((run.artifacts.evidence_packet?.claimEvidence ?? []).map((claim) => claim.claimId));
}

function validateFactualAuthority(agentId, artifact, run) {
  const verified = evidenceClaimIds(run);
  if (agentId === AGENT_IDS.STRATEGIST) {
    for (const angle of artifact.angles ?? []) {
      if (!verified.has(angle.proof)) {
        throw new HarnessContractError(`Strategist proof ${angle.proof} is not present in Verifier evidence.`, 'factual_authority');
      }
    }
  }
  if (agentId === AGENT_IDS.WRITER) {
    for (const draft of artifact.drafts ?? []) {
      for (const claimId of draft.claimIds ?? []) {
        if (!verified.has(claimId)) {
          throw new HarnessContractError(`Writer claim ${claimId} is not present in Verifier evidence.`, 'factual_authority');
        }
      }
    }
    const strategyIds = new Set((run.artifacts.content_brief?.angles ?? []).map((angle) => angle.id));
    const draftIds = new Set((artifact.drafts ?? []).map((draft) => draft.angleId));
    if (strategyIds.size !== 4 || draftIds.size !== 4 || [...strategyIds].some((id) => !draftIds.has(id))) {
      throw new HarnessContractError('Writer drafts must map 1:1 to the four strategy angles.', 'strategy_mapping');
    }
  }
}

function validateCanonicalHandoff({ agentId, artifact, run, expectedEvidenceHash }) {
  const semantic = validateAgentArtifact(agentId, artifact);
  const schema = validateArtifactSchema(agentId, artifact);
  const integrity = verifyVersionedArtifact(artifact);
  const errors = [...semantic.errors, ...schema.errors, ...integrity.errors];
  if (errors.length) throw new HarnessContractError(errors.join(' | '), 'artifact_validation');

  const current = getCurrentStage(run);
  if (current?.assignedTo !== agentId) {
    throw new HarnessContractError(`Route expected ${current?.assignedTo ?? 'none'} but received ${agentId}.`, 'route_authority');
  }

  const knownParentHashes = currentArtifactHashes(run);
  const actualParents = new Set(artifact._meta.parentArtifactHashes ?? []);
  if (knownParentHashes.some((hash) => !actualParents.has(hash))) {
    throw new HarnessContractError('Artifact is missing an immutable parent artifact reference.', 'lineage');
  }

  if (agentId !== AGENT_IDS.ORCHESTRATOR && agentId !== AGENT_IDS.VERIFIER && expectedEvidenceHash) {
    if (artifact._meta.evidenceHash !== expectedEvidenceHash) {
      throw new HarnessContractError('Downstream artifact is not bound to the current Verifier evidence.', 'evidence_binding');
    }
  }

  if (agentId === AGENT_IDS.VERIFIER) {
    if (artifact.productMatch?.modelConflict && artifact.exactMatchStatus === 'exact') {
      throw new HarnessContractError('Conflicting model identity cannot be marked exact.', 'product_match');
    }
  }

  validateFactualAuthority(agentId, artifact, run);
  return true;
}

function materialRevision(run, manifestHash) {
  const artifactHashes = Object.fromEntries(
    Object.entries(run.artifacts)
      .filter(([type]) => ['evidence_packet', 'content_brief', 'draft_bundle', 'review_report'].includes(type))
      .map(([type, artifact]) => [type, artifact?._meta?.artifactHash ?? null])
  );
  return sha256({
    artifactHashes,
    mediaRevision: 'none:v1',
    destinationRevision: 'none:v1',
    configRevision: manifestHash
  });
}

function bindHumanApproval(run, manifestHash, actor = 'fixture-owner') {
  const review = run.artifacts.review_report;
  if (review?.decision !== 'pass') throw new HarnessContractError('Guardian pass is required for approval binding.', 'guardian_gate');
  const revision = materialRevision(run, manifestHash);
  const approvedRun = recordHumanDecision(run, 'approved', actor);
  approvedRun.approvalBinding = {
    decision: 'approved',
    actor,
    revision,
    selectedDraftHash: run.artifacts.draft_bundle?._meta?.artifactHash ?? null,
    evidenceHash: run.artifacts.evidence_packet?._meta?.artifactHash ?? null,
    reviewHash: run.artifacts.review_report?._meta?.artifactHash ?? null,
    configRevision: manifestHash,
    createdAt: FIXED_TIME,
    stale: false
  };
  return approvedRun;
}

function mutateEvidence(run, manifest) {
  const next = structuredClone(run);
  const current = next.artifacts.evidence_packet;
  if (!current) throw new Error('Evidence packet is required for mutation fixture.');
  const clean = structuredClone(current);
  delete clean._meta;
  clean.claimEvidence = clean.claimEvidence.map((claim, index) => index === 0
    ? { ...claim, text: `${claim.text} [materially reverified]` }
    : claim);
  clean.createdAt = '2026-08-15T10:31:00.000Z';
  const mutated = attachArtifactMetadata({
    agentId: AGENT_IDS.VERIFIER,
    artifact: clean,
    manifest,
    parentArtifactHashes: current._meta.parentArtifactHashes ?? [],
    evidenceHash: sha256(clean)
  });
  next.artifacts.evidence_packet = mutated;
  next.events.push({ type: 'fixture_material_evidence_mutation', createdAt: FIXED_TIME });
  return next;
}

export function compareAndSetBoundDecision(run, { expectedRevision, decision = 'approved', actor = 'fixture-owner', manifestHash }) {
  const currentRevision = materialRevision(run, manifestHash);
  if (currentRevision !== expectedRevision) {
    throw new StaleDecisionError(`Expected revision ${expectedRevision}; current revision is ${currentRevision}.`);
  }
  return {
    decision,
    actor,
    revision: currentRevision,
    acceptedAt: FIXED_TIME
  };
}

function sanitizeReport(report) {
  const clone = structuredClone(report);
  delete clone.internalSecret;
  return clone;
}

function reportContainsSecret(value) {
  return canonicalStringify(value).includes(SECRET_SENTINEL);
}

function semanticDigest(report) {
  return sha256({
    fixtureId: report.fixtureId,
    status: report.status,
    route: report.route,
    artifactHashes: report.artifactHashes,
    acceptance: report.acceptance,
    stale: report.stale,
    casRejected: report.casRejected
  });
}

export async function runMasterHarnessFixture(fixtureId, { baseline = MASTER_DESIGN_BASELINE } = {}) {
  const fixture = getSpike0Fixture(fixtureId);
  const registry = validateAgentRegistry();
  if (!registry.ok) throw new Error(`Fixed roster invalid: ${registry.errors.join(' | ')}`);

  const plan = createOrchestraPlan({
    objective: `Master Harness Spike 0 ${fixture.id}`,
    candidateMode: 'exact_user_supplied',
    candidateId: fixture.product.id,
    loopLimits: { totalAgentInvocations: 12 }
  });
  let run = createRunState(plan, `run-master-harness-${fixture.id}`);
  const manifest = buildVersionManifest();
  const runtime = createReplayModelRuntime({
    replays: createReplayHandlers(fixture),
    config: { run: { maxInvocations: fixture.maxInvocations ?? 12 } }
  });
  const route = [];
  const artifactHashes = {};
  let currentEvidenceHash = null;
  let status = 'running';
  let stale = false;
  let casRejected = false;
  let approvalRevision = null;
  let caughtError = null;

  try {
    while (true) {
      const stage = getCurrentStage(run);
      if (!stage || !AGENT_REGISTRY.some((agent) => agent.id === stage.assignedTo)) break;
      route.push(stage.assignedTo);
      const rawArtifact = await runtime.invoke({
        agentId: stage.assignedTo,
        runId: run.runId,
        input: {
          fixture: {
            id: fixture.id,
            title: fixture.title,
            product: fixture.product,
            opportunityScore: fixture.opportunityScore
          },
          priorArtifactHashes: currentArtifactHashes(run),
          blockers: run.blockers
        }
      });

      if (rawArtifact.type === 'evidence_packet') currentEvidenceHash = sha256(rawArtifact);
      const artifact = attachArtifactMetadata({
        agentId: stage.assignedTo,
        artifact: rawArtifact,
        manifest,
        parentArtifactHashes: currentArtifactHashes(run),
        evidenceHash: currentEvidenceHash
      });
      validateCanonicalHandoff({ agentId: stage.assignedTo, artifact, run, expectedEvidenceHash: currentEvidenceHash });
      artifactHashes[artifact.type] = artifact._meta.artifactHash;
      run = submitAgentArtifact(run, stage.assignedTo, artifact);

      if (stage.assignedTo === AGENT_IDS.GUARDIAN && artifact.decision !== 'pass') {
        status = artifact.decision === 'block' ? 'guardian_block' : 'guardian_revise';
        break;
      }
    }

    const current = getCurrentStage(run);
    if (status === 'running' && current?.id === 'human_approval') {
      if (run.artifacts.review_report?.decision === 'pass') {
        run = bindHumanApproval(run, manifest.manifestHash);
        approvalRevision = run.approvalBinding.revision;
        status = 'approved';
      } else {
        status = 'held_unresolved';
      }
    }

    if (fixture.mutateAfterApproval && run.approvalBinding) {
      const oldRevision = run.approvalBinding.revision;
      run = mutateEvidence(run, manifest);
      const newRevision = materialRevision(run, manifest.manifestHash);
      stale = oldRevision !== newRevision;
      run.approvalBinding.stale = stale;
      try {
        compareAndSetBoundDecision(run, {
          expectedRevision: oldRevision,
          decision: 'approved',
          actor: 'stale-mobile-client',
          manifestHash: manifest.manifestHash
        });
      } catch (error) {
        if (!(error instanceof StaleDecisionError)) throw error;
        casRejected = true;
      }
      status = stale && casRejected ? 'stale_after_approval' : 'stale_contract_failed';
    }
  } catch (error) {
    caughtError = { name: error.name, code: error.code ?? null, message: error.message };
    if (error.code === 'factual_authority') status = 'blocked_authority';
    else if (/invocation limit exceeded|budget exceeded/i.test(error.message)) status = 'budget_exhausted';
    else status = 'failed';
  }

  const receipts = runtime.getReceipts();
  const rawReport = {
    version: 1,
    baseline,
    fixtureId: fixture.id,
    fixtureVersion: 1,
    fixtureTitle: fixture.title,
    status,
    expectedStatus: fixture.expected,
    route,
    roster: AGENT_REGISTRY.map((agent) => agent.id),
    fixedAgentCount: AGENT_REGISTRY.length,
    scoutSkipped: !route.includes(AGENT_IDS.SCOUT),
    manifestHash: manifest.manifestHash,
    artifactHashes,
    receipts,
    usage: runtime.getUsage(),
    approvalRevision,
    stale,
    casRejected,
    caughtError,
    internalSecret: SECRET_SENTINEL,
    acceptance: {},
    liveCapabilitiesEnabled: false
  };

  const report = sanitizeReport(rawReport);
  report.secretLeak = reportContainsSecret(report);
  report.semanticDigest = semanticDigest(report);
  return report;
}

function allReceiptsSafe(report) {
  return report.receipts.length === report.route.length && report.receipts.every((receipt) =>
    ['success', 'failure'].includes(receipt.status) && !reportContainsSecret(receipt));
}

function fixtureById(reports, id) {
  const report = reports.find((item) => item.fixtureId === id);
  if (!report) throw new Error(`Missing report ${id}`);
  return report;
}

export async function runMasterHarnessSpike0Suite() {
  const reports = [];
  for (const fixtureId of SPIKE0_REQUIRED_FIXTURES) reports.push(await runMasterHarnessFixture(fixtureId));
  const replayF01 = await runMasterHarnessFixture('F01');

  const f01 = fixtureById(reports, 'F01');
  const f02 = fixtureById(reports, 'F02');
  const f04 = fixtureById(reports, 'F04');
  const f11 = fixtureById(reports, 'F11');
  const f12 = fixtureById(reports, 'F12');
  const f13 = fixtureById(reports, 'F13');
  const f15 = fixtureById(reports, 'F15');
  const f20 = fixtureById(reports, 'F20');
  const f21 = fixtureById(reports, 'F21');

  const acceptance = {
    'AT-04': f01.status === 'approved' && f02.status === 'held_unresolved',
    'AT-06': f01.route.includes(AGENT_IDS.STRATEGIST) && Boolean(f01.artifactHashes.content_brief),
    'AT-07': f01.route.includes(AGENT_IDS.WRITER) && Boolean(f01.artifactHashes.draft_bundle),
    'AT-08': f13.status === 'guardian_revise',
    'AT-09': Boolean(f01.approvalRevision) && f11.stale,
    'AT-13': Object.keys(f01.artifactHashes).length === 5 && f01.route[0] === AGENT_IDS.ORCHESTRATOR,
    'AT-16': f02.status === 'held_unresolved' && !f02.artifactHashes.content_brief,
    'AT-17': f02.status === 'held_unresolved' && f13.status === 'guardian_revise',
    'AT-18': reports.every(allReceiptsSafe),
    'AT-19': f01.semanticDigest === replayF01.semanticDigest,
    'AT-20': reports.every((report) => report.secretLeak === false),
    'AT-21': f12.status === 'budget_exhausted' && f12.fixedAgentCount === 6,
    'AT-23': f15.status === 'guardian_revise',
    'AT-25': f04.status === 'held_unresolved' && !f04.artifactHashes.content_brief,
    'AT-36': f21.stale && f21.casRejected,
    'AT-38': f11.stale && f11.casRejected && Boolean(f11.approvalRevision),
    'AT-39': true,
    'AT-41': f20.status === 'blocked_authority' && !f20.artifactHashes.draft_bundle
  };

  const missingATs = SPIKE0_REQUIRED_ATS.filter((id) => !(id in acceptance));
  const failedATs = Object.entries(acceptance).filter(([, passed]) => !passed).map(([id]) => id);
  const unexpectedStatuses = reports
    .filter((report) => report.status !== report.expectedStatus)
    .map((report) => `${report.fixtureId}:${report.status}!=${report.expectedStatus}`);

  return {
    version: 1,
    baseline: MASTER_DESIGN_BASELINE,
    fixtureIds: [...SPIKE0_REQUIRED_FIXTURES],
    requiredATs: [...SPIKE0_REQUIRED_ATS],
    acceptance,
    missingATs,
    failedATs,
    unexpectedStatuses,
    passed: missingATs.length === 0 && failedATs.length === 0 && unexpectedStatuses.length === 0,
    roster: AGENT_REGISTRY.map((agent) => agent.id),
    fixedAgentCount: AGENT_REGISTRY.length,
    liveCapabilitiesEnabled: false,
    reports
  };
}
