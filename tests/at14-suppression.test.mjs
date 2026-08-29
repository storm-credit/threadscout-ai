// AT-14 / PR-14 / F18 — owner suppression.
//
// Contract under test: docs/implementation/USER_SUPPRESSION_PLAN.md section 4.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(fn, existingDir = null) {
  const dataDir = existingDir ?? await mkdtemp(path.join(tmpdir(), 'threadscout-at14-'));
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

async function today(baseUrl) {
  const response = await fetch(`${baseUrl}/api/today`);
  assert.equal(response.status, 200);
  return response.json();
}

let seq = 0;
const rid = (label) => `${label}-${++seq}-${Math.random().toString(16).slice(2)}`;

function productPayload(overrides = {}) {
  return {
    name: '접이식 싱크대 물튐 방지 가드',
    brand: 'Owner Brand',
    model: 'SG-100',
    variant: '투명 45 cm',
    sourceRef: 'owner-note:primary',
    sourceOrigin: 'manufacturer_page',
    corroborationRef: 'owner-note:primary-corroboration',
    corroborationOrigin: 'marketplace_listing',
    whyNow: '설거지 물튐 문제를 짧은 전후 장면으로 확인할 수 있어서 지금 검토 가치가 있음',
    readerValue: '비슷한 제품 중 실제 모델과 옵션을 구분해 구매 실수를 줄일 수 있음',
    mediaRights: 'not_required',
    personalUse: 'not_confirmed',
    affiliate: false,
    ...overrides
  };
}

async function addCandidate(baseUrl, overrides = {}) {
  const response = await command(baseUrl, {
    requestId: rid('add'),
    command: 'add_manual_candidate',
    payload: productPayload(overrides)
  });
  return response.candidateId;
}

function findCandidate(todayModel, candidateId) {
  return (todayModel.candidates ?? []).find((candidate) => candidate.id === candidateId) ?? null;
}

function findExcluded(todayModel, candidateId) {
  return (todayModel.excluded ?? []).find((candidate) => candidate.id === candidateId) ?? null;
}

async function revisionOf(baseUrl, candidateId) {
  const model = await today(baseUrl);
  const candidate = findCandidate(model, candidateId) ?? findExcluded(model, candidateId);
  assert.ok(candidate, `candidate ${candidateId} not present in read model`);
  return candidate.revision;
}

test('AT-14: suppression is honored by future candidate selection until reversed', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { name: '억제 대상 제품', brand: '억제브랜드' });

    const before = await today(baseUrl);
    assert.ok(findCandidate(before, candidateId), 'candidate should start in the inbox');

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand', reason: '이 브랜드는 더 이상 다루지 않기로 함' }
    });

    const after = await today(baseUrl);
    assert.equal(findCandidate(after, candidateId), null, 'suppressed candidate must leave the inbox');

    const excluded = findExcluded(after, candidateId);
    assert.ok(excluded, 'suppressed candidate must remain visible as excluded, not deleted');
    assert.equal(excluded.exclusionReason.reason, 'owner_suppressed');
    assert.equal(excluded.suppression.active, true);
    assert.equal(excluded.suppression.axis, 'brand');
  });
});

test('PR-14: the reason is required, recorded, and inspectable on the rule', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '사유브랜드' });

    await command(baseUrl, {
      requestId: rid('noreason'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand' }
    }, 422);

    await command(baseUrl, {
      requestId: rid('withreason'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand', reason: '광고성 제품이 많아 제외' }
    });

    const model = await today(baseUrl);
    assert.equal(model.suppressionRules.length, 1);
    assert.equal(model.suppressionRules[0].reason, '광고성 제품이 많아 제외');
    assert.equal(model.suppressionRules[0].axis, 'brand');
    assert.equal(model.suppressionRules[0].matchedCandidateCount, 1);
  });
});

