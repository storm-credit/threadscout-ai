import { AGENT_IDS, AGENT_REGISTRY, getAgentById, validateAgentRegistry } from '../../packages/orchestra/src/agent-registry.mjs';
import { sha256 } from '../../packages/orchestra/src/versioning.mjs';
import { ApplicationCommandError } from './application-state.mjs';

const SPECIALIST_BY_COMMAND = Object.freeze({
  request_verification: AGENT_IDS.VERIFIER,
  request_strategies: AGENT_IDS.STRATEGIST,
  request_drafts: AGENT_IDS.WRITER,
  run_guardian: AGENT_IDS.GUARDIAN
});

const HUMAN_COMMANDS = new Set(['review_decision']);
const DETERMINISTIC_COMMANDS = new Set(['reset_demo', 'add_manual_candidate', 'edit_draft']);

function candidateFromToday(today, candidateId) {
  return today?.candidates?.find((candidate) => candidate.id === candidateId) ?? null;
}

function allowedStates(command) {
  return {
    request_verification: new Set(['verification_needed', 'evidence_partial', 'evidence_ready', 'strategy_ready', 'draft_ready', 'guardian_revise', 'guardian_pass', 'approved', 'stale', 'blocked']),
    request_strategies: new Set(['evidence_ready', 'stale']),
    request_drafts: new Set(['strategy_ready']),
    run_guardian: new Set(['draft_ready', 'guardian_revise'])
  }[command] ?? null;
}

function specialistFor(command) {
  return SPECIALIST_BY_COMMAND[command] ?? null;
}

function validateSpecialistRoute(command, today, request) {
  const specialistId = specialistFor(command);
  if (!specialistId) return null;

  const registry = validateAgentRegistry();
  if (!registry.ok || AGENT_REGISTRY.length !== 6) {
    throw new ApplicationCommandError('Fixed six-agent registry is invalid.', {
      code: 'agent_registry_invalid',
      statusCode: 500,
      details: { errors: registry.errors }
    });
  }

  const specialist = getAgentById(specialistId);
  if (!specialist || specialist.kind !== 'specialist') {
    throw new ApplicationCommandError(`Specialist ${specialistId} is unavailable.`, { code: 'specialist_unavailable', statusCode: 500 });
  }
  if (!specialist.handoffTo?.every((target) => target === AGENT_IDS.ORCHESTRATOR)) {
    throw new ApplicationCommandError(`${specialistId} does not return control to Orchestrator.`, { code: 'route_authority_invalid', statusCode: 500 });
  }

  const candidate = candidateFromToday(today, request.candidateId);
  if (!candidate) {
    throw new ApplicationCommandError('Candidate not found for specialist dispatch.', { code: 'not_found', statusCode: 404 });
  }
  const states = allowedStates(command);
  if (states && !states.has(candidate.workflowState)) {
    throw new ApplicationCommandError(`Orchestrator cannot dispatch ${specialistId} from ${candidate.workflowState}.`, {
      code: 'route_not_allowed',
      statusCode: 422,
      details: { command, specialistId, workflowState: candidate.workflowState, nextAction: candidate.nextAction }
    });
  }

  if (command === 'request_strategies' && candidate.workflowState === 'stale') {
    if (candidate.evidenceReadiness !== 'ready' || candidate.exactMatchStatus !== 'exact') {
      throw new ApplicationCommandError('Stale candidate must be reverified before strategy regeneration.', {
        code: 'stale_reverification_required',
        statusCode: 422,
        details: { evidenceReadiness: candidate.evidenceReadiness, exactMatchStatus: candidate.exactMatchStatus }
      });
    }
  }

  return { specialistId, candidate };
}

