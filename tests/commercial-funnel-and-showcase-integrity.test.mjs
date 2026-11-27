import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AFFILIATE_NETWORKS,
  buildAffiliateMapping,
  classifyAffiliateDestinationUrl
} from '../packages/core/src/affiliate-yield-service.mjs';
import { projectPublicShowcaseCard } from '../packages/core/src/public-showcase-projector.mjs';
import { createThreadScoutServer } from '../apps/web/server.mjs';
import { isNodeSqliteAvailable } from '../packages/database/src/sqlite-store.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function startTestServer(options = {}) {
  const server = createThreadScoutServer({ repoRoot, ...options });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test('Calibrated affiliate URL classifier: blocks raw Coupang/Naver storefront URLs, warns on generic naver.me, and blocks network mismatch (AT-47)', () => {
  // Known raw unmonetized storefront URLs MUST fail closed
  const rawCoupang = classifyAffiliateDestinationUrl(
    'https://www.coupang.com/vp/products/77889900?itemId=123',
    AFFILIATE_NETWORKS.COUPANG_PARTNERS
  );
  assert.equal(rawCoupang.ok, false);
  assert.equal(rawCoupang.code, 'raw_storefront_url_not_affiliate');

  const rawSmartStore = classifyAffiliateDestinationUrl(
    'https://smartstore.naver.com/mooas/products/99887766',
    AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT
  );
  assert.equal(rawSmartStore.ok, false);
  assert.equal(rawSmartStore.code, 'raw_storefront_url_not_affiliate');

  // Organic Naver search `NaPm` parameter & trailing-dot FQDNs MUST also fail closed (`UT-01`, `UT-02`)
  assert.equal(
    classifyAffiliateDestinationUrl(
      'https://smartstore.naver.com/mooas/products/99887766?NaPm=ct%3Dm3abc%7Ctr%3Dsls',
      AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT
    ).code,
    'raw_storefront_url_not_affiliate'
  );
  assert.equal(
    classifyAffiliateDestinationUrl(
      'https://www.coupang.com./vp/products/77889900',
      AFFILIATE_NETWORKS.COUPANG_PARTNERS
    ).code,
    'raw_storefront_url_not_affiliate'
  );

  // Generic 3rd-party shortener (`bit.ly`) surfaces confirmation warning (`UT-02`)
  const genericBitly = classifyAffiliateDestinationUrl(
    'https://bit.ly/3xYzDemo',
    AFFILIATE_NETWORKS.COUPANG_PARTNERS
  );
  assert.equal(genericBitly.ok, true);
  assert.match(genericBitly.warningKo, /bit\.ly 공용 단축링크/);

  // Whitespace tracking query values & embedded credentials fail closed
  assert.equal(
    classifyAffiliateDestinationUrl('https://www.coupang.com/vp/products/123?lptag=%20%20', AFFILIATE_NETWORKS.COUPANG_PARTNERS).ok,
    false
  );
  assert.equal(
    classifyAffiliateDestinationUrl('https://user:pass@link.coupang.com/a/bCdEfG', AFFILIATE_NETWORKS.COUPANG_PARTNERS).code,
    'destination_url_credentials_forbidden'
  );

  // Official issued partner URLs succeed
  const validCoupangShort = classifyAffiliateDestinationUrl(
    'https://link.coupang.com/a/bCdEfG',
    AFFILIATE_NETWORKS.COUPANG_PARTNERS
  );
  assert.equal(validCoupangShort.ok, true);
  assert.equal(validCoupangShort.warningKo, null);

  const validNaverTracked = classifyAffiliateDestinationUrl(
    'https://brand.naver.com/mooas/products/99887766?nt_source=shoppingconnect&nt_medium=threads',
    AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT
  );
  assert.equal(validNaverTracked.ok, true);

  // Generic `naver.me` passes with an explicit confirmation warning (zero redirect fetch)
  const genericNaverMe = classifyAffiliateDestinationUrl(
    'https://naver.me/xYz12345',
    AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT
  );
  assert.equal(genericNaverMe.ok, true);
  assert.match(genericNaverMe.warningKo, /naver\.me 공용 단축링크/);

  // Network-domain mismatch fails closed
  const mismatch = classifyAffiliateDestinationUrl(
    'https://link.coupang.com/a/bCdEfG',
    AFFILIATE_NETWORKS.NAVER_SHOPPING_CONNECT
  );
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.code, 'affiliate_network_domain_mismatch');

  // `buildAffiliateMapping` propagates raw-storefront block
  const mappingRejected = buildAffiliateMapping({
    candidateId: 'cand-1',
    productState: 'exact',
    state: 'exact',
    affiliateNetwork: AFFILIATE_NETWORKS.COUPANG_PARTNERS,
    acquisitionMode: 'manual_owner_link',
    destinationUrl: 'https://www.coupang.com/vp/products/12345',
    canonicalListingSnapshot: {
      brand: 'Mooas',
      model: 'S2',
      variant: 'Gray',
      seller: 'Coupang',
      destinationUrl: 'https://www.coupang.com/vp/products/12345',
      capturedAt: '2026-11-27T10:00:00.000Z'
    },
    sources: [
      { id: 's1', originId: 'origin-a' },
      { id: 's2', originId: 'origin-b' }
    ]
  });
  assert.equal(mappingRejected.ok, false);
  assert.equal(mappingRejected.code, 'raw_storefront_url_not_affiliate');
});

