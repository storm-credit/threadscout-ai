export const LIVE_SOURCE_IDS = Object.freeze({
  THREADS_KEYWORD_SEARCH: 'threads_keyword_search',
  NAVER_API_HUB_TRENDS: 'naver_api_hub_trends',
  GOOGLE_TRENDS_ALPHA: 'google_trends_alpha',
  COUPANG_SELLER_OPEN_API: 'coupang_seller_open_api',
  MANUAL_USER_EVIDENCE: 'manual_user_evidence'
});

const reviewedAt = '2026-08-08';

export const LIVE_SOURCE_REGISTRY = Object.freeze([
  Object.freeze({
    id: LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH,
    name: 'Meta Threads Keyword Search',
    disposition: 'selected_primary_discovery',
    enabled: false,
    networkEnabled: false,
    mutationAllowed: false,
    ownerAgents: ['scout'],
    purpose: ['discover_public_product_discussion', 'estimate_purchase_intent', 'measure_recent_topic_activity'],
    baseUrl: 'https://graph.threads.net',
    endpoint: '/keyword_search',
    method: 'GET',
    supportedModes: ['KEYWORD', 'TAG'],
    supportedSorts: ['TOP', 'RECENT'],
    requiredEnvironment: ['THREADS_APP_ID', 'THREADS_ACCESS_TOKEN'],
    requiredPermissions: ['threads_basic', 'threads_keyword_search'],
    readinessRequirements: ['meta_app_created', 'oauth_completed', 'permission_available_for_app', 'data_use_reviewed'],
    activationRequiresHumanApproval: true,
    officialReferences: [
      'https://developers.facebook.com/docs/threads/keyword-search/',
      'https://www.postman.com/meta/threads/request/34203612-b3b2c12a-7ce6-4d86-a3c6-6d31e3b66ea1'
    ],
    reviewedAt,
    notes: [
      'Use public post text and timestamps only through the official API contract.',
      'Do not treat likes or rank alone as purchase intent.',
      'Do not store usernames or profile images unless a later privacy decision explicitly allows them.'
    ]
  }),
  Object.freeze({
    id: LIVE_SOURCE_IDS.NAVER_API_HUB_TRENDS,
    name: 'NAVER API HUB Search Trend and Shopping Insight',
    disposition: 'selected_secondary_trend_signal',
    enabled: false,
    networkEnabled: false,
    mutationAllowed: false,
    ownerAgents: ['scout'],
    purpose: ['compare_keyword_interest_in_korea', 'compare_shopping_click_trends'],
    baseUrl: 'https://naverapihub.apigw.ntruss.com',
    endpoints: ['/search-trend/v1/search', '/shopping/v1/category/keyword/device'],
    method: 'POST',
    requiredEnvironment: ['NAVER_API_HUB_CLIENT_ID', 'NAVER_API_HUB_CLIENT_SECRET'],
    readinessRequirements: ['ncp_account_created', 'api_hub_application_registered', 'quota_and_cost_reviewed'],
    activationRequiresHumanApproval: true,
    officialReferences: [
      'https://api.ncloud-docs.com/docs/naver-api-hub-overview',
      'https://api.ncloud-docs.com/docs/naver-api-hub-search-trend',
      'https://api.ncloud-docs.com/docs/naver-api-hub-shopping-insight-keyword-device',
      'https://developers.naver.com/notice/article/32530'
    ],
    reviewedAt,
    notes: [
      'Trend ratios are relative signals, not absolute search counts.',
      'The current integration target is NAVER API HUB rather than the legacy developer-center endpoint.',
      'Use as corroborating trend evidence, not exact-product identity evidence.'
    ]
  }),
  Object.freeze({
    id: LIVE_SOURCE_IDS.GOOGLE_TRENDS_ALPHA,
    name: 'Google Trends API Alpha',
    disposition: 'deferred_limited_access',
    enabled: false,
    networkEnabled: false,
    mutationAllowed: false,
    ownerAgents: ['scout'],
    purpose: ['global_or_regional_search_interest_comparison'],
    requiredEnvironment: [],
    readinessRequirements: ['accepted_into_alpha_program', 'alpha_terms_reviewed', 'quota_reviewed'],
    activationRequiresHumanApproval: true,
    officialReferences: ['https://developers.google.com/search/apis/trends'],
    reviewedAt,
    notes: [
      'The official API remains an alpha with limited tester access.',
      'Do not build production dependency on access that has not been granted.'
    ]
  }),
  Object.freeze({
    id: LIVE_SOURCE_IDS.COUPANG_SELLER_OPEN_API,
    name: 'Coupang Seller Open API',
    disposition: 'rejected_for_affiliate_discovery',
    enabled: false,
    networkEnabled: false,
    mutationAllowed: false,
    ownerAgents: [],
    purpose: ['seller_product_and_order_management'],
    requiredEnvironment: ['COUPANG_WING_ACCESS_KEY', 'COUPANG_WING_SECRET_KEY'],
    readinessRequirements: ['wing_seller_account', 'api_key', 'ip_allowlist', 'hmac_signing'],
    activationRequiresHumanApproval: true,
    officialReferences: [
      'https://developers.coupang.com/ko',
      'https://developers.coupang.com/ko/getting-started'
    ],
    reviewedAt,
    notes: [
      'This API is designed for sellers and integrators managing their own catalogue and operations.',
      'It is not accepted as a general affiliate-product discovery source for this project.'
    ]
  }),
  Object.freeze({
    id: LIVE_SOURCE_IDS.MANUAL_USER_EVIDENCE,
    name: 'Manual User-Supplied Evidence',
    disposition: 'selected_fallback',
    enabled: true,
    networkEnabled: false,
    mutationAllowed: false,
    ownerAgents: ['orchestrator', 'verifier'],
    purpose: ['accept_user_supplied_product_and_source_references'],
    requiredEnvironment: [],
    readinessRequirements: ['user_supplies_reference', 'verifier_still_checks_identity_and_rights'],
    activationRequiresHumanApproval: false,
    officialReferences: [],
    reviewedAt,
    notes: [
      'A user-supplied URL is evidence input, not proof that claims or media rights are valid.',
      'Verifier and Guardian gates remain mandatory.'
    ]
  })
]);

