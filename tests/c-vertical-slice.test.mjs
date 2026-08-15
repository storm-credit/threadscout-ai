import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(fn, existingDir = null) {
  const dataDir = existingDir ?? await mkdtemp(path.join(tmpdir(), 'threadscout-c-slice-'));
  const server = createThreadScoutServer({ repoRoot, dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await fn({ baseUrl, dataDir });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (!existingDir) await rm(dataDir, { recursive: true, force: true });
  }
}

async function getToday(baseUrl) {
  const response = await fetch(`${baseUrl}/api/today`);
  assert.equal(response.status, 200);
  return response.json();
}

async function command(baseUrl, body, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, JSON.stringify(payload));
  return payload;
}

function findCandidate(today, candidateId) {
  return today.candidates.find((candidate) => candidate.id === candidateId);
}

async function addManual(baseUrl, suffix = 'normal') {
  const response = await command(baseUrl, {
    requestId: `add-${suffix}`,
    command: 'add_manual_candidate',
    payload: {
      name: `수동 입력 제품 ${suffix}`,
      brand: 'OwnerBrand',
      model: `MODEL-${suffix}`,
      variant: '기본형',
      sourceRef: `owner-note:${suffix}`,
      whyNow: '사용자가 오늘 직접 검토하려고 추가한 제품이라 지금 확인할 이유가 분명함',
      readerValue: '제품 식별과 구매 전 확인 포인트를 한 화면에서 정리할 수 있음',
      mediaRights: 'not_required',
      personalUse: 'not_confirmed',
      affiliate: false
    }
  });
  return { candidateId: response.candidateId, candidate: findCandidate(response.today, response.candidateId) };
}

async function advanceToDrafts(baseUrl, suffix = 'normal') {
  const added = await addManual(baseUrl, suffix);
  let candidate = added.candidate;
  let result = await command(baseUrl, {
    requestId: `verify-${suffix}`,
    command: 'request_verification',
    candidateId: added.candidateId,
    expectedRevision: candidate.revision,
    payload: {}
  });
  candidate = findCandidate(result.today, added.candidateId);
  assert.equal(candidate.workflowState, 'evidence_ready');
  assert.equal(candidate.exactMatchStatus, 'exact');

  result = await command(baseUrl, {
    requestId: `strategy-${suffix}`,
    command: 'request_strategies',
    candidateId: added.candidateId,
    expectedRevision: candidate.revision
  });
  candidate = findCandidate(result.today, added.candidateId);
  assert.equal(candidate.strategies.angles.length, 4);

  result = await command(baseUrl, {
    requestId: `drafts-${suffix}`,
    command: 'request_drafts',
    candidateId: added.candidateId,
    expectedRevision: candidate.revision
  });
  candidate = findCandidate(result.today, added.candidateId);
  assert.equal(candidate.drafts.length, 4);
  assert.equal(new Set(candidate.drafts.map((draft) => draft.angleId)).size, 4);
  return { candidateId: added.candidateId, candidate };
}

test('Opportunity Inbox keeps score separate from evidence and caps primary cards at five', async () => {
  await withServer(async ({ baseUrl }) => {
    const today = await getToday(baseUrl);
    assert.equal(today.externalPublishingEnabled, false);
    assert.equal(today.fixedAgentCount, 6);
    assert.ok(today.candidates.length <= 5);
    const unresolved = findCandidate(today, 'demo-unresolved-high-score');
    assert.equal(unresolved.opportunityScore, 96);
    assert.equal(unresolved.exactMatchStatus, 'unresolved');
    assert.equal(unresolved.nextAction.label, '근거 확인');
    assert.equal(unresolved.nextAction.action, 'open_workspace');
  });
});

test('manual product reaches four strategies, four drafts, Guardian pass, and bound owner approval', async () => {
  await withServer(async ({ baseUrl }) => {
    const { candidateId, candidate: drafted } = await advanceToDrafts(baseUrl, 'approve');
    let result = await command(baseUrl, {
      requestId: 'guardian-approve',
      command: 'run_guardian',
      candidateId,
      expectedRevision: drafted.revision
    });
    let candidate = findCandidate(result.today, candidateId);
    assert.equal(candidate.guardian.decision, 'pass');
    assert.equal(candidate.workflowState, 'guardian_pass');

    result = await command(baseUrl, {
      requestId: 'decision-approve',
      command: 'review_decision',
      candidateId,
      expectedRevision: candidate.revision,
      payload: { decision: 'approved' }
    });
    candidate = findCandidate(result.today, candidateId);
    assert.equal(candidate.workflowState, 'approved');
    assert.equal(candidate.review.decision, 'approved');
    assert.equal(candidate.review.stale, false);
    assert.equal(candidate.review.boundMaterialRevision, candidate.materialRevision);
    assert.equal(result.today.externalPublishingEnabled, false);
  });
});

