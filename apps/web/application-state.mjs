import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AGENT_IDS, AGENT_REGISTRY, validateAgentRegistry } from '../../packages/orchestra/src/agent-registry.mjs';
import { buildVersionManifest, canonicalStringify, sha256 } from '../../packages/orchestra/src/versioning.mjs';
import {
  MATCH_STATE_LABELS_KO,
  VERIFIER_DECISION_LABELS_KO,
  decideMatchState,
  decideVerifierDecision,
  wordingRuleFor
} from '../../packages/core/src/product-matching.mjs';
import { GUARDIAN_CHECK_KEYS, runGuardianChecks } from '../../packages/core/src/guardian-checks.mjs';
import {
  AFFILIATE_NETWORKS,
  DEFAULT_DISCLOSURE_BY_NETWORK,
  buildAffiliateMapping
} from '../../packages/core/src/affiliate-yield-service.mjs';
import {
  formatCardNumber,
  projectPublicShowcaseCard
} from '../../packages/core/src/public-showcase-projector.mjs';
import { fenceUntrustedPayload } from '../../packages/orchestra/src/passive-data-fencer.mjs';
import {
  evaluateEvidenceReadiness,
  evaluateFreshness,
  evaluateRisk,
  scoreOwnerSuppliedCandidate,
  selectFirstScreen
} from '../../packages/core/src/candidate-ranking.mjs';

export const APPLICATION_STATE_VERSION = 1;
export const EXTERNAL_PUBLISHING_ENABLED = false;

const SAFE_MEDIA_RIGHTS = new Set(['owned', 'licensed', 'not_required']);
const MEDIA_RIGHTS = new Set([...SAFE_MEDIA_RIGHTS, 'unknown']);
const PERSONAL_USE = new Set(['confirmed', 'not_confirmed']);
const REVIEW_DECISIONS = new Set(['approved', 'held', 'rejected']);
const FIRST_HAND_PATTERN = /(직접\s*)?(써보니|사용해보니|써\s*봤|사용해\s*봤|제가\s*써|내가\s*써)/;
const ENDORSEMENT_PATTERN = /(연예인|유명인|방송인|셀럽).{0,18}(추천|픽|쓴다|사용한다)|추천한\s*제품|픽한\s*제품/;
const MAX_COMMAND_HISTORY = 100;
const DISCLOSURE_REQUIRED_MESSAGE = '제휴 링크를 쓰려면 검토할 고지 문구가 필요합니다.';

