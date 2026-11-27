// Deterministic Candidate Provenance Lineage (`AT-13`, `AT-19`, `BS-31`) & Approved Export Bundle Builder.
// Traces immutable stage digests, upstream `inputDigest` links, `claimRefs`, and prompt/schema/manifest versions,
// and prepares verified single-root-post copy text & `/showcase` Markdown strictly for non-stale, unsuppressed approved items.

import { buildVersionManifest, sha256 } from '../../orchestra/src/versioning.mjs';
import { detectCommercialSolicitationSurface } from './guardian-checks.mjs';
import {
  exportDeterministicMarkdownCard,
  projectPublicShowcaseCard
} from './public-showcase-projector.mjs';
import {
  assertSingleRootPostPayload,
  computeApprovalHash
} from './threads-publisher-service.mjs';

let cachedManifest = null;
function versionManifest() {
  cachedManifest ??= buildVersionManifest();
  return cachedManifest;
}

/**
 * Build simplified 6-stage provenance lineage referencing immutable artifact/evidence digests,
 * upstream `inputDigest` links, `claimRefs`, and prompt/schema/config versions (`AT-13`, `AT-19`).
 */
export function buildCandidateProvenance(
  candidate,
  { activeMonetizedShowcaseCount = 0, monetizedCardNumbers = [] } = {}
) {
  if (!candidate || typeof candidate !== 'object') return Object.freeze([]);

  const manifest = versionManifest();
  const configVersion = String(candidate.configRevision || manifest.manifestHash || '').slice(0, 16);
  const targetDraftId = candidate.review?.approvedDraftId || candidate.selectedDraftId;
  const selectedDraft = (candidate.drafts ?? []).find((d) => d.id === targetDraftId)
    ?? candidate.drafts?.[0]
    ?? null;

  const frozenIntake = candidate.intakeSnapshot ?? {
    id: candidate.id,
    name: candidate.name,
    sourceMode: candidate.sourceMode ?? 'owner_supplied',
    initialSourceRef: candidate.initialSourceRef ?? '',
    initialCorroborationRef: candidate.initialCorroborationRef ?? '',
    createdAt: candidate.createdAt ?? ''
  };
  const intakeDigest = sha256(frozenIntake).slice(0, 16);

  const intakeStage = Object.freeze({
    stage: 'intake_discovery',
    labelKo: '1. 후보 포착·등록',
    present: true,
    status: 'ok',
    sourceMode: frozenIntake.sourceMode ?? candidate.sourceMode ?? 'owner_supplied',
    synthetic: Boolean(candidate.synthetic),
    createdAt: frozenIntake.createdAt ?? candidate.createdAt ?? null,
    configVersion,
    inputDigest: null,
    digest: intakeDigest
  });

  const packet = candidate.evidencePacket;
  const verifierAgentId = packet?.agentId ?? 'verifier';
  const verifierDigest = packet ? sha256(packet).slice(0, 16) : null;
  const verifierStatus = !packet
    ? 'pending'
    : packet.verifierDecision === 'reject'
      ? 'danger'
      : packet.verifierDecision === 'hold'
        ? 'warn'
        : 'ok';

  const verifierStage = packet
    ? Object.freeze({
        stage: 'verifier',
        labelKo: '2. Verifier 근거·동일성 패킷',
        present: true,
        status: verifierStatus,
        agentId: verifierAgentId,
        observedAt: packet.observedAt ?? null,
        exactMatchStatus: packet.exactMatchStatus ?? candidate.exactMatchStatus,
        verifierDecision: packet.verifierDecision ?? candidate.verifierDecision,
        independentOrigins: packet.independentOrigins ?? 0,
        claimRefs: Object.freeze((packet.claimEvidence ?? []).map((c) => c.claimId)),
        sourceIds: Object.freeze((packet.sources ?? []).map((s) => s.id)),
        passiveDataFenceNonce: packet.passiveDataFence?.nonce ?? null,
        promptVersion: (packet.promptVersion ?? manifest.promptHashes?.[verifierAgentId] ?? '').slice(0, 16) || null,
        schemaVersion: (packet.schemaVersion ?? manifest.schemaHashes?.[verifierAgentId] ?? '').slice(0, 16) || null,
        configVersion,
        inputDigest: intakeDigest,
        digest: verifierDigest
      })
    : Object.freeze({
        stage: 'verifier',
        labelKo: '2. Verifier 근거·동일성 패킷',
        present: false,
        status: 'pending'
      });

  const strategies = candidate.strategies;
  const strategistAgentId = strategies?.agentId ?? 'strategist';
  const strategistDigest = strategies?.angles?.length === 4 ? sha256(strategies).slice(0, 16) : null;

  const strategistStage = strategies?.angles?.length === 4
    ? Object.freeze({
        stage: 'strategist',
        labelKo: '3. Strategist 4관점 설계',
        present: true,
        status: 'ok',
        agentId: strategistAgentId,
        createdAt: strategies.createdAt ?? null,
        evidenceObservedAt: strategies.evidenceObservedAt ?? null,
        angleCount: strategies.angles.length,
        claimRefs: Object.freeze([...(strategies.evidenceClaimIds ?? [])]),
        promptVersion: (strategies.promptVersion ?? manifest.promptHashes?.[strategistAgentId] ?? '').slice(0, 16) || null,
        schemaVersion: (strategies.schemaVersion ?? manifest.schemaHashes?.[strategistAgentId] ?? '').slice(0, 16) || null,
        configVersion,
        inputDigest: verifierDigest,
        digest: strategistDigest
      })
    : Object.freeze({
        stage: 'strategist',
        labelKo: '3. Strategist 4관점 설계',
        present: false,
        status: 'pending'
      });

  let writerStage;
  let writerDigest = null;
  if (selectedDraft) {
    writerDigest = sha256(selectedDraft).slice(0, 16);
    const solicitation = detectCommercialSolicitationSurface(selectedDraft.text, {
      candidateMonetized: Boolean(candidate.affiliate),
      activeMonetizedShowcaseCount,
      monetizedCardNumbers
    });
    const requiredDisc = String(candidate.disclosure ?? selectedDraft.disclosure ?? '').trim();
    const offsetZeroDisclosureOk = !solicitation.isCommercialSolicitation
      || (Boolean(requiredDisc) && String(selectedDraft.text ?? '').startsWith(requiredDisc));

    writerStage = Object.freeze({
      stage: 'writer',
      labelKo: '4. Writer 선택 초안',
      present: true,
      status: offsetZeroDisclosureOk ? 'ok' : 'warn',
      agentId: 'writer',
      selectedDraftId: selectedDraft.id,
      angleId: selectedDraft.angleId,
      codePointLength: [...String(selectedDraft.text ?? '')].length,
      claimRefs: Object.freeze([...(selectedDraft.claimIds ?? [])]),
      offsetZeroDisclosureOk,
      promptVersion: (selectedDraft.promptVersion ?? manifest.promptHashes?.writer ?? '').slice(0, 16) || null,
      schemaVersion: (selectedDraft.schemaVersion ?? manifest.schemaHashes?.writer ?? '').slice(0, 16) || null,
      configVersion,
      inputDigest: strategistDigest,
      digest: writerDigest
    });
  } else {
    writerStage = Object.freeze({
      stage: 'writer',
      labelKo: '4. Writer 선택 초안',
      present: false,
      status: 'pending'
    });
  }

  const guardian = candidate.guardian;
  const guardianDigest = guardian ? sha256(guardian).slice(0, 16) : null;
  const guardianMatches = guardian ? guardian.boundMaterialRevision === candidate.materialRevision : false;
  const guardianStatus = !guardian
    ? 'pending'
    : guardian.decision === 'block'
      ? 'danger'
      : (guardian.decision !== 'pass' || !guardianMatches)
        ? 'warn'
        : 'ok';

  const guardianStage = guardian
    ? Object.freeze({
        stage: 'guardian',
        labelKo: '5. Guardian 독립 검수',
        present: true,
        status: guardianStatus,
        agentId: guardian.agentId ?? 'guardian',
        decision: guardian.decision,
        reviewedAt: guardian.reviewedAt ?? null,
        boundMaterialRevision: String(guardian.boundMaterialRevision ?? '').slice(0, 16),
        matchesCurrentMaterial: guardianMatches,
        promptVersion: (guardian.promptVersion ?? manifest.promptHashes?.guardian ?? '').slice(0, 16) || null,
        schemaVersion: (guardian.schemaVersion ?? manifest.schemaHashes?.guardian ?? '').slice(0, 16) || null,
        configVersion,
        inputDigest: writerDigest,
        digest: guardianDigest
      })
    : Object.freeze({
        stage: 'guardian',
        labelKo: '5. Guardian 독립 검수',
        present: false,
        status: 'pending'
      });

  const review = candidate.review;
  let approvalHash = null;
  if (review?.decision === 'approved' && !review?.stale && selectedDraft) {
    approvalHash = review.approvalHash || computeApprovalHash({
      candidateId: candidate.id,
      boundMaterialRevision: review.boundMaterialRevision,
      draftId: review.approvedDraftId || selectedDraft.id,
      draftText: selectedDraft.text,
      boundCandidateRevision: review.boundCandidateRevision ?? null
    });
  }

  const approvalStatus = !review
    ? 'pending'
    : review.decision === 'rejected'
      ? 'danger'
      : (review.stale || review.decision !== 'approved' || candidate.suppression?.active === true)
        ? 'warn'
        : 'ok';

  const approvalStage = review
    ? Object.freeze({
        stage: 'human_approval',
        labelKo: '6. 사람 최종 결정 바인딩',
        present: true,
        status: approvalStatus,
        actor: review.actor ?? 'owner',
        decision: review.decision,
        approvedDraftId: review.approvedDraftId ?? null,
        decidedAt: review.decidedAt ?? null,
        stale: Boolean(review.stale),
        boundMaterialRevision: String(review.boundMaterialRevision ?? '').slice(0, 16),
        approvalHash: approvalHash ? approvalHash.slice(0, 16) : null,
        configVersion,
        inputDigest: guardianDigest,
        digest: sha256(review).slice(0, 16)
      })
    : Object.freeze({
        stage: 'human_approval',
        labelKo: '6. 사람 최종 결정 바인딩',
        present: false,
        status: 'pending'
      });

  return Object.freeze([
    intakeStage,
    verifierStage,
    strategistStage,
    writerStage,
    guardianStage,
    approvalStage
  ]);
}

