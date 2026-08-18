// Handoff envelope and the four validation gates.
//
// docs/spec/AGENT_HANDOFFS.md defines the envelope; HANDOFF_VALIDATION_RULES.md
// defines the gates every specialist-to-Orchestrator handoff must pass: schema,
// semantic, evidence, next-action.
//
// The receiver trusts nothing outside the artifact schema. Free text in a handoff
// is never authority.

import { ARTIFACT_TYPES, SCHEMA_VERSION, validateArtifact } from './artifacts.mjs';
import { RUN_STAGES } from './run-states.mjs';

export const AGENT_IDS = Object.freeze({
  ORCHESTRATOR: 'orchestrator',
  SCOUT: 'scout',
  VERIFIER: 'verifier',
  STRATEGIST: 'strategist',
  WRITER: 'writer',
  GUARDIAN: 'guardian'
});

/** Which agent is permitted to produce which artifact. */
export const ARTIFACT_OWNER = Object.freeze({
  [ARTIFACT_TYPES.RUN_PLAN]: AGENT_IDS.ORCHESTRATOR,
  [ARTIFACT_TYPES.CANDIDATE_SET]: AGENT_IDS.SCOUT,
  [ARTIFACT_TYPES.EVIDENCE_PACKET]: AGENT_IDS.VERIFIER,
  [ARTIFACT_TYPES.CONTENT_BRIEF]: AGENT_IDS.STRATEGIST,
  [ARTIFACT_TYPES.DRAFT_BUNDLE]: AGENT_IDS.WRITER,
  [ARTIFACT_TYPES.REVIEW_REPORT]: AGENT_IDS.GUARDIAN
});

/** Stage at which each artifact may be submitted. */
export const ARTIFACT_STAGE = Object.freeze({
  [ARTIFACT_TYPES.CANDIDATE_SET]: RUN_STAGES.DISCOVERY,
  [ARTIFACT_TYPES.EVIDENCE_PACKET]: RUN_STAGES.VERIFICATION,
  [ARTIFACT_TYPES.CONTENT_BRIEF]: RUN_STAGES.STRATEGY,
  [ARTIFACT_TYPES.DRAFT_BUNDLE]: RUN_STAGES.DRAFTING,
  [ARTIFACT_TYPES.REVIEW_REPORT]: RUN_STAGES.GUARDIAN_REVIEW
});

export const NEXT_ACTIONS = Object.freeze([
  'verify',
  'strategize',
  'draft',
  'review',
  'human_review',
  'hold',
  'stop'
]);

/** Next action each artifact type is allowed to request. */
const ALLOWED_NEXT_ACTIONS = Object.freeze({
  [ARTIFACT_TYPES.CANDIDATE_SET]: ['verify', 'hold', 'stop'],
  [ARTIFACT_TYPES.EVIDENCE_PACKET]: ['strategize', 'hold', 'stop'],
  [ARTIFACT_TYPES.CONTENT_BRIEF]: ['draft', 'hold', 'stop'],
  [ARTIFACT_TYPES.DRAFT_BUNDLE]: ['review', 'hold', 'stop'],
  [ARTIFACT_TYPES.REVIEW_REPORT]: ['human_review', 'draft', 'hold', 'stop']
});

export function createHandoff({
  runId,
  handoffId,
  from,
  artifact,
  createdAt,
  requestedNextAction,
  status = 'complete'
}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId,
    handoffId,
    from,
    to: AGENT_IDS.ORCHESTRATOR,
    artifactType: artifact?.type ?? null,
    artifactRef: artifact?.artifactId ?? null,
    createdAt,
    evidenceRefs: [...(artifact?.evidenceRefs ?? [])],
    status,
    warnings: [...(artifact?.warnings ?? [])],
    blockers: [...(artifact?.blockers ?? [])],
    requestedNextAction
  };
}

function schemaGate(handoff, artifact) {
  const errors = [];
  if (handoff?.schemaVersion !== SCHEMA_VERSION) errors.push('Handoff schemaVersion is incompatible.');
  if (!handoff?.runId) errors.push('Handoff runId is required.');
  if (!handoff?.handoffId) errors.push('Handoff handoffId is required.');
  if (!handoff?.from) errors.push('Handoff sender is required.');
  if (handoff?.to !== AGENT_IDS.ORCHESTRATOR) errors.push('Specialists hand off only to the orchestrator.');
  if (!handoff?.createdAt || Number.isNaN(Date.parse(handoff.createdAt))) {
    errors.push('Handoff createdAt must be a timestamp.');
  }
  if (!['complete', 'blocked', 'partial'].includes(handoff?.status)) errors.push('Handoff status is invalid.');
  if (!Array.isArray(handoff?.warnings)) errors.push('Handoff warnings must be an array.');
  if (!Array.isArray(handoff?.blockers)) errors.push('Handoff blockers must be an array.');
  if (handoff?.artifactType !== artifact?.type) errors.push('Handoff artifactType does not match the artifact.');
  if (handoff?.artifactRef !== artifact?.artifactId) errors.push('Handoff artifactRef does not match the artifact.');

  errors.push(...validateArtifact(artifact).errors);
  return errors;
}

