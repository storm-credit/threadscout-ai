// Slice 1 acceptance tests.
//
// Each test names the acceptance ID from docs/spec/ACCEPTANCE_TESTS.md that it
// implements. Where a gate exists, the test proves the gate *refuses*, not only that
// the happy path passes: a gate that has never been observed to say no has not been
// tested.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  READER_JOBS,
  computeApprovalBinding,
  deriveCandidateView,
  evaluateEvidenceReadiness,
  findParaphrasedAngles,
  scoreOpportunity,
  selectInboxCandidates
} from '../packages/core/src/index.mjs';

import {
  createCandidateRecord,
  currentBinding,
  decide,
  draft,
  editDraft,
  review,
  strategize,
  verify
} from '../packages/orchestra/src/pipeline.mjs';

import { decideMatchState, countIndependentOrigins } from '../packages/orchestra/src/agents/verifier.mjs';
import {
  BLOCKED_RUMOUR_SCENARIO,
  EXACT_PRODUCT_SCENARIO,
  HIGH_SCORE_UNRESOLVED_SCENARIO,
  SUBSTITUTE_SCENARIO,
  UNKNOWN_MEDIA_RIGHTS_SCENARIO
} from '../packages/orchestra/src/fixtures/slice1-scenarios.mjs';

import { createHarness, exactIdentityEvidence, intakeBody, runToGuardian } from './helpers/slice1-harness.mjs';
import { createFixedClock, createIdFactory } from '../packages/core/src/index.mjs';

function deps(seed = 'x') {
  return { clock: createFixedClock('2026-08-14T00:00:00.000Z', 1000), nextId: createIdFactory(seed) };
}

function scenarioRecord(scenario, d) {
  return createCandidateRecord({ ...scenario.candidate, evidence: scenario.evidence }, d);
}

/* AT-01 / AT-28 — daily inbox and a valid empty day ------------------------- */

test('AT-01: the inbox shows why-now, reader value, evidence, risk, blockers, and one CTA', async () => {
  const harness = createHarness();
  const { id } = await runToGuardian(harness);
  const inbox = await harness.call('GET', '/api/inbox');

  const card = [...inbox.body.candidates, ...inbox.body.excluded].find((item) => item.candidateId === id);
  assert.ok(card, 'the candidate must appear on the inbox');
  for (const field of ['whyNow', 'readerValue', 'evidenceReadinessLabel', 'riskLabel', 'matchStateLabel', 'mediaStateLabel']) {
    assert.ok(card[field], field + ' must be present on the card');
  }
  assert.ok(card.cta.label, 'the card must offer exactly one primary CTA');
});

test('AT-28: an empty day returns 오늘 추천 없음 rather than lowering the bar', async () => {
  const harness = createHarness();
  const inbox = await harness.call('GET', '/api/inbox');
  assert.equal(inbox.body.candidates.length, 0);
  assert.equal(inbox.body.emptyReason, '오늘 추천 없음');
});

/* AT-04 / AT-40 — exact identity and independent origins -------------------- */

test('AT-04: a conflicting model number cannot produce an exact match', () => {
  const result = decideMatchState({
    identityEvidence: [
      { dimension: 'brand', status: 'match', originId: 'a' },
      { dimension: 'model', status: 'conflict', originId: 'b' }
    ]
  });
  assert.equal(result.matchState, 'unresolved');
  assert.match(result.reasons.join(' '), /충돌/);
});

test('AT-40: URLs sharing one origin count as one piece of evidence', () => {
  const oneOrigin = [
    { dimension: 'brand', status: 'match', originId: 'origin_maker' },
    { dimension: 'product_name', status: 'match', originId: 'origin_maker' },
    { dimension: 'model', status: 'match', originId: 'origin_maker' },
    { dimension: 'variant', status: 'match', originId: 'origin_maker' }
  ];
  assert.equal(countIndependentOrigins(oneOrigin), 1);
  assert.equal(decideMatchState({ identityEvidence: oneOrigin }).matchState, 'likely',
    'one origin is not enough for exact, however many dimensions it covers');

  const twoOrigins = oneOrigin.map((item, index) =>
    ({ ...item, originId: index < 2 ? 'origin_maker' : 'origin_market' }));
  assert.equal(countIndependentOrigins(twoOrigins), 2);
  assert.equal(decideMatchState({ identityEvidence: twoOrigins }).matchState, 'exact');
});

