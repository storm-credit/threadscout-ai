// Storage behaviour: durability, concurrency, idempotency, and audit integrity.
//
// AT-35 is the reason most of this exists. Correctness has to survive a reload, a
// second session, and a process restart, because the browser is not allowed to be
// the authority for any of it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createFixedClock, createIdFactory } from '../packages/core/src/index.mjs';
import { createMemoryStore } from '../packages/database/src/memory-store.mjs';
import { createJsonlStore, parseAppendOnlyLines } from '../packages/database/src/jsonl-store.mjs';
import { VersionConflictError, assertStorePort } from '../packages/database/src/ports.mjs';
import { createService } from '../apps/web/src/service.mjs';
import { createApiHandler } from '../apps/web/src/api.mjs';
import { exactIdentityEvidence, intakeBody } from './helpers/slice1-harness.mjs';

async function withTempDir(work) {
  const dir = await mkdtemp(path.join(tmpdir(), 'threadscout-test-'));
  try {
    return await work(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function buildApi(store, seed) {
  const clock = createFixedClock('2026-08-14T00:00:00.000Z', 1000);
  const service = createService({ store, clock, nextId: createIdFactory(seed), actor: 'owner' });
  const handler = createApiHandler(service);
  return async (method, pathname, body = null) => {
    const response = await handler({ method, path: pathname, body });
    return { status: response.status, body: JSON.parse(response.body) };
  };
}

test('both store adapters satisfy the same port', async () => {
  assertStorePort(createMemoryStore({ clock: createFixedClock() }));
  await withTempDir(async (dir) => {
    assertStorePort(createJsonlStore({ rootDir: dir, clock: createFixedClock() }));
  });
});

test('AT-35: a candidate survives a process restart because the browser owns nothing', async () => {
  await withTempDir(async (dir) => {
    const clock = createFixedClock('2026-08-14T00:00:00.000Z', 1000);

    const first = buildApi(createJsonlStore({ rootDir: dir, clock }), 'p1');
    const created = await first('POST', '/api/candidates', { ...intakeBody(), idempotencyKey: 'c1' });
    const id = created.body.candidate.candidateId;
    await first('POST', '/api/candidates/' + id + '/evidence', { ...exactIdentityEvidence(), idempotencyKey: 'e1' });
    await first('POST', '/api/candidates/' + id + '/verify', { idempotencyKey: 'v1' });

    // A brand-new store instance stands in for a restarted process.
    const second = buildApi(createJsonlStore({ rootDir: dir, clock }), 'p2');
    const detail = await second('GET', '/api/candidates/' + id);

    assert.equal(detail.status, 200);
    assert.equal(detail.body.candidate.matchState, 'exact');
    assert.equal(detail.body.candidate.evidenceReadiness, 'ready');
  });
});

test('a torn final line is recovered rather than corrupting the log', async () => {
  const { records, warnings } = parseAppendOnlyLines(['{"candidateId":"a","version":1}', '{"candidateId":"b","ver']);
  assert.equal(records.length, 1);
  assert.equal(warnings.length, 1);

  assert.throws(
    () => parseAppendOnlyLines(['{"broken":', '{"candidateId":"b","version":1}']),
    /Corrupted append-only log at line 1/,
    'a torn line in the middle is real corruption and must not be swallowed'
  );

  await withTempDir(async (dir) => {
    const clock = createFixedClock();
    const store = createJsonlStore({ rootDir: dir, clock });
    await store.saveCandidate({ candidateId: 'cand_1', version: 1, runId: 'run_1', artifacts: {} });
    await appendFile(path.join(dir, 'candidates.jsonl'), '{"candidateId":"cand_2","ver', 'utf8');

    const reopened = createJsonlStore({ rootDir: dir, clock });
    const list = await reopened.listCandidates();
    assert.deepEqual(list.map((item) => item.candidateId), ['cand_1']);
    assert.equal(reopened.getRecoveryWarnings().length, 1);
  });
});

test('a stale write is refused by compare-and-set rather than merged', async () => {
  const store = createMemoryStore({ clock: createFixedClock() });
  const record = { candidateId: 'cand_1', runId: 'run_1', version: 1, artifacts: {} };
  await store.saveCandidate(record);
  await store.saveCandidate({ ...record, version: 2 }, { expectedVersion: 1 });

  await assert.rejects(
    () => store.saveCandidate({ ...record, version: 3 }, { expectedVersion: 1 }),
    (error) => error instanceof VersionConflictError && error.actualVersion === 2
  );
});

test('a command sent from a stale screen is rejected with a refresh response', async () => {
  const store = createMemoryStore({ clock: createFixedClock() });
  const call = buildApi(store, 'q');
  const created = await call('POST', '/api/candidates', { ...intakeBody(), idempotencyKey: 'c' });
  const id = created.body.candidate.candidateId;
  const staleVersion = created.body.version;

  await call('POST', '/api/candidates/' + id + '/verify', { idempotencyKey: 'v1', expectedVersion: staleVersion });
  const conflicted = await call('POST', '/api/candidates/' + id + '/verify', { idempotencyKey: 'v2', expectedVersion: staleVersion });

  assert.equal(conflicted.status, 409);
  assert.equal(conflicted.body.error.code, 'version_conflict');
});

test('a repeated submission replays instead of doing the work twice', async () => {
  const store = createMemoryStore({ clock: createFixedClock() });
  const call = buildApi(store, 'r');
  const first = await call('POST', '/api/candidates', { ...intakeBody(), idempotencyKey: 'same-key' });
  const second = await call('POST', '/api/candidates', { ...intakeBody(), idempotencyKey: 'same-key' });

  assert.equal(first.body.candidate.candidateId, second.body.candidate.candidateId);
  assert.equal(second.body.replayed, true);
  assert.equal((await store.listCandidates()).length, 1, 'a double submission must not create two candidates');
});

test('the run event chain detects tampering', async () => {
  const store = createMemoryStore({ clock: createFixedClock() });
  await store.appendEvent('run_1', 'candidate_created', { candidateId: 'cand_1' });
  await store.appendEvent('run_1', 'verification_completed', { candidateId: 'cand_1' });
  assert.equal((await store.validateChain('run_1')).ok, true);

  const events = await store.readEvents('run_1');
  assert.equal(events[0].previousEventHash, null);
  assert.equal(events[1].previousEventHash, events[0].eventHash);
});

test('a tampered persisted event is detected on disk', async () => {
  await withTempDir(async (dir) => {
    const store = createJsonlStore({ rootDir: dir, clock: createFixedClock() });
    await store.appendEvent('run_1', 'candidate_created', { candidateId: 'cand_1' });
    await store.appendEvent('run_1', 'verification_completed', { candidateId: 'cand_1' });
    assert.equal((await store.validateChain('run_1')).ok, true);

    // Locate the events file without depending on the internal key derivation.
    const { readdir } = await import('node:fs/promises');
    const runDir = path.join(dir, 'runs');
    const [runKey] = await readdir(runDir);
    const eventsPath = path.join(runDir, runKey, 'events.jsonl');

    const lines = (await readFile(eventsPath, 'utf8')).split('\n').filter(Boolean);
    const tampered = JSON.parse(lines[0]);
    tampered.payload = { candidateId: 'someone_else' };
    await writeFile(eventsPath, [JSON.stringify(tampered), lines[1]].join('\n') + '\n', 'utf8');

    const result = await store.validateChain('run_1');
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /payload hash mismatch/);
  });
});

test('stored artifacts carry prompt, schema, and manifest hashes', async () => {
  await withTempDir(async (dir) => {
    const store = createJsonlStore({ rootDir: dir, clock: createFixedClock() });
    const stored = await store.putArtifact({
      type: 'evidence_packet',
      agentId: 'verifier',
      artifactId: 'artifact_1',
      runId: 'run_1'
    });
    const loaded = await store.getArtifact(stored.storageHash);

    assert.ok(loaded._meta.promptHash);
    assert.ok(loaded._meta.schemaHash);
    assert.ok(loaded._meta.manifestHash);
    assert.equal(loaded._meta.artifactHash, stored.artifactHash);
  });
});
