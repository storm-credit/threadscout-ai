import { AGENT_SYSTEM_PROMPTS, validatePromptSet } from './prompts.mjs';
import { getAgentById } from './agent-registry.mjs';
import { validateAgentArtifact } from './contracts.mjs';
import { fenceUntrustedPayload } from './passive-data-fencer.mjs';
import { getAgentOutputSchema, validateArtifactSchema } from './schemas.mjs';
import { mergeRuntimeConfig, validateRuntimeConfig } from './runtime-config.mjs';

function charLength(value) {
  return JSON.stringify(value ?? null).length;
}

/**
 * Cumulative `(candidateId, lifecycleEpoch)` token/KRW ceiling tracker across Guardian `revise` loops
 * and retries (RUN_BUDGETS.md, AT-48, F28). Only an explicit `reopen_rejected_candidate` owner command
 * may advance `lifecycleEpoch` from `'rejected'`.
 */
export function createLifecycleBudgetTracker({
  maxCostKrw = 150,
  maxTotalChars = 120000,
  maxInvocations = 16,
  krwPerThousandChars = 1.2
} = {}) {
  const buckets = new Map();

  function keyOf(candidateId, lifecycleEpoch = 1) {
    if (!candidateId) throw new Error('candidateId is required for lifecycle budget tracking.');
    if (!Number.isInteger(lifecycleEpoch) || lifecycleEpoch < 1) {
      throw new Error('lifecycleEpoch must be a positive integer.');
    }
    return `${candidateId}::epoch:${lifecycleEpoch}`;
  }

  function getBucket(candidateId, lifecycleEpoch = 1) {
    const key = keyOf(candidateId, lifecycleEpoch);
    if (!buckets.has(key)) {
      buckets.set(key, {
        candidateId,
        lifecycleEpoch,
        invocations: 0,
        totalChars: 0,
        costKrw: 0,
        maxCostKrw,
        maxTotalChars,
        maxInvocations,
        exhausted: false
      });
    }
    return buckets.get(key);
  }

  function checkCanStart(candidateId, lifecycleEpoch = 1, incomingChars = 0) {
    const bucket = getBucket(candidateId, lifecycleEpoch);
    const projectedChars = bucket.totalChars + Math.max(0, incomingChars);
    const projectedCost = Number(((projectedChars / 1000) * krwPerThousandChars).toFixed(4));
    if (
      bucket.exhausted
      || bucket.invocations + 1 > bucket.maxInvocations
      || projectedChars > bucket.maxTotalChars
      || projectedCost > bucket.maxCostKrw
    ) {
      bucket.exhausted = true;
      return {
        allowed: false,
        stopCondition: 'budget_exhausted',
        snapshot: structuredClone(bucket)
      };
    }
    return { allowed: true, snapshot: structuredClone(bucket) };
  }

  function recordSpend(candidateId, lifecycleEpoch = 1, { inputChars = 0, outputChars = 0 } = {}) {
    const bucket = getBucket(candidateId, lifecycleEpoch);
    bucket.invocations += 1;
    bucket.totalChars += Math.max(0, inputChars) + Math.max(0, outputChars);
    bucket.costKrw = Number(((bucket.totalChars / 1000) * krwPerThousandChars).toFixed(4));
    if (
      bucket.invocations > bucket.maxInvocations
      || bucket.totalChars > bucket.maxTotalChars
      || bucket.costKrw > bucket.maxCostKrw
    ) {
      bucket.exhausted = true;
      return {
        withinBudget: false,
        stopCondition: 'budget_exhausted',
        snapshot: structuredClone(bucket)
      };
    }
    return { withinBudget: true, snapshot: structuredClone(bucket) };
  }

  return {
    checkCanStart,
    recordSpend,
    getSnapshot: (candidateId, lifecycleEpoch = 1) => structuredClone(getBucket(candidateId, lifecycleEpoch))
  };
}

function timeoutPromise(ms, agentId) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error(`${agentId} invocation timed out after ${ms}ms.`)), ms);
    timer.unref?.();
  });
}