/* AT-06 — four distinct angles, and paraphrases refused --------------------- */

test('AT-06: the Strategist returns four distinct reader jobs', () => {
  const d = deps('a');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = strategize(verify(record, d), d);

  const angles = record.artifacts.content_brief.angles;
  assert.equal(angles.length, 4);
  assert.deepEqual([...new Set(angles.map((angle) => angle.readerJob))].sort(), [...READER_JOBS].sort());
  assert.deepEqual(findParaphrasedAngles(angles), [], 'the four angles must not be paraphrases');
});

test('AT-06 (negative): four restatements of one argument are detected as paraphrases', () => {
  const paraphrased = READER_JOBS.map((readerJob, index) => ({
    angleId: 'angle_' + index,
    readerJob,
    coreValue: '설거지할 때 물이 튀는 문제를 줄여 주는 접이식 구조를 설명한다.',
    hookLogic: '설거지할 때 물이 튀는 문제를 줄여 주는 접이식 구조를 먼저 말한다.'
  }));
  const collisions = findParaphrasedAngles(paraphrased);
  assert.ok(collisions.length >= 1, 'near-identical angles must be flagged');
});

/* AT-07 / AT-41 — drafts bound to verified claims only ---------------------- */

test('AT-07: each draft maps to one angle and references only verified claims', () => {
  const d = deps('b');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = draft(strategize(verify(record, d), d), d);

  const bundle = record.artifacts.draft_bundle;
  const angleIds = record.artifacts.content_brief.angles.map((angle) => angle.angleId);
  const claimIds = new Set(record.artifacts.evidence_packet.verifiedClaims.map((claim) => claim.claimId));

  assert.equal(bundle.drafts.length, 4);
  assert.deepEqual(bundle.drafts.map((item) => item.angleId).sort(), [...angleIds].sort());
  for (const item of bundle.drafts) {
    for (const claimRef of item.claimRefs) {
      assert.ok(claimIds.has(claimRef), 'draft claim ' + claimRef + ' must exist in the evidence packet');
    }
  }
});

test('AT-41: downstream artifacts stay bound to the evidence packet hash', () => {
  const d = deps('c');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = draft(strategize(verify(record, d), d), d);

  const packetHash = record.artifacts.content_brief.evidencePacketHash;
  assert.equal(record.artifacts.draft_bundle.evidencePacketHash, packetHash);
  assert.ok(packetHash, 'the binding hash must exist rather than being implied');
});

/* AT-08 / AT-17 — Guardian independence and fail-closed --------------------- */

test('AT-08: an owner edit that adds unsupported first-hand wording is blocked on re-review', () => {
  const d = deps('e');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = review(draft(strategize(verify(record, d), d), d), d);
  assert.equal(record.artifacts.review_report.decision, 'pass');

  const draftId = record.artifacts.draft_bundle.drafts[0].draftId;
  record = editDraft(record, { draftId, patch: { body: '직접 써봤는데 물이 거의 안 튀었음.' } }, d);
  assert.equal(record.artifacts.review_report, undefined, 'editing must invalidate the previous review');

  record = review(record, d);
  assert.equal(record.artifacts.review_report.decision, 'block');
  assert.match(record.artifacts.review_report.nonOverridableBlockers.join(' '), /FIRST_HAND_WITHOUT_USAGE_RECORD/);
});

test('AT-08/AT-17: human approval cannot override a Guardian block', () => {
  const d = deps('f');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = review(draft(strategize(verify(record, d), d), d), d);
  const draftId = record.artifacts.draft_bundle.drafts[0].draftId;
  record = review(editDraft(record, { draftId, patch: { body: '직접 사용해봤고 무조건 추천함.' } }, d), d);
  assert.equal(record.artifacts.review_report.decision, 'block');

  assert.throws(
    () => decide(record, { decision: 'approve', actor: 'owner', claimedBinding: currentBinding(record) }, d),
    (error) => ['guardian_not_passed', 'not_at_human_review'].includes(error.code)
  );
});

