// Deterministic Korean phonetic josa combiner, stateless structured spec-snippet identity parser,
// and Novelist-grounded 4-angle Korean Threads strategy/draft builder (`CONTENT_OUTPUT_SPEC.md` v1.3).
// Hydrates strictly from verified candidate/evidence fields — never inventing unverified specs or first-hand claims (`CLAUDE.md` §8).

export const DRAFT_TONES = Object.freeze({
  POLITE: 'polite',
  PLAIN: 'plain'
});

const TRAILING_WRAP_CHARS = /[\s)\]}>'"”’」』】]+$/u;

// Closed SI & commerce measurement unit phonetic table (`CONTENT_OUTPUT_SPEC.md` §1)
const UNIT_PHONETIC_SUFFIXES = [
  { suffix: 'mm', hasBatchim: false }, // 밀리미터
  { suffix: 'cm', hasBatchim: false }, // 센티미터
  { suffix: 'km', hasBatchim: false }, // 킬로미터
  { suffix: 'ml', hasBatchim: false }, // 밀리리터
  { suffix: 'kw', hasBatchim: false }, // 킬로와트
  { suffix: 'hz', hasBatchim: false }, // 헤르츠
  { suffix: 'gb', hasBatchim: false }, // 기가바이트
  { suffix: 'mb', hasBatchim: false }, // 메가바이트
  { suffix: 'tb', hasBatchim: false }, // 테라바이트
  { suffix: 'in', hasBatchim: false }, // 인치
  { suffix: 'kg', hasBatchim: true },  // 킬로그램 (ㅁ)
  { suffix: 'mg', hasBatchim: true }   // 밀리그램 (ㅁ)
];

const DIGIT_PHONETICS = {
  '0': { hasBatchim: true, isRieul: false },  // 영
  '1': { hasBatchim: true, isRieul: true },   // 일 (ㄹ)
  '2': { hasBatchim: false, isRieul: false }, // 이
  '3': { hasBatchim: true, isRieul: false },  // 삼
  '4': { hasBatchim: false, isRieul: false }, // 사
  '5': { hasBatchim: false, isRieul: false }, // 오
  '6': { hasBatchim: true, isRieul: false },  // 육
  '7': { hasBatchim: true, isRieul: true },   // 칠 (ㄹ)
  '8': { hasBatchim: true, isRieul: true },   // 팔 (ㄹ)
  '9': { hasBatchim: false, isRieul: false }  // 구
};

/**
 * Inspect final spoken Korean sound of `word` (unwrapping trailing `)`, `]`, quotes) for josa selection.
 */
export function resolveKoreanBatchim(word = '') {
  const unwrapped = String(word ?? '').replace(TRAILING_WRAP_CHARS, '').trim();
  if (!unwrapped) return { hasBatchim: false, isRieul: false };

  if (/\d\s*%$/.test(unwrapped)) {
    // 퍼센트 (트 -> vowel)
    return { hasBatchim: false, isRieul: false };
  }

  // Digit + unit suffix like `50cm`, `500g`, `65W`, `2L`, `12V`, `27in`, `500mL`
  const unitTailMatch = unwrapped.match(/\d\s*([A-Za-z]{1,3})$/);
  if (unitTailMatch) {
    const lowerUnit = unitTailMatch[1].toLowerCase();
    for (const rule of UNIT_PHONETIC_SUFFIXES) {
      if (lowerUnit === rule.suffix) {
        return { hasBatchim: rule.hasBatchim, isRieul: false };
      }
    }
    if (lowerUnit === 'w' || lowerUnit === 'v' || lowerUnit === 'l' || lowerUnit === 'm') {
      // 와트 / 볼트 / 리터 / 미터 -> vowel
      return { hasBatchim: false, isRieul: false };
    }
    if (lowerUnit === 'g') {
      // 그램 (ㅁ)
      return { hasBatchim: true, isRieul: false };
    }
  }

  const lastChar = unwrapped.slice(-1);
  const code = lastChar.charCodeAt(0);

  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    if (jong === 0) return { hasBatchim: false, isRieul: false };
    if (jong === 8) return { hasBatchim: true, isRieul: true }; // ㄹ 받침
    return { hasBatchim: true, isRieul: false };
  }

  if (DIGIT_PHONETICS[lastChar]) {
    return DIGIT_PHONETICS[lastChar];
  }

  if (/^[A-Za-z]$/.test(lastChar)) {
    const upper = lastChar.toUpperCase();
    // Korean letter-name table: L(엘), R(알) -> ㄹ; M(엠), N(엔) -> non-ㄹ batchim; others -> vowel
    if (upper === 'L' || upper === 'R') return { hasBatchim: true, isRieul: true };
    if (upper === 'M' || upper === 'N') return { hasBatchim: true, isRieul: false };
    return { hasBatchim: false, isRieul: false };
  }

  return { hasBatchim: true, isRieul: false };
}

