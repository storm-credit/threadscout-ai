import { getAgentById } from './agent-registry.mjs';

function now() {
  return new Date().toISOString();
}

export function createToolBroker({ handlers = {} } = {}) {
  const receipts = [];

  async function invoke({ agentId, toolName, input = {} }) {
    const agent = getAgentById(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    if (/publish|payment|purchase/i.test(toolName)) {
      throw new Error(`Forbidden external-action tool: ${toolName}`);
    }
    if (!agent.allowedTools.includes(toolName)) {
      throw new Error(`${agentId} is not allowed to use ${toolName}.`);
    }
    const handler = handlers[toolName];
    if (typeof handler !== 'function') throw new Error(`No deterministic handler registered for ${toolName}.`);

    const startedAt = now();
    try {
      const output = await handler(structuredClone(input), { agentId, toolName });
      receipts.push({ agentId, toolName, status: 'success', startedAt, completedAt: now() });
      return structuredClone(output);
    } catch (error) {
      receipts.push({ agentId, toolName, status: 'failure', error: error.message, startedAt, completedAt: now() });
      throw error;
    }
  }

  return {
    invoke,
    getReceipts: () => structuredClone(receipts)
  };
}
