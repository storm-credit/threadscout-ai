# AT-14 User Suppression — Acceptance, Deviations and Limitations

Contract: `USER_SUPPRESSION_PLAN.md`. Reference gate: `USER_SUPPRESSION_REFERENCE_REVIEW.md`.
Branch base: originally `1a104ee` (head of then-open PR #16 — see plan §1a). Since 2026-08-29 that PR
is squash-merged as `4e029f2` and this branch is rebased onto `main`; PR #17 is **ready for review**,
targets `main`, and is no longer stacked.

**One item in §5 remains outstanding.** The `CLAUDE.md` §18 browser verification is **done and
passing** as of 2026-08-29 (§5 item 1); what is left is post-merge `main` CI, which is blocked behind
PR #16 rather than behind this branch.

## 1. Automated proof

| | |
|---|---|
| Full suite | **145 tests / 145 pass / 0 fail** (`npm test`) — and green on CI every push. Locally on Windows one *pre-existing, unrelated* test is load-flaky; see §4.6 for the measured rate and why CI does not see it |
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

**Measured properly on 2026-08-29, and this entry understated it.** The failure above is not a
once-seen flake and the mechanism is not `EPERM`. On this Windows machine the same test —
`fresh competing lock fails closed with a bounded storage_lock_timeout` — fails **intermittently and
often**, with `code: storage_lock_timeout` thrown from `withStores` setup
(`tests/persistence-lock.test.mjs:19`, the `Promise.all([storeA.initialize(), storeB.initialize()])`),
so the test never reaches its own assertions.

Counts, all on the rebased branch with **no dev server running**:

| Condition | Result |
|---|---|
| Full `npm test`, three consecutive runs | 144/145, 145/145, 144/145 — **fails 2 of 3** |
| `node --test tests/persistence-lock.test.mjs` alone, five runs | **fails 1 of 5** |
| That setup line alone, 12 trials at `lockTimeoutMs: 25` | 12/12 succeeded |

So it is **load-sensitive, not a deterministic race**: the setup is fine in isolation and loses under
the filesystem contention of a parallel suite. The proximate cause is that this test alone passes
`lockTimeoutMs: 25`, and a 25ms budget is too tight for Windows filesystem timing once anything else
is running.

Two consequences worth stating plainly. **A dev server makes it worse but is not the cause** — the
server does hold the write lock, so `npm test` should not be run against a live server, but stopping
the server does *not* make the suite reliably green. And **CI does not see this**: the workflow is
`ubuntu-latest` / Node 20, where it has passed on every push including this branch's head.

**Not fixed here.** `tests/persistence-lock.test.mjs` is outside this slice's allowed file set and
`CLAUDE.md` §20 forbids widening. The likely one-line fix is to raise that test's `lockTimeoutMs`
from `25` to a value that still bounds the wait but survives setup jitter; the assertion itself stays
valid, because the competing lock is a fake writer that never releases and will time out at any
budget. Recorded for a separate task — it costs the owner a reliable local `npm test` today.

### 4.7 Server error strings reach the owner in English

Surfaced by the §5 browser run: choosing an axis the candidate has no value for shows the toast
`This candidate has no brand value to suppress on.` in an otherwise entirely Korean UI. The behaviour
is right — it fails closed — but the wording is not owner-facing Korean.

**Not introduced by this slice, and not fixed here.** Every `ApplicationCommandError` message in the
codebase is English — 43 of them across `apps/web/*.mjs`, including 16 in `application-state.mjs`,
8 in `candidate-suppression-store.mjs` and 7 in `candidate-dedupe-store.mjs`. AT-14 follows the
existing convention rather than departing from it.

The surfacing point is one line: `app.js:307` does `showToast(result.message || '요청을 처리하지
못했습니다.')`. So the client already has a Korean fallback, and already special-cases one code into
Korean (`version_conflict`, `app.js:303`) — every other server message passes through in English.
This is therefore a single presentation decision affecting all 43 commands, not a suppression string.
Fixing it properly means mapping `error.code` to Korean copy at that one call site — a cross-cutting
change `CLAUDE.md` §20 forbids folding into this slice. Recorded for a separate task; the key it
needs already exists, since every one of these errors carries a stable `code` (this one is
`suppression_axis_empty`).

### 4.8 With every candidate suppressed, the empty-state line sits just below the fold

Measured during the §5 run at 360x740: when a rule matches all candidates, `#candidate-list` renders
its empty state `이 화면에서 지금 처리할 후보가 없습니다.` at `y=779` — **39px below** the 740px fold.
DOM order is correct (`#excluded-block` follows `#candidate-list`), and the first screen is still
understandable in §18's terms: it shows the value proposition, the working `제품 직접 추가` CTA, the
capability banner and the counters. So this is not a §18 failure, and it is pre-existing hero-height
layout rather than anything AT-14 changed — but suppression is the feature that makes an all-empty
first screen easy to reach, so it is worth recording where it was found.

Noted alongside it, not investigated: with both candidates suppressed the counter tile still reads
`관찰 후보 2`. Whether the counters are meant to count suppressed candidates is a counter-semantics
question outside this slice.

## 5. Outstanding — completion cannot be claimed until these are done

1. **Browser verification (`CLAUDE.md` §18) — PERFORMED 2026-08-29, 15/15 checks pass.**

   **How, without adding a dependency.** `CLAUDE.md` §20 forbids widening the slice, and this
   repository has **zero** npm dependencies — no Playwright, no Puppeteer. None was added. The run
   drove the Chrome already installed on the machine over the **Chrome DevTools Protocol**, spoken
   from a throwaway script using only Node built-ins (`WebSocket` and `fetch`, both global in the
   Node 24 runtime this repo already requires). `package.json`, `package-lock.json` and the repo tree
   are unchanged by the verification; the harness lives outside the repository and is not committed.

   **Conditions.** Chrome 360x740 CSS px, `deviceScaleFactor: 3`, `mobile: true`, touch emulation on —
   a phone viewport, not a narrowed desktop window. Server `npm start` on `127.0.0.1:4173` against a
   copy of the local dev state (2 candidates, 0 rules) restored to its starting values afterwards.

   **Every interaction below was a real `Input.dispatchMouseEvent` press/release at the control's
   on-screen centre**, issued only after `elementFromPoint` confirmed that point actually hit-tests to
   the control. A button that was clipped, zero-size, off-screen or covered by another element would
   fail at that gate rather than pass silently, which is what `el.click()` in a source-level assertion
   would have done.

   | # | Check | Result |
   |---|---|---|
   | 1 | `그만 보기` on a candidate card opens the dialog | **PASS** — 314x46px button, dialog `open=true`, target line names the candidate |
   | 2a | Reason left genuinely empty | **PASS** — native `required` blocks submit (`validity.valueMissing=true`), dialog stays open, nothing suppressed |
   | 2b | Reason of whitespace only | **PASS** — passes `required`, then the JS `trim()` guard rejects it and the toast `억제 이유는 반드시 입력해야 합니다.` appears |
   | 2c | Axis the candidate has no value for (`brand`, which is `""`) | **PASS** — fails closed: dialog stays open, candidate not suppressed |
   | 3 | Axis chosen + reason entered + submitted | **PASS** — `category` (non-default, so the select genuinely drove the outcome); dialog closes, toast `이런 후보는 앞으로 첫 화면에 올리지 않습니다.`, card leaves the first screen |
   | 4 | Suppressed card appears under `첫 화면에 올리지 않은 후보` | **PASS** — block unhides, card carries its reason, `기준: category = practical-novel`, and both buttons |
   | 5 | `복원` on that card | **PASS** — candidate returns to the first screen and leaves the suppressed list, while the standing rule keeps the *other* matched candidate suppressed (Q2 exemption semantics, confirmed in the browser and not only in unit tests) |
   | 6 | `상세 보기` on that card | **PASS** — opens the decision workspace **for that candidate** (title matched the target, 4 status tiles) |
   | 7 | 360px width, measured at four points: first screen, dialog open, suppressed block present, and after reload | **PASS** — `scrollWidth == clientWidth == 360` at all four; zero elements overflowing the viewport or with clipped button text |
   | 8 | Full page reload | **PASS** — suppression holds; also confirmed **server-side on disk**: both rules with their reasons are present in `application-state.json`, so this is persistence, not a client-side artifact |
   | 9 | `취소` and `×` in the dialog | **PASS** — both close the dialog and create no rule; touch targets 55.5x46 and 42x42, above the 42px minimum |

   Screenshots for each step were captured at 360px and inspected, not merely rendered: the dialog,
   the suppressed block, the restored state, and the all-suppressed first screen were read for
   legibility and correct copy. Two findings that came out of this run are recorded in §4.7 and §4.8;
   neither blocks the slice.

   **What this does not cover.** Only the controls this slice introduces, plus the first-screen
   layout they affect. It is not a sweep of every button in the application, and it is one browser
   (Chromium) at one width. Real-device and cross-engine checks are not claimed.

2. **GitHub Actions on the PR head — PASSED.** Green on every head this branch has had; most recently
   CI run `33240808782`, job `verify`, success on `312218e` — the rebased head described below.
3. **Post-merge `main` CI — no longer blocked, not yet observed.** The dependency this item recorded
   is discharged: **PR #16 was squash-merged to `main` on 2026-08-29 as `4e029f2`.** This branch was
   then rebased off the now-merged `1a104ee` and onto `main` with
   `git rebase --onto origin/main 1a104ee`, which replayed its four commits with **no content change**
   (verified: `git diff` against the pre-rebase ref is empty). PR #17 now targets `main` directly and
   reports `MERGEABLE`.

   What remains is only the observation itself: `main` CI after this PR merges. That cannot be run
   from inside the branch, so it is the single item still open, and it now depends on the merge
   decision rather than on another PR.

## 6. Live capability state

Unchanged and still disabled. No credential, dependency, workflow file, model provider, network
enablement, new agent, publication path, or scheduler is introduced. The fixed six-agent roster is
untouched; suppression routes as a human decision, not as specialist work.
