// Deterministic Single-Root-Post Publisher Preflight & Reconciliation Service
// (`PUBLISHING_SPEC.md` §§1–9, `CLAUDE.md` §5 & §21, `AT-44`).
// Enforces closed default-deny payload keys (`text`, `imageUrl` only), zero `reply_to_id` /
// continuation chains, single-use hash-bound approvals, terminal `invalidated`/`expired`/`failed`
// locks, affiliate destination snapshot drift checks, and `unknown != failed` timeout reconciliation.

import { randomUUID } from 'node:crypto';
import { sha256 } from '../../orchestra/src/versioning.mjs';
import { buildAffiliateMapping } from './affiliate-yield-service.mjs';
import { runGuardianChecks } from './guardian-checks.mjs';

export const SCHEDULE_STATES = Object.freeze({
  SCHEDULED: 'scheduled',
  PREFLIGHT: 'preflight',
  READY: 'ready',
  DISPATCHING: 'dispatching',
  PUBLISHED: 'published',
  HELD: 'held',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  UNKNOWN_REMOTE_STATE: 'unknown_remote_state',
  INVALIDATED: 'invalidated',
  EXPIRED: 'expired'
});

const SAFE_MEDIA_RIGHTS = new Set(['owned', 'licensed', 'not_required']);
const ALLOWED_PUBLISH_KEYS = new Set(['text', 'imageUrl']);
const REPLY_OR_CHAIN_KEY_PATTERN = /(?:repl(?:y|ies)|comment|thread_chain|continuation|parent_post|posts|children)/i;
const CANCELLABLE_PRE_DISPATCH_STATES = new Set([
  SCHEDULE_STATES.SCHEDULED,
  SCHEDULE_STATES.HELD,
  SCHEDULE_STATES.READY
]);

export const STANDARD_EVIDENCE_TTL_MS = 24 * 60 * 60 * 1000;
export const ISSUE_EVIDENCE_TTL_MS = 12 * 60 * 60 * 1000;
export const PRICE_CLAIM_TTL_MS = 4 * 60 * 60 * 1000;

function validateHttpsUrl(urlValue) {
  try {
    const parsed = new URL(String(urlValue ?? '').trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Closed default-deny enforcement of `CLAUDE.md` §5: ONLY `text` and optional `https://` `imageUrl`
 * are permitted. Any reply/comment/chain property returns `AUTOMATED_REPLY_FORBIDDEN`; any other
 * unknown property returns `UNKNOWN_PAYLOAD_FIELD_FORBIDDEN`.
 */
export function assertSingleRootPostPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, code: 'INVALID_PAYLOAD', message: 'Publish payload must be a plain object.' };
  }

  for (const key of Object.keys(payload)) {
    if (REPLY_OR_CHAIN_KEY_PATTERN.test(key)) {
      return {
        ok: false,
        code: 'AUTOMATED_REPLY_FORBIDDEN',
        message: `Automated comments and continuation replies (${key}) are prohibited by CLAUDE.md §5.`
      };
    }
    if (!ALLOWED_PUBLISH_KEYS.has(key)) {
      return {
        ok: false,
        code: 'UNKNOWN_PAYLOAD_FIELD_FORBIDDEN',
        message: `Default-deny publish allowlist rejects unknown field: ${key}.`
      };
    }
  }

  const text = String(payload.text ?? '').trim();
  if (!text) {
    return { ok: false, code: 'EMPTY_POST_TEXT', message: 'Single root post text is required.' };
  }
  const codePointLength = [...text].length;
  if (codePointLength > 500) {
    return {
      ok: false,
      code: 'POST_LENGTH_EXCEEDED',
      message: `Single root post exceeds 500 code points (${codePointLength}).`
    };
  }

  if (payload.imageUrl !== undefined && payload.imageUrl !== null && payload.imageUrl !== '') {
    if (!validateHttpsUrl(payload.imageUrl)) {
      return {
        ok: false,
        code: 'INVALID_IMAGE_URL',
        message: 'imageUrl must be a valid https:// URL.'
      };
    }
  }

  return { ok: true, codePointLength };
}

