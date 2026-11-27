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

const COUPANG_RAW_STOREFRONT_HOSTS = new Set(['coupang.com', 'www.coupang.com', 'm.coupang.com']);
const NAVER_RAW_STOREFRONT_HOSTS = new Set([
  'smartstore.naver.com',
  'm.smartstore.naver.com',
  'brand.naver.com',
  'm.brand.naver.com',
  'shopping.naver.com',
  'mshopping.naver.com'
]);
const NAVER_TRACKING_PARAM_KEYS = ['nt_source', 'nt_medium', 'affiliate', 'aff', 'connect', 'tracker', 'bc_code'];
const GENERIC_SHORTENER_HOSTS = new Set(['naver.me', 'bit.ly', 'tinyurl.com', 'han.gl', 'me2.do', 'vo.la', 'buly.kr']);

/**
 * Pure URL grammar classifier for affiliate destinations (zero HTTP/redirect network fetching per CLAUDE.md §12).
 * Blocks known uncompensated raw storefront product URLs and flags generic shorteners (`naver.me`, `bit.ly`, etc.) with a confirmation warning.
 */
export function classifyAffiliateDestinationUrl(rawUrl, affiliateNetwork = '') {
  let parsed;
  try {
    parsed = new URL(String(rawUrl ?? '').trim());
  } catch {
    return { ok: false, code: 'destination_url_invalid', message: '유효한 https:// 도착 URL이 아닙니다.' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, code: 'destination_url_must_be_https', message: '제휴 도착 URL은 https:// 프로토콜이어야 합니다.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, code: 'destination_url_credentials_forbidden', message: '제휴 도착 URL에 사용자 인증 정보(user:pass@)를 포함할 수 없습니다.' };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.+$/, '');
  const isCoupangDomain = host === 'coupa.ng' || host === 'coupang.com' || host.endsWith('.coupang.com');
  const isNaverDomain = host === 'naver.me' || host === 'naver.com' || host.endsWith('.naver.com');

  if (affiliateNetwork === AFFILIATE_NETWORKS.COUPANG_PARTNERS && isNaverDomain) {
    return {
      ok: false,
      code: 'affiliate_network_domain_mismatch',
      message: '쿠팡 파트너스가 선택되었으나 네이버 도메인 URL이 입력되었습니다.'
    };
  }
  if (affiliateNetwork === AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT && isCoupangDomain) {
    return {
      ok: false,
      code: 'affiliate_network_domain_mismatch',
      message: '네이버 쇼핑커넥트가 선택되었으나 쿠팡 도메인 URL이 입력되었습니다.'
    };
  }

  if (COUPANG_RAW_STOREFRONT_HOSTS.has(host) && !String(parsed.searchParams.get('lptag') ?? '').trim()) {
    return {
      ok: false,
      code: 'raw_storefront_url_not_affiliate',
      message: '쿠팡 일반 상품 페이지 주소는 수수료가 0원으로 집계됩니다. 쿠팡 파트너스 발급 추적 링크(link.coupang.com 또는 coupa.ng)를 입력하세요.'
    };
  }

  if (NAVER_RAW_STOREFRONT_HOSTS.has(host)) {
    const hasTrackingParam = NAVER_TRACKING_PARAM_KEYS.some((key) => Boolean(String(parsed.searchParams.get(key) ?? '').trim()));
    if (!hasTrackingParam) {
      return {
        ok: false,
        code: 'raw_storefront_url_not_affiliate',
        message: '네이버 일반 스마트스토어·브랜드스토어 상품 페이지 주소(유입용 NaPm 포함)는 수수료가 0원으로 집계됩니다. 쇼핑커넥트/브랜드커넥트 콘솔에서 발급한 전용 추적 링크를 입력하세요.'
      };
    }
  }

  if (GENERIC_SHORTENER_HOSTS.has(host)) {
    return {
      ok: true,
      normalizedUrl: parsed.toString(),
      warningKo: `${host} 공용 단축링크입니다. 일반 스토어 주소 단축이 아닌 파트너스·쇼핑커넥트 콘솔에서 발급한 전용 링크인지 반드시 확인하세요(일반 단축 시 수수료 0원).`
    };
  }

  return { ok: true, normalizedUrl: parsed.toString(), warningKo: null };
}

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
    const noneMapping = Object.freeze({
      candidateId,
      state: 'none',
      affiliateNetwork: null,
      acquisitionMode: null,
      destinationUrl: null,
      canonicalListingSnapshot: null,
      verificationTimestamp: verifiedAt,
      evidenceRefs: Object.freeze([]),
      disclosurePolicyVersion: null,
      requiredDisclosureText: null
    });
    return Object.freeze({
      ok: true,
      warningKo: null,
      mapping: noneMapping,
      ...noneMapping
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
  const finalDestUrl = String(destinationUrl || canonicalListingSnapshot.destinationUrl).trim();
  const urlClassification = classifyAffiliateDestinationUrl(finalDestUrl, affiliateNetwork);
  if (!urlClassification.ok) {
    return { ok: false, code: urlClassification.code, message: urlClassification.message };
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
    warningKo: urlClassification.warningKo ?? null,
    mapping: Object.freeze({
      candidateId,
      state,
      affiliateNetwork,
      acquisitionMode,
      destinationUrl: finalDestUrl,
      canonicalListingSnapshot: Object.freeze({ ...canonicalListingSnapshot }),
      verificationTimestamp: verifiedAt,
      evidenceRefs: Object.freeze(sources.map((item) => item.id).filter(Boolean)),
      disclosurePolicyVersion,
      requiredDisclosureText: disclosure,
      warningKo: urlClassification.warningKo ?? null
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