export function getLiveSource(sourceId) {
  return LIVE_SOURCE_REGISTRY.find((source) => source.id === sourceId) ?? null;
}

export function validateLiveSourceRegistry(registry = LIVE_SOURCE_REGISTRY) {
  const errors = [];
  const ids = registry.map((source) => source.id);
  if (new Set(ids).size !== ids.length) errors.push('Live source IDs must be unique.');

  for (const source of registry) {
    if (!source.id || !source.name || !source.disposition) errors.push('Every source requires id, name, and disposition.');
    if (source.mutationAllowed !== false) errors.push(`${source.id} must remain read-only.`);
    if (source.networkEnabled === true || (source.enabled && source.id !== LIVE_SOURCE_IDS.MANUAL_USER_EVIDENCE)) {
      errors.push(`${source.id} cannot be live-enabled in Phase 2F.`);
    }
    if (source.activationRequiresHumanApproval !== false && source.activationRequiresHumanApproval !== true) {
      errors.push(`${source.id} must declare its human-approval requirement.`);
    }
    if (!Array.isArray(source.officialReferences) || !Array.isArray(source.readinessRequirements)) {
      errors.push(`${source.id} references and readiness requirements must be arrays.`);
    }
  }

  const threads = registry.find((source) => source.id === LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH);
  if (!threads?.requiredPermissions.includes('threads_keyword_search')) {
    errors.push('Threads source must require threads_keyword_search.');
  }

  const coupang = registry.find((source) => source.id === LIVE_SOURCE_IDS.COUPANG_SELLER_OPEN_API);
  if (coupang?.disposition !== 'rejected_for_affiliate_discovery') {
    errors.push('Coupang seller API must not be selected for affiliate discovery.');
  }

  return { ok: errors.length === 0, errors };
}
