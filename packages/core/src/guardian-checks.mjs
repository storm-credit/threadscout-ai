// Integrity Guardian checks (including Option B AT-45 offset-0 disclosure,
// BS-60 post-publish lock, incentivized engagement-bait block, and Korean anti-AI-slop
// conjugated-stem checks with mandatory AT-10 / AT-23 disclaimer pre-stripping).

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
  exaggerationCheck: '과장·문체',
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
  DISCLOSURE_NOT_AT_OFFSET_ZERO: 'DISCLOSURE_NOT_AT_OFFSET_ZERO',
  POST_PUBLISH_MONETIZATION_LOCKED: 'POST_PUBLISH_MONETIZATION_LOCKED',
  INCENTIVIZED_ENGAGEMENT_BAIT: 'INCENTIVIZED_ENGAGEMENT_BAIT',
  INVALID_AFFILIATE_MAPPING: 'INVALID_AFFILIATE_MAPPING',
  DRAFT_LENGTH_EXCEEDED: 'DRAFT_LENGTH_EXCEEDED',
  KOREAN_AI_SLOP: 'KOREAN_AI_SLOP',
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
  RULE_IDS.DISCLOSURE_NOT_AT_OFFSET_ZERO,
  RULE_IDS.POST_PUBLISH_MONETIZATION_LOCKED,
  RULE_IDS.INCENTIVIZED_ENGAGEMENT_BAIT,
  RULE_IDS.INVALID_AFFILIATE_MAPPING,
  RULE_IDS.DRAFT_LENGTH_EXCEEDED,
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
  [RULE_IDS.DISCLOSURE_NOT_AT_OFFSET_ZERO]: 'affiliateDisclosureCheck',
  [RULE_IDS.POST_PUBLISH_MONETIZATION_LOCKED]: 'affiliateDisclosureCheck',
  [RULE_IDS.INCENTIVIZED_ENGAGEMENT_BAIT]: 'affiliateDisclosureCheck',
  [RULE_IDS.INVALID_AFFILIATE_MAPPING]: 'affiliateDisclosureCheck',
  [RULE_IDS.DRAFT_LENGTH_EXCEEDED]: 'exaggerationCheck',
  [RULE_IDS.KOREAN_AI_SLOP]: 'exaggerationCheck',
  [RULE_IDS.DUPLICATE_DRAFT]: 'duplicationCheck',
  [RULE_IDS.EXAGGERATION]: 'exaggerationCheck',
  [RULE_IDS.SENSITIVE_GUARANTEE]: 'sensitiveClaimCheck'
});

/** Exact-hostname non-merchant reference allowlist (never wildcard-matched). */
export const DEFAULT_NON_COMMERCIAL_HOSTS = Object.freeze([
  'safetykorea.kr',
  'www.safetykorea.kr',
  'ftc.go.kr',
  'www.ftc.go.kr',
  'kca.go.kr',
  'www.kca.go.kr',
  'news.naver.com'
]);

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
const ALTERNATIVE_PATTERNS = [/비슷한\s*(제품|대체품)/, /대체\s*(품|후보)/, /유사\s*제품/, /같은\s*제품은\s*아니/];

