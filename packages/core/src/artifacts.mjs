// Artifact shapes from docs/spec/AGENT_CONTRACTS.md and docs/spec/DATA_MODEL.md.
//
// Field names are camelCase to match the rest of the repository; the spec's
// snake_case names map one-to-one.

export const ARTIFACT_TYPES = Object.freeze({
  RUN_PLAN: 'run_plan',
  CANDIDATE_SET: 'candidate_set',
  EVIDENCE_PACKET: 'evidence_packet',
  CONTENT_BRIEF: 'content_brief',
  DRAFT_BUNDLE: 'draft_bundle',
  REVIEW_REPORT: 'review_report'
});

export const SCHEMA_VERSION = '1.0';

export const MATCH_STATES = Object.freeze(['exact', 'likely', 'substitute', 'unresolved']);
export const VERIFIER_DECISIONS = Object.freeze(['verified', 'limited', 'hold', 'reject']);
export const GUARDIAN_DECISIONS = Object.freeze(['pass', 'revise', 'block']);
export const PERSONAL_USE_STATES = Object.freeze(['confirmed', 'not_confirmed']);
export const CHECK_STATUSES = Object.freeze(['pass', 'warn', 'block']);

/** The four reader jobs required by docs/spec/CONTENT_OUTPUT_SPEC.md. */
export const READER_JOBS = Object.freeze([
  'practical_result',
  'mechanism_demo',
  'comparison_decision',
  'limitation_fit'
]);

export const READER_JOB_LABELS_KO = Object.freeze({
  practical_result: '문제 → 실제 결과',
  mechanism_demo: '호기심 · 작동 시연',
  comparison_decision: '비교 · 구매 판단',
  limitation_fit: '한계 · 맞는 사람'
});

/**
 * Publication rights states for a media reference.
 * `unknown` is a first-class value and always fails closed (AT-05, BS-14, BS-21).
 */
export const MEDIA_RIGHTS_STATES = Object.freeze([
  'owner_supplied',
  'licensed',
  'link_or_embed_only',
  'analysis_only',
  'unknown'
]);

export const PUBLISHABLE_MEDIA_STATES = Object.freeze(['owner_supplied', 'licensed', 'link_or_embed_only']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireString(value, path, errors) {
  if (!isNonEmptyString(value)) errors.push(`${path} must be a non-empty string.`);
}

function requireEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) errors.push(`${path} must be one of ${allowed.join(', ')}.`);
}

function requireArray(value, path, errors, { minItems = 0, maxItems = Infinity } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return false;
  }
  if (value.length < minItems) errors.push(`${path} requires at least ${minItems} item(s).`);
  if (value.length > maxItems) errors.push(`${path} allows at most ${maxItems} item(s).`);
  return true;
}

