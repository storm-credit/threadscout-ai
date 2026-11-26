// Closed default-deny 9-field PublicShowcaseCard projector & deterministic markdown exporter
// (PLATFORM_DECISION.md, AFFILIATE_SPEC.md v1.2, BS-60, BS-61, AT-46).

export const SHOWCASE_STANDARD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days rolling
export const SHOWCASE_ISSUE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours for fast issue-linked cards

export const PUBLIC_SHOWCASE_ALLOWED_KEYS = Object.freeze([
  'cardNumber',
  'canonicalProductName',
  'matchBadge',
  'verifiedPros',
  'verifiedLimitation',
  'disclosureText',
  'verifiedDestinationUrl',
  'publishableMediaUrl',
  'verifiedAt'
]);

const PII_PATTERNS = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/,
  /(?:^|\s)@[A-Za-z0-9_.]{3,30}\b/
];

/**
 * Deterministic `(product_state, AffiliateMapping.state) -> { projectable, matchBadge }` table.
 */
export function resolveShowcaseMatchBadge(productState, affiliateState = 'none') {
  if (productState === 'exact') {
    if (affiliateState === 'exact' || affiliateState === 'none') return { projectable: true, matchBadge: 'exact' };
    if (affiliateState === 'alternative') return { projectable: true, matchBadge: 'alternative' };
    return { projectable: false, reason: 'invalid_affiliate_state' };
  }
  if (productState === 'substitute') {
    if (affiliateState === 'alternative' || affiliateState === 'none') return { projectable: true, matchBadge: 'alternative' };
    return { projectable: false, reason: 'substitute_cannot_bind_exact_affiliate' };
  }
  return { projectable: false, reason: 'product_state_not_projectable' };
}

export function formatCardNumber(num) {
  const n = Number(num);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Invalid showcase card number: ${num}`);
  return `#${String(n).padStart(3, '0')}`;
}

function hasVerbatimRawExcerptOverlap(summaryText, rawExcerpts = [], canonicalProductName = '') {
  let masked = String(summaryText ?? '');
  if (canonicalProductName) {
    masked = masked.split(canonicalProductName).join(' ');
  }
  const normalizedSummary = masked.replace(/\s+/g, ' ').trim();
  if (normalizedSummary.length < 12) return false;

  for (const raw of rawExcerpts) {
    const excerpt = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (excerpt.length < 12) continue;
    for (let i = 0; i <= excerpt.length - 12; i += 1) {
      const slice = excerpt.slice(i, i + 12);
      if (slice.trim().length >= 12 && normalizedSummary.includes(slice)) {
        return true;
      }
    }
  }
  return false;
}

function containsPii(text = '') {
  return PII_PATTERNS.some((pattern) => pattern.test(String(text ?? '')));
}

/**
 * Project a candidate into a closed 9-field PublicShowcaseCard, or return `{ projected: false, reason }`
 * withdrawing the entire card on unapproved, stale, likely/unresolved, TTL-expired, or leaky inputs.
 */
