// Orchestrator service for the manual candidate approval slice.
//
// Every stage goes through the same shape: build a request from server-held state,
// invoke exactly one specialist, wrap the result in a handoff envelope, and refuse
// it unless all four gates pass (HANDOFF_VALIDATION_RULES.md).
//
// The Orchestrator owns run state. Specialists receive immutable inputs and return
// artifacts; they never call one another (AGENT_HANDOFFS.md section 1).

import {
  ARTIFACT_TYPES,
  DOWNSTREAM_ARTIFACTS,
  RUN_STAGES,
  RUN_STATUSES,
  assertTransition,
  computeApprovalBinding,
  createApprovalRecord,
  createHandoff,
  earliestAffectedStage,
  hashArtifact,
  validateHandoff,
  verifyClaimedBinding
} from '../../core/src/index.mjs';

import { AGENT_IDS } from '../../core/src/handoff.mjs';
import { runVerifier } from './agents/verifier.mjs';
import { runStrategist } from './agents/strategist.mjs';
import { runWriter } from './agents/writer.mjs';
import { runGuardian } from './agents/guardian.mjs';
import { scoutSkipRecord } from './agents/scout.mjs';

export class PipelineError extends Error {
  constructor(message, { code, gate = null, details = [] } = {}) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
    this.gate = gate;
    this.details = details;
  }
}

/** Retry budgets from AGENT_CONTRACTS.md "Retry budgets". */
export const RETRY_BUDGETS = Object.freeze({
  verifierReEvaluation: 1,
  writerRevision: 2,
  totalSpecialistCalls: 12
});

function cloneRecord(record) {
  return structuredClone(record);
}

function event(type, payload, clock) {
  return { type, payload, at: clock() };
}

/**
 * Drop artifacts that a change upstream just invalidated, and route the run back to
 * the earliest affected stage. Nothing downstream is allowed to survive quietly.
 */
function invalidateDownstream(record, changedArtifactType, clock, reason) {
  const affected = DOWNSTREAM_ARTIFACTS[changedArtifactType] ?? [];
  const dropped = [];

  for (const artifactType of affected) {
    if (artifactType === 'human_decision') {
      // The approval is not deleted: the owner did decide once, and hiding that
      // would misrepresent the history. It is re-evaluated as stale instead.
      continue;
    }
    if (record.artifacts[artifactType]) {
      delete record.artifacts[artifactType];
      dropped.push(artifactType);
    }
  }

  if (dropped.length > 0) {
    const target = earliestAffectedStage(dropped) ?? RUN_STAGES.VERIFICATION;
    record.stage = target;
    record.status = RUN_STATUSES.STALE;
    record.events.push(event('artifacts_invalidated', { changedArtifactType, dropped, reason, routedTo: target }, clock));
  }
  return dropped;
}

function buildContext(record) {
  const evidencePacket = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET] ?? null;
  const contentBrief = record.artifacts[ARTIFACT_TYPES.CONTENT_BRIEF] ?? null;
  // Owner edits are part of the current truth, so gates compare against the
  // effective bundle rather than the bundle as the Writer first produced it.
  const draftBundle = effectiveDraftBundle(record);

  return {
    currentStage: record.stage,
    knownSourceIds: (record.evidenceInput?.sources ?? []).map((source) => source.id),
    evidencePacket,
    contentBrief,
    draftBundle,
    evidencePacketHash: evidencePacket ? hashArtifact(evidencePacket) : null,
    contentBriefHash: contentBrief ? hashArtifact(contentBrief) : null,
    draftBundleHash: draftBundle ? hashArtifact(draftBundle) : null
  };
}

/**
 * Accept a specialist result: gate it, then commit it to run state.
 * A failed gate leaves the run exactly where it was.
 */
function acceptHandoff(record, agentId, result, deps) {
  const { clock, nextId } = deps;
  const handoff = createHandoff({
    runId: record.runId,
    handoffId: nextId('handoff'),
    from: agentId,
    artifact: result.artifact,
    createdAt: clock(),
    requestedNextAction: result.requestedNextAction,
    status: result.status
  });

  const gateResult = validateHandoff(handoff, result.artifact, buildContext(record));
  record.events.push(
    event('handoff_evaluated', {
      from: agentId,
      artifactType: result.artifact.type,
      gate: gateResult.gate,
      ok: gateResult.ok,
      requestedNextAction: result.requestedNextAction
    }, clock)
  );

  if (!gateResult.ok) {
    throw new PipelineError('핸드오프가 ' + gateResult.gate + ' 게이트에서 거절되었습니다.', {
      code: 'handoff_rejected',
      gate: gateResult.gate,
      details: gateResult.errors
    });
  }

  record.artifacts[result.artifact.type] = result.artifact;
  record.specialistCalls += 1;
  record.handoffs.push(handoff);
  return handoff;
}

