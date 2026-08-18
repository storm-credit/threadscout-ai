// ThreadScout domain core.
//
// Pure domain logic: no filesystem, no network, no time or identity read from the
// ambient environment. Everything here is a function of its inputs, which is what
// makes artifact hashes reproducible and freshness gates testable.
//
// Storage lives in packages/database. Agent execution lives in packages/orchestra.

export { canonicalStringify, hashArtifact, sha256 } from './hash.mjs';
export {
  createFixedClock,
  createIdFactory,
  createRuntimeIdFactory,
  hoursBetween,
  isoOrNull,
  systemClock
} from './clock.mjs';

export {
  ARTIFACT_SOURCE_STAGE,
  DOWNSTREAM_ARTIFACTS,
  RUN_STAGES,
  RUN_STAGE_ORDER,
  RUN_STATUSES,
  SLICE_REACHABLE_STAGES,
  STAGE_REQUIRED_ARTIFACT,
  assertTransition,
  canTransition,
  earliestAffectedStage,
  isTerminalStatus,
  stageIndex
} from './run-states.mjs';

export {
  ARTIFACT_TYPES,
  CHECK_STATUSES,
  GUARDIAN_CHECK_KEYS,
  GUARDIAN_DECISIONS,
  MATCH_STATES,
  MEDIA_RIGHTS_STATES,
  PERSONAL_USE_STATES,
  PUBLISHABLE_MEDIA_STATES,
  READER_JOBS,
  READER_JOB_LABELS_KO,
  SCHEMA_VERSION,
  VERIFIER_DECISIONS,
  createEnvelope,
  validateArtifact,
  validateContentBrief,
  validateDraftBundle,
  validateEvidencePacket,
  validateReviewReport
} from './artifacts.mjs';

export {
  AGENT_IDS,
  ARTIFACT_OWNER,
  ARTIFACT_STAGE,
  NEXT_ACTIONS,
  createHandoff,
  validateHandoff
} from './handoff.mjs';

export {
  AFFILIATE_DISCLOSURE_TEXT,
  ANGLE_PARAPHRASE_THRESHOLD,
  DRAFT_DUPLICATE_THRESHOLD,
  RESEARCH_WORDING_HINTS,
  RULE_IDS,
  detectAlternativeLabel,
  detectEndorsementImplication,
  detectExaggeration,
  detectFirstHandLanguage,
  detectSameProductClaim,
  detectSensitiveGuarantee,
  findDuplicateDrafts,
  findParaphrasedAngles,
  hasAffiliateDisclosure,
  textSimilarity
} from './policy-rules.mjs';

export {
  CONTENT_LANES,
  CONTENT_LANE_LABELS_KO,
  EVIDENCE_READINESS,
  FRESHNESS_STATES,
  FRESHNESS_TTL_HOURS,
  REVIEW_SCORE_FLOOR,
  RISK_LEVELS,
  dominantBlocker,
  evaluateEvidenceReadiness,
  evaluateFreshness,
  evaluateRisk,
  scoreFromOwnerRatings,
  scoreOpportunity,
  selectInboxCandidates
} from './ranking.mjs';

export {
  APPROVAL_STATES,
  BINDING_KEYS,
  BINDING_LABELS_KO,
  HUMAN_DECISIONS,
  SLICE_HUMAN_DECISIONS,
  computeApprovalBinding,
  createApprovalRecord,
  evaluateApprovalState,
  verifyClaimedBinding
} from './approval.mjs';

export {
  CTA_ACTIONS,
  CTA_LABELS_KO,
  MATCH_STATE_LABELS_KO,
  MEDIA_STATE_LABELS_KO,
  deriveCandidateView
} from './review-state.mjs';
