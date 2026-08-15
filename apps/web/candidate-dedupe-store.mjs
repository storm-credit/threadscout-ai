import { AtomicJsonApplicationStore, ApplicationCommandError, VersionConflictError, toTodayReadModel } from './application-state.mjs';
import { LockedAtomicJsonApplicationStore } from './locked-application-store.mjs';
import {
  assessCandidateDuplicate,
  candidateIdentitySignature,
  DUPLICATE_STATES,
  uniqueDuplicateAssessment
} from './candidate-dedupe.mjs';
import { sha256 } from '../../packages/orchestra/src/versioning.mjs';

const MAX_COMMAND_HISTORY = 100;
const DUPLICATE_BLOCKER_PREFIX = '유사 후보 확인 필요:';

function nowIso(clock) {
  return (clock?.() ?? new Date()).toISOString();
}

function cleanString(value, { max = 1000, required = false, label = 'value' } = {}) {
  const text = String(value ?? '').trim().replace(/\u0000/g, '');
  if (required && !text) throw new ApplicationCommandError(`${label} is required.`, { code: 'invalid_input', statusCode: 422 });
  return text.slice(0, max);
}

function commandFingerprint(request) {
  return sha256({
    command: request.command,
    candidateId: request.candidateId ?? null,
    expectedRevision: request.expectedRevision ?? null,
    payload: request.payload ?? {}
  });
}

function normalizeRequest(request) {
  return {
    ...request,
    requestId: cleanString(request?.requestId, { required: true, max: 160, label: 'requestId' }),
    command: cleanString(request?.command, { required: true, max: 80, label: 'command' }),
    candidateId: request?.candidateId ?? null,
    payload: request?.payload && typeof request.payload === 'object' ? request.payload : {}
  };
}

function replayFromHistory(state, request, today) {
  const prior = state.commandHistory?.[request.requestId];
  if (!prior) return null;
  if (prior.fingerprint !== commandFingerprint(request)) {
    throw new ApplicationCommandError('requestId was already used for a different command.', { code: 'idempotency_key_reused', statusCode: 409 });
  }
  return {
    result: prior.result,
    candidateId: prior.responseCandidateId ?? prior.candidateId ?? null,
    duplicateAssessment: prior.duplicateAssessment ?? null,
    idempotentReplay: true,
    today
  };
}

function recordExtendedCommand(state, request, response) {
  state.commandHistory ??= {};
  state.commandOrder ??= [];
  state.commandHistory[request.requestId] = {
    fingerprint: commandFingerprint(request),
    command: request.command,
    candidateId: request.candidateId ?? null,
    responseCandidateId: response.candidateId ?? null,
    result: response.result ?? 'ok',
    duplicateAssessment: response.duplicateAssessment ?? null,
    recordedAt: state.updatedAt
  };
  state.commandOrder = [...state.commandOrder.filter((id) => id !== request.requestId), request.requestId].slice(-MAX_COMMAND_HISTORY);
  const keep = new Set(state.commandOrder);
  for (const id of Object.keys(state.commandHistory)) if (!keep.has(id)) delete state.commandHistory[id];
}

function duplicateBlocker(assessment) {
  const match = assessment.matchedCandidate;
  const identity = [match?.brand, match?.model, match?.variant].filter(Boolean).join(' · ');
  return `${DUPLICATE_BLOCKER_PREFIX} ${match?.name ?? match?.candidateId ?? '기존 후보'}${identity ? ` (${identity})` : ''}`;
}

function suppressedBlocker(assessment) {
  return `중복 후보로 억제됨: ${assessment.matchedCandidate?.name ?? assessment.matchedCandidate?.candidateId ?? '기존 후보'}`;
}

function decorateCandidateReadModel(readCandidate, stateCandidate) {
  return {
    ...readCandidate,
    duplicateAssessment: structuredClone(stateCandidate?.duplicateAssessment ?? uniqueDuplicateAssessment(null, stateCandidate))
  };
}

function activeCandidates(state) {
  return state.candidates.filter((candidate) => candidate.workflowState !== 'suppressed_duplicate');
}