function assertBudget(record) {
  if (record.specialistCalls >= RETRY_BUDGETS.totalSpecialistCalls) {
    throw new PipelineError('이 실행의 에이전트 호출 예산을 모두 사용했습니다.', {
      code: 'budget_exhausted'
    });
  }
}

/** Create the candidate record for an owner-supplied product (USER_FLOWS.md Flow B). */
export function createCandidateRecord(input, deps) {
  const { clock, nextId } = deps;
  const now = clock();

  return {
    candidateId: nextId('cand'),
    runId: nextId('run'),
    name: input.name,
    contentLane: input.contentLane,
    whyNow: input.whyNow,
    readerValue: input.readerValue,
    opportunityScore: input.opportunityScore,
    scoreBreakdown: input.scoreBreakdown ?? {},
    suppressed: false,

    // The Orchestrator may skip Scout for a concrete owner-supplied product, but the
    // skip is recorded rather than implied.
    scoutSkip: scoutSkipRecord(clock),

    stage: RUN_STAGES.VERIFICATION,
    status: RUN_STATUSES.NEEDS_EVIDENCE,
    version: 1,
    specialistCalls: 0,
    revisionCounts: { writerRevision: 0, verifierReEvaluation: 0 },

    evidenceInput: input.evidence,
    artifacts: {},
    handoffs: [],
    draftEdits: {},
    selectedDraftId: null,
    approval: null,

    createdAt: now,
    updatedAt: now,
    events: [
      {
        type: 'run_created',
        payload: { mode: 'owner_supplied_product', scoutSkipped: true },
        at: now
      }
    ]
  };
}

export function verify(recordInput, deps) {
  const record = cloneRecord(recordInput);
  assertBudget(record);

  if (record.stage !== RUN_STAGES.VERIFICATION) {
    // Re-verification is always allowed; it invalidates everything downstream.
    record.stage = RUN_STAGES.VERIFICATION;
    record.revisionCounts.verifierReEvaluation += 1;
  }

  const result = runVerifier(
    {
      runId: record.runId,
      candidate: record,
      evidence: record.evidenceInput,
      inputArtifactRefs: []
    },
    deps
  );

  const previousHash = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET]
    ? hashArtifact(record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET])
    : null;

  acceptHandoff(record, AGENT_IDS.VERIFIER, result, deps);

  const newHash = hashArtifact(result.artifact);
  if (previousHash && previousHash !== newHash) {
    invalidateDownstream(record, ARTIFACT_TYPES.EVIDENCE_PACKET, deps.clock, 'evidence_changed');
  }

  const decision = result.artifact.verifierDecision;
  if (decision === 'reject') {
    record.status = RUN_STATUSES.BLOCKED;
  } else if (decision === 'hold') {
    record.status = RUN_STATUSES.NEEDS_EVIDENCE;
  } else {
    record.status = RUN_STATUSES.RUNNING;
  }

  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

export function strategize(recordInput, deps) {
  const record = cloneRecord(recordInput);
  assertBudget(record);

  const evidencePacket = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET];
  if (!evidencePacket) {
    throw new PipelineError('전략을 만들기 전에 근거 확인이 끝나야 합니다.', { code: 'stage_out_of_order' });
  }
  if (['hold', 'reject'].includes(evidencePacket.verifierDecision)) {
    // AT-25: a high score never unlocks this.
    throw new PipelineError('검증 결과가 ' + evidencePacket.verifierDecision + ' 상태라 전략 생성이 잠겨 있습니다.', {
      code: 'evidence_not_ready',
      details: evidencePacket.unresolvedQuestions ?? []
    });
  }

  assertTransition(RUN_STAGES.VERIFICATION, RUN_STAGES.STRATEGY);
  record.stage = RUN_STAGES.STRATEGY;

  let result;
  try {
    result = runStrategist({ runId: record.runId, candidate: record, evidencePacket }, deps);
  } catch (error) {
    record.stage = RUN_STAGES.VERIFICATION;
    throw new PipelineError(error.message, { code: 'strategy_failed', details: error.detail ?? [] });
  }

  acceptHandoff(record, AGENT_IDS.STRATEGIST, result, deps);
  record.status = RUN_STATUSES.RUNNING;
  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