test('AT-17: unknown media rights fail closed before any strategy exists', () => {
  const d = deps('g');
  const record = verify(scenarioRecord(UNKNOWN_MEDIA_RIGHTS_SCENARIO, d), d);
  assert.equal(record.artifacts.evidence_packet.verifierDecision, 'hold');
  assert.equal(evaluateEvidenceReadiness(record.artifacts.evidence_packet).state, 'blocked');
  assert.throws(() => strategize(record, d), (error) => error.code === 'evidence_not_ready');
});

test('AT-03/AT-17: a rumour/private-life trigger is rejected regardless of score', () => {
  const d = deps('h');
  const record = verify(scenarioRecord(BLOCKED_RUMOUR_SCENARIO, d), d);
  assert.equal(record.artifacts.evidence_packet.verifierDecision, 'reject');
  assert.equal(BLOCKED_RUMOUR_SCENARIO.candidate.opportunityScore, 96, 'the fixture is deliberately high scoring');
  assert.throws(() => strategize(record, d), (error) => error.code === 'evidence_not_ready');
});

/* AT-10 — substitutes may never be called the same product ------------------ */

test('AT-10: a substitute is labelled as an alternative and never as the same product', () => {
  const d = deps('i');
  let record = scenarioRecord(SUBSTITUTE_SCENARIO, d);
  record = review(draft(strategize(verify(record, d), d), d), d);

  assert.equal(record.artifacts.evidence_packet.matchState, 'substitute');
  assert.equal(record.artifacts.review_report.decision, 'pass');
  for (const item of record.artifacts.draft_bundle.drafts) {
    const text = item.hook + item.body;
    assert.match(text, /비슷한 제품|같은 제품이 아니/, '대체품임이 본문에 드러나야 한다');
  }
});

/* AT-25 — score never unlocks a gate ---------------------------------------- */

test('AT-25: a 94-point candidate with unresolved identity keeps the 근거 확인 CTA', () => {
  const d = deps('j');
  const record = verify(scenarioRecord(HIGH_SCORE_UNRESOLVED_SCENARIO, d), d);
  const view = deriveCandidateView(
    { candidate: record, evidencePacket: record.artifacts.evidence_packet, currentBinding: {} },
    d.clock()
  );

  assert.equal(view.opportunityScore, 94);
  assert.equal(view.matchState, 'unresolved');
  assert.equal(view.cta.label, '근거 확인');
  assert.equal(view.strategyEnabled, false);
  assert.ok(view.strategyDisabledReason, 'a disabled action must carry a visible reason');
  assert.throws(() => strategize(record, d), (error) => error.code === 'evidence_not_ready');
});

test('AT-29: inbox selection exposes a reason for every inclusion and exclusion', () => {
  const candidates = [
    { candidateId: 'a', opportunityScore: 99, contentLane: 'curiosity_only', riskLevel: 'low' },
    { candidateId: 'b', opportunityScore: 98, contentLane: 'curiosity_only', riskLevel: 'low' },
    { candidateId: 'c', opportunityScore: 97, contentLane: 'practical_novel', riskLevel: 'blocked' },
    { candidateId: 'd', opportunityScore: 40, contentLane: 'practical_novel', riskLevel: 'low' }
  ];
  const { selected, excluded } = selectInboxCandidates(candidates);

  assert.deepEqual(selected.map((item) => item.candidateId), ['a']);
  const reasons = Object.fromEntries(excluded.map((item) => [item.candidateId, item.reason]));
  assert.equal(reasons.b, 'lane_cap');
  assert.equal(reasons.c, 'risk_blocked');
  assert.equal(reasons.d, 'below_review_floor');
  for (const item of excluded) assert.ok(item.detail, 'every exclusion needs an owner-readable reason');
});

/* AT-09 / AT-36 / AT-38 — approval binding ---------------------------------- */