function semanticGate(handoff, artifact, context) {
  const errors = [];
  const owner = ARTIFACT_OWNER[artifact?.type];

  if (!owner) {
    errors.push('Unknown artifact type: ' + (artifact?.type ?? 'missing'));
    return errors;
  }
  if (handoff.from !== owner) {
    errors.push(handoff.from + ' may not produce ' + artifact.type + '; that artifact belongs to ' + owner + '.');
  }
  if (artifact.agentId !== owner) {
    errors.push('Artifact agentId ' + artifact.agentId + ' does not match its owning role ' + owner + '.');
  }

  // Role authority checks, per HANDOFF_VALIDATION_RULES.md "Semantic gate".
  if (artifact.type === ARTIFACT_TYPES.CANDIDATE_SET) {
    const overreaching = (artifact.candidates ?? []).filter(
      (candidate) => candidate?.matchState === 'exact' || candidate?.publishableMedia === true
    );
    if (overreaching.length > 0) {
      errors.push('Scout cannot promote exact product identity or publishable media state.');
    }
  }

  if (artifact.type === ARTIFACT_TYPES.CONTENT_BRIEF) {
    const allowed = new Set((context?.evidencePacket?.verifiedClaims ?? []).map((claim) => claim.claimId));
    const invented = (artifact.angles ?? [])
      .flatMap((angle) => angle?.allowedClaims ?? [])
      .filter((claimId) => !allowed.has(claimId));
    if (invented.length > 0) {
      errors.push('Strategist referenced claims absent from the evidence packet: ' + [...new Set(invented)].join(', '));
    }
  }

  if (artifact.type === ARTIFACT_TYPES.DRAFT_BUNDLE) {
    const allowed = new Set((context?.evidencePacket?.verifiedClaims ?? []).map((claim) => claim.claimId));
    const invented = (artifact.drafts ?? [])
      .flatMap((draft) => draft?.claimRefs ?? [])
      .filter((claimId) => !allowed.has(claimId));
    if (invented.length > 0) {
      errors.push('Writer referenced claims absent from the evidence packet: ' + [...new Set(invented)].join(', '));
    }
    const briefAngleIds = new Set((context?.contentBrief?.angles ?? []).map((angle) => angle.angleId));
    if (briefAngleIds.size > 0) {
      const stray = (artifact.drafts ?? [])
        .map((draft) => draft?.angleId)
        .filter((angleId) => !briefAngleIds.has(angleId));
      if (stray.length > 0) {
        errors.push('Writer drafted angles the brief does not define: ' + stray.join(', '));
      }
    }
  }

  if (artifact.type === ARTIFACT_TYPES.REVIEW_REPORT) {
    const draftIds = new Set((context?.draftBundle?.drafts ?? []).map((draft) => draft.draftId));
    if (draftIds.size > 0) {
      const stray = (artifact.perDraftFindings ?? [])
        .map((entry) => entry.draftId)
        .filter((draftId) => !draftIds.has(draftId));
      if (stray.length > 0) errors.push('Guardian reviewed drafts that do not exist: ' + stray.join(', '));
    }
  }

  return errors;
}

function evidenceGate(artifact, context) {
  const errors = [];
  const known = new Set(context?.knownSourceIds ?? []);

  if (known.size > 0) {
    const unknown = (artifact.evidenceRefs ?? []).filter((ref) => !known.has(ref));
    if (unknown.length > 0) {
      errors.push('Artifact references evidence outside this run: ' + [...new Set(unknown)].join(', '));
    }
  }

  // Downstream artifacts must bind the artifacts that are current right now.
  if (context?.evidencePacketHash && artifact.evidencePacketHash && artifact.evidencePacketHash !== context.evidencePacketHash) {
    errors.push('Artifact is bound to a stale evidence packet.');
  }
  if (context?.contentBriefHash && artifact.contentBriefHash && artifact.contentBriefHash !== context.contentBriefHash) {
    errors.push('Artifact is bound to a stale content brief.');
  }
  if (context?.draftBundleHash && artifact.draftBundleHash && artifact.draftBundleHash !== context.draftBundleHash) {
    errors.push('Artifact is bound to a stale draft bundle.');
  }

  return errors;
}

function nextActionGate(handoff, artifact, context) {
  const errors = [];
  if (!NEXT_ACTIONS.includes(handoff.requestedNextAction)) {
    errors.push('Unknown requested next action: ' + handoff.requestedNextAction);
    return errors;
  }

  const allowed = ALLOWED_NEXT_ACTIONS[artifact?.type] ?? [];
  if (!allowed.includes(handoff.requestedNextAction)) {
    errors.push(artifact?.type + ' may not request ' + handoff.requestedNextAction + '.');
  }

  const expectedStage = ARTIFACT_STAGE[artifact?.type];
  if (context?.currentStage && expectedStage && context.currentStage !== expectedStage) {
    errors.push(artifact.type + ' is not accepted at stage ' + context.currentStage + '.');
  }

  // The Orchestrator never converts a blocked artifact into success.
  if (handoff.status === 'blocked' && !['hold', 'stop'].includes(handoff.requestedNextAction)) {
    errors.push('A blocked handoff may only request hold or stop.');
  }
  if (handoff.blockers?.length > 0 && !['hold', 'stop', 'draft'].includes(handoff.requestedNextAction)) {
    errors.push('A handoff carrying blockers may not request forward progression.');
  }

  return errors;
}

/**
 * Run all four gates in order and report which one failed, so the caller can say
 * why progression stopped rather than emitting a flat validation error.
 */
export function validateHandoff(handoff, artifact, context = {}) {
  const schema = schemaGate(handoff, artifact);
  if (schema.length > 0) return { ok: false, gate: 'schema', errors: schema };

  const semantic = semanticGate(handoff, artifact, context);
  if (semantic.length > 0) return { ok: false, gate: 'semantic', errors: semantic };

  const evidence = evidenceGate(artifact, context);
  if (evidence.length > 0) return { ok: false, gate: 'evidence', errors: evidence };

  const nextAction = nextActionGate(handoff, artifact, context);
  if (nextAction.length > 0) return { ok: false, gate: 'next_action', errors: nextAction };

  return { ok: true, gate: null, errors: [] };
}
