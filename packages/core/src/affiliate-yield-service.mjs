// Deterministic dual-affiliate mapping, ROI estimation, and Coupang <= 10/hr rate-limit service.
// Kept strictly outside Evidence Verifier's factual `evidence_packet` (MASTER_SPEC.md, AT-47).

import { countIndependentOrigins } from './product-matching.mjs';

export const AFFILIATE_NETWORKS = Object.freeze({
  COUPANG_PARTNERS: 'coupang_partners',
  NAVER_SHOPPING_CONNECT: 'naver_shopping_connect'
});

export const DEFAULT_DISCLOSURE_BY_NETWORK = Object.freeze({
  [AFFILIATE_NETWORKS.COUPANG_PARTNERS]: '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.',
  [AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT]: '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.'
});

export const COUPANG_HOURLY_LIMITS = Object.freeze({
  search: 10,
  report: 50
});

const HOUR_MS = 60 * 60 * 1000;

export function validateCanonicalListingSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return { ok: false, error: 'canonical_listing_snapshot_missing' };
  }
  const requiredFields = ['brand', 'model', 'variant', 'seller', 'destinationUrl', 'capturedAt'];
  for (const key of requiredFields) {
    if (!String(snapshot[key] ?? '').trim()) {
      return { ok: false, error: `missing_snapshot_field:${key}` };
    }
  }
  try {
    const parsed = new URL(snapshot.destinationUrl);
    if (parsed.protocol !== 'https:') return { ok: false, error: 'destination_url_must_be_https' };
  } catch {
    return { ok: false, error: 'destination_url_invalid' };
  }
  if (Number.isNaN(Date.parse(snapshot.capturedAt))) {
    return { ok: false, error: 'captured_at_invalid_timestamp' };
  }
  return { ok: true };
}

/**
 * Validate and build a deterministic AffiliateMapping record (AFFILIATE_SPEC.md v1.2, AT-47).
 */
export function buildAffiliateMapping({
  candidateId,
  productState = 'unresolved',
  state = 'none',
  affiliateNetwork = null,
  acquisitionMode = null,
  destinationUrl = null,
  canonicalListingSnapshot = null,
  sources = [],
  disclosurePolicyVersion = 'kr-kftc-2026-v1',
  requiredDisclosureText = null,
  lockedNonCommercialAfterPublish = false,
  verifiedAt = new Date().toISOString()
} = {}) {
  if (!candidateId) throw new Error('candidateId is required for AffiliateMapping.');

  if (state === 'none') {
    return Object.freeze({
      candidateId,
      state: 'none',
      affiliateNetwork: null,
      acquisitionMode: null,
      destinationUrl: null,
      canonicalListingSnapshot: null,
      verificationTimestamp: verifiedAt,
      evidenceRefs: [],
      disclosurePolicyVersion: null,
      requiredDisclosureText: null
    });
  }

  if (lockedNonCommercialAfterPublish) {
    return { ok: false, code: 'post_publish_monetization_locked', message: '무고지로 게시된 쇼케이스 카드는 사후 수익화가 영구 차단됩니다.' };
  }

  if (!['exact', 'alternative'].includes(state)) {
    return { ok: false, code: 'invalid_mapping_state', message: `Unsupported mapping state: ${state}` };
  }
  if (state === 'exact' && productState !== 'exact') {
    return { ok: false, code: 'exact_mapping_requires_exact_product', message: 'product_state가 exact일 때만 exact 제휴 매핑이 허용됩니다.' };
  }
  if (state === 'alternative' && !['exact', 'substitute'].includes(productState)) {
    return { ok: false, code: 'alternative_mapping_requires_verified_or_substitute', message: 'likely 또는 unresolved 후보는 쇼케이스 제휴 매핑을 연결할 수 없습니다.' };
  }
  if (!Object.values(AFFILIATE_NETWORKS).includes(affiliateNetwork)) {
    return { ok: false, code: 'unsupported_affiliate_network', message: '지원하지 않는 제휴 네트워크입니다.' };
  }
  if (!['manual_owner_link', 'approved_official_api'].includes(acquisitionMode)) {
    return { ok: false, code: 'invalid_acquisition_mode', message: '비공식 스크래핑/CUA 수집 모드는 허용되지 않습니다.' };
  }
  if (affiliateNetwork === AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT && acquisitionMode !== 'manual_owner_link') {
    return { ok: false, code: 'naver_requires_manual_owner_link', message: '네이버 쇼핑커넥트는 공식 외부 Open API가 없으므로 수동 발급 링크만 허용됩니다.' };
  }

  const snapCheck = validateCanonicalListingSnapshot(canonicalListingSnapshot);
  if (!snapCheck.ok) {
    return { ok: false, code: snapCheck.error, message: '정식 상품 스냅샷(브랜드·모델·옵션·판매자·URL·시각)이 필요합니다.' };
  }
  if (state === 'exact' && countIndependentOrigins(sources) < 2) {
    return { ok: false, code: 'corroboration_required_for_exact', message: '동일 제품(exact) 제휴 연결에는 독립된 두 출처의 교차 근거가 필요합니다(AT-40).' };
  }

  const disclosure = String(requiredDisclosureText || DEFAULT_DISCLOSURE_BY_NETWORK[affiliateNetwork] || '').trim();
  if (!disclosure) {
    return { ok: false, code: 'disclosure_required', message: '법정 대가성 고지 원문이 필요합니다.' };
  }

  return {
    ok: true,
    mapping: Object.freeze({
      candidateId,
      state,
      affiliateNetwork,
      acquisitionMode,
      destinationUrl: String(destinationUrl || canonicalListingSnapshot.destinationUrl).trim(),
      canonicalListingSnapshot: Object.freeze({ ...canonicalListingSnapshot }),
      verificationTimestamp: verifiedAt,
      evidenceRefs: Object.freeze(sources.map((item) => item.id).filter(Boolean)),
      disclosurePolicyVersion,
      requiredDisclosureText: disclosure
    })
  };
}

