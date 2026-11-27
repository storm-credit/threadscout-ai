import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DRAFT_TONES,
  attachJosa,
  buildKoreanDraftTexts,
  parseStructuredIdentitySnippet,
  withJosa
} from '../packages/core/src/korean-copy-engine.mjs';
import {
  detectKoreanAiSlop,
  runGuardianChecks,
  textSimilarity
} from '../packages/core/src/guardian-checks.mjs';
import { evaluateShowcaseCardExpiry } from '../packages/core/src/public-showcase-projector.mjs';
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

test('Phonetic Korean josa combiner & structured spec snippet parser: Hangul, ㄹ/R batchim, digits, units, %, brackets, and uncomma/₩/만원 price stripping', () => {
  // Hangul batchim & `ㄹ` exception (`으로/로`)
  assert.equal(withJosa('싱크가드', '을/를'), '싱크가드를');
  assert.equal(withJosa('배수망', '을/를'), '배수망을');
  assert.equal(withJosa('모델', '으로/로'), '모델로');
  assert.equal(withJosa('흡착판', '으로/로'), '흡착판으로');

  // Sino-Korean digits, R/L letter names, & bracket unwrapping (`NBR-2`)
  assert.equal(withJosa('SG-01', '을/를'), 'SG-01을');
  assert.equal(withJosa('SG-01', '으로/로'), 'SG-01로');
  assert.equal(withJosa('MG-S2', '을/를'), 'MG-S2를');
  assert.equal(withJosa('V8', '으로/로'), 'V8로');
  assert.equal(withJosa('모델(3)', '으로/로'), '모델(3)으로');
  assert.equal(withJosa('XR', '을/를'), 'XR을');
  assert.equal(withJosa('XR', '으로/로'), 'XR로');

  // Closed SI/commerce units + `%` + `in` + parentheses
  assert.equal(withJosa('50cm', '을/를'), '50cm를');
  assert.equal(withJosa('무아스(50cm)', '으로/로'), '무아스(50cm)로');
  assert.equal(withJosa('500g', '을/를'), '500g을');
  assert.equal(withJosa('500g', '으로/로'), '500g으로');
  assert.equal(withJosa('65W', '이/가'), '65W가');
  assert.equal(withJosa('27in', '을/를'), '27in를');
  assert.equal(withJosa('99%', '을/를'), '99%를');
  assert.equal(attachJosa('2L', '을/를'), '를');

  // Structured spec-snippet parser strips uncomma'd `39000원`, `₩`, `만원`, `(39,000원)`, and splits single-line aliases (`BF-5`)
  const parsed = parseStructuredIdentitySnippet(`
    [브랜드] 무아스
    모델명: MG-S2
    옵션/규격: 웜그레이 50cm (39,000원 무료배송)
    판매자 | 무아스 공식 브랜드스토어
    혁신적인 주방 편의성을 제공하는 오늘만 초특가 이벤트 문구입니다!
  `);
  assert.equal(parsed.brand, '무아스');
  assert.equal(parsed.model, 'MG-S2');
  assert.equal(parsed.variant, '웜그레이 50cm');
  assert.equal(parsed.seller, '무아스 공식 브랜드스토어');
  assert.equal('verifiedPros' in parsed, false);

  const uncommaInline = parseStructuredIdentitySnippet('제조사: 클린홈 품번: DT-55 색상/사이즈: 소형 900원 판매처: 클린홈 공식몰');
  assert.equal(uncommaInline.brand, '클린홈');
  assert.equal(uncommaInline.model, 'DT-55');
  assert.equal(uncommaInline.variant, '소형');
  assert.equal(uncommaInline.seller, '클린홈 공식몰');

  const wonSymbol = parseStructuredIdentitySnippet('옵션: 스틸 60cm ₩39,000');
  assert.equal(wonSymbol.variant, '스틸 60cm');
  const manWon = parseStructuredIdentitySnippet('옵션: 대형 3.9만원 특가');
  assert.equal(manWon.variant, '대형');
  // Parenthesized non-price dimensions `(50cm)` / `(2개입)` stay intact while `(₩39,000)` is stripped (`NBR-R2-1`)
  const parenSpec = parseStructuredIdentitySnippet('옵션: 화이트 (50cm) (2개입) (₩39,000)');
  assert.equal(parenSpec.variant, '화이트 (50cm) (2개입)');
});

