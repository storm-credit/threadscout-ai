import { AGENT_REGISTRY } from './agent-registry.mjs';

const DEFAULT_AGENT_BUDGET = Object.freeze({
  timeoutMs: 2_000,
  maxAttempts: 2,
  maxInputChars: 80_000,
  maxOutputChars: 40_000
});

export const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  provider: 'replay',
  run: Object.freeze({
    maxInvocations: 12,
    maxOutputChars: 160_000,
    maxElapsedMs: 15_000
  }),
  agents: Object.freeze(Object.fromEntries(
    AGENT_REGISTRY.map((agent) => [agent.id, Object.freeze({ ...DEFAULT_AGENT_BUDGET })])
  ))
});

export function mergeRuntimeConfig(overrides = {}) {
  const agents = Object.fromEntries(
    AGENT_REGISTRY.map((agent) => [
      agent.id,
      {
        ...DEFAULT_RUNTIME_CONFIG.agents[agent.id],
        ...(overrides.agents?.[agent.id] ?? {})
      }
    ])
  );

  return {
    provider: overrides.provider ?? DEFAULT_RUNTIME_CONFIG.provider,
    run: { ...DEFAULT_RUNTIME_CONFIG.run, ...(overrides.run ?? {}) },
    agents
  };
}

export function validateRuntimeConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') return { ok: false, errors: ['Runtime config must be an object.'] };
  if (typeof config.provider !== 'string' || !config.provider) errors.push('provider is required.');
  const expectedIds = AGENT_REGISTRY.map((agent) => agent.id);
  const actualIds = Object.keys(config.agents ?? {});
  if (actualIds.length !== 6 || expectedIds.some((id) => !actualIds.includes(id))) {
    errors.push('Runtime config must define budgets for exactly the fixed six agents.');
  }

  for (const agentId of expectedIds) {
    const budget = config.agents?.[agentId];
    for (const key of ['timeoutMs', 'maxAttempts', 'maxInputChars', 'maxOutputChars']) {
      if (!Number.isFinite(budget?.[key]) || budget[key] <= 0) errors.push(`${agentId}.${key} must be positive.`);
    }
  }

  for (const key of ['maxInvocations', 'maxOutputChars', 'maxElapsedMs']) {
    if (!Number.isFinite(config.run?.[key]) || config.run[key] <= 0) errors.push(`run.${key} must be positive.`);
  }

  return { ok: errors.length === 0, errors };
}
