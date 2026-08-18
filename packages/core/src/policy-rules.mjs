// Canonical policy detectors.
//
// These are deterministic rules, shared so there is exactly one definition of each
// prohibition. Sharing a *detector* does not weaken Guardian independence: the
// Writer avoids these patterns by construction, while the Guardian re-scans the
// final text it is actually given. That distinction is what catches an owner edit
// that reintroduces a prohibited phrase after drafting (BS-32).

export const RULE_IDS = Object.freeze({
  FIRST_HAND_WITHOUT_USAGE_RECORD: 'FIRST_HAND_WITHOUT_USAGE_RECORD',
  EXACT_CLAIM_WITHOUT_EXACT_MATCH: 'EXACT_CLAIM_WITHOUT_EXACT_MATCH',
  SUBSTITUTE_NOT_LABELLED: 'SUBSTITUTE_NOT_LABELLED',
  PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION: 'PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION',
  MEDIA_RIGHTS_UNRESOLVED: 'MEDIA_RIGHTS_UNRESOLVED',
  MISSING_AFFILIATE_DISCLOSURE: 'MISSING_AFFILIATE_DISCLOSURE',
  UNSUPPORTED_CLAIM_REFERENCE: 'UNSUPPORTED_CLAIM_REFERENCE',
  EXAGGERATION: 'EXAGGERATION',
  DUPLICATE_DRAFT: 'DUPLICATE_DRAFT',
  SENSITIVE_GUARANTEE: 'SENSITIVE_GUARANTEE',
  ANGLES_ARE_PARAPHRASES: 'ANGLES_ARE_PARAPHRASES'
});

/**
 * Korean first-hand experience wording.
 * `CLAUDE.md` §6 and AT-23: research wording is fine, claimed personal use is not,
 * unless a UsageRecord exists.
 */
const FIRST_HAND_PATTERNS = [
  /직접\s*(써|쓰|사용|먹|발라|끼워|설치)/,
  /써\s*봤/,
  /썼는데/,
  /사용해\s*봤/,
  /먹어\s*봤/,
  /재구매/,
  /몇\s*달\s*째\s*쓰/,
  /우리\s*집에서\s*쓰(고|는)/,
  /제가\s*쓰(고|는)/
];

/** Research-based wording that AT-23 explicitly endorses. */
export const RESEARCH_WORDING_HINTS = Object.freeze(['확인해보니', '찾아보니', '자료를 보니', '기록을 보니']);

export function detectFirstHandLanguage(text = '') {
  const matches = FIRST_HAND_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { found: matches.length > 0, patterns: matches };
}

/** Wording that asserts the linked destination is the same item. */
const SAME_PRODUCT_PATTERNS = [/같은\s*제품/, /해당\s*제품/, /바로\s*그\s*제품/, /동일\s*제품/, /그\s*제품\s*맞/];

/** Wording that correctly marks an alternative. */
const ALTERNATIVE_PATTERNS = [/비슷한\s*제품/, /대체\s*(품|후보)/, /유사\s*제품/, /같은\s*제품은\s*아니/];

/**
 * Disclaimers that *negate* a same-product claim.
 *
 * "같은 제품이 아니라 비슷한 제품임" is the correct way to label a substitute, so a
 * naive substring match would flag exactly the sentence we require. These are
 * removed before the assertion check runs.
 */
const SAME_PRODUCT_NEGATIONS = [
  /(같은|동일|해당)\s*제품(이|은|는|이라고)?\s*아니\S*/g,
  /(같은|동일)\s*제품으로\s*볼\s*수\s*없\S*/g,
  /(같은|동일)\s*제품인지는?\s*(아직\s*)?(확정|확인)하지\s*(않|못)\S*/g
];

export function stripSameProductNegations(text = '') {
  return SAME_PRODUCT_NEGATIONS.reduce((value, pattern) => value.replace(pattern, ' '), text);
}

export function detectSameProductClaim(text = '') {
  const asserted = stripSameProductNegations(text);
  return SAME_PRODUCT_PATTERNS.some((pattern) => pattern.test(asserted));
}