export class ApplicationCommandError extends Error {
  constructor(message, { code = 'command_error', statusCode = 400, details = null } = {}) {
    super(message);
    this.name = 'ApplicationCommandError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class VersionConflictError extends ApplicationCommandError {
  constructor(candidate, expectedRevision) {
    super(`Expected revision ${expectedRevision}; current revision is ${candidate.revision}.`, {
      code: 'version_conflict',
      statusCode: 409,
      details: { candidateId: candidate.id, expectedRevision, currentRevision: candidate.revision }
    });
    this.name = 'VersionConflictError';
  }
}

function nowIso(clock) {
  return (clock?.() ?? new Date()).toISOString();
}

function cleanString(value, { max = 1000, required = false, label = 'value' } = {}) {
  const text = String(value ?? '').trim().replace(/\u0000/g, '');
  if (required && !text) {
    throw new ApplicationCommandError(`${label} is required.`, {
      code: 'invalid_input', statusCode: 422, details: { field: label, rule: 'required' }
    });
  }
  return text.slice(0, max);
}

function safeMediaRights(value) {
  const normalized = cleanString(value || 'unknown', { max: 32 });
  if (!MEDIA_RIGHTS.has(normalized)) {
    throw new ApplicationCommandError('mediaRights is invalid.', {
      code: 'invalid_input', statusCode: 422, details: { field: 'mediaRights', rule: 'invalid' }
    });
  }
  return normalized;
}

function safePersonalUse(value) {
  const normalized = cleanString(value || 'not_confirmed', { max: 32 });
  if (!PERSONAL_USE.has(normalized)) {
    throw new ApplicationCommandError('personalUse is invalid.', {
      code: 'invalid_input', statusCode: 422, details: { field: 'personalUse', rule: 'invalid' }
    });
  }
  return normalized;
}

/**
 * Collect the owner's references as sources with declared origins.
 *
 * Independence is what makes corroboration mean anything (AT-40, BS-15), and the
 * only way to know two references are independent is for the owner to say where each
 * came from. Two references from the same origin remain one piece of evidence.
 */
function collectSources(candidate) {
  const sources = [];
  if (candidate.sourceRef) {
    sources.push({
      id: 'owner-source-' + sha256(candidate.sourceRef).slice(0, 12),
      originId: candidate.sourceOrigin || 'owner_primary',
      type: candidate.synthetic ? 'fixture_owner_source' : 'owner_supplied_reference',
      ref: candidate.sourceRef
    });
  }
  if (candidate.corroborationRef) {
    sources.push({
      id: 'owner-corroboration-' + sha256(candidate.corroborationRef).slice(0, 12),
      originId: candidate.corroborationOrigin || 'owner_secondary',
      type: candidate.synthetic ? 'fixture_owner_source' : 'owner_supplied_reference',
      ref: candidate.corroborationRef
    });
  }
  return sources;
}

function configRevision() {
  return buildVersionManifest().manifestHash;
}

function materialRevision(candidate) {
  return sha256({
    evidence: candidate.evidencePacket,
    strategies: candidate.strategies,
    drafts: candidate.drafts,
    selectedDraftId: candidate.selectedDraftId,
    mediaRights: candidate.mediaRights,
    affiliate: candidate.affiliate,
    affiliateNetwork: candidate.affiliateNetwork ?? '',
    affiliateMappingState: candidate.affiliateMappingState ?? '',
    destinationUrl: candidate.destinationUrl ?? '',
    publishableMediaUrl: candidate.publishableMediaUrl ?? '',
    disclosure: candidate.disclosure,
    configRevision: candidate.configRevision
  });
}

function createFreshEpochBudget(lifecycleEpoch = 1, { maxInvocations = 16, maxCostKrw = 150 } = {}) {
  return {
    lifecycleEpoch,
    invocations: 0,
    totalChars: 0,
    costKrw: 0,
    maxInvocations,
    maxCostKrw
  };
}

function chargeEpochBudget(candidate, { chars = 600 } = {}) {
  const epoch = candidate.lifecycleEpoch ?? 1;
  if (!candidate.epochBudget || candidate.epochBudget.lifecycleEpoch !== epoch) {
    candidate.epochBudget = createFreshEpochBudget(epoch);
  }
  const eb = candidate.epochBudget;
  const nextInvocations = eb.invocations + 1;
  const nextChars = eb.totalChars + Math.max(100, Number(chars) || 0);
  const nextCost = Number(((nextChars / 1000) * 1.5).toFixed(4));
  if (nextInvocations > eb.maxInvocations || nextCost > eb.maxCostKrw) {
    throw new ApplicationCommandError(
      `Candidate ${candidate.id} (epoch ${epoch}) cumulative specialist budget exhausted.`,
      {
        code: 'budget_exhausted',
        statusCode: 429,
        details: { candidateId: candidate.id, lifecycleEpoch: epoch, invocations: eb.invocations, costKrw: eb.costKrw }
      }
    );
  }
  eb.invocations = nextInvocations;
  eb.totalChars = nextChars;
  eb.costKrw = nextCost;
}

function invalidateDownstream(candidate, reason, { keepEvidence = true, keepStrategies = false, keepDrafts = false } = {}) {
  const hadApprovedReview = candidate.review?.decision === 'approved' && candidate.review?.stale !== true;
  if (!keepEvidence) candidate.evidencePacket = null;
  if (!keepStrategies) candidate.strategies = null;
  if (!keepDrafts) {
    candidate.drafts = null;
    candidate.selectedDraftId = null;
  }
  candidate.guardian = null;
  if (hadApprovedReview) {
    candidate.review = { ...candidate.review, stale: true, staleReason: reason };
    candidate.workflowState = 'stale';
    candidate.blockers = [reason];
  } else {
    candidate.review = null;
  }
}

function bump(candidate, clock, event, details = {}) {
  candidate.revision += 1;
  candidate.updatedAt = nowIso(clock);
  candidate.audit.push({ event, at: candidate.updatedAt, revision: candidate.revision, ...details });
  candidate.audit = candidate.audit.slice(-60);
  candidate.materialRevision = materialRevision(candidate);
}

function createCandidate(payload, { id = `candidate-${randomUUID()}`, synthetic = false, clock } = {}) {
  const name = cleanString(payload.name, { required: true, max: 160, label: 'name' });
  const brand = cleanString(payload.brand, { max: 120 });
  const model = cleanString(payload.model, { max: 120 });
  const variant = cleanString(payload.variant, { max: 160 });
  const sourceRef = cleanString(payload.sourceRef, { max: 1200 });
  const sourceOrigin = cleanString(payload.sourceOrigin, { max: 120 });
  const corroborationRef = cleanString(payload.corroborationRef, { max: 1200 });
  const corroborationOrigin = cleanString(payload.corroborationOrigin, { max: 120 });
  const ownerDeclaredSubstitute = Boolean(payload.ownerDeclaredSubstitute);
  const whyNow = cleanString(payload.whyNow, { required: true, max: 300, label: 'whyNow' });
  const readerValue = cleanString(payload.readerValue, { required: true, max: 300, label: 'readerValue' });
  const mediaRights = safeMediaRights(payload.mediaRights);
  const personalUse = safePersonalUse(payload.personalUse);
  const affiliate = Boolean(payload.affiliate);
  const affiliateNetwork = cleanString(payload.affiliateNetwork, { max: 64 });
  if (affiliateNetwork && !Object.values(AFFILIATE_NETWORKS).includes(affiliateNetwork)) {
    throw new ApplicationCommandError('affiliateNetwork is invalid.', {
      code: 'invalid_input', statusCode: 422, details: { field: 'affiliateNetwork', rule: 'invalid' }
    });
  }
  const affiliateMappingState = cleanString(payload.affiliateMappingState, { max: 32 });
  if (affiliateMappingState && !['exact', 'alternative'].includes(affiliateMappingState)) {
    throw new ApplicationCommandError('affiliateMappingState is invalid.', {
      code: 'invalid_input', statusCode: 422, details: { field: 'affiliateMappingState', rule: 'invalid' }
    });
  }
  const destinationUrl = cleanString(payload.destinationUrl, { max: 1200 });
  const publishableMediaUrl = cleanString(payload.publishableMediaUrl, { max: 1200 });
  const verifiedPros = Array.isArray(payload.verifiedPros)
    ? payload.verifiedPros.map((item) => cleanString(item, { max: 200 })).filter(Boolean).slice(0, 3)
    : [];
  const verifiedLimitation = cleanString(payload.verifiedLimitation, { max: 240 });
  const rawDisclosure = cleanString(payload.disclosure, { max: 500 });
  const disclosure = rawDisclosure || (affiliate && affiliateNetwork ? DEFAULT_DISCLOSURE_BY_NETWORK[affiliateNetwork] : '');
  const createdAt = nowIso(clock);

  const candidate = {
    id,
    sourceMode: synthetic ? 'synthetic_fixture' : 'owner_supplied',
    synthetic,
    name,
    brand,
    model,
    variant,
    sourceRef,
    sourceOrigin,
    corroborationRef,
    corroborationOrigin,
    ownerDeclaredSubstitute,
    whyNow,
    readerValue,
    lane: cleanString(payload.lane || 'practical-novel', { max: 80 }),
    mediaRights,
    personalUse,
    affiliate,
    affiliateNetwork,
    affiliateMappingState,
    affiliateMapping: null,
    destinationUrl,
    publishableMediaUrl,
    verifiedPros,
    verifiedLimitation,
    disclosure,
    cardNumber: null,
    lifecycleEpoch: 1,
    epochBudget: createFreshEpochBudget(1, {
      maxInvocations: Number.isInteger(payload.maxEpochInvocations) ? payload.maxEpochInvocations : 16,
      maxCostKrw: Number.isFinite(payload.maxEpochCostKrw) ? Number(payload.maxEpochCostKrw) : 150
    }),
    lockedNonCommercialAfterPublish: Boolean(payload.lockedNonCommercialAfterPublish),
    opportunityScore: Number.isFinite(payload.opportunityScore)
      ? Math.max(0, Math.min(100, Number(payload.opportunityScore)))
      : scoreOwnerSuppliedCandidate({
          whyNow,
          readerValue,
          identityComplete: Boolean(brand && model && variant),
          hasSourceRef: Boolean(sourceRef),
          laneIsCuriosityOnly: (payload.lane ?? '') === 'curiosity-only'
        }).score,
    evidenceReadiness: 'weak',
    riskLevel: 'review',
    exactMatchStatus: 'unresolved',
    verifierDecision: null,
    freshnessState: 'stale',
    workflowState: 'verification_needed',
    blockers: ['사용자 제공 제품 근거를 확인해야 합니다.'],
    evidencePacket: null,
    strategies: null,
    drafts: null,
    selectedDraftId: null,
    guardian: null,
    review: null,
    revision: 1,
    configRevision: configRevision(),
    materialRevision: null,
    createdAt,
    updatedAt: createdAt,
    audit: [{ event: 'candidate_created', at: createdAt, revision: 1, sourceMode: synthetic ? 'synthetic_fixture' : 'owner_supplied' }]
  };
  candidate.materialRevision = materialRevision(candidate);
  return candidate;
}

function seedReadyCandidate(clock) {
  const candidate = createCandidate({
    name: '접이식 싱크대 물튐 방지 가드',
    brand: 'FixtureLab',
    model: 'SG-01',
    variant: '투명 45cm',
    sourceRef: 'fixture:owner-listing-SG-01',
    sourceOrigin: 'fixture_manufacturer_page',
    // A second, independently-originated reference: an exact identity needs
    // corroboration, so the demo fixture has to actually have it rather than appear
    // exact on one source (PRODUCT_MATCHING section 4).
    corroborationRef: 'fixture:owner-spec-sheet-SG-01',
    corroborationOrigin: 'fixture_marketplace_listing',
    whyNow: '설거지 물튐 문제를 짧은 전후 장면으로 보여주기 쉬운 예시 후보',
    readerValue: '물튐이 잦은 집에서 설치 조건을 빠르게 비교할 수 있음',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    opportunityScore: 82
  }, { id: 'demo-ready-sink-guard', synthetic: true, clock });
  verifyCandidate(candidate, {}, clock);
  return candidate;
}

function seedHighScoreUnresolved(clock) {
  return createCandidate({
    name: '바이럴 수납 신박템 (모델 미확인)',
    brand: '',
    model: '',
    variant: '',
    sourceRef: '',
    whyNow: '관심과 구매 질문은 많지만 정확한 상품이 아직 확인되지 않은 예시',
    readerValue: '정확한 제품을 찾기 전에는 구매 링크보다 근거 확인이 우선',
    mediaRights: 'unknown',
    personalUse: 'not_confirmed',
    opportunityScore: 96
  }, { id: 'demo-unresolved-high-score', synthetic: true, clock });
}

export function createInitialApplicationState({ clock } = {}) {
  const registry = validateAgentRegistry();
  if (!registry.ok) throw new Error(`Invalid fixed agent registry: ${registry.errors.join(' | ')}`);
  const createdAt = nowIso(clock);
  return {
    version: APPLICATION_STATE_VERSION,
    externalPublishingEnabled: EXTERNAL_PUBLISHING_ENABLED,
    fixedAgentCount: AGENT_REGISTRY.length,
    nextCardNumber: 0,
    candidates: [seedReadyCandidate(clock), seedHighScoreUnresolved(clock)],
    commandHistory: {},
    commandOrder: [],
    audit: [{ event: 'application_state_created', at: createdAt }],
    updatedAt: createdAt
  };
}

function getCandidate(state, candidateId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new ApplicationCommandError('Candidate not found.', { code: 'not_found', statusCode: 404 });
  return candidate;
}

function assertExpectedRevision(candidate, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) {
    throw new ApplicationCommandError('expectedRevision is required for candidate mutation.', { code: 'expected_revision_required', statusCode: 409 });
  }
  if (candidate.revision !== expectedRevision) throw new VersionConflictError(candidate, expectedRevision);
}

