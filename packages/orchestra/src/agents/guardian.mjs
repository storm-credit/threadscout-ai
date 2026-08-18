// Integrity Guardian.
//
// Guardian receives the evidence packet and the draft text it is actually given —
// including any owner edit made after drafting — and re-checks it independently.
// It shares no generation logic with the Writer; it shares only the canonical
// policy detectors, so there is one definition of each prohibition (BS-32).
//
// Guardian never rewrites copy. It returns machine-readable revision requests
// (AGENT_HANDOFFS.md section 4), and its blockers cannot be overridden by approval.

import { ARTIFACT_TYPES, createEnvelope } from '../../../core/src/artifacts.mjs';
import { AGENT_IDS } from '../../../core/src/handoff.mjs';
import {
  RULE_IDS,
  detectAlternativeLabel,
  detectEndorsementImplication,
  detectExaggeration,
  detectFirstHandLanguage,
  detectSameProductClaim,
  detectSensitiveGuarantee,
  findDuplicateDrafts,
  hasAffiliateDisclosure
} from '../../../core/src/policy-rules.mjs';
import { hashArtifact } from '../../../core/src/hash.mjs';

/** Blockers that no human approval may override without new evidence. */
const NON_OVERRIDABLE_RULES = Object.freeze([
  RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD,
  RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH,
  RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION,
  RULE_IDS.MEDIA_RIGHTS_UNRESOLVED,
  RULE_IDS.SENSITIVE_GUARANTEE,
  RULE_IDS.UNSUPPORTED_CLAIM_REFERENCE
]);

function fullText(draft) {
  return [draft.hook, draft.body, draft.caution, draft.cta, draft.disclosure].filter(Boolean).join('\n');
}

function finding(ruleId, severity, problem, requiredChange, draftId, evidenceRefs = []) {
  return { draftId, ruleId, severity, problem, requiredChange, evidenceRefs };
}