test('Q2: 복원 exempts only that candidate and leaves the rule standing', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await addCandidate(baseUrl, { name: '첫 제품', brand: '공통브랜드', model: 'A-1' });
    const second = await addCandidate(baseUrl, { name: '둘째 제품', brand: '공통브랜드', model: 'B-2' });

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId: first,
      expectedRevision: await revisionOf(baseUrl, first),
      payload: { axis: 'brand', reason: '이 브랜드 제외' }
    });

    let model = await today(baseUrl);
    assert.equal(model.counters.ownerSuppressed, 2, 'one rule suppresses every matching candidate');

    await command(baseUrl, {
      requestId: rid('restore'),
      command: 'restore_candidate',
      candidateId: first,
      expectedRevision: await revisionOf(baseUrl, first),
      payload: {}
    });

    model = await today(baseUrl);
    assert.ok(findCandidate(model, first), 'restored candidate returns to the inbox');
    assert.equal(findCandidate(model, second), null, 'the rule still suppresses the other candidate');
    assert.equal(model.suppressionRules.length, 1, 'restore must not delete the rule');
    assert.equal(model.counters.ownerSuppressed, 1);
  });
});

test('removing the rule releases every candidate it suppressed', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '해제브랜드' });

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand', reason: '임시 제외' }
    });

    const ruleId = (await today(baseUrl)).suppressionRules[0].id;

    await command(baseUrl, {
      requestId: rid('removerule'),
      command: 'remove_suppression_rule',
      payload: { ruleId }
    });

    const model = await today(baseUrl);
    assert.equal(model.suppressionRules.length, 0);
    assert.ok(findCandidate(model, candidateId), 'candidate returns once the rule is gone');
  });
});

test('suppression survives reload and an independent store instance', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-at14-persist-'));
  try {
    const candidateId = await withServer(async ({ baseUrl }) => {
      const id = await addCandidate(baseUrl, { brand: '지속브랜드' });
      await command(baseUrl, {
        requestId: rid('suppress'),
        command: 'suppress_candidate',
        candidateId: id,
        expectedRevision: await revisionOf(baseUrl, id),
        payload: { axis: 'brand', reason: '영구 제외' }
      });
      return id;
    }, dataDir);

    await withServer(async ({ baseUrl }) => {
      const model = await today(baseUrl);
      assert.equal(findCandidate(model, candidateId), null, 'suppression must survive a fresh store instance');
      assert.equal(model.suppressionRules.length, 1);
      assert.equal(model.suppressionRules[0].reason, '영구 제외');
    }, dataDir);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('stale suppression and restore revisions fail through the existing CAS boundary', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: 'CAS브랜드' });
    const staleRevision = await revisionOf(baseUrl, candidateId);

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: staleRevision,
      payload: { axis: 'brand', reason: '첫 억제' }
    });

    const conflict = await command(baseUrl, {
      requestId: rid('stale'),
      command: 'restore_candidate',
      candidateId,
      expectedRevision: staleRevision,
      payload: {}
    }, 409);
    assert.equal(conflict.error, 'version_conflict');
  });
});

test('duplicate request ids are idempotent and do not create a second rule', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '중복요청브랜드' });
    const expectedRevision = await revisionOf(baseUrl, candidateId);
    const requestId = rid('idem');
    const body = {
      requestId,
      command: 'suppress_candidate',
      candidateId,
      expectedRevision,
      payload: { axis: 'brand', reason: '한 번만 적용되어야 함' }
    };

    const first = await command(baseUrl, body);
    assert.equal(first.idempotentReplay, false);
    const second = await command(baseUrl, body);
    assert.equal(second.idempotentReplay, true);

    assert.equal((await today(baseUrl)).suppressionRules.length, 1);
  });
});