test('Calibrated Novelist detectKoreanAiSlop: catches single-line [광고] & compound AT-23 slop, full 해요체/하십시오체/해라체 stems, and stays quiet on benign prose (BF-1, BF-2, BF-4)', () => {
  // Single-line `[광고]` without `\n` MUST NOT erase trailing AI slop (`BF-1`)
  const singleLineAdSlop = '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 이 도구는 단순한 물받이를 넘어 혁신적인 사용자 경험을 제공합니다.';
  assert.equal(detectKoreanAiSlop(singleLineAdSlop).detected, true);

  // Compound `AT-23` clause joined with `,` MUST NOT erase trailing AI slop (`BF-1`)
  const compoundAt23Slop = '직접 써본 기록이 없어 사양만 봤고, 혁신적인 사용자 경험을 제공한다.';
  assert.equal(detectKoreanAiSlop(compoundAt23Slop).detected, true);

  // Full conjugation coverage across `해요체`/`하십시오체`/`해라체` (`BF-2`)
  assert.equal(detectKoreanAiSlop('단단한 실리콘으로 만들어집니다.').detected, true); // A-8 하십시오체 `집`
  assert.equal(detectKoreanAiSlop('내열 소재로 만들어졌다.').detected, true); // A-8 과거 `졌`
  assert.equal(detectKoreanAiSlop('바쁜 아침에 쾌적한 사용자 경험을 제공한다.').detected, true); // A-15 해라체 `한`
  assert.equal(detectKoreanAiSlop('단단하게 만들어서 가볍고, 깔끔해서, 물기를 막아서, 관리가 편합니다.').detected, true); // C-11 unmasked `해서,`
  assert.equal(detectKoreanAiSlop('문제는 상판 두께입니다.').detected, true); // D-8 `문제는 ~입니다`
  assert.equal(detectKoreanAiSlop('관건은 설치 폭이다.').detected, true); // D-8 `관건은 ~이다`
  assert.equal(detectKoreanAiSlop('구매 전 두께를 먼저 재봐야 하는 이유다.').detected, true); // D-10 general adnominal `~는 이유다`
  assert.equal(detectKoreanAiSlop('타공 부담을 사실상 덜어낸 셈이에요.').detected, true); // D-10 해요체 `셈이에요`

  // Calibrated `stays-quiet` negative cases (`CONTENT_OUTPUT_SPEC.md` §3.2)
  const statutoryWithConcrete = [
    '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.',
    '설치 조건에 대해 문의가 많지만 상판 높이를 넘어 물이 튀는 싱크대에만 쓸 수 있습니다.',
    '제조사에서 1년 무상 보증을 제공하며 전용 파우치를 제공합니다. 상판 폭이라는 이유로 반품이 생길 수 있습니다.'
  ].join('\n');
  assert.equal(detectKoreanAiSlop(statutoryWithConcrete).detected, false);

  // `plain` tone purity (`BF-4`): zero `입니다`/`습니다`/`하세요` even when `verifiedLimitation` was entered in polite form, AND `> 500` budget truncation preserves `AT-23`
  const plainTexts = buildKoreanDraftTexts({
    name: '무아스 접이식 싱크가드',
    brand: '무아스',
    model: 'MG-S2',
    variant: '웜그레이 50cm',
    readerValue: '타공 없이 설거지 물튐 차단',
    verifiedPros: ['상판 클립 거치식이라 타공 불필요', '미사용 시 반으로 접어 보관 가능'],
    verifiedLimitation: '구매 전 본인 설치·사용 환경과 상세 규격을 반드시 확인하세요.',
    personalUse: 'not_confirmed',
    affiliate: false
  }, {
    tone: DRAFT_TONES.PLAIN,
    substituteNotice: ' 원본과 같은 제품이 아니라 비슷한 대체품이다.'
  });
  for (const t of plainTexts) {
    assert.doesNotMatch(t, /입니다|습니다|하세요|보시나요/);
    assert.equal(detectKoreanAiSlop(t).detected, false);
  }

  // `> 500` code-point truncation preserves `AT-23` non-use disclaimer (`BF-4`)
  const overlongPlain = buildKoreanDraftTexts({
    name: '초장문 테스트 싱크가드 모델',
    brand: '무아스',
    model: 'MG-S2-LONG-MODEL-IDENTIFIER',
    variant: '특대형 웜그레이 120cm 3단 접이식 확장형 패키지 구성',
    readerValue: '설거지할 때마다 싱크대 앞쪽 상판과 바닥으로 튀는 물줄기를 타공이나 실리콘 접착제 시공 없이 깔끔하게 막아 주는 주방 환경 개선 효과 '.repeat(3),
    verifiedPros: ['타공 없이 상판 거치 가능'],
    verifiedLimitation: '상판 두께 3.5cm 미만에서는 고정 클립 유격이 생길 수 있습니다',
    personalUse: 'not_confirmed',
    affiliate: true
  }, {
    tone: DRAFT_TONES.PLAIN,
    offsetZeroPrefix: '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.\n',
    substituteNotice: ' 이 링크는 같은 제품이 아니라 비슷한 제품이다.',
    showcasePointer: ' 상세 검증 스펙과 한계 정리는 프로필 쇼케이스 #001 카드에 묶어 두었다.'
  });
  assert.ok([...overlongPlain[3]].length <= 500);
  assert.match(overlongPlain[3], /직접 써본 기록이 없어/);
  assert.match(overlongPlain[3], /비슷한 제품이다/);

  for (const tone of [DRAFT_TONES.POLITE, DRAFT_TONES.PLAIN]) {
    const texts = buildKoreanDraftTexts({
      name: '무아스 접이식 싱크가드',
      brand: '무아스',
      model: 'MG-S2',
      variant: '웜그레이 50cm',
      readerValue: '타공 없이 설거지 물튐 차단',
      verifiedPros: ['상판 클립 거치식이라 타공 불필요', '미사용 시 반으로 접어 보관 가능'],
      verifiedLimitation: '상판 테두리 3.5cm 미만 싱크대에는 장착이 어렵습니다',
      personalUse: 'not_confirmed',
      affiliate: false
    }, { tone });

    assert.equal(texts.length, 4);
    for (let i = 0; i < texts.length; i += 1) {
      assert.ok([...texts[i]].length <= 500);
      assert.equal(detectKoreanAiSlop(texts[i]).detected, false);
      for (let j = i + 1; j < texts.length; j += 1) {
        assert.ok(textSimilarity(texts[i], texts[j]) < 0.75);
      }
    }
    const guard = runGuardianChecks({
      drafts: texts.map((text, idx) => ({ id: `d-${idx + 1}`, text, claimIds: ['claim-identity'] })),
      matchState: 'exact',
      verifiedClaimIds: ['claim-identity'],
      mediaRightsResolved: true
    });
    assert.equal(guard.decision, 'pass');
  }

  execFileSync(process.execPath, ['--check', path.join(repoRoot, 'apps/web/app.js')], { stdio: 'pipe' });
});

