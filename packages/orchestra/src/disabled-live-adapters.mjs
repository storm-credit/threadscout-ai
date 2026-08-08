import { LIVE_SOURCE_IDS, getLiveSource } from './live-source-registry.mjs';

function encodedQuery(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  return query.toString();
}

export function buildThreadsKeywordSearchRequest({
  query,
  searchType = 'RECENT',
  searchMode = 'KEYWORD',
  limit = 20,
  since,
  until
}) {
  const source = getLiveSource(LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH);
  if (!query?.trim()) throw new Error('Threads search query is required.');
  if (!source.supportedSorts.includes(searchType)) throw new Error('Unsupported Threads searchType.');
  if (!source.supportedModes.includes(searchMode)) throw new Error('Unsupported Threads searchMode.');
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 1));
  const qs = encodedQuery({ q: query.trim(), search_type: searchType, search_mode: searchMode, limit: safeLimit, since, until });
  return Object.freeze({
    sourceId: source.id,
    method: source.method,
    url: `${source.baseUrl}${source.endpoint}?${qs}`,
    requiredPermissions: [...source.requiredPermissions],
    enabled: false,
    headers: { Authorization: 'Bearer <redacted>' }
  });
}

export function buildNaverTrendRequest({
  mode = 'search_trend',
  startDate,
  endDate,
  timeUnit = 'date',
  keyword,
  category = null
}) {
  const source = getLiveSource(LIVE_SOURCE_IDS.NAVER_API_HUB_TRENDS);
  if (!startDate || !endDate || !keyword) throw new Error('NAVER trend request requires startDate, endDate, and keyword.');
  const endpoint = mode === 'shopping_keyword_device'
    ? '/shopping/v1/category/keyword/device'
    : '/search-trend/v1/search';
  const body = mode === 'shopping_keyword_device'
    ? { startDate, endDate, timeUnit, category, keyword }
    : { startDate, endDate, timeUnit, keywordGroups: [{ groupName: keyword, keywords: [keyword] }] };
  if (mode === 'shopping_keyword_device' && !category) throw new Error('Shopping Insight request requires category.');
  return Object.freeze({
    sourceId: source.id,
    method: 'POST',
    url: `${source.baseUrl}${endpoint}`,
    enabled: false,
    headers: {
      'X-NCP-APIGW-API-KEY-ID': '<redacted>',
      'X-NCP-APIGW-API-KEY': '<redacted>',
      'Content-Type': 'application/json'
    },
    body
  });
}

export async function executeDisabledLiveRequest(request) {
  throw new Error(`Live request execution is disabled for ${request?.sourceId ?? 'unknown source'}.`);
}
