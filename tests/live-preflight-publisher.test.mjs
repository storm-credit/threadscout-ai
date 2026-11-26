// Tests for Single-Root-Post Publisher Preflight/Reconciliation (`PUBLISHING_SPEC.md` §§1–9, `CLAUDE.md` §5, `AT-44`)
// and Unified Live-Activation Preflight (`GET /api/preflight`, zero secret or env-var identifier leakage).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCHEDULE_STATES,
  assertSingleRootPostPayload,
  buildRedactedThreadsPublishPreview,
  createThreadsPublisherRegistry
} from '../packages/core/src/threads-publisher-service.mjs';
import {
  buildLiveActivationPreflightReport,
  buildRedactedLlmProviderPreview,
  toPublicWebPreflightSummary
} from '../packages/orchestra/src/live-activation-preflight.mjs';
import { assertPublicReadModelSafe } from '../apps/web/application-state.mjs';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function makeApprovedCandidate(overrides = {}) {
  const materialRevision = 'mat-rev-hash-001';
  return {
    id: 'cand-pub-1',
    brand: 'FixtureLab',
    model: 'SG-01',
    variant: '45cm',
    workflowState: 'approved',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    affiliate: false,
    affiliateNetwork: '',
    destinationUrl: '',
    disclosure: '',
    lockedNonCommercialAfterPublish: false,
    materialRevision,
    updatedAt: '2026-11-27T00:00:00.000Z',
    evidencePacket: {
      observedAt: '2026-11-27T00:00:00.000Z',
      sources: [
        { id: 'src-1', originId: 'manufacturer' },
        { id: 'src-2', originId: 'smartstore' }
      ],
      claimEvidence: [{ claimId: 'claim-identity' }]
    },
    drafts: [
      {
        id: 'draft-1',
        title: '문제 → 판단',
        text: '싱크대 물튐 가드 구매 전 확인 기준은 브랜드·모델·상판 두께 3가지입니다. 상세 비교 정리는 프로필 쇼케이스를 참고하세요.',
        claimIds: ['claim-identity'],
        disclosure: ''
      }
    ],
    selectedDraftId: 'draft-1',
    guardian: { decision: 'pass', boundMaterialRevision: materialRevision },
    review: { decision: 'approved', stale: false, boundMaterialRevision: materialRevision },
    ...overrides
  };
}

test('CLAUDE.md §5 & §21: publisher_adapter enforces closed payload-key allowlist, blocks reply/comment variants, and checks https imageUrl', () => {
  for (const forbidden of [
    { text: '본문', reply_to_id: '179000001' },
    { text: '본문', replyToId: '179000001' },
    { text: '본문', reply_to: '179000001' },
    { text: '본문', in_reply_to: '179000001' },
    { text: '본문', autoComment: '링크는 여기!' },
    { text: '본문', replies: ['자동 첫 댓글 링크'] },
    { text: '본문', comments: ['댓글'] },
    { text: '본문', thread_chain: ['2번째 글'] },
    { text: '본문', posts: ['루트 글', '자동 이어쓰기 대댓글'] }
  ]) {
    const check = assertSingleRootPostPayload(forbidden);
    assert.equal(check.ok, false);
    assert.equal(check.code, 'AUTOMATED_REPLY_FORBIDDEN');
  }

  // Unknown non-reply fields are also rejected by the closed allowlist (`text`, `imageUrl` only)
  const unknownKey = assertSingleRootPostPayload({ text: '본문', arbitraryExtraField: true });
  assert.equal(unknownKey.ok, false);
  assert.equal(unknownKey.code, 'UNKNOWN_PAYLOAD_FIELD_FORBIDDEN');

  // Non-https imageUrl and direct reply_to_id on preview helper are rejected
  const badImg = buildRedactedThreadsPublishPreview({ text: '본문', imageUrl: 'http://insecure.example/a.jpg' });
  assert.equal(badImg.ok, false);
  assert.equal(badImg.code, 'INVALID_IMAGE_URL');
  const previewReply = buildRedactedThreadsPublishPreview({ text: '본문', reply_to_id: '123' });
  assert.equal(previewReply.ok, false);
  assert.equal(previewReply.code, 'AUTOMATED_REPLY_FORBIDDEN');

  // Stays-quiet on valid <= 500-char single root post and builds redacted preview without reply_to_id
  const validPreview = buildRedactedThreadsPublishPreview({
    text: '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.\n정품 규격 비교는 #001 카드에서 확인하세요.',
    imageUrl: 'https://cdn.fixturelab.example/owned/sg-01.jpg'
  });
  assert.equal(validPreview.ok, true);
  assert.equal(validPreview.enabled, false);
  assert.equal(validPreview.headers.Authorization, 'Bearer <redacted>');
  assert.equal('reply_to_id' in validPreview.body, false);
});