function applyEvidenceFields(candidate, payload) {
  for (const key of ['brand', 'model', 'variant', 'sourceRef', 'sourceOrigin', 'corroborationRef', 'corroborationOrigin', 'destinationUrl', 'publishableMediaUrl', 'verifiedLimitation']) {
    if (key in payload) {
      const max = (key.endsWith('Ref') || key.endsWith('Url')) ? 1200 : 240;
      candidate[key] = cleanString(payload[key], { max });
    }
  }
  if ('affiliateNetwork' in payload) {
    const net = cleanString(payload.affiliateNetwork, { max: 64 });
    if (net && !Object.values(AFFILIATE_NETWORKS).includes(net)) {
      throw new ApplicationCommandError('affiliateNetwork is invalid.', {
        code: 'invalid_input', statusCode: 422, details: { field: 'affiliateNetwork', rule: 'invalid' }
      });
    }
    candidate.affiliateNetwork = net;
  }
  if ('affiliateMappingState' in payload) {
    const mapState = cleanString(payload.affiliateMappingState, { max: 32 });
    if (mapState && !['exact', 'alternative'].includes(mapState)) {
      throw new ApplicationCommandError('affiliateMappingState is invalid.', {
        code: 'invalid_input', statusCode: 422, details: { field: 'affiliateMappingState', rule: 'invalid' }
      });
    }
    candidate.affiliateMappingState = mapState;
  }
  if ('verifiedPros' in payload && Array.isArray(payload.verifiedPros)) {
    candidate.verifiedPros = payload.verifiedPros.map((item) => cleanString(item, { max: 200 })).filter(Boolean).slice(0, 3);
  }
  if ('ownerDeclaredSubstitute' in payload) candidate.ownerDeclaredSubstitute = Boolean(payload.ownerDeclaredSubstitute);
  if ('mediaRights' in payload) candidate.mediaRights = safeMediaRights(payload.mediaRights);
  if ('personalUse' in payload) candidate.personalUse = safePersonalUse(payload.personalUse);
  if ('affiliate' in payload) {
    const nextAffiliate = Boolean(payload.affiliate);
    if (nextAffiliate && candidate.lockedNonCommercialAfterPublish) {
      throw new ApplicationCommandError('Post-publish non-commercial showcase card cannot be monetized retroactively (BS-60).', {
        code: 'post_publish_monetization_locked',
        statusCode: 422
      });
    }
    candidate.affiliate = nextAffiliate;
  }
  if ('disclosure' in payload) candidate.disclosure = cleanString(payload.disclosure, { max: 500 });
  if (candidate.affiliate && !candidate.disclosure && candidate.affiliateNetwork) {
    candidate.disclosure = DEFAULT_DISCLOSURE_BY_NETWORK[candidate.affiliateNetwork] ?? '';
  }
  if ('lockedNonCommercialAfterPublish' in payload && payload.lockedNonCommercialAfterPublish === true) {
    candidate.lockedNonCommercialAfterPublish = true;
  }
}

/**
 * Evidence Verifier.
 *
 * Owns identity, rights, and the conclusions downstream agents are bound by. It
 * makes no network call: a user-supplied reference is stored as string evidence,
 * because fetching it would activate a live source that P0-02 keeps disabled.
 */
