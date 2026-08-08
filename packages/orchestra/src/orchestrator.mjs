import {
  AGENT_IDS,
  AGENT_REGISTRY,
  DETERMINISTIC_SERVICES,
  getAgentById,
  validateAgentRegistry
} from './agent-registry.mjs';
import { validateAgentArtifact } from './contracts.mjs';

export const RUN_STAGE_IDS = Object.freeze({
  INTAKE: 'intake',
  DISCOVERY: 'discovery',
  VERIFICATION: 'verification',
  STRATEGY: 'strategy',
  DRAFTING: 'drafting',
  REVIEW: 'review',
  HUMAN_APPROVAL: 'human_approval',
  LOCAL_QUEUE: 'local_queue'
});

export const DEFAULT_LOOP_LIMITS = Object.freeze({
  scoutRefinement: 1,
  writerRevision: 2,
  totalAgentInvocations: 12
});

function stage(id, label, assignedTo, requiredOutput, options = {}) {
  return {
    id,
    label,
    assignedTo,
    requiredOutput,
    supervisedBy: AGENT_IDS.ORCHESTRATOR,
    skippable: false,
    ...options
  };
}

function stageIndex(plan, stageId) {
  return plan.stages.findIndex((item) => item.id === stageId);
}

export function createOrchestraPlan({
  objective,
  candidateMode = 'discover',
  candidateId = null,
  riskProfile = 'standard',
  loopLimits = DEFAULT_LOOP_LIMITS
} = {}) {
  if (typeof objective !== 'string' || objective.trim().length === 0) {
    throw new Error('A non-empty objective is required.');
  }

  const registryValidation = validateAgentRegistry();
  if (!registryValidation.ok) {
    throw new Error(`Invalid agent registry: ${registryValidation.errors.join(' | ')}`);
  }

  const exactCandidateProvided = candidateMode === 'exact_user_supplied' && Boolean(candidateId);
  const stages = [
    stage(RUN_STAGE_IDS.INTAKE, '목표·제약·성공조건 확정', AGENT_IDS.ORCHESTRATOR, 'run_plan'),
    stage(RUN_STAGE_IDS.DISCOVERY, '제품 후보 발굴', AGENT_IDS.SCOUT, 'candidate_set', {
      skippable: true,
      skipped: exactCandidateProvided,
      skipReason: exactCandidateProvided ? '사용자가 정확한 제품 후보를 지정함' : null
    }),
    stage(RUN_STAGE_IDS.VERIFICATION, '제품·근거·권리 검증', AGENT_IDS.VERIFIER, 'evidence_packet'),
    stage(RUN_STAGE_IDS.STRATEGY, '독자·가치·4개 관점 설계', AGENT_IDS.STRATEGIST, 'content_brief'),
    stage(RUN_STAGE_IDS.DRAFTING, 'Threads 초안 4개 작성', AGENT_IDS.WRITER, 'draft_bundle'),
    stage(RUN_STAGE_IDS.REVIEW, '사실·중복·고지·정책 최종 검수', AGENT_IDS.GUARDIAN, 'review_report'),
    stage(RUN_STAGE_IDS.HUMAN_APPROVAL, '사용자 최종 승인', 'human', 'human_decision'),
    stage(RUN_STAGE_IDS.LOCAL_QUEUE, '승인된 글만 로컬 대기열 등록', 'scheduler', 'queue_record')
  ];

  return {
    version: 1,
    objective: objective.trim(),
    candidateMode,
    candidateId,
    riskProfile,
    fixedAgentCount: AGENT_REGISTRY.length,
    roster: AGENT_REGISTRY.map((agent) => agent.id),
    loopLimits: { ...DEFAULT_LOOP_LIMITS, ...loopLimits },
    stages,
    deterministicServices: DETERMINISTIC_SERVICES.map((service) => service.id),
    externalPublishingEnabled: false
  };
}