test('PUBLISHING_SPEC §§3–7 & AT-44: single-use approval, terminal invalidated lock, destination drift check, 4h price TTL, and timeout reconciliation reschedule', () => {
  let nowMs = Date.parse('2026-11-27T02:00:00.000Z');
  const registry = createThreadsPublisherRegistry({ clock: () => new Date(nowMs) });
  const candidate = makeApprovedCandidate();

  const firstSched = registry.scheduleApprovedPost({
    candidate,
    desiredLocalDatetime: '2026-11-27T08:10:00+09:00'
  });
  assert.equal(firstSched.ok, true);

  // Single-use approval hash: attempting to schedule the same approval twice is blocked!
  const replayAttempt = registry.scheduleApprovedPost({
    candidate,
    desiredLocalDatetime: '2026-11-27T12:30:00+09:00'
  });
  assert.equal(replayAttempt.ok, false);
  assert.equal(replayAttempt.code, 'APPROVAL_ALREADY_CONSUMED');

  // Case A: When activeMonetizedShowcaseCount is 0, non-commercial `/showcase` pointer passes preflight (`READY`)
  const readyPreflight = registry.runPreflight(firstSched.schedule.scheduleId, {
    candidate,
    activeMonetizedShowcaseCount: 0,
    monetizedCardNumbers: []
  });
  assert.equal(readyPreflight.ok, true);
  assert.equal(readyPreflight.status, SCHEDULE_STATES.READY);

  // Case B (`PUBLISHING_SPEC.md` §5 bullet 4): `/showcase` gains monetized `#001` -> preflight invalidates!
  const driftedPreflight = registry.runPreflight(firstSched.schedule.scheduleId, {
    candidate,
    activeMonetizedShowcaseCount: 1,
    monetizedCardNumbers: [1]
  });
  assert.equal(driftedPreflight.ok, false);
  assert.equal(driftedPreflight.status, SCHEDULE_STATES.INVALIDATED);
  assert.equal(driftedPreflight.code, 'PREFLIGHT_SOLICITATION_OR_GUARDIAN_DRIFT');

  // `INVALIDATED` is terminal until user re-approves: neither `runPreflight` nor `cancelSchedule` may bypass it (`BL-PUB-R2-1`)
  const retryInvalidated = registry.runPreflight(firstSched.schedule.scheduleId, {
    candidate,
    activeMonetizedShowcaseCount: 0,
    monetizedCardNumbers: []
  });
  assert.equal(retryInvalidated.ok, false);
  assert.equal(retryInvalidated.code, 'TERMINAL_SCHEDULE_REQUIRES_NEW_REVIEW');

  const cancelInvalidated = registry.cancelSchedule(firstSched.schedule.scheduleId);
  assert.equal(cancelInvalidated.ok, false);
  assert.equal(cancelInvalidated.code, 'CANNOT_CANCEL_NON_ACTIVE_OR_DISPATCHING');
  assert.equal(
    registry.scheduleApprovedPost({ candidate, desiredLocalDatetime: '2026-11-27T14:00:00+09:00' }).code,
    'APPROVAL_ALREADY_CONSUMED'
  );

  // §2 schedule-entry preconditions (`BL-PUB-R2-2`): Kill Switch, stale `observedAt`, missing `seller`, and missing offset-0 disclosure fail closed
  assert.equal(
    registry.scheduleApprovedPost({
      candidate: makeApprovedCandidate({ id: 'cand-ks' }),
      desiredLocalDatetime: '2026-11-27T15:00:00+09:00',
      killSwitchActive: true
    }).code,
    'KILL_SWITCH_ACTIVE'
  );
  assert.equal(
    registry.scheduleApprovedPost({
      candidate: makeApprovedCandidate({
        id: 'cand-old-obs',
        evidencePacket: {
          observedAt: '2026-11-20T00:00:00.000Z',
          sources: [{ id: 's1', originId: 'm1' }, { id: 's2', originId: 'm2' }],
          claimEvidence: [{ claimId: 'claim-identity' }]
        }
      }),
      desiredLocalDatetime: '2026-11-27T15:00:00+09:00'
    }).code,
    'EVIDENCE_TTL_EXPIRED'
  );

  // Case C (`AT-44` & `BL-PUB-R2-2`): `affiliate: true` without explicit `seller` or `destinationUrl` fails `scheduleApprovedPost` immediately
  const disclosure = '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.';
  const brokenMonetized = makeApprovedCandidate({
    id: 'cand-pub-broken',
    affiliate: true,
    affiliateNetwork: 'naver_shopping_connect',
    seller: '',
    destinationUrl: 'https://smartstore.naver.com/fixturelab/products/100',
    disclosure,
    drafts: [{ id: 'draft-1', title: '문제 → 판단', text: `${disclosure}\n본문`, claimIds: ['claim-identity'], disclosure }]
  });
  assert.equal(
    registry.scheduleApprovedPost({ candidate: brokenMonetized, desiredLocalDatetime: '2026-11-27T18:00:00+09:00' }).code,
    'INVALID_AFFILIATE_MAPPING'
  );

  // Missing offset-0 disclosure in `draft.text` fails `GUARDIAN_ENTRY_PRECONDITION_FAILED` at schedule admission
  const missingOffsetZeroDraft = makeApprovedCandidate({
    id: 'cand-pub-no-disc',
    affiliate: true,
    affiliateNetwork: 'naver_shopping_connect',
    seller: 'FixtureLab 공식몰',
    destinationUrl: 'https://smartstore.naver.com/fixturelab/products/100',
    disclosure,
    drafts: [{ id: 'draft-1', title: '문제 → 판단', text: '무고지 본문 #001 안내', claimIds: ['claim-identity'], disclosure }]
  });
  assert.equal(
    registry.scheduleApprovedPost({ candidate: missingOffsetZeroDraft, desiredLocalDatetime: '2026-11-27T18:00:00+09:00' }).code,
    'GUARDIAN_ENTRY_PRECONDITION_FAILED'
  );

  // Valid monetized candidate with explicit `seller` schedules cleanly, blocks on mutated `currentDestinationSnapshot`, and reconciles timeout
  const monetizedCand = makeApprovedCandidate({
    id: 'cand-pub-2',
    affiliate: true,
    affiliateNetwork: 'naver_shopping_connect',
    seller: 'FixtureLab 공식몰',
    destinationUrl: 'https://smartstore.naver.com/fixturelab/products/100',
    disclosure,
    drafts: [{
      id: 'draft-1',
      title: '문제 → 판단',
      text: `${disclosure}\n정품 실측 비교는 #001 카드에서 확인하세요.`,
      claimIds: ['claim-identity'],
      disclosure
    }]
  });
  const secondSched = registry.scheduleApprovedPost({
    candidate: monetizedCand,
    desiredLocalDatetime: '2026-11-27T19:00:00+09:00'
  });
  assert.equal(secondSched.ok, true);

  const pre2 = registry.runPreflight(secondSched.schedule.scheduleId, {
    candidate: monetizedCand,
    activeMonetizedShowcaseCount: 1,
    monetizedCardNumbers: [1]
  });
  assert.equal(pre2.ok, true);

  // Timeout enters `unknown_remote_state` with `remoteContainerId` recorded and blocks blind retry
  const timedOut = registry.recordDispatchOutcome(secondSched.schedule.scheduleId, {
    outcome: 'timeout',
    remoteContainerId: 'creation-container-777'
  });
  assert.equal(timedOut.status, SCHEDULE_STATES.UNKNOWN_REMOTE_STATE);
  assert.equal(registry.getSchedule(secondSched.schedule.scheduleId).remoteContainerId, 'creation-container-777');
  assert.equal(registry.runPreflight(secondSched.schedule.scheduleId, { candidate: monetizedCand }).code, 'RECONCILIATION_REQUIRED');

  // Reconciling `remoteExists: false` releases single-use approval hash so rescheduling succeeds!
  const absentReconcile = registry.reconcileUnknownRemoteState(secondSched.schedule.scheduleId, { remoteExists: false });
  assert.equal(absentReconcile.ok, true);
  assert.equal(absentReconcile.reconciledTo, SCHEDULE_STATES.FAILED);
  assert.equal(absentReconcile.repostAllowed, true);

  const rescheduled = registry.scheduleApprovedPost({
    candidate: monetizedCand,
    desiredLocalDatetime: '2026-11-27T20:00:00+09:00'
  });
  assert.equal(rescheduled.ok, true);

  // Mutating seller/model on live destination (`AT-44`) invalidates the rescheduled item
  const destDrift = registry.runPreflight(rescheduled.schedule.scheduleId, {
    candidate: monetizedCand,
    currentDestinationSnapshot: {
      brand: 'FixtureLab',
      model: 'WRONG-MODEL-999',
      variant: '45cm',
      seller: '무단변경판매자',
      destinationUrl: 'https://smartstore.naver.com/fixturelab/products/100'
    },
    activeMonetizedShowcaseCount: 1,
    monetizedCardNumbers: [1]
  });
  assert.equal(destDrift.ok, false);
  assert.equal(destDrift.code, 'DESTINATION_DRIFT_INVALIDATED');
  assert.equal(destDrift.status, SCHEDULE_STATES.INVALIDATED);

  // 4-hour price-claim TTL check
  const priceCand = makeApprovedCandidate({ id: 'cand-price-ttl', priceClaimed: true });
  const priceSched = registry.scheduleApprovedPost({ candidate: priceCand, desiredLocalDatetime: '2026-11-27T09:00:00+09:00' });
  nowMs = Date.parse('2026-11-27T05:00:00.000Z'); // +5h > 4h price TTL
  const priceExp = registry.runPreflight(priceSched.schedule.scheduleId, { candidate: priceCand });
  assert.equal(priceExp.ok, false);
  assert.equal(priceExp.code, 'EVIDENCE_TTL_EXPIRED');
  assert.equal(priceExp.status, SCHEDULE_STATES.EXPIRED);
});