export function runGuardian(request, { clock, nextId }) {
  const { runId, candidate, evidencePacket, contentBrief, draftBundle } = request;
  const now = clock();

  const anglesById = new Map((contentBrief.angles ?? []).map((angle) => [angle.angleId, angle]));
  const claimIds = new Set((evidencePacket.verifiedClaims ?? []).map((claim) => claim.claimId));
  const mediaById = new Map((evidencePacket.mediaRights ?? []).map((media) => [media.mediaId, media]));

  const findings = [];

  for (const draft of draftBundle.drafts) {
    const text = fullText(draft);
    const angle = anglesById.get(draft.angleId);

    // Product identity ------------------------------------------------------
    if (detectSameProductClaim(text) && evidencePacket.matchState !== 'exact') {
      findings.push(finding(
        RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH,
        'blocker',
        '동일 제품 확정 근거가 없는데 같은 제품이라고 서술했습니다.',
        '동일 제품 표현을 제거하고 확인된 범위까지만 서술하세요.',
        draft.draftId,
        [evidencePacket.artifactId]
      ));
    }
    if (evidencePacket.matchState === 'substitute' && !detectAlternativeLabel(text)) {
      findings.push(finding(
        RULE_IDS.SUBSTITUTE_NOT_LABELLED,
        'blocker',
        '대체품인데 대체품이라는 표시가 없습니다.',
        '비슷한 제품 또는 대체 후보임을 본문에 명시하세요.',
        draft.draftId,
        [evidencePacket.artifactId]
      ));
    }

    // First-hand wording ----------------------------------------------------
    const firstHand = detectFirstHandLanguage(text);
    if (firstHand.found && evidencePacket.personalUseState !== 'confirmed') {
      findings.push(finding(
        RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD,
        'blocker',
        '사용 기록이 없는데 직접 사용한 것처럼 서술했습니다.',
        '체험형 표현을 조사 기반 표현으로 바꾸세요.',
        draft.draftId,
        [evidencePacket.artifactId]
      ));
    }

    // Public-figure wording --------------------------------------------------
    const endorsement = detectEndorsementImplication(text);
    if (endorsement.found && evidencePacket.publicFigureRelation?.classification !== 'official_endorsement') {
      findings.push(finding(
        RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION,
        'blocker',
        '확인된 관계 등급을 넘어서는 추천 · 협찬 함의가 있습니다.',
        '공개적으로 확인된 사실만 서술하고 추천 표현을 제거하세요.',
        draft.draftId
      ));
    }

    // Media rights -----------------------------------------------------------
    if (draft.mediaRef) {
      const media = mediaById.get(draft.mediaRef);
      if (!media || !['owner_supplied', 'licensed'].includes(media.publishRightsState)) {
        findings.push(finding(
          RULE_IDS.MEDIA_RIGHTS_UNRESOLVED,
          'blocker',
          '게시 권리가 확인되지 않은 미디어를 사용하려 합니다.',
          '본인 보유 · 허가 확인 미디어로 교체하거나 텍스트만 사용하세요.',
          draft.draftId
        ));
      }
    }

    // Claim support ----------------------------------------------------------
    const unsupported = (draft.claimRefs ?? []).filter((claimId) => !claimIds.has(claimId));
    if (unsupported.length > 0) {
      findings.push(finding(
        RULE_IDS.UNSUPPORTED_CLAIM_REFERENCE,
        'blocker',
        '검증 패킷에 없는 근거를 참조했습니다: ' + unsupported.join(', '),
        '검증된 주장만 참조하도록 수정하세요.',
        draft.draftId
      ));
    }

    // Disclosure -------------------------------------------------------------
    if (angle?.disclosureRequirement === 'required' && !hasAffiliateDisclosure(text)) {
      findings.push(finding(
        RULE_IDS.MISSING_AFFILIATE_DISCLOSURE,
        'required',
        '제휴 강도의 글인데 고지 문구가 없습니다.',
        '제휴 고지 문구를 본문에 포함하세요.',
        draft.draftId
      ));
    }

    // Tone -------------------------------------------------------------------
    const exaggeration = detectExaggeration(text);
    if (exaggeration.found) {
      findings.push(finding(
        RULE_IDS.EXAGGERATION,
        'required',
        '근거가 뒷받침하지 않는 단정 표현이 있습니다.',
        '단정 표현을 확인된 범위의 서술로 바꾸세요.',
        draft.draftId
      ));
    }

    const sensitive = detectSensitiveGuarantee(text);
    if (sensitive.found) {
      findings.push(finding(
        RULE_IDS.SENSITIVE_GUARANTEE,
        'blocker',
        '건강 · 안전 보장성 표현이 있습니다.',
        '보장성 표현을 제거하세요.',
        draft.draftId
      ));
    }
  }

  // Duplication across the bundle ---------------------------------------------
  for (const collision of findDuplicateDrafts(draftBundle.drafts)) {
    findings.push(finding(
      RULE_IDS.DUPLICATE_DRAFT,
      'required',
      '초안이 사실상 같은 글입니다 (유사도 ' + collision.similarity + ').',
      '관점별로 논거가 달라지도록 다시 작성하세요.',
      collision.draftIds[1]
    ));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const required = findings.filter((item) => item.severity === 'required');

  const has = (ruleIds) => findings.some((item) => ruleIds.includes(item.ruleId));
  const statusFor = (ruleIds, warnRules = []) => {
    if (has(ruleIds)) return 'block';
    if (warnRules.length > 0 && has(warnRules)) return 'warn';
    return 'pass';
  };
  const detailFor = (ruleIds, fallback) => {
    const hit = findings.find((item) => ruleIds.includes(item.ruleId));
    return hit ? hit.problem : fallback;
  };

  const decision = blockers.length > 0 ? 'block' : required.length > 0 ? 'revise' : 'pass';

  const artifact = {
    ...createEnvelope({
      type: ARTIFACT_TYPES.REVIEW_REPORT,
      agentId: AGENT_IDS.GUARDIAN,
      runId,
      artifactId: nextId('artifact'),
      createdAt: now,
      inputArtifactRefs: [draftBundle.artifactId, contentBrief.artifactId, evidencePacket.artifactId],
      evidenceRefs: [...evidencePacket.evidenceRefs]
    }),
    candidateId: candidate.candidateId,
    draftBundleHash: hashArtifact(draftBundle),
    evidencePacketHash: hashArtifact(evidencePacket),
    decision,

    productMatchCheck: {
      status: statusFor([RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH, RULE_IDS.SUBSTITUTE_NOT_LABELLED]),
      detail: detailFor(
        [RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH, RULE_IDS.SUBSTITUTE_NOT_LABELLED],
        '제품 동일성 표현이 검증 상태(' + evidencePacket.matchState + ')를 넘지 않습니다.'
      )
    },
    publicFigureClaimCheck: {
      status: statusFor([RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION]),
      detail: detailFor(
        [RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION],
        evidencePacket.publicFigureRelation ? '공개 사실 범위 안에서 서술되었습니다.' : '공인 관련 서술이 없습니다.'
      )
    },
    rightsCheck: {
      status: statusFor([RULE_IDS.MEDIA_RIGHTS_UNRESOLVED]),
      detail: detailFor([RULE_IDS.MEDIA_RIGHTS_UNRESOLVED], '게시에 사용할 미디어의 권리 상태가 확인되었습니다.')
    },
    firstHandCheck: {
      status: statusFor([RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD]),
      detail: detailFor(
        [RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD],
        evidencePacket.personalUseState === 'confirmed'
          ? '사용 기록이 있어 체험형 표현이 허용됩니다.'
          : '조사 기반 표현만 사용되었습니다.'
      )
    },
    affiliateDisclosureCheck: {
      status: has([RULE_IDS.MISSING_AFFILIATE_DISCLOSURE]) ? 'warn' : 'pass',
      detail: detailFor([RULE_IDS.MISSING_AFFILIATE_DISCLOSURE], '고지 요구 상태와 본문이 일치합니다.')
    },
    duplicationCheck: {
      status: has([RULE_IDS.DUPLICATE_DRAFT]) ? 'warn' : 'pass',
      detail: detailFor([RULE_IDS.DUPLICATE_DRAFT], '네 초안의 논거가 서로 구별됩니다.')
    },
    exaggerationCheck: {
      status: has([RULE_IDS.EXAGGERATION]) ? 'warn' : 'pass',
      detail: detailFor([RULE_IDS.EXAGGERATION], '단정 · 과장 표현이 발견되지 않았습니다.')
    },
    sensitiveClaimCheck: {
      status: statusFor([RULE_IDS.SENSITIVE_GUARANTEE]),
      detail: detailFor([RULE_IDS.SENSITIVE_GUARANTEE], '건강 · 안전 보장 표현이 없습니다.')
    },

    perDraftFindings: draftBundle.drafts.map((draft) => ({
      draftId: draft.draftId,
      findings: findings
        .filter((item) => item.draftId === draft.draftId)
        .map((item) => ({ ruleId: item.ruleId, severity: item.severity, problem: item.problem }))
    })),

    revisionRequests: findings.map((item) => ({
      draftId: item.draftId,
      severity: item.severity,
      ruleId: item.ruleId,
      problem: item.problem,
      requiredChange: item.requiredChange,
      evidenceRefs: item.evidenceRefs
    })),

    // Deduplicated: the same rule tripping on all four drafts is one problem to fix,
    // not four warnings to scroll past (BS-38).
    nonOverridableBlockers: [
      ...new Set(
        blockers
          .filter((item) => NON_OVERRIDABLE_RULES.includes(item.ruleId))
          .map((item) => item.ruleId + ': ' + item.problem)
      )
    ]
  };

  // A blocking finding outside the non-overridable list still blocks; it simply is
  // not permanent. Keep the artifact self-consistent for the schema gate.
  if (decision === 'block' && artifact.nonOverridableBlockers.length === 0) {
    artifact.nonOverridableBlockers.push(blockers[0].ruleId + ': ' + blockers[0].problem);
  }

  artifact.blockers = artifact.nonOverridableBlockers.slice();
  artifact.warnings = [...new Set(required.map((item) => item.problem))];

  const requestedNextAction = decision === 'pass' ? 'human_review' : decision === 'revise' ? 'draft' : 'stop';
  return { artifact, requestedNextAction, status: decision === 'block' ? 'blocked' : 'complete' };
}
