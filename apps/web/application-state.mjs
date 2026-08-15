import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AGENT_IDS, AGENT_REGISTRY, validateAgentRegistry } from '../../packages/orchestra/src/agent-registry.mjs';
import { buildVersionManifest, canonicalStringify, sha256 } from '../../packages/orchestra/src/versioning.mjs';

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
  if (required && !text) throw new ApplicationCommandError(`${label} is required.`, { code: 'invalid_input', statusCode: 422 });
  return text.slice(0, max);
}

function safeMediaRights(value) {
  const normalized = cleanString(value || 'unknown', { max: 32 });
  if (!MEDIA_RIGHTS.has(normalized)) {
    throw new ApplicationCommandError('mediaRights is invalid.', { code: 'invalid_input', statusCode: 422 });
  }
  return normalized;
}

function safePersonalUse(value) {
  const normalized = cleanString(value || 'not_confirmed', { max: 32 });
  if (!PERSONAL_USE.has(normalized)) {
    throw new ApplicationCommandError('personalUse is invalid.', { code: 'invalid_input', statusCode: 422 });
  }
  return normalized;
}

function scoreManualCandidate({ whyNow, readerValue, model, sourceRef }) {
  let score = 48;
  if (whyNow.length >= 12) score += 12;
  if (readerValue.length >= 12) score += 15;
  if (model) score += 8;
  if (sourceRef) score += 7;
  return Math.min(90, score);
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
    disclosure: candidate.disclosure,
    configRevision: candidate.configRevision
  });
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
  const whyNow = cleanString(payload.whyNow, { required: true, max: 300, label: 'whyNow' });
  const readerValue = cleanString(payload.readerValue, { required: true, max: 300, label: 'readerValue' });
  const mediaRights = safeMediaRights(payload.mediaRights);
  const personalUse = safePersonalUse(payload.personalUse);
  const affiliate = Boolean(payload.affiliate);
  const disclosure = cleanString(payload.disclosure, { max: 500 });
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
    whyNow,
    readerValue,
    lane: cleanString(payload.lane || 'practical-novel', { max: 80 }),
    mediaRights,
    personalUse,
    affiliate,
    disclosure,
    opportunityScore: Number.isFinite(payload.opportunityScore)
      ? Math.max(0, Math.min(100, Number(payload.opportunityScore)))
      : scoreManualCandidate({ whyNow, readerValue, model, sourceRef }),
    evidenceReadiness: 'weak',
    riskLevel: 'review',
    exactMatchStatus: 'unresolved',
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
  for (const key of ['brand', 'model', 'variant', 'sourceRef']) {
    if (key in payload) candidate[key] = cleanString(payload[key], { max: key === 'sourceRef' ? 1200 : 160 });
  }
  if ('mediaRights' in payload) candidate.mediaRights = safeMediaRights(payload.mediaRights);
  if ('personalUse' in payload) candidate.personalUse = safePersonalUse(payload.personalUse);
  if ('affiliate' in payload) candidate.affiliate = Boolean(payload.affiliate);
  if ('disclosure' in payload) candidate.disclosure = cleanString(payload.disclosure, { max: 500 });
}

