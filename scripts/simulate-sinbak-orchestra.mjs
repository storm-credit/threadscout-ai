import { AGENT_REGISTRY } from '../packages/orchestra/src/agent-registry.mjs';
import { runSinbakFixtureSimulation } from '../packages/orchestra/src/simulation.mjs';

const run = runSinbakFixtureSimulation();
const candidate = run.artifacts.candidate_set.candidates[0];
const drafts = run.artifacts.draft_bundle.drafts;

console.log('ThreadScout AI — 실용 신박템 고정 6에이전트 통합 시뮬레이션');
console.log(`상태: ${run.status}`);
console.log(`후보: ${candidate.name} (${candidate.score}점, ${candidate.status})`);
console.log(`에이전트: ${AGENT_REGISTRY.map((agent) => agent.nameKo).join(' → ')}`);
console.log(`Guardian: ${run.artifacts.review_report.decision}`);
console.log(`초안 수: ${drafts.length}`);
console.log(`외부 게시: ${run.artifacts.queue_record.publishingEnabled ? '켜짐' : '꺼짐'}`);

for (const [index, draft] of drafts.entries()) {
  console.log(`\n[초안 ${index + 1} · ${draft.angleId}]\n${draft.text}`);
}

if (run.status !== 'completed_local_only') process.exit(1);
