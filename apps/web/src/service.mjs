// Application service.
//
// This is the only place a client-supplied value becomes durable state, so it is
// where APPLICATION_INTERFACE_SPEC.md's command rule is enforced: the client sends
// intent, never authority. Nothing here lets a request set a match state, an
// evidence readiness, a Guardian outcome, or an approval validity.
//
// Every mutating command takes an idempotency key and an expected version, which is
// what makes a double tap and a second device safe rather than merely unlikely.

import {
  ARTIFACT_TYPES,
  CONTENT_LANES,
  MEDIA_RIGHTS_STATES,
  REVIEW_SCORE_FLOOR,
  SLICE_HUMAN_DECISIONS,
  deriveCandidateView,
  scoreFromOwnerRatings,
  selectInboxCandidates
} from '../../../packages/core/src/index.mjs';

import {
  PipelineError,
  createCandidateRecord,
  currentBinding,
  decide,
  draft,
  editDraft,
  effectiveDraftBundle,
  review,
  selectDraft,
  strategize,
  updateEvidence,
  verify
} from '../../../packages/orchestra/src/pipeline.mjs';

import { VersionConflictError } from '../../../packages/database/src/ports.mjs';

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'invalid_input';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'not_found';
  }
}

/**
 * Live capability states, shown to the owner as four distinct values.
 *
 * AT-33: `designed`, `configured`, `enabled`, and `verified` are not synonyms, and
 * a UI that collapses them tells the owner something is ready when it is not.
 */
export const CAPABILITIES = Object.freeze([
  { id: 'manual_candidate_workflow', labelKo: '수동 후보 · 승인 워크플로', designed: true, configured: true, enabled: true, verified: true },
  { id: 'owner_supplied_destination', labelKo: '사용자 제공 판매 링크 검증', designed: true, configured: true, enabled: true, verified: false },
  { id: 'threads_keyword_discovery', labelKo: 'Threads 키워드 발굴', designed: true, configured: false, enabled: false, verified: false },
  { id: 'threads_insights', labelKo: 'Threads 인사이트', designed: true, configured: false, enabled: false, verified: false },
  { id: 'threads_publishing', labelKo: 'Threads 게시', designed: true, configured: false, enabled: false, verified: false },
  { id: 'coupang_affiliate_publishing', labelKo: '쿠팡 파트너스 제휴 게시', designed: true, configured: false, enabled: false, verified: false },
  { id: 'third_party_media_republication', labelKo: '제3자 미디어 재게시', designed: true, configured: false, enabled: false, verified: false }
]);

function requireString(value, field, errors, { max = 400 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(field + '을(를) 입력해 주세요.');
    return '';
  }
  if (value.length > max) {
    errors.push(field + '이(가) 너무 깁니다. ' + max + '자 이내로 입력해 주세요.');
    return value.slice(0, max);
  }
  return value.trim();
}

function rating(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(10, Math.max(0, number)) : 0;
}

/**
 * A destination URL is stored as a string. It is never fetched: doing so would
 * activate a live source that P0-02 keeps disabled.
 */
function normalizeDestination(value, errors) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    errors.push('판매 링크 형식이 올바르지 않습니다.');
    return null;
  }
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    errors.push('판매 링크는 http 또는 https로 시작해야 합니다.');
    return null;
  }
  if (trimmed.length > 2000) {
    errors.push('판매 링크가 너무 깁니다.');
    return null;
  }
  return trimmed;
}

