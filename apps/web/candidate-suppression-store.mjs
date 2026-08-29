// AT-14 / PR-14 owner suppression, layered over the dedupe store.
//
// Layering: AtomicJsonApplicationStore -> Locked -> CandidateDedupe -> Suppression.
// Nothing in `candidate-dedupe*.mjs` is modified; duplicate suppression and owner suppression
// stay independently readable, reversible and reason-coded (PRE_IMPLEMENTATION_TRAPS).
//
// Suppression stamps are DERIVED and recomputed on every read, so a rule expiry takes effect
// without a write and no stamp can drift from the rule set. Only two things are durable owner
// facts rather than derivations: the rule set itself, and a candidate's `exempt` flag from
// `복원`. Both are written inside the existing write lock.

import { randomUUID } from 'node:crypto';
import { ApplicationCommandError, VersionConflictError } from './application-state.mjs';
import { CandidateDedupeApplicationStore } from './candidate-dedupe-store.mjs';
import {
  assessSuppression,
  createSuppressionRule,
  inactiveSuppression,
  isSuppressionAxis,
  candidateAxisValue,
  normalizeSuppressionText,
  suppressionBlocker,
  SUPPRESSION_AXES
} from './candidate-suppression.mjs';

const SUPPRESSION_BLOCKER_PREFIX = '사용자가 억제한';
const MAX_SUPPRESSION_RULES = 200;
const SUPPRESSION_COMMANDS = new Set(['suppress_candidate', 'restore_candidate', 'remove_suppression_rule']);

function nowIso(clock) {
  return (clock?.() ?? new Date()).toISOString();
}

function cleanString(value, { max = 300, required = false, label = 'value' } = {}) {
  const text = String(value ?? '').trim().replace(/\u0000/g, '');
  if (required && !text) {
    throw new ApplicationCommandError(`${label} is required.`, { code: 'invalid_input', statusCode: 422 });
  }
  return text.slice(0, max);
}

function getCandidate(state, candidateId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new ApplicationCommandError('Candidate not found.', { code: 'not_found', statusCode: 404 });
  return candidate;
}

function assertExpectedRevision(candidate, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) {
    throw new ApplicationCommandError('expectedRevision is required for candidate mutation.', {
      code: 'expected_revision_required',
      statusCode: 409
    });
  }
  if (candidate.revision !== expectedRevision) throw new VersionConflictError(candidate, expectedRevision);
}

function ensureRules(state) {
  if (!Array.isArray(state.suppressionRules)) state.suppressionRules = [];
  return state.suppressionRules;
}

function withoutSuppressionBlockers(blockers = []) {
  return blockers.filter((blocker) => !String(blocker).startsWith(SUPPRESSION_BLOCKER_PREFIX));
}

// Recompute every candidate's suppression stamp from the rule set. Idempotent: it strips the
// suppression blocker it previously added before deciding whether to add one again.
// `selectFirstScreen` reads only this stamp, which is what keeps the ranking module free of any
// dependency on this file.
export function applySuppressionToState(state, { at = null } = {}) {
  const rules = ensureRules(state);
  for (const candidate of state.candidates) {
    const next = assessSuppression(candidate, rules, { at });
    next.label = next.active ? suppressionBlocker(next) : null;
    candidate.suppression = next;

    const base = withoutSuppressionBlockers(candidate.blockers ?? []);
    candidate.blockers = next.active ? [next.label, ...base] : base;
  }
  return state;
}

function suppressionRuleReadModel(rule, state) {
  const matchedCandidateCount = state.candidates.filter((candidate) =>
    (candidate.suppression?.matchedRuleIds ?? []).includes(rule.id)
  ).length;
  return {
    id: rule.id,
    axis: rule.axis,
    value: rule.displayValue || rule.value,
    normalizedValue: rule.value,
    reason: rule.reason,
    createdAt: rule.createdAt,
    expiresAt: rule.expiresAt ?? null,
    matchedCandidateCount
  };
}

