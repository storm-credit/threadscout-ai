import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_STATES,
  DEFAULT_DISCLOSURE,
  canApprove,
  createQueueItem,
  generateDrafts,
  scoreCandidate,
  transitionCandidate
} from '../packages/core/src/index.mjs';
import { fixtureCandidates } from '../packages/core/src/fixtures.mjs';

test('candidate score applies weighted signals and risk deduction', () => {
  assert.equal(scoreCandidate({ attention: 20, purchaseIntent: 25, visualPotential: 15, audienceFit: 15, availability: 10, commercialValue: 10, creatorReadiness: 5, riskPenalty: 7 }), 93);
});

test('four drafts have distinct angles', () => {
  const drafts = generateDrafts(fixtureCandidates[0]);
  assert.equal(drafts.length, 4);
  assert.equal(new Set(drafts.map((draft) => draft.angle)).size, 4);
});

test('unconfirmed personal use blocks first-hand copy', () => {
  const candidate = {
    ...fixtureCandidates[0],
    exactMatchStatus: 'exact',
    mediaRights: 'not_required',
    riskLevel: 'low',
    disclosure: DEFAULT_DISCLOSURE,
    personalUse: 'not_confirmed'
  };
  const result = canApprove(candidate, '직접 먹어봤는데 재구매할 것 같다.');
  assert.equal(result.ok, false);
  assert.match(result.blockers.join(' '), /직접 사용/);
});

test('unresolved exact product identity blocks approval', () => {
  const candidate = { ...fixtureCandidates[0], exactMatchStatus: 'likely' };
  assert.equal(canApprove(candidate, '발견형 제품 소개').ok, false);
});

test('only valid state transitions are allowed', () => {
  const discovered = { ...fixtureCandidates[1], state: CANDIDATE_STATES.DISCOVERED };
  const drafted = transitionCandidate(discovered, CANDIDATE_STATES.DRAFTED);
  const approved = transitionCandidate(drafted, CANDIDATE_STATES.APPROVED);
  assert.equal(approved.state, CANDIDATE_STATES.APPROVED);
  assert.throws(() => transitionCandidate(discovered, CANDIDATE_STATES.QUEUED), /Invalid candidate transition/);
});

test('queue rejects unapproved candidates and disables external publishing', () => {
  const candidate = { ...fixtureCandidates[1], state: CANDIDATE_STATES.DRAFTED };
  assert.throws(() => createQueueItem(candidate, 'draft', '2026-08-09T08:10'), /Only approved/);
  const approved = { ...candidate, state: CANDIDATE_STATES.APPROVED };
  const item = createQueueItem(approved, 'draft', '2026-08-09T08:10');
  assert.equal(item.publishingEnabled, false);
  assert.equal(item.status, 'queued_locally');
});

test('approved and queued candidates can be withdrawn safely', () => {
  const approved = { ...fixtureCandidates[1], state: CANDIDATE_STATES.APPROVED };
  const queued = transitionCandidate(approved, CANDIDATE_STATES.QUEUED);
  assert.equal(transitionCandidate(approved, CANDIDATE_STATES.REJECTED).state, CANDIDATE_STATES.REJECTED);
  assert.equal(transitionCandidate(queued, CANDIDATE_STATES.HELD).state, CANDIDATE_STATES.HELD);
});