function normalizeIntake(body) {
  const errors = [];

  const name = requireString(body?.name, '제품 이름', errors, { max: 120 });
  const whyNow = requireString(body?.whyNow, '왜 지금인지', errors, { max: 300 });
  const readerValue = requireString(body?.readerValue, '독자 가치', errors, { max: 300 });
  const observation = requireString(body?.observation, '확인한 사실', errors, { max: 500 });

  const contentLane = CONTENT_LANES.includes(body?.contentLane) ? body.contentLane : null;
  if (!contentLane) errors.push('콘텐츠 레인을 선택해 주세요.');

  const destinationUrl = normalizeDestination(body?.destinationUrl, errors);

  const mediaState = body?.mediaRightsState ?? 'none';
  if (mediaState !== 'none' && !MEDIA_RIGHTS_STATES.includes(mediaState)) {
    errors.push('미디어 권리 상태가 올바르지 않습니다.');
  }

  if (errors.length > 0) throw new ValidationError('입력을 확인해 주세요.', errors);

  const ratings = {
    readerValue: rating(body?.ratings?.readerValue),
    demonstrability: rating(body?.ratings?.demonstrability),
    purchaseIntent: rating(body?.ratings?.purchaseIntent),
    audienceFit: rating(body?.ratings?.audienceFit),
    novelty: rating(body?.ratings?.novelty)
  };
  const scored = scoreFromOwnerRatings(ratings, { hasDestination: Boolean(destinationUrl) });

  const sources = [
    {
      id: 'src_owner_observation',
      originId: 'origin_owner',
      type: 'owner_note',
      label: '소유자가 직접 입력한 확인 사항',
      observedAt: null
    }
  ];
  if (destinationUrl) {
    sources.push({
      id: 'src_owner_destination',
      originId: 'origin_owner_destination',
      type: 'destination_reference',
      label: '소유자가 제공한 판매 링크 (내용은 조회하지 않음)',
      observedAt: null
    });
  }

  return {
    name,
    contentLane,
    whyNow,
    readerValue,
    opportunityScore: scored.score,
    scoreBreakdown: scored.breakdown,
    evidence: {
      product: { productName: name, brand: null, model: null, variant: null },
      destinationUrl,
      ownerDeclaredSubstitute: body?.ownerDeclaredSubstitute === true,
      usageRecordConfirmed: body?.usageRecordConfirmed === true,
      sources,
      // Identity evidence starts empty on purpose. The owner adds it in the evidence
      // workbench; the Verifier, not the form, decides what that adds up to.
      identityEvidence: [],
      claims: [
        {
          claimId: 'claim_owner_1',
          text: observation,
          evidenceClass: 'owner_supplied',
          sourceIds: ['src_owner_observation']
        }
      ],
      mediaRefs:
        mediaState === 'none'
          ? []
          : [{ mediaId: 'media_owner_1', publishRightsState: mediaState, allowedActions: ['analyze'] }],
      publicFigureRelation: null,
      commerce: {
        observedAt: null,
        priceStatus: 'unavailable',
        stockStatus: 'unknown',
        sellerStatus: 'unverified',
        variantStatus: 'unresolved'
      }
    }
  };
}

const IDENTITY_DIMENSIONS = Object.freeze(['brand', 'product_name', 'model', 'variant', 'package_quantity', 'markings']);

function normalizeEvidenceUpdate(body, existing) {
  const errors = [];
  const evidence = structuredClone(existing);

  if (body?.product && typeof body.product === 'object') {
    for (const key of ['brand', 'model', 'variant']) {
      const value = body.product[key];
      if (typeof value === 'string' && value.trim().length > 0) evidence.product[key] = value.trim().slice(0, 120);
      else if (value === '' || value === null) evidence.product[key] = null;
    }
  }

  if (Array.isArray(body?.identityEvidence)) {
    evidence.identityEvidence = body.identityEvidence.slice(0, 12).map((item, index) => {
      if (!IDENTITY_DIMENSIONS.includes(item?.dimension)) errors.push('확인 항목 ' + (index + 1) + '의 종류가 올바르지 않습니다.');
      if (!['match', 'conflict', 'unknown'].includes(item?.status)) errors.push('확인 항목 ' + (index + 1) + '의 상태가 올바르지 않습니다.');
      const originId = typeof item?.originId === 'string' && item.originId.trim() ? item.originId.trim().slice(0, 80) : null;
      if (!originId) errors.push('확인 항목 ' + (index + 1) + '의 출처를 입력해 주세요.');
      return {
        dimension: item?.dimension,
        status: item?.status,
        originId,
        sourceIds: originId ? ['src_' + originId] : [],
        note: typeof item?.note === 'string' ? item.note.slice(0, 300) : ''
      };
    });

    // Each distinct origin becomes a source record, so independence can be counted.
    const extra = new Map();
    for (const item of evidence.identityEvidence) {
      if (!item.originId) continue;
      extra.set('src_' + item.originId, {
        id: 'src_' + item.originId,
        originId: item.originId,
        type: 'owner_supplied',
        label: item.originId,
        observedAt: null
      });
    }
    const base = evidence.sources.filter((source) => !source.id.startsWith('src_origin') || source.id === 'src_owner_observation');
    evidence.sources = [...base.filter((source) => !extra.has(source.id)), ...extra.values()];
  }

  if (typeof body?.usageRecordConfirmed === 'boolean') evidence.usageRecordConfirmed = body.usageRecordConfirmed;
  if (typeof body?.ownerDeclaredSubstitute === 'boolean') evidence.ownerDeclaredSubstitute = body.ownerDeclaredSubstitute;

  if (typeof body?.mediaRightsState === 'string') {
    if (body.mediaRightsState === 'none') evidence.mediaRefs = [];
    else if (MEDIA_RIGHTS_STATES.includes(body.mediaRightsState)) {
      evidence.mediaRefs = [{ mediaId: 'media_owner_1', publishRightsState: body.mediaRightsState, allowedActions: ['analyze'] }];
    } else errors.push('미디어 권리 상태가 올바르지 않습니다.');
  }

  if (errors.length > 0) throw new ValidationError('근거 입력을 확인해 주세요.', errors);
  return evidence;
}

