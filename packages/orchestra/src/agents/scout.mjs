// Product Scout.
//
// Present and skipped, not absent. MASTER_SPEC.md permits the Orchestrator to skip
// Scout when the owner supplies a concrete product, which is exactly the flow this
// slice implements. Discovery sources are network sources and every one of them is
// disabled until its activation gate passes (DESIGN_FREEZE.md).
//
// Scout therefore refuses rather than fabricating candidates, and says why.

import { ARTIFACT_TYPES, createEnvelope } from '../../../core/src/artifacts.mjs';
import { AGENT_IDS } from '../../../core/src/handoff.mjs';

export const SCOUT_DISABLED_REASON =
  '자동 발굴 소스가 활성화되지 않아 Scout 단계를 건너뜁니다. 사용자가 지정한 제품으로 검증부터 시작합니다.';

/**
 * Why Scout was skipped, for the run record and the UI.
 * A skipped stage is an explicit fact with a reason, not a silent gap.
 */
export function scoutSkipRecord(clock) {
  return {
    agentId: AGENT_IDS.SCOUT,
    skipped: true,
    reason: SCOUT_DISABLED_REASON,
    recordedAt: clock()
  };
}

/**
 * Discovery entry point. It exists so the roster stays complete and the boundary
 * stays testable; in this slice it always blocks.
 */
export function runScout(request, { clock, nextId }) {
  const artifact = {
    ...createEnvelope({
      type: ARTIFACT_TYPES.CANDIDATE_SET,
      agentId: AGENT_IDS.SCOUT,
      runId: request.runId,
      artifactId: nextId('artifact'),
      createdAt: clock(),
      inputArtifactRefs: [],
      evidenceRefs: []
    }),
    candidates: []
  };
  artifact.blockers.push(SCOUT_DISABLED_REASON);
  return { artifact, requestedNextAction: 'hold', status: 'blocked' };
}
