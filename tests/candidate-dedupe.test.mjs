import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(fn, existingDir = null) {
  const dataDir = existingDir ?? await mkdtemp(path.join(tmpdir(), 'threadscout-dedupe-'));
  const server = createThreadScoutServer({ repoRoot, dataDir });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn({ baseUrl, dataDir });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (!existingDir) await rm(dataDir, { recursive: true, force: true });
  }
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

function productPayload(overrides = {}) {
  return {
    name: '접이식 싱크대 물튐 방지 가드',
    brand: 'Owner Brand',
    model: 'SG-100',
    variant: '투명 45 cm',
    sourceRef: 'owner-note:primary',
    whyNow: '설거지 물튐 문제를 짧은 전후 장면으로 확인할 수 있어서 지금 검토 가치가 있음',
    readerValue: '비슷한 제품 중 실제 모델과 옵션을 구분해 구매 실수를 줄일 수 있음',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    affiliate: false,
    ...overrides
  };
}

async function add(baseUrl, requestId, payload) {
  return command(baseUrl, { requestId, command: 'add_manual_candidate', payload });
}

function candidateById(today, id) {
  return today.candidates.find((candidate) => candidate.id === id);
}

test('same normalized brand+model+variant is suppressed as an exact duplicate', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await add(baseUrl, 'dedupe-exact-first', productPayload());
    const second = await add(baseUrl, 'dedupe-exact-second', productPayload({
      name: '다른 표시명이어도 같은 실제 상품',
      brand: 'OWNER-BRAND',
      model: 'sg 100',
      variant: '투명-45cm',
      sourceRef: 'owner-note:second-source'
    }));

    assert.equal(second.result, 'candidate_duplicate_suppressed');
    assert.equal(second.candidateId, first.candidateId);
    assert.equal(second.duplicateAssessment.state, 'exact_duplicate_suppressed');
    assert.deepEqual(second.duplicateAssessment.reasons, ['brand_model_variant_match']);
    assert.equal(second.today.counters.observed, 3);
  });
});

test('same source reference never overrides conflicting product identity', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'source-mutation-first', productPayload({ sourceRef: 'https://shop.example/item/123' }));
    const second = await add(baseUrl, 'source-mutation-second', productPayload({
      name: '완전히 다른 모델 상품',
      model: 'SG-200',
      variant: '검정 60cm',
      sourceRef: 'https://shop.example/item/123'
    }));

    assert.equal(second.result, 'candidate_added');
    assert.equal(candidateById(second.today, second.candidateId).duplicateAssessment.state, 'unique');
  });
});

test('high-overlap name with incomplete identity enters explicit duplicate review', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await add(baseUrl, 'possible-first', productPayload());
    const second = await add(baseUrl, 'possible-second', productPayload({
      name: '싱크대 접이식 물튐 방지 가드',
      model: '',
      sourceRef: 'owner-note:possible'
    }));
    const candidate = candidateById(second.today, second.candidateId);

    assert.equal(second.result, 'candidate_added_possible_duplicate');
    assert.equal(candidate.workflowState, 'duplicate_review');
    assert.equal(candidate.duplicateAssessment.state, 'possible_duplicate');
    assert.equal(candidate.duplicateAssessment.matchedCandidate.candidateId, first.candidateId);
    assert.match(candidate.topBlocker, /유사 후보 확인 필요/);

    const blocked = await command(baseUrl, {
      requestId: 'possible-verifier-blocked',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: {}
    }, 422);
    assert.equal(blocked.error, 'duplicate_review_required');
  });
});

test('pending duplicate review cannot be bypassed with hold or rejection decisions', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'decision-guard-first', productPayload());
    const possible = await add(baseUrl, 'decision-guard-possible', productPayload({
      name: '싱크대 접이식 물튐 방지 가드',
      model: '',
      sourceRef: 'owner-note:decision-guard'
    }));
    const candidate = candidateById(possible.today, possible.candidateId);

    for (const decision of ['held', 'rejected']) {
      const blocked = await command(baseUrl, {
        requestId: `decision-guard-${decision}`,
        command: 'review_decision',
        candidateId: candidate.id,
        expectedRevision: candidate.revision,
        payload: { decision }
      }, 422);
      assert.equal(blocked.error, 'duplicate_review_required');
      assert.equal(blocked.orchestrationReceipt.status, 'failure');
    }

    const today = await (await fetch(`${baseUrl}/api/today`)).json();
    assert.equal(candidateById(today, candidate.id).workflowState, 'duplicate_review');
  });
});

