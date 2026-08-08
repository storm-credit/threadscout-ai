import { createReplayModelRuntime } from '../packages/orchestra/src/model-runtime.mjs';
import { createSinbakReplayHandlers } from '../packages/orchestra/src/replay-fixtures.mjs';
import { executeWithModelRuntime } from '../packages/orchestra/src/executor.mjs';

const runtime = createReplayModelRuntime({ replays: createSinbakReplayHandlers() });
const result = await executeWithModelRuntime({
  runtime,
  objective: '실용 신박템 후보를 고정 여섯 에이전트로 처리한다.',
  runId: 'run-phase2c-replay-001'
});

console.log('ThreadScout AI — provider-neutral replay runtime');
console.log(`상태: ${result.run.status}`);
console.log(`제공자: ${runtime.provider}`);
console.log(`모델 호출 영수증: ${result.modelReceipts.length}`);
console.log(`총 출력 문자: ${result.usage.totalOutputChars}`);
console.log(`외부 게시: ${result.run.artifacts.queue_record.publishingEnabled ? '켜짐' : '꺼짐'}`);
for (const receipt of result.modelReceipts) {
  console.log(`- ${receipt.agentId}: ${receipt.status}, ${receipt.outputChars} chars, attempt ${receipt.attempt}`);
}

if (result.run.status !== 'completed_local_only') process.exit(1);
