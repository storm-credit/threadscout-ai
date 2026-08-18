// Integrity Guardian checks.
//
// docs/spec/AGENT_CONTRACTS.md section 6 names eight checks the review report must
// carry. Two things this module fixes relative to a flat findings list:
//
//   - a finding is classified as a blocker or a revision request, because
//     SAFETY_COMPLIANCE treats an unsupported endorsement or a fake first-hand claim
//     as non-overridable, not as a note the owner may approve past (AT-08, AT-17);
//   - revision requests are machine-readable and carry no replacement copy, because
//     Guardian must not quietly become the Writer (AGENT_HANDOFFS.md section 4).

import { wordingRuleFor } from './product-matching.mjs';

export const GUARDIAN_CHECK_KEYS = Object.freeze([
  'productMatchCheck',
  'publicFigureClaimCheck',
  'rightsCheck',
  'firstHandCheck',
  'affiliateDisclosureCheck',
  'duplicationCheck',
  'exaggerationCheck',
  'sensitiveClaimCheck'
]);

export const GUARDIAN_CHECK_LABELS_KO = Object.freeze({
  productMatchCheck: '제품 동일성',
  publicFigureClaimCheck: '공인 표현',
  rightsCheck: '미디어 권리',
  firstHandCheck: '체험 표현',
  affiliateDisclosureCheck: '제휴 고지',
  duplicationCheck: '중복',
  exaggerationCheck: '과장',
  sensitiveClaimCheck: '민감 주장'
});

export const RULE_IDS = Object.freeze({
  EXACT_CLAIM_WITHOUT_EXACT_MATCH: 'EXACT_CLAIM_WITHOUT_EXACT_MATCH',
  SUBSTITUTE_NOT_LABELLED: 'SUBSTITUTE_NOT_LABELLED',
  PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION: 'PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION',
  MEDIA_RIGHTS_UNRESOLVED: 'MEDIA_RIGHTS_UNRESOLVED',
  FIRST_HAND_WITHOUT_USAGE_RECORD: 'FIRST_HAND_WITHOUT_USAGE_RECORD',
  UNSUPPORTED_CLAIM_REFERENCE: 'UNSUPPORTED_CLAIM_REFERENCE',
  MISSING_AFFILIATE_DISCLOSURE: 'MISSING_AFFILIATE_DISCLOSURE',
  DUPLICATE_DRAFT: 'DUPLICATE_DRAFT',
  EXAGGERATION: 'EXAGGERATION',
  SENSITIVE_GUARANTEE: 'SENSITIVE_GUARANTEE'
});

/** Findings no human approval may override without new evidence or a design change. */
const NON_OVERRIDABLE = Object.freeze([
  RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH,
  RULE_IDS.SUBSTITUTE_NOT_LABELLED,
  RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION,
  RULE_IDS.MEDIA_RIGHTS_UNRESOLVED,
  RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD,
  RULE_IDS.UNSUPPORTED_CLAIM_REFERENCE,
  RULE_IDS.SENSITIVE_GUARANTEE
]);

const CHECK_FOR_RULE = Object.freeze({
  [RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH]: 'productMatchCheck',
  [RULE_IDS.SUBSTITUTE_NOT_LABELLED]: 'productMatchCheck',
  [RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION]: 'publicFigureClaimCheck',
  [RULE_IDS.MEDIA_RIGHTS_UNRESOLVED]: 'rightsCheck',
  [RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD]: 'firstHandCheck',
  [RULE_IDS.UNSUPPORTED_CLAIM_REFERENCE]: 'productMatchCheck',
  [RULE_IDS.MISSING_AFFILIATE_DISCLOSURE]: 'affiliateDisclosureCheck',
  [RULE_IDS.DUPLICATE_DRAFT]: 'duplicationCheck',
  [RULE_IDS.EXAGGERATION]: 'exaggerationCheck',
  [RULE_IDS.SENSITIVE_GUARANTEE]: 'sensitiveClaimCheck'
});

/* Detectors ---------------------------------------------------------------- */

const FIRST_HAND_PATTERNS = [
  /직접\s*(써|쓰|사용|먹|발라|설치)/,
  /써\s*봤/,
  /썼는데/,
  /사용해\s*봤/,
  /먹어\s*봤/,
  /재구매/,
  /제가\s*(써|쓰)/,
  /내가\s*(써|쓰)/
];

const SAME_PRODUCT_PATTERNS = [/같은\s*제품/, /해당\s*제품/, /바로\s*그\s*제품/, /동일\s*제품/];
const ALTERNATIVE_PATTERNS = [/비슷한\s*제품/, /대체\s*(품|후보)/, /유사\s*제품/, /같은\s*제품은\s*아니/];

/**
 * Disclaimers that negate a same-product claim.
 * "같은 제품이 아니라 비슷한 제품" is the required wording for a substitute, so a
 * plain substring match would flag exactly the sentence the spec demands.
 */
