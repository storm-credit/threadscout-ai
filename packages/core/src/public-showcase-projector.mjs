// Closed default-deny 9-field PublicShowcaseCard projector & deterministic markdown exporter
// (PLATFORM_DECISION.md, AFFILIATE_SPEC.md v1.2, BS-60, BS-61, AT-46).

import {
  evaluateIssueProductDecision,
  resolveMediaPublicationFallback
} from './issue-media-governance.mjs';
import { classifyAffiliateDestinationUrl } from './affiliate-yield-service.mjs';

export const SHOWCASE_STANDARD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days rolling
export const SHOWCASE_ISSUE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours for fast issue-linked cards

/**
 * Proportional expiring-soon window (`PLATFORM_DECISION.md`):
 * `0 < remainingMs <= Math.min(24h, ttlMs * 0.25)` (`<= 24h` for `7d` cards; `<= 3h` for `12h` issue cards).
 */
export function evaluateShowcaseCardExpiry(candidate, { now = new Date().toISOString() } = {}) {
  if (!candidate || candidate.cardNumber == null || candidate.workflowState !== 'approved' || candidate.review?.stale === true) {
    return null;
  }
  const verifiedAt = candidate.evidencePacket?.observedAt ?? candidate.verifiedAt ?? candidate.updatedAt;
  const verifiedMs = Date.parse(verifiedAt ?? '');
  const nowMs = Date.parse(now);
  if (!Number.isFinite(verifiedMs) || !Number.isFinite(nowMs)) return null;

  const issueDecision = evaluateIssueProductDecision({
    issueSourceGrade: candidate.issueSourceGrade ?? 'none',
    productRelationGrade: candidate.productRelationGrade ?? 'none',
    matchState: candidate.exactMatchStatus ?? candidate.productState ?? 'unresolved',
    personIdentifiedFromImageOnly: candidate.personIdentifiedFromImageOnly === true
  });
  const isIssueLinked = Boolean(candidate.issueLinked || issueDecision.issueLinked);
  const ttlMs = isIssueLinked ? SHOWCASE_ISSUE_TTL_MS : SHOWCASE_STANDARD_TTL_MS;
  const expiresAtMs = verifiedMs + ttlMs;
  const remainingMs = expiresAtMs - nowMs;
  const warningWindowMs = Math.min(24 * 60 * 60 * 1000, Math.floor(ttlMs * 0.25));

  return Object.freeze({
    verifiedAt: new Date(verifiedMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    ttlMs,
    warningWindowMs,
    remainingMs,
    expired: remainingMs <= 0,
    expiringSoon: remainingMs > 0 && remainingMs <= warningWindowMs
  });
}

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
  if (
    candidate.review?.boundMaterialRevision
    && candidate.materialRevision
    && candidate.review.boundMaterialRevision !== candidate.materialRevision
  ) {
    return { projected: false, reason: 'material_revision_mismatch' };
  }
  if (
    candidate.guardian?.boundMaterialRevision
    && candidate.review?.boundMaterialRevision
    && candidate.guardian.boundMaterialRevision !== candidate.review.boundMaterialRevision
  ) {
    return { projected: false, reason: 'guardian_revision_mismatch' };
  }
  if (candidate.suppression?.active === true) {
    return { projected: false, reason: 'owner_suppressed' };
  }

  const productState = candidate.exactMatchStatus ?? candidate.productState ?? 'unresolved';
  const issueDecision = evaluateIssueProductDecision({
    issueSourceGrade: candidate.issueSourceGrade ?? 'none',
    productRelationGrade: candidate.productRelationGrade ?? 'none',
    matchState: productState,
    personIdentifiedFromImageOnly: candidate.personIdentifiedFromImageOnly === true
  });
  if (issueDecision.issueLinked && ['block', 'verify_more'].includes(issueDecision.routeOutcome)) {
    return { projected: false, reason: 'issue_or_relation_blocked' };
  }

  const mediaResolution = resolveMediaPublicationFallback({
    discoveryMediaState: candidate.discoveryMediaState ?? 'none',
    publicationMediaRights: candidate.publicationMediaState ?? candidate.mediaRights ?? 'unknown',
    publishableMediaUrl: candidate.publishableMediaUrl ?? '',
    aiGeneratedDepictsRealPerson: Boolean(candidate.aiGeneratedDepictsRealPerson),
    syntheticDeceptiveBeforeAfter: Boolean(candidate.syntheticDeceptiveBeforeAfter)
  });
  if (!mediaResolution.publishable) {
    return { projected: false, reason: 'media_rights_not_publishable' };
  }
  if (String(candidate.publishableMediaUrl ?? '').trim() && !mediaResolution.reuploadAllowed) {
    return { projected: false, reason: 'unpermitted_media_reupload' };
  }
  const affiliateState = candidate.affiliateMapping?.state
    ?? (candidate.affiliate
      ? ((productState === 'substitute' || issueDecision.allowedWordingCeiling === 'alternative_only') ? 'alternative' : 'exact')
      : 'none');

  if (issueDecision.issueLinked) {
    if (affiliateState !== 'none' && !issueDecision.exactAffiliateAllowed && !issueDecision.alternativeAffiliateAllowed) {
      return { projected: false, reason: 'issue_affiliate_forbidden' };
    }
    if (affiliateState === 'exact' && !issueDecision.exactAffiliateAllowed) {
      return { projected: false, reason: 'issue_exact_affiliate_forbidden' };
    }
  }

  if (candidate.lockedNonCommercialAfterPublish && affiliateState !== 'none') {
    return { projected: false, reason: 'post_publish_monetization_locked' };
  }

  const badgeResolution = resolveShowcaseMatchBadge(productState, affiliateState);
  if (!badgeResolution.projectable) {
    return { projected: false, reason: badgeResolution.reason };
  }
  const effectiveMatchBadge = issueDecision.allowedWordingCeiling === 'alternative_only'
    ? 'alternative'
    : badgeResolution.matchBadge;

  const verifiedAt = candidate.evidencePacket?.observedAt ?? candidate.verifiedAt ?? candidate.updatedAt;
  const verifiedMs = Date.parse(verifiedAt ?? '');
  const nowMs = Date.parse(now);
  if (!Number.isFinite(verifiedMs) || !Number.isFinite(nowMs)) {
    return { projected: false, reason: 'invalid_verification_timestamp' };
  }

  const isIssueLinked = Boolean(candidate.issueLinked || issueDecision.issueLinked);
  const ttlMs = isIssueLinked ? SHOWCASE_ISSUE_TTL_MS : SHOWCASE_STANDARD_TTL_MS;
  if (nowMs - verifiedMs >= ttlMs) {
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
  const packetHasPros = candidate.evidencePacket && typeof candidate.evidencePacket === 'object' && 'verifiedPros' in candidate.evidencePacket;
  const packetHasLimitation = candidate.evidencePacket && typeof candidate.evidencePacket === 'object' && 'verifiedLimitation' in candidate.evidencePacket;
  const sourcePros = packetHasPros ? candidate.evidencePacket.verifiedPros : candidate.verifiedPros;
  const sourceLimitation = packetHasLimitation ? candidate.evidencePacket.verifiedLimitation : candidate.verifiedLimitation;

  // Strictly project `verifiedPros` and `verifiedLimitation` bound into `evidencePacket`/`materialRevision`
  // (never falling back to unbound `whyNow`, `readerValue`, or internal Strategist `angles[*].limitation`, `BS-37`/`BS-61`).
  const prosInput = Array.isArray(sourcePros)
    ? sourcePros.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 3)
    : [];
  const limitationInput = String(sourceLimitation ?? '').trim();

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
    const rawNet = String(candidate.affiliateMapping?.affiliateNetwork ?? candidate.affiliateNetwork ?? '').trim();
    if (!rawDest || !rawDisc) {
      return { projected: false, reason: 'monetized_card_missing_url_or_disclosure' };
    }
    const urlCheck = classifyAffiliateDestinationUrl(rawDest, rawNet);
    if (!urlCheck.ok) {
      return { projected: false, reason: urlCheck.code };
    }
    verifiedDestinationUrl = urlCheck.normalizedUrl;
    disclosureText = rawDisc;
  }

  let publishableMediaUrl = null;
  if (mediaResolution.reuploadAllowed && mediaResolution.effectiveUploadUrl) {
    publishableMediaUrl = mediaResolution.effectiveUploadUrl;
  }

  const card = Object.freeze({
    cardNumber,
    canonicalProductName,
    matchBadge: effectiveMatchBadge,
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