function suppressCandidate(state, request, clock) {
  const candidate = getCandidate(state, request.candidateId);
  assertExpectedRevision(candidate, request.expectedRevision);

  const axis = cleanString(request.payload?.axis, { required: true, max: 32, label: 'axis' });
  if (!isSuppressionAxis(axis)) {
    throw new ApplicationCommandError(`Suppression axis must be one of: ${SUPPRESSION_AXES.join(', ')}.`, {
      code: 'invalid_input',
      statusCode: 422,
      details: { axis, allowed: SUPPRESSION_AXES }
    });
  }

  // The rule value defaults to the candidate's own value on that axis, which is the only thing a
  // one-tap control on a candidate card can mean. An explicit value is accepted so the same command
  // can create a rule broader than the candidate that prompted it.
  const requestedValue = cleanString(request.payload?.value, { max: 160 });
  const value = requestedValue || candidateAxisValue(candidate, axis);
  if (!normalizeSuppressionText(value)) {
    throw new ApplicationCommandError(`This candidate has no ${axis} value to suppress on.`, {
      code: 'suppression_axis_empty',
      statusCode: 422,
      details: { candidateId: candidate.id, axis }
    });
  }

  // PR-14 says "record the reason", so the reason is required rather than optional. A suppression
  // the owner cannot later explain to themselves is what that requirement exists to prevent.
  const reason = cleanString(request.payload?.reason, { required: true, max: 300, label: 'reason' });
  const expiresAt = request.payload?.expiresAt ? cleanString(request.payload.expiresAt, { max: 40 }) : null;
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
    throw new ApplicationCommandError('expiresAt must be an ISO timestamp.', { code: 'invalid_input', statusCode: 422 });
  }

  const at = nowIso(clock);
  const rules = ensureRules(state);
  const normalized = normalizeSuppressionText(value);
  const existing = rules.find((rule) => rule.axis === axis && rule.value === normalized);

  const rule = existing ?? createSuppressionRule({
    id: `suppression-${randomUUID()}`,
    axis,
    value,
    reason,
    createdAt: at,
    createdRev: candidate.revision,
    expiresAt
  });
  if (!existing) {
    rules.push(rule);
    if (rules.length > MAX_SUPPRESSION_RULES) state.suppressionRules = rules.slice(-MAX_SUPPRESSION_RULES);
  }

  // Suppressing clears any standing exemption on this candidate, otherwise the owner taps suppress
  // and nothing visibly happens.
  candidate.suppression = { ...(candidate.suppression ?? inactiveSuppression()), exempt: false };
  candidate.revision += 1;
  candidate.updatedAt = at;
  candidate.audit = [
    ...(candidate.audit ?? []),
    { event: 'owner_suppression_created', at, revision: candidate.revision, ruleId: rule.id, axis, value: rule.value }
  ].slice(-60);

  state.updatedAt = at;
  state.audit.push({ event: 'owner_suppression_created', candidateId: candidate.id, ruleId: rule.id, axis, value: rule.value, at });
  state.audit = state.audit.slice(-200);

  applySuppressionToState(state, { at });

  return {
    result: 'candidate_suppressed',
    candidateId: candidate.id,
    revision: candidate.revision,
    suppressionRuleId: rule.id,
    reusedExistingRule: Boolean(existing)
  };
}

// Q2: `복원` exempts this candidate and leaves the rule standing for everything else it matches.
// Removing the rule outright is `remove_suppression_rule`, reached from the rule's own detail view.
function restoreCandidate(state, request, clock) {
  const candidate = getCandidate(state, request.candidateId);
  assertExpectedRevision(candidate, request.expectedRevision);

  if (!candidate.suppression?.active) {
    throw new ApplicationCommandError('Candidate is not currently suppressed.', {
      code: 'not_suppressed',
      statusCode: 422,
      details: { candidateId: candidate.id }
    });
  }

  const at = nowIso(clock);
  const releasedRuleIds = [...(candidate.suppression.matchedRuleIds ?? [])];
  candidate.suppression = { ...inactiveSuppression(), exempt: true };
  candidate.blockers = withoutSuppressionBlockers(candidate.blockers ?? []);
  candidate.revision += 1;
  candidate.updatedAt = at;
  candidate.audit = [
    ...(candidate.audit ?? []),
    { event: 'owner_suppression_restored', at, revision: candidate.revision, releasedRuleIds }
  ].slice(-60);

  state.updatedAt = at;
  state.audit.push({ event: 'owner_suppression_restored', candidateId: candidate.id, releasedRuleIds, at });
  state.audit = state.audit.slice(-200);

  applySuppressionToState(state, { at });

  return { result: 'candidate_restored', candidateId: candidate.id, revision: candidate.revision, releasedRuleIds };
}

