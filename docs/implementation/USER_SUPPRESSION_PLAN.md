# AT-14 User Suppression — Implementation Slice Contract & Four Options

Status: **CONTRACT / DESIGN ONLY. NO RUNTIME CODE CHANGED BY THIS DOCUMENT.**

This document exists to satisfy the Implementation-resume gate in `docs/spec/DESIGN_FREEZE.md`.
Coding does not start until the owner selects a matching model in §6 and approves this contract.

## 1. Implementation-resume gate

| Gate item | This slice |
|---|---|
| exact current main baseline SHA | `badb5ac` (`feat: add candidate dedupe guardrails (#14)`) |
| **actual base of this branch** | **`1a104ee`, the head of open PR #16** — not `main`. See §1a; this is a hard dependency, not a convenience |
| design authority named | Master Design v1 (`docs/spec/MASTER_SPEC.md` + `docs/spec/`) and Harness Design v1 (`HARNESS_BLUEPRINT.md`, `HARNESS_ACCEPTANCE_MATRIX.md`) |
| bounded slice selected | AT-14 user/product/category/source suppression |
| not the default spike, and why | `CODING_SPIKE_ENTRY.md` (Spike 0) is already implemented and verified. `IMPLEMENTATION_STATUS.md` names AT-14 suppression as one of two strong next non-live gaps; the owner selected it over the real-device acceptance harness. Recorded per `CLAUDE.md` §20 |
| requirement / AT / fixture mapping | **PR-14** (`PRODUCT_REQUIREMENTS.md`), **AT-14** (`ACCEPTANCE_TESTS.md`), **F18** (`HARNESS_ACCEPTANCE_MATRIX.md`); boundary against **F23** duplicate/portfolio concentration |
| traps rechecked | `PRE_IMPLEMENTATION_TRAPS.md` "Suppression semantics" — the two unchecked boxes are this slice; see §7 |
| live capabilities | **all remain disabled.** No credential, provider, network, scheduler, publishing, or new dependency is introduced. Scout remains non-live; suppression is proven against owner-supplied/manual candidates and fixture input |
| prototype classification | see §8 |
| files allowed to change | see §9 |
| success / rollback / stop | see §4 and §10 |
| CLAUDE.md gates used | §15 interview (§3, §11), §4 four options (§6), §16 reference review (§12 — **incomplete, blocks coding**), §18 completion proof (§10) |
| real verification defined | see §10 |

## 1a. Dependency on open PR #16 — this slice cannot be built on `main`

Measured, not assumed:

- `git grep -n 'firstScreen|FIRST_SCREEN|selectFirst' origin/main` returns **nothing**. There is no
  first-screen selection code on `main` at all.
- `packages/core/src/candidate-ranking.mjs`, `guardian-checks.mjs`, and `product-matching.mjs` are **added by
  `1a104ee`**, the head of open PR #16 (`feat: deepen the manual slice to the approved product contracts`).

The approved pipeline in `DAILY_OPERATING_MODEL.md` puts suppression immediately before
`ranking + portfolio balancing`. That ranking stage exists only on PR #16's branch. Building AT-14 on `main`
would mean either implementing suppression somewhere the design does not put it, or re-creating the ranking
layer PR #16 already contains.

**Consequence — an owner decision is required before coding starts:**

1. **Merge PR #16 first**, then rebase this slice onto the new `main`. Cleanest history; AT-14 waits.
2. **Stack this slice on PR #16** (current state). Work proceeds now; this PR must merge after #16 and its
   diff will read against #16, not `main`.
3. Reduce AT-14 to a `main`-only subset. **Not recommended** — it would place suppression outside the
   position the approved design assigns it.

This branch is currently arranged for option 2, which is reversible: rebasing onto `main` after #16 merges is
a single command.

*Unrelated bookkeeping observed while checking:* the local commit `ed9716e`
(`docs: adopt Minimum Action Agent OS as working method only`) sits unpushed on top of `1a104ee` on the
`feat/slice1-contract-depth` branch. It is unrelated to PR #16's subject and will ride into that PR on merge
unless moved. Not addressed here.

## 2. Why this slice is not cosmetic

`packages/core/src/candidate-ranking.mjs:184-186` carries this comment inside `selectFirstScreen`:

