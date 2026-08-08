import { AGENT_REGISTRY } from './agent-registry.mjs';
import {
  completeLocalQueue,
  createOrchestraPlan,
  createRunState,
  getCurrentStage,
  recordHumanDecision,
  submitAgentArtifact
} from './orchestrator.mjs';

const AGENT_IDS = new Set(AGENT_REGISTRY.map((agent) => agent.id));

export async function executeWithModelRuntime({
  runtime,
  objective,
  runId = `run-runtime-${Date.now()}`,
  candidateMode = 'discover',
  candidateId = null,
  humanDecision = 'approved',
  humanActor = 'runtime-fixture-user',
  scheduledFor = '2026-08-09T08:10:00+09:00'
}) {
  if (!runtime || typeof runtime.invoke !== 'function') throw new Error('A model runtime is required.');
  const plan = createOrchestraPlan({ objective, candidateMode, candidateId });
  let run = createRunState(plan, runId);

  while (true) {
    const stage = getCurrentStage(run);
    if (!stage || !AGENT_IDS.has(stage.assignedTo)) break;
    const artifact = await runtime.invoke({
      agentId: stage.assignedTo,
      runId: run.runId,
      input: {
        objective: run.plan.objective,
        stage: structuredClone(stage),
        priorArtifacts: structuredClone(run.artifacts),
        blockers: structuredClone(run.blockers),
        revisionCounts: structuredClone(run.revisionCounts)
      }
    });
    run = submitAgentArtifact(run, stage.assignedTo, artifact);
  }

  run = recordHumanDecision(run, humanDecision, humanActor);
  if (humanDecision === 'approved') {
    run = completeLocalQueue(run, {
      id: `queue-${run.runId}`,
      scheduledFor,
      publishingEnabled: false,
      runtimeProvider: runtime.provider,
      synthetic: true
    });
  }

  return {
    run,
    modelReceipts: runtime.getReceipts?.() ?? [],
    usage: runtime.getUsage?.() ?? null
  };
}
