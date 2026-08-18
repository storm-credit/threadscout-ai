// Contracts the manual slice must satisfy beyond the happy path.
//
// Each test names the acceptance ID from docs/spec/ACCEPTANCE_TESTS.md it implements.
// Where a gate exists, the test proves it refuses: a gate never observed saying no
// has not been tested.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MATCH_STATES,
  countIndependentOrigins,
  decideMatchState,
  decideVerifierDecision,
  wordingRuleFor
} from '../packages/core/src/product-matching.mjs';

import {
  GUARDIAN_CHECK_KEYS,
  detectFirstHandLanguage,
  detectSameProductClaim,
  runGuardianChecks
} from '../packages/core/src/guardian-checks.mjs';

import {
  evaluateEvidenceReadiness,
  evaluateFreshness,
  evaluateRisk,
  scoreOpportunity,
  selectFirstScreen
} from '../packages/core/src/candidate-ranking.mjs';

/* AT-04 / AT-40 — identity needs corroboration from independent origins ------ */

test('AT-40: references sharing one origin count as one piece of evidence', () => {
  const sameOrigin = [
    { id: 'a', originId: 'manufacturer_page' },
    { id: 'b', originId: 'manufacturer_page' }
  ];
  assert.equal(countIndependentOrigins(sameOrigin), 1);

  const identity = { brand: 'FixtureLab', model: 'SG-01', variant: '투명 45cm' };
  assert.equal(decideMatchState({ identity, sources: sameOrigin }).matchState, 'likely',
    'a complete identity from one origin is likely, not exact');

  const twoOrigins = [
    { id: 'a', originId: 'manufacturer_page' },
    { id: 'b', originId: 'marketplace_listing' }
  ];
  assert.equal(decideMatchState({ identity, sources: twoOrigins }).matchState, 'exact');
});

test('AT-04: a missing identity dimension cannot produce an exact match', () => {
  const sources = [{ id: 'a', originId: 'one' }, { id: 'b', originId: 'two' }];
  const result = decideMatchState({ identity: { brand: 'FixtureLab', model: '', variant: '45cm' }, sources });
  assert.equal(result.matchState, 'likely');
  assert.match(result.reasons.join(' '), /model/);
});

test('AT-04: conflicting evidence resolves to unresolved, never to a best guess', () => {
  const result = decideMatchState({
    identity: { brand: 'A', model: 'B', variant: 'C' },
    sources: [{ id: 'a', originId: 'one' }, { id: 'b', originId: 'two' }],
    conflicts: ['model']
  });
  assert.equal(result.matchState, 'unresolved');
});

test('all four match states exist and carry distinct wording rules', () => {
  assert.deepEqual([...MATCH_STATES], ['exact', 'likely', 'substitute', 'unresolved']);
  assert.equal(wordingRuleFor('exact').sameProductClaimAllowed, true);
  assert.equal(wordingRuleFor('likely').sameProductClaimAllowed, false);
  assert.equal(wordingRuleFor('substitute').mustLabelAlternative, true);
  assert.equal(wordingRuleFor('unresolved').affiliateMappingAllowed, false);
});

/* Verifier decision gates the Strategist ------------------------------------ */

test('AGENT_HANDOFFS H4: the verifier decision, not the score, gates downstream work', () => {
  const base = { mediaRightsResolved: true, conflicts: [], unresolvedQuestions: [] };
  assert.equal(decideVerifierDecision({ ...base, matchState: 'exact' }).verifierDecision, 'verified');
  assert.equal(decideVerifierDecision({ ...base, matchState: 'likely' }).verifierDecision, 'limited');
  assert.equal(decideVerifierDecision({ ...base, matchState: 'substitute' }).verifierDecision, 'limited');
  assert.equal(decideVerifierDecision({ ...base, matchState: 'unresolved' }).verifierDecision, 'hold');
  assert.equal(
    decideVerifierDecision({ ...base, matchState: 'exact', mediaRightsResolved: false }).verifierDecision,
    'hold',
    'unknown media rights hold the run even when identity is settled'
  );
  assert.equal(
    decideVerifierDecision({ ...base, matchState: 'exact', publicFigureBlocked: true }).verifierDecision,
    'reject'
  );
});

/* AT-17 / AT-25 — evidence and risk are independent of the score ------------- */