function verifyCandidate(candidate, payload, clock) {
  const wasApproved = candidate.review?.decision === 'approved' && candidate.review?.stale !== true;
  applyEvidenceFields(candidate, payload);

  const missing = [];
  if (!candidate.brand) missing.push('브랜드');
  if (!candidate.model) missing.push('모델');
  if (!candidate.variant) missing.push('옵션/변형');
  if (!candidate.sourceRef) missing.push('사용자 제공 근거');

  const exact = missing.length === 0;
  const rightsReady = SAFE_MEDIA_RIGHTS.has(candidate.mediaRights);
  const observedAt = nowIso(clock);
  const blockers = [];
  if (!exact) blockers.push(`제품 동일성 근거 부족: ${missing.join(', ')}`);
  if (!rightsReady) blockers.push('최종 콘텐츠의 미디어 권리가 확인되지 않았습니다.');

  candidate.exactMatchStatus = exact ? 'exact' : 'unresolved';
  candidate.evidenceReadiness = exact && rightsReady ? 'ready' : 'partial';
  candidate.riskLevel = exact && rightsReady ? 'low' : 'review';
  candidate.blockers = blockers;
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
    exactMatchStatus: candidate.exactMatchStatus,
    sources: candidate.sourceRef ? [{
      id: `owner-source-${sha256(candidate.sourceRef).slice(0, 12)}`,
      type: candidate.synthetic ? 'fixture_owner_source' : 'owner_supplied_reference',
      ref: candidate.sourceRef,
      observedAt
    }] : [],
    mediaRights: candidate.mediaRights,
    personalUse: candidate.personalUse,
    claimEvidence: exact ? [{
      claimId: 'claim-identity',
      text: `${candidate.brand} ${candidate.model} ${candidate.variant}`.trim(),
      status: candidate.synthetic ? 'verified_fixture' : 'owner_supplied_identity',
      sourceIds: [`owner-source-${sha256(candidate.sourceRef).slice(0, 12)}`]
    }] : [],
    blockers
  };

  invalidateDownstream(candidate, '승인 후 제품 근거가 변경되어 다시 검토해야 합니다.', { keepEvidence: true });
  if (!wasApproved) {
    candidate.workflowState = candidate.evidenceReadiness === 'ready' ? 'evidence_ready' : 'evidence_partial';
    candidate.review = null;
  }
  bump(candidate, clock, 'verification_completed', { exactMatchStatus: candidate.exactMatchStatus, evidenceReadiness: candidate.evidenceReadiness });
  return candidate;
}

function assertEvidenceReady(candidate) {
  if (candidate.exactMatchStatus !== 'exact' || candidate.evidenceReadiness !== 'ready') {
    throw new ApplicationCommandError('Evidence is not ready for content strategy.', {
      code: 'evidence_not_ready',
      statusCode: 422,
      details: { blockers: candidate.blockers }
    });
  }
}

function createStrategies(candidate, clock) {
  assertEvidenceReady(candidate);
  const identity = candidate.evidencePacket?.claimEvidence?.find((claim) => claim.claimId === 'claim-identity');
  if (!identity) throw new ApplicationCommandError('Verifier identity evidence is missing.', { code: 'verifier_authority_missing', statusCode: 422 });
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
  return candidate.affiliate ? candidate.disclosure : '';
}