/**
 * Build a redacted official Meta Threads Graph API two-step single-container request preview (`enabled: false`).
 * Never includes `reply_to_id` or raw access tokens.
 */
export function buildRedactedThreadsPublishPreview(rawOptions = {}) {
  if (!rawOptions || typeof rawOptions !== 'object' || Array.isArray(rawOptions)) {
    return { ok: false, code: 'INVALID_PAYLOAD', message: 'Publish preview options must be a plain object.' };
  }
  const normalizedPayload = { ...rawOptions };
  if (normalizedPayload.imageUrl === null || normalizedPayload.imageUrl === undefined || normalizedPayload.imageUrl === '') {
    delete normalizedPayload.imageUrl;
  }
  const check = assertSingleRootPostPayload(normalizedPayload);
  if (!check.ok) return check;

  const { text, imageUrl } = normalizedPayload;
  const body = {
    media_type: imageUrl ? 'IMAGE' : 'TEXT',
    text: String(text).trim(),
    ...(imageUrl ? { image_url: String(imageUrl).trim() } : {})
  };

  return Object.freeze({
    ok: true,
    enabled: false,
    method: 'POST',
    url: 'https://graph.threads.net/v1.0/<redacted-user-id>/threads',
    publishEndpoint: 'https://graph.threads.net/v1.0/<redacted-user-id>/threads_publish',
    statusReconcileEndpoint: 'https://graph.threads.net/v1.0/<redacted-creation-id>?fields=id,status,error_message',
    requiredPermissions: Object.freeze(['threads_basic', 'threads_content_publish']),
    headers: Object.freeze({
      Authorization: 'Bearer <redacted>',
      'Content-Type': 'application/json'
    }),
    body: Object.freeze(body)
  });
}

export function computeApprovalHash({
  candidateId,
  boundMaterialRevision,
  draftId,
  draftText,
  boundCandidateRevision = null
}) {
  return sha256({
    candidateId: String(candidateId ?? ''),
    boundMaterialRevision: String(boundMaterialRevision ?? ''),
    draftId: String(draftId ?? ''),
    draftText: String(draftText ?? ''),
    ...(boundCandidateRevision !== null && boundCandidateRevision !== undefined
      ? { boundCandidateRevision: Number(boundCandidateRevision) }
      : {})
  });
}

function resolveCandidateSources(candidate) {
  if (Array.isArray(candidate?.evidencePacket?.sources) && candidate.evidencePacket.sources.length > 0) {
    return candidate.evidencePacket.sources;
  }
  const fallback = [];
  if (candidate?.sourceRef && String(candidate?.sourceOrigin ?? '').trim()) {
    fallback.push({ id: 'src-1', originId: String(candidate.sourceOrigin).trim() });
  }
  if (candidate?.corroborationRef && String(candidate?.corroborationOrigin ?? '').trim()) {
    fallback.push({ id: 'src-2', originId: String(candidate.corroborationOrigin).trim() });
  }
  return fallback;
}

function evaluateCandidateAffiliateGate(candidate, verifiedAt) {
  if (!candidate?.affiliate) return { ok: true, mapping: null };
  const desiredState = candidate.affiliateMappingState
    || (candidate.exactMatchStatus === 'substitute' ? 'alternative' : 'exact');
  const explicitSeller = String(
    candidate.canonicalListingSnapshot?.seller
    || candidate.affiliateMapping?.canonicalListingSnapshot?.seller
    || candidate.seller
    || ''
  ).trim();
  const snapshot = candidate.canonicalListingSnapshot ?? {
    brand: candidate.brand,
    model: candidate.model,
    variant: candidate.variant,
    seller: explicitSeller,
    destinationUrl: candidate.destinationUrl,
    capturedAt: candidate.evidencePacket?.observedAt || verifiedAt
  };
  return buildAffiliateMapping({
    candidateId: candidate.id,
    productState: candidate.exactMatchStatus,
    state: desiredState,
    affiliateNetwork: candidate.affiliateNetwork,
    acquisitionMode: 'manual_owner_link',
    destinationUrl: candidate.destinationUrl,
    canonicalListingSnapshot: snapshot,
    sources: resolveCandidateSources(candidate),
    requiredDisclosureText: candidate.disclosure,
    lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true,
    verifiedAt
  });
}

