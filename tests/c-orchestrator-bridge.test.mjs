import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(fn) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-orchestrator-'));
  const server = createThreadScoutServer({ repoRoot, dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
}

async function post(baseUrl, body, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/commands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  assert.equal(response.status, expectedStatus, JSON.stringify(result));
  return result;
}

async function addCandidate(baseUrl, suffix) {
  const added = await post(baseUrl, {
    requestId: `bridge-add-${suffix}`,
    command: 'add_manual_candidate',
    payload: {
      name: `오케스트레이터 경로 테스트 ${suffix}`,
      brand: 'OwnerBrand',
      model: `OB-${suffix}`,
      variant: '기본형',
      sourceRef: `owner-note:${suffix}`,
      sourceOrigin: 'manufacturer_page',
      corroborationRef: `owner-note:${suffix}-corroboration`,
      corroborationOrigin: 'marketplace_listing',
      whyNow: '사용자 제공 제품을 고정된 전문 역할 경로로 검토하는 테스트',
      readerValue: '근거와 작성 단계를 분리해 안전하게 판단할 수 있음',
      mediaRights: 'not_required',
      personalUse: 'not_confirmed'
    }
  });
  return added.today.candidates.find((item) => item.id === added.candidateId);
}

async function advanceToApproved(baseUrl, suffix) {
  let candidate = await addCandidate(baseUrl, suffix);
  for (const [command, requestId] of [
    ['request_verification', `${suffix}-verify`],
    ['request_strategies', `${suffix}-strategy`],
    ['request_drafts', `${suffix}-drafts`],
    ['run_guardian', `${suffix}-guardian`]
  ]) {
    const result = await post(baseUrl, {
      requestId,
      command,
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: {}
    });
    candidate = result.today.candidates.find((item) => item.id === candidate.id);
  }
  const approved = await post(baseUrl, {
    requestId: `${suffix}-approve`,
    command: 'review_decision',
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: { decision: 'approved' }
  });
  return approved.today.candidates.find((item) => item.id === candidate.id);
}

test('specialist commands are supervised by Orchestrator and return control to it', async () => {
  await withServer(async (baseUrl) => {
    const candidate = await addCandidate(baseUrl, '01');
    const verified = await post(baseUrl, {
      requestId: 'bridge-verify',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: {}
    });
    assert.deepEqual(verified.orchestrationReceipt.route, ['orchestrator', 'verifier', 'orchestrator']);
    assert.equal(verified.orchestrationReceipt.specialistId, 'verifier');
    assert.equal(verified.orchestrationReceipt.supervisedBy, 'orchestrator');
    assert.equal(verified.orchestrationReceipt.liveProviderUsed, false);
    assert.equal(verified.orchestrationReceipt.externalPublishingEnabled, false);

    const current = verified.today.candidates.find((item) => item.id === candidate.id);
    const strategies = await post(baseUrl, {
      requestId: 'bridge-strategy',
      command: 'request_strategies',
      candidateId: candidate.id,
      expectedRevision: current.revision
    });
    assert.deepEqual(strategies.orchestrationReceipt.route, ['orchestrator', 'strategist', 'orchestrator']);
  });
});

test('Orchestrator rejects specialist dispatch from an invalid workflow state with a failed receipt', async () => {
  await withServer(async (baseUrl) => {
    const today = await (await fetch(`${baseUrl}/api/today`)).json();
    const ready = today.candidates.find((item) => item.id === 'demo-ready-sink-guard');
    const result = await post(baseUrl, {
      requestId: 'bridge-invalid-drafts',
      command: 'request_drafts',
      candidateId: ready.id,
      expectedRevision: ready.revision
    }, 422);
    assert.equal(result.error, 'route_not_allowed');
    assert.equal(result.orchestrationReceipt.status, 'failure');
    assert.deepEqual(result.orchestrationReceipt.route, ['orchestrator', 'writer', 'orchestrator']);
    assert.equal(result.orchestrationReceipt.errorCode, 'route_not_allowed');
  });
});

test('draft mutation after approval can only recover through a new Guardian review and owner decision', async () => {
  await withServer(async (baseUrl) => {
    let candidate = await advanceToApproved(baseUrl, 'stale');
    const oldMaterialRevision = candidate.review.boundMaterialRevision;
    const draft = candidate.drafts[0];

    let result = await post(baseUrl, {
      requestId: 'stale-edit',
      command: 'edit_draft',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { draftId: draft.id, text: `${draft.text} 변경` }
    });
    candidate = result.today.candidates.find((item) => item.id === candidate.id);
    assert.equal(candidate.workflowState, 'stale');
    assert.equal(candidate.review.stale, true);
    assert.notEqual(candidate.materialRevision, oldMaterialRevision);
    assert.equal(candidate.guardian, null);

    result = await post(baseUrl, {
      requestId: 'stale-new-guardian',
      command: 'run_guardian',
      candidateId: candidate.id,
      expectedRevision: candidate.revision
    });
    candidate = result.today.candidates.find((item) => item.id === candidate.id);
    assert.equal(candidate.workflowState, 'guardian_pass');
    assert.equal(candidate.review, null);
    assert.equal(candidate.guardian.decision, 'pass');
    assert.deepEqual(result.orchestrationReceipt.route, ['orchestrator', 'guardian', 'orchestrator']);

    result = await post(baseUrl, {
      requestId: 'stale-reapprove',
      command: 'review_decision',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'approved' }
    });
    candidate = result.today.candidates.find((item) => item.id === candidate.id);
    assert.equal(candidate.workflowState, 'approved');
    assert.equal(candidate.review.stale, false);
    assert.equal(candidate.review.boundMaterialRevision, candidate.materialRevision);
    assert.notEqual(candidate.review.boundMaterialRevision, oldMaterialRevision);
  });
});
