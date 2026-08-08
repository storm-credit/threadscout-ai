import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_IDS, AGENT_REGISTRY } from '../packages/orchestra/src/agent-registry.mjs';
import { AGENT_SYSTEM_PROMPTS, validatePromptSet } from '../packages/orchestra/src/prompts.mjs';
import { AGENT_OUTPUT_SCHEMAS, validateArtifactSchema } from '../packages/orchestra/src/schemas.mjs';
import { scoreSinbakCandidate } from '../packages/orchestra/src/niche-profile.mjs';
import { runSinbakFixtureSimulation } from '../packages/orchestra/src/simulation.mjs';

test('all six fixed agents have detailed system prompts and output schemas', () => {
  const promptResult = validatePromptSet();
  assert.equal(promptResult.ok, true, promptResult.errors.join('\n'));
  assert.equal(Object.keys(AGENT_SYSTEM_PROMPTS).length, 6);
  assert.equal(Object.keys(AGENT_OUTPUT_SCHEMAS).length, 6);
  for (const agent of AGENT_REGISTRY) {
    assert.match(AGENT_SYSTEM_PROMPTS[agent.id], /실용 신박템/);
    assert.match(AGENT_SYSTEM_PROMPTS[agent.id], /출력 계약/);
    assert.ok(AGENT_OUTPUT_SCHEMAS[agent.id]);
  }
});

test('practical demonstrable novelty outranks gimmick-only products', () => {
  const practical = scoreSinbakCandidate({
    identityConfidence: 0.9,
    sourceRefs: ['source:a', 'source:b'],
    signals: { problemClarity: 90, demoPotential: 90, practicalUtility: 85, novelty: 75, purchaseIntent: 78, audienceFit: 86 },
    flags: {}
  });
  const gimmick = scoreSinbakCandidate({
    identityConfidence: 0.9,
    sourceRefs: ['source:a', 'source:b'],
    signals: { problemClarity: 35, demoPotential: 90, practicalUtility: 25, novelty: 95, purchaseIntent: 45, audienceFit: 50 },
    flags: { gimmickOnly: true }
  });
  assert.equal(practical.status, 'recommended');
  assert.ok(practical.score > gimmick.score);
  assert.notEqual(gimmick.status, 'recommended');
});

test('the fixture simulation invokes all six agents and stops at a local-only queue', () => {
  const run = runSinbakFixtureSimulation();
  assert.equal(run.status, 'completed_local_only');
  assert.deepEqual(Object.keys(run.invocationCounts), AGENT_REGISTRY.map((agent) => agent.id));
  for (const agent of AGENT_REGISTRY) assert.equal(run.invocationCounts[agent.id], 1);
  assert.equal(run.artifacts.review_report.decision, 'pass');
  assert.equal(run.artifacts.draft_bundle.drafts.length, 4);
  assert.equal(run.artifacts.queue_record.publishingEnabled, false);
  assert.equal(run.artifacts.evidence_packet.commerceSnapshot.synthetic, true);
});

test('every fixture artifact passes its detailed schema', () => {
  const run = runSinbakFixtureSimulation();
  const typeByAgent = {
    [AGENT_IDS.ORCHESTRATOR]: 'run_plan',
    [AGENT_IDS.SCOUT]: 'candidate_set',
    [AGENT_IDS.VERIFIER]: 'evidence_packet',
    [AGENT_IDS.STRATEGIST]: 'content_brief',
    [AGENT_IDS.WRITER]: 'draft_bundle',
    [AGENT_IDS.GUARDIAN]: 'review_report'
  };
  for (const agent of AGENT_REGISTRY) {
    const result = validateArtifactSchema(agent.id, run.artifacts[typeByAgent[agent.id]]);
    assert.equal(result.ok, true, `${agent.id}: ${result.errors.join(' | ')}`);
  }
});

test('rejected human decision never creates a queue record', () => {
  const run = runSinbakFixtureSimulation({ humanDecision: 'rejected' });
  assert.equal(run.status, 'rejected');
  assert.equal(run.artifacts.queue_record, undefined);
});