> *"Owner-supplied candidates are always eligible; risk and suppression still apply to them."*

**There is no suppression check anywhere in that function.** The comment describes behavior the code does not
implement. AT-14 and F18 are the contract that comment is pointing at, and until this slice lands, the
comment is a false statement about the system. That is the concrete defect this slice closes.

## 3. Slice intent (`CLAUDE.md` §15)

- **User intent** — stop seeing candidates the owner has already judged unwanted, without deleting history and without hiding why.
- **Primary user** — the single owner-operator running the daily inbox.
- **Job to be done** — "I already said no to this kind of thing. Do not put it in front of me again, and let me undo that when I change my mind."
- **Success conditions** — §4.
- **Non-goals** — §5.
- **Stop conditions** — §10.

## 4. Success conditions

1. A suppression created by the owner is honored by future candidate selection until explicitly reversed (AT-14, F18).
2. Suppression records the **reason** (PR-14) and is inspectable.
3. A suppressed candidate reaches the `suppressed` UI state with `복원` as its primary action and `상세 보기` as secondary, per `UI_STATE_ACTION_MATRIX.md:17`.
4. Suppression is applied **before** ranking, per the `DAILY_OPERATING_MODEL.md` pipeline (`normalization / deduplication / suppression` then `ranking + portfolio balancing`).
5. `복원` returns the candidate to normal eligibility and the reversal is auditable.
6. User suppression is **never** conflated with `suppressed_duplicate`; the two states remain independently
   readable, independently reversible, and independently reason-coded.
7. Suppression survives reload and independent store instances, and stale suppression decisions fail through
   the existing HTTP 409 CAS boundary.
8. `오늘은 추천 없음` remains a valid outcome when suppression empties the inbox (`DAILY_OPERATING_MODEL.md:138-140`).

## 5. Non-goals

- No positive preference signal (`이런 제품 더 찾기`, `관심 없음`) — §9 of the operating model lists them; they are a separate slice.
- No timed topic mute (`일정 기간 토픽 뮤트`) unless the selected option gives it for free.
- No live Scout integration; suppression is proven against manual/owner-supplied and fixture candidates.
- No global catalog, embedding, or semantic category inference.
- No change to duplicate detection, Verifier authority, or the six-agent roster.
- No production datastore migration.

## 6. The open decision — how a suppression rule matches a future candidate

Everything else is already decided by approved design. This is not. Four materially different models:

### Option A — Exact identity key only

Reuse `exactIdentityKey()` from `apps/web/candidate-dedupe.mjs`. A suppression stores the normalized
`brand + model + variant` key; a future candidate is suppressed iff its key matches exactly.

- **For** — zero new matching logic, zero false positives, perfectly predictable, trivially auditable.
- **Against** — **cannot express category or source suppression at all**, so it does not satisfy PR-14 or the
  literal text of AT-14 ("product/**category**"). Suppressing a brand means suppressing every variant one at a time.
- **Conflation risk** — high. It reuses the dedupe key, which is exactly what the trap checklist warns against.

### Option B — Faceted rule records

A suppression is a record `{ axis: product|brand|category|source, value, reason, createdAt, expiresAt|null, createdRev }`.
Matching is normalized equality on the named axis only. Four axes exactly as `DAILY_OPERATING_MODEL.md:149` lists.

- **For** — satisfies PR-14 and AT-14 literally; deterministic and explainable ("suppressed because brand = X");
  each record is independently reversible, which makes `복원` well-defined; `expiresAt` gives timed mute for free.
- **Against** — needs a controlled vocabulary for `category`, otherwise category values drift and stop matching;
  new persisted state and its own CAS/idempotency surface.
- **Conflation risk** — low; separate store, separate state, separate reason codes.

### Option C — Composable predicate rule-set with precedence

Rules are predicates evaluated in precedence order with allow/deny semantics, so a later positive signal can
override a broad category suppression (firewall-ACL shaped).

- **For** — the only option that extends to `이런 제품 더 찾기` without a rewrite; expresses "suppress the
  category **except** this brand".
- **Against** — introduces a rule engine and ordering semantics; precedence bugs are hard to audit and hard to
  explain in one mobile line; drifts toward the "hidden autonomous profile change" that
  `DAILY_OPERATING_MODEL.md:154` explicitly forbids. Highest cost, and most of its power is a non-goal here.
