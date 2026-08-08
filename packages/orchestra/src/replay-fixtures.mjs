import { AGENT_IDS } from './agent-registry.mjs';
import { runSinbakFixtureSimulation } from './simulation.mjs';

const TYPE_BY_AGENT = Object.freeze({
  [AGENT_IDS.ORCHESTRATOR]: 'run_plan',
  [AGENT_IDS.SCOUT]: 'candidate_set',
  [AGENT_IDS.VERIFIER]: 'evidence_packet',
  [AGENT_IDS.STRATEGIST]: 'content_brief',
  [AGENT_IDS.WRITER]: 'draft_bundle',
  [AGENT_IDS.GUARDIAN]: 'review_report'
});

export function createSinbakReplayHandlers(overrides = {}) {
  const completed = runSinbakFixtureSimulation();
  return Object.fromEntries(Object.entries(TYPE_BY_AGENT).map(([agentId, type]) => [
    agentId,
    async ({ runId }) => {
      const base = structuredClone(completed.artifacts[type]);
      const override = overrides[agentId];
      const patched = typeof override === 'function' ? await override(base) : { ...base, ...(override ?? {}) };
      return { ...patched, runId };
    }
  ]));
}
