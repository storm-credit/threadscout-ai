import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNaverTrendRequest,
  buildThreadsKeywordSearchRequest,
  executeDisabledLiveRequest
} from '../packages/orchestra/src/disabled-live-adapters.mjs';
import {
  LIVE_SOURCE_IDS,
  LIVE_SOURCE_REGISTRY,
  getLiveSource,
  validateLiveSourceRegistry
} from '../packages/orchestra/src/live-source-registry.mjs';
import {
  buildLiveSourceReadinessReport,
  evaluateSourceReadiness,
  redactEnvironment
} from '../packages/orchestra/src/source-readiness.mjs';

test('live source registry validates and keeps every network source disabled', () => {
  const result = validateLiveSourceRegistry();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.ok(LIVE_SOURCE_REGISTRY.filter((source) => source.id !== LIVE_SOURCE_IDS.MANUAL_USER_EVIDENCE).every((source) => !source.enabled && !source.networkEnabled));
  assert.ok(LIVE_SOURCE_REGISTRY.every((source) => source.mutationAllowed === false));
});

test('Threads is primary discovery and requires the keyword-search permission', () => {
  const source = getLiveSource(LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH);
  assert.equal(source.disposition, 'selected_primary_discovery');
  assert.ok(source.requiredPermissions.includes('threads_keyword_search'));
  assert.deepEqual(source.ownerAgents, ['scout']);
});

test('NAVER trends is secondary evidence and Coupang seller API is rejected for affiliate discovery', () => {
  assert.equal(getLiveSource(LIVE_SOURCE_IDS.NAVER_API_HUB_TRENDS).disposition, 'selected_secondary_trend_signal');
  assert.equal(getLiveSource(LIVE_SOURCE_IDS.COUPANG_SELLER_OPEN_API).disposition, 'rejected_for_affiliate_discovery');
});

test('credentials alone never activate a source without readiness and human approval', () => {
  const result = evaluateSourceReadiness(LIVE_SOURCE_IDS.THREADS_KEYWORD_SEARCH, {
    environment: { THREADS_APP_ID: 'configured-value', THREADS_ACCESS_TOKEN: 'secret-value' }
  });
  assert.equal(result.readyForLiveExecution, false);
  assert.deepEqual(result.missingEnvironment, []);
  assert.match(result.blockers.join(' '), /human approval|Network execution is disabled/);
  assert.equal(JSON.stringify(result).includes('secret-value'), false);
});

test('readiness report exposes blockers but never secrets', () => {
  const report = buildLiveSourceReadinessReport({
    [LIVE_SOURCE_IDS.NAVER_API_HUB_TRENDS]: {
      environment: { NAVER_API_HUB_CLIENT_ID: 'id-secret', NAVER_API_HUB_CLIENT_SECRET: 'client-secret' }
    }
  });
  assert.ok(report.every((item) => item.readyForLiveExecution === false));
  assert.equal(JSON.stringify(report).includes('client-secret'), false);
  assert.deepEqual(redactEnvironment({ B: '', A: 'top-secret' }), { A: 'configured', B: 'missing' });
});

test('disabled adapters build redacted requests and refuse execution', async () => {
  const threads = buildThreadsKeywordSearchRequest({ query: '신박템', searchType: 'RECENT', limit: 100 });
  assert.match(threads.url, /keyword_search/);
  assert.match(threads.url, /limit=50/);
  assert.equal(threads.headers.Authorization, 'Bearer <redacted>');
  assert.equal(threads.enabled, false);

  const naver = buildNaverTrendRequest({
    startDate: '2026-07-01', endDate: '2026-08-01', keyword: '신박템'
  });
  assert.match(naver.url, /search-trend\/v1\/search/);
  assert.equal(naver.headers['X-NCP-APIGW-API-KEY'], '<redacted>');
  await assert.rejects(executeDisabledLiveRequest(threads), /disabled/);
});

test('Google Trends alpha stays deferred and manual evidence remains the only enabled fallback', () => {
  assert.equal(getLiveSource(LIVE_SOURCE_IDS.GOOGLE_TRENDS_ALPHA).disposition, 'deferred_limited_access');
  const enabled = LIVE_SOURCE_REGISTRY.filter((source) => source.enabled);
  assert.deepEqual(enabled.map((source) => source.id), [LIVE_SOURCE_IDS.MANUAL_USER_EVIDENCE]);
  assert.equal(enabled[0].networkEnabled, false);
});