test('AT-25: readiness is derived from evidence, never from the opportunity score', () => {
  const weak = evaluateEvidenceReadiness({ verifierDecision: 'hold', matchState: 'unresolved', mediaRightsResolved: true });
  assert.equal(weak.state, 'weak');
  assert.ok(weak.reasons.length > 0, 'a non-ready state always says why');

  const blocked = evaluateEvidenceReadiness({ verifierDecision: 'verified', matchState: 'exact', mediaRightsResolved: false });
  assert.equal(blocked.state, 'blocked', 'unknown media rights fail closed');

  const ready = evaluateEvidenceReadiness({ verifierDecision: 'verified', matchState: 'exact', mediaRightsResolved: true });
  assert.equal(ready.state, 'ready');
});

test('risk stays low for an ordinary product and blocks on unknown media rights', () => {
  assert.equal(evaluateRisk({ matchState: 'exact', mediaRightsResolved: true }).level, 'low');
  assert.equal(evaluateRisk({ matchState: 'exact', mediaRightsResolved: false }).level, 'blocked');
  assert.equal(
    evaluateRisk({ matchState: 'exact', mediaRightsResolved: true, publicFigureRelation: { classification: 'blocked_rumor_private' } }).level,
    'blocked'
  );
});

test('freshness ages and expires against the listing identity TTL', () => {
  const observedAt = '2026-08-14T00:00:00.000Z';
  assert.equal(evaluateFreshness({ observedAt, now: '2026-08-14T01:00:00.000Z' }).state, 'fresh');
  assert.equal(evaluateFreshness({ observedAt, now: '2026-08-14T20:00:00.000Z' }).state, 'aging');
  assert.equal(evaluateFreshness({ observedAt, now: '2026-08-16T00:00:00.000Z' }).state, 'stale');
  assert.equal(evaluateFreshness({ observedAt: null, now: observedAt }).state, 'stale');
});

/* AT-08 / AT-17 — Guardian findings and their severity ---------------------- */

test('AT-08: the review report carries all eight named checks', () => {
  const review = runGuardianChecks({ drafts: [], mediaRightsResolved: true, matchState: 'exact' });
  assert.deepEqual(Object.keys(review.checks).sort(), [...GUARDIAN_CHECK_KEYS].sort());
});

test('AT-08: a fabricated first-hand claim blocks and cannot be downgraded', () => {
  const review = runGuardianChecks({
    drafts: [{ id: 'd1', text: '직접 써봤는데 정말 좋았습니다.' }],
    matchState: 'exact',
    mediaRightsResolved: true,
    personalUseConfirmed: false
  });
  assert.equal(review.decision, 'block');
  assert.equal(review.checks.firstHandCheck.status, 'block');
  assert.match(review.nonOverridableBlockers.join(' '), /FIRST_HAND_WITHOUT_USAGE_RECORD/);
});

test('a usage record makes the same wording acceptable', () => {
  const review = runGuardianChecks({
    drafts: [{ id: 'd1', text: '직접 써봤는데 물이 덜 튀었습니다.' }],
    matchState: 'exact',
    mediaRightsResolved: true,
    personalUseConfirmed: true
  });
  assert.equal(review.decision, 'pass');
});

test('a disclaimer about not having used the product is not a first-hand claim', () => {
  assert.equal(detectFirstHandLanguage('직접 써본 기록이 없다면 체험담처럼 쓰지 않습니다.'), false);
  assert.equal(detectFirstHandLanguage('직접 써봤는데 좋았습니다.'), true);
});

test('AT-10: a substitute must be labelled, and the label is not read as a same-product claim', () => {
  assert.equal(detectSameProductClaim('이 링크는 같은 제품이 아니라 비슷한 제품입니다.'), false,
    'the required disclaimer must not trip the assertion check');
  assert.equal(detectSameProductClaim('링크한 것이 바로 그 제품입니다.'), true);

  const unlabelled = runGuardianChecks({
    drafts: [{ id: 'd1', text: '이 제품을 추천합니다.' }],
    matchState: 'substitute',
    mediaRightsResolved: true
  });
  assert.equal(unlabelled.decision, 'block');
  assert.match(unlabelled.nonOverridableBlockers.join(' '), /SUBSTITUTE_NOT_LABELLED/);

  const labelled = runGuardianChecks({
    drafts: [{ id: 'd1', text: '이 링크는 같은 제품이 아니라 비슷한 제품입니다.' }],
    matchState: 'substitute',
    mediaRightsResolved: true
  });
  assert.equal(labelled.decision, 'pass');
});

test('AT-10: a same-product claim without an exact match blocks', () => {
  const review = runGuardianChecks({
    drafts: [{ id: 'd1', text: '링크한 상품이 같은 제품입니다.' }],
    matchState: 'likely',
    mediaRightsResolved: true
  });
  assert.equal(review.decision, 'block');
  assert.match(review.nonOverridableBlockers.join(' '), /EXACT_CLAIM_WITHOUT_EXACT_MATCH/);
});

