// Run stages and statuses from docs/spec/ORCHESTRATOR_STATE_MACHINE.md.
//
// A run carries two independent facts: where it is (stage) and how it is (status).
// Collapsing them would lose the case the spec cares about most — an artifact that
// reached guardian_review and then went stale is not the same as one that never
// got there.

export const RUN_STAGES = Object.freeze({
  INTAKE: 'intake',
  DISCOVERY: 'discovery',
  VERIFICATION: 'verification',
  STRATEGY: 'strategy',
  DRAFTING: 'drafting',
  GUARDIAN_REVIEW: 'guardian_review',
  HUMAN_REVIEW: 'human_review',
  SCHEDULED_LOCAL: 'scheduled_local',
  COMPLETED: 'completed'
});

export const RUN_STAGE_ORDER = Object.freeze([
  RUN_STAGES.INTAKE,
  RUN_STAGES.DISCOVERY,
  RUN_STAGES.VERIFICATION,
  RUN_STAGES.STRATEGY,
  RUN_STAGES.DRAFTING,
  RUN_STAGES.GUARDIAN_REVIEW,
  RUN_STAGES.HUMAN_REVIEW,
  RUN_STAGES.SCHEDULED_LOCAL,
  RUN_STAGES.COMPLETED
]);

export const RUN_STATUSES = Object.freeze({
  RUNNING: 'running',
  NEEDS_CONTEXT: 'needs_context',
  NEEDS_EVIDENCE: 'needs_evidence',
  HELD: 'held',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  STALE: 'stale',
  CANCELLED: 'cancelled',
  PARTIAL: 'partial',
  COMPLETED: 'completed'
});

/**
 * Stages this implementation slice can actually enter.
 *
 * `scheduled_local` is part of the approved design and is deliberately unreachable
 * here: scheduling belongs to a later slice, and leaving a half-built path into it
 * would be worse than leaving no path at all.
 */
export const SLICE_REACHABLE_STAGES = Object.freeze([
  RUN_STAGES.INTAKE,
  RUN_STAGES.VERIFICATION,
  RUN_STAGES.STRATEGY,
  RUN_STAGES.DRAFTING,
  RUN_STAGES.GUARDIAN_REVIEW,
  RUN_STAGES.HUMAN_REVIEW,
  RUN_STAGES.COMPLETED
]);

const ALLOWED_STAGE_TRANSITIONS = Object.freeze({
  [RUN_STAGES.INTAKE]: [RUN_STAGES.DISCOVERY, RUN_STAGES.VERIFICATION],
  [RUN_STAGES.DISCOVERY]: [RUN_STAGES.VERIFICATION],
  [RUN_STAGES.VERIFICATION]: [RUN_STAGES.STRATEGY],
  [RUN_STAGES.STRATEGY]: [RUN_STAGES.DRAFTING],
  [RUN_STAGES.DRAFTING]: [RUN_STAGES.GUARDIAN_REVIEW],
  [RUN_STAGES.GUARDIAN_REVIEW]: [RUN_STAGES.DRAFTING, RUN_STAGES.HUMAN_REVIEW],
  [RUN_STAGES.HUMAN_REVIEW]: [RUN_STAGES.SCHEDULED_LOCAL, RUN_STAGES.COMPLETED],
  [RUN_STAGES.SCHEDULED_LOCAL]: [RUN_STAGES.COMPLETED],
  [RUN_STAGES.COMPLETED]: []
});

/** The artifact each stage must have produced before the run may leave it. */
export const STAGE_REQUIRED_ARTIFACT = Object.freeze({
  [RUN_STAGES.DISCOVERY]: 'candidate_set',
  [RUN_STAGES.VERIFICATION]: 'evidence_packet',
  [RUN_STAGES.STRATEGY]: 'content_brief',
  [RUN_STAGES.DRAFTING]: 'draft_bundle',
  [RUN_STAGES.GUARDIAN_REVIEW]: 'review_report',
  [RUN_STAGES.HUMAN_REVIEW]: 'human_decision'
});

/** Which stage produced each artifact — used to route a stale run backwards. */
export const ARTIFACT_SOURCE_STAGE = Object.freeze(
  Object.fromEntries(Object.entries(STAGE_REQUIRED_ARTIFACT).map(([stage, artifact]) => [artifact, stage]))
);

/**
 * Downstream artifacts invalidated when a given artifact changes.
 * `AGENT_HANDOFFS.md` §5: evidence changes make Strategist/Writer/Guardian output stale.
 */
export const DOWNSTREAM_ARTIFACTS = Object.freeze({
  candidate_set: ['evidence_packet', 'content_brief', 'draft_bundle', 'review_report', 'human_decision'],
  evidence_packet: ['content_brief', 'draft_bundle', 'review_report', 'human_decision'],
  content_brief: ['draft_bundle', 'review_report', 'human_decision'],
  draft_bundle: ['review_report', 'human_decision'],
  review_report: ['human_decision'],
  human_decision: []
});

export function stageIndex(stage) {
  return RUN_STAGE_ORDER.indexOf(stage);
}

export function canTransition(fromStage, toStage) {
  return (ALLOWED_STAGE_TRANSITIONS[fromStage] ?? []).includes(toStage);
}

export function assertTransition(fromStage, toStage) {
  if (!canTransition(fromStage, toStage)) {
    throw new Error(`Invalid run stage transition: ${fromStage} -> ${toStage}`);
  }
}

/**
 * Earliest stage that must be re-run after the given artifacts changed.
 * Returns null when nothing changed.
 */
export function earliestAffectedStage(changedArtifactTypes = []) {
  const stages = changedArtifactTypes
    .map((type) => ARTIFACT_SOURCE_STAGE[type])
    .filter(Boolean)
    .map(stageIndex)
    .filter((index) => index >= 0);
  if (stages.length === 0) return null;
  return RUN_STAGE_ORDER[Math.min(...stages)];
}

/** A terminal status stops progression until the owner acts. */
export function isTerminalStatus(status) {
  return [
    RUN_STATUSES.REJECTED,
    RUN_STATUSES.CANCELLED,
    RUN_STATUSES.COMPLETED
  ].includes(status);
}