test('owner suppression and suppressed_duplicate stay distinguishable', async () => {
  await withServer(async ({ baseUrl }) => {
    const original = await addCandidate(baseUrl, { name: '원본 제품', brand: '구분브랜드', model: 'D-1', variant: 'v1' });
    // An exact duplicate is suppressed at ingestion by the dedupe guardrail, untouched by this slice.
    const duplicate = await command(baseUrl, {
      requestId: rid('dup'),
      command: 'add_manual_candidate',
      payload: productPayload({ name: '원본 제품', brand: '구분브랜드', model: 'D-1', variant: 'v1' })
    });
    assert.equal(duplicate.result, 'candidate_duplicate_suppressed');

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId: original,
      expectedRevision: await revisionOf(baseUrl, original),
      payload: { axis: 'product', reason: '이 제품은 안 다룸' }
    });

    const model = await today(baseUrl);
    const excluded = findExcluded(model, original);
    assert.ok(excluded);
    assert.equal(excluded.exclusionReason.reason, 'owner_suppressed', 'owner suppression has its own reason code');
    assert.notEqual(excluded.workflowState, 'suppressed_duplicate', 'owner suppression must not reuse the dedupe state');
    assert.equal(model.counters.ownerSuppressed, 1);
    assert.equal(model.counters.duplicateSuppressed, 0, 'the exact duplicate was dropped at ingestion, not stored as suppressed');
  });
});

test('an expired rule stops suppressing without any write', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '만료브랜드' });

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: {
        axis: 'brand',
        reason: '이번 주만 제외',
        expiresAt: new Date(Date.now() + 250).toISOString()
      }
    });

    assert.equal(findCandidate(await today(baseUrl), candidateId), null, 'suppressed while the rule is live');
    await new Promise((resolve) => setTimeout(resolve, 400));
    assert.ok(findCandidate(await today(baseUrl), candidateId), 'returns once the rule expires, with no command in between');
  });
});

test('an unsupported suppression axis is rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl);
    const failure = await command(baseUrl, {
      requestId: rid('badaxis'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'colour', reason: '지원하지 않는 축' }
    }, 422);
    assert.equal(failure.error, 'invalid_input');
  });
});

test('suppressing on an axis the candidate has no value for is rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '' });
    const failure = await command(baseUrl, {
      requestId: rid('emptyaxis'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand', reason: '값이 없는 축' }
    }, 422);
    assert.equal(failure.error, 'suppression_axis_empty');
  });
});

test('restoring a candidate that is not suppressed is rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl);
    const failure = await command(baseUrl, {
      requestId: rid('notsuppressed'),
      command: 'restore_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: {}
    }, 422);
    assert.equal(failure.error, 'not_suppressed');
  });
});