function selectInboxCandidates(candidates) {
  const pending = candidates
    .filter((candidate) => candidate.workflowState === 'duplicate_review')
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
  const pendingIds = new Set(pending.map((candidate) => candidate.id));
  const remainder = candidates
    .filter((candidate) => !pendingIds.has(candidate.id))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
  return [...pending, ...remainder].slice(0, 5);
}

function todayFromState(state) {
  const active = activeCandidates(state);
  const fullBase = toTodayReadModel({ ...state, candidates: active });
  const selected = selectInboxCandidates(active);
  const selectedBase = toTodayReadModel({ ...state, candidates: selected });
  const byId = new Map(state.candidates.map((candidate) => [candidate.id, candidate]));

  fullBase.candidates = selectedBase.candidates.map((candidate) => decorateCandidateReadModel(candidate, byId.get(candidate.id)));
  fullBase.counters.observed = state.candidates.length;
  fullBase.counters.recommended = active.filter((candidate) =>
    candidate.evidenceReadiness === 'ready' && !['duplicate_review', 'held', 'rejected', 'blocked'].includes(candidate.workflowState)
  ).length;
  fullBase.counters.duplicateReview = state.candidates.filter((candidate) => candidate.workflowState === 'duplicate_review').length;
  fullBase.counters.duplicateSuppressed = state.candidates.filter((candidate) => candidate.workflowState === 'suppressed_duplicate').length;
  fullBase.capability = {
    ...fullBase.capability,
    persistence: 'server_atomic_json_local_interprocess_locked',
    persistenceScope: 'single_host_local_filesystem',
    crossProcessWriteSerialization: true,
    duplicateGuardrail: 'deterministic_exact_plus_human_reviewed_possible_duplicate'
  };
  return fullBase;
}

function assertExpectedRevision(candidate, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) {
    throw new ApplicationCommandError('expectedRevision is required for candidate mutation.', { code: 'expected_revision_required', statusCode: 409 });
  }
  if (candidate.revision !== expectedRevision) throw new VersionConflictError(candidate, expectedRevision);
}

function getCandidate(state, candidateId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new ApplicationCommandError('Candidate not found.', { code: 'not_found', statusCode: 404 });
  return candidate;
}

function normalWorkflowAfterDistinct(candidate) {
  if (candidate.evidenceReadiness === 'ready') return 'evidence_ready';
  if (candidate.evidenceReadiness === 'partial') return 'evidence_partial';
  return 'verification_needed';
}

function resolvePossibleDuplicate(state, request, clock) {
  const candidate = getCandidate(state, request.candidateId);
  assertExpectedRevision(candidate, request.expectedRevision);
  if (candidate.duplicateAssessment?.state !== DUPLICATE_STATES.POSSIBLE || candidate.workflowState !== 'duplicate_review') {
    throw new ApplicationCommandError('Candidate does not have a pending duplicate review.', {
      code: 'duplicate_review_not_pending',
      statusCode: 422,
      details: { candidateId: candidate.id, workflowState: candidate.workflowState, duplicateState: candidate.duplicateAssessment?.state ?? 'unique' }
    });
  }

  const decision = cleanString(request.payload?.decision, { required: true, max: 32, label: 'decision' });
  if (!['distinct', 'duplicate'].includes(decision)) {
    throw new ApplicationCommandError('Duplicate resolution decision must be distinct or duplicate.', { code: 'invalid_input', statusCode: 422 });
  }

  const at = nowIso(clock);
  const identitySignature = candidateIdentitySignature(candidate);
  candidate.duplicateAssessment = {
    ...candidate.duplicateAssessment,
    state: decision === 'distinct' ? DUPLICATE_STATES.CONFIRMED_DISTINCT : DUPLICATE_STATES.CONFIRMED_DUPLICATE,
    resolvedAt: at,
    resolution: decision,
    candidateIdentitySignature: identitySignature,
    resolvedIdentitySignature: identitySignature
  };
  candidate.revision += 1;
  candidate.updatedAt = at;

  if (decision === 'distinct') {
    candidate.workflowState = normalWorkflowAfterDistinct(candidate);
    candidate.blockers = candidate.blockers.filter((blocker) => !blocker.startsWith(DUPLICATE_BLOCKER_PREFIX));
    if (!candidate.blockers.length && candidate.evidenceReadiness === 'weak') candidate.blockers = ['사용자 제공 제품 근거를 확인해야 합니다.'];
    candidate.audit.push({ event: 'duplicate_review_resolved_distinct', at, revision: candidate.revision, matchedCandidateId: candidate.duplicateAssessment.matchedCandidate?.candidateId ?? null });
  } else {
    candidate.workflowState = 'suppressed_duplicate';
    candidate.blockers = [suppressedBlocker(candidate.duplicateAssessment)];
    candidate.audit.push({ event: 'candidate_suppressed_duplicate', at, revision: candidate.revision, matchedCandidateId: candidate.duplicateAssessment.matchedCandidate?.candidateId ?? null });
  }
  candidate.audit = candidate.audit.slice(-60);

  state.updatedAt = at;
  state.audit.push({ event: decision === 'distinct' ? 'duplicate_candidate_confirmed_distinct' : 'duplicate_candidate_suppressed', candidateId: candidate.id, matchedCandidateId: candidate.duplicateAssessment.matchedCandidate?.candidateId ?? null, at });
  state.audit = state.audit.slice(-200);

  return {
    result: decision === 'distinct' ? 'duplicate_resolved_distinct' : 'candidate_duplicate_suppressed',
    candidateId: candidate.id,
    revision: candidate.revision,
    duplicateAssessment: structuredClone(candidate.duplicateAssessment)
  };
}