function createDrafts(candidate, clock) {
  if (!candidate.strategies?.angles || candidate.strategies.angles.length !== 4) {
    throw new ApplicationCommandError('Four strategies are required before drafts.', { code: 'strategy_not_ready', statusCode: 422 });
  }
  const identity = `${candidate.brand} ${candidate.model} ${candidate.variant}`.trim();
  const disclosure = draftDisclosure(candidate);
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
    text: texts[index],
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

function runGuardian(candidate, clock) {
  if (!candidate.drafts?.length || candidate.drafts.length !== 4) {
    throw new ApplicationCommandError('Four drafts are required for Guardian review.', { code: 'draft_not_ready', statusCode: 422 });
  }
  if (candidate.exactMatchStatus !== 'exact' || candidate.evidenceReadiness !== 'ready') {
    candidate.guardian = {
      agentId: AGENT_IDS.GUARDIAN,
      decision: 'block',
      blockers: ['제품 동일성 또는 근거 준비 상태가 충분하지 않습니다.'],
      warnings: [],
      reviewedAt: nowIso(clock),
      boundMaterialRevision: candidate.materialRevision
    };
    candidate.workflowState = 'blocked';
    candidate.blockers = [...candidate.guardian.blockers];
    bump(candidate, clock, 'guardian_blocked');
    return candidate;
  }

  const verifiedClaimIds = new Set((candidate.evidencePacket?.claimEvidence ?? []).map((claim) => claim.claimId));
  const blockers = [];
  for (const draft of candidate.drafts) {
    for (const claimId of draft.claimIds ?? []) {
      if (!verifiedClaimIds.has(claimId)) blockers.push(`초안 ${draft.id}의 주장 ${claimId}는 Verifier 근거에 없습니다.`);
    }
    if (candidate.personalUse !== 'confirmed' && FIRST_HAND_PATTERN.test(draft.text)) {
      blockers.push(`초안 ${draft.id}에 직접 사용 기록 없는 체험 표현이 있습니다.`);
    }
    if (ENDORSEMENT_PATTERN.test(draft.text)) {
      blockers.push(`초안 ${draft.id}에 검증되지 않은 유명인 추천/사용 암시가 있습니다.`);
    }
    if (candidate.affiliate && !candidate.disclosure) blockers.push(DISCLOSURE_REQUIRED_MESSAGE);
  }

  const decision = blockers.length ? 'revise' : 'pass';
  candidate.guardian = {
    agentId: AGENT_IDS.GUARDIAN,
    decision,
    blockers: [...new Set(blockers)],
    warnings: candidate.synthetic ? ['예시 데이터는 현재 시장 사실이 아닙니다.'] : ['현재 검증 근거는 사용자 제공 자료이며 네트워크 재검증을 수행하지 않았습니다.'],
    reviewedAt: nowIso(clock),
    boundMaterialRevision: candidate.materialRevision
  };
  candidate.review = null;
  candidate.workflowState = decision === 'pass' ? 'guardian_pass' : 'guardian_revise';
  candidate.blockers = [...candidate.guardian.blockers];
  bump(candidate, clock, 'guardian_reviewed', { decision });
  return candidate;
}

function recordReviewDecision(candidate, payload, clock) {
  const decision = cleanString(payload.decision, { required: true, max: 32, label: 'decision' });
  if (!REVIEW_DECISIONS.has(decision)) throw new ApplicationCommandError('Review decision is invalid.', { code: 'invalid_input', statusCode: 422 });

  if (decision === 'approved') {
    if (candidate.guardian?.decision !== 'pass') {
      throw new ApplicationCommandError('Guardian pass is required before approval.', { code: 'guardian_gate', statusCode: 422 });
    }
    if (candidate.guardian.boundMaterialRevision !== candidate.materialRevision) {
      throw new ApplicationCommandError('Guardian review is stale. Run Guardian again.', { code: 'stale_guardian', statusCode: 409 });
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

function toCandidateReadModel(candidate) {
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
    mediaRights: candidate.mediaRights,
    personalUse: candidate.personalUse,
    affiliate: candidate.affiliate,
    disclosure: candidate.disclosure,
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

export function toTodayReadModel(state) {
  const candidates = state.candidates
    .slice()
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 5)
    .map(toCandidateReadModel);
  return {
    version: state.version,
    serverUpdatedAt: state.updatedAt,
    externalPublishingEnabled: false,
    fixedAgentCount: state.fixedAgentCount,
    counters: {
      observed: state.candidates.length,
      recommended: state.candidates.filter((candidate) => candidate.evidenceReadiness === 'ready' && !['held', 'rejected', 'blocked'].includes(candidate.workflowState)).length,
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
    state.candidates = state.candidates.slice(0, 50);
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
  else if (command === 'run_guardian') runGuardian(candidate, clock);
  else if (command === 'edit_draft') editDraft(candidate, request.payload, clock);
  else if (command === 'review_decision') recordReviewDecision(candidate, request.payload, clock);
  else throw new ApplicationCommandError(`Unsupported command: ${command}`, { code: 'unsupported_command', statusCode: 400 });

  state.updatedAt = nowIso(clock);
  state.audit.push({ event: command, candidateId: candidate.id, at: state.updatedAt, revision: candidate.revision });
  state.audit = state.audit.slice(-200);
  const response = { result: command, candidateId: candidate.id, revision: candidate.revision, today: toTodayReadModel(state) };
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
    return toTodayReadModel(state);
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