test('Proportional showcase expiry helper: 7d card warns at <= 24h while 12h issue card stays quiet at t=0 and warns at <= 3h (B-1)', () => {
  const stdCand = {
    cardNumber: 1,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false },
    exactMatchStatus: 'exact',
    evidencePacket: { observedAt: '2026-11-20T00:00:00.000Z' }
  };
  const stdAt5d = evaluateShowcaseCardExpiry(stdCand, { now: '2026-11-25T00:00:00.000Z' });
  assert.equal(stdAt5d.expiringSoon, false);
  assert.equal(stdAt5d.expired, false);
  const stdAt6d12h = evaluateShowcaseCardExpiry(stdCand, { now: '2026-11-26T12:00:00.000Z' });
  assert.equal(stdAt6d12h.expiringSoon, true);
  assert.equal(stdAt6d12h.expired, false);

  const issueCand = {
    cardNumber: 2,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false },
    exactMatchStatus: 'exact',
    issueSourceGrade: 'G1',
    productRelationGrade: 'R1',
    evidencePacket: { observedAt: '2026-11-27T00:00:00.000Z' }
  };
  const issueAt0h = evaluateShowcaseCardExpiry(issueCand, { now: '2026-11-27T00:05:00.000Z' });
  assert.equal(issueAt0h.warningWindowMs, 3 * 60 * 60 * 1000);
  assert.equal(issueAt0h.expiringSoon, false);
  const issueAt10h = evaluateShowcaseCardExpiry(issueCand, { now: '2026-11-27T10:00:00.000Z' });
  assert.equal(issueAt10h.expiringSoon, true);
});