test('Live-Activation Preflight & GET /api/preflight never leak secret values OR raw credential env-var names', async () => {
  const topSecretValues = ['SUPER_SECRET_THREADS_TOKEN_123', 'SUPER_SECRET_GEMINI_KEY_456', 'SUPER_SECRET_COUPANG_789'];
  const report = buildLiveActivationPreflightReport({
    environment: {
      THREADS_APP_ID: 'app-id-001',
      THREADS_ACCESS_TOKEN: topSecretValues[0],
      GEMINI_API_KEY: topSecretValues[1],
      COUPANG_PARTNERS_SECRET_KEY: topSecretValues[2],
      THREADSCOUT_GLOBAL_KILL_SWITCH: '1'
    }
  });

  assert.equal(report.externalPublishingEnabled, false);
  assert.equal(report.anyLiveNetworkEnabled, false);
  assert.equal(report.killSwitchActive, true);
  assert.ok(report.liveApiGates.every((g) => g.readyForLiveExecution === false));

  const publicWeb = toPublicWebPreflightSummary(report);
  const safeCheck = assertPublicReadModelSafe(publicWeb);
  assert.equal(safeCheck.ok, true, `Leaked env names: ${safeCheck.leaks.join(', ')}`);

  const serializedWeb = JSON.stringify(publicWeb);
  for (const secret of topSecretValues) {
    assert.equal(serializedWeb.includes(secret), false, 'secret value must never appear');
  }
  for (const envIdentifier of ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'THREADS_ACCESS_TOKEN', 'COUPANG_PARTNERS_SECRET_KEY', 'THREADSCOUT_GLOBAL_KILL_SWITCH']) {
    assert.equal(serializedWeb.includes(envIdentifier), false, `env-var identifier ${envIdentifier} must be sanitized in browser payload`);
  }

  const llmPreview = buildRedactedLlmProviderPreview('gemini');
  assert.equal(llmPreview.enabled, false);
  assert.equal(llmPreview.headers['x-goog-api-key'], '<redacted>');

  // Verify HTTP `GET /api/preflight` endpoint on server (including when zero LLM keys are set!)
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-preflight-api-'));
  const server = createThreadScoutServer({ repoRoot, dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const resp = await fetch(`${baseUrl}/api/preflight`);
    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('referrer-policy'), 'no-referrer');
    const json = await resp.json();
    assert.equal(json.ok, true);
    assert.equal(assertPublicReadModelSafe(json).ok, true);
    assert.equal(json.preflight.externalPublishingEnabled, false);
    assert.equal(json.preflight.enforcedCodeGuards.singleRootPostNoReplyToId, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
});