test('Showcase projector binds strictly to evidencePacket/materialRevision, never falls back to whyNow or Strategist rules, and enforces route share links & referrer attributes (BS-37, BS-61)', async () => {
  // Blank `verifiedPros` or `verifiedLimitation` in `evidencePacket` fails closed (`missing_pros_or_limitation`) rather than leaking `whyNow` or `strategies.angles[3].limitation` (`BF-1`)
  const missingBoundPros = projectPublicShowcaseCard({
    id: 'cand-no-pros',
    cardNumber: 7,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false, boundMaterialRevision: 'rev-a' },
    guardian: { decision: 'pass', boundMaterialRevision: 'rev-a' },
    materialRevision: 'rev-a',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    brand: 'Mooas',
    model: 'Guard',
    variant: 'White',
    whyNow: 'INTERNAL_OPERATOR_MEMO_WHY_NOW_SHOULD_NEVER_LEAK',
    readerValue: '타공 없이 싱크대 물튐을 막아 줍니다.',
    strategies: { angles: [{}, {}, {}, { limitation: '직접 사용 기록이 없으면 체험 표현을 쓰지 않습니다.' }] },
    evidencePacket: {
      observedAt: '2026-11-27T10:00:00.000Z',
      verifiedPros: [],
      verifiedLimitation: ''
    }
  }, { now: '2026-11-27T12:00:00.000Z' });
  assert.equal(missingBoundPros.projected, false);
  assert.equal(missingBoundPros.reason, 'missing_pros_or_limitation');

  // Bound `evidencePacket` projects cleanly while `materialRevision` mismatch fails closed
  const validBound = projectPublicShowcaseCard({
    id: 'cand-bound-ok',
    cardNumber: 7,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false, boundMaterialRevision: 'rev-match' },
    guardian: { decision: 'pass', boundMaterialRevision: 'rev-match' },
    materialRevision: 'rev-match',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    brand: 'Mooas',
    model: 'Guard',
    variant: 'White',
    whyNow: 'INTERNAL_OPERATOR_MEMO_WHY_NOW_SHOULD_NEVER_LEAK',
    strategies: { angles: [{}, {}, {}, { limitation: '직접 사용 기록이 없으면 체험 표현을 쓰지 않습니다.' }] },
    evidencePacket: {
      observedAt: '2026-11-27T10:00:00.000Z',
      verifiedPros: ['타공 없이 싱크대 물튐을 막아 줍니다.'],
      verifiedLimitation: '상판 턱 3.5cm 미만 싱크대는 장착이 어렵습니다.'
    }
  }, { now: '2026-11-27T12:00:00.000Z' });
  assert.equal(validBound.projected, true);
  assert.equal(JSON.stringify(validBound.card).includes('INTERNAL_OPERATOR_MEMO_WHY_NOW_SHOULD_NEVER_LEAK'), false);
  assert.equal(JSON.stringify(validBound.card).includes('체험 표현을 쓰지 않습니다'), false);
  assert.deepEqual(validBound.card.verifiedPros, ['타공 없이 싱크대 물튐을 막아 줍니다.']);

  const mismatchedRev = projectPublicShowcaseCard({
    id: 'cand-mismatch',
    cardNumber: 7,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false, boundMaterialRevision: 'rev-old' },
    guardian: { decision: 'pass', boundMaterialRevision: 'rev-old' },
    materialRevision: 'rev-new',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    brand: 'Mooas',
    model: 'Guard',
    variant: 'White',
    evidencePacket: {
      observedAt: '2026-11-27T10:00:00.000Z',
      verifiedPros: ['타공 없이 싱크대 물튐을 막아 줍니다.'],
      verifiedLimitation: '상판 턱 3.5cm 미만 싱크대는 장착이 어렵습니다.'
    }
  }, { now: '2026-11-27T12:00:00.000Z' });
  assert.equal(mismatchedRev.projected, false);
  assert.equal(mismatchedRev.reason, 'material_revision_mismatch');

  // Direct projector call with a raw storefront URL also fails closed
  const rawUrlProj = projectPublicShowcaseCard({
    id: 'cand-raw-url',
    cardNumber: 8,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false },
    guardian: { decision: 'pass' },
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    brand: 'Mooas',
    model: 'Guard',
    variant: 'White',
    verifiedPros: ['타공 없이 물튐을 막습니다.'],
    verifiedLimitation: '상판 3.5cm 미만 장착 불가',
    affiliate: true,
    affiliateNetwork: 'coupang_partners',
    destinationUrl: 'https://www.coupang.com/vp/products/12345',
    disclosure: '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.',
    verifiedAt: '2026-11-27T10:00:00.000Z'
  }, { now: '2026-11-27T12:00:00.000Z' });
  assert.equal(rawUrlProj.projected, false);
  assert.equal(rawUrlProj.reason, 'raw_storefront_url_not_affiliate');

  // Client scripts parse cleanly (`node --check`)
  execFileSync(process.execPath, ['--check', path.join(repoRoot, 'apps/web/app.js')], { stdio: 'pipe' });
  execFileSync(process.execPath, ['--check', path.join(repoRoot, 'apps/web/showcase.js')], { stdio: 'pipe' });

  const showcaseJs = await readFile(path.join(repoRoot, 'apps/web/showcase.js'), 'utf8');
  const showcaseHtml = await readFile(path.join(repoRoot, 'apps/web/showcase.html'), 'utf8');
  assert.match(showcaseHtml, /referrerpolicy="no-referrer"/);
  assert.match(showcaseJs, /noopener sponsored nofollow/);
  assert.match(showcaseJs, /\$\{window\.location\.origin\}\/showcase\//);
  assert.doesNotMatch(showcaseJs, /마크다운 복사/);
});