- **Conflation risk** — low, but the audit burden is the highest of the four.

### Option D — Soft suppression by score deduction

No filter. Suppression applies a large negative deduction in `scoreOpportunity` so suppressed candidates fall
below `REVIEW_SCORE_FLOOR` naturally.

- **For** — smallest diff by far; reuses ranking; nothing new persisted beyond the deduction input.
- **Against** — **does not satisfy AT-14.** "Honor the suppression until the user reverses it" is a guarantee;
  a score deduction is a tendency, and a high enough opportunity score re-surfaces a suppressed item. It also
  cannot produce the distinct `suppressed` UI state the state matrix requires, so `복원` has nothing to act on.
- **Conflation risk** — n/a, but it fails the acceptance test, so it is included to make the cheap-option
  tradeoff explicit rather than as a live candidate.

### Comparison

| Criterion | A | B | C | D |
|---|---|---|---|---|
| Satisfies AT-14 literally | partial | **yes** | yes | **no** |
| Satisfies PR-14 (product/category/source + reason) | no | **yes** | yes | partial |
| Expresses all four §9 axes | no | **yes** | yes | no |
| Owner can predict what a rule suppresses | yes | **yes** | weak | weak |
| Timed mute available | no | **free** | yes | no |
| Extends to positive signals later | no | needs work | **yes** | no |
| Conflation risk with `suppressed_duplicate` | **high** | low | low | n/a |
| Implementation cost | lowest | medium | highest | lowest |

**Recommendation: Option B.** It is the only one that satisfies PR-14 and AT-14 as written while keeping each
rule individually explainable and individually reversible — which is what makes `복원` and the audit trail
tractable. C's extra power is aimed at a non-goal of this slice; B can be extended toward C later by adding
precedence, because faceted records are the data C would need anyway. A fails the requirement and reuses the
one key the trap checklist says must not be reused. D fails the acceptance test.

## 7. Trap and blind-spot recheck

From `PRE_IMPLEMENTATION_TRAPS.md`, "Suppression semantics":

- `[ ] Implement AT-14 user/category/content suppression separately. Candidate dedupe must not be presented as user preference/category suppression.`
  → success condition 6; Option A is rejected largely on this trap.
- `[ ] Define restore semantics and UI for AT-14 when that slice begins.`
  → **partially already answered by approved design**: `UI_STATE_ACTION_MATRIX.md:17` fixes `복원` as the
  primary action on the `suppressed` state. What remains undefined and must be settled in this slice: whether
  `복원` removes the rule or only exempts one candidate from it. **This is owner question Q2 in §11.**

New traps raised by this slice, not previously listed:

- **Spec/code string mismatch.** `DAILY_OPERATING_MODEL.md:140` writes the empty-day output as
  `오늘은 추천 없음`; `selectFirstScreen` returns `emptyReason: '오늘 추천 없음'`. Trivial today, but this
  slice adds a new path to that same outcome, so the mismatch should be resolved rather than duplicated. The
  spec is authority per §2 of `CLAUDE.md`.

- A suppression rule created against a candidate whose identity is later corrected by the Verifier may stop
  matching, silently un-suppressing it. The dedupe slice hit the mirror image of this and solved it by binding
  resolution to the candidate identity signature. The same binding question applies here and is **Q3 in §11**.

## 8. Prototype classification (`CLAUDE.md` §20)

| Module | Class | Note |
|---|---|---|
| `packages/core/src/candidate-ranking.mjs` | **MODIFY** | `selectFirstScreen` gains a suppression exclusion with its own reason code; the false comment at 184-186 is corrected |
| `apps/web/application-state.mjs` | **MODIFY** | suppression records join application state |
| `apps/web/locked-application-store.mjs` | **KEEP** | existing lock/CAS/idempotency critical section is reused unchanged |
| `apps/web/candidate-dedupe.mjs` | **KEEP** | must not be touched; conflation is the named trap |
| `apps/web/candidate-dedupe-store.mjs` | **KEEP** | same |
| `apps/web/server.mjs` | **MODIFY** | `suppress` / `restore` commands on the existing `POST /api/commands` boundary; `GET /api/today` exposes suppression state |
| `apps/web/app.js` | **MODIFY** | `suppressed` card state, `복원` / `상세 보기` controls |
| suppression rule store | **MISSING** | new, shape decided by the §6 selection |
| `tests/at14-suppression.test.mjs` | **MISSING** | new |