function checkEvidenceTtl(candidate, nowIsoString) {
  const observedMs = Date.parse(candidate?.evidencePacket?.observedAt ?? '');
  const ttlMs = candidate?.priceClaimed
    ? PRICE_CLAIM_TTL_MS
    : candidate?.issueLinked
      ? ISSUE_EVIDENCE_TTL_MS
      : STANDARD_EVIDENCE_TTL_MS;
  if (!Number.isFinite(observedMs) || Date.parse(nowIsoString) - observedMs > ttlMs) {
    return { ok: false, code: 'EVIDENCE_TTL_EXPIRED', message: 'Evidence packet is missing observedAt or exceeded freshness TTL.' };
  }
  return { ok: true };
}

/**
 * Deterministic Single-Post Schedule, Preflight, and Reconciliation Registry (`PUBLISHING_SPEC.md` §§2–9).
 */
export function createThreadsPublisherRegistry({
  clock = () => new Date(),
  initialSchedules = [],
  initialConsumedApprovalHashes = []
} = {}) {
  const schedules = new Map();
  const consumedApprovalHashes = new Set();

  for (const item of initialSchedules ?? []) {
    if (item && item.scheduleId) {
      schedules.set(item.scheduleId, structuredClone(item));
      const releasedFailedHash =
        item.status === SCHEDULE_STATES.FAILED && item.invalidationReason !== 'remote_policy_rejected';
      if (item.approvalHash && item.status !== SCHEDULE_STATES.CANCELLED && !releasedFailedHash) {
        consumedApprovalHashes.add(item.approvalHash);
      }
    }
  }
  for (const hash of initialConsumedApprovalHashes ?? []) {
    if (hash) consumedApprovalHashes.add(String(hash));
  }

  function nowIso() {
    return clock().toISOString();
  }

  function scheduleApprovedPost({
    candidate,
    draftId = null,
    desiredLocalDatetime,
    timezone = 'Asia/Seoul',
    preflightWindowMinutes = 15,
    killSwitchActive = false,
    activeMonetizedShowcaseCount = 0,
    monetizedCardNumbers = [],
    extraPayload = {}
  } = {}) {
    if (killSwitchActive) {
      return { ok: false, code: 'KILL_SWITCH_ACTIVE', message: 'Cannot admit schedule while Global Kill Switch is active.' };
    }
    if (candidate?.suppression?.active === true) {
      return { ok: false, code: 'CANDIDATE_SUPPRESSED', message: 'Owner-suppressed candidate cannot be scheduled until restored.' };
    }
    if (!candidate || candidate.workflowState !== 'approved' || candidate.review?.decision !== 'approved' || candidate.review?.stale === true) {
      return { ok: false, code: 'APPROVAL_REQUIRED', message: 'Only non-stale human-approved candidates can be scheduled.' };
    }
    if (candidate.guardian?.decision !== 'pass') {
      return { ok: false, code: 'GUARDIAN_PASS_REQUIRED', message: 'Guardian pass is required before scheduling.' };
    }
    if (
      candidate.review.boundMaterialRevision !== candidate.materialRevision
      || candidate.guardian.boundMaterialRevision !== candidate.review.boundMaterialRevision
    ) {
      return { ok: false, code: 'STALE_APPROVAL_HASH', message: 'Guardian or approval materialRevision drifted.' };
    }
    if (!SAFE_MEDIA_RIGHTS.has(candidate.mediaRights)) {
      return { ok: false, code: 'MEDIA_RIGHTS_REQUIRED', message: 'Publishable media rights are required before scheduling.' };
    }

    const now = nowIso();
    const ttlCheck = checkEvidenceTtl(candidate, now);
    if (!ttlCheck.ok) return ttlCheck;

    const boundApprovedDraftId = candidate.review?.approvedDraftId ?? null;
    if (boundApprovedDraftId && draftId && draftId !== boundApprovedDraftId) {
      return {
        ok: false,
        code: 'UNAPPROVED_DRAFT_SELECTION',
        message: `Approval is bound solely to draft '${boundApprovedDraftId}', not '${draftId}'.`
      };
    }

    const chosenDraftId = boundApprovedDraftId || draftId || candidate.selectedDraftId || candidate.drafts?.[0]?.id;
    const draft = (candidate.drafts ?? []).find((d) => d.id === chosenDraftId);
    if (!draft) {
      return { ok: false, code: 'DRAFT_NOT_FOUND', message: 'Selected approved draft does not exist.' };
    }

    const imageUrl = ['owned', 'licensed'].includes(candidate.mediaRights) ? candidate.publishableMediaUrl || undefined : undefined;
    const singlePostCheck = assertSingleRootPostPayload({
      text: draft.text,
      ...(imageUrl ? { imageUrl } : {}),
      ...extraPayload
    });
    if (!singlePostCheck.ok) return singlePostCheck;

    const affiliateGate = evaluateCandidateAffiliateGate(candidate, now);
    if (!affiliateGate.ok) {
      return {
        ok: false,
        code: 'INVALID_AFFILIATE_MAPPING',
        message: affiliateGate.message
      };
    }

    // Verify `PUBLISHING_SPEC.md` §2 draft-level Guardian preconditions (offset-0 disclosure, public-figure, etc.)
    const entryGuardian = runGuardianChecks({
      drafts: [draft],
      matchState: candidate.exactMatchStatus,
      verifiedClaimIds: (candidate.evidencePacket?.claimEvidence ?? []).map((c) => c.claimId),
      personalUseConfirmed: candidate.personalUse === 'confirmed',
      mediaRightsResolved: SAFE_MEDIA_RIGHTS.has(candidate.mediaRights),
      affiliate: Boolean(candidate.affiliate),
      affiliateNetwork: candidate.affiliateNetwork ?? '',
      disclosure: candidate.disclosure ?? '',
      activeMonetizedShowcaseCount,
      monetizedCardNumbers,
      enforceOffsetZeroDisclosure: Boolean(candidate.affiliate),
      lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true
    });
    if (entryGuardian.decision !== 'pass') {
      return {
        ok: false,
        code: 'GUARDIAN_ENTRY_PRECONDITION_FAILED',
        message: entryGuardian.revisionRequests[0]?.problem ?? 'Draft failed Guardian entry preconditions.',
        blockers: entryGuardian.nonOverridableBlockers
      };
    }

    const approvalHash = computeApprovalHash({
      candidateId: candidate.id,
      boundMaterialRevision: candidate.review.boundMaterialRevision,
      draftId: draft.id,
      draftText: draft.text,
      boundCandidateRevision: candidate.review?.boundCandidateRevision ?? null
    });

    if (candidate.review?.approvalHash && candidate.review.approvalHash !== approvalHash) {
      return {
        ok: false,
        code: 'STALE_APPROVAL_HASH',
        message: 'Computed approvalHash does not match bound candidate.review.approvalHash.'
      };
    }

    if (consumedApprovalHashes.has(approvalHash)) {
      return {
        ok: false,
        code: 'APPROVAL_ALREADY_CONSUMED',
        message: 'Single-use approval hash has already been scheduled or published.'
      };
    }

    if (!desiredLocalDatetime || Number.isNaN(Date.parse(desiredLocalDatetime))) {
      return { ok: false, code: 'INVALID_SCHEDULE_TIME', message: 'Valid desiredLocalDatetime is required.' };
    }

    consumedApprovalHashes.add(approvalHash);
    const scheduleId = `sched-${randomUUID()}`;
    const destinationSnapshotHash = affiliateGate.mapping
      ? sha256({
          destinationUrl: affiliateGate.mapping.destinationUrl,
          brand: affiliateGate.mapping.canonicalListingSnapshot.brand,
          model: affiliateGate.mapping.canonicalListingSnapshot.model,
          variant: affiliateGate.mapping.canonicalListingSnapshot.variant,
          seller: affiliateGate.mapping.canonicalListingSnapshot.seller
        })
      : null;

    const contentHash = sha256({
      draftId: draft.id,
      text: draft.text,
      mediaRights: candidate.mediaRights,
      publishableMediaUrl: candidate.publishableMediaUrl ?? null,
      affiliate: Boolean(candidate.affiliate),
      destinationUrl: candidate.destinationUrl ?? null,
      destinationSnapshotHash,
      disclosure: candidate.disclosure ?? ''
    });

    const record = {
      scheduleId,
      candidateId: candidate.id,
      draftId: draft.id,
      approvalHash,
      boundMaterialRevision: candidate.review.boundMaterialRevision,
      contentHash,
      destinationSnapshotHash,
      idempotencyKey: `pub-idem-${approvalHash.slice(0, 24)}`,
      desiredLocalDatetime,
      timezone,
      preflightWindowMinutes: Math.max(1, Number(preflightWindowMinutes) || 15),
      status: SCHEDULE_STATES.SCHEDULED,
      externalPublishingEnabled: false,
      remoteContainerId: null,
      remotePostId: null,
      invalidationReason: null,
      createdAt: now,
      updatedAt: now
    };

    schedules.set(scheduleId, record);
    return { ok: true, schedule: structuredClone(record) };
  }

  /**
   * Execute `PUBLISHING_SPEC.md` §5 preflight right before dispatch.
   * Terminal states (`published`, `cancelled`, `invalidated`, `expired`, `failed`) and
   * `unknown_remote_state` can NEVER re-enter `ready` without explicit reconciliation or new approval.
   */
  function runPreflight(
    scheduleId,
    {
      candidate,
      currentDestinationSnapshot = null,
      activeMonetizedShowcaseCount = 0,
      monetizedCardNumbers = [],
      killSwitchActive = false
    } = {}
  ) {
    const record = schedules.get(scheduleId);
    if (!record) return { ok: false, code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found.' };
    if (record.status === SCHEDULE_STATES.PUBLISHED) {
      return { ok: false, code: 'ALREADY_PUBLISHED', status: record.status, schedule: structuredClone(record) };
    }
    if (record.status === SCHEDULE_STATES.UNKNOWN_REMOTE_STATE) {
      return {
        ok: false,
        code: 'RECONCILIATION_REQUIRED',
        message: 'Remote state is unknown after timeout; reconcile before retrying.',
        status: record.status,
        schedule: structuredClone(record)
      };
    }
    if (![SCHEDULE_STATES.SCHEDULED, SCHEDULE_STATES.HELD, SCHEDULE_STATES.READY].includes(record.status)) {
      return {
        ok: false,
        code: 'TERMINAL_SCHEDULE_REQUIRES_NEW_REVIEW',
        message: `Schedule in terminal state '${record.status}' requires new owner review and approval.`,
        status: record.status,
        schedule: structuredClone(record)
      };
    }

    const now = nowIso();
    record.status = SCHEDULE_STATES.PREFLIGHT;
    record.updatedAt = now;

    if (killSwitchActive) {
      record.status = SCHEDULE_STATES.HELD;
      record.invalidationReason = 'global_kill_switch_active';
      return { ok: false, code: 'KILL_SWITCH_ACTIVE', status: record.status, schedule: structuredClone(record) };
    }

    if (candidate?.suppression?.active === true) {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = 'owner_suppressed';
      return { ok: false, code: 'CANDIDATE_SUPPRESSED', status: record.status, schedule: structuredClone(record) };
    }

    const draft = (candidate?.drafts ?? []).find((d) => d.id === record.draftId);
    if (
      !candidate
      || !draft
      || candidate.workflowState !== 'approved'
      || candidate.review?.decision !== 'approved'
      || candidate.review?.stale === true
      || (candidate.review?.approvedDraftId && candidate.review.approvedDraftId !== record.draftId)
      || candidate.guardian?.decision !== 'pass'
      || candidate.materialRevision !== record.boundMaterialRevision
      || candidate.guardian?.boundMaterialRevision !== record.boundMaterialRevision
    ) {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = 'approval_or_material_revision_drifted';
      return { ok: false, code: 'APPROVAL_INVALIDATED', status: record.status, schedule: structuredClone(record) };
    }

    if (!SAFE_MEDIA_RIGHTS.has(candidate.mediaRights)) {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = 'media_rights_not_publishable';
      return { ok: false, code: 'MEDIA_RIGHTS_INVALIDATED', status: record.status, schedule: structuredClone(record) };
    }

    const affiliateGate = evaluateCandidateAffiliateGate(candidate, now);
    if (!affiliateGate.ok) {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = 'affiliate_mapping_invalidated';
      return { ok: false, code: 'INVALID_AFFILIATE_MAPPING', status: record.status, schedule: structuredClone(record) };
    }

    // Recheck live destination snapshot if supplied (`PUBLISHING_SPEC.md` §5, `AT-44`)
    if (record.destinationSnapshotHash && currentDestinationSnapshot) {
      const liveHash = sha256({
        destinationUrl: currentDestinationSnapshot.destinationUrl,
        brand: currentDestinationSnapshot.brand,
        model: currentDestinationSnapshot.model,
        variant: currentDestinationSnapshot.variant,
        seller: currentDestinationSnapshot.seller
      });
      if (liveHash !== record.destinationSnapshotHash) {
        record.status = SCHEDULE_STATES.INVALIDATED;
        record.invalidationReason = 'destination_product_or_seller_mutated';
        return { ok: false, code: 'DESTINATION_DRIFT_INVALIDATED', status: record.status, schedule: structuredClone(record) };
      }
    }

    const currentDestHash = affiliateGate.mapping
      ? sha256({
          destinationUrl: affiliateGate.mapping.destinationUrl,
          brand: affiliateGate.mapping.canonicalListingSnapshot.brand,
          model: affiliateGate.mapping.canonicalListingSnapshot.model,
          variant: affiliateGate.mapping.canonicalListingSnapshot.variant,
          seller: affiliateGate.mapping.canonicalListingSnapshot.seller
        })
      : null;

    const currentContentHash = sha256({
      draftId: draft.id,
      text: draft.text,
      mediaRights: candidate.mediaRights,
      publishableMediaUrl: candidate.publishableMediaUrl ?? null,
      affiliate: Boolean(candidate.affiliate),
      destinationUrl: candidate.destinationUrl ?? null,
      destinationSnapshotHash: currentDestHash,
      disclosure: candidate.disclosure ?? ''
    });
    if (currentContentHash !== record.contentHash) {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = 'draft_or_destination_hash_mismatch';
      return { ok: false, code: 'CONTENT_HASH_MISMATCH', status: record.status, schedule: structuredClone(record) };
    }

    const ttlCheck = checkEvidenceTtl(candidate, now);
    if (!ttlCheck.ok) {
      record.status = SCHEDULE_STATES.EXPIRED;
      record.invalidationReason = 'evidence_freshness_ttl_expired';
      return { ok: false, code: 'EVIDENCE_TTL_EXPIRED', status: record.status, schedule: structuredClone(record) };
    }

    // Re-evaluate offset-0 statutory disclosure against CURRENT `/showcase` monetization state (`PUBLISHING_SPEC.md` §5)
    const guardianRecheck = runGuardianChecks({
      drafts: [draft],
      matchState: candidate.exactMatchStatus,
      verifiedClaimIds: (candidate.evidencePacket?.claimEvidence ?? []).map((c) => c.claimId),
      personalUseConfirmed: candidate.personalUse === 'confirmed',
      mediaRightsResolved: SAFE_MEDIA_RIGHTS.has(candidate.mediaRights),
      affiliate: Boolean(candidate.affiliate),
      affiliateNetwork: candidate.affiliateNetwork ?? '',
      disclosure: candidate.disclosure ?? '',
      activeMonetizedShowcaseCount,
      monetizedCardNumbers,
      enforceOffsetZeroDisclosure: Boolean(candidate.affiliate),
      lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true
    });
    if (guardianRecheck.decision !== 'pass') {
      record.status = SCHEDULE_STATES.INVALIDATED;
      record.invalidationReason = guardianRecheck.revisionRequests[0]?.ruleId ?? 'guardian_preflight_failed';
      return {
        ok: false,
        code: 'PREFLIGHT_SOLICITATION_OR_GUARDIAN_DRIFT',
        status: record.status,
        blockers: guardianRecheck.nonOverridableBlockers,
        schedule: structuredClone(record)
      };
    }

    record.status = SCHEDULE_STATES.READY;
    record.invalidationReason = null;
    return {
      ok: true,
      status: record.status,
      schedule: structuredClone(record),
      redactedRequestPreview: buildRedactedThreadsPublishPreview({
        text: draft.text,
        imageUrl: ['owned', 'licensed'].includes(candidate.mediaRights) ? candidate.publishableMediaUrl || null : null
      })
    };
  }

  /**
   * Record dispatch outcome, enforcing `unknown != failed` on submission timeout (`PUBLISHING_SPEC.md` §7).
   */
  function recordDispatchOutcome(
    scheduleId,
    { outcome, remoteContainerId = null, remotePostId = null, errorReason = null } = {}
  ) {
    const record = schedules.get(scheduleId);
    if (!record) return { ok: false, code: 'SCHEDULE_NOT_FOUND' };
    if (record.status === SCHEDULE_STATES.UNKNOWN_REMOTE_STATE) {
      return {
        ok: false,
        code: 'RECONCILIATION_REQUIRED',
        message: 'Cannot dispatch or retry while remote state is unknown.'
      };
    }
    if (record.status !== SCHEDULE_STATES.READY && record.status !== SCHEDULE_STATES.DISPATCHING) {
      return { ok: false, code: 'NOT_READY_FOR_DISPATCH', status: record.status };
    }

    record.updatedAt = nowIso();
    if (remoteContainerId) record.remoteContainerId = String(remoteContainerId);

    if (outcome === 'published') {
      record.status = SCHEDULE_STATES.PUBLISHED;
      record.remotePostId = String(remotePostId || '');
      return { ok: true, status: record.status, schedule: structuredClone(record) };
    }
    if (outcome === 'timeout') {
      record.status = SCHEDULE_STATES.UNKNOWN_REMOTE_STATE;
      record.invalidationReason = errorReason || 'submission_timeout_remote_unknown';
      return { ok: false, code: 'UNKNOWN_REMOTE_STATE', status: record.status, schedule: structuredClone(record) };
    }

    record.status = SCHEDULE_STATES.FAILED;
    record.invalidationReason = errorReason || (outcome === 'policy_rejected' ? 'remote_policy_rejected' : 'dispatch_failed_before_acceptance');
    if (outcome !== 'policy_rejected') {
      consumedApprovalHashes.delete(record.approvalHash);
    }
    return { ok: false, code: outcome === 'policy_rejected' ? 'POLICY_REJECTED' : 'DISPATCH_FAILED', status: record.status, schedule: structuredClone(record) };
  }

  /**
   * Reconcile `'unknown_remote_state'` via official remote existence check before any retry (`PUBLISHING_SPEC.md` §7).
   */
  function reconcileUnknownRemoteState(scheduleId, { remoteExists, remotePostId = null } = {}) {
    const record = schedules.get(scheduleId);
    if (!record) return { ok: false, code: 'SCHEDULE_NOT_FOUND' };
    if (record.status !== SCHEDULE_STATES.UNKNOWN_REMOTE_STATE) {
      return { ok: false, code: 'NOT_IN_UNKNOWN_STATE', status: record.status };
    }
    if (typeof remoteExists !== 'boolean') {
      return { ok: false, code: 'REMOTE_EXISTENCE_BOOLEAN_REQUIRED' };
    }

    record.updatedAt = nowIso();
    if (remoteExists) {
      record.status = SCHEDULE_STATES.PUBLISHED;
      record.remotePostId = String(remotePostId || 'reconciled-remote-post');
      record.invalidationReason = null;
      return { ok: true, reconciledTo: SCHEDULE_STATES.PUBLISHED, repostAllowed: false, schedule: structuredClone(record) };
    }

    record.status = SCHEDULE_STATES.FAILED;
    record.invalidationReason = 'reconciled_absent_safe_to_reschedule';
    consumedApprovalHashes.delete(record.approvalHash);
    return { ok: true, reconciledTo: SCHEDULE_STATES.FAILED, repostAllowed: true, schedule: structuredClone(record) };
  }

  function cancelSchedule(scheduleId) {
    const record = schedules.get(scheduleId);
    if (!record) return { ok: false, code: 'SCHEDULE_NOT_FOUND' };
    if (!CANCELLABLE_PRE_DISPATCH_STATES.has(record.status)) {
      return {
        ok: false,
        code: 'CANNOT_CANCEL_NON_ACTIVE_OR_DISPATCHING',
        message: `Only pre-dispatch active schedules (scheduled/held/ready) can be cancelled; current state is '${record.status}'.`,
        status: record.status
      };
    }
    record.status = SCHEDULE_STATES.CANCELLED;
    record.updatedAt = nowIso();
    consumedApprovalHashes.delete(record.approvalHash);
    return { ok: true, status: record.status, schedule: structuredClone(record) };
  }

  /**
   * Owner confirms manual single-root-post publication (`externalPublishingEnabled: false`).
   * Runs full §2/§5 preflight checks before recording `published`, and reports whether `BS-60`
   * irreversible non-commercial lock applies (`!candidate.affiliate`).
   */
  function recordManualPublication({
    candidate,
    scheduleId = null,
    draftId = null,
    publishedNote = '',
    killSwitchActive = false,
    activeMonetizedShowcaseCount = 0,
    monetizedCardNumbers = []
  } = {}) {
    if (killSwitchActive) {
      return { ok: false, code: 'KILL_SWITCH_ACTIVE', message: 'Cannot record publication while Global Kill Switch is active.' };
    }

    let targetId = scheduleId;
    if (!targetId) {
      const admitted = scheduleApprovedPost({
        candidate,
        draftId,
        desiredLocalDatetime: nowIso(),
        timezone: 'Asia/Seoul',
        killSwitchActive,
        activeMonetizedShowcaseCount,
        monetizedCardNumbers
      });
      if (!admitted.ok) return admitted;
      targetId = admitted.schedule.scheduleId;
    }

    const preflight = runPreflight(targetId, {
      candidate,
      activeMonetizedShowcaseCount,
      monetizedCardNumbers,
      killSwitchActive
    });
    if (!preflight.ok) return preflight;

    const record = schedules.get(targetId);
    record.status = SCHEDULE_STATES.PUBLISHED;
    record.publicationMode = 'manual_owner_confirmed';
    record.publishedNote = String(publishedNote ?? '').trim().slice(0, 240) || null;
    record.updatedAt = nowIso();

    return {
      ok: true,
      status: record.status,
      lockNonCommercialRequired: !candidate?.affiliate,
      schedule: structuredClone(record)
    };
  }

  function exportState() {
    return {
      schedules: [...schedules.values()].map((item) => structuredClone(item)),
      consumedApprovalHashes: [...consumedApprovalHashes]
    };
  }

  return {
    scheduleApprovedPost,
    runPreflight,
    recordDispatchOutcome,
    reconcileUnknownRemoteState,
    cancelSchedule,
    recordManualPublication,
    exportState,
    getSchedule: (id) => (schedules.has(id) ? structuredClone(schedules.get(id)) : null),
    listSchedules: () => [...schedules.values()].map((item) => structuredClone(item))
  };
}