export function draft(recordInput, deps) {
  const record = cloneRecord(recordInput);
  assertBudget(record);

  const evidencePacket = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET];
  const contentBrief = record.artifacts[ARTIFACT_TYPES.CONTENT_BRIEF];
  if (!contentBrief) throw new PipelineError('초안을 쓰기 전에 관점 네 개가 있어야 합니다.', { code: 'stage_out_of_order' });

  if (record.stage === RUN_STAGES.GUARDIAN_REVIEW) {
    if (record.revisionCounts.writerRevision >= RETRY_BUDGETS.writerRevision) {
      record.status = RUN_STATUSES.PARTIAL;
      throw new PipelineError('수정 횟수 한도에 도달했습니다. 직접 판단이 필요합니다.', {
        code: 'revision_budget_exhausted'
      });
    }
    record.revisionCounts.writerRevision += 1;
  }

  record.stage = RUN_STAGES.DRAFTING;

  const result = runWriter({ runId: record.runId, candidate: record, evidencePacket, contentBrief }, deps);
  acceptHandoff(record, AGENT_IDS.WRITER, result, deps);

  // A fresh bundle replaces earlier owner edits and any prior review.
  record.draftEdits = {};
  record.selectedDraftId = result.artifact.drafts[0].draftId;
  delete record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT];

  record.status = RUN_STATUSES.RUNNING;
  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

/** The draft bundle with owner edits applied — what Guardian and approval actually see. */
export function effectiveDraftBundle(record) {
  const bundle = record.artifacts[ARTIFACT_TYPES.DRAFT_BUNDLE];
  if (!bundle) return null;
  if (Object.keys(record.draftEdits ?? {}).length === 0) return bundle;

  const edited = structuredClone(bundle);
  edited.drafts = edited.drafts.map((item) => {
    const patch = record.draftEdits[item.draftId];
    return patch ? { ...item, ...patch } : item;
  });
  return edited;
}

/**
 * Owner edit of a draft.
 *
 * The edit invalidates the Guardian review deliberately: a review of text that no
 * longer exists is worse than no review (REVIEW_BINDING_SPEC.md).
 */
export function editDraft(recordInput, { draftId, patch }, deps) {
  const record = cloneRecord(recordInput);
  const bundle = record.artifacts[ARTIFACT_TYPES.DRAFT_BUNDLE];
  if (!bundle) throw new PipelineError('수정할 초안이 없습니다.', { code: 'stage_out_of_order' });

  const target = bundle.drafts.find((item) => item.draftId === draftId);
  if (!target) throw new PipelineError('존재하지 않는 초안입니다: ' + draftId, { code: 'unknown_draft' });

  const allowed = ['hook', 'body', 'caution', 'cta', 'disclosure'];
  const clean = {};
  for (const key of allowed) {
    if (typeof patch?.[key] === 'string') clean[key] = patch[key];
  }
  if (Object.keys(clean).length === 0) {
    throw new PipelineError('수정할 내용이 없습니다.', { code: 'empty_edit' });
  }

  record.draftEdits[draftId] = { ...(record.draftEdits[draftId] ?? {}), ...clean };
  record.events.push(event('draft_edited', { draftId, fields: Object.keys(clean) }, deps.clock));

  if (record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT]) {
    delete record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT];
    record.stage = RUN_STAGES.DRAFTING;
    record.status = RUN_STATUSES.STALE;
    record.events.push(event('review_invalidated', { reason: 'draft_edited' }, deps.clock));
  }

  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

export function review(recordInput, deps) {
  const record = cloneRecord(recordInput);
  assertBudget(record);

  const evidencePacket = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET];
  const contentBrief = record.artifacts[ARTIFACT_TYPES.CONTENT_BRIEF];
  const draftBundle = effectiveDraftBundle(record);
  if (!draftBundle) throw new PipelineError('검수 전에 초안 네 개가 있어야 합니다.', { code: 'stage_out_of_order' });

  record.stage = RUN_STAGES.GUARDIAN_REVIEW;

  const result = runGuardian(
    { runId: record.runId, candidate: record, evidencePacket, contentBrief, draftBundle },
    deps
  );

  // Guardian binds the text it reviewed, edits included, so a later edit is detectable.
  acceptHandoff(record, AGENT_IDS.GUARDIAN, result, deps);

  const decision = result.artifact.decision;
  if (decision === 'pass') {
    assertTransition(RUN_STAGES.GUARDIAN_REVIEW, RUN_STAGES.HUMAN_REVIEW);
    record.stage = RUN_STAGES.HUMAN_REVIEW;
    record.status = RUN_STATUSES.RUNNING;
  } else if (decision === 'revise') {
    assertTransition(RUN_STAGES.GUARDIAN_REVIEW, RUN_STAGES.DRAFTING);
    record.stage = RUN_STAGES.DRAFTING;
    record.status = RUN_STATUSES.RUNNING;
  } else {
    record.status = RUN_STATUSES.BLOCKED;
  }

  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

