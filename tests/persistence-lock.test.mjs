import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LockedAtomicJsonApplicationStore } from '../apps/web/locked-application-store.mjs';
import { createThreadScoutServer } from '../apps/web/server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withStores(fn, options = {}) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-lock-'));
  const filePath = path.join(dataDir, 'application-state.json');
  const common = { filePath, lockRetryMs: 5, ...options };
  const storeA = new LockedAtomicJsonApplicationStore(common);
  const storeB = new LockedAtomicJsonApplicationStore(common);
  try {
    await Promise.all([storeA.initialize(), storeB.initialize()]);
    await fn({ dataDir, filePath, lockPath: `${filePath}.lock`, storeA, storeB });
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
}

function addRequest(requestId, name) {
  return {
    requestId,
    command: 'add_manual_candidate',
    payload: {
      name,
      brand: 'LockLab',
      model: requestId,
      variant: '기본형',
      sourceRef: `owner-note:${requestId}`,
      whyNow: '동시에 들어오는 서버 명령에서도 이전 변경을 잃지 않는지 확인',
      readerValue: '여러 화면이나 프로세스가 동시에 저장해도 승인 상태를 보존',
      mediaRights: 'not_required',
      personalUse: 'not_confirmed'
    }
  };
}

test('independent store instances serialize concurrent writes without losing either candidate', async () => {
  await withStores(async ({ storeA, storeB }) => {
    await Promise.all([
      storeA.execute(addRequest('lock-a', '동시 저장 A')),
      storeB.execute(addRequest('lock-b', '동시 저장 B'))
    ]);

    const state = await storeA.readState();
    const names = new Set(state.candidates.map((candidate) => candidate.name));
    assert.equal(names.has('동시 저장 A'), true);
    assert.equal(names.has('동시 저장 B'), true);
    assert.equal(state.candidates.length, 4);
  });
});

test('idempotency key remains single-apply across independent store instances', async () => {
  await withStores(async ({ storeA, storeB }) => {
    const request = addRequest('shared-request-id', '한 번만 저장');
    const [first, second] = await Promise.all([
      storeA.execute(request),
      storeB.execute(structuredClone(request))
    ]);

    const state = await storeA.readState();
    assert.equal(state.candidates.filter((candidate) => candidate.name === '한 번만 저장').length, 1);
    assert.equal([first, second].filter((result) => result.idempotentReplay === true).length, 1);
  });
});

test('fresh competing lock fails closed with a bounded storage_lock_timeout', async () => {
  await withStores(async ({ lockPath, storeA }) => {
    await writeFile(lockPath, `${JSON.stringify({ token: 'active-writer', pid: 99999 })}\n`, 'utf8');
    const before = await storeA.readState();

    await assert.rejects(
      () => storeA.execute(addRequest('blocked-write', '저장되면 안 됨')),
      (error) => {
        assert.equal(error.code, 'storage_lock_timeout');
        assert.equal(error.statusCode, 503);
        assert.equal(error.details.persistenceScope, 'single_host_local_filesystem');
        return true;
      }
    );

    const after = await storeA.readState();
    assert.equal(after.candidates.length, before.candidates.length);
    assert.equal(after.candidates.some((candidate) => candidate.name === '저장되면 안 됨'), false);
  }, { lockTimeoutMs: 25, lockStaleMs: 60000 });
});

test('abandoned stale lock is recovered before applying a new command', async () => {
  await withStores(async ({ lockPath, storeA }) => {
    await writeFile(lockPath, `${JSON.stringify({ token: 'abandoned-writer', pid: 99998 })}\n`, 'utf8');
    const old = new Date(Date.now() - 5000);
    await utimes(lockPath, old, old);

    const result = await storeA.execute(addRequest('recover-stale', 'stale lock 복구'));
    assert.equal(result.result, 'candidate_added');

    const state = await storeA.readState();
    assert.equal(state.candidates.some((candidate) => candidate.name === 'stale lock 복구'), true);
  }, { lockTimeoutMs: 200, lockStaleMs: 50 });
});

test('an old lock owner cannot delete a successor lock during release', async () => {
  await withStores(async ({ lockPath, storeA }) => {
    const oldToken = await storeA.acquireWriteLock();
    await rm(lockPath);
    await writeFile(lockPath, `${JSON.stringify({ token: 'successor-token', pid: 12345 })}\n`, 'utf8');

    const released = await storeA.releaseWriteLock(oldToken);
    assert.equal(released, false);

    const successor = JSON.parse(await readFile(lockPath, 'utf8'));
    assert.equal(successor.token, 'successor-token');
    await rm(lockPath);
  });
});

test('HTTP command boundary returns 503 and an orchestration receipt when storage lock times out', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'threadscout-lock-api-'));
  const statePath = path.join(dataDir, 'application-state.json');
  const lockPath = `${statePath}.lock`;
  const server = createThreadScoutServer({
    repoRoot,
    dataDir,
    storeOptions: { lockTimeoutMs: 25, lockStaleMs: 60000, lockRetryMs: 5 }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const todayResponse = await fetch(`${baseUrl}/api/today`);
    assert.equal(todayResponse.status, 200);
    const today = await todayResponse.json();
    assert.equal(today.capability.persistence, 'server_atomic_json_local_interprocess_locked');
    assert.equal(today.capability.persistenceScope, 'single_host_local_filesystem');

    await writeFile(lockPath, `${JSON.stringify({ token: 'api-active-writer', pid: 99997 })}\n`, 'utf8');
    const response = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(addRequest('api-blocked-write', 'API에서 저장되면 안 됨'))
    });
    const result = await response.json();

    assert.equal(response.status, 503);
    assert.equal(result.error, 'storage_lock_timeout');
    assert.equal(result.orchestrationReceipt.status, 'failure');
    assert.deepEqual(result.orchestrationReceipt.route, ['orchestrator', 'deterministic_application_service', 'orchestrator']);

    await rm(lockPath);
    const after = await (await fetch(`${baseUrl}/api/today`)).json();
    assert.equal(after.candidates.some((candidate) => candidate.name === 'API에서 저장되면 안 됨'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
});