test('AT-09/AT-38: approval binds the exact draft, evidence, media, and mapping revisions', async () => {
  const harness = createHarness();
  const { id } = await runToGuardian(harness);
  const detail = await harness.call('GET', '/api/candidates/' + id);

  const approved = await harness.call('POST', '/api/candidates/' + id + '/decision', {
    decision: 'approve', binding: detail.body.binding, idempotencyKey: 'ok'
  });
  assert.equal(approved.status, 200);
  assert.deepEqual(
    Object.keys(approved.body.approval.binding).sort(),
    ['affiliateMappingHash', 'draftHash', 'evidencePacketHash', 'mediaHash']
  );
});

test('AT-36: a decision made against an older revision is rejected with what changed', async () => {
  const harness = createHarness();
  const { id } = await runToGuardian(harness);

  // First screen reads the binding, then a second session edits the draft.
  const firstScreen = await harness.call('GET', '/api/candidates/' + id);
  const staleBinding = firstScreen.body.binding;

  await harness.call('POST', '/api/candidates/' + id + '/draft-edit', {
    draftId: firstScreen.body.selectedDraftId,
    patch: { body: '다른 기기에서 고친 본문입니다.' },
    idempotencyKey: 'edit-elsewhere'
  });
  await harness.call('POST', '/api/candidates/' + id + '/review', { idempotencyKey: 'rereview' });

  const rejected = await harness.call('POST', '/api/candidates/' + id + '/decision', {
    decision: 'approve', binding: staleBinding, idempotencyKey: 'stale-approve'
  });
  assert.equal(rejected.status, 409);
  assert.equal(rejected.body.error.code, 'binding_stale');
  assert.ok(rejected.body.error.details.includes('선택한 초안'), 'the changed item must be named');
});

test('AT-38: an approval goes stale when the draft it bound is edited afterwards', () => {
  const d = deps('k');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = review(draft(strategize(verify(record, d), d), d), d);
  record = decide(record, { decision: 'approve', actor: 'owner', claimedBinding: currentBinding(record) }, d);

  const before = deriveCandidateView(
    { candidate: record, evidencePacket: record.artifacts.evidence_packet, draftBundle: record.artifacts.draft_bundle,
      approval: record.approval, currentBinding: currentBinding(record) }, d.clock());
  assert.equal(before.approvalState, 'approved');

  const edited = editDraft(record, { draftId: record.selectedDraftId, patch: { body: '내용을 바꿨습니다.' } }, d);
  const after = deriveCandidateView(
    { candidate: edited, evidencePacket: edited.artifacts.evidence_packet, draftBundle: edited.artifacts.draft_bundle,
      approval: edited.approval, currentBinding: currentBinding(edited) }, d.clock());

  assert.equal(after.approvalState, 'stale');
  assert.deepEqual(after.approvalChanged.map((item) => item.label), ['선택한 초안']);
});

/* AT-13 / AT-18 / AT-19 — provenance, receipts, replayable lineage ---------- */

test('AT-13/AT-19: lineage traces every stage to its artifact and validates the hash chain', async () => {
  const harness = createHarness();
  const { id } = await runToGuardian(harness);
  const lineage = await harness.call('GET', '/api/candidates/' + id + '/lineage');

  assert.equal(lineage.body.chainValid, true);
  assert.deepEqual(
    lineage.body.stages.map((item) => item.artifactType).sort(),
    ['content_brief', 'draft_bundle', 'evidence_packet', 'review_report']
  );
  for (const stage of lineage.body.stages.filter((item) => item.artifactType !== 'evidence_packet')) {
    assert.ok(stage.inputArtifactRefs.length > 0, stage.artifactType + ' must reference its inputs');
  }
  assert.ok(lineage.body.scoutSkip.reason, 'a skipped Scout stage must record why');
});

test('AT-18: every specialist invocation produces a receipt with timing and version metadata', () => {
  const d = deps('m');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = review(draft(strategize(verify(record, d), d), d), d);

  assert.equal(record.receipts.length, 4, 'verifier, strategist, writer, guardian');
  for (const receipt of record.receipts) {
    assert.ok(receipt.startedAt && receipt.completedAt, 'receipts carry timing');
    assert.equal(receipt.status, 'success');
    assert.ok(receipt.promptHash && receipt.schemaHash && receipt.manifestHash, 'receipts carry version metadata');
  }
});

/* AT-20 — no secret or internal detail leaks -------------------------------- */