/** Binding for the currently selected draft, computed from server-held artifacts only. */
export function currentBinding(record) {
  const evidencePacket = record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET];
  const bundle = effectiveDraftBundle(record);
  if (!evidencePacket || !bundle) return null;

  const draft = bundle.drafts.find((item) => item.draftId === record.selectedDraftId) ?? bundle.drafts[0];
  return computeApprovalBinding({
    evidencePacket,
    draft,
    mediaRights: evidencePacket.mediaRights ?? [],
    affiliateMapping: record.affiliateMapping ?? null
  });
}

export function selectDraft(recordInput, draftId, deps) {
  const record = cloneRecord(recordInput);
  const bundle = effectiveDraftBundle(record);
  if (!bundle?.drafts.some((item) => item.draftId === draftId)) {
    throw new PipelineError('존재하지 않는 초안입니다: ' + draftId, { code: 'unknown_draft' });
  }
  record.selectedDraftId = draftId;
  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

/**
 * Record the owner's decision.
 *
 * Three things must hold, and each maps to an acceptance criterion:
 *   - Guardian must have passed (AT-08: a block is not overridable);
 *   - the claimed binding must match the current server binding (AT-36);
 *   - the approval stores the server-computed binding, never the claim (AT-38).
 */
export function decide(recordInput, { decision, actor, claimedBinding, note = null }, deps) {
  const record = cloneRecord(recordInput);
  const reviewReport = record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT];

  if (decision === 'approve' || decision === 'edit_and_approve') {
    if (record.stage !== RUN_STAGES.HUMAN_REVIEW) {
      throw new PipelineError('Guardian 검수를 통과한 뒤에만 승인할 수 있습니다.', { code: 'not_at_human_review' });
    }
    if (reviewReport?.decision !== 'pass') {
      throw new PipelineError('Guardian 결정(' + (reviewReport?.decision ?? '없음') + ')은 사람 승인으로 뒤집을 수 없습니다.', {
        code: 'guardian_not_passed',
        details: reviewReport?.nonOverridableBlockers ?? []
      });
    }

    const binding = currentBinding(record);
    const check = verifyClaimedBinding(claimedBinding, binding);
    if (!check.ok) {
      throw new PipelineError('승인하려는 내용이 최신본이 아닙니다. 바뀐 항목을 확인한 뒤 다시 결정해 주세요.', {
        code: check.reason,
        details: check.changed.map((item) => item.label)
      });
    }

    record.approval = createApprovalRecord({
      approvalId: deps.nextId('approval'),
      actor,
      decision,
      approvedAt: deps.clock(),
      binding,
      draftId: record.selectedDraftId,
      note
    });
    record.stage = RUN_STAGES.COMPLETED;
    record.status = RUN_STATUSES.COMPLETED;
  } else if (decision === 'hold') {
    record.approval = null;
    record.status = RUN_STATUSES.HELD;
  } else if (decision === 'reject') {
    record.approval = null;
    record.status = RUN_STATUSES.REJECTED;
    record.stage = RUN_STAGES.COMPLETED;
  } else {
    throw new PipelineError('지원하지 않는 결정입니다: ' + decision, { code: 'unsupported_decision' });
  }

  record.events.push(event('human_decision', { decision, actor, draftId: record.selectedDraftId }, deps.clock));
  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}

/** Replace owner evidence, which re-opens verification and invalidates everything after it. */
export function updateEvidence(recordInput, evidenceInput, deps) {
  const record = cloneRecord(recordInput);
  record.evidenceInput = evidenceInput;
  record.events.push(event('evidence_updated', { sources: (evidenceInput.sources ?? []).length }, deps.clock));
  invalidateDownstream(record, ARTIFACT_TYPES.CANDIDATE_SET, deps.clock, 'evidence_input_changed');
  delete record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET];
  record.stage = RUN_STAGES.VERIFICATION;
  record.status = RUN_STATUSES.NEEDS_EVIDENCE;
  record.updatedAt = deps.clock();
  record.version += 1;
  return record;
}