const SAME_PRODUCT_NEGATIONS = [
  /같은\s*제품이\s*아니라\s*비슷한\s*(대체품|제품)\S*/g,
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

const FIRST_HAND_NEGATIONS = [
  /직접\s*(써\s*본|써본|쓴|사용한?)\s*(기록|경험|적)\S*\s*(이|가|은|는)?\s*없\S*/g,
  /체험담처럼\s*쓰지\s*않\S*/g,
  /직접\s*(써|쓴|사용)\S*\s*(것|적)\S*\s*처럼\s*(쓰|말)\S*\s*않\S*/g
];

const MANDATORY_DISCLAIMER_STRIPPERS = [
  /이\s*링크는\s*같은\s*제품이\s*아니라\s*비슷한\s*(대체품|제품)\S*/g,
  /같은\s*제품이\s*아니라\s*비슷한\s*(대체품|제품)\S*/g,
  /직접\s*(써\s*본|써본|사용한?)\s*기록이\s*없(어|다면|으므로|습니다|기\s*때문에)[^.?!\n]*/g,
  /체험담처럼\s*쓰지\s*않\S*/g
];

const INCENTIVIZED_BAIT_PATTERNS = [
  /(댓글|답글|리플|팔로우|좋아요|리포스트).{0,24}(남겨|달아|주시면|하시면|누르).{0,24}(링크|DM|디엠|좌표|정보|주소)/i,
  /(링크|DM|디엠|좌표|주소).{0,20}(보내\s*드|드릴게|드려요|발송)/i
];

const CARD_POINTER_PATTERN = /(?:#\d{1,4}\b|\/showcase\/\d{1,4}\b|(?<![0-9A-Za-z])\d{1,4}\s*번(?!\s*(?:째|회|가지|명|개|세트|차|줄|칸|이상|이하|미만|초과|헹구|씻|닦|반복)))/i;
const PROFILE_SHOWCASE_PATTERN = /(?:\/showcase\b|쇼케이스|프로필[^\n.?!]{0,14}(?:링크|쇼케이스|정리|상단|하단|목록)|바이오\s*링크|소개란\s*링크|프로필\s*#\d{1,4})/i;
const URL_IN_TEXT_PATTERN = /https?:\/\/[^\s)>\]]+/gi;

export function extractReferencedCardNumbers(text = '') {
  const source = String(text ?? '');
  const found = new Set();
  for (const m of source.matchAll(/#0*(\d{1,4})\b/g)) found.add(Number(m[1]));
  for (const m of source.matchAll(/\/showcase\/0*(\d{1,4})\b/gi)) found.add(Number(m[1]));
  for (const m of source.matchAll(/(?<![0-9A-Za-z])0*(\d{1,4})\s*번(?!\s*(?:째|회|가지|명|개|세트|차|줄|칸|이상|이하|미만|초과|헹구|씻|닦|반복))/g)) {
    found.add(Number(m[1]));
  }
  return [...found].filter((n) => Number.isInteger(n) && n > 0);
}

export function stripSameProductNegations(text = '') {
  return SAME_PRODUCT_NEGATIONS.reduce((value, pattern) => value.replace(pattern, ' '), text);
}

export function stripFirstHandNegations(text = '') {
  return FIRST_HAND_NEGATIONS.reduce((value, pattern) => value.replace(pattern, ' '), text);
}

export function stripMandatoryDisclaimers(text = '') {
  return MANDATORY_DISCLAIMER_STRIPPERS.reduce((value, pattern) => value.replace(pattern, ' '), String(text ?? ''));
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

export function detectIncentivizedEngagementBait(text = '') {
  return INCENTIVIZED_BAIT_PATTERNS.some((pattern) => pattern.test(String(text ?? '')));
}

/**
 * Korean anti-AI-slop detector over conjugated stems after stripping mandatory AT-10/AT-23 disclaimers.
 */
export function detectKoreanAiSlop(text = '') {
  const cleaned = stripMandatoryDisclaimers(text);
  const reasons = [];

  if (/(되어지|되어져|보여지|보여져|여겨지|여겨져)/.test(cleaned)) {
    reasons.push('이중 피동(되어지-/보여지-/여겨지-) 표현이 있습니다.');
  }
  const connectiveCommas = cleaned.match(/[가-힣](?:고|며|지만|면서),/g) ?? [];
  if (connectiveCommas.length >= 3) {
    reasons.push('연결어미 직후 기계적 쉼표(-고,/-지만,)가 3회 이상 반복됩니다.');
  }
  if (/(?:중요한|필요한)\s*(?:것은|건)\s+[^.?!\n]{2,40}(?:이다|예요|입니다)|핵심은\s+[^.?!\n]{2,40}(?:점이다|점입니다|데\s*있다)/.test(cleaned)) {
    reasons.push('번역투 분열문(중요한 것은 ~이다 / 핵심은 ~점이다)이 있습니다.');
  }
  if (/(?:^|[.?!]\s+)(?:그러나\s*)?(?:한계도\s*분명(?:하다|해요|합니다)|아쉬운\s*점도\s*있(?:다|어요|습니다)|과제도\s*남아\s*있(?:다|어요|습니다))\s*[.?!]/.test(cleaned)) {
    reasons.push('내용 없는 빈 반론 문패 문장 대신 첫 문장에 구체적 한계를 바로 적으세요.');
  }
  const antithesisMatches = cleaned.match(/[가-힣0-9A-Za-z]+\s*(?:이|가)\s*아니라\s+[가-힣0-9A-Za-z]+/g) ?? [];
  if (antithesisMatches.length >= 2) {
    reasons.push('부정 대구(A가 아니라 B)가 한 초안에 2회 이상 연쇄됩니다.');
  }

  return { detected: reasons.length > 0, reasons };
}

/**
 * Closed commercial solicitation surface test (AFFILIATE_SPEC.md §5, AT-45).
 */
export function detectCommercialSolicitationSurface(
  draftText = '',
  {
    cta = null,
    candidateMonetized = false,
    activeMonetizedShowcaseCount = 0,
    monetizedCardNumbers = [],
    nonCommercialHostAllowlist = DEFAULT_NON_COMMERCIAL_HOSTS
  } = {}
) {
  const text = String(draftText ?? '');
  const allowedHosts = new Set(nonCommercialHostAllowlist.map((host) => String(host).toLowerCase()));
  const monetizedCardSet = new Set(monetizedCardNumbers.map((n) => Number(n)));

  const urls = text.match(URL_IN_TEXT_PATTERN) ?? [];
  for (const rawUrl of urls) {
    try {
      const parsed = new URL(rawUrl);
      if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
        return { commercial: true, surfaceKind: 'direct_commercial_url' };
      }
    } catch {
      return { commercial: true, surfaceKind: 'unparsed_url_fail_closed' };
    }
  }

  const referencedCards = extractReferencedCardNumbers(text);
  const referencesMonetizedCard = referencedCards.some((num) => monetizedCardSet.has(num));
  const pointsToCard = CARD_POINTER_PATTERN.test(text) || cta === 'showcase_card';
  if (pointsToCard && (candidateMonetized || referencesMonetizedCard || (cta === 'showcase_card' && activeMonetizedShowcaseCount > 0))) {
    return { commercial: true, surfaceKind: 'indirect_monetized_card_pointer' };
  }

  const pointsToProfileShowcase = PROFILE_SHOWCASE_PATTERN.test(text) || cta === 'profile_showcase';
  if (pointsToProfileShowcase && (candidateMonetized || activeMonetizedShowcaseCount > 0)) {
    return { commercial: true, surfaceKind: 'indirect_profile_showcase_pointer' };
  }

  return { commercial: false, surfaceKind: 'non_commercial' };
}

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

function finding(ruleId, problem, requiredChange, draftId = null) {
  return {
    ruleId,
    draftId,
    severity: NON_OVERRIDABLE.includes(ruleId) ? 'blocker' : 'required',
    problem,
    requiredChange
  };
}

function hasValidStatutoryPrefix(disclosure, affiliateNetwork = '') {
  if (!disclosure) return false;
  if (!/^\[(?:광고|협찬|유료광고)\]/.test(disclosure) && !/(?:활동의\s*일환|수수료를?\s*제공|대가성)/.test(disclosure)) {
    return false;
  }
  if (!affiliateNetwork) return true;
  if (!/^\[(?:광고|협찬|유료광고)\]/.test(disclosure)) return false;
  if (affiliateNetwork === 'coupang_partners') return /쿠팡\s*파트너스/.test(disclosure) && /수수료/.test(disclosure);
  if (affiliateNetwork === 'naver_shopping_connect') return /네이버\s*쇼핑커넥트/.test(disclosure) && /수수료/.test(disclosure);
  return true;
}

/**
 * Run Guardian's independent deterministic checks (AT-08, AT-10, AT-17, AT-23, AT-45).
 */
export function runGuardianChecks({
  drafts = [],
  matchState = 'unresolved',
  verifiedClaimIds = [],
  personalUseConfirmed = false,
  mediaRightsResolved = false,
  affiliate = false,
  affiliateNetwork = '',
  affiliateMappingError = null,
  disclosure = '',
  publicFigureVerifiedEndorsement = false,
  activeMonetizedShowcaseCount = 0,
  monetizedCardNumbers = [],
  enforceOffsetZeroDisclosure = false,
  lockedNonCommercialAfterPublish = false
} = {}) {
  const findings = [];
  const claimIds = new Set(verifiedClaimIds);
  const rule = wordingRuleFor(matchState);
  const normalizedDisclosure = String(disclosure ?? '').trim();

  if (!mediaRightsResolved) {
    findings.push(finding(
      RULE_IDS.MEDIA_RIGHTS_UNRESOLVED,
      '게시에 사용할 미디어의 권리가 확인되지 않았습니다.',
      '본인 보유 · 허가 확인 미디어로 바꾸거나 텍스트만 사용하세요.'
    ));
  }

  if (lockedNonCommercialAfterPublish && affiliate) {
    findings.push(finding(
      RULE_IDS.POST_PUBLISH_MONETIZATION_LOCKED,
      '무고지 본문으로 이미 게시된 쇼케이스 카드는 사후에 제휴 링크를 붙일 수 없습니다.',
      '새 후보와 서두 대가성 고지가 포함된 새 게시물을 만드세요.'
    ));
  }

  if (affiliate && affiliateMappingError) {
    findings.push(finding(
      RULE_IDS.INVALID_AFFILIATE_MAPPING,
      affiliateMappingError,
      '제휴 프로그램, https:// 도착 URL, 교차 확인 출처, 법정 대가성 고지를 모두 유효하게 입력하세요.'
    ));
  }

  for (const draft of drafts) {
    const rawDraftText = String(draft.text ?? '');
    const text = [draft.title, rawDraftText, draft.disclosure].filter(Boolean).join('\n');

    if ([...rawDraftText].length > 500) {
      findings.push(finding(
        RULE_IDS.DRAFT_LENGTH_EXCEEDED,
        `스레드 단일 게시물 글자 수 상한(500자)을 초과했습니다(현재 ${[...rawDraftText].length}자).`,
        '서두 대가성 고지를 포함해 전체 본문을 500자 이내로 줄이세요.',
        draft.id
      ));
    }

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

    if (detectIncentivizedEngagementBait(rawDraftText)) {
      findings.push(finding(
        RULE_IDS.INCENTIVIZED_ENGAGEMENT_BAIT,
        '댓글·팔로우 조건부 링크/DM 발송 유도 문구는 스레드 정책 및 헌법(§5) 위반입니다.',
        '조건부 댓글/DM 유도 표현을 지우고 본문 또는 프로필 #번호 안내만 남기세요.',
        draft.id
      ));
    }

    const solicitation = detectCommercialSolicitationSurface(rawDraftText, {
      cta: draft.cta ?? null,
      candidateMonetized: affiliate,
      activeMonetizedShowcaseCount,
      monetizedCardNumbers
    });

    const statutoryOk = hasValidStatutoryPrefix(normalizedDisclosure, affiliateNetwork);

    if (affiliate && !normalizedDisclosure) {
      if (solicitation.commercial || enforceOffsetZeroDisclosure) {
        findings.push(finding(
          RULE_IDS.DISCLOSURE_NOT_AT_OFFSET_ZERO,
          '상업 유도 게시물(직접 링크 또는 수익화 쇼케이스 유도) 첫 줄 오프셋 0에 법정 대가성 고지 문구가 없습니다.',
          '본문 맨 첫 줄(오프셋 0)에 프로그램별 필수 대가성 고지 원문을 배치하세요.',
          draft.id
        ));
      } else {
        findings.push(finding(
          RULE_IDS.MISSING_AFFILIATE_DISCLOSURE,
          '제휴 링크를 쓰는데 고지 문구가 없습니다.',
          '제휴 고지 문구를 입력하세요.',
          draft.id
        ));
      }
    } else if ((solicitation.commercial || (affiliate && enforceOffsetZeroDisclosure)) && (!normalizedDisclosure || !statutoryOk || !rawDraftText.startsWith(normalizedDisclosure))) {
      findings.push(finding(
        RULE_IDS.DISCLOSURE_NOT_AT_OFFSET_ZERO,
        !statutoryOk
          ? '선택한 제휴 프로그램의 필수 법정 대가성 고지 형식([광고] + 프로그램명 + 수수료 명시)이 아닙니다.'
          : '대가성 고지 문구가 본문 맨 앞(오프셋 0)에 위치하지 않았거나 누락되었습니다.',
        '공백·이모지·후킹 문장보다 앞선 본문 첫 줄(오프셋 0)에 프로그램별 표준 대가성 고지 원문을 두세요.',
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

    const slop = detectKoreanAiSlop(rawDraftText);
    if (slop.detected) {
      findings.push(finding(
        RULE_IDS.KOREAN_AI_SLOP,
        slop.reasons[0],
        '번역투·기계적 쉼표·연쇄 부정대구를 일상 한국어 능동 평서문으로 다듬으세요.',
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
    const matching = findings.filter((item) => CHECK_FOR_RULE[item.ruleId] === key);
    const hit = matching.find((item) => item.severity === 'blocker') ?? matching[0];
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