export function validateOrchestraPlan(plan) {
  const errors = [];
  const agentIds = new Set(AGENT_REGISTRY.map((agent) => agent.id));

  if (plan.fixedAgentCount !== 6 || plan.roster?.length !== 6) {
    errors.push('Plan must use the fixed six-agent roster.');
  }
  if (new Set(plan.roster ?? []).size !== 6) errors.push('Plan roster must contain six unique agents.');
  if (plan.roster?.some((id) => !agentIds.has(id))) errors.push('Plan contains an unknown agent.');
  if (!plan.stages?.some((item) => item.id === RUN_STAGE_IDS.HUMAN_APPROVAL)) {
    errors.push('Human approval gate is required.');
  }
  const approvalIndex = stageIndex(plan, RUN_STAGE_IDS.HUMAN_APPROVAL);
  const queueIndex = stageIndex(plan, RUN_STAGE_IDS.LOCAL_QUEUE);
  if (approvalIndex < 0 || queueIndex < 0 || approvalIndex >= queueIndex) {
    errors.push('Human approval must occur before queueing.');
  }
  if (plan.externalPublishingEnabled !== false) errors.push('External publishing must remain disabled.');

  for (const item of plan.stages ?? []) {
    if (agentIds.has(item.assignedTo) && !getAgentById(item.assignedTo)) {
      errors.push(`Unknown assigned agent: ${item.assignedTo}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function createRunState(plan, runId = `run-${Date.now()}`) {
  const validation = validateOrchestraPlan(plan);
  if (!validation.ok) throw new Error(`Invalid orchestra plan: ${validation.errors.join(' | ')}`);

  return {
    runId,
    plan,
    status: 'ready',
    cursor: 0,
    artifacts: {},
    blockers: [],
    invocationCounts: Object.fromEntries(plan.roster.map((id) => [id, 0])),
    revisionCounts: { scoutRefinement: 0, writerRevision: 0 },
    humanDecision: null,
    events: [{ type: 'run_created', createdAt: new Date().toISOString() }]
  };
}

export function getCurrentStage(run) {
  let cursor = run.cursor;
  while (run.plan.stages[cursor]?.skipped) cursor += 1;
  return run.plan.stages[cursor] ?? null;
}

function totalAgentInvocations(run) {
  return Object.values(run.invocationCounts).reduce((sum, count) => sum + count, 0);
}

function routeUnresolvedVerification(next, artifact) {
  const discovery = next.plan.stages[stageIndex(next.plan, RUN_STAGE_IDS.DISCOVERY)];
  const blockers = artifact.blockers?.length
    ? [...artifact.blockers]
    : ['Exact product identity remains unresolved.'];

  if (!discovery.skipped && next.revisionCounts.scoutRefinement < next.plan.loopLimits.scoutRefinement) {
    next.revisionCounts.scoutRefinement += 1;
    next.cursor = stageIndex(next.plan, RUN_STAGE_IDS.DISCOVERY);
    next.status = 'refinement_requested';
    next.blockers = blockers;
    next.events.push({
      type: 'scout_refinement_requested',
      reason: blockers.join(' | '),
      createdAt: new Date().toISOString()
    });
  } else {
    next.cursor = stageIndex(next.plan, RUN_STAGE_IDS.HUMAN_APPROVAL);
    next.status = 'needs_human_decision';
    next.blockers = blockers;
    next.events.push({
      type: 'verification_escalated_to_human',
      reason: blockers.join(' | '),
      createdAt: new Date().toISOString()
    });
  }
}

export function submitAgentArtifact(run, agentId, artifact) {
  const current = getCurrentStage(run);
  if (!current) throw new Error('Run has no remaining stage.');
  if (current.assignedTo !== agentId) {
    throw new Error(`Expected ${current.assignedTo} at ${current.id}; received ${agentId}.`);
  }
  if (artifact?.runId !== run.runId) {
    throw new Error(`Artifact runId ${artifact?.runId ?? 'missing'} does not match ${run.runId}.`);
  }
  if (totalAgentInvocations(run) >= run.plan.loopLimits.totalAgentInvocations) {
    throw new Error('Total agent invocation limit reached.');
  }

  const validation = validateAgentArtifact(agentId, artifact);
  if (!validation.ok) throw new Error(`Invalid ${agentId} artifact: ${validation.errors.join(' | ')}`);

  const next = structuredClone(run);
  next.artifacts[artifact.type] = artifact;
  next.invocationCounts[agentId] += 1;
  next.cursor = stageIndex(run.plan, current.id) + 1;
  next.status = 'running';
  next.blockers = [];
  next.events.push({ type: 'agent_stage_completed', agentId, stageId: current.id, createdAt: new Date().toISOString() });

  if (agentId === AGENT_IDS.VERIFIER && artifact.exactMatchStatus === 'unresolved') {
    routeUnresolvedVerification(next, artifact);
    return next;
  }

  if (agentId === AGENT_IDS.GUARDIAN) {
    if (artifact.decision === 'block') {
      next.status = 'blocked';
      next.blockers = [...artifact.blockers];
    } else if (artifact.decision === 'revise') {
      if (next.revisionCounts.writerRevision >= next.plan.loopLimits.writerRevision) {
        next.status = 'needs_human_decision';
        next.blockers = ['Writer revision limit reached.', ...artifact.blockers];
      } else {
        next.revisionCounts.writerRevision += 1;
        next.cursor = stageIndex(run.plan, RUN_STAGE_IDS.DRAFTING);
        next.status = 'revision_requested';
        next.blockers = [...artifact.blockers];
      }
    }
  }

  return next;
}

export function recordHumanDecision(run, decision, actor = 'user') {
  const current = getCurrentStage(run);
  if (current?.id !== RUN_STAGE_IDS.HUMAN_APPROVAL) {
    throw new Error('Human decision is only valid at the human approval stage.');
  }
  if (!['approved', 'rejected', 'held'].includes(decision)) {
    throw new Error('Human decision must be approved, rejected, or held.');
  }

  const guardianReport = run.artifacts.review_report;
  if (decision === 'approved' && guardianReport?.decision !== 'pass') {
    throw new Error('Human approval cannot bypass a guardian revise or block decision.');
  }

  const next = structuredClone(run);
  next.humanDecision = { decision, actor, createdAt: new Date().toISOString() };
  next.events.push({ type: 'human_decision', decision, actor, createdAt: new Date().toISOString() });

  if (decision === 'approved') {
    next.cursor = stageIndex(run.plan, RUN_STAGE_IDS.LOCAL_QUEUE);
    next.status = 'approved_for_local_queue';
  } else {
    next.status = decision;
  }

  return next;
}

export function completeLocalQueue(run, queueRecord) {
  const current = getCurrentStage(run);
  if (current?.id !== RUN_STAGE_IDS.LOCAL_QUEUE) throw new Error('Run is not at the local queue stage.');
  if (run.humanDecision?.decision !== 'approved') throw new Error('Human approval is required before queueing.');
  if (queueRecord?.publishingEnabled !== false) throw new Error('External publishing must remain disabled.');

  const next = structuredClone(run);
  next.artifacts.queue_record = queueRecord;
  next.cursor = run.plan.stages.length;
  next.status = 'completed_local_only';
  next.events.push({ type: 'local_queue_completed', createdAt: new Date().toISOString() });
  return next;
}
