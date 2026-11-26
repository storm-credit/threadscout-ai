import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  ATTRIBUTION_TIERS,
  buildLearningSummary,
  createOutcomeSnapshot,
  isSafetyQuarantined
} from '../packages/core/src/analytics-learning-service.mjs';
import { assertPublicReadModelSafe } from '../apps/web/application-state.mjs';
import { createThreadScoutServer } from '../apps/web/server.mjs';
import { isNodeSqliteAvailable } from '../packages/database/src/sqlite-store.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(run, { storageMode = isNodeSqliteAvailable() ? 'sqlite' : 'json', dataDir = null, clock } = {}) {
  const ownedDir = !dataDir;
  const dir = dataDir ?? await mkdtemp(path.join(os.tmpdir(), 'threadscout-qap-'));
  const server = createThreadScoutServer({ repoRoot, dataDir: dir, storageMode, clock });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run({ baseUrl, dataDir: dir });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (ownedDir) {
      try { await rm(dir, { recursive: true, force: true }); } catch { /* ignore Windows WAL handle lag */ }
    }
  }
}

async function postCommand(baseUrl, body, expectedStatus = 200) {
  const res = await fetch(`${baseUrl}/api/commands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  assert.equal(res.status, expectedStatus, `Expected HTTP ${expectedStatus} for ${body.command}, got ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

test('AT-12 & BS-46: Analytics Learning deduplicates multi-window snapshots per publicationKey, quarantines unsafe/rights/identity violations, and closes >70% affiliate bucket/portfolio loopholes', () => {
  const monetizedCandidate = {
    id: 'cand-clean-naver',
    lifecycleEpoch: 1,
    name: '스텐 물빠짐 수세미 걸이',
    lane: 'practical-novel',
    affiliate: true,
    affiliateNetwork: 'naver_shopping_connect',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    epochBudget: { costKrw: 18 },
    drafts: [{ id: 'draft-1', angleId: 'problem-result', text: '본문' }],
    selectedDraftId: 'draft-1'
  };

  // 1. Multi-window (`24h` + `7d` + 3 `manual`) snapshots on ONE single post (`sched-same-1`) -> `cleanSampleCount === 1` (`observation`), NOT 5! And epoch cost `₩18` deducted ONCE!
  const multiWindowSamePost = ['24h', '7d', 'manual', 'manual', 'manual'].map((win, idx) =>
    createOutcomeSnapshot({
      candidate: monetizedCandidate,
      scheduleId: 'sched-same-1',
      window: win,
      recordedAt: new Date(Date.parse('2026-11-27T01:00:00Z') + idx * 3600_000).toISOString(),
      payload: {
        views: 1000 + idx * 500,
        saves: 20 + idx * 5,
        purchaseQuestionReplies: 4,
        outboundClicks: 30,
        conversions: 2,
        unitPriceKrw: 25_000,
        commissionRate: 0.1,
        returnRate: 0.08
      }
    }).snapshot
  );
  const singlePostSummary = buildLearningSummary(multiWindowSamePost, [monetizedCandidate]);
  assert.equal(singlePostSummary.portfolio.rawSnapshotRecords, 5);
  assert.equal(singlePostSummary.portfolio.totalSnapshots, 1);
  assert.equal(singlePostSummary.totals.cleanSnapshotCount, 1);
  assert.equal(singlePostSummary.confidence, ATTRIBUTION_TIERS.OBSERVATION);
  assert.equal(singlePostSummary.strongRepeatedPatterns.length, 0);
  assert.equal(singlePostSummary.totals.runTokenCostKrw, 18);

  // 2. Massive views (`850,000`) + `120` conversions BUT `rumorHook: true` on `24h`, followed by a "clean" `7d` snapshot -> union quarantine keeps the publication quarantined!
  const viralRumor24h = createOutcomeSnapshot({
    candidate: monetizedCandidate,
    scheduleId: 'sched-rumor-1',
    window: '24h',
    recordedAt: '2026-11-27T02:00:00Z',
    payload: {
      views: 850_000,
      saves: 9200,
      purchaseQuestionReplies: 1400,
      outboundClicks: 18_000,
      conversions: 120,
      unitPriceKrw: 25_000,
      commissionRate: 0.1,
      returnRate: 0.05,
      rumorHook: true
    }
  }).snapshot;
  const viralRumor7dCleanAttempt = createOutcomeSnapshot({
    candidate: monetizedCandidate,
    scheduleId: 'sched-rumor-1',
    window: '7d',
    recordedAt: '2026-11-28T02:00:00Z',
    payload: { views: 920_000, saves: 10_000, rumorHook: false }
  }).snapshot;
  const unionSummary = buildLearningSummary([viralRumor24h, viralRumor7dCleanAttempt], [monetizedCandidate]);
  assert.equal(unionSummary.totals.cleanSnapshotCount, 0);
  assert.equal(unionSummary.failedPatterns.length, 1);
  assert.equal(unionSummary.failedPatterns[0].promotionBlocked, true);

  // Verify every trustSafety & candidate rights/identity/suppression quarantine flag (`AT-12`)
  for (const flag of ['endorsementImplication', 'hiddenDisclosure', 'productMismatch', 'policyViolation']) {
    assert.equal(isSafetyQuarantined({ trustSafety: { [flag]: true } }).quarantined, true, `${flag} must quarantine`);
  }
  assert.equal(isSafetyQuarantined({ trustSafety: { postCorrections: 1 } }).quarantined, true);
  assert.equal(isSafetyQuarantined({}, { mediaRights: 'unknown', exactMatchStatus: 'exact' }).quarantined, true);
  assert.equal(isSafetyQuarantined({}, { mediaRights: 'not_required', exactMatchStatus: 'unresolved' }).quarantined, true);
  assert.equal(isSafetyQuarantined({}, { mediaRights: 'not_required', exactMatchStatus: 'exact', suppression: { active: true } }).quarantined, true);

  // 3. Bucket-level `> 70%` affiliate loophole check: 9 affiliate posts + 1 editorial post (`90%` affiliate in bucket) stays `heldByAffiliateCap: true` even if another lane adds editorial posts!
  const editorialCand = { ...monetizedCandidate, id: 'cand-ed', affiliate: false, affiliateNetwork: '', epochBudget: { costKrw: 10 } };
  const nineAff = Array.from({ length: 9 }, (_, i) =>
    createOutcomeSnapshot({
      candidate: { ...monetizedCandidate, id: `aff-${i}` },
      scheduleId: `sched-aff-${i}`,
      payload: { views: 2000, saves: 30, purchaseQuestionReplies: 5, outboundClicks: 40, conversions: 2, unitPriceKrw: 30_000, commissionRate: 0.08 }
    }).snapshot
  );
  const oneEdSameBucket = createOutcomeSnapshot({
    candidate: editorialCand,
    scheduleId: 'sched-ed-same',
    payload: { views: 2500, saves: 50, purchaseQuestionReplies: 8 }
  }).snapshot;
  const fiveEdOtherLane = Array.from({ length: 5 }, (_, i) =>
    createOutcomeSnapshot({
      candidate: { ...editorialCand, id: `ed-desk-${i}`, lane: 'desk' },
      scheduleId: `sched-ed-desk-${i}`,
      payload: { views: 3000, saves: 60, purchaseQuestionReplies: 10 }
    }).snapshot
  );
  // Portfolio affiliate share = 9 / 15 = 60% (<= 70%), yet `practical-novel::problem-result` bucket is 9 / 10 = 90% (> 70%) -> MUST stay held in `weakHypotheses`, while `desk::problem-result` (0% affiliate, 5 clean posts) promotes!
  const mixedSummary = buildLearningSummary([...nineAff, oneEdSameBucket, ...fiveEdOtherLane], [monetizedCandidate, editorialCand]);
  assert.equal(mixedSummary.portfolio.excessiveAffiliateFrequency, false);
  assert.equal(mixedSummary.strongRepeatedPatterns.length, 1);
  assert.equal(mixedSummary.strongRepeatedPatterns[0].patternKey, 'desk::problem-result');
  const heldBucket = mixedSummary.weakHypotheses.find((w) => w.patternKey === 'practical-novel::problem-result');
  assert.equal(heldBucket?.heldByAffiliateCap, true);
});

for (const mode of isNodeSqliteAvailable() ? ['sqlite', 'json'] : ['json']) {
  test(`AT-09, AT-11, AT-13, AT-14, AT-19, AT-35, AT-36, AT-38, AT-44 & BS-60 (${mode}): Single-draft binding, suppression unwedging, destination drift, timeout reconciliation, and reload durability`, async () => {
    const baseMs = Date.parse('2026-11-27T07:00:00.000Z');
    let offsetMs = 0;
    const clock = () => new Date(baseMs + offsetMs);
    const sharedDir = await mkdtemp(path.join(os.tmpdir(), `threadscout-qap-${mode}-`));

    let monetizedId = null;
    let nonCommId = null;
    let timeoutSchedId = null;
    let publishedScheduleId = null;

    try {
      await withServer(async ({ baseUrl }) => {
        // 1. Add candidate, verify, create strategies & 4 drafts, explicitly select `draft-2` (`select_draft`), run Guardian, approve `draft-2`
        const added = await postCommand(baseUrl, {
          requestId: 'qap-add-1',
          command: 'add_manual_candidate',
          payload: {
            name: '무타공 자석 키친타올 홀더',
            brand: 'KitchenPure',
            model: 'KP-310',
            variant: '매트화이트',
            seller: 'KitchenPure 네이버 공식 브랜드스토어',
            sourceRef: 'https://kitchenpure.example/spec/kp-310',
            sourceOrigin: 'manufacturer_official',
            corroborationRef: 'https://smartstore.naver.com/kitchenpure/products/310',
            corroborationOrigin: 'naver_brand_store',
            whyNow: '냉장고 측면 공간 활용 질문이 많은 주방 수납 신박템',
            readerValue: '철제 도어 곡면 여부에 따른 자력 유지 한계를 미리 구분 가능',
            mediaRights: 'not_required',
            personalUse: 'not_confirmed',
            affiliate: true,
            affiliateNetwork: 'naver_shopping_connect',
            destinationUrl: 'https://smartstore.naver.com/kitchenpure/products/310',
            verifiedLimitation: '유리 마감 비자성 냉장고 도어에는 부착되지 않습니다.'
          }
        });
        monetizedId = added.candidateId;
        let rev = added.today.candidates.find((c) => c.id === monetizedId).revision;
        const initialIntakeDigest = added.today.candidates.find((c) => c.id === monetizedId).provenance[0].digest;

        for (const [cmd, reqId, payload] of [
          ['request_verification', 'qap-ver-1', { sourceRef: 'https://kitchenpure.example/spec/kp-310-v2' }],
          ['request_strategies', 'qap-str-1', {}],
          ['request_drafts', 'qap-drf-1', {}],
          ['select_draft', 'qap-sel-2', { draftId: 'draft-2' }],
          ['run_guardian', 'qap-grd-1', {}]
        ]) {
          const r = await postCommand(baseUrl, { requestId: reqId, command: cmd, candidateId: monetizedId, expectedRevision: rev, payload });
          rev = r.today.candidates.find((c) => c.id === monetizedId).revision;
        }

        const approved = await postCommand(baseUrl, {
          requestId: 'qap-app-1',
          command: 'review_decision',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { decision: 'approved', draftId: 'draft-2' }
        });
        const approvedCand = approved.today.candidates.find((c) => c.id === monetizedId);
        rev = approvedCand.revision;

        // Verify AT-13 & AT-19 Provenance: Stage 1 intake digest stayed immutable after Step 1 sourceRef edit, promptVersion & inputDigest chain present
        assert.equal(approvedCand.provenance[0].digest, initialIntakeDigest);
        assert.equal(approvedCand.provenance[1].inputDigest, initialIntakeDigest);
        assert.ok(approvedCand.provenance[1].promptVersion);
        assert.equal(approvedCand.review.approvedDraftId, 'draft-2');
        assert.ok(approvedCand.exportBundle.singleRootPostCopyText?.startsWith('[광고]'));

        // BLOCKER-1 check: attempting to schedule `draft-1` or `draft-3` when `draft-2` was approved MUST fail closed (`422 unapproved_draft_selection`)!
        const wrongDraft = await postCommand(baseUrl, {
          requestId: 'qap-sched-wrong-draft',
          command: 'schedule_approved_post',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { draftId: 'draft-1', desiredLocalDatetime: '2026-11-27T12:00:00+09:00' }
        }, 422);
        assert.equal(wrongDraft.error, 'unapproved_draft_selection');

        // Schedule `draft-2` -> succeeds
        const scheduled1 = await postCommand(baseUrl, {
          requestId: 'qap-sched-1',
          command: 'schedule_approved_post',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { desiredLocalDatetime: '2026-11-27T12:00:00+09:00', timezone: 'Asia/Seoul' }
        });
        rev = scheduled1.revision;
        const firstSchedId = scheduled1.schedule.scheduleId;

        // AT-44 check: `run_schedule_preflight` with mutated `currentDestinationSnapshot` (different model/seller) invalidates schedule AND marks candidate `stale` (unwedged)!
        const driftPf = await postCommand(baseUrl, {
          requestId: 'qap-pf-drift',
          command: 'run_schedule_preflight',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: {
            scheduleId: firstSchedId,
            currentDestinationSnapshot: {
              destinationUrl: 'https://smartstore.naver.com/kitchenpure/products/310',
              brand: 'KitchenPure',
              model: 'DIFFERENT-MODEL-999',
              variant: '매트화이트',
              seller: 'OtherSeller'
            }
          }
        });
        rev = driftPf.revision;
        assert.equal(driftPf.result, 'schedule_preflight_blocked');
        assert.equal(driftPf.schedule.status, 'invalidated');
        assert.equal(driftPf.today.candidates.find((c) => c.id === monetizedId).workflowState, 'stale');

        // BLOCKER-2 unwedge check: re-run Guardian + re-approve -> suppress (`suppress_candidate`) -> verify export/schedule blocked & candidate `stale` -> `restore_candidate` -> re-Guardian + re-approve -> schedule cleanly!
        const reGrd1 = await postCommand(baseUrl, { requestId: 'qap-re-grd-1', command: 'run_guardian', candidateId: monetizedId, expectedRevision: rev, payload: {} });
        rev = reGrd1.revision;
        const reApp1 = await postCommand(baseUrl, { requestId: 'qap-re-app-1', command: 'review_decision', candidateId: monetizedId, expectedRevision: rev, payload: { decision: 'approved' } });
        rev = reApp1.revision;

        const suppressed = await postCommand(baseUrl, {
          requestId: 'qap-suppress-1',
          command: 'suppress_candidate',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { axis: 'product', reason: '재고 확인 전 일시 보류' }
        });
        rev = suppressed.revision;
        const suppCand = suppressed.today.excluded.find((c) => c.id === monetizedId);
        assert.equal(suppCand.workflowState, 'stale');
        assert.equal(suppCand.exportBundle.singleRootPostCopyText, null);

        // Scheduling while suppressed fails closed (`422 candidate_suppressed`)
        const schedWhileSuppressed = await postCommand(baseUrl, {
          requestId: 'qap-sched-suppressed',
          command: 'schedule_approved_post',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { desiredLocalDatetime: '2026-11-27T14:00:00+09:00' }
        }, 422);
        assert.equal(schedWhileSuppressed.error, 'candidate_suppressed');

        // Restore -> re-run Guardian -> re-approve -> schedule -> preflight `ready` -> AT-11 timeout `unknown_remote_state`!
        const restored = await postCommand(baseUrl, { requestId: 'qap-restore-1', command: 'restore_candidate', candidateId: monetizedId, expectedRevision: rev, payload: {} });
        rev = restored.revision;
        const reGrd2 = await postCommand(baseUrl, { requestId: 'qap-re-grd-2', command: 'run_guardian', candidateId: monetizedId, expectedRevision: rev, payload: {} });
        rev = reGrd2.revision;
        const reApp2 = await postCommand(baseUrl, { requestId: 'qap-re-app-2', command: 'review_decision', candidateId: monetizedId, expectedRevision: rev, payload: { decision: 'approved' } });
        rev = reApp2.revision;

        const scheduledTimeout = await postCommand(baseUrl, {
          requestId: 'qap-sched-timeout',
          command: 'schedule_approved_post',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { desiredLocalDatetime: '2026-11-27T15:00:00+09:00' }
        });
        rev = scheduledTimeout.revision;
        timeoutSchedId = scheduledTimeout.schedule.scheduleId;

        const pfReady = await postCommand(baseUrl, {
          requestId: 'qap-pf-ready',
          command: 'run_schedule_preflight',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { scheduleId: timeoutSchedId }
        });
        rev = pfReady.revision;
        assert.equal(pfReady.schedule.status, 'ready');

        const timedOut = await postCommand(baseUrl, {
          requestId: 'qap-timeout-1',
          command: 'record_schedule_timeout',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { scheduleId: timeoutSchedId, remoteContainerId: 'threads-container-777' }
        });
        rev = timedOut.revision;
        assert.equal(timedOut.schedule.status, 'unknown_remote_state');

        // 3. Non-commercial (`demo-ready-sink-guard`) manual publication automatically triggers irreversible `BS-60` lock!
        const todayRes = await (await fetch(`${baseUrl}/api/today`)).json();
        const sinkCand = todayRes.candidates.find((c) => c.id === 'demo-ready-sink-guard');
        nonCommId = sinkCand.id;
        let sinkRev = sinkCand.revision;
        for (const [cmd, reqId] of [
          ['request_strategies', 'qap-sink-str'],
          ['request_drafts', 'qap-sink-drf'],
          ['run_guardian', 'qap-sink-grd']
        ]) {
          const r = await postCommand(baseUrl, { requestId: reqId, command: cmd, candidateId: nonCommId, expectedRevision: sinkRev, payload: {} });
          sinkRev = r.today.candidates.find((c) => c.id === nonCommId).revision;
        }
        const sinkApp = await postCommand(baseUrl, {
          requestId: 'qap-sink-app',
          command: 'review_decision',
          candidateId: nonCommId,
          expectedRevision: sinkRev,
          payload: { decision: 'approved' }
        });
        sinkRev = sinkApp.revision;

        const sinkPub = await postCommand(baseUrl, {
          requestId: 'qap-sink-pub',
          command: 'record_manual_publication',
          candidateId: nonCommId,
          expectedRevision: sinkRev,
          payload: { publishedNote: '무고지 정보성 포스트 게시 완료' }
        });
        sinkRev = sinkPub.revision;
        assert.equal(sinkPub.today.candidates.find((c) => c.id === nonCommId).lockedNonCommercialAfterPublish, true);
      }, { storageMode: mode, dataDir: sharedDir, clock });

      // 4. Advance clock +25h (`MAJOR-1` dynamic `evidenceFreshness === 'stale'`) & restart server (`AT-11` + `AT-35` reload durability)
      offsetMs += 25 * 3600_000;
      await withServer(async ({ baseUrl }) => {
        const reloaded = await (await fetch(`${baseUrl}/api/today`)).json();
        assert.equal(assertPublicReadModelSafe(reloaded).ok, true);

        const unknownItem = reloaded.queue.find((q) => q.scheduleId === timeoutSchedId);
        assert.equal(unknownItem?.status, 'unknown_remote_state');
        assert.equal(unknownItem?.remoteContainerId, 'threads-container-777');
        assert.equal(unknownItem?.evidenceFreshness, 'stale', 'Dynamic freshness must transition to stale after 24h TTL');

        // Reconcile `unknown_remote_state` -> `remoteExists: true` -> `published` (`AT-11`)!
        let rev = reloaded.candidates.find((c) => c.id === monetizedId).revision;
        const reconciled = await postCommand(baseUrl, {
          requestId: 'qap-reconcile-1',
          command: 'reconcile_unknown_schedule',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { scheduleId: timeoutSchedId, remoteExists: true, remotePostId: 'threads-post-999' }
        });
        rev = reconciled.revision;
        publishedScheduleId = reconciled.schedule.scheduleId;
        assert.equal(reconciled.schedule.status, 'published');
        assert.equal(reconciled.repostAllowed, false);

        // Validate `scheduleId` check on `record_outcome_snapshot` (`MINOR-1`: bogus scheduleId -> 404)
        await postCommand(baseUrl, {
          requestId: 'qap-snap-bad-sched',
          command: 'record_outcome_snapshot',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: { scheduleId: 'sched-does-not-exist', views: 500 }
        }, 404);

        const snapOk = await postCommand(baseUrl, {
          requestId: 'qap-snap-ok',
          command: 'record_outcome_snapshot',
          candidateId: monetizedId,
          expectedRevision: rev,
          payload: {
            scheduleId: publishedScheduleId,
            window: '24h',
            views: 4200,
            likes: 110,
            replies: 19,
            saves: 88,
            purchaseQuestionReplies: 14,
            outboundClicks: 65,
            conversions: 4,
            unitPriceKrw: 25_000,
            commissionRate: 0.1,
            returnRate: 0.05
          }
        });
        assert.equal(snapOk.outcomeSnapshot.quarantined, false);
        assert.equal(snapOk.today.analytics.totals.likes, 110);
        assert.equal(snapOk.today.analytics.totals.replies, 19);
        assert.ok(snapOk.today.analytics.totals.netContributionKrw > 0);
      }, { storageMode: mode, dataDir: sharedDir, clock });
    } finally {
      try { await rm(sharedDir, { recursive: true, force: true }); } catch { /* ignore Windows WAL handle lag */ }
    }
  });
}
