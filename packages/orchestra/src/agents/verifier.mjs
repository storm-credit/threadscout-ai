// Evidence Verifier.
//
// Sole factual authority for everything downstream (AGENT_HANDOFFS.md H4).
// It reads owner-supplied evidence records and decides identity, rights, and
// freshness. It never fetches anything: a destination URL is stored as string
// evidence, because fetching it would activate a live source that P0-02 and
// DESIGN_FREEZE.md keep disabled.

import { ARTIFACT_TYPES, createEnvelope } from '../../../core/src/artifacts.mjs';
import { AGENT_IDS } from '../../../core/src/handoff.mjs';

/** Identity dimensions from PRODUCT_MATCHING.md section 3 that decide an exact match. */
const DECISIVE_DIMENSIONS = Object.freeze(['brand', 'product_name', 'model', 'variant']);

/**
 * Count distinct underlying origins, not distinct URLs.
 * AT-40 / BS-15: three links that reproduce one source are one piece of evidence.
 */
export function countIndependentOrigins(records = []) {
  return new Set(records.map((record) => record.originId).filter(Boolean)).size;
}

/**
 * Decide the match state from evidence alone.
 *
 * `exact` is deliberately hard to reach: it needs every decisive dimension
 * matched, no conflicts, and two independent origins. PRODUCT_MATCHING.md section 4
 * is explicit that a social photo plus a visually similar listing is not enough.
 */
export function decideMatchState({ identityEvidence = [], ownerDeclaredSubstitute = false }) {
  const reasons = [];

  if (ownerDeclaredSubstitute) {
    return { matchState: 'substitute', reasons: ['소유자가 대체품으로 표시했습니다.'] };
  }

  const conflicts = identityEvidence.filter((item) => item.status === 'conflict');
  if (conflicts.length > 0) {
    return {
      matchState: 'unresolved',
      reasons: conflicts.map((item) => item.dimension + ' 근거가 서로 충돌합니다.')
    };
  }

  if (identityEvidence.length === 0) {
    return { matchState: 'unresolved', reasons: ['제품 동일성 근거가 없습니다.'] };
  }

  const matchedDimensions = new Set(
    identityEvidence.filter((item) => item.status === 'match').map((item) => item.dimension)
  );
  const missing = DECISIVE_DIMENSIONS.filter((dimension) => !matchedDimensions.has(dimension));
  const origins = countIndependentOrigins(identityEvidence.filter((item) => item.status === 'match'));

  if (missing.length === 0 && origins >= 2) {
    return { matchState: 'exact', reasons: [] };
  }
  if (missing.length > 0) reasons.push(missing.join(', ') + ' 근거가 아직 확인되지 않았습니다.');
  if (origins < 2) reasons.push('독립된 출처가 ' + origins + '곳뿐이라 교차 확인이 부족합니다.');

  if (matchedDimensions.size === 0) return { matchState: 'unresolved', reasons };
  return { matchState: 'likely', reasons };
}

function decideVerifierDecision({ matchState, conflicts, publicFigureRelation, mediaRights, unresolvedQuestions }) {
  if (publicFigureRelation?.classification === 'blocked_rumor_private') {
    return { decision: 'reject', reason: '루머 · 사생활 소재는 제품 트리거로 사용할 수 없습니다.' };
  }
  if (mediaRights.some((media) => media.publishRightsState === 'unknown')) {
    return { decision: 'hold', reason: '미디어 사용권이 확인되지 않았습니다.' };
  }
  if (conflicts.length > 0) {
    return { decision: 'hold', reason: '상충하는 근거가 남아 있습니다.' };
  }
  if (matchState === 'unresolved') {
    return { decision: 'hold', reason: '제품 동일성이 확인되지 않았습니다.' };
  }
  if (matchState === 'exact' && unresolvedQuestions.length === 0) {
    return { decision: 'verified', reason: null };
  }
  return { decision: 'limited', reason: '동일 제품 단정 없이 좁은 표현만 가능합니다.' };
}

/**
 * Build the evidence packet.
 *
 * @param {object} request  verification_request
 * @param {object} deps     { clock, nextId }
 */
