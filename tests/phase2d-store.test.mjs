import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AGENT_IDS, AGENT_REGISTRY } from '../packages/orchestra/src/agent-registry.mjs';
import { createJsonlEvidenceStore } from '../packages/orchestra/src/evidence-store.mjs';
import { executeWithModelRuntime } from '../packages/orchestra/src/executor.mjs';
import { createReplayModelRuntime } from '../packages/orchestra/src/model-runtime.mjs';
import { createSinbakReplayHandlers } from '../packages/orchestra/src/replay-fixtures.mjs';
import {
  attachArtifactMetadata,
  buildVersionManifest,
  canonicalStringify,
  evaluateArtifactFreshness,
  sha256,
  verifyVersionedArtifact
} from '../packages/orchestra/src/versioning.mjs';

async function withStore(callback) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'threadscout-test-store-'));
  try {
    return await callback(createJsonlEvidenceStore({ rootDir }), rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

test('canonical hashing is stable across object key order', () => {
  assert.equal(canonicalStringify({ b: 2, a: 1 }), canonicalStringify({ a: 1, b: 2 }));
  assert.equal(sha256({ b: 2, a: 1 }), sha256({ a: 1, b: 2 }));
});

test('version manifest contains prompt and schema hashes for exactly six agents', () => {
  const manifest = buildVersionManifest();
  assert.deepEqual(Object.keys(manifest.promptHashes), AGENT_REGISTRY.map((agent) => agent.id));
  assert.deepEqual(Object.keys(manifest.schemaHashes), AGENT_REGISTRY.map((agent) => agent.id));
  assert.match(manifest.manifestHash, /^[a-f0-9]{64}$/);
});

test('artifact integrity fails after content tampering', () => {
  const artifact = attachArtifactMetadata({
    agentId: AGENT_IDS.WRITER,
    artifact: { type: 'draft_bundle', runId: 'r1', createdAt: '2026-08-08T00:00:00Z', drafts: [] },
    evidenceHash: sha256({ evidence: 1 })
  });
  assert.equal(verifyVersionedArtifact(artifact).ok, true);
  artifact.drafts.push({ angleId: 'tampered', text: 'changed' });
  assert.equal(verifyVersionedArtifact(artifact).ok, false);
});

test('evidence changes make a downstream artifact stale', () => {
  const firstEvidence = sha256({ product: 'A', price: 1000 });
  const artifact = attachArtifactMetadata({
    agentId: AGENT_IDS.WRITER,
    artifact: { type: 'draft_bundle', runId: 'r1', createdAt: '2026-08-08T00:00:00Z', drafts: [] },
    evidenceHash: firstEvidence
  });
  assert.equal(evaluateArtifactFreshness(artifact, { currentEvidenceHash: firstEvidence }).fresh, true);
  const stale = evaluateArtifactFreshness(artifact, { currentEvidenceHash: sha256({ product: 'A', price: 1200 }) });
  assert.equal(stale.fresh, false);
  assert.match(stale.reasons.join(' '), /Evidence changed/);
});

test('concurrent event appends remain sequential and hash chained', async () => {
  await withStore(async (store) => {
    await Promise.all(Array.from({ length: 20 }, (_, index) => store.appendRunEvent('run-concurrent', 'test_event', { index })));
    const events = await store.readRunEvents('run-concurrent');
    assert.deepEqual(events.map((event) => event.sequence), Array.from({ length: 20 }, (_, index) => index + 1));
    const result = await store.validateRunChain('run-concurrent');
    assert.equal(result.ok, true, result.errors.join('\n'));
  });
});

test('tampering with a persisted event is detected', async () => {
  await withStore(async (store, rootDir) => {
    await store.appendRunEvent('run-tamper', 'test_event', { value: 1 });
    const runDirectory = path.join(rootDir, 'runs');
    const [key] = await import('node:fs/promises').then(({ readdir }) => readdir(runDirectory));
    const eventPath = path.join(runDirectory, key, 'events.jsonl');
    const event = JSON.parse((await readFile(eventPath, 'utf8')).trim());
    event.payload.value = 999;
    await writeFile(eventPath, `${JSON.stringify(event)}\n`, 'utf8');
    const result = await store.validateRunChain('run-tamper');
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /payload hash mismatch|hash mismatch/);
  });
});

test('runtime execution persists six versioned artifacts and an auditable run chain', async () => {
  await withStore(async (store) => {
    const runtime = createReplayModelRuntime({ replays: createSinbakReplayHandlers() });
    const result = await executeWithModelRuntime({
      runtime,
      store,
      objective: '저장소 통합 검사',
      runId: 'run-persisted'
    });
    assert.equal(result.run.status, 'completed_local_only');
    assert.equal(Object.keys(result.artifactHashes).length, 6);
    const events = await store.readRunEvents('run-persisted');
    assert.equal(events.filter((event) => event.type === 'artifact_saved').length, 6);
    assert.ok(events.some((event) => event.type === 'human_decision_recorded'));
    assert.ok(events.some((event) => event.type === 'local_queue_recorded'));
    const chain = await store.validateRunChain('run-persisted');
    assert.equal(chain.ok, true, chain.errors.join('\n'));
    assert.equal(result.run.artifacts.queue_record.publishingEnabled, false);
  });
});
