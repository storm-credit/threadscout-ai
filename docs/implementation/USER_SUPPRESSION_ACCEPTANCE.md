# AT-14 User Suppression — Acceptance, Deviations and Limitations

Contract: `USER_SUPPRESSION_PLAN.md`. Reference gate: `USER_SUPPRESSION_REFERENCE_REVIEW.md`.
Branch base: originally `1a104ee` (head of then-open PR #16 — see plan §1a). Since 2026-08-29 that PR
is squash-merged as `4e029f2` and this branch is rebased onto `main`; PR #17 is **ready for review**,
targets `main`, and is no longer stacked.

**All of §5 is discharged as of 2026-08-29; this slice is complete.** The `CLAUDE.md` §18 browser
verification passed 15/15 (§5 item 1), PR-head CI passed (item 2), and post-merge `main` CI passed
after the merge (item 3). PR #17 was squash-merged to `main` as `484956e`.

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

### 4.5 Spec/code string mismatch — and this entry diagnosed it backwards

As originally written, this entry said: `DAILY_OPERATING_MODEL.md:140` writes the empty-day output as
`오늘은 추천 없음` while `selectFirstScreen` returns `emptyReason: '오늘 추천 없음'`, the spec is
authority per `CLAUDE.md` §2, so the code should move to the spec.

**That conclusion was wrong, and it was wrong because it compared against one file.** Sweeping the
whole set on 2026-08-29:

| String | Documents |
|---|---|
| `오늘 추천 없음` | **6** — `MASTER_SPEC.md`, `ACCEPTANCE_TESTS.md`, `EDGE_CASES.md`, `HARNESS_ACCEPTANCE_MATRIX.md`, `DESIGN_BASELINE_MANIFEST.md`, `FINAL_BLIND_SPOT_SWEEP.md` |
| `오늘은 추천 없음` | **1** — `DAILY_OPERATING_MODEL.md` |

`CLAUDE.md` §2 names `MASTER_SPEC.md` *first* among the authorities, and it is in the majority along
with the acceptance-test document that §13 traceability runs through. **The code was already correct;
the outlier is `DAILY_OPERATING_MODEL.md`.** Following the original recommendation would have changed
six documents' worth of agreed behaviour to match a single divergent line.

**Closed 2026-08-29** in its own PR by fixing the one outlier document and leaving the code alone. A
guard was added, since nothing tied the strings together: it collects every `` `…추천 없음` `` phrase
across `docs/spec/`, fails if the set disagrees with itself — naming which files take which side — and
then fails if `selectFirstScreen` disagrees with the agreed value. It was checked in both failing
directions before being trusted. The original single-file comparison is exactly what that guard now
prevents.

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
`CLAUDE.md` §20 forbids widening. Recorded for a separate task — it costs the owner a reliable local
`npm test` today.

**Fixed 2026-09-12 in its own task, and not by the remedy proposed above.** Two things in this entry
did not survive re-measurement:

- *"this test alone passes `lockTimeoutMs: 25`"* — **false.** Two tests pass 25 (`:102` and `:141`).
  The second builds its store directly instead of going through the shared `withStores` helper, which
  is why only the first ever failed. The true statement is narrower: it is the only test that passes
  25 *through the shared setup*.
- The proposed fix — raise the timeout — treats the symptom. The cause is that `withStores`
  initialised both stores with `Promise.all`, so they contended for the same lock file and that
  contention was charged against the **test's** 25ms budget. The setup lost the budget before the
  test reached its own assertions.

**What was done instead:** the two `initialize()` calls run sequentially. No timeout value changed,
so the test still asserts a *bounded* wait, and no test's meaning moved — concurrent initialisation
is not exercised anywhere; the two tests that test concurrency do it on `execute()`.

**Measured, because the original counts no longer reproduced:** 8 consecutive unloaded runs passed
before any change, against the 2 of 3 failures recorded on 2026-08-29, with the lock layer and the
test file both unchanged since. So the defect is load-dependent, not always-on, and the original
figures describe that machine on that day. Under deliberate load — two full suites concurrently —
it reproduced at **5 failures in 6 runs**, always at `persistence-lock.test.mjs:84`. After the fix,
the same load gave **10 passes in 10**. The guard was then checked in the failing direction:
disabling the lock-timeout branch in `locked-application-store.mjs` makes the test fail, so the fix
removed the setup contention rather than the test's teeth.

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

**Fixed 2026-09-15, and the shape of the fix was not obvious from this entry.** Mapping `code` to Korean
at `app.js:307` — the remedy implied above — would have *lost* information. There are 25 distinct codes but
`invalid_input` alone covers nine different messages, and the word that says *which* field is wrong
(`reason`, `axis`, `name`…) lived only inside the English sentence. Mapping by code alone turns
`reason is required.` into `입력한 내용을 다시 확인해 주세요.`, which is less actionable than the English
it replaces.

So the server now puts that word in `details` (`{ field, rule }`), and the client builds the Korean from
`code` + `details`. Eight `invalid_input` sites gained the detail; the ninth already carried
`{ axis, allowed }`. **Server messages stay English** — they are what logs and API consumers read, and the
wire was verified unchanged.

Verified in a real browser rather than against the source, per §18: a required-field error through the
add-candidate form gives `제품 이름을 입력해 주세요.`, an empty-axis suppression gives
`이 후보에는 이 브랜드에 해당하는 값이 없어…` using the select's own wording, and an unknown command still
returns `Command is not registered with Orchestrator: …` on the wire. 4 of 4.

One thing the browser pass caught that source review had not: the first draft printed `이름을(를)`, writing
both particle forms because it could not choose. Korean particle selection depends on whether the preceding
syllable has a final consonant, so the client now computes it. That is invisible in a unit test and obvious
on screen.

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

## 5. Completion gates — all discharged 2026-08-29

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

2. **GitHub Actions on the PR head — PASSED.** Green on every head this branch had, including both
   post-rebase heads: run `33240808782` on `312218e` and run `33240949818` on `fd4d34c`, the head
   that was merged.
3. **Post-merge `main` CI — PASSED 2026-08-29.** The dependency this item originally recorded is
   discharged: PR #16 was squash-merged to `main` as `4e029f2`, this branch was rebased off the
   now-merged `1a104ee` onto `main` with `git rebase --onto origin/main 1a104ee` (four commits
   replayed, **no content change** — the diff against the pre-rebase ref was empty), and PR #17 was
   retargeted to `main`.

   PR #17 then squash-merged as `484956e`, and the `push`-triggered `main` run **`33240991809`
   (`verify`) succeeded**. That was the one check that could not be made from inside the branch, and
   it is now made.

   Also landed alongside it, as separate PRs rather than folded in here: PR #16 (`4e029f2`) and
   PR #18 (`9253885`), the latter rescuing the OS adoption record — `CLAUDE.md` §21,
   `docs/AGENT_OS_ADOPTION.md` and its decision entry — which until then existed only in a single
   unpushed local commit and was on no remote.

**Completion.** Every item in this section is closed. Per `CLAUDE.md` §18 the slice is complete:
requirements and acceptance tests mapped, automated tests passed, the real user flow exercised
end-to-end in a browser at mobile width with every visible control clicked, reload behaviour checked,
blocked states shown to fail closed, the diff reviewed for scope, deviations recorded (§3), findings
recorded rather than silently handled (§4), GitHub Actions checked on both the PR head and `main`,
and no live capability enabled (§6). The findings in §4.6, §4.7 and §4.8 are open follow-ups against
the *project*, not unmet criteria of this slice.

## 6. Live capability state

Unchanged and still disabled. No credential, dependency, workflow file, model provider, network
enablement, new agent, publication path, or scheduler is introduced. The fixed six-agent roster is
untouched; suppression routes as a human decision, not as specialist work.
