import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_IDS, AGENT_REGISTRY } from '../packages/orchestra/src/agent-registry.mjs';
import { createReplayModelRuntime } from '../packages/orchestra/src/model-runtime.mjs';
import { createSinbakReplayHandlers } from '../packages/orchestra/src/replay-fixtures.mjs';
import { executeWithModelRuntime } from '../packages/orchestra/src/executor.mjs';
import { createToolBroker } from '../packages/orchestra/src/tool-broker.mjs';
import { mergeRuntimeConfig, validateRuntimeConfig } from '../packages/orchestra/src/runtime-config.mjs';

test('runtime budgets cover exactly the fixed six agents', () => {
  const config = mergeRuntimeConfig();
  const result = validateRuntimeConfig(config);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(Object.keys(config.agents), AGENT_REGISTRY.map((agent) => agent.id));
});

test('provider-neutral replay runtime completes the six-agent flow', async () => {
  const runtime = createReplayModelRuntime({ replays: createSinbakReplayHandlers() });
  const result = await executeWithModelRuntime({
    runtime,
    objective: '실용 신박템을 검증하고 초안 네 개를 만든다.',
    runId: 'run-test-provider-runtime'
  });
  assert.equal(result.run.status, 'completed_local_only');
  assert.equal(result.modelReceipts.length, 6);
  assert.deepEqual(result.modelReceipts.map((item) => item.agentId), AGENT_REGISTRY.map((agent) => agent.id));
  assert.ok(result.modelReceipts.every((item) => item.provider === 'replay' && item.status === 'success'));
  assert.equal(result.run.artifacts.queue_record.publishingEnabled, false);
});

test('tool broker enforces each agent allowlist and blocks external-action tools', async () => {
  const broker = createToolBroker({
    handlers: { read_run_state: async (input) => ({ echoed: input }) }
  });
  const allowed = await broker.invoke({ agentId: AGENT_IDS.ORCHESTRATOR, toolName: 'read_run_state', input: { runId: 'r1' } });
  assert.deepEqual(allowed, { echoed: { runId: 'r1' } });
  await assert.rejects(
    broker.invoke({ agentId: AGENT_IDS.WRITER, toolName: 'read_run_state' }),
    /not allowed/
  );
  await assert.rejects(
    broker.invoke({ agentId: AGENT_IDS.ORCHESTRATOR, toolName: 'publish_external' }),
    /Forbidden external-action/
  );
});

test('malformed replay output is rejected before state progression', async () => {
  const replays = createSinbakReplayHandlers({
    [AGENT_IDS.GUARDIAN]: { decision: 'pass', blockers: ['must not pass'] }
  });
  const runtime = createReplayModelRuntime({ replays });
  await assert.rejects(
    executeWithModelRuntime({ runtime, objective: '잘못된 Guardian 출력 차단', runId: 'run-malformed' }),
    /Guardian cannot pass/
  );
  assert.equal(runtime.getReceipts().at(-1).status, 'failure');
});

test('per-agent output budget stops oversized model output', async () => {
  const replays = createSinbakReplayHandlers({
    [AGENT_IDS.WRITER]: (base) => ({ ...base, drafts: base.drafts.map((draft) => ({ ...draft, text: 'x'.repeat(2_000) })) })
  });
  const runtime = createReplayModelRuntime({
    replays,
    config: { agents: { [AGENT_IDS.WRITER]: { maxOutputChars: 500 } } }
  });
  await assert.rejects(
    executeWithModelRuntime({ runtime, objective: '출력 예산 검사', runId: 'run-budget' }),
    /output budget exceeded/
  );
});

test('human rejection through runtime produces no queue record', async () => {
  const runtime = createReplayModelRuntime({ replays: createSinbakReplayHandlers() });
  const result = await executeWithModelRuntime({
    runtime,
    objective: '사용자 거절 검사',
    runId: 'run-human-reject',
    humanDecision: 'rejected'
  });
  assert.equal(result.run.status, 'rejected');
  assert.equal(result.run.artifacts.queue_record, undefined);
});