/**
 * Deterministic net contribution / ROI calculator (kept outside Verifier evidence).
 */
export function estimateNetYieldKrw({
  priceKrw = 0,
  commissionRate = 0.03,
  expectedConversions = 1,
  returnRate = 0.08,
  runTokenCostKrw = 25
} = {}) {
  const grossCommissionKrw = Math.max(0, Number(priceKrw)) * Math.max(0, Number(commissionRate)) * Math.max(0, Number(expectedConversions));
  const netSettledCommissionKrw = Math.round(grossCommissionKrw * (1 - Math.min(1, Math.max(0, Number(returnRate)))));
  const netContributionKrw = netSettledCommissionKrw - Math.round(Math.max(0, Number(runTokenCostKrw)));
  return Object.freeze({
    grossCommissionKrw: Math.round(grossCommissionKrw),
    netSettledCommissionKrw,
    runTokenCostKrw: Math.round(Math.max(0, Number(runTokenCostKrw))),
    netContributionKrw,
    positiveContribution: netContributionKrw > 0
  });
}

/**
 * Rolling 60-minute rate limiter for approved Coupang Partners Open API (<= 10 search/hr, <= 50 report/hr).
 * Never falls back to scraping on exhaustion (CLAUDE.md §12, AT-47).
 */
export class CoupangRateLimiter {
  constructor({ clock = () => Date.now() } = {}) {
    this.clock = clock;
    this.calls = { search: [], report: [] };
  }

  attempt(endpointKind = 'search') {
    const limit = COUPANG_HOURLY_LIMITS[endpointKind];
    if (!limit) throw new Error(`Unknown Coupang endpoint kind: ${endpointKind}`);
    const now = this.clock();
    const windowStart = now - HOUR_MS;
    const recent = this.calls[endpointKind].filter((ts) => ts > windowStart);
    this.calls[endpointKind] = recent;

    if (recent.length >= limit) {
      return Object.freeze({
        allowed: false,
        status: 'rate_limited_fail_closed',
        endpointKind,
        limitPerHour: limit,
        usedInWindow: recent.length,
        retryAfterMs: recent[0] + HOUR_MS - now,
        receipt: Object.freeze({
          service: 'affiliate_yield_service',
          endpointKind,
          outcome: 'blocked_rate_limit',
          scrapingFallbackUsed: false,
          at: new Date(now).toISOString()
        })
      });
    }

    recent.push(now);
    return Object.freeze({
      allowed: true,
      status: 'allowed',
      endpointKind,
      limitPerHour: limit,
      usedInWindow: recent.length,
      receipt: Object.freeze({
        service: 'affiliate_yield_service',
        endpointKind,
        outcome: 'allowed',
        scrapingFallbackUsed: false,
        at: new Date(now).toISOString()
      })
    });
  }
}