const SAME_PRODUCT_NEGATIONS = [
  /(같은|동일|해당)\s*제품(이|은|는|이라고)?\s*아니\S*/g,
  /(같은|동일)\s*제품으로\s*(보|볼)\S*\s*(수\s*)?없\S*/g,
  /(같은|동일)\s*제품(인지|이라고)\S*\s*(단정|확정)하지\s*(않|못)\S*/g,
  /(같은|동일)\s*제품(이라고|으로)?\s*(보지|보지는|여기지)\s*않\S*/g
];

const ENDORSEMENT_PATTERNS = [
  /(연예인|유명인|방송인|셀럽).{0,18}(추천|픽|쓴다|사용한다)/,
  /추천한\s*제품/,
  /픽한\s*제품/,
  /협찬/,
  /앰버서더/,
  /광고\s*모델/
];

const EXAGGERATION_PATTERNS = [/무조건/, /100%/, /완벽하게\s*해결/, /누구나\s*만족/, /반드시\s*효과/, /최고의\s*제품/];
const SENSITIVE_PATTERNS = [/치료(된|됩|해)/, /질병.*예방/, /부작용\s*없/, /의학적으로\s*검증/, /안전이\s*보장/];

/**
 * Sentences that *disclaim* first-hand use.
 *
 * "직접 써본 기록이 없다면 체험담처럼 쓰지 않습니다" is the correct thing for the copy
 * to say when there is no usage record, so matching the bare verb would flag exactly
 * the sentence the rule wants. The disclaimer is removed before the claim check runs.
 */
const FIRST_HAND_NEGATIONS = [
  /직접\s*(써|쓴|사용)\S*\s*(기록|경험|적)\S*\s*(이|가|은|는)?\s*없\S*/g,
  /체험담처럼\s*쓰지\s*않\S*/g,
  /직접\s*(써|쓴|사용)\S*\s*(것|적)\S*\s*처럼\s*(쓰|말)\S*\s*않\S*/g
];

export function stripSameProductNegations(text = '') {
  return SAME_PRODUCT_NEGATIONS.reduce((value, pattern) => value.replace(pattern, ' '), text);
}

export function stripFirstHandNegations(text = '') {
  return FIRST_HAND_NEGATIONS.reduce((value, pattern) => value.replace(pattern, ' '), text);
}

export function detectFirstHandLanguage(text = '') {
  const asserted = stripFirstHandNegations(text);
  return FIRST_HAND_PATTERNS.some((pattern) => pattern.test(asserted));
}

export function detectSameProductClaim(text = '') {
  return SAME_PRODUCT_PATTERNS.some((pattern) => pattern.test(stripSameProductNegations(text)));
}

