import { AGENT_IDS } from './agent-registry.mjs';
import { buildCandidateEvidence, validateCandidateEvidence } from './candidate-evidence.mjs';
import { createFixtureResearchAdapter } from './fixture-research-adapter.mjs';
import { createFixtureResearchToolHandlers } from './research-tools.mjs';
import { createToolBroker } from './tool-broker.mjs';

export async function runFixtureResearchPipeline({ query, runId, store = null, adapter = createFixtureResearchAdapter() }) {
  if (!query || !runId) throw new Error('query and runId are required.');
  const broker = createToolBroker({ handlers: createFixtureResearchToolHandlers({ adapter }) });
  const records = await broker.invoke({ agentId: AGENT_IDS.SCOUT, toolName: 'public_search', input: { query, limit: 20 } });
  const candidates = buildCandidateEvidence(records);

  for (const candidate of candidates) {
    const validation = validateCandidateEvidence(candidate);
    candidate.validation = validation;
  }

  if (store) {
    await store.appendRunEvent(runId, 'fixture_research_started', { query, adapterId: adapter.id, synthetic: true });
    for (const source of records) await store.saveSource({ runId, source });
    await store.appendRunEvent(runId, 'fixture_research_completed', {
      query,
      sourceIds: records.map((record) => record.id),
      candidateIds: candidates.map((candidate) => candidate.candidateId),
      toolReceipts: broker.getReceipts(),
      synthetic: true
    });
  }

  return { records, candidates, toolReceipts: broker.getReceipts(), networkAllowed: false, mutationAllowed: false };
}
