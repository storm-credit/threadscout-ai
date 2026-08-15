import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTER_DESIGN_BASELINE,
  SPIKE0_REQUIRED_ATS,
  SPIKE0_REQUIRED_FIXTURES,
  runMasterHarnessFixture,
  runMasterHarnessSpike0Suite
} from '../packages/orchestra/src/master-harness.mjs';

const SIX_AGENT_ROUTE = ['orchestrator', 'verifier', 'strategist', 'writer', 'guardian'];

test('F01 owner-supplied exact route skips Scout only by explicit route and reaches bound approval', async () => {
  const report = await runMasterHarnessFixture('F01');
  assert.equal(report.baseline, MASTER_DESIGN_BASELINE);
  assert.equal(report.fixedAgentCount, 6);
  assert.equal(report.scoutSkipped, true);
  assert.deepEqual(report.route, SIX_AGENT_ROUTE);
  assert.equal(report.status, 'approved');
  assert.equal(typeof report.approvalRevision, 'string');
  assert.equal(report.approvalRevision.length, 64);
  assert.equal(report.liveCapabilitiesEnabled, false);
  assert.equal(report.secretLeak, false);
  assert.equal(report.receipts.length, report.route.length);
});

test('F02 conflicting model cannot become exact and stops before strategy', async () => {
  const report = await runMasterHarnessFixture('F02');
  assert.equal(report.status, 'held_unresolved');
  assert.deepEqual(report.route, ['orchestrator', 'verifier']);
  assert.equal(report.artifactHashes.content_brief, undefined);
});

test('F04 high opportunity score cannot override unresolved exact identity', async () => {
  const report = await runMasterHarnessFixture('F04');
  assert.equal(report.status, 'held_unresolved');
  assert.equal(report.route.includes('strategist'), false);
});

test('F11 and F21 invalidate old approval and reject stale compare-and-set decision', async () => {
  for (const fixtureId of ['F11', 'F21']) {
    const report = await runMasterHarnessFixture(fixtureId);
    assert.equal(report.status, 'stale_after_approval');
    assert.equal(report.stale, true);
    assert.equal(report.casRejected, true);
    assert.equal(typeof report.approvalRevision, 'string');
  }
});

test('F12 budget exhaustion stops without widening the fixed roster', async () => {
  const report = await runMasterHarnessFixture('F12');
  assert.equal(report.status, 'budget_exhausted');
  assert.equal(report.fixedAgentCount, 6);
  assert.equal(report.roster.length, 6);
});

test('F13 and F15 Guardian independently request revision for unsupported wording', async () => {
  const endorsement = await runMasterHarnessFixture('F13');
  const firstHand = await runMasterHarnessFixture('F15');
  assert.equal(endorsement.status, 'guardian_revise');
  assert.equal(firstHand.status, 'guardian_revise');
});

test('F20 downstream repetition cannot manufacture factual authority', async () => {
  const report = await runMasterHarnessFixture('F20');
  assert.equal(report.status, 'blocked_authority');
  assert.equal(report.artifactHashes.draft_bundle, undefined);
  assert.equal(report.caughtError?.code, 'factual_authority');
});

test('deterministic fixture replay has equivalent semantic digest', async () => {
  const first = await runMasterHarnessFixture('F01');
  const second = await runMasterHarnessFixture('F01');
  assert.equal(first.semanticDigest, second.semanticDigest);
});

test('Spike 0 suite covers all required fixtures and ATs', async () => {
  const result = await runMasterHarnessSpike0Suite();
  assert.deepEqual(result.fixtureIds, [...SPIKE0_REQUIRED_FIXTURES]);
  assert.deepEqual(result.requiredATs, [...SPIKE0_REQUIRED_ATS]);
  assert.deepEqual(result.missingATs, []);
  assert.deepEqual(result.failedATs, []);
  assert.deepEqual(result.unexpectedStatuses, []);
  assert.equal(result.passed, true);
  for (const passed of Object.values(result.acceptance)) assert.equal(passed, true);
});