function requireIso(value, path, errors) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an RFC3339 timestamp.`);
  }
}

/** Fields every artifact carries — AGENT_CONTRACTS.md "Shared contract rules". */
export function validateEnvelope(artifact, expectedType, errors) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    errors.push('Artifact must be an object.');
    return false;
  }
  if (artifact.type !== expectedType) {
    errors.push(`Artifact type must be ${expectedType}; received ${artifact.type ?? 'missing'}.`);
  }
  if (artifact.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`Artifact schemaVersion must be ${SCHEMA_VERSION}.`);
  }
  requireString(artifact.runId, 'runId', errors);
  requireString(artifact.artifactId, 'artifactId', errors);
  requireString(artifact.agentId, 'agentId', errors);
  requireIso(artifact.createdAt, 'createdAt', errors);
  requireArray(artifact.inputArtifactRefs, 'inputArtifactRefs', errors);
  requireArray(artifact.evidenceRefs, 'evidenceRefs', errors);
  requireArray(artifact.warnings, 'warnings', errors);
  requireArray(artifact.blockers, 'blockers', errors);
  return errors.length === 0;
}

function validateCommerceSnapshot(snapshot, errors) {
  if (!snapshot || typeof snapshot !== 'object') {
    errors.push('commerceSnapshot is required.');
    return;
  }
  requireIso(snapshot.observedAt, 'commerceSnapshot.observedAt', errors);
  requireEnum(snapshot.priceStatus, ['observed', 'unavailable', 'not_applicable'], 'commerceSnapshot.priceStatus', errors);
  if (snapshot.priceStatus === 'observed') {
    if (typeof snapshot.amount !== 'number' || !Number.isFinite(snapshot.amount) || snapshot.amount < 0) {
      errors.push('commerceSnapshot.amount must be a non-negative number when a price is observed.');
    }
    requireString(snapshot.currency, 'commerceSnapshot.currency', errors);
  }
  requireEnum(snapshot.stockStatus, ['in_stock', 'out_of_stock', 'unknown', 'not_applicable'], 'commerceSnapshot.stockStatus', errors);
  requireEnum(snapshot.sellerStatus, ['verified', 'unverified', 'unavailable', 'not_applicable'], 'commerceSnapshot.sellerStatus', errors);
  if (snapshot.sellerStatus === 'verified') requireString(snapshot.sellerName, 'commerceSnapshot.sellerName', errors);
  requireEnum(snapshot.variantStatus, ['verified', 'unresolved', 'not_applicable'], 'commerceSnapshot.variantStatus', errors);
  if (snapshot.variantStatus === 'verified') requireString(snapshot.variantName, 'commerceSnapshot.variantName', errors);
}

export function validateEvidencePacket(artifact) {
  const errors = [];
  if (!validateEnvelope(artifact, ARTIFACT_TYPES.EVIDENCE_PACKET, errors)) return { ok: false, errors };

  requireString(artifact.candidateId, 'candidateId', errors);

  const product = artifact.canonicalProduct;
  if (!product || typeof product !== 'object') {
    errors.push('canonicalProduct is required.');
  } else {
    requireString(product.productName, 'canonicalProduct.productName', errors);
    for (const key of ['brand', 'model', 'variant']) {
      if (product[key] !== null && !isNonEmptyString(product[key])) {
        errors.push(`canonicalProduct.${key} must be a non-empty string or null.`);
      }
    }
  }

  requireEnum(artifact.matchState, MATCH_STATES, 'matchState', errors);
  if (requireArray(artifact.matchEvidence, 'matchEvidence', errors, { minItems: 1 })) {
    artifact.matchEvidence.forEach((item, index) => {
      requireString(item?.dimension, `matchEvidence[${index}].dimension`, errors);
      requireEnum(item?.status, ['match', 'conflict', 'unknown'], `matchEvidence[${index}].status`, errors);
      requireArray(item?.sourceIds, `matchEvidence[${index}].sourceIds`, errors);
    });
  }
  requireArray(artifact.conflicts, 'conflicts', errors);

  if (requireArray(artifact.verifiedClaims, 'verifiedClaims', errors)) {
    artifact.verifiedClaims.forEach((claim, index) => {
      requireString(claim?.claimId, `verifiedClaims[${index}].claimId`, errors);
      requireString(claim?.text, `verifiedClaims[${index}].text`, errors);
      requireEnum(
        claim?.evidenceClass,
        ['owner_supplied', 'primary_source', 'corroborated', 'observation'],
        `verifiedClaims[${index}].evidenceClass`,
        errors
      );
      requireArray(claim?.sourceIds, `verifiedClaims[${index}].sourceIds`, errors, { minItems: 1 });
    });
    const ids = artifact.verifiedClaims.map((claim) => claim?.claimId);
    if (new Set(ids).size !== ids.length) errors.push('verifiedClaims claimIds must be unique.');
  }

  if (requireArray(artifact.prohibitedClaims, 'prohibitedClaims', errors)) {
    artifact.prohibitedClaims.forEach((claim, index) => {
      requireString(claim?.text, `prohibitedClaims[${index}].text`, errors);
      requireString(claim?.reason, `prohibitedClaims[${index}].reason`, errors);
    });
  }

  if (artifact.publicFigureRelation !== null) {
    const relation = artifact.publicFigureRelation;
    if (!relation || typeof relation !== 'object') {
      errors.push('publicFigureRelation must be an object or null.');
    } else {
      requireEnum(
        relation.classification,
        ['official_endorsement', 'confirmed_use', 'visible_unconfirmed', 'reported_association', 'similar_only', 'blocked_rumor_private'],
        'publicFigureRelation.classification',
        errors
      );
      requireArray(relation.prohibitedImplications, 'publicFigureRelation.prohibitedImplications', errors);
    }
  }

  if (requireArray(artifact.mediaRights, 'mediaRights', errors)) {
    artifact.mediaRights.forEach((media, index) => {
      requireString(media?.mediaId, `mediaRights[${index}].mediaId`, errors);
      requireEnum(media?.publishRightsState, MEDIA_RIGHTS_STATES, `mediaRights[${index}].publishRightsState`, errors);
    });
  }

  requireEnum(artifact.personalUseState, PERSONAL_USE_STATES, 'personalUseState', errors);
  validateCommerceSnapshot(artifact.commerceSnapshot, errors);

  if (!artifact.freshness || typeof artifact.freshness !== 'object') {
    errors.push('freshness is required.');
  } else {
    requireIso(artifact.freshness.evaluatedAt, 'freshness.evaluatedAt', errors);
    if (!artifact.freshness.classes || typeof artifact.freshness.classes !== 'object') {
      errors.push('freshness.classes is required.');
    }
  }

  requireArray(artifact.unresolvedQuestions, 'unresolvedQuestions', errors);
  requireEnum(artifact.verifierDecision, VERIFIER_DECISIONS, 'verifierDecision', errors);

  if (requireArray(artifact.sources, 'sources', errors, { minItems: 1 })) {
    artifact.sources.forEach((source, index) => {
      requireString(source?.id, `sources[${index}].id`, errors);
      requireString(source?.originId, `sources[${index}].originId`, errors);
      requireIso(source?.observedAt, `sources[${index}].observedAt`, errors);
    });
  }

  // A verifier that says `verified` while holding an unresolved identity would let
  // every downstream gate through on a technicality.
  if (artifact.verifierDecision === 'verified' && artifact.matchState === 'unresolved') {
    errors.push('verifierDecision cannot be verified while matchState is unresolved.');
  }
  if (artifact.matchState === 'exact' && artifact.conflicts?.length > 0) {
    errors.push('matchState cannot be exact while conflicts remain.');
  }

  return { ok: errors.length === 0, errors };
}

export function validateContentBrief(artifact) {
  const errors = [];
  if (!validateEnvelope(artifact, ARTIFACT_TYPES.CONTENT_BRIEF, errors)) return { ok: false, errors };

  requireString(artifact.candidateId, 'candidateId', errors);
  requireString(artifact.evidencePacketHash, 'evidencePacketHash', errors);
  requireString(artifact.audience, 'audience', errors);
  requireArray(artifact.prohibitedImplications, 'prohibitedImplications', errors);

  if (requireArray(artifact.angles, 'angles', errors, { minItems: 4, maxItems: 4 })) {
    artifact.angles.forEach((angle, index) => {
      requireString(angle?.angleId, `angles[${index}].angleId`, errors);
      requireEnum(angle?.readerJob, READER_JOBS, `angles[${index}].readerJob`, errors);
      requireString(angle?.coreValue, `angles[${index}].coreValue`, errors);
      requireString(angle?.hookLogic, `angles[${index}].hookLogic`, errors);
      requireString(angle?.cta, `angles[${index}].cta`, errors);
      requireString(angle?.differentiationReason, `angles[${index}].differentiationReason`, errors);
      requireArray(angle?.allowedClaims, `angles[${index}].allowedClaims`, errors);
      requireArray(angle?.prohibitedImplications, `angles[${index}].prohibitedImplications`, errors);
      requireEnum(
        angle?.commercialIntensity,
        ['none', 'soft', 'affiliate'],
        `angles[${index}].commercialIntensity`,
        errors
      );
    });

    const angleIds = artifact.angles.map((angle) => angle?.angleId);
    if (new Set(angleIds).size !== angleIds.length) errors.push('angles angleIds must be unique.');

    const jobs = artifact.angles.map((angle) => angle?.readerJob);
    if (new Set(jobs).size !== 4) errors.push('angles must cover four distinct reader jobs.');
  }

  return { ok: errors.length === 0, errors };
}

export function validateDraftBundle(artifact) {
  const errors = [];
  if (!validateEnvelope(artifact, ARTIFACT_TYPES.DRAFT_BUNDLE, errors)) return { ok: false, errors };

  requireString(artifact.candidateId, 'candidateId', errors);
  requireString(artifact.contentBriefHash, 'contentBriefHash', errors);
  requireString(artifact.evidencePacketHash, 'evidencePacketHash', errors);

  if (requireArray(artifact.drafts, 'drafts', errors, { minItems: 4, maxItems: 4 })) {
    artifact.drafts.forEach((draft, index) => {
      requireString(draft?.draftId, `drafts[${index}].draftId`, errors);
      requireString(draft?.angleId, `drafts[${index}].angleId`, errors);
      requireString(draft?.hook, `drafts[${index}].hook`, errors);
      requireString(draft?.body, `drafts[${index}].body`, errors);
      requireString(draft?.cta, `drafts[${index}].cta`, errors);
      requireArray(draft?.claimRefs, `drafts[${index}].claimRefs`, errors);
      if (typeof draft?.firstHandLanguageUsed !== 'boolean') {
        errors.push(`drafts[${index}].firstHandLanguageUsed must be a boolean.`);
      }
      if (draft?.mediaRef !== null && !isNonEmptyString(draft?.mediaRef)) {
        errors.push(`drafts[${index}].mediaRef must be a media id or null.`);
      }
    });

    const angleIds = artifact.drafts.map((draft) => draft?.angleId);
    if (new Set(angleIds).size !== 4) errors.push('drafts must map to four distinct angles.');
    const draftIds = artifact.drafts.map((draft) => draft?.draftId);
    if (new Set(draftIds).size !== 4) errors.push('draftIds must be unique.');
  }

  return { ok: errors.length === 0, errors };
}

const GUARDIAN_CHECK_KEYS = Object.freeze([
  'productMatchCheck',
  'publicFigureClaimCheck',
  'rightsCheck',
  'firstHandCheck',
  'affiliateDisclosureCheck',
  'duplicationCheck',
  'exaggerationCheck',
  'sensitiveClaimCheck'
]);

export { GUARDIAN_CHECK_KEYS };

export function validateReviewReport(artifact) {
  const errors = [];
  if (!validateEnvelope(artifact, ARTIFACT_TYPES.REVIEW_REPORT, errors)) return { ok: false, errors };

  requireString(artifact.candidateId, 'candidateId', errors);
  requireString(artifact.draftBundleHash, 'draftBundleHash', errors);
  requireString(artifact.evidencePacketHash, 'evidencePacketHash', errors);
  requireEnum(artifact.decision, GUARDIAN_DECISIONS, 'decision', errors);

  for (const key of GUARDIAN_CHECK_KEYS) {
    const check = artifact[key];
    if (!check || typeof check !== 'object') {
      errors.push(`${key} is required.`);
      continue;
    }
    requireEnum(check.status, CHECK_STATUSES, `${key}.status`, errors);
    requireString(check.detail, `${key}.detail`, errors);
  }

  if (requireArray(artifact.perDraftFindings, 'perDraftFindings', errors, { minItems: 4, maxItems: 4 })) {
    artifact.perDraftFindings.forEach((entry, index) => {
      requireString(entry?.draftId, `perDraftFindings[${index}].draftId`, errors);
      requireArray(entry?.findings, `perDraftFindings[${index}].findings`, errors);
    });
  }

  if (requireArray(artifact.revisionRequests, 'revisionRequests', errors)) {
    artifact.revisionRequests.forEach((request, index) => {
      requireString(request?.draftId, `revisionRequests[${index}].draftId`, errors);
      requireEnum(request?.severity, ['blocker', 'required', 'warning'], `revisionRequests[${index}].severity`, errors);
      requireString(request?.ruleId, `revisionRequests[${index}].ruleId`, errors);
      requireString(request?.problem, `revisionRequests[${index}].problem`, errors);
      requireString(request?.requiredChange, `revisionRequests[${index}].requiredChange`, errors);
      // Guardian returns instructions, never replacement copy (AGENT_HANDOFFS.md §4).
      if ('replacementText' in (request ?? {})) {
        errors.push(`revisionRequests[${index}] must not contain replacement copy.`);
      }
    });
  }

  requireArray(artifact.nonOverridableBlockers, 'nonOverridableBlockers', errors);

  const anyBlock = GUARDIAN_CHECK_KEYS.some((key) => artifact[key]?.status === 'block');
  if (artifact.decision === 'pass' && (anyBlock || artifact.nonOverridableBlockers?.length > 0)) {
    errors.push('Guardian cannot pass while a check blocks or a non-overridable blocker exists.');
  }
  if (artifact.decision === 'block' && !(anyBlock || artifact.nonOverridableBlockers?.length > 0)) {
    errors.push('Guardian block requires at least one blocking check or non-overridable blocker.');
  }
  if (artifact.decision === 'revise' && artifact.revisionRequests?.length === 0) {
    errors.push('Guardian revise requires at least one revision request.');
  }

  return { ok: errors.length === 0, errors };
}

const VALIDATORS = Object.freeze({
  [ARTIFACT_TYPES.EVIDENCE_PACKET]: validateEvidencePacket,
  [ARTIFACT_TYPES.CONTENT_BRIEF]: validateContentBrief,
  [ARTIFACT_TYPES.DRAFT_BUNDLE]: validateDraftBundle,
  [ARTIFACT_TYPES.REVIEW_REPORT]: validateReviewReport
});

export function validateArtifact(artifact) {
  const validator = VALIDATORS[artifact?.type];
  if (!validator) return { ok: false, errors: [`No validator for artifact type ${artifact?.type ?? 'missing'}.`] };
  return validator(artifact);
}

export function createEnvelope({ type, agentId, runId, artifactId, createdAt, inputArtifactRefs = [], evidenceRefs = [] }) {
  return {
    type,
    schemaVersion: SCHEMA_VERSION,
    runId,
    artifactId,
    agentId,
    createdAt,
    inputArtifactRefs: [...inputArtifactRefs],
    evidenceRefs: [...evidenceRefs],
    warnings: [],
    blockers: []
  };
}
