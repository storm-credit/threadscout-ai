import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  evaluateIssueProductDecision,
  resolveMediaPublicationFallback
} from '../packages/core/src/issue-media-governance.mjs';
import { RULE_IDS, runGuardianChecks } from '../packages/core/src/guardian-checks.mjs';
import { buildLearningSummary, createOutcomeSnapshot, isSafetyQuarantined } from '../packages/core/src/analytics-learning-service.mjs';
import { projectPublicShowcaseCard } from '../packages/core/src/public-showcase-projector.mjs';
import { createThreadScoutServer } from '../apps/web/server.mjs';
import { isNodeSqliteAvailable } from '../packages/database/src/sqlite-store.mjs';
import {
  EXPECTED_BOUNDARY_SHA_PREFIX,
  evaluateAgentActionSpace,
  evaluateFloorGuard,
  evaluateRootPayloadGovernance,
  evaluateSpecTraceability,
  runRepositoryGovernanceCheck
} from '../scripts/check-governance-and-floor.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withServer(storageMode, fn) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), `ts-issue-media-${storageMode}-`));
  const server = createThreadScoutServer({
    dataDir: tempDir,
    storageMode
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  let reqSeq = 0;

  async function cmd(command, { candidateId = null, expectedRevision = null, payload = {} } = {}) {
    reqSeq += 1;
    const res = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        requestId: `req-${storageMode}-${reqSeq}`,
        command,
        candidateId,
        expectedRevision,
        payload
      })
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  try {
    await fn({ baseUrl, cmd });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
}

test('Calibrated checker: cryptographic extract sha256, bidirectional traceability, and 6-agent <=5 bound fail on known-bad inputs (AT-39)', async () => {
  const realClaudeMd = await readFile(path.join(repoRoot, 'CLAUDE.md'), 'utf8');

  const over200Lines = `${realClaudeMd}\n${Array.from({ length: 100 }, (_, i) => `Pad ${i}`).join('\n')}`;
  const badRootLines = evaluateRootPayloadGovernance({
    rootFiles: [{ name: 'CLAUDE.md', content: over200Lines }]
  });
  assert.equal(badRootLines.ok, false);
  assert.match(badRootLines.errors[0], /exceeds 200 lines/);

  // Tampering a single word inside CLAUDE.md §21's verbatim extract while keeping `76e1e6d8bbd45f97` label MUST fail sha256!
  const tamperedExtract = realClaudeMd.replace(
    'If the role only adds a viewpoint, prefer a rubric/checklist/skill.',
    'If the role only adds a viewpoint, prefer creating a seventh agent.'
  );
  const badExtractHash = evaluateRootPayloadGovernance({
    rootFiles: [{ name: 'CLAUDE.md', content: tamperedExtract }]
  });
  assert.equal(badExtractHash.ok, false);
  assert.match(badExtractHash.errors[0], /sha256 mismatch/);

  // Bidirectional orphan checks: both missing mapped rows AND dangling matrix rows fail
  const badTrace = evaluateSpecTraceability({
    productRequirementsMd: '### PR-01\n### PR-02\n### PR-99\n',
    traceabilityMatrixMd: '| PR-01 | `MASTER_SPEC`, `MISSING_SPEC_DOC` | impl | AT-01 |\n| PR-02 |  | impl | AT-01 |\n| PR-88 | `MASTER_SPEC` | impl | AT-01 |\n',
    blindSpotSweepMd: '| BS-01 | B0 | owner |\n| BS-99 | B0 | unmapped |\n| BS-77 | B1 | lowered |\n',
    b0MatrixMd: '| BS-01 | title | `MASTER_SPEC` | check | AT-01 | AT-98 |\n| BS-77 | lowered | `MASTER_SPEC` | check | AT-01 |\n',
    acceptanceTestsMd: '## AT-01\n## AT-99\n',
    existingSpecNames: new Set(['MASTER_SPEC'])
  });
  assert.equal(badTrace.ok, false);
  assert.ok(badTrace.errors.some((e) => e.includes('PR-99')));
  assert.ok(badTrace.errors.some((e) => e.includes('PR-02') && e.includes('empty or unresolved Design authority')));
  assert.ok(badTrace.errors.some((e) => e.includes('PR-88')));
  assert.ok(badTrace.errors.some((e) => e.includes('BS-99')));
  assert.ok(badTrace.errors.some((e) => e.includes('BS-77')));
  assert.ok(badTrace.errors.some((e) => e.includes('AT-98')));
  assert.ok(badTrace.errors.some((e) => e.includes('AT-99')));
  assert.ok(badTrace.errors.some((e) => e.includes('MISSING_SPEC_DOC')));

  // Calibrated 6-agent & <= 5 tool action-space checker
  const badAgents = evaluateAgentActionSpace({
    registry: [
      { id: 'orchestrator', allowedTools: ['a', 'b'] },
      { id: 'scout', allowedTools: ['a'] },
      { id: 'verifier', allowedTools: ['1', '2', '3', '4', '5', '6'] },
      { id: 'strategist', allowedTools: ['a'] },
      { id: 'writer', allowedTools: ['a'] },
      { id: 'guardian', allowedTools: ['a'] },
      { id: 'price_watcher', allowedTools: ['a'] }
    ],
    validation: { ok: true, errors: [] }
  });
  assert.equal(badAgents.ok, false);
  assert.ok(badAgents.errors.some((e) => e.includes('Expected exactly 6 agents, got 7')));
  assert.ok(badAgents.errors.some((e) => e.includes('Forbidden dedicated price agent')));
  assert.ok(badAgents.errors.some((e) => e.includes('exceeds <= 5 local action-space tool bound')));

  const liveRepoCheck = await runRepositoryGovernanceCheck(repoRoot);
  assert.equal(liveRepoCheck.ok, true, `Expected repo governance green, got: ${liveRepoCheck.errors.join(' | ')}`);
  assert.equal(liveRepoCheck.rootCheck.extractShaPrefix, EXPECTED_BOUNDARY_SHA_PREFIX);
  assert.ok(['MEASURED', 'MEASURED_SHALLOW_HEAD'].includes(liveRepoCheck.floorCheck.diffStatus));
  assert.equal(liveRepoCheck.agentCount, 6);
  assert.ok(liveRepoCheck.rootCheck.totalLines <= 200);
});

test('Calibrated checker: evaluateFloorGuard blocks unmeasured diffs, suppressions, skips/todos, test deletions, tracked .env/db, and secrets', () => {
  const unmeasured = evaluateFloorGuard({ diffStatus: 'NOT_MEASURED' });
  assert.equal(unmeasured.ok, false);
  assert.match(unmeasured.errors[0], /NOT_MEASURED/);

  // Built dynamically so zero literal suppression/skip/secret strings exist in repository files
  const syntheticLintSuppression = `// eslint-${'disable'}-next-line no-unused-vars`;
  const syntheticCallbackSkip = `  t.${'skip'}('bypassed');`;
  const syntheticTestDef = `${'test'}('existing important test', () => {});`;
  const syntheticGoogleKey = `const key = "${'AIzaSy'}${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q'}";`;

  const badFloor = evaluateFloorGuard({
    diffStatus: 'MEASURED',
    addedLinesByFile: {
      'packages/core/src/example.mjs': [syntheticLintSuppression, syntheticGoogleKey],
      'tests/example.test.mjs': [syntheticCallbackSkip]
    },
    removedLinesByFile: {
      'tests/example.test.mjs': [syntheticTestDef]
    },
    deletedPaths: ['tests/removed-suite.test.mjs'],
    trackedPaths: ['README.md', '.env.production', '.threadscout-data/threadscout.sqlite'],
    gitleaksResult: { status: 'FAIL', detail: 'synthetic leak test' }
  });

  assert.equal(badFloor.ok, false);
  assert.equal(badFloor.counts.addedSuppressions, 1);
  assert.equal(badFloor.counts.addedTestSkips, 1);
  assert.equal(badFloor.counts.removedTestCases, 1);
  assert.ok(badFloor.errors.some((e) => e.includes('.env.production')));
  assert.ok(badFloor.errors.some((e) => e.includes('.threadscout-data/threadscout.sqlite')));
  assert.ok(badFloor.errors.some((e) => e.includes('Test file deletion blocked')));
  assert.ok(badFloor.errors.some((e) => e.includes('Net test-case deletion blocked')));
  assert.ok(badFloor.errors.some((e) => e.includes('High-confidence secret literal')));
  assert.ok(badFloor.errors.some((e) => e.includes('Net-new inline linter/type suppressions')));
  assert.ok(badFloor.errors.some((e) => e.includes('Net-new skipped/todo tests')));
  assert.ok(badFloor.errors.some((e) => e.includes('gitleaks --redact')));

  const cleanFloor = evaluateFloorGuard({
    diffStatus: 'MEASURED',
    addedLinesByFile: {
      'packages/core/src/example.mjs': ['export const value = 42;']
    },
    removedLinesByFile: {},
    trackedPaths: ['README.md', '.env.example'],
    gitleaksResult: { status: 'NOT_MEASURED', detail: 'gitleaks binary not installed locally' }
  });
  assert.equal(cleanFloor.ok, true);
});

test('Two-axis G0..G4 x R0..R5 matrix & Guardian wording ceilings enforce AT-03, AT-17, AT-27, AT-30, BS-26, BS-27', () => {
  // Invalid/unrecognized grade strings fail closed (`block`), never coercing to `'none'`
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'unknown', productRelationGrade: 'unknown', matchState: 'exact' }).routeOutcome,
    'block'
  );
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'G0', productRelationGrade: 'R1', matchState: 'exact', personIdentifiedFromImageOnly: 'true' }).routeOutcome,
    'block'
  );

  // AT-03 / BS-27: G4 rumor or R5 private inference -> unconditional block
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'G4', productRelationGrade: 'R0', matchState: 'exact' }).routeOutcome,
    'block'
  );
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'G0', productRelationGrade: 'R5', matchState: 'exact' }).routeOutcome,
    'block'
  );

  // AT-27: G1 + R2 and G3 + R1 -> verify_more
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'G1', productRelationGrade: 'R2', matchState: 'likely' }).routeOutcome,
    'verify_more'
  );
  assert.equal(
    evaluateIssueProductDecision({ issueSourceGrade: 'G3', productRelationGrade: 'R1', matchState: 'exact' }).routeOutcome,
    'verify_more'
  );

  // BS-26: Named-person endorsement/favorite (`김태리가 강추한 텀블러`, `김태리의 최애 텀블러`) blocks on G0 + R1,
  // while truthful negated sponsorship disclaimer (`유료 협찬이나 광고 모델이 아니라...`) stays quiet and passes!
  for (const namedEndorsement of [
    '김태리가 강추한 텀블러 규격 정리입니다.',
    '김태리의 최애 텀블러 스펙을 비교했습니다.',
    '유재석이 추천한 접이식 도마 치수입니다.',
    '유재석이 추천한 도마라 후회 없어요.',
    '유료 협찬받은 제품이라 부족함이 없어요.',
    '공식 캠페인 모델 발탁 소식 장난 아니네요.',
    '브랜드 앰버서더 착용샷이라 손색이 없네요.'
  ]) {
    const blocked = runGuardianChecks({
      drafts: [{ id: 'd1', title: '초안', text: namedEndorsement }],
      matchState: 'exact',
      mediaRightsResolved: true,
      publicationMediaRights: 'not_required',
      issueSourceGrade: 'G0',
      productRelationGrade: 'R1'
    });
    assert.equal(blocked.decision, 'block', `Expected named endorsement to block: ${namedEndorsement}`);
    assert.ok(blocked.revisionRequests.some((r) => r.ruleId === RULE_IDS.PUBLIC_FIGURE_ENDORSEMENT_IMPLICATION));
  }

  const negatedDisclaimerStaysQuiet = runGuardianChecks({
    drafts: [{
      id: 'd1',
      title: '초안',
      text: '유료 협찬이나 광고 모델 캠페인이 아니며 공개 방송 화면에 노출된 Brand M-1 블랙 규격만 정리했습니다.'
    }],
    matchState: 'exact',
    mediaRightsResolved: true,
    publicationMediaRights: 'not_required',
    issueSourceGrade: 'G0',
    productRelationGrade: 'R1'
  });
  assert.equal(negatedDisclaimerStaysQuiet.decision, 'pass');

  // Contrastive R4 copy clarifying that the linked item is NOT the worn broadcast item stays quiet (`NBR-R2-3`)
  const contrastiveR4Pass = runGuardianChecks({
    drafts: [{
      id: 'd1',
      title: '대체 후보',
      text: '방송 화면에서 착용한 제품과 같은 제품이 아니라 비슷한 대체 후보인 KitchenLab KL-ALT-02 규격입니다.'
    }],
    matchState: 'exact',
    mediaRightsResolved: true,
    publicationMediaRights: 'not_required',
    issueSourceGrade: 'G1',
    productRelationGrade: 'R4'
  });
  assert.equal(contrastiveR4Pass.decision, 'pass');

  // R3 (`attributed_report_only`): unattributed `방송에서 김태리가 착용한` OR mixed `기사에 언급되었으며 실제로 착용한` both block!
  for (const overclaimedR3 of [
    '방송에서 김태리가 착용한 도마 규격입니다.',
    '기사에 언급되었으며 실제로 착용한 도마입니다.'
  ]) {
    const r3Block = runGuardianChecks({
      drafts: [{ id: 'd1', title: '보도 인용', text: overclaimedR3 }],
      matchState: 'exact',
      mediaRightsResolved: true,
      publicationMediaRights: 'not_required',
      issueSourceGrade: 'G1',
      productRelationGrade: 'R3'
    });
    assert.equal(r3Block.decision, 'block', `Expected R3 ceiling to block: ${overclaimedR3}`);
    assert.ok(r3Block.revisionRequests.some((r) => r.ruleId === RULE_IDS.PUBLIC_FIGURE_WORDING_EXCEEDS_GRADE));
  }

  // AT-10 & AT-30 (`BF-1`): On `G1 + R4 + exact`, claiming `바로 그 제품(동일 제품)` blocks even if alternative wording is present,
  // AND putting `대체 후보` only in unpublished `draft.title` cannot mask its absence in `draft.text`!
  const r4SameProductBlock = runGuardianChecks({
    drafts: [{
      id: 'd1',
      title: '초안',
      text: '방송에 나온 바로 그 제품(동일 제품)이며 비슷한 대체 후보도 함께 정리했습니다.'
    }],
    matchState: 'exact',
    mediaRightsResolved: true,
    publicationMediaRights: 'not_required',
    issueSourceGrade: 'G1',
    productRelationGrade: 'R4'
  });
  assert.equal(r4SameProductBlock.decision, 'block');
  assert.ok(r4SameProductBlock.revisionRequests.some((r) => r.ruleId === RULE_IDS.EXACT_CLAIM_WITHOUT_EXACT_MATCH));

  const titleOnlyAltBlock = runGuardianChecks({
    drafts: [{
      id: 'd1',
      title: '비슷한 대체 후보 비교',
      text: '상판 두께 3.5cm 이하에 맞는 KitchenLab KL-ALT-02 규격입니다.'
    }],
    matchState: 'exact',
    mediaRightsResolved: true,
    publicationMediaRights: 'not_required',
    issueSourceGrade: 'G1',
    productRelationGrade: 'R4'
  });
  assert.equal(titleOnlyAltBlock.decision, 'block');
  assert.ok(titleOnlyAltBlock.revisionRequests.some((r) => r.ruleId === RULE_IDS.SUBSTITUTE_NOT_LABELLED));
});

