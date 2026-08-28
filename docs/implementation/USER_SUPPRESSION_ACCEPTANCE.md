# AT-14 User Suppression — Acceptance, Deviations and Limitations

Contract: `USER_SUPPRESSION_PLAN.md`. Reference gate: `USER_SUPPRESSION_REFERENCE_REVIEW.md`.
Branch base: `1a104ee` (head of open PR #16 — see plan §1a).

**This document does not claim the slice is complete.** Three items in §5 are outstanding, one of
which (`CLAUDE.md` §18 browser verification) is required before completion can be claimed at all.

## 1. Automated proof

| | |
|---|---|
| Full suite | **145 tests / 145 pass / 0 fail** (`npm test`) |
| Of those, new | 22 in `tests/at14-suppression.test.mjs` |
| Regression baseline | 123 pre-existing tests on this branch, all still passing |
| `npm run orchestra:demo` | success |
| Live HTTP flow | server started on a temp data dir; `suppress_candidate` returned `candidate_suppressed`, receipt route `orchestrator → human_approval → orchestrator`, one rule persisted, `counters.ownerSuppressed = 1`; `/api/health` reports `ownerSuppression: deterministic_faceted_rules_unordered_any_match` and `externalPublishingEnabled: false` |

Covered by the new tests: suppression honored by future selection (AT-14/F18); reason required and
recorded (PR-14); `복원` exempts only that candidate and leaves the rule standing (Q2); rule removal
releases every candidate; survival across reload and an independent store instance; stale revisions
failing 409 through the existing CAS boundary; request-id idempotency; owner suppression staying
distinguishable from `suppressed_duplicate`; expiry taking effect with no intervening write; invalid
axis, empty axis and not-suppressed rejections; the Orchestrator receipt on the human route; no live
capability enabled; a pending duplicate review surviving suppression unresolved; identity drift (Q3,
unit level — see §4.2); rule-set order independence; and five UI-source assertions.

## 2. Defect this slice closes

`packages/core/src/candidate-ranking.mjs` commented inside `selectFirstScreen` that *"risk and
suppression still apply to them"* while the function contained **no suppression check at all**. The
comment was false. The suppression exclusion is deliberately placed **above** the review floor so it
applies to owner-supplied candidates too, which is what the comment promises.

## 3. Deviations (`CLAUDE.md` §14)

### 3.1 Files changed outside the declared allowed set

- **Original plan:** plan §9 permitted only the MODIFY/MISSING rows of §8.
- **Where it stopped matching:** two files outside that set had to change.
- **What changed:** `apps/web/manual-orchestrator.mjs` (the three suppression commands registered in
  `HUMAN_COMMANDS`) and `apps/web/index.html` (the suppression dialog).
- **Why:** an unregistered command is rejected with `orchestrator_command_unknown` — the "only
  Orchestrator delegates" rule (§7) doing its job. There is no way to add an owner command without
  registering it. The dialog is the only surface that can collect the reason PR-14 requires.
- **Affected:** plan §8/§9 updated to match. No behavioral spec changed.
- **Remaining risk:** none identified. Suppression routes as a human decision exactly like
  `review_decision` and `resolve_duplicate`; no specialist, no new agent, roster untouched at six.

### 3.2 `category` has no field in the data model

- **Original plan:** four axes — product, brand, category, source — per `DAILY_OPERATING_MODEL.md:149`.
- **Where it stopped matching:** candidates carry no `category` field. `lane` is the only
  category-shaped dimension, and it is already what portfolio balancing uses.
- **What changed:** the `category` axis matches against `lane`.
- **Why:** inventing a `category` field would be a data-model change beyond this slice, and
  overloading `name` would collapse two axes into one.
- **Remaining risk:** `lane` currently takes few values (`practical-novel`, `curiosity-only`), so
  category suppression is coarser than PR-14 probably intends. **If a real category field is added
  later, `AXIS_FIELD` in `candidate-suppression.mjs` is the single line to change.** Q4's free-text
  answer stands, but is worth revisiting once the axis has a richer field behind it.

## 4. Findings recorded rather than silently handled

### 4.1 A bug the tests caught before commit

The first implementation collapsed two different causes of "no rule matches any more": the candidate
drifting out from under a live rule (Q3 — stay suppressed, ask for a re-decision) and the rule being
removed or expired (AT-14 — release). Collapsing them made every removal and expiry look like drift,
so a suppressed candidate could never come back. Two tests failed on the first run and the two causes
are now discriminated by whether the previously-matched rules are still standing.

### 4.2 Q3 identity drift is unreachable through the HTTP API today

A suppressed candidate leaves `today.candidates`, and the Orchestrator resolves a dispatch target
only from that five-card list, so `request_verification` against a suppressed candidate is rejected
**404** before it reaches the store. Identity therefore cannot drift under a live rule through the
API as the manual slice stands.

This is pre-existing (any candidate outside the top five is equally unreachable), not introduced
here, but suppression makes it reachable far more often. The Q3 branch is kept because the guarantee
— an identity edit must never silently un-suppress — should hold if a later slice widens the dispatch
view. It is **proven at unit level and explicitly not claimed at HTTP level**.

### 4.3 Excluded candidates lose `duplicateAssessment` in the read model

The dedupe layer decorates only the selected five with `duplicateAssessment`. Before this slice a
pending duplicate review was always priority-included in the inbox and so never appeared under
`excluded`; suppressing such a candidate is what first produces that combination. The duplicate
review itself is untouched and returns intact on `복원` — a test asserts exactly that. The read-model
gap is documented by an assertion rather than fixed, because fixing it means changing the dedupe
layer, which this slice's contract classifies **KEEP**.

### 4.4 `#excluded-block` was dead UI

The element existed in `index.html` and in the `els` map in `app.js`, but nothing ever rendered into
it. AT-14 is what gives it a job; it now holds the suppressed candidates and their `복원` /
`상세 보기` controls.

`candidateById` searched only `today.candidates`, so a lookup for a suppressed candidate returned
`null` and both new buttons would have silently done nothing. It now falls back to `today.excluded`.

### 4.5 Spec/code string mismatch, observed and not fixed

`DAILY_OPERATING_MODEL.md:140` writes the empty-day output as `오늘은 추천 없음`; `selectFirstScreen`
returns `emptyReason: '오늘 추천 없음'`. The spec is authority per `CLAUDE.md` §2. Not changed here
because it is unrelated to AT-14 and existing tests assert the current string; it belongs in a
separate one-line fix with its test updated.

### 4.6 A test-suite flake seen once

`tests/persistence-lock.test.mjs` failed once with `EPERM` opening its temp `.lock` file, during
back-to-back full-suite runs on Windows. It passed on three consecutive isolated runs and on every
subsequent full run. Recorded because it may surface in CI; not introduced by this slice, which does
not touch the locking layer.

## 5. Outstanding — completion cannot be claimed until these are done

1. **Browser verification (`CLAUDE.md` §18) — NOT PERFORMED.** The UI is asserted against its source,
   which the repository's own convention accepts for smoke coverage, and the command path is proven
   end-to-end over HTTP against a live server. Neither is a substitute for §18's requirement that
   "every visible button, form, and primary CTA actually works" and that the first mobile screen is
   understandable. **The suppress dialog, the `복원` button and the `상세 보기` button have not been
   clicked in a real browser, and no mobile-width check has been made.**
2. **GitHub Actions on the PR head** — not yet observed at the time of writing.
3. **Post-merge `main` CI** — required before this slice is reported merged, and blocked behind PR #16
   either merging first or this branch rebasing onto it (plan §1a).

## 6. Live capability state

Unchanged and still disabled. No credential, dependency, workflow file, model provider, network
enablement, new agent, publication path, or scheduler is introduced. The fixed six-agent roster is
untouched; suppression routes as a human decision, not as specialist work.
