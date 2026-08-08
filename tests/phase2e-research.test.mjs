import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AGENT_IDS } from '../packages/orchestra/src/agent-registry.mjs';
import { buildCandidateEvidence, validateCandidateEvidence } from '../packages/orchestra/src/candidate-evidence.mjs';
import { buildDependencyIndex, artifactsInvalidatedByEvidence } from '../packages/orchestra/src/dependency-index.mjs';
import { createJsonlEvidenceStore } from '../packages/orchestra/src/evidence-store.mjs';
import { createFixtureResearchAdapter } from '../packages/orchestra/src/fixture-research-adapter.mjs';
import { runFixtureResearchPipeline } from '../packages/orchestra/src/fixture-research-pipeline.mjs';
import { FIXTURE_RESEARCH_POLICY, validateResearchPolicy } from '../packages/orchestra/src/research-policy.mjs';
import { createFixtureResearchToolHandlers } from '../packages/orchestra/src/research-tools.mjs';
import { createSourceRecord, validateSourceRecord } from '../packages/orchestra/src/source-records.mjs';
import { createToolBroker } from '../packages/orchestra/src/tool-broker.mjs';

test('fixture research policy is read-only, non-networked, and personal-data free', () => {
  const result = validateResearchPolicy(FIXTURE_RESEARCH_POLICY);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(FIXTURE_RESEARCH_POLICY.networkAllowed, false);
  assert.equal(FIXTURE_RESEARCH_POLICY.mutationAllowed, false);
  assert.equal(FIXTURE_RESEARCH_POLICY.personalDataAllowed, false);
});

test('source record rejects non-fixture URLs and detects tampering', () => {
  assert.throws(() => createSourceRecord({
    id: 'bad', sourceType: 'thread_observation', url: 'https://example.com', title: 'x', excerpt: 'x',
    observedAt: '2026-08-08T00:00:00Z', retrievedAt: '2026-08-08T00:00:00Z'
  }), /scheme is not allowed/);

  const record = createSourceRecord({
    id: 'ok', sourceType: 'thread_observation', url: 'fixture://threads/ok', title: '테스트', excerpt: '테스트',
    observedAt: '2026-08-08T00:00:00Z', retrievedAt: '2026-08-08T00:00:00Z'
  });
  const tampered = { ...record, excerpt: 'changed' };
  assert.equal(validateSourceRecord(tampered).ok, false);
});

test('fixture adapter is deterministic and refuses writes', async () => {
  const adapter = createFixtureResearchAdapter();
  const first = await adapter.search('싱크대');
  const second = await adapter.search('싱크대');
  assert.deepEqual(first, second);
  assert.ok(first.every((record) => record.synthetic && !record.networkFetched));
  await assert.rejects(adapter.write({}), /read-only/);
});

test('candidate evidence needs independent observation and listing records', async () => {
  const adapter = createFixtureResearchAdapter();
  const records = await adapter.search('싱크대');
  const [candidate] = buildCandidateEvidence(records);
  const validation = validateCandidateEvidence(candidate);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(candidate.sourceIds.length, 2);
  assert.equal(candidate.sourceTypeCount, 2);
  assert.equal(candidate.exactMatchReady, true);
});

test('tool broker permits Scout and Verifier fixture tools but denies Writer research', async () => {
  const broker = createToolBroker({ handlers: createFixtureResearchToolHandlers() });
  const records = await broker.invoke({ agentId: AGENT_IDS.SCOUT, toolName: 'public_search', input: { query: '케이블' } });
  assert.ok(records.length >= 2);
  const listing = await broker.invoke({ agentId: AGENT_IDS.VERIFIER, toolName: 'listing_lookup', input: { productQuery: '케이블' } });
  assert.equal(listing[0].sourceType, 'product_listing');
  await assert.rejects(
    broker.invoke({ agentId: AGENT_IDS.WRITER, toolName: 'public_search', input: { query: '케이블' } }),
    /not allowed/
  );
});

test('fixture research pipeline persists source evidence and a valid event chain', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'threadscout-research-test-'));
  try {
    const store = createJsonlEvidenceStore({ rootDir });
    const result = await runFixtureResearchPipeline({ query: '싱크대', runId: 'run-research-test', store });
    assert.equal(result.networkAllowed, false);
    assert.equal(result.mutationAllowed, false);
    assert.equal(result.records.length, 2);
    assert.equal(result.candidates[0].validation.ok, true);
    const events = await store.readRunEvents('run-research-test');
    assert.equal(events.filter((event) => event.type === 'source_saved').length, 2);
    assert.equal((await store.validateRunChain('run-research-test')).ok, true);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('dependency index propagates invalidation from evidence-linked artifacts to children', () => {
  const events = [
    { type: 'artifact_saved', payload: { artifactHash: 'evidence-artifact', evidenceHash: 'evidence-v1', parentArtifactHashes: [] } },
    { type: 'artifact_saved', payload: { artifactHash: 'strategy', evidenceHash: 'evidence-v1', parentArtifactHashes: ['evidence-artifact'] } },
    { type: 'artifact_saved', payload: { artifactHash: 'draft', evidenceHash: 'evidence-v1', parentArtifactHashes: ['strategy'] } }
  ];
  const index = buildDependencyIndex(events);
  const invalidated = artifactsInvalidatedByEvidence(index, 'evidence-v1');
  assert.deepEqual(new Set(invalidated), new Set(['evidence-artifact', 'strategy', 'draft']));
});
