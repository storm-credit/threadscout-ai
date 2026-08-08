import { LIVE_SOURCE_REGISTRY } from '../packages/orchestra/src/live-source-registry.mjs';
import { buildLiveSourceReadinessReport } from '../packages/orchestra/src/source-readiness.mjs';

const report = buildLiveSourceReadinessReport();
console.log('ThreadScout AI — live source readiness (execution disabled)');
for (const item of report) {
  const source = LIVE_SOURCE_REGISTRY.find((entry) => entry.id === item.sourceId);
  console.log(`\n${source.name}`);
  console.log(`- disposition: ${item.disposition}`);
  console.log(`- ready: ${item.readyForLiveExecution}`);
  for (const blocker of item.blockers) console.log(`- blocker: ${blocker}`);
}

if (report.some((item) => item.readyForLiveExecution)) {
  console.error('No live source should be executable in Phase 2F.');
  process.exit(1);
}