export function createReplayModelRuntime({
  replays,
  config: overrides = {},
  lifecycleBudget = null
} = {}) {
  if (!replays || typeof replays !== 'object') throw new Error('Replay handlers are required.');
  const config = mergeRuntimeConfig({ provider: 'replay', ...overrides });
  const configValidation = validateRuntimeConfig(config);
  if (!configValidation.ok) throw new Error(`Invalid runtime config: ${configValidation.errors.join(' | ')}`);
  const promptValidation = validatePromptSet();
  if (!promptValidation.ok) throw new Error(`Invalid prompt set: ${promptValidation.errors.join(' | ')}`);

  const activeLifecycleBudget = lifecycleBudget ?? createLifecycleBudgetTracker();
  const attempts = Object.fromEntries(Object.keys(config.agents).map((id) => [id, 0]));
  const receipts = [];
  let totalOutputChars = 0;
  let totalInvocations = 0;
  const runStartedAt = Date.now();

  async function invoke({
    agentId,
    runId,
    candidateId = null,
    lifecycleEpoch = 1,
    untrustedEvidence = null,
    input = {}
  }) {
    const agent = getAgentById(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    const budget = config.agents[agentId];
    const effectiveBudgetKey = candidateId || runId || 'default-candidate';
    attempts[agentId] += 1;
    totalInvocations += 1;
    const startedAt = new Date().toISOString();

    let passiveDataFence = null;
    const rejectInvocation = (message, inputChars = 0, stopCondition = null) => {
      receipts.push({
        provider: 'replay',
        agentId,
        runId,
        candidateId: effectiveBudgetKey,
        lifecycleEpoch,
        attempt: attempts[agentId],
        inputChars,
        outputChars: 0,
        passiveDataFence,
        status: 'failure',
        stopCondition,
        error: message,
        startedAt,
        completedAt: new Date().toISOString()
      });
      const err = new Error(message);
      if (stopCondition) err.stopCondition = stopCondition;
      throw err;
    };

    if (attempts[agentId] > budget.maxAttempts) rejectInvocation(`${agentId} attempt limit exceeded.`);
    if (totalInvocations > config.run.maxInvocations) rejectInvocation('Runtime total invocation limit exceeded.');
    if (Date.now() - runStartedAt > config.run.maxElapsedMs) rejectInvocation('Runtime elapsed-time budget exceeded.');

    const preparedInput = structuredClone(input);
    const rawUntrusted = untrustedEvidence !== null && untrustedEvidence !== undefined
      ? untrustedEvidence
      : JSON.stringify(input ?? {});
    const fenced = fenceUntrustedPayload(rawUntrusted, { source: `${agentId}_input` });
    preparedInput.fencedUntrustedData = fenced.fencedText;
    preparedInput.passiveDataInstruction = fenced.instruction;
    passiveDataFence = { nonce: fenced.nonce, openTag: fenced.openTag, closeTag: fenced.closeTag };

    const request = {
      agentId,
      runId,
      systemPrompt: AGENT_SYSTEM_PROMPTS[agentId],
      outputSchema: getAgentOutputSchema(agentId),
      input: preparedInput
    };
    const inputChars = charLength(request);
    if (inputChars > budget.maxInputChars) rejectInvocation(`${agentId} input budget exceeded.`, inputChars);

    const precheck = activeLifecycleBudget.checkCanStart(effectiveBudgetKey, lifecycleEpoch, inputChars);
    if (!precheck.allowed) {
      rejectInvocation(
        `Candidate ${effectiveBudgetKey} (epoch ${lifecycleEpoch}) lifecycle KRW/token budget exhausted.`,
        inputChars,
        'budget_exhausted'
      );
    }

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

      const postcheck = activeLifecycleBudget.recordSpend(effectiveBudgetKey, lifecycleEpoch, { inputChars, outputChars });
      if (!postcheck.withinBudget) {
        const budgetErr = new Error(`Candidate ${effectiveBudgetKey} (epoch ${lifecycleEpoch}) lifecycle KRW/token budget exhausted.`);
        budgetErr.stopCondition = 'budget_exhausted';
        throw budgetErr;
      }

      const semantic = validateAgentArtifact(agentId, output);
      const schema = validateArtifactSchema(agentId, output);
      const errors = [...semantic.errors, ...schema.errors];
      if (errors.length) throw new Error(`Invalid ${agentId} output: ${errors.join(' | ')}`);

      receipts.push({
        provider: 'replay',
        agentId,
        runId,
        candidateId,
        lifecycleEpoch,
        attempt: attempts[agentId],
        inputChars,
        outputChars,
        passiveDataFence,
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
        candidateId,
        lifecycleEpoch,
        attempt: attempts[agentId],
        inputChars,
        outputChars: 0,
        passiveDataFence,
        status: 'failure',
        stopCondition: error.stopCondition ?? null,
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