export function attachJosa(word = '', pair = '을/를') {
  const { hasBatchim, isRieul } = resolveKoreanBatchim(word);
  if (pair === '으로/로') {
    return !hasBatchim || isRieul ? '로' : '으로';
  }
  const [withBatchim, withoutBatchim] = String(pair).split('/');
  if (!withoutBatchim) return withBatchim ?? '';
  return hasBatchim ? withBatchim : withoutBatchim;
}

export function withJosa(word = '', pair = '을/를') {
  const clean = String(word ?? '').trim();
  if (!clean) return '';
  return `${clean}${attachJosa(clean, pair)}`;
}

function stripTerminalPunctuation(text = '') {
  return String(text ?? '').trim().replace(/[.?!]+$/u, '').trim();
}

/**
 * Strip live price / currency tokens (comma-grouped or ungrouped `39,000원`, `39000원`, `₩39,000`, `KRW 39000`, `3.9만원`, `(39,000원)`)
 * so prices never enter `variant`, `canonicalProductName`, or generated drafts (`BS-52`, `AFFILIATE_SPEC.md` §7).
 */
export function stripPriceNoiseFromIdentityValue(raw = '') {
  return String(raw ?? '')
    .replace(/\(\s*(?:(?:₩|KRW\s*)\d[\d,.]*(?:\s*(?:만\s*원|천\s*원|원))?|\d[\d,.]*\s*(?:만\s*원|천\s*원|원))(?:\s*[^)]*)?\)/giu, ' ')
    .replace(/(?:₩|KRW\s*)\d[\d,.]*(?:\s*(?:만\s*원|천\s*원|원))?.*$/giu, ' ')
    .replace(/(?<![A-Za-z0-9-])\d+(?:[.,]\d+)*\s*(?:만\s*원|천\s*원|원)(?![가-힣A-Za-z0-9]).*$/gu, ' ')
    .replace(/[\s([/|-]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const IDENTITY_INLINE_SPLIT_REGEX =
  /\r?\n|\s+\/\s+|(?=\s*(?:\[(?:브랜드명?|제조사|메이커|모델명|모델\s*코드|모델\s*번호|모델|품번|형번|옵션(?:\s*\/?\s*규격)?|색상(?:\s*\/?\s*사이즈)?|규격|사이즈|구성|변형|판매자|공식\s*스토어|스토어명?|판매처|입점사)\]\s*|(?:브랜드명?|제조사|메이커|모델명|모델\s*코드|모델\s*번호|모델|품번|형번|옵션(?:\s*\/?\s*규격)?|색상(?:\s*\/?\s*사이즈)?|규격|사이즈|구성|변형|판매자|공식\s*스토어|스토어명?|판매처|입점사)\s*[:：|]))/u;

const IDENTITY_FIELD_PATTERNS = [
  { key: 'brand', rx: /^(?:[-•*]\s*)?(?:\[(?:브랜드명?|제조사|메이커)\]\s*[:：|\t-]?\s*|(?:브랜드명?|제조사|메이커)\s*[:：|\t-]\s*)(.+)$/iu, max: 120 },
  { key: 'model', rx: /^(?:[-•*]\s*)?(?:\[(?:모델명|모델\s*코드|모델\s*번호|모델|품번|형번)\]\s*[:：|\t-]?\s*|(?:모델명|모델\s*코드|모델\s*번호|모델|품번|형번)\s*[:：|\t-]\s*)(.+)$/iu, max: 120 },
  { key: 'variant', rx: /^(?:[-•*]\s*)?(?:\[(?:옵션(?:\s*\/?\s*규격)?|색상(?:\s*\/?\s*사이즈)?|규격|사이즈|구성|변형)\]\s*[:：|\t-]?\s*|(?:옵션(?:\s*\/?\s*규격)?|색상(?:\s*\/?\s*사이즈)?|규격|사이즈|구성|변형)\s*[:：|\t-]\s*)(.+)$/iu, max: 160 },
  { key: 'seller', rx: /^(?:[-•*]\s*)?(?:\[(?:판매자|공식\s*스토어|스토어명?|판매처|입점사)\]\s*[:：|\t-]?\s*|(?:판매자|공식\s*스토어|스토어명?|판매처|입점사)\s*[:：|\t-]\s*)(.+)$/iu, max: 160 }
];

/**
 * Stateless structured spec-snippet identity parser (`U-02`, `BS-52`, `BS-61`).
 * Extracts ONLY `brand`, `model`, `variant`, and `seller` from labelled key-value lines,
 * stripping prices and never copying marketing prose into `verifiedPros`/`verifiedLimitation`.
 */
export function parseStructuredIdentitySnippet(rawSnippet = '') {
  const result = {
    brand: '',
    model: '',
    variant: '',
    seller: '',
    matchedFields: []
  };
  const lines = String(rawSnippet ?? '')
    .split(IDENTITY_INLINE_SPLIT_REGEX)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    for (const { key, rx, max } of IDENTITY_FIELD_PATTERNS) {
      if (result[key]) continue;
      const match = line.match(rx);
      if (!match) continue;
      const cleaned = stripPriceNoiseFromIdentityValue(match[1]).slice(0, max);
      if (cleaned) {
        result[key] = cleaned;
        result.matchedFields.push(key);
      }
    }
  }

  return Object.freeze({
    ...result,
    matchedFields: Object.freeze(result.matchedFields)
  });
}

/**
 * Normalize an operator-entered or default `verifiedLimitation` into a grammatically complete sentence
 * matching `tone` (`polite` vs `plain` `~다`), plus a compact parenthetical tag for checklist items.
 */
export function formatLimitationForTone(rawLimitation = '', tone = DRAFT_TONES.POLITE) {
  const base = stripTerminalPunctuation(
    rawLimitation || '구매 전 본인 설치·사용 환경과 상세 규격을 반드시 확인해야 합니다'
  );

  const compactTag = base
    .replace(/\s*(?:반드시\s*)?확인(?:하세요|해\s*보세요|해야\s*합니다|해야\s*한다)$/u, ' 사전 확인 필요')
    .replace(/어렵습니다$|어려워요$|어렵다$/u, '어려움')
    .replace(/불가능합니다$|불가합니다$|불가능하다$/u, '불가')
    .replace(/떨어집니다$|떨어져요$|떨어진다$/u, '저하 우려')
    .replace(/필요합니다$|필요해요$|필요하다$/u, '필요')
    .replace(/없습니다$|없어요$|없다$/u, '없음')
    .replace(/입니다$|이다$/u, '')
    .trim();

  if (tone === DRAFT_TONES.PLAIN) {
    let plain = base
      .replace(/확인하세요$|확인해\s*보세요$|살펴보세요$/u, '확인해야 한다')
      .replace(/주의하세요$/u, '주의해야 한다')
      .replace(/어렵습니다$|어려워요$/u, '어렵다')
      .replace(/불가능합니다$|불가합니다$/u, '불가능하다')
      .replace(/떨어집니다$|떨어져요$/u, '떨어진다')
      .replace(/필요합니다$|필요해요$/u, '필요하다')
      .replace(/제한됩니다$|제한돼요$/u, '제한된다')
      .replace(/없습니다$|없어요$/u, '없다')
      .replace(/있습니다$|있어요$/u, '있다')
      .replace(/아닙니다$|아니에요$/u, '아니다')
      .replace(/됩니다$|돼요$/u, '된다')
      .replace(/합니다$|해요$/u, '한다')
      .replace(/입니다$|이에요$|예요$/u, '이다');
    if (!/(?:다|까)$/.test(plain)) {
      plain = /(?<![이가은는])\s*불가$/.test(plain)
        ? plain.replace(/\s*불가$/, '은 불가하다')
        : /불가$/.test(plain)
          ? `${plain}하다`
          : `${plain} 조건은 미리 확인해야 한다`;
    }
    return { sentence: `${plain}.`, tag: compactTag || base };
  }

  let polite = base
    .replace(/확인해야\s*한다$/u, '확인해야 합니다')
    .replace(/주의해야\s*한다$/u, '주의해야 합니다')
    .replace(/어렵다$/u, '어렵습니다')
    .replace(/불가능하다$/u, '불가능합니다')
    .replace(/떨어진다$/u, '떨어집니다')
    .replace(/필요하다$/u, '필요합니다')
    .replace(/제한된다$/u, '제한됩니다')
    .replace(/없다$/u, '없습니다')
    .replace(/있다$/u, '있습니다')
    .replace(/아니다$/u, '아닙니다')
    .replace(/된다$/u, '됩니다')
    .replace(/한다$/u, '합니다')
    .replace(/이다$/u, '입니다');
  if (!/(?:다|요|죠|까)$/.test(polite)) {
    polite = /(?<![이가은는])\s*불가$/.test(polite)
      ? polite.replace(/\s*불가$/, '은 불가합니다')
      : /불가$/.test(polite)
        ? `${polite}합니다`
        : `${polite} 조건은 미리 확인하세요`;
  }
  return { sentence: `${polite}.`, tag: compactTag || base };
}

export function buildKoreanStrategyAngles(candidate = {}) {
  const name = stripTerminalPunctuation(candidate.name || '대상 제품');
  const identity = [candidate.brand, candidate.model, candidate.variant].filter(Boolean).join(' ').trim() || name;
  const primaryPro = stripTerminalPunctuation(
    candidate.evidencePacket?.verifiedPros?.[0]
    ?? candidate.verifiedPros?.[0]
    ?? candidate.readerValue
    ?? '설치·사용 조건을 먼저 비교합니다'
  );
  const { sentence: boundLimitationSentence, tag: boundLimitationTag } = formatLimitationForTone(
    candidate.evidencePacket?.verifiedLimitation ?? candidate.verifiedLimitation,
    DRAFT_TONES.POLITE
  );
  const whyNow = stripTerminalPunctuation(candidate.whyNow || '구매 전 규격과 호환 조건 확인 질문이 잦은 품목');

  return [
    {
      id: 'problem-result',
      title: '조건부 불가·호환 훅',
      readerPromise: stripTerminalPunctuation(candidate.readerValue || primaryPro),
      hook: `${boundLimitationTag} — 이 조건부터 먼저 통과하는지 따져봅니다.`,
      proof: 'claim-identity',
      limitation: boundLimitationSentence
    },
    {
      id: 'mechanism-demo',
      title: '구조 대 한계 대조',
      readerPromise: `${primaryPro} 조건과 실제 제약 지점을 나란히 대조합니다.`,
      hook: `${withJosa(name, '은/는')} 홍보 문구보다 ${identity} 규격과 제약 조건을 같이 봐야 실패가 줄어듭니다.`,
      proof: 'claim-identity',
      limitation: boundLimitationSentence
    },
    {
      id: 'buying-checklist',
      title: '구매 전 식별 체크리스트',
      readerPromise: '비슷한 외형 상품 사이에서 브랜드·모델·옵션 규격을 빠르게 대조합니다.',
      hook: `결제 전 확인할 식별 기준은 ${identity} 세 가지입니다.`,
      proof: 'claim-identity',
      limitation: '실시간 가격·재고 변동은 구매 시점 판매 페이지에서 직접 확인해야 합니다.'
    },
    {
      id: 'honest-fit',
      title: '맞는 조건 vs 거를 조건',
      readerPromise: `${whyNow} 맥락에서 꼭 필요한 경우와 거를 경우를 가릅니다.`,
      hook: '모든 집에 맞는 만능 품목으로 보지 않고 사용 조건부터 선별합니다.',
      proof: 'claim-identity',
      limitation: boundLimitationSentence
    }
  ];
}

export function buildKoreanDraftTexts(
  candidate = {},
  {
    tone = DRAFT_TONES.POLITE,
    offsetZeroPrefix = '',
    attributedReportNote = '',
    substituteNotice = '',
    identityCaveat = '',
    showcasePointer = ''
  } = {}
) {
  const normalizedTone = tone === DRAFT_TONES.PLAIN ? DRAFT_TONES.PLAIN : DRAFT_TONES.POLITE;
  const name = stripTerminalPunctuation(candidate.name || '후보 제품');
  const identity = [candidate.brand, candidate.model, candidate.variant].filter(Boolean).join(' ').trim() || name;
  const readerValue = stripTerminalPunctuation(candidate.readerValue || '설치·사용 조건 비교');
  const primaryPro = stripTerminalPunctuation(
    candidate.evidencePacket?.verifiedPros?.[0]
    ?? candidate.verifiedPros?.[0]
    ?? readerValue
  );
  const secondaryPro = stripTerminalPunctuation(
    candidate.evidencePacket?.verifiedPros?.[1]
    ?? candidate.verifiedPros?.[1]
    ?? ''
  );
  const { sentence: limitationSentence, tag: limitationTag } = formatLimitationForTone(
    candidate.evidencePacket?.verifiedLimitation ?? candidate.verifiedLimitation,
    normalizedTone
  );

  // Non-use `AT-23` clause kept in `draft4Tail` so `<= 500` budget truncation never drops it (`BF-4`)
  const nonUseClause = candidate.personalUse === 'confirmed'
    ? ''
    : (normalizedTone === DRAFT_TONES.PLAIN
        ? ' 직접 써본 기록이 없어 공개 사양과 확인 자료만 놓고 정리했다.'
        : ' 직접 써본 기록이 없으므로 공개 사양과 확인 자료만 놓고 정리했습니다.');

  const closingQuestion = !candidate.affiliate
    ? (normalizedTone === DRAFT_TONES.PLAIN
        ? ' 비슷한 공간이라면 설치 규격과 관리 편의 중 어느 쪽을 먼저 보는 편인가?'
        : ' 비슷한 공간에서는 설치 규격과 관리 방식 중 어느 쪽을 먼저 보시나요?')
    : '';

  const bodies = normalizedTone === DRAFT_TONES.PLAIN
    ? [
        `${withJosa(name, '을/를')} 고를 때 먼저 걸러야 할 조건은 명확하다. ${limitationSentence} 반대로 이 기준만 통과하면 ${readerValue} 상황에서 ${withJosa(identity, '을/를')} 실용 후보로 둘 만하다.`,
        `겉모습만 비슷한 상품이 많지만 이번에 대조한 기준 모델은 ${withJosa(identity, '이라/라')} 구분이 분명하다. 강점은 ${primaryPro}${secondaryPro ? ` 및 ${secondaryPro}` : ''} 쪽에 있다. 반대로 꼭 짚을 한계도 있다. ${limitationSentence}`,
        `결제창 누르기 전 3초 대조표: ① 브랜드·모델·옵션(${identity}) ② 핵심 제약(${limitationTag}) ③ 기대 효용(${primaryPro}). 실시간 가격과 재고는 로컬 검토 단계에서 단정하지 않으니 판매처 표기를 마지막에 대조하는 편이 안전하다.`,
        `${withJosa(name, '이/가')} 누구에게나 필요한 물건은 아니다. ${readerValue} 문제가 분명할 때만 ${withJosa(identity, '으로/로')} 좁혀 보고, 제약(${limitationTag})에 걸리면 그냥 넘기는 편이 낫다.`
      ]
    : [
        `${withJosa(name, '을/를')} 보실 때 제일 먼저 걸러낼 조건부터 짚어볼게요. ${limitationSentence} 이 기준에 걸리지 않고 ${readerValue} 고민이 있는 환경이라면 ${withJosa(identity, '을/를')} 후보에 올려둘 만합니다.`,
        `외형이 닮은 상품이 많지만 이번에 확인한 기준 사양은 ${identity}입니다. 장점은 ${primaryPro}${secondaryPro ? ` 및 ${secondaryPro}` : ''} 쪽에 있고요. 반대로 꼭 따져볼 제약도 있습니다. ${limitationSentence}`,
        `구매 전 3가지 식별 체크: ① 브랜드·모델·옵션(${identity}) ② 사기 전 한계(${limitationTag}) ③ 핵심 포인트(${primaryPro}). 실시간 가격·재고는 시점마다 달라지니 판매 페이지 표기와 마지막으로 대조해 보세요.`,
        `${withJosa(name, '이/가')} 모든 집에 꼭 맞는 품목은 아니에요. ${readerValue} 불편이 뚜렷할 때만 ${withJosa(identity, '으로/로')} 검토하시고, 제약(${limitationTag})에 걸리면 과감히 넘기시는 편이 낫습니다.`
      ];

  const baseTail = `${attributedReportNote}${substituteNotice}${identityCaveat}${showcasePointer}`;
  return bodies.map((body, idx) => {
    const perDraftTail = idx === 3
      ? `${nonUseClause}${baseTail}${closingQuestion}`
      : baseTail;
    const mandatoryTail = idx === 3
      ? `${nonUseClause}${baseTail}`
      : baseTail;
    const full = `${offsetZeroPrefix}${body}${perDraftTail}`;
    if ([...full].length <= 500) return full;

    // First drop optional closing question if that alone fits `<= 500`
    const withoutQuestion = `${offsetZeroPrefix}${body}${mandatoryTail}`;
    if ([...withoutQuestion].length <= 500) return withoutQuestion;

    // Otherwise trim `body` while strictly preserving `offsetZeroPrefix` (offset 0) and `mandatoryTail` (`AT-10`, `AT-23`, `#NNN`)
    const allowance = Math.max(40, 499 - [...offsetZeroPrefix].length - [...mandatoryTail].length);
    const trimmedBody = [...body].slice(0, allowance).join('').trim() + '…';
    return `${offsetZeroPrefix}${trimmedBody}${mandatoryTail}`;
  });
}
