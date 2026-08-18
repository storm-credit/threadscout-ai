// Deterministic end-to-end run of the manual candidate approval slice.
//
// Prints what each gate decided for every fixture family, so a reviewer can see the
// refusals as well as the happy path without opening a browser. Makes no network
// call and writes nothing outside memory.

import { createFixedClock, createIdFactory, deriveCandidateView } from '../packages/core/src/index.mjs';
import {
  createCandidateRecord,
  currentBinding,
  decide,
  draft,
  review,
  strategize,
  verify
} from '../packages/orchestra/src/pipeline.mjs';
import { SLICE1_SCENARIOS } from '../packages/orchestra/src/fixtures/slice1-scenarios.mjs';

const deps = { clock: createFixedClock('2026-08-14T00:00:00.000Z', 1000), nextId: createIdFactory('demo') };

console.log('ThreadScout · Slice 1 결정적 파이프라인');
console.log('외부 게시 · 라이브 소스 · 제휴 게시: 모두 비활성\n');

let failures = 0;

for (const scenario of SLICE1_SCENARIOS) {
  console.log('■ ' + scenario.key + ' — ' + scenario.candidate.name);
  let record = createCandidateRecord({ ...scenario.candidate, evidence: scenario.evidence }, deps);

  try {
    record = verify(record, deps);
    const packet = record.artifacts.evidence_packet;
    const view = deriveCandidateView({ candidate: record, evidencePacket: packet, currentBinding: {} }, deps.clock());

    console.log('  검증      : ' + packet.matchState + ' / ' + packet.verifierDecision);
    console.log('  준비도    : ' + view.evidenceReadinessLabel + '  위험: ' + view.riskLabel);
    console.log('  CTA       : ' + view.cta.label);
    if (view.dominantBlocker) console.log('  주요 항목 : [' + view.dominantBlocker.severity + '] ' + view.dominantBlocker.text);

    record = strategize(record, deps);
    console.log('  전략      : ' + record.artifacts.content_brief.angles.map((angle) => angle.readerJob).join(', '));

    record = draft(record, deps);
    console.log('  초안      : ' + record.artifacts.draft_bundle.drafts.length + '개');

    record = review(record, deps);
    const report = record.artifacts.review_report;
    console.log('  Guardian  : ' + report.decision);
    for (const blocker of report.nonOverridableBlockers) console.log('    차단    : ' + blocker);

    if (report.decision === 'pass') {
      record = decide(record, { decision: 'approve', actor: 'owner', claimedBinding: currentBinding(record) }, deps);
      console.log('  승인      : ' + record.approval.approvalId + ' (외부 게시 없음)');
    }
    console.log('  영수증    : ' + record.receipts.length + '건');
  } catch (error) {
    // A stop is the expected outcome for three of the five families.
    console.log('  중지      : [' + (error.code ?? error.name) + '] ' + error.message);
    for (const detail of error.details ?? []) console.log('    사유    : ' + detail);
    if (!error.code) failures += 1;
  }
  console.log('');
}

if (failures > 0) {
  console.error('예상하지 못한 오류가 ' + failures + '건 있습니다.');
  process.exit(1);
}
console.log('모든 시나리오가 설계된 게이트대로 통과 또는 중지했습니다.');