test('every suppression command carries an Orchestrator receipt on the human route', async () => {
  await withServer(async ({ baseUrl }) => {
    const candidateId = await addCandidate(baseUrl, { brand: '영수증브랜드' });
    const response = await command(baseUrl, {
      requestId: rid('receipt'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: { axis: 'brand', reason: '영수증 확인' }
    });

    assert.ok(response.orchestrationReceipt, 'suppression must be dispatched through the Orchestrator');
    assert.deepEqual(response.orchestrationReceipt.route, ['orchestrator', 'human_approval', 'orchestrator']);
    assert.equal(response.orchestrationReceipt.specialistId, null, 'suppression is not specialist work');
    assert.equal(response.orchestrationReceipt.liveProviderUsed, false);
    assert.equal(response.orchestrationReceipt.externalPublishingEnabled, false);
  });
});

test('suppression does not enable any live capability', async () => {
  await withServer(async ({ baseUrl }) => {
    const health = await (await fetch(`${baseUrl}/api/health`)).json();
    assert.equal(health.externalPublishingEnabled, false);
    assert.equal(health.ownerSuppression, 'deterministic_faceted_rules_unordered_any_match');

    const model = await today(baseUrl);
    assert.equal(model.capability.liveSourcesEnabled, false);
    assert.equal(model.capability.externalPublishingEnabled, false);
    assert.equal(model.capability.ownerSuppression, 'deterministic_faceted_rules_unordered_any_match');
  });
});


test('suppression does not resolve or discard a pending duplicate review', async () => {
  await withServer(async ({ baseUrl }) => {
    await addCandidate(baseUrl);
    const possible = await command(baseUrl, {
      requestId: rid('possible'),
      command: 'add_manual_candidate',
      payload: productPayload({
        name: '싱크대 접이식 물튐 방지 가드',
        model: '',
        sourceRef: 'owner-note:at14-possible'
      })
    });
    assert.equal(possible.result, 'candidate_added_possible_duplicate');
    const candidateId = possible.candidateId;

    const pending = findCandidate(await today(baseUrl), candidateId);
    assert.equal(pending.workflowState, 'duplicate_review', 'precondition: a duplicate review is pending');

    await command(baseUrl, {
      requestId: rid('suppress'),
      command: 'suppress_candidate',
      candidateId,
      expectedRevision: pending.revision,
      payload: { axis: 'brand', reason: '이 브랜드는 제외' }
    });

    // Suppression takes it out of the inbox but must not answer the duplicate question, which is a
    // different question owned by a different gate.
    const excluded = findExcluded(await today(baseUrl), candidateId);
    assert.ok(excluded, 'still present in state, not deleted');
    assert.equal(excluded.workflowState, 'duplicate_review', 'the duplicate review is still pending');
    assert.equal(excluded.suppression.active, true, 'and it is independently suppressed');
    assert.match(excluded.blockers.join(' '), /유사 후보 확인 필요/, 'the duplicate blocker is still standing');

    // Read-model gap, recorded in USER_SUPPRESSION_ACCEPTANCE.md: the dedupe layer decorates only
    // the selected five with `duplicateAssessment`, so an excluded candidate does not carry it.
    // Before this slice a pending duplicate review was always priority-included in the inbox and
    // so never appeared under `excluded`; suppression is what first produces that combination.
    assert.equal(excluded.duplicateAssessment, undefined, 'documents the current gap rather than asserting a fix');

    // Restoring brings the candidate — and its assessment — back into view.
    await command(baseUrl, {
      requestId: rid('restore'),
      command: 'restore_candidate',
      candidateId,
      expectedRevision: await revisionOf(baseUrl, candidateId),
      payload: {}
    });
    const restored = findCandidate(await today(baseUrl), candidateId);
    assert.equal(restored.workflowState, 'duplicate_review');
    assert.equal(restored.duplicateAssessment.state, 'possible_duplicate');
  });
});

// Q3 identity drift is unit-tested rather than driven through HTTP on purpose.
//
// A suppressed candidate leaves `today.candidates`, and the Orchestrator resolves a dispatch
// target only from that five-card list, so `request_verification` on a suppressed candidate is
// rejected with 404 before it reaches the store. Identity therefore cannot drift under a live rule
// through the HTTP API as the manual slice stands today. The branch is kept because the guarantee
// it encodes — an identity edit must never silently un-suppress — should hold if a later slice
// widens the dispatch view, and it is proven at the level where it is reachable.
// Recorded in USER_SUPPRESSION_ACCEPTANCE.md rather than left as an untested claim.
test('Q3 (unit): an identity change under a live rule keeps suppression and flags re-decision', async () => {
  const { assessSuppression, createSuppressionRule } = await import('../apps/web/candidate-suppression.mjs');

  const rule = createSuppressionRule({
    id: 'rule-1',
    axis: 'brand',
    value: '드리프트브랜드',
    reason: '이 브랜드 제외',
    createdAt: '2026-08-28T00:00:00.000Z'
  });

  const candidate = { brand: '드리프트브랜드', name: '제품', lane: 'practical-novel', sourceOrigin: 'manufacturer_page' };
  candidate.suppression = assessSuppression(candidate, [rule], { at: '2026-08-28T00:00:01.000Z' });
  assert.equal(candidate.suppression.active, true);
  assert.deepEqual(candidate.suppression.matchedRuleIds, ['rule-1']);

  // The Verifier corrects the brand. The rule is untouched and still live.
  candidate.brand = '정정된브랜드';
  const drifted = assessSuppression(candidate, [rule], { at: '2026-08-28T00:00:02.000Z' });
  assert.equal(drifted.active, true, 'an identity edit must not silently un-suppress');
  assert.equal(drifted.identityChanged, true);
  assert.equal(drifted.needsReDecision, true);

  // Withdrawing the rule is a different cause and must release, which is the distinction the
  // first implementation collapsed.
  const released = assessSuppression(candidate, [], { at: '2026-08-28T00:00:03.000Z' });
  assert.equal(released.active, false);
  assert.equal(released.needsReDecision, false);
});

test('rule-set order never changes the outcome', async () => {
  const { assessSuppression, createSuppressionRule } = await import('../apps/web/candidate-suppression.mjs');
  const mk = (id, axis, value, createdAt) => createSuppressionRule({ id, axis, value, reason: 'r', createdAt });

  const rules = [
    mk('r-b', 'brand', '공통브랜드', '2026-08-28T00:00:02.000Z'),
    mk('r-a', 'product', '제품', '2026-08-28T00:00:01.000Z'),
    mk('r-c', 'category', 'practical-novel', '2026-08-28T00:00:03.000Z')
  ];
  const candidate = { brand: '공통브랜드', name: '제품', lane: 'practical-novel', sourceOrigin: '' };

  const forward = assessSuppression({ ...candidate }, rules, { at: '2026-08-28T01:00:00.000Z' });
  const reversed = assessSuppression({ ...candidate }, [...rules].reverse(), { at: '2026-08-28T01:00:00.000Z' });

  assert.equal(forward.active, true);
  assert.equal(reversed.active, true);
  assert.deepEqual([...forward.matchedRuleIds].sort(), [...reversed.matchedRuleIds].sort());
  assert.equal(forward.axis, reversed.axis, 'the displayed rule is order-independent too');
  assert.equal(forward.value, reversed.value);
});

// UI assertions follow the repository's existing convention in tests/web-smoke.test.mjs: the
// client is asserted against its source, since there is no browser in this suite. The real-browser
// pass is recorded separately in USER_SUPPRESSION_ACCEPTANCE.md.
const readSource = async (relative) =>
  (await import('node:fs/promises')).readFile(path.resolve(repoRoot, relative), 'utf8');

test('UI: the suppressed state offers 복원 as primary and 상세 보기 as secondary', async () => {
  const app = await readSource('apps/web/app.js');
  assert.match(app, /suppressedCardTemplate/);
  assert.match(app, /card-restore" type="button">복원</);
  assert.match(app, /card-detail" type="button">상세 보기</);
  assert.match(app, /sendCommand\('restore_candidate'/);
});

test('UI: a suppression can be created from a card and states its reason requirement', async () => {
  const app = await readSource('apps/web/app.js');
  const html = await readSource('apps/web/index.html');
  assert.match(app, /card-suppress/);
  assert.match(app, /sendCommand\('suppress_candidate'/);
  assert.match(app, /억제 이유는 반드시 입력해야 합니다/);
  assert.match(html, /id="suppress-reason"[^>]*required/);
  for (const axis of ['product', 'brand', 'category', 'source']) {
    assert.match(html, new RegExp(`<option value="${axis}">`), `axis ${axis} must be offerable`);
  }
});

test('UI: suppression is presented as reversible and distinct from duplicate removal', async () => {
  const html = await readSource('apps/web/index.html');
  assert.match(html, /중복 제거와 다른 기능입니다/, 'the dialog must not present suppression as dedupe');
  assert.match(html, /삭제가 아니라|되돌릴 수 있습니다|복원/, 'reversibility must be stated up front');
});

test('UI: restore and detail controls can resolve a suppressed candidate', async () => {
  // The suppressed candidate lives in `today.excluded`, so a lookup that only searched
  // `today.candidates` would return null and both buttons would silently do nothing.
  const app = await readSource('apps/web/app.js');
  assert.match(app, /today\?\.excluded\?\.find/);
  assert.match(app, /els\.excludedList\.addEventListener/);
});

test('UI: suppression introduces no client-side authority and escapes rendered values', async () => {
  const app = await readSource('apps/web/app.js');
  assert.doesNotMatch(app, /localStorage|sessionStorage/);
  const template = app.slice(app.indexOf('function suppressedCardTemplate'), app.indexOf('function renderSuppressed'));
  assert.match(template, /escapeHtml\(candidate\.name\)/);
  assert.match(template, /escapeHtml\(suppression\.reason/);
  assert.match(template, /escapeHtml\(suppression\.value/);
  assert.doesNotMatch(template, /\$\{candidate\.name\}/, 'no unescaped interpolation');
});