export function runVerifier(request, { clock, nextId }) {
  const { runId, candidate, evidence } = request;
  const now = clock();

  const identityEvidence = evidence.identityEvidence ?? [];
  const sources = evidence.sources ?? [];
  const mediaRights = evidence.mediaRefs ?? [];
  const ownerClaims = evidence.claims ?? [];

  const { matchState, reasons: matchReasons } = decideMatchState({
    identityEvidence,
    ownerDeclaredSubstitute: evidence.ownerDeclaredSubstitute === true
  });

  const conflicts = identityEvidence
    .filter((item) => item.status === 'conflict')
    .map((item) => ({ dimension: item.dimension, detail: item.note ?? '근거가 충돌합니다.' }));

  // A claim is only carried forward when it names at least one source that exists
  // in this run. Anything else is dropped and recorded, never silently kept.
  const knownSourceIds = new Set(sources.map((source) => source.id));
  const verifiedClaims = [];
  const prohibitedClaims = [];

  for (const claim of ownerClaims) {
    const usable = (claim.sourceIds ?? []).filter((id) => knownSourceIds.has(id));
    if (usable.length === 0) {
      prohibitedClaims.push({
        claimId: claim.claimId ?? null,
        text: claim.text,
        reason: '근거 출처가 연결되지 않아 사용할 수 없습니다.'
      });
      continue;
    }
    verifiedClaims.push({
      claimId: claim.claimId ?? nextId('claim'),
      text: claim.text,
      evidenceClass: claim.evidenceClass ?? 'owner_supplied',
      sourceIds: usable
    });
  }

  const publicFigureRelation = evidence.publicFigureRelation ?? null;
  if (publicFigureRelation && publicFigureRelation.classification !== 'official_endorsement') {
    prohibitedClaims.push({
      claimId: null,
      text: '공개 인물이 이 제품을 추천했다는 표현',
      reason: '확인된 관계 등급을 넘어서는 함의입니다.'
    });
  }

  // Personal-use wording requires an actual usage record (CLAUDE.md section 6, AT-23).
  const personalUseState = evidence.usageRecordConfirmed === true ? 'confirmed' : 'not_confirmed';
  if (personalUseState !== 'confirmed') {
    prohibitedClaims.push({
      claimId: null,
      text: '직접 사용해봤다는 표현',
      reason: '사용 기록이 없어 체험형 표현을 쓸 수 없습니다.'
    });
  }

  // Unresolved questions are the ones that hold up *identity or rights*. An absent
  // price is not one of them: DATA_MODEL.md makes price nullable on purpose, and
  // AT-16 asks the draft to omit the fact rather than the system to stall on it.
  const unresolvedQuestions = [...matchReasons];
  if (evidence.commerce?.priceStatus !== 'observed') {
    prohibitedClaims.push({
      claimId: null,
      text: '현재 가격 · 재고를 단정하는 표현',
      reason: '시점이 찍힌 가격 근거가 없습니다.'
    });
  }

  const { decision, reason: decisionReason } = decideVerifierDecision({
    matchState,
    conflicts,
    publicFigureRelation,
    mediaRights,
    unresolvedQuestions
  });

  const artifact = {
    ...createEnvelope({
      type: ARTIFACT_TYPES.EVIDENCE_PACKET,
      agentId: AGENT_IDS.VERIFIER,
      runId,
      artifactId: nextId('artifact'),
      createdAt: now,
      inputArtifactRefs: request.inputArtifactRefs ?? [],
      evidenceRefs: sources.map((source) => source.id)
    }),
    candidateId: candidate.candidateId,
    canonicalProduct: {
      productName: evidence.product?.productName ?? candidate.name,
      brand: evidence.product?.brand ?? null,
      model: evidence.product?.model ?? null,
      variant: evidence.product?.variant ?? null,
      packageQuantity: evidence.product?.packageQuantity ?? null,
      stableIdentifiers: evidence.product?.stableIdentifiers ?? []
    },
    matchState,
    matchEvidence: identityEvidence.map((item) => ({
      dimension: item.dimension,
      status: item.status,
      sourceIds: item.sourceIds ?? (item.originId ? [item.originId] : []),
      note: item.note ?? ''
    })),
    conflicts,
    verifiedClaims,
    prohibitedClaims,
    publicFigureRelation: publicFigureRelation
      ? {
          classification: publicFigureRelation.classification,
          allowedWording: publicFigureRelation.allowedWording ?? '공개적으로 확인된 사실만 서술',
          prohibitedImplications: ['추천', '협찬', '보증'],
          evidenceRefs: publicFigureRelation.evidenceRefs ?? []
        }
      : null,
    mediaRights: mediaRights.map((media) => ({
      mediaId: media.mediaId,
      publishRightsState: media.publishRightsState,
      allowedActions: media.allowedActions ?? []
    })),
    personalUseState,
    commerceSnapshot: {
      observedAt: evidence.commerce?.observedAt ?? now,
      priceStatus: evidence.commerce?.priceStatus ?? 'unavailable',
      amount: evidence.commerce?.amount ?? null,
      currency: evidence.commerce?.currency ?? null,
      stockStatus: evidence.commerce?.stockStatus ?? 'unknown',
      sellerStatus: evidence.commerce?.sellerStatus ?? 'unverified',
      sellerName: evidence.commerce?.sellerName ?? null,
      variantStatus: evidence.commerce?.variantStatus ?? 'unresolved',
      variantName: evidence.commerce?.variantName ?? null,
      destinationRef: evidence.destinationUrl ?? null
    },
    freshness: {
      evaluatedAt: now,
      classes: {
        listing_identity: evidence.commerce?.observedAt ?? now,
        price_stock: evidence.commerce?.priceStatus === 'observed' ? evidence.commerce?.observedAt ?? now : null
      }
    },
    unresolvedQuestions,
    verifierDecision: decision,
    sources: sources.map((source) => ({
      id: source.id,
      originId: source.originId ?? source.id,
      type: source.type ?? 'owner_supplied',
      label: source.label ?? '',
      observedAt: source.observedAt ?? now
    }))
  };

  if (decisionReason) artifact.warnings.push(decisionReason);
  if (decision === 'reject') artifact.blockers.push(decisionReason);

  const requestedNextAction = decision === 'verified' || decision === 'limited' ? 'strategize' : 'hold';
  return { artifact, requestedNextAction, status: decision === 'reject' ? 'blocked' : 'complete' };
}
