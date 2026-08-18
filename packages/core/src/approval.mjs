// Human approval binding and staleness.
//
// docs/spec/REVIEW_BINDING_SPEC.md: a review decision references one specific draft
// revision plus the evidence, media state, destination mapping, and disclosure used
// by that draft. When any of those change materially, the decision goes stale.
//
// The three-state model (current / approved / stale) is deliberate: "approved but
// the inputs moved" is its own visible state, not a validation error. Presenting it
// as an error would hide from the owner that they already decided once.

import { hashArtifact, sha256 } from './hash.mjs';

export const APPROVAL_STATES = Object.freeze(['none', 'approved', 'stale']);
export const HUMAN_DECISIONS = Object.freeze([
  'approve',
  'edit_and_approve',
  'hold',
  'reject',
  'suppress_product',
  'suppress_category'
]);

/** Decisions this slice implements. Suppression is a later slice. */
export const SLICE_HUMAN_DECISIONS = Object.freeze(['approve', 'edit_and_approve', 'hold', 'reject']);

export const BINDING_KEYS = Object.freeze([
  'evidencePacketHash',
  'draftHash',
  'mediaHash',
  'affiliateMappingHash'
]);

export const BINDING_LABELS_KO = Object.freeze({
  evidencePacketHash: '검증 근거',
  draftHash: '선택한 초안',
  mediaHash: '미디어 사용 상태',
  affiliateMappingHash: '판매 링크 매핑'
});

/**
 * Compute the binding from server-held artifacts.
 *
 * This is never computed from a client payload. A client may *claim* a binding it
 * saw, and the server compares that claim against this; it never stores the claim.
 */
export function computeApprovalBinding({ evidencePacket, draft, mediaRights = [], affiliateMapping = null }) {
  if (!evidencePacket) throw new Error('An evidence packet is required to bind an approval.');
  if (!draft) throw new Error('A selected draft is required to bind an approval.');

  return {
    evidencePacketHash: hashArtifact(evidencePacket),
    // The draft hash covers the text actually under review, including owner edits.
    draftHash: sha256({
      draftId: draft.draftId,
      angleId: draft.angleId,
      hook: draft.hook,
      body: draft.body,
      caution: draft.caution ?? null,
      cta: draft.cta,
      disclosure: draft.disclosure ?? null,
      claimRefs: [...(draft.claimRefs ?? [])].sort(),
      mediaRef: draft.mediaRef ?? null
    }),
    mediaHash: sha256(
      [...mediaRights]
        .map((media) => ({
          mediaId: media.mediaId,
          publishRightsState: media.publishRightsState,
          allowedActions: [...(media.allowedActions ?? [])].sort()
        }))
        .sort((a, b) => a.mediaId.localeCompare(b.mediaId))
    ),
    affiliateMappingHash: sha256(affiliateMapping)
  };
}

export function createApprovalRecord({ approvalId, actor, decision, approvedAt, binding, draftId, note = null }) {
  if (!SLICE_HUMAN_DECISIONS.includes(decision)) {
    throw new Error('Unsupported human decision: ' + decision);
  }
  return {
    approvalId,
    actor,
    decision,
    approvedAt,
    draftId,
    note,
    binding: { ...binding }
  };
}

/**
 * Compare a stored approval against the binding computed from current artifacts.
 * Returns which bound items moved, in owner-facing language.
 */
export function evaluateApprovalState(approval, currentBinding) {
  if (!approval) return { state: 'none', changed: [] };
  if (approval.decision !== 'approve' && approval.decision !== 'edit_and_approve') {
    return { state: 'none', changed: [] };
  }

  const changed = BINDING_KEYS.filter((key) => approval.binding?.[key] !== currentBinding?.[key]).map((key) => ({
    key,
    label: BINDING_LABELS_KO[key]
  }));

  return { state: changed.length > 0 ? 'stale' : 'approved', changed };
}

/**
 * Compare a client's claimed binding against the server's current binding.
 *
 * AT-36: a decision made against an older revision on another device must be
 * rejected and the material change shown, not silently applied to newer artifacts.
 */
export function verifyClaimedBinding(claimed, currentBinding) {
  if (!claimed || typeof claimed !== 'object') {
    return { ok: false, reason: 'binding_missing', changed: [] };
  }
  const changed = BINDING_KEYS.filter((key) => claimed[key] !== currentBinding[key]).map((key) => ({
    key,
    label: BINDING_LABELS_KO[key]
  }));
  if (changed.length > 0) return { ok: false, reason: 'binding_stale', changed };
  return { ok: true, reason: null, changed: [] };
}