function verifyCandidate(candidate, payload, clock) {
  if (!candidate.synthetic || candidate.evidencePacket !== null) {
    chargeEpochBudget(candidate, { chars: JSON.stringify(payload ?? {}).length + 600 });
  }
  const wasApproved = candidate.review?.decision === 'approved' && candidate.review?.stale !== true;
  applyEvidenceFields(candidate, payload);

  const observedAt = nowIso(clock);
  const untrustedBlob = [candidate.name, candidate.sourceRef, candidate.corroborationRef, candidate.whyNow, candidate.readerValue]
    .filter(Boolean)
    .join('\n');
  const fencedEvidence = fenceUntrustedPayload(untrustedBlob, { source: 'owner_user_evidence' });
  const sources = collectSources(candidate).map((source) => ({ ...source, observedAt }));
  const rightsReady = SAFE_MEDIA_RIGHTS.has(candidate.mediaRights);

  const match = decideMatchState({
    identity: { brand: candidate.brand, model: candidate.model, variant: candidate.variant },
    sources,
    ownerDeclaredSubstitute: candidate.ownerDeclaredSubstitute === true,
    conflicts: []
  });

  // Claims the copy may not make, whatever the drafts say. These are constraints the
  // Writer and Guardian both read, rather than something rediscovered per draft.
  const prohibitedClaims = [];
  if (!wordingRuleFor(match.matchState).sameProductClaimAllowed) {
    prohibitedClaims.push({ text: '링크한 상품이 같은 제품이라는 표현', reason: '동일 제품 확정 근거가 없습니다.' });
  }
  if (candidate.personalUse !== 'confirmed') {
    prohibitedClaims.push({ text: '직접 사용해봤다는 표현', reason: '사용 기록이 없습니다.' });
  }
  prohibitedClaims.push({ text: '현재 가격 · 재고를 단정하는 표현', reason: '시점이 찍힌 가격 근거가 없습니다.' });

  const unresolvedQuestions = [...match.reasons];
  const decision = decideVerifierDecision({
    matchState: match.matchState,
    mediaRightsResolved: rightsReady,
    publicFigureBlocked: false,
    conflicts: [],
    unresolvedQuestions
  });

  const readiness = evaluateEvidenceReadiness({
    verifierDecision: decision.verifierDecision,
    matchState: match.matchState,
    mediaRightsResolved: rightsReady,
    conflicts: [],
    unresolvedQuestions
  });
  const risk = evaluateRisk({
    matchState: match.matchState,
    mediaRightsResolved: rightsReady,
    publicFigureRelation: null,
    conflicts: []
  });
  const freshness = evaluateFreshness({ observedAt, now: observedAt });

  const blockers = [];
  if (!rightsReady) blockers.push('최종 콘텐츠의 미디어 권리가 확인되지 않았습니다.');
  blockers.push(...unresolvedQuestions);
  if (decision.reason) blockers.push(decision.reason);

  candidate.exactMatchStatus = match.matchState;
  candidate.verifierDecision = decision.verifierDecision;
  candidate.evidenceReadiness = readiness.state;
  candidate.riskLevel = risk.level;
  candidate.freshnessState = freshness.state;
  candidate.blockers = [...new Set(blockers)];

  const identityText = `${candidate.brand} ${candidate.model} ${candidate.variant}`.trim();
  candidate.evidencePacket = {
    agentId: AGENT_IDS.VERIFIER,
    truthClass: candidate.synthetic ? 'synthetic_fixture' : 'owner_supplied',
    verificationBasis: 'owner_supplied_evidence_no_network',
    observedAt,
    canonicalProduct: {
      name: candidate.name,
      brand: candidate.brand,
      model: candidate.model,
      variant: candidate.variant
    },
    exactMatchStatus: match.matchState,
    matchState: match.matchState,
    independentOrigins: match.independentOrigins,
    verifierDecision: decision.verifierDecision,
    sources,
    mediaRights: candidate.mediaRights,
    personalUse: candidate.personalUse,
    // An identity claim exists only when there is an identity to claim.
    claimEvidence: identityText && sources.length > 0 ? [{
      claimId: 'claim-identity',
      text: identityText,
      status: candidate.synthetic ? 'verified_fixture' : 'owner_supplied_identity',
      sourceIds: sources.map((source) => source.id)
    }] : [],
    prohibitedClaims,
    unresolvedQuestions,
    publicFigureRelation: null,
    freshness: { state: freshness.state, evaluatedAt: observedAt, reasons: freshness.reasons },
    passiveDataFence: { nonce: fencedEvidence.nonce, openTag: fencedEvidence.openTag, closeTag: fencedEvidence.closeTag },
    conflicts: [],
    blockers: candidate.blockers
  };

  invalidateDownstream(candidate, '승인 후 제품 근거가 변경되어 다시 검토해야 합니다.', { keepEvidence: true });
  if (!wasApproved) {
    const strategyEligible = ['verified', 'limited'].includes(candidate.verifierDecision) && candidate.evidencePacket.claimEvidence.length > 0;
    candidate.workflowState = (candidate.evidenceReadiness === 'ready' || (candidate.exactMatchStatus === 'substitute' && strategyEligible))
      ? 'evidence_ready'
      : 'evidence_partial';
    candidate.review = null;
  }
  bump(candidate, clock, 'verification_completed', { exactMatchStatus: candidate.exactMatchStatus, evidenceReadiness: candidate.evidenceReadiness });
  return candidate;
}

/**
 * The Strategist gate.
 *
 * AGENT_HANDOFFS.md H4 gates on the Verifier's own decision, not on the readiness
 * label: `hold` and `reject` stop the run, while `limited` may proceed with narrower
 * wording. That distinction is what lets a labelled substitute become content at all
 * while an unidentified product cannot.
 */
function assertEvidenceReady(candidate) {
  if (!['verified', 'limited'].includes(candidate.verifierDecision)) {
    throw new ApplicationCommandError('Evidence is not ready for content strategy.', {
      code: 'evidence_not_ready',
      statusCode: 422,
      details: {
        verifierDecision: candidate.verifierDecision,
        exactMatchStatus: candidate.exactMatchStatus,
        blockers: candidate.blockers
      }
    });
  }
}

