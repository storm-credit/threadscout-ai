import { runMasterHarnessSpike0Suite } from '../packages/orchestra/src/master-harness.mjs';

const result = await runMasterHarnessSpike0Suite();
const summary = {
  version: result.version,
  baseline: result.baseline,
  passed: result.passed,
  fixedAgentCount: result.fixedAgentCount,
  fixtureIds: result.fixtureIds,
  failedATs: result.failedATs,
  missingATs: result.missingATs,
  unexpectedStatuses: result.unexpectedStatuses,
  acceptance: result.acceptance,
  reports: result.reports.map((report) => ({
    fixtureId: report.fixtureId,
    status: report.status,
    route: report.route,
    receiptCount: report.receipts.length,
    stale: report.stale,
    casRejected: report.casRejected,
    secretLeak: report.secretLeak,
    semanticDigest: report.semanticDigest
  }))
};

console.log(JSON.stringify(summary, null, 2));
if (!result.passed) process.exitCode = 1;
