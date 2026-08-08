import { AGENT_REGISTRY, DETERMINISTIC_SERVICES, validateAgentRegistry } from '../packages/orchestra/src/agent-registry.mjs';
import { createOrchestraPlan, validateOrchestraPlan } from '../packages/orchestra/src/orchestrator.mjs';

const registryValidation = validateAgentRegistry();
if (!registryValidation.ok) {
  console.error(registryValidation.errors.join('\n'));
  process.exit(1);
}

const plan = createOrchestraPlan({
  objective: '오늘 게시할 제품 후보를 검증하고 서로 다른 Threads 초안 네 개를 준비한다.',
  candidateMode: 'discover',
  riskProfile: 'standard'
});

const planValidation = validateOrchestraPlan(plan);
if (!planValidation.ok) {
  console.error(planValidation.errors.join('\n'));
  process.exit(1);
}

console.log('ThreadScout AI — fixed six-agent orchestra');
console.log('');
for (const agent of AGENT_REGISTRY) {
  console.log(`${agent.order}. ${agent.nameKo} (${agent.id})`);
  console.log(`   ${agent.mission}`);
}
console.log('');
console.log('Run stages:');
for (const item of plan.stages) {
  const state = item.skipped ? `SKIPPED: ${item.skipReason}` : item.assignedTo;
  console.log(`- ${item.id}: ${item.label} [${state}]`);
}
console.log('');
console.log(`Deterministic services: ${DETERMINISTIC_SERVICES.map((service) => service.id).join(', ')}`);
console.log('External publishing: disabled');