function removeSuppressionRule(state, request, clock) {
  const ruleId = cleanString(request.payload?.ruleId, { required: true, max: 80, label: 'ruleId' });
  const rules = ensureRules(state);
  const rule = rules.find((item) => item.id === ruleId);
  if (!rule) {
    throw new ApplicationCommandError('Suppression rule not found.', { code: 'not_found', statusCode: 404, details: { ruleId } });
  }

  const at = nowIso(clock);
  state.suppressionRules = rules.filter((item) => item.id !== ruleId);
  state.updatedAt = at;
  state.audit.push({ event: 'owner_suppression_rule_removed', ruleId, axis: rule.axis, value: rule.value, at });
  state.audit = state.audit.slice(-200);

  applySuppressionToState(state, { at });

  return { result: 'suppression_rule_removed', suppressionRuleId: ruleId };
}

export class SuppressionApplicationStore extends CandidateDedupeApplicationStore {
  // Stamping here means every inherited path — the dedupe store's reads, the base store's
  // execute, and readToday — sees suppression without any of them knowing about it.
  async readState() {
    return applySuppressionToState(await super.readState(), { at: nowIso(this.clock) });
  }

  #decorate(today, state) {
    const byId = new Map(state.candidates.map((candidate) => [candidate.id, candidate]));
    const attach = (candidate) => ({
      ...candidate,
      suppression: structuredClone(byId.get(candidate.id)?.suppression ?? inactiveSuppression())
    });

    today.candidates = (today.candidates ?? []).map(attach);
    today.excluded = (today.excluded ?? []).map(attach);
    today.suppressionRules = ensureRules(state).map((rule) => suppressionRuleReadModel(rule, state));
    today.counters = {
      ...today.counters,
      ownerSuppressed: state.candidates.filter((candidate) => candidate.suppression?.active === true).length,
      suppressionNeedsReDecision: state.candidates.filter((candidate) => candidate.suppression?.needsReDecision === true).length
    };
    today.capability = {
      ...today.capability,
      ownerSuppression: 'deterministic_faceted_rules_unordered_any_match'
    };
    return today;
  }

  async readToday() {
    const state = await this.readState();
    return this.#decorate(await super.readToday(), state);
  }

  async execute(rawRequest) {
    const command = String(rawRequest?.command ?? '').trim();

    if (!SUPPRESSION_COMMANDS.has(command)) {
      const response = await super.execute(rawRequest);
      return { ...response, today: await this.readToday() };
    }

    return this.withWriteLock(async () => {
      const request = {
        ...rawRequest,
        requestId: cleanString(rawRequest?.requestId, { required: true, max: 160, label: 'requestId' }),
        command,
        candidateId: rawRequest?.candidateId ?? null,
        payload: rawRequest?.payload && typeof rawRequest.payload === 'object' ? rawRequest.payload : {}
      };

      const state = await this.readState();

      const prior = state.commandHistory?.[request.requestId];
      if (prior) {
        return {
          result: prior.result,
          candidateId: prior.candidateId ?? null,
          idempotentReplay: true,
          today: this.#decorate(await super.readToday(), state)
        };
      }

      let response;
      if (command === 'suppress_candidate') response = suppressCandidate(state, request, this.clock);
      else if (command === 'restore_candidate') response = restoreCandidate(state, request, this.clock);
      else response = removeSuppressionRule(state, request, this.clock);

      state.commandHistory ??= {};
      state.commandOrder ??= [];
      state.commandHistory[request.requestId] = {
        fingerprint: null,
        command,
        candidateId: request.candidateId ?? null,
        result: response.result,
        recordedAt: state.updatedAt
      };
      state.commandOrder = [...state.commandOrder.filter((id) => id !== request.requestId), request.requestId].slice(-100);
      const keep = new Set(state.commandOrder);
      for (const id of Object.keys(state.commandHistory)) if (!keep.has(id)) delete state.commandHistory[id];

      await this.persist(state);
      return { ...response, idempotentReplay: false, today: await this.readToday() };
    });
  }
}