/**
 * Assemble verified single-root-post copy text & `/showcase` Markdown strictly for non-stale,
 * unsuppressed approved items bound to `candidate.review.approvedDraftId`.
 */
export function buildApprovedExportBundle(
  candidate,
  { now = new Date().toISOString(), activeMonetizedShowcaseCount = 0, monetizedCardNumbers = [] } = {}
) {
  const isCleanApproved =
    candidate?.workflowState === 'approved'
    && candidate?.suppression?.active !== true
    && candidate?.review?.decision === 'approved'
    && candidate?.review?.stale !== true
    && candidate?.guardian?.decision === 'pass'
    && candidate?.guardian?.boundMaterialRevision === candidate?.materialRevision
    && candidate?.review?.boundMaterialRevision === candidate?.materialRevision;

  if (!isCleanApproved) {
    return Object.freeze({
      singleRootPostCopyText: null,
      showcaseMarkdown: null
    });
  }

  const boundDraftId = candidate.review?.approvedDraftId || candidate.selectedDraftId;
  const selectedDraft = (candidate.drafts ?? []).find((d) => d.id === boundDraftId)
    ?? candidate.drafts?.[0]
    ?? null;

  let singleRootPostCopyText = null;
  if (selectedDraft?.text) {
    const solicitation = detectCommercialSolicitationSurface(selectedDraft.text, {
      candidateMonetized: Boolean(candidate.affiliate),
      activeMonetizedShowcaseCount,
      monetizedCardNumbers
    });
    const requiredDisc = String(candidate.disclosure ?? selectedDraft.disclosure ?? '').trim();
    const disclosureOk = !solicitation.isCommercialSolicitation
      || (Boolean(requiredDisc) && String(selectedDraft.text).startsWith(requiredDisc));

    const imageUrl = ['owned', 'licensed'].includes(candidate.mediaRights) && candidate.publishableMediaUrl
      ? candidate.publishableMediaUrl
      : undefined;
    const payloadCheck = assertSingleRootPostPayload({
      text: selectedDraft.text,
      ...(imageUrl ? { imageUrl } : {})
    });
    if (payloadCheck.ok && disclosureOk) {
      singleRootPostCopyText = String(selectedDraft.text).trim();
    }
  }

  let showcaseMarkdown = null;
  if (candidate.cardNumber != null) {
    const projected = projectPublicShowcaseCard(candidate, { now });
    if (projected.projected) {
      showcaseMarkdown = exportDeterministicMarkdownCard(projected.card);
    }
  }

  return Object.freeze({
    singleRootPostCopyText,
    showcaseMarkdown
  });
}
