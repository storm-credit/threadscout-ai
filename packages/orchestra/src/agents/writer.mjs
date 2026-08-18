// Threads Writer.
//
// Writes four Korean drafts from the brief plus the evidence packet, and nothing
// else. It has no research tool, so every factual sentence has to come from a
// verified claim (AGENT_CONTRACTS.md section 5).
//
// Two rules shape the wording:
//   - research-based copy uses research wording; first-hand wording requires a
//     usage record (AT-23);
//   - unknown current facts are omitted or qualified, never invented (AT-16).

import { ARTIFACT_TYPES, createEnvelope } from '../../../core/src/artifacts.mjs';
import { AGENT_IDS } from '../../../core/src/handoff.mjs';
import { AFFILIATE_DISCLOSURE_TEXT, detectFirstHandLanguage } from '../../../core/src/policy-rules.mjs';
import { hashArtifact } from '../../../core/src/hash.mjs';

const HOOKS = Object.freeze({
  practical_result: (product) => product + ', 쓰고 나서 실제로 뭐가 달라지는지부터 정리해봤음.',
  mechanism_demo: (product) => product + '은 말로 설명하는 것보다 구조를 한 번 보는 게 빠름.',
  comparison_decision: (product) => product + ' 살 때 이름만 보고 고르면 다른 걸 살 수 있음.',
  limitation_fit: (product) => product + ', 모두에게 필요한 물건은 아님.'
});

const BODY_FRAME = Object.freeze({
  practical_result: (claims, prefix) =>
    prefix + ' 남는 결과는 이거였음.\n' + claims + '\n결과가 필요한 상황인지부터 보면 판단이 빨라짐.',
  mechanism_demo: (claims, prefix) =>
    prefix + ' 동작하는 방식은 이렇게 정리됨.\n' + claims + '\n구조가 우리 집 환경과 맞는지가 핵심임.',
  comparison_decision: (claims, prefix) =>
    '고를 때 확인할 항목만 추리면:\n' + claims + '\n' + prefix + ' 이 항목이 어긋나면 비슷해 보여도 다른 물건임.',
  limitation_fit: (claims, prefix) =>
    '먼저 안 맞는 경우부터.\n' + claims + '\n' + prefix + ' 여기에 해당하지 않으면 굳이 살 이유는 없음.'
});

const CAUTION = Object.freeze({
  practical_result: '기대 결과는 사용 환경에 따라 달라질 수 있음.',
  mechanism_demo: '구조가 맞아도 설치 공간이 다르면 결과가 달라짐.',
  comparison_decision: '옵션과 구성이 다르면 같은 제품으로 볼 수 없음.',
  limitation_fit: '필요하지 않은 사람에게는 자리만 차지하는 물건이 될 수 있음.'
});

/** Research wording unless a usage record exists — never the reverse. */
function wordingPrefix(personalUseState) {
  return personalUseState === 'confirmed' ? '직접 써보니' : '자료를 찾아보니';
}

function renderClaims(claimIds, claimsById) {
  const lines = claimIds
    .map((claimId) => claimsById.get(claimId))
    .filter(Boolean)
    .map((claim) => '· ' + claim.text);
  return lines.length > 0 ? lines.join('\n') : '· 아직 확인된 항목이 없어 단정하지 않음.';
}

/**
 * Qualifiers for facts the evidence does not currently support.
 * This is how "unknown" reaches the reader as a stated limit rather than silence.
 */
function unknownFactNotes(evidencePacket) {
  const notes = [];
  if (evidencePacket.commerceSnapshot?.priceStatus !== 'observed') {
    notes.push('현재 가격은 확인되지 않아 적지 않음.');
  }
  if (evidencePacket.matchState === 'substitute') {
    notes.push('링크는 같은 제품이 아니라 비슷한 제품임.');
  }
  if (evidencePacket.matchState === 'likely' || evidencePacket.matchState === 'unresolved') {
    notes.push('판매 페이지와 동일 제품인지는 아직 확정하지 않음.');
  }
  return notes;
}

export function runWriter(request, { clock, nextId }) {
  const { runId, candidate, evidencePacket, contentBrief } = request;
  const now = clock();

  const claimsById = new Map((evidencePacket.verifiedClaims ?? []).map((claim) => [claim.claimId, claim]));
  const prefix = wordingPrefix(evidencePacket.personalUseState);
  const notes = unknownFactNotes(evidencePacket);
  const publishableMedia = (evidencePacket.mediaRights ?? []).find((media) =>
    ['owner_supplied', 'licensed'].includes(media.publishRightsState)
  );

  const drafts = contentBrief.angles.map((angle) => {
    const claimText = renderClaims(angle.allowedClaims, claimsById);
    const bodyParts = [BODY_FRAME[angle.readerJob](claimText, prefix)];
    if (notes.length > 0) bodyParts.push(notes.map((note) => '※ ' + note).join('\n'));

    const body = bodyParts.join('\n\n');
    const hook = HOOKS[angle.readerJob](evidencePacket.canonicalProduct.productName);

    const draft = {
      draftId: nextId('draft'),
      angleId: angle.angleId,
      hook,
      body,
      caution: CAUTION[angle.readerJob],
      cta: angle.cta,
      disclosure: angle.disclosureRequirement === 'required' ? AFFILIATE_DISCLOSURE_TEXT : null,
      claimRefs: [...angle.allowedClaims],
      mediaRef: publishableMedia ? publishableMedia.mediaId : null,
      firstHandLanguageUsed: false,
      issueWordingClass: angle.issueReferenceRule ? 'public_fact_only' : null
    };

    // Self-check. If the writer ever produced prohibited wording it stops here
    // rather than handing it to the Guardian and hoping.
    const detection = detectFirstHandLanguage(draft.hook + '\n' + draft.body);
    draft.firstHandLanguageUsed = detection.found;
    if (detection.found && evidencePacket.personalUseState !== 'confirmed') {
      throw new Error('Writer produced first-hand wording without a usage record.');
    }

    return draft;
  });

  const artifact = {
    ...createEnvelope({
      type: ARTIFACT_TYPES.DRAFT_BUNDLE,
      agentId: AGENT_IDS.WRITER,
      runId,
      artifactId: nextId('artifact'),
      createdAt: now,
      inputArtifactRefs: [contentBrief.artifactId, evidencePacket.artifactId],
      evidenceRefs: [...evidencePacket.evidenceRefs]
    }),
    candidateId: candidate.candidateId,
    contentBriefHash: hashArtifact(contentBrief),
    evidencePacketHash: hashArtifact(evidencePacket),
    drafts
  };

  if (notes.length > 0) artifact.warnings.push('확인되지 않은 사실은 본문에서 제외하거나 한정했습니다.');

  return { artifact, requestedNextAction: 'review', status: 'complete' };
}