## 9. Files allowed to change

Exactly the MODIFY and MISSING rows in §8, plus `docs/implementation/USER_SUPPRESSION_*.md`,
`docs/PRE_IMPLEMENTATION_TRAPS.md` (checkbox state only), `docs/IMPLEMENTATION_STATUS.md`, and
`docs/spec/TRACEABILITY_MATRIX.md` (AT-14 row status only).

Anything else changing is scope creep and fails review. In particular: no `packages/orchestra/**` change, no
workflow file, no dependency, no `docs/spec/` behavioral edit.

## 10. Verification before completion (`CLAUDE.md` §18)

1. AT-14 / F18 mapping reviewed against observed behavior.
2. Automated tests pass, including the existing 102 as regression.
3. New tests must prove, at minimum: suppression honored on next selection; reason persisted; `복원` restores
   eligibility; suppression survives reload and independent store instances; stale suppression revision fails
   with 409; user suppression and `suppressed_duplicate` remain distinguishable on the same candidate;
   the empty-day outcome when suppression empties the inbox.
4. Real flow exercised end-to-end in the browser, not only via harness.
5. Mobile narrow width checked; `복원` and `상세 보기` actually operable, per NFR-01 and AT-15.
6. Diff reviewed for unintended scope against §9.
7. Traps in §7 rechecked against finished behavior.
8. Deviations recorded per `CLAUDE.md` §14 in `USER_SUPPRESSION_ACCEPTANCE.md`.
9. GitHub Actions green on PR head **and** post-merge main.

**Stop conditions.** Stop and return to the owner if: the selected model requires touching
`candidate-dedupe*.mjs`; suppression cannot be made distinguishable from duplicate suppression in the UI;
category matching requires a vocabulary the spec has not approved; or the slice starts needing live Scout.

**Rollback.** The slice is additive behind a new store and new reason code. Rollback is reverting the branch;
no data migration is introduced, and no existing persisted shape changes meaning.

## 11. Owner questions (`CLAUDE.md` §15 — at most 3-5, asked only because they change the result)

- **Q1 — matching model.** Which of A/B/C/D in §6? (Recommendation: B.)
- **Q2 — `복원` semantics.** Does `복원` on a suppressed candidate **delete the rule** (un-suppressing every
  candidate that rule matched) or **exempt only that candidate** (rule stays for others)? Both are defensible;
  the state matrix does not say. Reversible default if unanswered: **exempt only that candidate**, with rule
  deletion available from the rule's own detail view.
- **Q3 — identity drift.** If the Verifier later corrects a candidate's brand/model so a suppression rule no
  longer matches, should the candidate silently return to the inbox, or stay suppressed until the owner
  re-decides? Reversible default if unanswered: **stay suppressed and flag it for re-decision**, matching how
  the dedupe slice binds resolution to the identity signature.
- **Q4 — category vocabulary.** Is `category` a free-text owner label, or must it come from an approved list?
  Free text is simpler and matches "record the reason"; a list makes matching reliable. Reversible default if
  unanswered: **free text, normalized**, with exact-normalized matching only and no inference.

## 12. Reference review status (`CLAUDE.md` §16) — INCOMPLETE, BLOCKS CODING

§16 requires 3-5 relevant examples recorded with adoption/non-adoption/licence notes before a substantial
slice. That review has **not** been performed and is not satisfied by this document.

Pattern-level analysis used while drafting §6 — declarative filter rules with an explicit axis, ACL precedence
ordering, and feed-level "not interested" controls — is **general design knowledge, not a sourced reference
review**, and is recorded here as such rather than dressed up as citations. `USER_SUPPRESSION_REFERENCE_REVIEW.md`
must be written and must satisfy §16 before the first line of runtime code.

## 13. What this document does not claim

It does not claim any code exists, any test passes, or that AT-14 is implemented. It claims only that the
Implementation-resume gate is satisfiable for this slice once §11 is answered and §12 is completed.
