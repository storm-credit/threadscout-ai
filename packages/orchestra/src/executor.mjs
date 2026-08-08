import { AGENT_REGISTRY } from './agent-registry.mjs';
import {
  completeLocalQueue,
  createOrchestraPlan,
  createRunState,
  getCurrentStage,
  recordHumanDecision,
  submitAgentArtifact
} from './orchestrator.mjs';
import { attachArtifactMetadata, buildVersionManifest, sha256 } from './versioning.mjs';

const AGENT_IDS = new Set(AGENT_REGISTRY.map((agent) => agent.id));

export async function executeWithModelRuntime({
  runtime,
  objective,
  runId = `run-runtime-${Date.now()}`,
  candidateMode = 'discover',
  candidateId = null,
  humanDecision = 'approved',
  humanActor = 'runtime-fixture-user',
  scheduledFor = '2026-08-09T08:10:00+09:00',
  store = null,
  versionManifest = buildVersionManifest()
}) {
  if (!runtime || typeof runtime.invoke !== 'function') throw new Error('A model runtime is required.');
  if (store && typeof store.appendRunEvent !== 'function') throw new Error('Store must implement appendRunEvent.');

  const plan = createOrchestraPlan({ objective, candidateMode, candidateId });
  let run = createRunState(plan, runId);
  const artifactHashes = {};
  const storageHashes = {};
  let currentEvidenceHash = null;

  try {
    if (store) {
      await store.appendRunEvent(run.runId, 'run_created', {
        objective: run.plan.objective,
        planHash: sha256(run.plan),
        manifestHash: versionManifest.manifestHash,
        provider: runtime.provider ?? 'unknown'
      });
    }

    while (true) {
      const stage = getCurrentStage(run);
      if (!stage || !AGENT_IDS.has(stage.assignedTo)) break;
      const rawArtifact = await runtime.invoke({
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

      if (rawArtifact.type === 'evidence_packet') currentEvidenceHash = sha256(rawArtifact);
      const artifact = attachArtifactMetadata({
        agentId: stage.assignedTo,
        artifact: rawArtifact,
        manifest: versionManifest,
        parentArtifactHashes: Object.values(artifactHashes),
        evidenceHash: currentEvidenceHash
      });

      artifactHashes[artifact.type] = artifact._meta.artifactHash;
      if (store) {
        const stored = await store.saveArtifact({ runId: run.runId, agentId: stage.assignedTo, artifact });
        storageHashes[artifact.type] = stored.storageHash;
        const receipt = runtime.getReceipts?.().at(-1);
        if (receipt) await store.appendRunEvent(run.runId, 'model_invocation_recorded', receipt);
      }
      run = submitAgentArtifact(run, stage.assignedTo, artifact);
    }

    run = recordHumanDecision(run, humanDecision, humanActor);
    if (store) await store.appendRunEvent(run.runId, 'human_decision_recorded', run.humanDecision);

    if (humanDecision === 'approved') {
      run = completeLocalQueue(run, {
        id: `queue-${run.runId}`,
        scheduledFor,
        publishingEnabled: false,
        runtimeProvider: runtime.provider,
        synthetic: true,
        manifestHash: versionManifest.manifestHash,
        evidenceHash: currentEvidenceHash
      });
      if (store) await store.appendRunEvent(run.runId, 'local_queue_recorded', run.artifacts.queue_record);
    }

    return {
      run,
      modelReceipts: runtime.getReceipts?.() ?? [],
      usage: runtime.getUsage?.() ?? null,
      versionManifest,
      artifactHashes,
      storageHashes,
      evidenceHash: currentEvidenceHash
    };
  } catch (error) {
    if (store) {
      await store.appendRunEvent(run.runId, 'run_failed', {
        stageId: getCurrentStage(run)?.id ?? null,
        errorName: error.name,
        errorMessage: String(error.message).slice(0, 1_000)
      });
    }
    throw error;
  }
}