test('AT-20: error responses carry no stack trace, path, or credential', async () => {
  const harness = createHarness();
  const bad = await harness.call('POST', '/api/candidates', { name: '', idempotencyKey: 'bad' });
  const missing = await harness.call('GET', '/api/candidates/nope');

  for (const response of [bad, missing]) {
    const text = JSON.stringify(response.body);
    assert.doesNotMatch(text, /at Object|node:internal|C:\\|\/packages\//, 'no internals in an error response');
    assert.doesNotMatch(text, /token|secret|password|api[_-]?key/i);
  }
});

/* AT-21 — budget exhaustion stops rather than widening ---------------------- */

test('AT-21: an exhausted verifier budget stops the run instead of retrying forever', () => {
  const d = deps('n');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = verify(record, d);
  record = verify(record, d);

  // A third attempt inside the same evidence epoch is refused.
  assert.throws(() => verify(record, d), (error) => error.code === 'budget_exhausted');
  assert.equal(record.receipts.filter((item) => item.agentId === 'verifier').length, 2);
});

/* AT-16 / AT-23 — unknown facts and Korean truthfulness --------------------- */

test('AT-16/AT-23: research wording is used and unknown price is qualified, not invented', () => {
  const d = deps('o');
  let record = scenarioRecord(EXACT_PRODUCT_SCENARIO, d);
  record = draft(strategize(verify(record, d), d), d);

  for (const item of record.artifacts.draft_bundle.drafts) {
    const text = item.hook + item.body;
    assert.equal(item.firstHandLanguageUsed, false);
    assert.doesNotMatch(text, /직접\s*(써|사용)|써\s*봤/, 'no first-hand wording without a usage record');
    assert.match(text, /찾아보니|확인해보니|자료를/, 'research wording must be explicit');
    assert.match(text, /현재 가격은 확인되지 않아/, 'an unknown price is stated as unknown');
  }
});

/* AT-33 — capability states stay distinct ----------------------------------- */

test('AT-33: designed, configured, enabled, and verified are reported separately', async () => {
  const harness = createHarness();
  const result = await harness.call('GET', '/api/capabilities');

  assert.equal(result.body.externalPublishingEnabled, false);
  const publishing = result.body.capabilities.find((item) => item.id === 'threads_publishing');
  assert.deepEqual(
    { designed: publishing.designed, configured: publishing.configured, enabled: publishing.enabled, verified: publishing.verified },
    { designed: true, configured: false, enabled: false, verified: false }
  );
});

/* Ranking model ------------------------------------------------------------- */

test('the opportunity score respects the specified bucket caps', () => {
  const maxed = scoreOpportunity({
    signals: { readerValue: 99, demonstrability: 99, purchaseIntent: 99, attentionAcceleration: 99, audienceFit: 99, novelty: 99, commercialPracticality: 99 }
  });
  assert.equal(maxed.score, 100, 'the buckets sum to exactly 100');
  assert.equal(maxed.breakdown.readerValue, 20);
  assert.equal(maxed.breakdown.demonstrability, 15);

  const penalised = scoreOpportunity({
    signals: { readerValue: 20, demonstrability: 15 },
    deductions: { saturation: 999 }
  });
  assert.equal(penalised.score, 15, 'deductions are capped, and the score floors at 0');
});

/* Approval binding is computed from server state ----------------------------- */

test('the approval binding changes when any bound item changes', () => {
  const evidencePacket = { type: 'evidence_packet', matchState: 'exact' };
  const draftRevision = { draftId: 'd1', angleId: 'a1', hook: 'h', body: 'b', cta: 'c', claimRefs: ['c1'] };
  const base = computeApprovalBinding({ evidencePacket, draft: draftRevision });

  const editedDraft = computeApprovalBinding({ evidencePacket, draft: { ...draftRevision, body: 'b2' } });
  assert.notEqual(base.draftHash, editedDraft.draftHash);
  assert.equal(base.evidencePacketHash, editedDraft.evidencePacketHash);

  const editedEvidence = computeApprovalBinding({ evidencePacket: { ...evidencePacket, matchState: 'likely' }, draft: draftRevision });
  assert.notEqual(base.evidencePacketHash, editedEvidence.evidencePacketHash);
});
