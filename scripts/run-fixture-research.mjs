import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createJsonlEvidenceStore } from '../packages/orchestra/src/evidence-store.mjs';
import { runFixtureResearchPipeline } from '../packages/orchestra/src/fixture-research-pipeline.mjs';

const rootDir = await mkdtemp(path.join(tmpdir(), 'threadscout-research-'));
try {
  const store = createJsonlEvidenceStore({ rootDir });
  const result = await runFixtureResearchPipeline({ query: '싱크대 물튐', runId: 'run-fixture-research-001', store });
  const chain = await store.validateRunChain('run-fixture-research-001');
  console.log('ThreadScout AI — read-only fixture research');
  console.log(`소스: ${result.records.length}`);
  console.log(`후보: ${result.candidates.length}`);
  console.log(`네트워크: ${result.networkAllowed ? '켜짐' : '꺼짐'}`);
  console.log(`쓰기 동작: ${result.mutationAllowed ? '허용' : '금지'}`);
  console.log(`이벤트 체인: ${chain.ok ? '정상' : '오류'}`);
  for (const candidate of result.candidates) {
    console.log(`- ${candidate.canonicalHint.name}: 구매의도 ${candidate.purchaseIntent}, 근거 ${candidate.sourceIds.length}개, exact-ready=${candidate.exactMatchReady}`);
  }
  if (!chain.ok) process.exitCode = 1;
} finally {
  await rm(rootDir, { recursive: true, force: true });
}