test('Media funnel, Showcase 12h/7d TTL, missing-rights fail-closed, and Analytics AT-12 quarantine', () => {
  // Truthy string `'true'` for `aiGeneratedDepictsRealPerson` blocks fail-closed (`BS-22`)
  const aiStringFlag = resolveMediaPublicationFallback({
    publicationMediaRights: 'user_owned',
    aiGeneratedDepictsRealPerson: 'true'
  });
  assert.equal(aiStringFlag.publishable, false);
  assert.equal(aiStringFlag.reuploadAllowed, false);
  assert.equal(aiStringFlag.selectedTreatment, 'blocked');

  // Non-HTTPS `publishableMediaUrl` under `user_owned` fails closed immediately (`NBR-3`)
  const httpMedia = resolveMediaPublicationFallback({
    publicationMediaRights: 'user_owned',
    publishableMediaUrl: 'http://insecure.example.com/photo.jpg'
  });
  assert.equal(httpMedia.publishable, false);
  assert.equal(httpMedia.reasonCode, 'INVALID_PUBLISHABLE_MEDIA_URL');

  // Missing `mediaRights` on showcase candidate fails closed (`media_rights_not_publishable`)
  const missingRightsCard = projectPublicShowcaseCard({
    id: 'c-no-rights',
    cardNumber: 3,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false },
    guardian: { decision: 'pass' },
    exactMatchStatus: 'exact',
    brand: 'B',
    model: 'M',
    variant: 'V',
    verifiedPros: ['장점 한 줄'],
    verifiedLimitation: '한계 한 줄',
    evidencePacket: { observedAt: '2026-11-27T00:00:00.000Z' }
  }, { now: '2026-11-27T01:00:00.000Z' });
  assert.equal(missingRightsCard.projected, false);
  assert.equal(missingRightsCard.reason, 'media_rights_not_publishable');

  // Non-monetized (`affiliateState === 'none'`) issue-linked card (`G2 + R1`) enforces 12h `SHOWCASE_ISSUE_TTL_MS`
  const nonAffiliateIssueCand = {
    id: 'c-issue-ttl',
    cardNumber: 4,
    workflowState: 'approved',
    review: { decision: 'approved', stale: false },
    guardian: { decision: 'pass' },
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    issueSourceGrade: 'G2',
    productRelationGrade: 'R1',
    affiliate: false,
    brand: 'B',
    model: 'M',
    variant: 'V',
    verifiedPros: ['장점 한 줄'],
    verifiedLimitation: '한계 한 줄',
    evidencePacket: { observedAt: '2026-11-27T00:00:00.000Z' }
  };
  assert.equal(
    projectPublicShowcaseCard(nonAffiliateIssueCand, { now: '2026-11-27T11:00:00.000Z' }).projected,
    true
  );
  const expiredAt13h = projectPublicShowcaseCard(nonAffiliateIssueCand, { now: '2026-11-27T13:00:00.000Z' });
  assert.equal(expiredAt13h.projected, false);
  assert.equal(expiredAt13h.reason, 'withdrawn_ttl_expired');

  // Analytics (`BF-3`): `R4` auto-mapped (`affiliateMappingState: ''`) records `matchBadge: 'alternative'`,
  // `user_owned` records `mediaType: 'image'`, and `prohibited`/unpermitted-reupload/`G3` quarantine under `AT-12`
  const r4AutoSnap = createOutcomeSnapshot({
    candidate: {
      id: 'cand-r4-auto',
      name: '대체 도마',
      lane: 'practical-novel',
      exactMatchStatus: 'exact',
      issueSourceGrade: 'G1',
      productRelationGrade: 'R4',
      affiliate: true,
      affiliateNetwork: 'naver_shopping_connect',
      affiliateMappingState: '',
      mediaRights: 'user_owned',
      publishableMediaUrl: 'https://cdn.example.com/owned.jpg'
    },
    window: '24h',
    payload: { views: 800, saves: 20 }
  });
  assert.equal(r4AutoSnap.ok, true);
  assert.equal(r4AutoSnap.snapshot.matchBadge, 'alternative');
  assert.equal(r4AutoSnap.snapshot.mediaType, 'image');
  assert.equal(r4AutoSnap.snapshot.quarantined, false);

  assert.equal(
    isSafetyQuarantined({}, { id: 'q1', exactMatchStatus: 'exact', mediaRights: 'prohibited' }).quarantined,
    true
  );
  assert.equal(
    isSafetyQuarantined({}, {
      id: 'q2',
      exactMatchStatus: 'exact',
      mediaRights: 'analysis_only',
      publishableMediaUrl: 'https://cdn.example.com/unlicensed.jpg'
    }).quarantined,
    true
  );
  assert.equal(
    isSafetyQuarantined({}, {
      id: 'q3',
      exactMatchStatus: 'exact',
      mediaRights: 'not_required',
      issueSourceGrade: 'G3',
      productRelationGrade: 'R1'
    }).quarantined,
    true
  );

  const rumorCandidate = {
    id: 'cand-g4',
    lane: 'practical-novel',
    issueSourceGrade: 'G4',
    productRelationGrade: 'R1',
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    affiliate: false
  };
  const snapRes = createOutcomeSnapshot({
    candidate: rumorCandidate,
    window: '24h',
    payload: { views: 250000, saves: 4000, likes: 9000 }
  });
  assert.equal(snapRes.snapshot.quarantined, true);
  const summary = buildLearningSummary([snapRes.snapshot], [rumorCandidate]);
  assert.equal(summary.totals.cleanSnapshotCount, 0);
  assert.equal(summary.totals.quarantinedSnapshotCount, 1);
});