function createStrategies(candidate, clock) {
  assertEvidenceReady(candidate);
  const identity = candidate.evidencePacket?.claimEvidence?.find((claim) => claim.claimId === 'claim-identity');
  if (!identity) throw new ApplicationCommandError('Verifier identity evidence is missing.', { code: 'verifier_authority_missing', statusCode: 422 });
  chargeEpochBudget(candidate, { chars: 1200 });
  const createdAt = nowIso(clock);
  candidate.strategies = {
    agentId: AGENT_IDS.STRATEGIST,
    createdAt,
    evidenceObservedAt: candidate.evidencePacket.observedAt,
    evidenceClaimIds: ['claim-identity'],
    angles: [
      {
        id: 'problem-result',
        title: '문제 → 판단',
        readerPromise: candidate.readerValue,
        hook: candidate.whyNow,
        proof: 'claim-identity',
        limitation: '실제 효용은 사용자 환경에서 별도 확인이 필요합니다.'
      },
      {
        id: 'mechanism-demo',
        title: '구조·옵션 확인',
        readerPromise: '비슷해 보이는 제품을 모델·옵션 기준으로 구분합니다.',
        hook: `${candidate.name}에서 먼저 볼 것은 제품명보다 모델과 옵션입니다.`,
        proof: 'claim-identity',
        limitation: '기능 효과를 근거 없이 단정하지 않습니다.'
      },
      {
        id: 'buying-checklist',
        title: '구매 체크리스트',
        readerPromise: '구매 전 확인할 제품 식별 기준을 빠르게 정리합니다.',
        hook: '링크를 누르기 전에 브랜드·모델·옵션이 같은지 확인합니다.',
        proof: 'claim-identity',
        limitation: '가격·재고·판매자 정보는 이 로컬 슬라이스에서 현재 사실로 검증하지 않습니다.'
      },
      {
        id: 'honest-fit',
        title: '맞는 사람 / 안 맞는 사람',
        readerPromise: '누구에게나 필수라고 말하지 않고 사용 맥락을 먼저 봅니다.',
        hook: candidate.readerValue,
        proof: 'claim-identity',
        limitation: '직접 사용 기록이 없으면 체험 표현을 쓰지 않습니다.'
      }
    ]
  };
  invalidateDownstream(candidate, '전략이 변경되어 이전 승인 검토가 더 이상 유효하지 않습니다.', { keepEvidence: true, keepStrategies: true });
  if (candidate.workflowState !== 'stale') candidate.workflowState = 'strategy_ready';
  candidate.blockers = [];
  bump(candidate, clock, 'strategies_created', { count: 4 });
  return candidate;
}

function draftDisclosure(candidate) {
  if (!candidate.affiliate) return '';
  return candidate.disclosure || (candidate.affiliateNetwork ? DEFAULT_DISCLOSURE_BY_NETWORK[candidate.affiliateNetwork] ?? '' : '');
}

function createDrafts(candidate, clock) {
  if (!candidate.strategies?.angles || candidate.strategies.angles.length !== 4) {
    throw new ApplicationCommandError('Four strategies are required before drafts.', { code: 'strategy_not_ready', statusCode: 422 });
  }
  chargeEpochBudget(candidate, { chars: 1600 });
  const identity = `${candidate.brand} ${candidate.model} ${candidate.variant}`.trim();
  const disclosure = draftDisclosure(candidate);
  const offsetZeroPrefix = candidate.affiliate && disclosure ? `${disclosure}\n` : '';
  const showcasePointer = candidate.affiliate && (candidate.destinationUrl || candidate.affiliateNetwork)
    ? ` 상세 검증 스펙과 한계 정리는 프로필 쇼케이스에서 확인하세요.`
    : '';

  // A substitute must be labelled as an alternative in the copy itself, not only in
  // the internal state (PRODUCT_MATCHING.md section 5, AT-10). The Writer states it;
  // the Guardian independently checks that it is there.
  const substituteNotice = (candidate.exactMatchStatus === 'substitute' || candidate.affiliateMappingState === 'alternative')
    ? ' 이 링크는 같은 제품이 아니라 비슷한 제품입니다.'
    : '';
  const identityCaveat = candidate.exactMatchStatus === 'likely'
    ? ' 판매 페이지와 동일 제품인지는 아직 단정하지 않습니다.'
    : '';

  const texts = [
    `${candidate.readerValue}이 필요한 상황이라면 ${candidate.name}을 후보로 볼 수 있습니다. 사용자 제공 근거 기준 제품 식별은 ${identity}입니다. 실제 효용은 사용 환경에 따라 확인해야 합니다.`,
    `${candidate.name}을 볼 때는 이름보다 브랜드·모델·옵션을 먼저 맞추는 편이 안전합니다. 현재 사용자 제공 기준은 ${identity}입니다. 비슷한 외형만으로 같은 제품이라고 보지 않습니다.`,
    `구매 전 체크: ① 브랜드 ② 모델 ③ 옵션/변형. 현재 확인 대상으로 입력된 제품은 ${identity}입니다. 가격·재고·판매자는 이 로컬 검토 단계에서 현재 사실로 단정하지 않습니다.`,
    `${candidate.name}이 모든 사람에게 필요한 제품이라고 보기는 어렵습니다. ${candidate.readerValue}이 실제 문제인 경우에만 후보로 검토하고, 직접 써본 기록이 없다면 체험담처럼 쓰지 않습니다.`
  ];
  candidate.drafts = candidate.strategies.angles.map((angle, index) => ({
    id: `draft-${index + 1}`,
    angleId: angle.id,
    title: angle.title,
    text: `${offsetZeroPrefix}${texts[index]}${substituteNotice}${identityCaveat}${showcasePointer}`,
    claimIds: ['claim-identity'],
    disclosure
  }));
  candidate.selectedDraftId = candidate.drafts[0].id;
  candidate.guardian = null;
  if (candidate.review?.decision === 'approved' && candidate.review?.stale !== true) {
    candidate.review = { ...candidate.review, stale: true, staleReason: '초안이 다시 생성되어 승인이 무효화되었습니다.' };
    candidate.workflowState = 'stale';
    candidate.blockers = ['초안이 다시 생성되어 승인이 무효화되었습니다.'];
  } else {
    candidate.review = null;
    candidate.workflowState = 'draft_ready';
    candidate.blockers = [];
  }
  bump(candidate, clock, 'drafts_created', { count: 4 });
  return candidate;
}

function editDraft(candidate, payload, clock) {
  if (!candidate.drafts?.length) throw new ApplicationCommandError('Drafts do not exist.', { code: 'draft_not_ready', statusCode: 422 });
  const draftId = cleanString(payload.draftId, { required: true, max: 80, label: 'draftId' });
  const text = cleanString(payload.text, { required: true, max: 5000, label: 'text' });
  if ([...text].length > 500) {
    throw new ApplicationCommandError('Draft text must not exceed 500 code points.', {
      code: 'invalid_input',
      statusCode: 422,
      details: { field: 'text', rule: 'maxCodePoints', max: 500 }
    });
  }
  const index = candidate.drafts.findIndex((draft) => draft.id === draftId);
  if (index < 0) throw new ApplicationCommandError('Draft not found.', { code: 'not_found', statusCode: 404 });
  const hadApprovedReview = candidate.review?.decision === 'approved' && candidate.review?.stale !== true;
  candidate.drafts[index] = { ...candidate.drafts[index], text };
  candidate.selectedDraftId = draftId;
  candidate.guardian = null;
  if (hadApprovedReview) {
    candidate.review = { ...candidate.review, stale: true, staleReason: '승인 후 초안 내용이 변경되었습니다.' };
    candidate.workflowState = 'stale';
    candidate.blockers = ['승인 후 초안 내용이 변경되어 다시 검토해야 합니다.'];
  } else {
    candidate.review = null;
    candidate.workflowState = 'draft_ready';
    candidate.blockers = [];
  }
  bump(candidate, clock, 'draft_edited', { draftId });
  return candidate;
}