test('known different model or variant is not collapsed by similar display name', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'identity-conflict-first', productPayload());
    const modelDifferent = await add(baseUrl, 'identity-conflict-model', productPayload({ model: 'SG-200', sourceRef: 'owner-note:model-different' }));
    const variantDifferent = await add(baseUrl, 'identity-conflict-variant', productPayload({ model: 'SG-100', variant: '투명 60cm', sourceRef: 'owner-note:variant-different' }));

    assert.equal(modelDifferent.result, 'candidate_added');
    assert.equal(candidateById(modelDifferent.today, modelDifferent.candidateId).duplicateAssessment.state, 'unique');
    assert.equal(variantDifferent.result, 'candidate_added');
    assert.equal(candidateById(variantDifferent.today, variantDifferent.candidateId).duplicateAssessment.state, 'unique');
  });
});

test('owner can confirm a possible duplicate is distinct and resume verification', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'distinct-first', productPayload());
    const possible = await add(baseUrl, 'distinct-possible', productPayload({ name: '싱크대 접이식 물튐 방지 가드', model: '', sourceRef: 'owner-note:distinct' }));
    let candidate = candidateById(possible.today, possible.candidateId);
    const oldRevision = candidate.revision;

    const resolved = await command(baseUrl, {
      requestId: 'resolve-distinct',
      command: 'resolve_duplicate',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'distinct' }
    });
    candidate = candidateById(resolved.today, candidate.id);
    assert.equal(resolved.result, 'duplicate_resolved_distinct');
    assert.equal(candidate.duplicateAssessment.state, 'confirmed_distinct');
    assert.equal(candidate.workflowState, 'verification_needed');
    assert.ok(candidate.revision > oldRevision);

    const verified = await command(baseUrl, {
      requestId: 'verify-after-distinct',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { model: 'SG-101' }
    });
    assert.equal(candidateById(verified.today, candidate.id).workflowState, 'evidence_ready');
  });
});

test('an unchanged confirmed-distinct identity is not repeatedly reopened', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'stable-distinct-first', productPayload());
    const possible = await add(baseUrl, 'stable-distinct-possible', productPayload({
      name: '싱크대 접이식 물튐 방지 가드',
      model: '',
      sourceRef: 'owner-note:stable-distinct'
    }));
    let candidate = candidateById(possible.today, possible.candidateId);
    const resolved = await command(baseUrl, {
      requestId: 'stable-distinct-resolve',
      command: 'resolve_duplicate',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'distinct' }
    });
    candidate = candidateById(resolved.today, candidate.id);

    const verified = await command(baseUrl, {
      requestId: 'stable-distinct-verify',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { sourceRef: 'owner-note:stable-distinct-updated-source' }
    });
    const updated = candidateById(verified.today, candidate.id);
    assert.notEqual(updated.workflowState, 'duplicate_review');
    assert.equal(updated.duplicateAssessment.state, 'confirmed_distinct');
  });
});

test('identity changed during verification is rechecked and exact duplicates are suppressed', async () => {
  await withServer(async ({ baseUrl, dataDir }) => {
    const canonical = await add(baseUrl, 'mutation-canonical', productPayload());
    const second = await add(baseUrl, 'mutation-second', productPayload({
      model: 'SG-200',
      sourceRef: 'owner-note:mutation-second'
    }));
    const candidate = candidateById(second.today, second.candidateId);
    assert.equal(candidate.duplicateAssessment.state, 'unique');

    const verification = await command(baseUrl, {
      requestId: 'mutation-becomes-exact',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { model: 'SG-100' }
    });

    assert.equal(verification.result, 'candidate_duplicate_suppressed');
    assert.equal(verification.duplicateAssessment.state, 'exact_duplicate_suppressed');
    assert.equal(verification.duplicateAssessment.matchedCandidate.candidateId, canonical.candidateId);
    assert.equal(candidateById(verification.today, candidate.id), undefined);

    const state = JSON.parse(await readFile(path.join(dataDir, 'application-state.json'), 'utf8'));
    const persisted = state.candidates.find((item) => item.id === candidate.id);
    assert.equal(persisted.workflowState, 'suppressed_duplicate');
    assert.ok(state.audit.some((entry) => entry.event === 'candidate_exact_duplicate_suppressed_after_verification' && entry.candidateId === candidate.id));
  });
});

test('identity changed during verification can reopen possible duplicate review', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'reopen-canonical', productPayload());
    const second = await add(baseUrl, 'reopen-second', productPayload({
      model: 'SG-200',
      sourceRef: 'owner-note:reopen-second'
    }));
    const candidate = candidateById(second.today, second.candidateId);

    const verification = await command(baseUrl, {
      requestId: 'reopen-clear-model',
      command: 'request_verification',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { model: '' }
    });
    const updated = candidateById(verification.today, candidate.id);

    assert.equal(verification.result, 'candidate_verification_possible_duplicate');
    assert.equal(updated.workflowState, 'duplicate_review');
    assert.equal(updated.duplicateAssessment.state, 'possible_duplicate');
  });
});