test('an unsupported claim reference blocks, and a missing disclosure only asks for a revision', () => {
  const unsupported = runGuardianChecks({
    drafts: [{ id: 'd1', text: '정상 문구입니다.', claimIds: ['claim-ghost'] }],
    matchState: 'exact',
    mediaRightsResolved: true,
    verifiedClaimIds: ['claim-identity']
  });
  assert.equal(unsupported.decision, 'block');

  const disclosure = runGuardianChecks({
    drafts: [{ id: 'd1', text: '정상 문구입니다.' }],
    matchState: 'exact',
    mediaRightsResolved: true,
    affiliate: true,
    disclosure: ''
  });
  assert.equal(disclosure.decision, 'revise', 'a fixable omission is a revision, not a permanent block');
});

test('Guardian returns instructions, never replacement copy', () => {
  const review = runGuardianChecks({
    drafts: [{ id: 'd1', text: '직접 써봤습니다.' }],
    matchState: 'exact',
    mediaRightsResolved: true
  });
  for (const request of review.revisionRequests) {
    assert.ok(request.ruleId && request.problem && request.requiredChange);
    assert.equal('replacementText' in request, false, 'Guardian must not author the fix');
  }
});

/* AT-28 / AT-29 — first-screen selection ------------------------------------ */

test('AT-29: every inclusion and exclusion states a reason', () => {
  const candidates = [
    { id: 'a', opportunityScore: 90, lane: 'practical-novel', riskLevel: 'low', sourceMode: 'owner_supplied' },
    { id: 'b', opportunityScore: 88, lane: 'practical-novel', riskLevel: 'blocked', sourceMode: 'owner_supplied' },
    { id: 'c', opportunityScore: 20, lane: 'family', riskLevel: 'low', sourceMode: 'discovered' },
    { id: 'd', opportunityScore: 70, lane: 'family', riskLevel: 'low', workflowState: 'rejected', sourceMode: 'owner_supplied' }
  ];
  const { selected, excluded } = selectFirstScreen(candidates);

  assert.deepEqual(selected.map((item) => item.id), ['a']);
  const reasons = Object.fromEntries(excluded.map((item) => [item.candidateId, item.reason]));
  assert.equal(reasons.b, 'risk_blocked');
  assert.equal(reasons.c, 'below_review_floor');
  assert.equal(reasons.d, 'owner_decision');
  for (const item of excluded) assert.ok(item.detail, 'every exclusion needs owner-readable detail');
});

test('AT-28: no viable candidate is a valid outcome, not an error', () => {
  const { selected, emptyReason } = selectFirstScreen([
    { id: 'a', opportunityScore: 99, lane: 'practical-novel', riskLevel: 'blocked', sourceMode: 'owner_supplied' }
  ]);
  assert.equal(selected.length, 0);
  assert.equal(emptyReason, '오늘 추천 없음');
});

test('a product the owner typed in is never scored out of its own inbox', () => {
  const { selected } = selectFirstScreen([
    { id: 'owner', opportunityScore: 12, lane: 'practical-novel', riskLevel: 'low', sourceMode: 'owner_supplied' }
  ]);
  assert.deepEqual(selected.map((item) => item.id), ['owner']);
});

test('lane caps apply only when another lane is waiting to be promoted', () => {
  const sameLane = Array.from({ length: 5 }, (unused, index) => ({
    id: 'c' + index, opportunityScore: 90 - index, lane: 'practical-novel', riskLevel: 'low', sourceMode: 'owner_supplied'
  }));
  assert.equal(selectFirstScreen(sameLane).selected.length, 5, 'a single-lane day still fills the screen');

  const mixed = [...sameLane, { id: 'other', opportunityScore: 50, lane: 'family', riskLevel: 'low', sourceMode: 'owner_supplied' }];
  const result = selectFirstScreen(mixed);
  assert.equal(result.selected.filter((item) => item.lane === 'practical-novel').length, 3);
  assert.ok(result.excluded.some((item) => item.reason === 'lane_concentration'));
});

test('the opportunity score respects the specified bucket caps', () => {
  const maxed = scoreOpportunity({
    signals: {
      readerValue: 99, demonstrability: 99, purchaseIntent: 99, attentionAcceleration: 99,
      audienceFit: 99, novelty: 99, commercialPracticality: 99
    }
  });
  assert.equal(maxed.score, 100);
  assert.equal(maxed.breakdown.readerValue, 20);
  assert.equal(maxed.breakdown.purchaseIntent, 20);

  const penalised = scoreOpportunity({ signals: { readerValue: 20 }, deductions: { saturation: 999 } });
  assert.equal(penalised.score, 0, 'deductions are capped and the score floors at zero');
});