export function detectAlternativeLabel(text = '') {
  return ALTERNATIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/** Endorsement implication drawn from mere public appearance or use. */
const ENDORSEMENT_PATTERNS = [/추천했/, /추천한\s*제품/, /협찬/, /광고\s*모델/, /앰버서더/, /인정한\s*제품/, /극찬/];

export function detectEndorsementImplication(text = '') {
  const matches = ENDORSEMENT_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { found: matches.length > 0, patterns: matches };
}

/** Absolute or guarantee-style wording that evidence can rarely support. */
const EXAGGERATION_PATTERNS = [
  /무조건/, /100%/, /완벽하게\s*해결/, /누구나\s*만족/, /반드시\s*효과/, /최고의\s*제품/, /절대\s*실패/
];

export function detectExaggeration(text = '') {
  const matches = EXAGGERATION_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { found: matches.length > 0, patterns: matches };
}

/** Health, safety, and medical guarantees require evidence this system never has. */
const SENSITIVE_PATTERNS = [/치료(된|됩|해)/, /질병.*예방/, /부작용\s*없/, /의학적으로\s*검증/, /안전이\s*보장/];

export function detectSensitiveGuarantee(text = '') {
  const matches = SENSITIVE_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { found: matches.length > 0, patterns: matches };
}

/**
 * Character-bigram Dice coefficient.
 *
 * Word-boundary similarity does not work well for Korean, where particles attach to
 * stems. Character bigrams degrade gracefully and are good enough to catch the case
 * we actually care about: four "angles" that restate one argument.
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
  for (const [gram, count] of leftGrams) {
    shared += Math.min(count, rightGrams.get(gram) ?? 0);
  }
  const total = (left.length - 1) + (right.length - 1);
  return total === 0 ? 0 : (2 * shared) / total;
}

export const ANGLE_PARAPHRASE_THRESHOLD = 0.62;

/**
 * AT-06: four angles must differ in argument, not only in wording.
 *
 * Reader-job uniqueness is checked by the schema. This checks the thing a schema
 * cannot: whether the four arguments are actually the same sentence rearranged.
 */
export function findParaphrasedAngles(angles = [], threshold = ANGLE_PARAPHRASE_THRESHOLD) {
  const collisions = [];
  for (let i = 0; i < angles.length; i += 1) {
    for (let j = i + 1; j < angles.length; j += 1) {
      const left = `${angles[i]?.coreValue ?? ''} ${angles[i]?.hookLogic ?? ''}`;
      const right = `${angles[j]?.coreValue ?? ''} ${angles[j]?.hookLogic ?? ''}`;
      const similarity = textSimilarity(left, right);
      if (similarity >= threshold) {
        collisions.push({
          angleIds: [angles[i]?.angleId, angles[j]?.angleId],
          similarity: Number(similarity.toFixed(3))
        });
      }
    }
  }
  return collisions;
}

export const DRAFT_DUPLICATE_THRESHOLD = 0.78;

export function findDuplicateDrafts(drafts = [], threshold = DRAFT_DUPLICATE_THRESHOLD) {
  const collisions = [];
  for (let i = 0; i < drafts.length; i += 1) {
    for (let j = i + 1; j < drafts.length; j += 1) {
      const similarity = textSimilarity(
        `${drafts[i]?.hook ?? ''} ${drafts[i]?.body ?? ''}`,
        `${drafts[j]?.hook ?? ''} ${drafts[j]?.body ?? ''}`
      );
      if (similarity >= threshold) {
        collisions.push({
          draftIds: [drafts[i]?.draftId, drafts[j]?.draftId],
          similarity: Number(similarity.toFixed(3))
        });
      }
    }
  }
  return collisions;
}

export const AFFILIATE_DISCLOSURE_TEXT =
  '이 게시물은 제휴 활동의 일환으로 일정액의 수수료를 받을 수 있습니다.';

export function hasAffiliateDisclosure(text = '') {
  return /수수료/.test(text) && /(제휴|파트너스)/.test(text);
}