export function projectPublicShowcaseCard(candidate, { now = new Date().toISOString() } = {}) {
  if (!candidate || typeof candidate !== 'object') {
    return { projected: false, reason: 'missing_candidate' };
  }
  if (candidate.workflowState === 'stale' || candidate.review?.stale === true) {
    return { projected: false, reason: 'withdrawn_stale' };
  }
  if (candidate.workflowState !== 'approved' || candidate.review?.decision !== 'approved') {
    return { projected: false, reason: 'not_approved' };
  }
  if (candidate.guardian?.decision !== 'pass') {
    return { projected: false, reason: 'guardian_not_passed' };
  }
  if (candidate.suppression?.active === true) {
    return { projected: false, reason: 'owner_suppressed' };
  }

  const productState = candidate.exactMatchStatus ?? candidate.productState ?? 'unresolved';
  const affiliateState = candidate.affiliateMapping?.state
    ?? (candidate.affiliate ? (productState === 'substitute' ? 'alternative' : 'exact') : 'none');

  if (candidate.lockedNonCommercialAfterPublish && affiliateState !== 'none') {
    return { projected: false, reason: 'post_publish_monetization_locked' };
  }

  const badgeResolution = resolveShowcaseMatchBadge(productState, affiliateState);
  if (!badgeResolution.projectable) {
    return { projected: false, reason: badgeResolution.reason };
  }

  const verifiedAt = candidate.evidencePacket?.observedAt ?? candidate.verifiedAt ?? candidate.updatedAt;
  const verifiedMs = Date.parse(verifiedAt ?? '');
  const nowMs = Date.parse(now);
  if (!Number.isFinite(verifiedMs) || !Number.isFinite(nowMs)) {
    return { projected: false, reason: 'invalid_verification_timestamp' };
  }

  const ttlMs = candidate.issueLinked ? SHOWCASE_ISSUE_TTL_MS : SHOWCASE_STANDARD_TTL_MS;
  if (affiliateState !== 'none' && nowMs - verifiedMs > ttlMs) {
    return { projected: false, reason: 'withdrawn_ttl_expired' };
  }

  const cardNumber = formatCardNumber(candidate.cardNumber ?? 1);
  const canonicalProductName = [candidate.brand, candidate.model, candidate.variant]
    .filter(Boolean)
    .join(' ')
    .trim() || String(candidate.name ?? '').trim();

  if (!canonicalProductName) {
    return { projected: false, reason: 'missing_canonical_name' };
  }

  const rawExcerpts = candidate.rawSourceExcerpts ?? [];
  const prosInput = Array.isArray(candidate.verifiedPros) && candidate.verifiedPros.length > 0
    ? candidate.verifiedPros.slice(0, 3)
    : [candidate.readerValue, candidate.whyNow].filter(Boolean).slice(0, 2);
  const limitationInput = String(
    candidate.verifiedLimitation
    || candidate.strategies?.angles?.[3]?.limitation
    || '구매 전 본인 설치·사용 환경과 상세 치수를 반드시 확인하세요.'
  ).trim();

  if (prosInput.length === 0 || !limitationInput) {
    return { projected: false, reason: 'missing_pros_or_limitation' };
  }

  for (const text of [...prosInput, limitationInput, canonicalProductName]) {
    if (containsPii(text)) return { projected: false, reason: 'pii_detected_blocked' };
    if (hasVerbatimRawExcerptOverlap(text, rawExcerpts, canonicalProductName)) {
      return { projected: false, reason: 'raw_excerpt_leak_blocked' };
    }
  }

  let verifiedDestinationUrl = null;
  let disclosureText = null;
  if (affiliateState !== 'none') {
    const rawDest = String(candidate.affiliateMapping?.destinationUrl ?? candidate.destinationUrl ?? '').trim();
    const rawDisc = String(candidate.affiliateMapping?.requiredDisclosureText ?? candidate.disclosure ?? '').trim();
    if (!rawDest || !rawDisc) {
      return { projected: false, reason: 'monetized_card_missing_url_or_disclosure' };
    }
    try {
      const parsed = new URL(rawDest);
      if (parsed.protocol !== 'https:') return { projected: false, reason: 'destination_url_not_https' };
      verifiedDestinationUrl = parsed.toString();
    } catch {
      return { projected: false, reason: 'destination_url_invalid' };
    }
    disclosureText = rawDisc;
  }

  let publishableMediaUrl = null;
  const mediaRights = candidate.publicationMediaState ?? candidate.mediaRights;
  if ((mediaRights === 'owned' || mediaRights === 'user_owned' || mediaRights === 'licensed' || mediaRights === 'licensed_commercial') && candidate.publishableMediaUrl) {
    try {
      const parsedMedia = new URL(candidate.publishableMediaUrl);
      if (parsedMedia.protocol === 'https:') publishableMediaUrl = parsedMedia.toString();
    } catch {
      publishableMediaUrl = null;
    }
  }

  const card = Object.freeze({
    cardNumber,
    canonicalProductName,
    matchBadge: badgeResolution.matchBadge,
    verifiedPros: Object.freeze(prosInput.map((item) => String(item).trim())),
    verifiedLimitation: limitationInput,
    disclosureText,
    verifiedDestinationUrl,
    publishableMediaUrl,
    verifiedAt: new Date(verifiedMs).toISOString()
  });

  return { projected: true, card };
}

export function exportDeterministicMarkdownCard(card) {
  const lines = [];
  if (card.disclosureText) lines.push(`> ${card.disclosureText}`, '');
  lines.push(`### ${card.cardNumber} ${card.canonicalProductName}`);
  lines.push(`- 검증 구분: ${card.matchBadge === 'exact' ? '동일 모델 확인' : '검증 대체품'} (검증일 ${card.verifiedAt.slice(0, 10)})`);
  for (const pro of card.verifiedPros) lines.push(`- 장점: ${pro}`);
  lines.push(`- 사기 전 확인할 단점: ${card.verifiedLimitation}`);
  if (card.verifiedDestinationUrl) lines.push(`- 공식 확인 링크: ${card.verifiedDestinationUrl}`);
  return lines.join('\n');
}