const storageModes = isNodeSqliteAvailable() ? ['sqlite', 'json'] : ['json'];

for (const mode of storageModes) {
  test(`E2E (${mode}): polite/plain tone toggle, structured spec paste, active schedule preflight after reconfirm, and post-expiry stale block (BF-3, NBR-1)`, async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `ts-slice-h-${mode}-`));
    let nowMs = Date.parse('2026-11-20T00:00:00.000Z');
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
      const added = await cmd('h-add-1', 'add_manual_candidate', null, null, {
        name: '무아스 접이식 싱크가드',
        whyNow: '설거지 물튐 문의 급증',
        readerValue: '타공 없이 싱크대 앞쪽 물튐 차단'
      });
      const candId = added.body.candidateId;
      let cand = added.body.today.candidates.find((c) => c.id === candId);

      const ver = await cmd('h-ver-1', 'request_verification', candId, cand.revision, {
        structuredSpecSnippet: '브랜드: 무아스\n모델명: MG-S2\n옵션: 웜그레이 50cm 39000원 무료배송\n판매자: 무아스 공식 스토어',
        sourceRef: 'https://brand.example/mg-s2',
        sourceOrigin: 'manufacturer_spec',
        corroborationRef: 'https://review.example/mg-s2',
        corroborationOrigin: 'independent_review',
        mediaRights: 'not_required',
        personalUse: 'not_confirmed',
        verifiedPros: ['상판 클립 거치식이라 타공 불필요'],
        verifiedLimitation: '상판 테두리 3.5cm 미만 싱크대 장착 불가',
        affiliate: true,
        affiliateNetwork: 'coupang_partners',
        destinationUrl: 'https://link.coupang.com/a/hDemo001'
      });
      assert.equal(ver.status, 200);
      cand = ver.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.variant, '웜그레이 50cm'); // uncomma'd `39000원` stripped!

      const strat = await cmd('h-strat-1', 'request_strategies', candId, cand.revision);
      cand = strat.body.today.candidates.find((c) => c.id === candId);

      const draftPolite = await cmd('h-draft-polite', 'request_drafts', candId, cand.revision, {});
      cand = draftPolite.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.draftTone, 'polite');
      assert.match(cand.drafts[0].text, /만합니다|확인하세요/);

      const draftPlain = await cmd('h-draft-plain', 'request_drafts', candId, cand.revision, { tone: 'plain' });
      assert.equal(draftPlain.status, 200);
      cand = draftPlain.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.draftTone, 'plain');
      assert.match(cand.drafts[0].text, /묶어 두었다/);
      assert.doesNotMatch(cand.drafts[0].text.split('\n').slice(1).join('\n'), /입니다|습니다|하세요/);

      const guard = await cmd('h-guard-1', 'run_guardian', candId, cand.revision);
      cand = guard.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.guardian.decision, 'pass');

      const app = await cmd('h-app-1', 'review_decision', candId, cand.revision, {
        decision: 'approved',
        draftId: 'draft-1'
      });
      cand = app.body.today.candidates.find((c) => c.id === candId);
      const initialApprovalHash = cand.review.approvalHash;
      const budgetBeforeReconfirm = cand.epochBudget.invocations;

      // Schedule a pre-dispatch post, advance +20h, reconfirm snapshot -> active schedule rebounds & passes `run_schedule_preflight` at +30h (`NBR-1`)!
      const sched = await cmd('h-sched-1', 'schedule_approved_post', candId, cand.revision, {
        draftId: 'draft-1',
        desiredLocalDatetime: '2026-11-21T12:00:00.000Z'
      });
      assert.equal(sched.status, 200);
      cand = sched.body.today.candidates.find((c) => c.id === candId);
      const scheduleId = sched.body.schedule.scheduleId;

      nowMs = Date.parse('2026-11-20T20:00:00.000Z');
      const recPreDispatch = await cmd('h-rec-predispatch', 'reconfirm_showcase_snapshot', candId, cand.revision, {
        brand: '무아스',
        model: 'MG-S2',
        variant: '웜그레이 50cm',
        seller: '무아스 공식 스토어',
        destinationUrl: 'https://link.coupang.com/a/hDemo001'
      });
      assert.equal(recPreDispatch.status, 200);
      assert.equal(recPreDispatch.body.reconfirmed, true);
      cand = recPreDispatch.body.today.candidates.find((c) => c.id === candId);

      // At +30h (past initial `24h` pre-dispatch TTL, within reconfirmed `24h` TTL): `run_schedule_preflight` & `record_manual_publication` PASS!
      nowMs = Date.parse('2026-11-21T06:00:00.000Z');
      const pf = await cmd('h-pf-1', 'run_schedule_preflight', candId, cand.revision, { scheduleId });
      assert.equal(pf.status, 200);
      assert.equal(pf.body.preflightOk, true);
      cand = pf.body.today.candidates.find((c) => c.id === candId);

      const pub = await cmd('h-pub-1', 'record_manual_publication', candId, cand.revision, { scheduleId });
      assert.equal(pub.status, 200);
      cand = pub.body.today.candidates.find((c) => c.id === candId);

      // Advance +6d 12h from `2026-11-20T20:00:00Z` -> `2026-11-27T08:00:00Z` (`expiringSoon === true`, 12h remaining)
      nowMs = Date.parse('2026-11-27T08:00:00.000Z');
      const todayExpiring = await (await fetch(`${srv.baseUrl}/api/today`)).json();
      assert.equal(todayExpiring.expiringShowcaseCount, 1);
      cand = todayExpiring.candidates.find((c) => c.id === candId);
      assert.equal(cand.showcaseExpiry.expiringSoon, true);

      // Empty `{}` payload fails closed (`snapshot_fields_required`, 422)
      const emptyReconfirm = await cmd('h-rec-empty', 'reconfirm_showcase_snapshot', candId, cand.revision, {});
      assert.equal(emptyReconfirm.status, 422);
      assert.equal(emptyReconfirm.body.error, 'snapshot_fields_required');

      // Reconfirm within `expiringSoon` window -> `0` specialist budget charge, fresh `approvalHash`, duplicate post STILL blocked
      const reconfirmed = await cmd('h-rec-ok', 'reconfirm_showcase_snapshot', candId, cand.revision, {
        brand: '무아스',
        model: 'MG-S2',
        variant: '웜그레이 50cm',
        seller: '무아스 공식 스토어',
        destinationUrl: 'https://link.coupang.com/a/hDemo001'
      });
      assert.equal(reconfirmed.status, 200);
      assert.equal(reconfirmed.body.reconfirmed, true);
      cand = reconfirmed.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.epochBudget.invocations, budgetBeforeReconfirm);
      assert.notEqual(cand.review.approvalHash, initialApprovalHash);

      const dupSched = await cmd('h-dup-sched', 'schedule_approved_post', candId, cand.revision, {
        draftId: 'draft-1',
        desiredLocalDatetime: '2026-11-28T09:00:00.000Z'
      });
      assert.equal(dupSched.status, 422);
      assert.equal(dupSched.body.error, 'approval_already_consumed');

      // Advance PAST extended 7d TTL (`2026-12-05T00:00:00Z`, `remainingMs <= 0`):
      // `reconfirm_showcase_snapshot` MUST fail closed (`expiredStale === true`) and persist `workflowState === 'stale'` (`BF-3`)!
      nowMs = Date.parse('2026-12-05T00:00:00.000Z');
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/1`)).status, 404);
      const expiredReconfirm = await cmd('h-rec-expired', 'reconfirm_showcase_snapshot', candId, cand.revision, {
        brand: '무아스',
        model: 'MG-S2',
        variant: '웜그레이 50cm',
        seller: '무아스 공식 스토어',
        destinationUrl: 'https://link.coupang.com/a/hDemo001'
      });
      assert.equal(expiredReconfirm.status, 200);
      assert.equal(expiredReconfirm.body.reconfirmed, false);
      assert.equal(expiredReconfirm.body.expiredStale, true);
      cand = expiredReconfirm.body.today.candidates.find((c) => c.id === candId);
      assert.equal(cand.workflowState, 'stale');
    } finally {
      await srv.close();
      try { await rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });
}
