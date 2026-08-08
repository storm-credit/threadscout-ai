import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createReplayModelRuntime } from '../packages/orchestra/src/model-runtime.mjs';
import { createSinbakReplayHandlers } from '../packages/orchestra/src/replay-fixtures.mjs';
import { executeWithModelRuntime } from '../packages/orchestra/src/executor.mjs';
import { createJsonlEvidenceStore } from '../packages/orchestra/src/evidence-store.mjs';

const rootDir = await mkdtemp(path.join(tmpdir(), 'threadscout-store-'));
try {
  const store = createJsonlEvidenceStore({ rootDir });
  const runtime = createReplayModelRuntime({ replays: createSinbakReplayHandlers() });
  const result = await executeWithModelRuntime({
    runtime,
    store,
    objective: '실용 신박템 실행을 버전·증거 저장소에 기록한다.',
    runId: 'run-phase2d-store-001'
  });
  const events = await store.readRunEvents(result.run.runId);
  const chain = await store.validateRunChain(result.run.runId);

  console.log('ThreadScout AI — versioned evidence store');
  console.log(`상태: ${result.run.status}`);
  console.log(`저장된 산출물: ${Object.keys(result.artifactHashes).length}`);
  console.log(`이벤트: ${events.length}`);
  console.log(`해시 체인: ${chain.ok ? '정상' : '오류'}`);
  console.log(`외부 게시: ${result.run.artifacts.queue_record.publishingEnabled ? '켜짐' : '꺼짐'}`);
  if (!chain.ok || result.run.status !== 'completed_local_only') process.exitCode = 1;
} finally {
  await rm(rootDir, { recursive: true, force: true });
}