function assertDuplicateReviewDoesNotGetBypassed(state, request) {
  if (request.command !== 'review_decision') return;
  const candidate = getCandidate(state, request.candidateId);
  if (candidate.workflowState !== 'duplicate_review') return;
  throw new ApplicationCommandError('Resolve the possible duplicate before hold/reject/approval decisions.', {
    code: 'duplicate_review_required',
    statusCode: 422,
    details: {
      candidateId: candidate.id,
      duplicateAssessment: candidate.duplicateAssessment
    }
  });
}

function shouldReassessAfterIdentityMutation(candidate) {
  if (candidate.duplicateAssessment?.state !== DUPLICATE_STATES.CONFIRMED_DISTINCT) return true;
  const resolved = candidate.duplicateAssessment.resolvedIdentitySignature;
  return !resolved || resolved !== candidateIdentitySignature(candidate);
}

function applyPostVerificationDedupe(state, candidate, clock) {
  if (!shouldReassessAfterIdentityMutation(candidate)) return null;
  const checkedAt = nowIso(clock);
  const assessment = assessCandidateDuplicate(
    candidate,
    state.candidates.filter((item) => item.id !== candidate.id),
    { checkedAt }
  );
  candidate.duplicateAssessment = assessment;

  if (assessment.state === DUPLICATE_STATES.EXACT_SUPPRESSED) {
    candidate.workflowState = 'suppressed_duplicate';
    candidate.blockers = [suppressedBlocker(assessment)];
    candidate.audit.push({ event: 'candidate_suppressed_duplicate_after_identity_change', at: checkedAt, revision: candidate.revision, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null });
    state.audit.push({ event: 'candidate_exact_duplicate_suppressed_after_verification', candidateId: candidate.id, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null, at: checkedAt });
    return {
      result: 'candidate_duplicate_suppressed',
      candidateId: candidate.id,
      duplicateAssessment: assessment
    };
  }

  if (assessment.state === DUPLICATE_STATES.POSSIBLE) {
    candidate.workflowState = 'duplicate_review';
    candidate.blockers = [duplicateBlocker(assessment), ...candidate.blockers.filter((blocker) => !blocker.startsWith(DUPLICATE_BLOCKER_PREFIX))];
    candidate.audit.push({ event: 'duplicate_review_reopened_after_identity_change', at: checkedAt, revision: candidate.revision, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null, similarity: assessment.similarity });
    state.audit.push({ event: 'possible_duplicate_detected_after_verification', candidateId: candidate.id, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null, at: checkedAt });
    return {
      result: 'candidate_verification_possible_duplicate',
      candidateId: candidate.id,
      duplicateAssessment: assessment
    };
  }

  candidate.blockers = candidate.blockers.filter((blocker) => !blocker.startsWith(DUPLICATE_BLOCKER_PREFIX));
  return null;
}