export function createService({ store, clock, nextId, actor = 'owner' }) {
  const deps = { clock, nextId };

  async function persist(record, expectedVersion, eventType, payload = {}) {
    const saved = await store.saveCandidate(record, { expectedVersion });
    await store.appendEvent(record.runId, eventType, { candidateId: record.candidateId, ...payload });

    // Persist any newly produced artifact as an immutable, versioned object.
    for (const artifact of Object.values(record.artifacts ?? {})) {
      await store.putArtifact(artifact);
    }
    return saved;
  }

  /** Stamp timestamps that intake could not know, without letting the client set them. */
  function stampEvidenceTimestamps(evidence) {
    const stamped = structuredClone(evidence);
    const at = clock();
    stamped.sources = (stamped.sources ?? []).map((source) => ({ ...source, observedAt: source.observedAt ?? at }));
    stamped.commerce = { ...stamped.commerce, observedAt: stamped.commerce?.observedAt ?? at };
    return stamped;
  }

  async function withCommand(idempotencyKey, work) {
    const cached = await store.recallCommand(idempotencyKey);
    if (cached) return { ...cached, replayed: true };
    const result = await work();
    await store.rememberCommand(idempotencyKey, result);
    return result;
  }

  async function loadRecord(candidateId) {
    const record = await store.getCandidate(candidateId);
    if (!record) throw new NotFoundError('후보를 찾을 수 없습니다: ' + candidateId);
    return record;
  }

  function viewFor(record) {
    return deriveCandidateView(
      {
        candidate: record,
        evidencePacket: record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET] ?? null,
        contentBrief: record.artifacts[ARTIFACT_TYPES.CONTENT_BRIEF] ?? null,
        draftBundle: effectiveDraftBundle(record),
        reviewReport: record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT] ?? null,
        approval: record.approval,
        currentBinding: currentBinding(record) ?? {}
      },
      clock()
    );
  }

  /** Run a pipeline stage under version control and idempotency. */
  async function runStage(candidateId, { expectedVersion, idempotencyKey }, stageFn, eventType) {
    return withCommand(idempotencyKey, async () => {
      const record = await loadRecord(candidateId);
      if (expectedVersion !== undefined && expectedVersion !== null && record.version !== expectedVersion) {
        throw new VersionConflictError(candidateId, expectedVersion, record.version);
      }
      const next = stageFn(record, deps);
      await persist(next, record.version, eventType);
      return { candidate: viewFor(next), version: next.version };
    });
  }

  return {
    getCapabilities() {
      return { capabilities: CAPABILITIES, externalPublishingEnabled: false };
    },

    async createCandidate(body, { idempotencyKey } = {}) {
      return withCommand(idempotencyKey, async () => {
        const intake = normalizeIntake(body);
        intake.evidence = stampEvidenceTimestamps(intake.evidence);
        const record = createCandidateRecord(intake, deps);
        await persist(record, null, 'candidate_created', { name: record.name });
        return { candidate: viewFor(record), version: record.version };
      });
    },

    async getInbox() {
      const records = await store.listCandidates();
      const views = records.map((record) => viewFor(record));
      const { selected, excluded, emptyReason } = selectInboxCandidates(views);

      const excludedById = new Map(excluded.map((item) => [item.candidateId, item]));
      return {
        generatedAt: clock(),
        scoreFloor: REVIEW_SCORE_FLOOR,
        summary: {
          total: views.length,
          recommended: selected.length,
          needsEvidence: views.filter((view) => ['weak', 'partial'].includes(view.evidenceReadiness)).length,
          awaitingApproval: views.filter((view) => view.guardianDecision === 'pass' && view.approvalState !== 'approved').length,
          approved: views.filter((view) => view.approvalState === 'approved').length
        },
        candidates: selected,
        excluded: views
          .filter((view) => excludedById.has(view.candidateId))
          .map((view) => ({ ...view, exclusionReason: excludedById.get(view.candidateId) })),
        emptyReason,
        externalPublishingEnabled: false
      };
    },

    async getCandidateDetail(candidateId) {
      const record = await loadRecord(candidateId);
      const bundle = effectiveDraftBundle(record);
      return {
        candidate: viewFor(record),
        evidenceInput: record.evidenceInput,
        evidencePacket: record.artifacts[ARTIFACT_TYPES.EVIDENCE_PACKET] ?? null,
        contentBrief: record.artifacts[ARTIFACT_TYPES.CONTENT_BRIEF] ?? null,
        draftBundle: bundle,
        reviewReport: record.artifacts[ARTIFACT_TYPES.REVIEW_REPORT] ?? null,
        approval: record.approval,
        binding: currentBinding(record),
        selectedDraftId: record.selectedDraftId,
        scoutSkip: record.scoutSkip,
        version: record.version
      };
    },

    async getLineage(candidateId) {
      const record = await loadRecord(candidateId);
      const events = await store.readEvents(record.runId);
      const chain = await store.validateChain(record.runId);
      return {
        candidateId,
        runId: record.runId,
        scoutSkip: record.scoutSkip,
        stages: Object.entries(record.artifacts).map(([type, artifact]) => ({
          artifactType: type,
          artifactId: artifact.artifactId,
          agentId: artifact.agentId,
          createdAt: artifact.createdAt,
          inputArtifactRefs: artifact.inputArtifactRefs,
          evidenceRefs: artifact.evidenceRefs
        })),
        handoffs: record.handoffs.map((handoff) => ({
          handoffId: handoff.handoffId,
          from: handoff.from,
          artifactType: handoff.artifactType,
          requestedNextAction: handoff.requestedNextAction,
          status: handoff.status,
          createdAt: handoff.createdAt
        })),
        events: events.map((item) => ({ sequence: item.sequence, type: item.type, createdAt: item.createdAt })),
        chainValid: chain.ok,
        chainErrors: chain.errors
      };
    },

    async updateEvidenceInput(candidateId, body, { idempotencyKey, expectedVersion } = {}) {
      return withCommand(idempotencyKey, async () => {
        const record = await loadRecord(candidateId);
        if (expectedVersion != null && record.version !== expectedVersion) {
          throw new VersionConflictError(candidateId, expectedVersion, record.version);
        }
        const evidence = stampEvidenceTimestamps(normalizeEvidenceUpdate(body, record.evidenceInput));
        const next = updateEvidence(record, evidence, deps);
        await persist(next, record.version, 'evidence_input_updated');
        return { candidate: viewFor(next), version: next.version };
      });
    },

    verifyCandidate(candidateId, options) {
      return runStage(candidateId, options ?? {}, verify, 'verification_completed');
    },

    strategizeCandidate(candidateId, options) {
      return runStage(candidateId, options ?? {}, strategize, 'strategy_completed');
    },

    draftCandidate(candidateId, options) {
      return runStage(candidateId, options ?? {}, draft, 'drafting_completed');
    },

    reviewCandidate(candidateId, options) {
      return runStage(candidateId, options ?? {}, review, 'guardian_review_completed');
    },

    async editDraftText(candidateId, body, { idempotencyKey, expectedVersion } = {}) {
      return withCommand(idempotencyKey, async () => {
        const record = await loadRecord(candidateId);
        if (expectedVersion != null && record.version !== expectedVersion) {
          throw new VersionConflictError(candidateId, expectedVersion, record.version);
        }
        const next = editDraft(record, { draftId: body?.draftId, patch: body?.patch ?? {} }, deps);
        await persist(next, record.version, 'draft_edited', { draftId: body?.draftId });
        return { candidate: viewFor(next), version: next.version };
      });
    },

    async selectDraftForApproval(candidateId, body, { idempotencyKey, expectedVersion } = {}) {
      return withCommand(idempotencyKey, async () => {
        const record = await loadRecord(candidateId);
        if (expectedVersion != null && record.version !== expectedVersion) {
          throw new VersionConflictError(candidateId, expectedVersion, record.version);
        }
        const next = selectDraft(record, body?.draftId, deps);
        await persist(next, record.version, 'draft_selected', { draftId: body?.draftId });
        return { candidate: viewFor(next), version: next.version, binding: currentBinding(next) };
      });
    },

    async submitDecision(candidateId, body, { idempotencyKey, expectedVersion } = {}) {
      if (!SLICE_HUMAN_DECISIONS.includes(body?.decision)) {
        throw new ValidationError('지원하지 않는 결정입니다.', ['decision: ' + (body?.decision ?? 'missing')]);
      }
      return withCommand(idempotencyKey, async () => {
        const record = await loadRecord(candidateId);
        if (expectedVersion != null && record.version !== expectedVersion) {
          throw new VersionConflictError(candidateId, expectedVersion, record.version);
        }
        const next = decide(
          record,
          {
            decision: body.decision,
            actor,
            // The client's binding is a claim about what it saw. The pipeline compares
            // it against the server's own computation and never stores the claim.
            claimedBinding: body.binding,
            note: typeof body.note === 'string' ? body.note.slice(0, 500) : null
          },
          deps
        );
        await persist(next, record.version, 'human_decision_recorded', { decision: body.decision });
        return { candidate: viewFor(next), version: next.version, approval: next.approval };
      });
    }
  };
}

export { PipelineError, VersionConflictError };