test('possible duplicate review is portfolio-prioritized into the bounded five-card inbox', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'portfolio-canonical', productPayload({ opportunityScore: 10 }));
    for (let i = 0; i < 5; i += 1) {
      await add(baseUrl, `portfolio-high-${i}`, productPayload({
        name: `고득점 별도 제품 ${i}`,
        brand: `Distinct Brand ${i}`,
        model: `D-${i}`,
        variant: `V-${i}`,
        sourceRef: `owner-note:portfolio-${i}`,
        opportunityScore: 100 - i
      }));
    }

    const possible = await add(baseUrl, 'portfolio-possible', productPayload({
      name: '싱크대 접이식 물튐 방지 가드',
      model: '',
      sourceRef: 'owner-note:portfolio-possible',
      opportunityScore: 1
    }));

    assert.equal(possible.today.candidates.length, 5);
    assert.ok(possible.today.candidates.some((candidate) => candidate.id === possible.candidateId));
    assert.equal(candidateById(possible.today, possible.candidateId).workflowState, 'duplicate_review');
  });
});

test('owner can suppress a possible duplicate while preserving auditable state', async () => {
  await withServer(async ({ baseUrl, dataDir }) => {
    await add(baseUrl, 'suppress-first', productPayload());
    const possible = await add(baseUrl, 'suppress-possible', productPayload({ name: '싱크대 접이식 물튐 방지 가드', model: '', sourceRef: 'owner-note:suppress' }));
    const candidate = candidateById(possible.today, possible.candidateId);

    const suppressed = await command(baseUrl, {
      requestId: 'resolve-suppress',
      command: 'resolve_duplicate',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'duplicate' }
    });

    assert.equal(suppressed.result, 'candidate_duplicate_suppressed');
    assert.equal(candidateById(suppressed.today, candidate.id), undefined);
    assert.equal(suppressed.today.counters.duplicateSuppressed, 1);

    const state = JSON.parse(await readFile(path.join(dataDir, 'application-state.json'), 'utf8'));
    const persisted = state.candidates.find((item) => item.id === candidate.id);
    assert.equal(persisted.workflowState, 'suppressed_duplicate');
    assert.equal(persisted.duplicateAssessment.state, 'confirmed_duplicate');
    assert.ok(state.audit.some((entry) => entry.event === 'duplicate_candidate_suppressed' && entry.candidateId === candidate.id));
  });
});

test('duplicate-resolution uses candidate revision CAS and stale owner decisions fail', async () => {
  await withServer(async ({ baseUrl }) => {
    await add(baseUrl, 'cas-first', productPayload());
    const possible = await add(baseUrl, 'cas-possible', productPayload({ name: '싱크대 접이식 물튐 방지 가드', model: '', sourceRef: 'owner-note:cas' }));
    const candidate = candidateById(possible.today, possible.candidateId);

    await command(baseUrl, {
      requestId: 'cas-resolve-distinct',
      command: 'resolve_duplicate',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'distinct' }
    });

    const stale = await command(baseUrl, {
      requestId: 'cas-stale-resolution',
      command: 'resolve_duplicate',
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: { decision: 'duplicate' }
    }, 409);
    assert.equal(stale.error, 'version_conflict');
    assert.equal(stale.orchestrationReceipt.status, 'failure');
  });
});

test('exact duplicate suppression is idempotent and survives server reload', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-dedupe-persist-'));
  try {
    let canonicalId;
    await withServer(async ({ baseUrl }) => {
      const first = await add(baseUrl, 'persist-canonical', productPayload());
      canonicalId = first.candidateId;
    }, dataDir);

    await withServer(async ({ baseUrl }) => {
      const body = {
        requestId: 'persist-duplicate',
        command: 'add_manual_candidate',
        payload: productPayload({ sourceRef: 'owner-note:after-reload' })
      };
      const first = await command(baseUrl, body);
      const second = await command(baseUrl, body);
      assert.equal(first.result, 'candidate_duplicate_suppressed');
      assert.equal(first.candidateId, canonicalId);
      assert.equal(second.idempotentReplay, true);
      assert.equal(second.result, 'candidate_duplicate_suppressed');
      assert.equal(second.candidateId, canonicalId);
      assert.equal(second.today.capability.liveSourcesEnabled, false);
      assert.equal(second.today.capability.externalPublishingEnabled, false);
      assert.equal(second.today.capability.duplicateGuardrail, 'deterministic_exact_plus_human_reviewed_possible_duplicate');
    }, dataDir);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});