const storageModes = isNodeSqliteAvailable() ? ['sqlite', 'json'] : ['json'];

for (const mode of storageModes) {
  test(`E2E (${mode}): monotonic #NNN pre-reservation, commercial-only #NNN draft pointer, raw URL Guardian block, verifiedPros staleness, & advisory portfolioMix`, async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `ts-slice-g-${mode}-`));
    let nowMs = Date.parse('2026-11-27T12:00:00.000Z');
    const srv = await startTestServer({
      dataDir: tempDir,
      storageMode: mode,
      clock: () => new Date(nowMs)
    });

    const cmd = async (requestId, command, candidateId = null, expectedRevision = null, payload = {}) => {
      const res = await fetch(`${srv.baseUrl}/api/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, command, candidateId, expectedRevision, payload })
      });
      return { status: res.status, body: await res.json() };
    };

    try {
      // 0. Boot state: synthetic `demo-ready-sink-guard` did NOT burn `#001`, and `portfolioMix.status === 'NOT_MEASURED'`
      const initToday = await (await fetch(`${srv.baseUrl}/api/today`)).json();
      assert.equal(initToday.portfolioMix.status, 'NOT_MEASURED');
      const seedReady = initToday.candidates.find((c) => c.id === 'demo-ready-sink-guard');
      assert.equal(seedReady.cardNumber, null);

      // 1. Add non-synthetic commercial candidate -> verify -> `#001` reserved at `evidence_ready` BEFORE drafts/approval!
      const added1 = await cmd('g-add-1', 'add_manual_candidate', null, null, {
        name: '무아스 접이식 싱크가드',
        whyNow: '설거지 물튐 질문 급증',
        readerValue: '타공 없이 싱크대 앞쪽 물튐 차단'
      });
      assert.equal(added1.status, 200);
      const cand1Id = added1.body.candidateId;
      let cand1 = added1.body.today.candidates.find((c) => c.id === cand1Id);

      // First try with raw unissued SmartStore URL -> `run_guardian` MUST hard-block (`INVALID_AFFILIATE_MAPPING`)!
      const verRaw = await cmd('g-ver-raw', 'request_verification', cand1Id, cand1.revision, {
        brand: '무아스',
        model: 'MG-S2',
        variant: '웜그레이 50cm',
        sourceRef: 'https://brand.example/mg-s2-spec',
        sourceOrigin: 'manufacturer_spec',
        corroborationRef: 'https://review.example/mg-s2-check',
        corroborationOrigin: 'independent_review',
        mediaRights: 'not_required',
        personalUse: 'not_confirmed',
        verifiedPros: '타공 없이 흡착 클립으로 고정 가능\n미사용 시 반으로 접어 수납 가능',
        verifiedLimitation: '상판 테두리 폭 3.5cm 미만 싱크대에는 고정 불가',
        affiliate: true,
        affiliateNetwork: 'naver_shopping_connect',
        seller: '무아스 공식 브랜드스토어',
        destinationUrl: 'https://smartstore.naver.com/mooas/products/11223344',
        advisoryPriceKrw: 39000,
        advisoryCommissionRate: 0.1
      });
      assert.equal(verRaw.status, 200);
      cand1 = verRaw.body.today.candidates.find((c) => c.id === cand1Id);
      assert.equal(cand1.cardNumber, 1);
      assert.equal(cand1.cardCode, '#001');
      // Not projected onto `/api/showcase` yet because not `approved`!
      const preApproveShowcase = await (await fetch(`${srv.baseUrl}/api/showcase`)).json();
      assert.equal(preApproveShowcase.cards.length, 0);
      assert.ok(cand1.advisoryYield.netContributionKrw > 3000);

      const strat1 = await cmd('g-strat-1', 'request_strategies', cand1Id, cand1.revision);
      cand1 = strat1.body.today.candidates.find((c) => c.id === cand1Id);
      const draft1 = await cmd('g-draft-1', 'request_drafts', cand1Id, cand1.revision);
      cand1 = draft1.body.today.candidates.find((c) => c.id === cand1Id);
      // Commercial draft automatically includes `#001` BEFORE approval!
      assert.match(cand1.drafts[0].text, /#001\b/);

      const guardBlockedRawUrl = await cmd('g-guard-raw', 'run_guardian', cand1Id, cand1.revision);
      cand1 = guardBlockedRawUrl.body.today.candidates.find((c) => c.id === cand1Id);
      assert.equal(cand1.guardian.decision, 'block');
      assert.ok(cand1.guardian.revisionRequests.some((r) => r.ruleId === 'INVALID_AFFILIATE_MAPPING'));

      // Fix destinationUrl to `naver.me` -> passes with `naver.me` confirmation warning!
      const verFixed = await cmd('g-ver-fix', 'request_verification', cand1Id, cand1.revision, {
        destinationUrl: 'https://naver.me/mooasConnect001'
      });
      cand1 = verFixed.body.today.candidates.find((c) => c.id === cand1Id);
      assert.equal(cand1.cardNumber, 1); // unchanged `#001`!

      const strat1b = await cmd('g-strat-1b', 'request_strategies', cand1Id, cand1.revision);
      cand1 = strat1b.body.today.candidates.find((c) => c.id === cand1Id);
      const draft1b = await cmd('g-draft-1b', 'request_drafts', cand1Id, cand1.revision);
      cand1 = draft1b.body.today.candidates.find((c) => c.id === cand1Id);
      const guardPass1 = await cmd('g-guard-pass1', 'run_guardian', cand1Id, cand1.revision);
      cand1 = guardPass1.body.today.candidates.find((c) => c.id === cand1Id);
      assert.equal(cand1.guardian.decision, 'pass');
      assert.ok(cand1.guardian.warnings.some((w) => w.includes('naver.me')));

      const app1 = await cmd('g-app-1', 'review_decision', cand1Id, cand1.revision, {
        decision: 'approved',
        draftId: 'draft-1'
      });
      assert.equal(app1.status, 200);
      cand1 = app1.body.today.candidates.find((c) => c.id === cand1Id);
      assert.match(cand1.exportBundle.singleRootPostCopyText, /#001\b/);

      // `/api/showcase/1` serves exact `verifiedPros` (zero `whyNow` leak)
      const card001 = await (await fetch(`${srv.baseUrl}/api/showcase/1`)).json();
      assert.equal(card001.ok, true);
      assert.deepEqual(card001.card.verifiedPros, [
        '타공 없이 흡착 클립으로 고정 가능',
        '미사용 시 반으로 접어 수납 가능'
      ]);

      // 2. Non-commercial candidate (`affiliate: false`) reserves `#002` (monotonic) while keeping drafts 100% solicitation-free (`BS-60` / `AT-45`)!
      const added2 = await cmd('g-add-2', 'add_manual_candidate', null, null, {
        name: '실리콘 배수구 트랩',
        whyNow: '여름철 배수구 냄새 문의',
        readerValue: '트랩 규격 호환 여부 빠른 판별'
      });
      const cand2Id = added2.body.candidateId;
      let cand2 = added2.body.today.candidates.find((c) => c.id === cand2Id);
      const ver2 = await cmd('g-ver-2', 'request_verification', cand2Id, cand2.revision, {
        brand: 'CleanHome',
        model: 'DT-55',
        variant: '55mm 표준형',
        sourceRef: 'https://brand.example/dt-55',
        sourceOrigin: 'manufacturer_spec',
        corroborationRef: 'https://review.example/dt-55',
        corroborationOrigin: 'independent_review',
        mediaRights: 'not_required',
        personalUse: 'not_confirmed',
        verifiedPros: ['55mm 표준 배수구 규격 직결'],
        verifiedLimitation: '구형 42mm 소형 배수구에는 호환 불가',
        affiliate: false
      });
      cand2 = ver2.body.today.candidates.find((c) => c.id === cand2Id);
      assert.equal(cand2.cardNumber, 2);

      const strat2 = await cmd('g-strat-2', 'request_strategies', cand2Id, cand2.revision);
      cand2 = strat2.body.today.candidates.find((c) => c.id === cand2Id);
      const draft2 = await cmd('g-draft-2', 'request_drafts', cand2Id, cand2.revision);
      cand2 = draft2.body.today.candidates.find((c) => c.id === cand2Id);
      for (const d of cand2.drafts) {
        assert.doesNotMatch(d.text, /쇼케이스|#002/);
      }
      // Passes Guardian WITHOUT `[광고]` even while `#001` is an active monetized showcase card!
      const guard2 = await cmd('g-guard-2', 'run_guardian', cand2Id, cand2.revision);
      cand2 = guard2.body.today.candidates.find((c) => c.id === cand2Id);
      assert.equal(cand2.guardian.decision, 'pass');

      // Approve `cand2`, schedule, preflight -> `ready`, then `record_schedule_timeout` (`unknown_remote_state`):
      // MUST immediately lock `cand2.lockedNonCommercialAfterPublish = true` (`BF-2` / `BS-60`)!
      const app2 = await cmd('g-app-2', 'review_decision', cand2Id, cand2.revision, {
        decision: 'approved',
        draftId: 'draft-1'
      });
      assert.equal(app2.status, 200);
      cand2 = app2.body.today.candidates.find((c) => c.id === cand2Id);
      const sched2 = await cmd('g-sched-2', 'schedule_approved_post', cand2Id, cand2.revision, {
        draftId: 'draft-1',
        desiredLocalDatetime: '2026-11-27T18:00:00.000Z'
      });
      assert.equal(sched2.status, 200);
      cand2 = sched2.body.today.candidates.find((c) => c.id === cand2Id);
      const sched2Id = sched2.body.schedule.scheduleId;
      const pf2 = await cmd('g-pf-2', 'run_schedule_preflight', cand2Id, cand2.revision, { scheduleId: sched2Id });
      assert.equal(pf2.status, 200);
      cand2 = pf2.body.today.candidates.find((c) => c.id === cand2Id);
      const to2 = await cmd('g-to-2', 'record_schedule_timeout', cand2Id, cand2.revision, {
        scheduleId: sched2Id,
        errorReason: 'timeout_after_submit'
      });
      assert.equal(to2.status, 200);
      cand2 = to2.body.today.candidates.find((c) => c.id === cand2Id);
      assert.equal(cand2.lockedNonCommercialAfterPublish, true);
      const retroAffiliateBlocked = await cmd('g-retro-aff', 'request_verification', cand2Id, cand2.revision, {
        affiliate: true
      });
      assert.equal(retroAffiliateBlocked.status, 422);
      assert.equal(retroAffiliateBlocked.body.error, 'post_publish_monetization_locked');

      // 3. Mutating `verifiedPros` after approval on `cand1` marks `cand1` `stale` and withdraws `#001` (`BS-37`)!
      const pub1 = await cmd('g-pub-1', 'record_manual_publication', cand1Id, cand1.revision, {
        draftId: 'draft-1',
        publishedNote: '수동 게시 기록'
      });
      assert.equal(pub1.status, 200);
      assert.equal(pub1.body.today.portfolioMix.status, 'ad_heavy_warning');
      assert.equal(pub1.body.today.portfolioMix.commercialRatio, 1);
      cand1 = pub1.body.today.candidates.find((c) => c.id === cand1Id);

      const mutatedPros = await cmd('g-mut-pros', 'request_verification', cand1Id, cand1.revision, {
        verifiedPros: ['변경된 장점 문구'],
        affiliate: false
      });
      cand1 = mutatedPros.body.today.candidates.find((c) => c.id === cand1Id);
      assert.equal(cand1.workflowState, 'stale');
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/1`)).status, 404);
      // Historical `portfolioMix` remains frozen at `1` (`ad_heavy_warning`) even if `cand1.affiliate` is flipped later!
      assert.equal(mutatedPros.body.today.portfolioMix.commercialRatio, 1);
      assert.equal(mutatedPros.body.today.portfolioMix.status, 'ad_heavy_warning');

      // 4. `reset_demo` cleanly resets demo seed `cardNumber` (`null`) and `nextCardNumber` (`0` -> `#001` on next real candidate)
      const resetRes = await cmd('g-reset-1', 'reset_demo');
      assert.equal(resetRes.status, 200);
      assert.equal(resetRes.body.today.portfolioMix.status, 'NOT_MEASURED');
      for (const seedCand of resetRes.body.today.candidates) {
        assert.equal(seedCand.cardNumber, null);
        assert.equal(seedCand.cardCode, null);
      }
    } finally {
      await srv.close();
      try { await rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });
}