test('material draft change after approval marks review stale and stale client CAS is rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const { candidateId, candidate: drafted } = await advanceToDrafts(baseUrl, 'stale');
    let result = await command(baseUrl, {
      requestId: 'guardian-stale',
      command: 'run_guardian',
      candidateId,
      expectedRevision: drafted.revision
    });
    let candidate = findCandidate(result.today, candidateId);
    result = await command(baseUrl, {
      requestId: 'approve-stale',
      command: 'review_decision',
      candidateId,
      expectedRevision: candidate.revision,
      payload: { decision: 'approved' }
    });
    candidate = findCandidate(result.today, candidateId);
    const approvedRevision = candidate.revision;
    const draft = candidate.drafts[0];

    result = await command(baseUrl, {
      requestId: 'edit-after-approval',
      command: 'edit_draft',
      candidateId,
      expectedRevision: approvedRevision,
      payload: { draftId: draft.id, text: `${draft.text} 수정됨` }
    });
    candidate = findCandidate(result.today, candidateId);
    assert.equal(candidate.workflowState, 'stale');
    assert.equal(candidate.review.stale, true);
    assert.match(candidate.topBlocker, /다시 검토/);

    const conflict = await command(baseUrl, {
      requestId: 'stale-mobile-approve',
      command: 'review_decision',
      candidateId,
      expectedRevision: approvedRevision,
      payload: { decision: 'approved' }
    }, 409);
    assert.equal(conflict.error, 'version_conflict');
    assert.equal(findCandidate(conflict.today, candidateId).revision, candidate.revision);
  });
});

test('duplicate requestId is idempotent and does not apply the command twice', async () => {
  await withServer(async ({ baseUrl }) => {
    const added = await addManual(baseUrl, 'idem');
    const body = {
      requestId: 'verify-idempotent',
      command: 'request_verification',
      candidateId: added.candidateId,
      expectedRevision: added.candidate.revision,
      payload: {}
    };
    const first = await command(baseUrl, body);
    const firstRevision = findCandidate(first.today, added.candidateId).revision;
    const second = await command(baseUrl, body);
    assert.equal(second.idempotentReplay, true);
    assert.equal(findCandidate(second.today, added.candidateId).revision, firstRevision);
  });
});

test('high opportunity score cannot bypass unresolved evidence gate', async () => {
  await withServer(async ({ baseUrl }) => {
    const today = await getToday(baseUrl);
    const unresolved = findCandidate(today, 'demo-unresolved-high-score');
    const response = await command(baseUrl, {
      requestId: 'high-score-strategy',
      command: 'request_strategies',
      candidateId: unresolved.id,
      expectedRevision: unresolved.revision
    }, 422);
    assert.equal(response.error, 'evidence_not_ready');
  });
});

test('Guardian independently rejects fake first-hand wording without a usage record', async () => {
  await withServer(async ({ baseUrl }) => {
    const { candidateId, candidate: drafted } = await advanceToDrafts(baseUrl, 'firsthand');
    const draft = drafted.drafts[0];
    let result = await command(baseUrl, {
      requestId: 'edit-firsthand',
      command: 'edit_draft',
      candidateId,
      expectedRevision: drafted.revision,
      payload: { draftId: draft.id, text: '직접 써보니 무조건 좋았습니다.' }
    });
    let candidate = findCandidate(result.today, candidateId);
    result = await command(baseUrl, {
      requestId: 'guardian-firsthand',
      command: 'run_guardian',
      candidateId,
      expectedRevision: candidate.revision
    });
    candidate = findCandidate(result.today, candidateId);
    assert.equal(candidate.guardian.decision, 'revise');
    assert.match(candidate.guardian.blockers.join(' '), /직접 사용 기록/);
  });
});

test('server-owned state survives browser/server reload when the same data directory is reused', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-c-persist-'));
  try {
    let candidateId;
    await withServer(async ({ baseUrl }) => {
      const added = await addManual(baseUrl, 'persist');
      candidateId = added.candidateId;
      await command(baseUrl, {
        requestId: 'verify-persist',
        command: 'request_verification',
        candidateId,
        expectedRevision: added.candidate.revision,
        payload: {}
      });
    }, dataDir);

    await withServer(async ({ baseUrl }) => {
      const today = await getToday(baseUrl);
      const candidate = findCandidate(today, candidateId);
      assert.ok(candidate);
      assert.equal(candidate.workflowState, 'evidence_ready');
      assert.equal(candidate.revision, 2);
    }, dataDir);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('API read model never exposes credential variable names or enables publishing', async () => {
  await withServer(async ({ baseUrl }) => {
    const today = await getToday(baseUrl);
    const text = JSON.stringify(today);
    assert.doesNotMatch(text, /THREADS_ACCESS_TOKEN|NAVER_API_HUB_CLIENT_SECRET|COUPANG_WING_SECRET_KEY/);
    assert.equal(today.capability.externalPublishingEnabled, false);
    assert.match(today.capability.persistence, /server_/);
  });
});