function runGuardian(candidate, clock, state = null) {
  if (!candidate.drafts?.length || candidate.drafts.length !== 4) {
    throw new ApplicationCommandError('Four drafts are required for Guardian review.', { code: 'draft_not_ready', statusCode: 422 });
  }
  chargeEpochBudget(candidate, { chars: JSON.stringify(candidate.drafts).length });
  const now = nowIso(clock);

  if (!['exact', 'substitute'].includes(candidate.exactMatchStatus) || !['verified', 'limited'].includes(candidate.verifierDecision) || !SAFE_MEDIA_RIGHTS.has(candidate.mediaRights)) {
    candidate.guardian = {
      agentId: AGENT_IDS.GUARDIAN,
      decision: 'block',
      blockers: ['제품 동일성(정품/검증 대체품) 또는 미디어 권리 근거가 충분하지 않습니다.'],
      warnings: [],
      reviewedAt: now,
      boundMaterialRevision: candidate.materialRevision
    };
    candidate.workflowState = 'blocked';
    candidate.blockers = [...candidate.guardian.blockers];
    bump(candidate, clock, 'guardian_blocked');
    return candidate;
  }

  let affiliateMappingError = null;
  if (candidate.affiliate) {
    const desiredState = candidate.affiliateMappingState
      || (candidate.exactMatchStatus === 'substitute' ? 'alternative' : 'exact');
    const mappingCheck = buildAffiliateMapping({
      candidateId: candidate.id,
      productState: candidate.exactMatchStatus,
      state: desiredState,
      affiliateNetwork: candidate.affiliateNetwork,
      acquisitionMode: 'manual_owner_link',
      destinationUrl: candidate.destinationUrl,
      canonicalListingSnapshot: {
        brand: candidate.brand,
        model: candidate.model,
        variant: candidate.variant,
        seller: candidate.sourceOrigin || 'owner_verified_seller',
        destinationUrl: candidate.destinationUrl,
        capturedAt: candidate.evidencePacket?.observedAt || now
      },
      sources: collectSources(candidate),
      requiredDisclosureText: candidate.disclosure,
      lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true,
      verifiedAt: candidate.evidencePacket?.observedAt || now
    });
    if (!mappingCheck.ok) {
      affiliateMappingError = mappingCheck.message;
      candidate.affiliateMapping = null;
    } else {
      candidate.affiliateMapping = mappingCheck.mapping;
    }
  } else {
    candidate.affiliateMapping = null;
  }

  const monetizedShowcaseCards = (state?.candidates ?? [])
    .filter((item) => item.id !== candidate.id && item.cardNumber != null)
    .map((item) => projectPublicShowcaseCard(item, { now }))
    .filter((proj) => proj.projected && proj.card.verifiedDestinationUrl !== null)
    .map((proj) => proj.card);
  const monetizedCardNumbers = monetizedShowcaseCards.map((c) => Number(String(c.cardNumber).replace(/^#/, '')));

  // The Guardian reads the drafts as they currently stand, owner edits included, and
  // the evidence packet — never the Writer's reasoning. Its blocking findings cannot
  // be approved past (AT-08, AT-17).
  const review = runGuardianChecks({
    drafts: candidate.drafts,
    matchState: candidate.exactMatchStatus,
    verifiedClaimIds: (candidate.evidencePacket?.claimEvidence ?? []).map((claim) => claim.claimId),
    personalUseConfirmed: candidate.personalUse === 'confirmed',
    mediaRightsResolved: SAFE_MEDIA_RIGHTS.has(candidate.mediaRights),
    affiliate: candidate.affiliate,
    affiliateNetwork: candidate.affiliateNetwork,
    affiliateMappingError,
    disclosure: candidate.disclosure,
    publicFigureVerifiedEndorsement: false,
    activeMonetizedShowcaseCount: monetizedShowcaseCards.length,
    monetizedCardNumbers,
    enforceOffsetZeroDisclosure: Boolean(candidate.affiliate),
    lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true
  });

  candidate.guardian = {
    agentId: AGENT_IDS.GUARDIAN,
    decision: review.decision,
    checks: review.checks,
    revisionRequests: review.revisionRequests,
    nonOverridableBlockers: review.nonOverridableBlockers,
    blockers: review.revisionRequests.length
      ? [...new Set(review.revisionRequests.map((item) => item.problem))]
      : [],
    warnings: candidate.synthetic
      ? ['예시 데이터는 현재 시장 사실이 아닙니다.']
      : ['현재 검증 근거는 사용자 제공 자료이며 네트워크 재검증을 수행하지 않았습니다.'],
    reviewedAt: nowIso(clock),
    boundMaterialRevision: candidate.materialRevision
  };
  candidate.review = null;
  candidate.workflowState = review.decision === 'pass'
    ? 'guardian_pass'
    : review.decision === 'block' ? 'blocked' : 'guardian_revise';
  candidate.blockers = [...candidate.guardian.blockers];
  bump(candidate, clock, 'guardian_reviewed', { decision: review.decision });
  return candidate;
}

function recordReviewDecision(candidate, payload, clock, state = null) {
  const decision = cleanString(payload.decision, { required: true, max: 32, label: 'decision' });
  if (!REVIEW_DECISIONS.has(decision)) {
    throw new ApplicationCommandError('Review decision is invalid.', {
      code: 'invalid_input', statusCode: 422, details: { field: 'decision', rule: 'invalid' }
    });
  }

  if (decision === 'approved') {
    if (candidate.guardian?.decision !== 'pass') {
      throw new ApplicationCommandError('Guardian pass is required before approval.', { code: 'guardian_gate', statusCode: 422 });
    }
    if (candidate.guardian.boundMaterialRevision !== candidate.materialRevision) {
      throw new ApplicationCommandError('Guardian review is stale. Run Guardian again.', { code: 'stale_guardian', statusCode: 409 });
    }
    if (candidate.cardNumber == null && ['exact', 'substitute'].includes(candidate.exactMatchStatus)) {
      const currentMax = Math.max(
        Number(state?.nextCardNumber ?? 0),
        ...(state?.candidates ?? []).map((item) => Number(item.cardNumber ?? 0))
      );
      candidate.cardNumber = currentMax + 1;
      if (state) state.nextCardNumber = candidate.cardNumber;
    }
  }

  const decidedAt = nowIso(clock);
  candidate.review = {
    decision,
    actor: 'owner',
    boundMaterialRevision: candidate.materialRevision,
    boundCandidateRevision: candidate.revision,
    decidedAt,
    stale: false
  };
  candidate.workflowState = decision === 'approved' ? 'approved' : decision;
  candidate.blockers = [];
  bump(candidate, clock, 'human_review_decision', { decision });
  return candidate;
}

function reopenRejectedCandidate(candidate, clock) {
  if (candidate.workflowState !== 'rejected') {
    throw new ApplicationCommandError('Only owner-rejected candidates can increment lifecycle_epoch.', {
      code: 'reopen_requires_rejected_state',
      statusCode: 422
    });
  }
  candidate.lifecycleEpoch = (candidate.lifecycleEpoch ?? 1) + 1;
  candidate.epochBudget = createFreshEpochBudget(candidate.lifecycleEpoch, {
    maxInvocations: candidate.epochBudget?.maxInvocations ?? 16,
    maxCostKrw: candidate.epochBudget?.maxCostKrw ?? 150
  });
  candidate.workflowState = 'verification_needed';
  candidate.review = null;
  bump(candidate, clock, 'reopen_rejected_candidate', { lifecycleEpoch: candidate.lifecycleEpoch });
  return candidate;
}

function lockNonCommercialShowcase(candidate, clock) {
  if (candidate.workflowState !== 'approved' || candidate.affiliate === true) {
    throw new ApplicationCommandError('Only approved non-commercial candidates can be locked as non-commercial published posts.', {
      code: 'lock_requires_approved_non_commercial',
      statusCode: 422
    });
  }
  candidate.lockedNonCommercialAfterPublish = true;
  bump(candidate, clock, 'lock_non_commercial_showcase');
  return candidate;
}

function nextAction(candidate) {
  if (candidate.workflowState === 'stale') return { label: '다시 확인', action: 'open_workspace', disabled: false, reason: candidate.blockers[0] ?? '승인한 버전과 현재 버전이 다릅니다.' };
  if (candidate.workflowState === 'verification_needed' || candidate.workflowState === 'evidence_partial') return { label: '근거 확인', action: 'open_workspace', disabled: false, reason: candidate.blockers[0] ?? null };
  if (candidate.workflowState === 'evidence_ready') return { label: '전략 4개 만들기', action: 'request_strategies', disabled: false, reason: null };
  if (candidate.workflowState === 'strategy_ready') return { label: '초안 4개 만들기', action: 'request_drafts', disabled: false, reason: null };
  if (candidate.workflowState === 'draft_ready') return { label: 'Guardian 검수', action: 'run_guardian', disabled: false, reason: null };
  if (candidate.workflowState === 'guardian_revise') return { label: '수정사항 보기', action: 'open_workspace', disabled: false, reason: candidate.blockers[0] ?? null };
  if (candidate.workflowState === 'guardian_pass') return { label: '승인 검토', action: 'open_workspace', disabled: false, reason: null };
  if (candidate.workflowState === 'approved') return { label: '승인됨', action: 'open_workspace', disabled: false, reason: '외부 게시 기능은 꺼져 있습니다.' };
  if (candidate.workflowState === 'held') return { label: '보류 상세', action: 'open_workspace', disabled: false, reason: null };
  if (candidate.workflowState === 'rejected') return { label: '거절 상세', action: 'open_workspace', disabled: false, reason: null };
  if (candidate.workflowState === 'blocked') return { label: '차단 이유 보기', action: 'open_workspace', disabled: false, reason: candidate.blockers[0] ?? null };
  return { label: '상세 보기', action: 'open_workspace', disabled: false, reason: null };
}

function toCandidateReadModel(candidate, { now } = {}) {
  const evalNow = now || candidate.updatedAt;
  return {
    id: candidate.id,
    synthetic: candidate.synthetic,
    sourceMode: candidate.sourceMode,
    name: candidate.name,
    brand: candidate.brand,
    model: candidate.model,
    variant: candidate.variant,
    sourceRef: candidate.sourceRef,
    lane: candidate.lane,
    whyNow: candidate.whyNow,
    readerValue: candidate.readerValue,
    opportunityScore: candidate.opportunityScore,
    evidenceReadiness: candidate.evidenceReadiness,
    riskLevel: candidate.riskLevel,
    exactMatchStatus: candidate.exactMatchStatus,
    matchStateLabel: MATCH_STATE_LABELS_KO[candidate.exactMatchStatus] ?? candidate.exactMatchStatus,
    verifierDecision: candidate.verifierDecision ?? null,
    verifierDecisionLabel: candidate.verifierDecision
      ? VERIFIER_DECISION_LABELS_KO[candidate.verifierDecision]
      : null,
    freshnessState: candidate.freshnessState ?? 'stale',
    independentOrigins: candidate.evidencePacket?.independentOrigins ?? 0,
    prohibitedClaims: structuredClone(candidate.evidencePacket?.prohibitedClaims ?? []),
    unresolvedQuestions: structuredClone(candidate.evidencePacket?.unresolvedQuestions ?? []),
    ownerDeclaredSubstitute: candidate.ownerDeclaredSubstitute === true,
    sourceOrigin: candidate.sourceOrigin ?? '',
    corroborationRef: candidate.corroborationRef ?? '',
    corroborationOrigin: candidate.corroborationOrigin ?? '',
    mediaRights: candidate.mediaRights,
    personalUse: candidate.personalUse,
    affiliate: candidate.affiliate,
    affiliateNetwork: candidate.affiliateNetwork ?? '',
    affiliateMappingState: candidate.affiliateMappingState ?? '',
    destinationUrl: candidate.destinationUrl ?? '',
    publishableMediaUrl: candidate.publishableMediaUrl ?? '',
    verifiedPros: structuredClone(candidate.verifiedPros ?? []),
    verifiedLimitation: candidate.verifiedLimitation ?? '',
    disclosure: candidate.disclosure,
    cardNumber: candidate.cardNumber ?? null,
    cardCode: candidate.cardNumber != null ? formatCardNumber(candidate.cardNumber) : null,
    lifecycleEpoch: candidate.lifecycleEpoch ?? 1,
    epochBudget: structuredClone(candidate.epochBudget ?? null),
    lockedNonCommercialAfterPublish: candidate.lockedNonCommercialAfterPublish === true,
    showcaseProjected: candidate.cardNumber != null
      ? projectPublicShowcaseCard(candidate, { now: evalNow }).projected
      : false,
    workflowState: candidate.workflowState,
    blockers: structuredClone(candidate.blockers),
    topBlocker: candidate.blockers[0] ?? null,
    revision: candidate.revision,
    materialRevision: candidate.materialRevision,
    strategies: structuredClone(candidate.strategies),
    drafts: structuredClone(candidate.drafts),
    selectedDraftId: candidate.selectedDraftId,
    guardian: structuredClone(candidate.guardian),
    review: structuredClone(candidate.review),
    nextAction: nextAction(candidate),
    updatedAt: candidate.updatedAt
  };
}

export function toTodayReadModel(state, { now } = {}) {
  const evalNow = now || state.updatedAt;
  // The first five are not simply the five highest scores, and every inclusion or
  // exclusion states its reason (RANKING_SCORING_SPEC section 11, AT-29). Returning
  // fewer than five, or none, is a valid outcome rather than a failure (AT-28).
  const selection = selectFirstScreen(state.candidates);
  const candidates = selection.selected.map((c) => toCandidateReadModel(c, { now: evalNow }));
  const excludedById = new Map(selection.excluded.map((item) => [item.candidateId, item]));
  const excluded = state.candidates
    .filter((candidate) => excludedById.has(candidate.id))
    .map((candidate) => ({
      ...toCandidateReadModel(candidate, { now: evalNow }),
      exclusionReason: excludedById.get(candidate.id)
    }));

  return {
    excluded,
    emptyReason: selection.emptyReason,
    version: state.version,
    serverUpdatedAt: state.updatedAt,
    externalPublishingEnabled: false,
    fixedAgentCount: state.fixedAgentCount,
    counters: {
      observed: state.candidates.length,
      recommended: candidates.length,
      verificationNeeded: state.candidates.filter((candidate) => ['verification_needed', 'evidence_partial', 'stale'].includes(candidate.workflowState)).length,
      approved: state.candidates.filter((candidate) => candidate.workflowState === 'approved').length
    },
    candidates,
    capability: {
      liveSourcesEnabled: false,
      externalPublishingEnabled: false,
      persistence: 'server_atomic_json_local_single_process',
      truthBoundary: 'owner-supplied or synthetic fixture; no live network verification'
    }
  };
}

function commandFingerprint(request) {
  return sha256({
    command: request.command,
    candidateId: request.candidateId ?? null,
    expectedRevision: request.expectedRevision ?? null,
    payload: request.payload ?? {}
  });
}

function recordCommand(state, request, response) {
  const requestId = request.requestId;
  state.commandHistory[requestId] = {
    fingerprint: commandFingerprint(request),
    command: request.command,
    candidateId: request.candidateId ?? null,
    result: response.result ?? 'ok',
    recordedAt: state.updatedAt
  };
  state.commandOrder = [...state.commandOrder.filter((id) => id !== requestId), requestId].slice(-MAX_COMMAND_HISTORY);
  const keep = new Set(state.commandOrder);
  for (const id of Object.keys(state.commandHistory)) if (!keep.has(id)) delete state.commandHistory[id];
}

function applyCommandToState(state, request, clock) {
  const requestId = cleanString(request.requestId, { required: true, max: 160, label: 'requestId' });
  const command = cleanString(request.command, { required: true, max: 80, label: 'command' });
  request = { ...request, requestId, command, payload: request.payload && typeof request.payload === 'object' ? request.payload : {} };

  const prior = state.commandHistory[requestId];
  if (prior) {
    if (prior.fingerprint !== commandFingerprint(request)) {
      throw new ApplicationCommandError('requestId was already used for a different command.', { code: 'idempotency_key_reused', statusCode: 409 });
    }
    return { state, response: { result: prior.result, idempotentReplay: true, today: toTodayReadModel(state) }, changed: false };
  }

  if (command === 'reset_demo') {
    const next = createInitialApplicationState({ clock });
    next.updatedAt = nowIso(clock);
    const response = { result: 'reset', idempotentReplay: false, today: toTodayReadModel(next) };
    recordCommand(next, request, response);
    return { state: next, response, changed: true };
  }

  if (command === 'add_manual_candidate') {
    const candidate = createCandidate(request.payload, { clock });
    state.candidates.unshift(candidate);
    state.candidates = state.candidates.slice(0, 10000);
    state.updatedAt = nowIso(clock);
    state.audit.push({ event: 'manual_candidate_added', candidateId: candidate.id, at: state.updatedAt });
    const response = { result: 'candidate_added', candidateId: candidate.id, today: toTodayReadModel(state) };
    recordCommand(state, request, response);
    return { state, response, changed: true };
  }

  const candidate = getCandidate(state, request.candidateId);
  assertExpectedRevision(candidate, request.expectedRevision);

  if (command === 'request_verification') verifyCandidate(candidate, request.payload, clock);
  else if (command === 'request_strategies') createStrategies(candidate, clock);
  else if (command === 'request_drafts') createDrafts(candidate, clock);
  else if (command === 'run_guardian') runGuardian(candidate, clock, state);
  else if (command === 'edit_draft') editDraft(candidate, request.payload, clock);
  else if (command === 'review_decision') recordReviewDecision(candidate, request.payload, clock, state);
  else if (command === 'reopen_rejected_candidate') reopenRejectedCandidate(candidate, clock);
  else if (command === 'lock_non_commercial_showcase') lockNonCommercialShowcase(candidate, clock);
  else throw new ApplicationCommandError(`Unsupported command: ${command}`, { code: 'unsupported_command', statusCode: 400 });

  state.updatedAt = nowIso(clock);
  state.audit.push({ event: command, candidateId: candidate.id, at: state.updatedAt, revision: candidate.revision });
  state.audit = state.audit.slice(-200);
  const resultLabel = command === 'reopen_rejected_candidate'
    ? 'candidate_reopened'
    : command === 'lock_non_commercial_showcase'
      ? 'non_commercial_showcase_locked'
      : command;
  const response = { result: resultLabel, candidateId: candidate.id, revision: candidate.revision, today: toTodayReadModel(state, { now: state.updatedAt }) };
  recordCommand(state, request, response);
  return { state, response, changed: true };
}

export class AtomicJsonApplicationStore {
  constructor({ filePath, clock } = {}) {
    if (!filePath) throw new Error('filePath is required.');
    this.filePath = filePath;
    this.clock = clock;
    this.writeChain = Promise.resolve();
  }

  async initialize() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed?.version !== APPLICATION_STATE_VERSION) throw new Error('Unsupported application state version.');
      return parsed;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const initial = createInitialApplicationState({ clock: this.clock });
      await this.persist(initial);
      return initial;
    }
  }

  async readState() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return this.initialize();
    }
  }

  async persist(state) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.filePath);
  }

  async readToday() {
    const state = await this.readState();
    return toTodayReadModel(state, { now: nowIso(this.clock) });
  }

  async execute(request) {
    const operation = async () => {
      const state = await this.readState();
      const result = applyCommandToState(state, request, this.clock);
      if (result.changed) await this.persist(result.state);
      return result.response;
    };
    const pending = this.writeChain.then(operation, operation);
    this.writeChain = pending.then(() => undefined, () => undefined);
    return pending;
  }
}

export function assertPublicReadModelSafe(readModel) {
  const serialized = canonicalStringify(readModel);
  const forbidden = ['THREADS_ACCESS_TOKEN', 'NAVER_API_HUB_CLIENT_SECRET', 'COUPANG_WING_SECRET_KEY'];
  const leaks = forbidden.filter((needle) => serialized.includes(needle));
  return { ok: leaks.length === 0, leaks };
}