function buildReceipt({ request, specialistId = null, status, beforeRevision = null, afterRevision = null, errorCode = null }) {
  const route = specialistId
    ? [AGENT_IDS.ORCHESTRATOR, specialistId, AGENT_IDS.ORCHESTRATOR]
    : HUMAN_COMMANDS.has(request.command)
      ? [AGENT_IDS.ORCHESTRATOR, 'human_approval', AGENT_IDS.ORCHESTRATOR]
      : [AGENT_IDS.ORCHESTRATOR, 'deterministic_application_service', AGENT_IDS.ORCHESTRATOR];

  return {
    receiptVersion: 1,
    supervisedBy: AGENT_IDS.ORCHESTRATOR,
    specialistId,
    command: request.command,
    candidateId: request.candidateId ?? null,
    requestFingerprint: sha256({
      requestId: request.requestId,
      command: request.command,
      candidateId: request.candidateId ?? null,
      expectedRevision: request.expectedRevision ?? null
    }),
    route,
    beforeRevision,
    afterRevision,
    status,
    errorCode,
    liveProviderUsed: false,
    externalPublishingEnabled: false
  };
}

async function finalizeStaleStrategyRecovery(store, request, beforeCandidate) {
  if (request.command !== 'request_strategies' || beforeCandidate?.workflowState !== 'stale') return null;

  const state = await store.readState();
  const candidate = state.candidates.find((item) => item.id === request.candidateId);
  if (!candidate?.strategies?.angles || candidate.strategies.angles.length !== 4) {
    throw new ApplicationCommandError('Strategist output missing during stale recovery.', {
      code: 'stale_recovery_failed',
      statusCode: 500
    });
  }

  candidate.workflowState = 'strategy_ready';
  candidate.blockers = [];
  candidate.review = null;
  candidate.revision += 1;
  candidate.updatedAt = new Date().toISOString();
  candidate.audit ??= [];
  candidate.audit.push({
    event: 'orchestrator_stale_recovery_completed',
    at: candidate.updatedAt,
    revision: candidate.revision,
    from: 'stale',
    to: 'strategy_ready'
  });
  candidate.audit = candidate.audit.slice(-60);
  state.updatedAt = candidate.updatedAt;
  state.audit ??= [];
  state.audit.push({ event: 'orchestrator_stale_recovery_completed', candidateId: candidate.id, at: candidate.updatedAt, revision: candidate.revision });
  state.audit = state.audit.slice(-200);
  await store.persist(state);
  return store.readToday();
}

export class ManualProductOrchestratorService {
  constructor({ store }) {
    if (!store || typeof store.readToday !== 'function' || typeof store.execute !== 'function' || typeof store.readState !== 'function' || typeof store.persist !== 'function') {
      throw new Error('ManualProductOrchestratorService requires the server application store.');
    }
    this.store = store;
  }

  async execute(request) {
    const todayBefore = await this.store.readToday();
    const beforeCandidate = request.candidateId ? candidateFromToday(todayBefore, request.candidateId) : null;
    let dispatch = null;

    try {
      dispatch = validateSpecialistRoute(request.command, todayBefore, request);
      if (!dispatch && !HUMAN_COMMANDS.has(request.command) && !DETERMINISTIC_COMMANDS.has(request.command)) {
        throw new ApplicationCommandError(`Command is not registered with Orchestrator: ${request.command}`, {
          code: 'orchestrator_command_unknown',
          statusCode: 400
        });
      }

      const response = await this.store.execute(request);
      const recoveredToday = await finalizeStaleStrategyRecovery(this.store, request, beforeCandidate);
      if (recoveredToday) response.today = recoveredToday;
      const afterCandidate = request.candidateId ? candidateFromToday(response.today, request.candidateId) : null;
      return {
        ...response,
        orchestrationReceipt: buildReceipt({
          request,
          specialistId: dispatch?.specialistId ?? null,
          status: 'success',
          beforeRevision: beforeCandidate?.revision ?? null,
          afterRevision: afterCandidate?.revision ?? null
        })
      };
    } catch (error) {
      error.orchestrationReceipt = buildReceipt({
        request,
        specialistId: dispatch?.specialistId ?? specialistFor(request.command),
        status: 'failure',
        beforeRevision: beforeCandidate?.revision ?? null,
        afterRevision: beforeCandidate?.revision ?? null,
        errorCode: error.code ?? 'unknown_error'
      });
      throw error;
    }
  }
}
