import { AGENT_SYSTEM_PROMPTS, validatePromptSet } from './prompts.mjs';
import { getAgentById } from './agent-registry.mjs';
import { validateAgentArtifact } from './contracts.mjs';
import { getAgentOutputSchema, validateArtifactSchema } from './schemas.mjs';
import { mergeRuntimeConfig, validateRuntimeConfig } from './runtime-config.mjs';

function charLength(value) {
  return JSON.stringify(value ?? null).length;
}

function timeoutPromise(ms, agentId) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error(`${agentId} invocation timed out after ${ms}ms.`)), ms);
    timer.unref?.();
  });
}

export function createReplayModelRuntime({ replays, config: overrides = {} } = {}) {
  if (!replays || typeof replays !== 'object') throw new Error('Replay handlers are required.');
  const config = mergeRuntimeConfig({ provider: 'replay', ...overrides });
  const configValidation = validateRuntimeConfig(config);
  if (!configValidation.ok) throw new Error(`Invalid runtime config: ${configValidation.errors.join(' | ')}`);
  const promptValidation = validatePromptSet();
  if (!promptValidation.ok) throw new Error(`Invalid prompt set: ${promptValidation.errors.join(' | ')}`);

  const attempts = Object.fromEntries(Object.keys(config.agents).map((id) => [id, 0]));
  const receipts = [];
  let totalOutputChars = 0;
  let totalInvocations = 0;
  const runStartedAt = Date.now();

  async function invoke({ agentId, runId, input = {} }) {
    const agent = getAgentById(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    const budget = config.agents[agentId];
    attempts[agentId] += 1;
    totalInvocations += 1;
    const startedAt = new Date().toISOString();

    const rejectInvocation = (message, inputChars = 0) => {
      receipts.push({
        provider: 'replay',
        agentId,
        runId,
        attempt: attempts[agentId],
        inputChars,
        outputChars: 0,
        status: 'failure',
        error: message,
        startedAt,
        completedAt: new Date().toISOString()
      });
      throw new Error(message);
    };

    if (attempts[agentId] > budget.maxAttempts) rejectInvocation(`${agentId} attempt limit exceeded.`);
    if (totalInvocations > config.run.maxInvocations) rejectInvocation('Runtime total invocation limit exceeded.');
    if (Date.now() - runStartedAt > config.run.maxElapsedMs) rejectInvocation('Runtime elapsed-time budget exceeded.');

    const request = {
      agentId,
      runId,
      systemPrompt: AGENT_SYSTEM_PROMPTS[agentId],
      outputSchema: getAgentOutputSchema(agentId),
      input: structuredClone(input)
    };
    const inputChars = charLength(request);
    if (inputChars > budget.maxInputChars) rejectInvocation(`${agentId} input budget exceeded.`, inputChars);

    const replay = replays[agentId];
    if (typeof replay !== 'function') rejectInvocation(`Missing replay handler for ${agentId}.`, inputChars);

    try {
      const output = await Promise.race([
        Promise.resolve(replay(structuredClone(request))),
        timeoutPromise(budget.timeoutMs, agentId)
      ]);
      const outputChars = charLength(output);
      if (outputChars > budget.maxOutputChars) throw new Error(`${agentId} output budget exceeded.`);
      totalOutputChars += outputChars;
      if (totalOutputChars > config.run.maxOutputChars) throw new Error('Runtime total output budget exceeded.');

      const semantic = validateAgentArtifact(agentId, output);
      const schema = validateArtifactSchema(agentId, output);
      const errors = [...semantic.errors, ...schema.errors];
      if (errors.length) throw new Error(`Invalid ${agentId} output: ${errors.join(' | ')}`);

      receipts.push({
        provider: 'replay',
        agentId,
        runId,
        attempt: attempts[agentId],
        inputChars,
        outputChars,
        status: 'success',
        startedAt,
        completedAt: new Date().toISOString()
      });
      return structuredClone(output);
    } catch (error) {
      receipts.push({
        provider: 'replay',
        agentId,
        runId,
        attempt: attempts[agentId],
        inputChars,
        outputChars: 0,
        status: 'failure',
        error: error.message,
        startedAt,
        completedAt: new Date().toISOString()
      });
      throw error;
    }
  }

  return {
    provider: 'replay',
    invoke,
    getReceipts: () => structuredClone(receipts),
    getUsage: () => ({ totalInvocations, totalOutputChars, attempts: structuredClone(attempts) }),
    getConfig: () => structuredClone(config)
  };
}
