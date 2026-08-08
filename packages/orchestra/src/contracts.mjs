import { AGENT_IDS } from './agent-registry.mjs';

export const ARTIFACT_TYPES = Object.freeze({
  RUN_PLAN: 'run_plan',
  CANDIDATE_SET: 'candidate_set',
  EVIDENCE_PACKET: 'evidence_packet',
  CONTENT_BRIEF: 'content_brief',
  DRAFT_BUNDLE: 'draft_bundle',
  REVIEW_REPORT: 'review_report'
});

const OUTPUT_TYPE_BY_AGENT = Object.freeze({
  [AGENT_IDS.ORCHESTRATOR]: ARTIFACT_TYPES.RUN_PLAN,
  [AGENT_IDS.SCOUT]: ARTIFACT_TYPES.CANDIDATE_SET,
  [AGENT_IDS.VERIFIER]: ARTIFACT_TYPES.EVIDENCE_PACKET,
  [AGENT_IDS.STRATEGIST]: ARTIFACT_TYPES.CONTENT_BRIEF,
  [AGENT_IDS.WRITER]: ARTIFACT_TYPES.DRAFT_BUNDLE,
  [AGENT_IDS.GUARDIAN]: ARTIFACT_TYPES.REVIEW_REPORT
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateAgentArtifact(agentId, artifact) {
  const errors = [];
  const expectedType = OUTPUT_TYPE_BY_AGENT[agentId];

  if (!expectedType) errors.push(`Unknown agent: ${agentId}`);
  if (!artifact || typeof artifact !== 'object') {
    return { ok: false, errors: ['Artifact must be an object.'] };
  }
  if (artifact.type !== expectedType) {
    errors.push(`${agentId} must produce ${expectedType}; received ${artifact.type ?? 'missing type'}.`);
  }
  if (!isNonEmptyString(artifact.runId)) errors.push('Artifact runId is required.');
  if (!isNonEmptyString(artifact.createdAt)) errors.push('Artifact createdAt is required.');

  if (agentId === AGENT_IDS.SCOUT) {
    if (!Array.isArray(artifact.candidates) || artifact.candidates.length === 0) {
      errors.push('Scout candidate_set must contain at least one candidate.');
    }
  }

  if (agentId === AGENT_IDS.VERIFIER) {
    if (!['exact', 'likely', 'substitute', 'unresolved'].includes(artifact.exactMatchStatus)) {
      errors.push('Verifier evidence_packet requires a valid exactMatchStatus.');
    }
    if (!Array.isArray(artifact.sources) || artifact.sources.length === 0) {
      errors.push('Verifier evidence_packet requires source evidence.');
    }
    if (!artifact.priceSnapshot || !isNonEmptyString(artifact.priceSnapshot.status) || !isNonEmptyString(artifact.priceSnapshot.observedAt)) {
      errors.push('Verifier evidence_packet requires a timestamped price snapshot status, even when price is unavailable.');
    }
    if (!isNonEmptyString(artifact.mediaRights)) errors.push('Verifier evidence_packet requires mediaRights.');
  }

  if (agentId === AGENT_IDS.STRATEGIST) {
    if (!Array.isArray(artifact.angles) || artifact.angles.length !== 4) {
      errors.push('Strategist content_brief must define exactly four distinct angles.');
    } else if (new Set(artifact.angles.map((angle) => angle.id)).size !== 4) {
      errors.push('Strategist angle IDs must be unique.');
    }
  }

  if (agentId === AGENT_IDS.WRITER) {
    if (!Array.isArray(artifact.drafts) || artifact.drafts.length !== 4) {
      errors.push('Writer draft_bundle must contain exactly four drafts.');
    } else if (new Set(artifact.drafts.map((draft) => draft.angleId)).size !== 4) {
      errors.push('Writer drafts must map to four distinct strategy angles.');
    }
  }

  if (agentId === AGENT_IDS.GUARDIAN) {
    if (!['pass', 'revise', 'block'].includes(artifact.decision)) {
      errors.push('Guardian review_report requires pass, revise, or block.');
    }
    if (!Array.isArray(artifact.blockers)) errors.push('Guardian blockers must be an array.');
    if (artifact.decision === 'pass' && artifact.blockers?.length > 0) {
      errors.push('Guardian cannot pass a draft bundle with blockers.');
    }
  }

  return { ok: errors.length === 0, errors };
}

export function createArtifactEnvelope({ type, runId, payload = {} }) {
  return {
    type,
    runId,
    createdAt: new Date().toISOString(),
    ...payload
  };
}