export function detectAlternativeLabel(text = '') {
  return ALTERNATIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function detectEndorsementImplication(text = '') {
  return ENDORSEMENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function detectExaggeration(text = '') {
  return EXAGGERATION_PATTERNS.some((pattern) => pattern.test(text));
}

export function detectSensitiveGuarantee(text = '') {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Character-bigram Dice coefficient.
 * Word boundaries work poorly for Korean, where particles attach to stems.
 */
export function textSimilarity(a = '', b = '') {
  const normalize = (value) => value.replace(/[\s\p{P}\p{S}]/gu, '');
  const left = normalize(a);
  const right = normalize(b);
  if (left.length < 2 || right.length < 2) return left === right ? 1 : 0;

  const bigrams = (value) => {
    const counts = new Map();
    for (let index = 0; index < value.length - 1; index += 1) {
      const gram = value.slice(index, index + 2);
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
    return counts;
  };

  const leftGrams = bigrams(left);
  const rightGrams = bigrams(right);
  let shared = 0;
  for (const [gram, count] of leftGrams) shared += Math.min(count, rightGrams.get(gram) ?? 0);
  return (2 * shared) / ((left.length - 1) + (right.length - 1));
}

export const DRAFT_DUPLICATE_THRESHOLD = 0.82;

/* Review ------------------------------------------------------------------- */

function finding(ruleId, problem, requiredChange, draftId = null) {
  return {
    ruleId,
    draftId,
    severity: NON_OVERRIDABLE.includes(ruleId) ? 'blocker' : 'required',
    problem,
    requiredChange
  };
}

/**
 * Run the eight checks over the drafts as they currently stand — owner edits
 * included, since the edited text is what would be published.
 *
 * @returns {{decision: 'pass'|'revise'|'block', checks: object, revisionRequests: Array, nonOverridableBlockers: string[]}}
 */
export function runGuardianChecks({
  drafts = [],
  matchState = 'unresolved',
  verifiedClaimIds = [],
  personalUseConfirmed = false,
  mediaRightsResolved = false,
  affiliate = false,
  disclosure = '',
  publicFigureVerifiedEndorsement = false
} = {}) {
  const findings = [];
  const claimIds = new Set(verifiedClaimIds);
  const rule = wordingRuleFor(matchState);

  if (!mediaRightsResolved) {
    findings.push(finding(
      RULE_IDS.MEDIA_RIGHTS_UNRESOLVED,
      '게시에 사용할 미디어의 권리가 확인되지 않았습니다.',
      '본인 보유 · 허가 확인 미디어로 바꾸거나 텍스트만 사용하세요.'
    ));
  }

  for (const draft of drafts) {
    const text = [draft.title, draft.text, draft.disclosure].filter(Boolean).join('\n');

    if (!rule.sameProductClaimAllowed && detectSameProductClaim(text)) {
      findings.push(finding(
        RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH,
        '동일 제품 확정 근거가 없는데 같은 제품이라고 서술했습니다.',
        '동일 제품 표현을 빼고 확인된 범위까지만 서술하세요.',
        draft.id
      ));
    }
    if (rule.mustLabelAlternative && !detectAlternativeLabel(text)) {
      findings.push(finding(
        RULE_IDS.SUBSTITUTE_NOT_LABELLED,
        '대체품인데 대체품이라는 표시가 없습니다.',
        '비슷한 제품 또는 대체 후보임을 본문에 명시하세요.',
        draft.id
      ));
    }
    if (!personalUseConfirmed && detectFirstHandLanguage(text)) {
      findings.push(finding(
        RULE_IDS.FIRST_HAND_WITHOUT_USAGE_RECORD,
        '사용 기록이 없는데 직접 사용한 것처럼 서술했습니다.',
        '체험형 표현을 조사 기반 표현으로 바꾸세요.',
        draft.id
      ));
    }
    if (!publicFigureVerifiedEndorsement && detectEndorsementImplication(text)) {
      findings.push(finding(
        RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION,
        '확인된 관계 등급을 넘어서는 추천 · 협찬 함의가 있습니다.',
        '공개적으로 확인된 사실만 서술하고 추천 표현을 제거하세요.',
        draft.id
      ));
    }

    const unsupported = (draft.claimIds ?? []).filter((claimId) => !claimIds.has(claimId));
    if (unsupported.length > 0) {
      findings.push(finding(
        RULE_IDS.UNSUPPORTED_CLAIM_REFERENCE,
        '검증 근거에 없는 주장을 참조했습니다: ' + unsupported.join(', '),
        '검증된 주장만 참조하도록 수정하세요.',
        draft.id
      ));
    }
    if (affiliate && !String(disclosure ?? '').trim()) {
      findings.push(finding(
        RULE_IDS.MISSING_AFFILIATE_DISCLOSURE,
        '제휴 링크를 쓰는데 고지 문구가 없습니다.',
        '제휴 고지 문구를 입력하세요.',
        draft.id
      ));
    }
    if (detectExaggeration(text)) {
      findings.push(finding(
        RULE_IDS.EXAGGERATION,
        '근거가 뒷받침하지 않는 단정 표현이 있습니다.',
        '단정 표현을 확인된 범위의 서술로 바꾸세요.',
        draft.id
      ));
    }
    if (detectSensitiveGuarantee(text)) {
      findings.push(finding(
        RULE_IDS.SENSITIVE_GUARANTEE,
        '건강 · 안전 보장성 표현이 있습니다.',
        '보장성 표현을 제거하세요.',
        draft.id
      ));
    }
  }

  for (let i = 0; i < drafts.length; i += 1) {
    for (let j = i + 1; j < drafts.length; j += 1) {
      if (textSimilarity(drafts[i].text ?? '', drafts[j].text ?? '') >= DRAFT_DUPLICATE_THRESHOLD) {
        findings.push(finding(
          RULE_IDS.DUPLICATE_DRAFT,
          '초안이 사실상 같은 글입니다.',
          '관점별로 논거가 달라지도록 다시 작성하세요.',
          drafts[j].id
        ));
      }
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const required = findings.filter((item) => item.severity === 'required');

  const checks = Object.fromEntries(GUARDIAN_CHECK_KEYS.map((key) => {
    const hit = findings.find((item) => CHECK_FOR_RULE[item.ruleId] === key);
    if (!hit) return [key, { status: 'pass', detail: GUARDIAN_CHECK_LABELS_KO[key] + ' 검사를 통과했습니다.' }];
    return [key, { status: hit.severity === 'blocker' ? 'block' : 'warn', detail: hit.problem }];
  }));

  return {
    decision: blockers.length > 0 ? 'block' : required.length > 0 ? 'revise' : 'pass',
    checks,
    revisionRequests: findings.map((item) => ({ ...item })),
    nonOverridableBlockers: [...new Set(blockers.map((item) => item.ruleId + ': ' + item.problem))]
  };
}

export { NON_OVERRIDABLE as NON_OVERRIDABLE_RULES };
