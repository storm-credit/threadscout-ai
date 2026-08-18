// Agent runtime: budgets and receipts around every specialist invocation.
//
// CLAUDE.md section 11 requires that runtime budgets cover exactly six agents and
// that every invocation produces a receipt. AT-18 fixes what a receipt has to
// contain — timing, status, and version metadata, and no secret values. AT-21 fixes
// what happens when a budget runs out: the Orchestrator returns a partial or
// blocked status and does not invent a seventh agent or quietly widen the budget.
//
// The runtime is deliberately provider-neutral. Today it wraps deterministic
// in-process functions; the same boundary is where a model provider would attach
// once its activation gate passes.

import { AGENT_REGISTRY } from './agent-registry.mjs';
import { mergeRuntimeConfig, validateRuntimeConfig } from './runtime-config.mjs';
import { buildVersionManifest } from './versioning.mjs';

export class BudgetExhaustedError extends Error {
  constructor(message, { agentId = null, limit = null } = {}) {
    super(message);
    this.name = 'BudgetExhaustedError';
    this.code = 'budget_exhausted';
    this.agentId = agentId;
    this.limit = limit;
  }
}

function charLength(value) {
  try {
    return JSON.stringify(value ?? null).length;
  } catch {
    return 0;
  }
}

/**
 * @param {object} options
 * @param {() => string} options.clock          injected time source
 * @param {object} [options.config]             runtime budget overrides
 * @param {object} [options.manifest]           prompt/schema/roster version manifest
 * @param {Array}  [options.receipts]           existing receipts to continue appending to
 */
export function createAgentRuntime({ clock, config: overrides = {}, manifest = buildVersionManifest(), receipts = [], epoch = 1 } = {}) {
  if (typeof clock !== 'function') throw new Error('An injected clock is required.');

  const config = mergeRuntimeConfig({ provider: 'deterministic', ...overrides });
  const validation = validateRuntimeConfig(config);
  if (!validation.ok) throw new Error('Invalid runtime config: ' + validation.errors.join(' | '));

  const attempts = Object.fromEntries(AGENT_REGISTRY.map((agent) => [agent.id, 0]));
  for (const receipt of receipts) {
    if (attempts[receipt.agentId] !== undefined) attempts[receipt.agentId] = Math.max(attempts[receipt.agentId], receipt.attempt);
  }
  const log = [...receipts];

  function totalInvocations() {
    return log.length;
  }

  /**
   * Invoke one specialist under its budget, recording a receipt either way.
   * A failure still produces a receipt; an unobserved failure is the one case
   * an audit trail must never have.
   */
  function invoke(agentId, agentFunction, request) {
    const budget = config.agents[agentId];
    if (!budget) throw new Error('No budget defined for agent: ' + agentId);

    if (totalInvocations() >= config.run.maxInvocations) {
      throw new BudgetExhaustedError('실행 전체 호출 한도를 초과했습니다.', { limit: config.run.maxInvocations });
    }
    if (attempts[agentId] >= budget.maxAttempts) {
      throw new BudgetExhaustedError(agentId + ' 호출 한도를 초과했습니다.', { agentId, limit: budget.maxAttempts });
    }

    attempts[agentId] += 1;
    const startedAt = clock();
    const inputChars = charLength(request);

    if (inputChars > budget.maxInputChars) {
      log.push({
        provider: config.provider,
        agentId,
        epoch,
        attempt: attempts[agentId],
        status: 'failure',
        error: 'input_budget_exceeded',
        inputChars,
        outputChars: 0,
        startedAt,
        completedAt: clock(),
        promptHash: manifest.promptHashes[agentId],
        schemaHash: manifest.schemaHashes[agentId],
        manifestHash: manifest.manifestHash
      });
      throw new BudgetExhaustedError(agentId + ' 입력이 예산을 초과했습니다.', { agentId, limit: budget.maxInputChars });
    }

    try {
      const result = agentFunction(request);
      const outputChars = charLength(result?.artifact);

      const receipt = {
        provider: config.provider,
        agentId,
        epoch,
        attempt: attempts[agentId],
        status: outputChars > budget.maxOutputChars ? 'failure' : 'success',
        inputChars,
        outputChars,
        artifactType: result?.artifact?.type ?? null,
        artifactId: result?.artifact?.artifactId ?? null,
        requestedNextAction: result?.requestedNextAction ?? null,
        startedAt,
        completedAt: clock(),
        // Version metadata, so a receipt identifies which agent configuration ran.
        promptHash: manifest.promptHashes[agentId],
        schemaHash: manifest.schemaHashes[agentId],
        manifestHash: manifest.manifestHash
      };
      log.push(receipt);

      if (receipt.status === 'failure') {
        throw new BudgetExhaustedError(agentId + ' 출력이 예산을 초과했습니다.', { agentId, limit: budget.maxOutputChars });
      }
      return result;
    } catch (error) {
      if (error instanceof BudgetExhaustedError) throw error;
      log.push({
        provider: config.provider,
        agentId,
        epoch,
        attempt: attempts[agentId],
        status: 'failure',
        // Message only: a receipt must never carry a stack trace or a value.
        error: String(error.message).slice(0, 500),
        inputChars,
        outputChars: 0,
        startedAt,
        completedAt: clock(),
        promptHash: manifest.promptHashes[agentId],
        schemaHash: manifest.schemaHashes[agentId],
        manifestHash: manifest.manifestHash
      });
      throw error;
    }
  }

  return {
    provider: config.provider,
    invoke,
    getReceipts: () => log.map((item) => ({ ...item })),
    getUsage: () => ({ totalInvocations: totalInvocations(), attempts: { ...attempts } }),
    getConfig: () => structuredClone(config)
  };
}
