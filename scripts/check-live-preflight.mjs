import { buildLiveActivationPreflightReport } from '../packages/orchestra/src/live-activation-preflight.mjs';

const report = buildLiveActivationPreflightReport();

console.log('ThreadScout AI — Live Activation & Single-Post Publisher Preflight');
console.log(`- externalPublishingEnabled: ${report.externalPublishingEnabled}`);
console.log(`- anyLiveNetworkEnabled: ${report.anyLiveNetworkEnabled}`);
console.log(`- singleRootPostNoReplyToId: ${report.enforcedCodeGuards.singleRootPostNoReplyToId}`);
console.log(`- unknownTimeoutRequiresReconciliation: ${report.enforcedCodeGuards.unknownTimeoutRequiresReconciliation}`);

console.log('\n[Immediately Usable Local/Manual Commercial Surfaces]');
for (const item of report.localReadyNow) {
  console.log(`- ✔ ${item.nameKo}: ${item.summaryKo}`);
}

console.log('\n[Gated Live External APIs (Execution Disabled)]');
for (const gate of report.liveApiGates) {
  console.log(`- ${gate.nameKo}: ready=${gate.readyForLiveExecution}`);
  for (const blocker of gate.blockers) {
    console.log(`    · ${blocker}`);
  }
}

if (report.externalPublishingEnabled || report.anyLiveNetworkEnabled || report.liveApiGates.some((g) => g.readyForLiveExecution)) {
  console.error('Live external execution must remain disabled until explicit owner activation.');
  process.exit(1);
}