const storageModes = isNodeSqliteAvailable() ? ['sqlite', 'json'] : ['json'];

for (const mode of storageModes) {
  test(`E2E (${mode}): AT-03 G4 rumor block, AT-27 R2 verify_more gate, AT-26/31 text-only fallback, and AT-30 R4 alternative showcase`, async () => {
    await withServer(mode, async ({ baseUrl, cmd }) => {
      // 1. AT-03: High-engagement G4 dating rumor is immediately blocked & excluded from first screen
      const g4Add = await cmd('add_manual_candidate', {
        payload: {
          name: '연예인 열애설 목격담 속 텀블러',
          whyNow: '열애설 게시물 조회수 급증',
          readerValue: '텀블러 브랜드 추정',
          issueSourceGrade: 'G4',
          productRelationGrade: 'R2',
          opportunityScore: 99
        }
      });
      assert.equal(g4Add.status, 200);
      const inFirstScreen = g4Add.body.today.candidates.find((c) => c.id === g4Add.body.candidateId);
      assert.equal(inFirstScreen, undefined, 'G4 rumor candidate must never enter Today first screen');
      const inExcluded = g4Add.body.today.excluded.find((c) => c.id === g4Add.body.candidateId);
      assert.equal(inExcluded.riskLevel, 'blocked');
      assert.equal(inExcluded.workflowState, 'blocked');
      assert.equal(inExcluded.exclusionReason.reason, 'risk_blocked');

      // 2. AT-27: G1 broadcast + R2 visible clue stays in evidence_partial and gates Strategist
      const r2Add = await cmd('add_manual_candidate', {
        payload: {
          name: '예능 주방 장면에 잠깐 잡힌 접이식 도마',
          whyNow: '방송 직후 도마 모델 질문 다수',
          readerValue: '정확한 모델 확인 전 유사 규격 구분',
          issueSourceGrade: 'G1',
          productRelationGrade: 'R2',
          discoveryMediaState: 'viral_clip_unlicensed',
          mediaRights: 'analysis_only'
        }
      });
      assert.equal(r2Add.status, 200);
      const r2Id = r2Add.body.candidateId;
      const r2Rev1 = r2Add.body.today.candidates.find((c) => c.id === r2Id).revision;

      const r2Ver = await cmd('request_verification', {
        candidateId: r2Id,
        expectedRevision: r2Rev1,
        payload: {
          brand: 'KitchenLab',
          model: 'KL-Board',
          variant: '',
          sourceRef: 'https://broadcast.example/ep12',
          sourceOrigin: 'official_broadcast_vod',
          issueSourceGrade: 'G1',
          productRelationGrade: 'R2',
          discoveryMediaState: 'viral_clip_unlicensed',
          mediaRights: 'analysis_only'
        }
      });
      assert.equal(r2Ver.status, 200);
      const r2AfterVer = r2Ver.body.today.candidates.find((c) => c.id === r2Id);
      assert.equal(r2AfterVer.verifierDecision, 'hold');
      assert.equal(r2AfterVer.workflowState, 'evidence_partial');
      assert.equal(r2AfterVer.issueCardLabelKo, '제품 추정 — 검증 필요');

      const r2StratBlocked = await cmd('request_strategies', {
        candidateId: r2Id,
        expectedRevision: r2AfterVer.revision
      });
      assert.equal(r2StratBlocked.status, 422);
      assert.equal(r2StratBlocked.body.error, 'evidence_not_ready');

      // 3. AT-26, AT-30, AT-31: Upgrade to G1 + R4 verified alternative + viral clip discovery with analysis_only text fallback
      const r4Ver = await cmd('request_verification', {
        candidateId: r2Id,
        expectedRevision: r2AfterVer.revision,
        payload: {
          brand: 'KitchenLab',
          model: 'KL-ALT-02',
          variant: '그레이 대형',
          sourceRef: 'https://kitchenlab.example/kl-alt-02',
          sourceOrigin: 'manufacturer_spec',
          corroborationRef: 'https://smartstore.naver.com/kitchenlab/products/202',
          corroborationOrigin: 'naver_brand_store',
          ownerDeclaredSubstitute: false,
          issueSourceGrade: 'G1',
          productRelationGrade: 'R4',
          discoveryMediaState: 'viral_clip_unlicensed',
          mediaRights: 'analysis_only',
          affiliate: true,
          affiliateNetwork: 'naver_shopping_connect',
          affiliateMappingState: '',
          seller: '키친랩 공식 브랜드스토어',
          destinationUrl: 'https://smartstore.naver.com/kitchenlab/products/202',
          verifiedLimitation: '식기세척기 열풍 건조 시 모서리 미세 휨 가능성 있음'
        }
      });
      assert.equal(r4Ver.status, 200);
      let r4Cand = r4Ver.body.today.candidates.find((c) => c.id === r2Id);
      assert.equal(r4Cand.workflowState, 'evidence_ready');
      assert.equal(r4Cand.mediaSelectedTreatment, 'text_only');
      assert.equal(r4Cand.mediaReuploadAllowed, false);

      const stratRes = await cmd('request_strategies', { candidateId: r2Id, expectedRevision: r4Cand.revision });
      assert.equal(stratRes.status, 200);
      r4Cand = stratRes.body.today.candidates.find((c) => c.id === r2Id);

      const draftRes = await cmd('request_drafts', { candidateId: r2Id, expectedRevision: r4Cand.revision });
      assert.equal(draftRes.status, 200);
      r4Cand = draftRes.body.today.candidates.find((c) => c.id === r2Id);
      assert.match(r4Cand.drafts[0].text, /비슷한 제품/);

      const guardRes = await cmd('run_guardian', { candidateId: r2Id, expectedRevision: r4Cand.revision });
      assert.equal(guardRes.status, 200);
      r4Cand = guardRes.body.today.candidates.find((c) => c.id === r2Id);
      assert.equal(r4Cand.guardian.decision, 'pass');

      const appRes = await cmd('review_decision', {
        candidateId: r2Id,
        expectedRevision: r4Cand.revision,
        payload: { decision: 'approved', draftId: r4Cand.selectedDraftId }
      });
      assert.equal(appRes.status, 200);
      r4Cand = appRes.body.today.candidates.find((c) => c.id === r2Id);
      assert.equal(r4Cand.workflowState, 'approved');
      assert.equal(r4Cand.showcaseProjected, true);

      const showcaseRes = await fetch(`${baseUrl}/api/showcase/${r4Cand.cardNumber}`);
      assert.equal(showcaseRes.status, 200);
      const showcaseBody = await showcaseRes.json();
      assert.equal(showcaseBody.card.matchBadge, 'alternative');
      assert.equal(showcaseBody.card.publishableMediaUrl, null, 'Text-only fallback must never expose unlicensed viral media URL');
      assert.ok(showcaseBody.card.disclosureText.startsWith('[광고]'));

      // Direct projector check: if an unpermitted upload URL were present under analysis_only, showcase fails closed
      const tamperedProjection = projectPublicShowcaseCard({
        ...r4Cand,
        publishableMediaUrl: 'https://cdn.example.com/unlicensed.jpg'
      });
      assert.equal(tamperedProjection.projected, false);
      assert.equal(tamperedProjection.reason, 'unpermitted_media_reupload');
    });
  });
}