export class CandidateDedupeApplicationStore extends LockedAtomicJsonApplicationStore {
  async readToday() {
    return todayFromState(await this.readState());
  }

  async execute(rawRequest) {
    return this.withWriteLock(async () => {
      const request = normalizeRequest(rawRequest);
      let state = await this.readState();
      const replay = replayFromHistory(state, request, todayFromState(state));
      if (replay) return replay;

      if (request.command === 'resolve_duplicate') {
        const response = resolvePossibleDuplicate(state, request, this.clock);
        recordExtendedCommand(state, request, response);
        await this.persist(state);
        return { ...response, idempotentReplay: false, today: todayFromState(state) };
      }

      assertDuplicateReviewDoesNotGetBypassed(state, request);

      if (request.command !== 'add_manual_candidate') {
        const response = await AtomicJsonApplicationStore.prototype.execute.call(this, request);
        state = await this.readState();

        if (request.command === 'request_verification') {
          const candidate = getCandidate(state, request.candidateId);
          const dedupeResponse = applyPostVerificationDedupe(state, candidate, this.clock);
          if (dedupeResponse) {
            state.updatedAt = nowIso(this.clock);
            state.audit = state.audit.slice(-200);
            recordExtendedCommand(state, request, dedupeResponse);
            await this.persist(state);
            return { ...dedupeResponse, revision: candidate.revision, idempotentReplay: false, today: todayFromState(state) };
          }
          await this.persist(state);
        }

        return { ...response, today: todayFromState(state) };
      }

      const baseResponse = await AtomicJsonApplicationStore.prototype.execute.call(this, request);
      state = await this.readState();
      const candidate = state.candidates.find((item) => item.id === baseResponse.candidateId);
      if (!candidate) throw new Error('New candidate missing after add_manual_candidate.');

      const checkedAt = nowIso(this.clock);
      const assessment = assessCandidateDuplicate(candidate, state.candidates.filter((item) => item.id !== candidate.id), { checkedAt });

      if (assessment.state === DUPLICATE_STATES.EXACT_SUPPRESSED) {
        state.candidates = state.candidates.filter((item) => item.id !== candidate.id);
        state.updatedAt = checkedAt;
        state.audit.push({
          event: 'candidate_exact_duplicate_suppressed',
          attemptedCandidateId: candidate.id,
          matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null,
          at: checkedAt
        });
        state.audit = state.audit.slice(-200);
        const response = {
          result: 'candidate_duplicate_suppressed',
          candidateId: assessment.matchedCandidate?.candidateId ?? null,
          duplicateAssessment: assessment
        };
        recordExtendedCommand(state, request, response);
        await this.persist(state);
        return { ...response, idempotentReplay: false, today: todayFromState(state) };
      }

      candidate.duplicateAssessment = assessment;
      if (assessment.state === DUPLICATE_STATES.POSSIBLE) {
        candidate.workflowState = 'duplicate_review';
        candidate.blockers = [duplicateBlocker(assessment), ...candidate.blockers.filter((blocker) => !blocker.startsWith(DUPLICATE_BLOCKER_PREFIX))];
        candidate.audit.push({ event: 'duplicate_review_required', at: checkedAt, revision: candidate.revision, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null, similarity: assessment.similarity });
        state.audit.push({ event: 'possible_duplicate_detected', candidateId: candidate.id, matchedCandidateId: assessment.matchedCandidate?.candidateId ?? null, at: checkedAt });
      }
      state.updatedAt = checkedAt;
      state.audit = state.audit.slice(-200);

      const response = {
        result: assessment.state === DUPLICATE_STATES.POSSIBLE ? 'candidate_added_possible_duplicate' : 'candidate_added',
        candidateId: candidate.id,
        duplicateAssessment: assessment
      };
      recordExtendedCommand(state, request, response);
      await this.persist(state);
      return { ...response, idempotentReplay: false, today: todayFromState(state) };
    });
  }
}
