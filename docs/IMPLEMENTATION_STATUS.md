# Implementation Status

## Canonical design status

- **Master Design v1: COMPLETE** — product/platform/six-agent/evidence/media/matching/content/approval/publishing/analytics/security design and AT-01~44 are canonical in `docs/spec/`.
- **Harness Design v1: COMPLETE** — `HARNESS_BLUEPRINT`, `HARNESS_ACCEPTANCE_MATRIX`, gap analysis, and coding entry rules define the executable-specification approach.
- Live-account/policy/deployment items remain capability-gated; design completion does not mean production activation.

## Existing prototype / regression assets

Before Master Design v1, the repository implemented Phase 1 through Phase 2F: mobile prototype, fixed six-agent orchestra, practical-novel niche simulation, replay runtime/budgets/receipts/tool broker, versioned evidence store, fixture research, and disabled live-source readiness contracts.

Those assets remain regression evidence unless a later Master-Design slice explicitly promotes/adapts them.

## Coding Spike 0 — IMPLEMENTED AND VERIFIED

Spike 0 proved the no-network Master Harness Contract Spine:

`owner-supplied fixture → Orchestrator → Scout skipped by approved exception → Verifier → Strategist(4) → Writer(4) → Guardian → bound human decision → material mutation → stale/CAS rejection`

It implements F01/F02/F04/F11/F12/F13/F15/F20/F21 and the required Spike 0 acceptance set. It also corrected replay-runtime preflight rejection receipts so budget/attempt failures are auditable. This answered the migration question: the existing runtime can be adapted to Master Design authority/revision semantics without a rewrite.

## Manual-product C vertical slice — MERGED AND VERIFIED

PR #12 merged the first user-facing application slice to `main`:

`manual product input → Opportunity Inbox → owner-supplied evidence verification → four strategies → four drafts → Guardian → owner approve/hold/reject`

Implemented boundaries:

- `GET /api/today` exposes a bounded server read model.
- `POST /api/commands` accepts explicit commands with request IDs and expected revisions.
- browser `localStorage`/`sessionStorage` is not application authority.
- duplicate request IDs are idempotent; stale revisions return HTTP 409 with the current server state.
- material evidence/draft changes invalidate earlier approval.
- specialist commands map only to Verifier / Strategist / Writer / Guardian and route through the explicit Orchestrator service.
- the fixed six-agent registry is preserved; deterministic local specialist adapters do not pretend to be live model/provider calls.
- the Opportunity Inbox separates opportunity score from evidence readiness, risk, exact-product state, media-rights state and blocker state.
- Queue and Performance remain explicit disabled/read-only capability surfaces rather than simulated completion.

PR #12 merged as `644d3d202f35b4f50d4ac0654d12918231e182ae`; its post-merge main CI succeeded. `docs/implementation/C_VERTICAL_SLICE_ACCEPTANCE.md` records the bounded application proof and limitations.

## Local persistence lock hardening — MERGED AND VERIFIED

PR #13 hardened the C-slice atomic JSON bridge for independent same-host writers without introducing a database or live service.

The application now serializes the full local mutation critical section:

`exclusive local lock → read state → idempotency/CAS checks → apply command → atomic persist → owner-checked release`

Implemented safety behavior:

- exclusive local-filesystem lock creation using Node standard-library file primitives
- bounded retry and fail-closed `storage_lock_timeout` / HTTP 503
- conservative stale abandoned-lock recovery
- unique lock-owner token so an old holder cannot delete a successor lock
- independent store instances preserve both concurrent writes
- duplicate `requestId` remains single-apply across independent stores
- API storage-lock failure returns an Orchestrator failure receipt and leaves state unchanged
- capability metadata explicitly reports `single_host_local_filesystem`; the implementation does not claim network-filesystem or distributed locking

PR #13 merged to `main` as `97fc8c7b340728dcc13756366f86fba3a4b099ce`. Post-merge main CI Run #170 completed successfully. `docs/implementation/PERSISTENCE_LOCK_HARDENING_PLAN.md`, `PERSISTENCE_LOCK_HARDENING_REFERENCE_REVIEW.md`, and `PERSISTENCE_LOCK_HARDENING_ACCEPTANCE.md` record the decision, proof and limitations.

## Candidate dedupe guardrail — IMPLEMENTED AND FINAL-PR VERIFIED ON PR #14

PR #14 adds a deterministic duplicate/near-duplicate portfolio guardrail over the persisted manual-candidate history without changing Verifier's product-truth authority.

### Exact duplicate

Automatic suppression requires complete normalized **brand + model + variant** equality against an active non-synthetic candidate. Source/seller URL and display-name equality are deliberately not exact identity keys.

- exact duplicate at ingestion does not create a second candidate
- if later Verifier identity edits make an existing record exact-duplicate, that record becomes `suppressed_duplicate` so its audit/history remains persisted
- exact suppression remains request-id idempotent and survives server reload

### Possible duplicate

Conservative normalized-name/token similarity may create `possible_duplicate` only when there is no known brand/model/variant contradiction.

- fuzzy/name similarity never manufactures `exact` product identity
- possible duplicates enter `duplicate_review`
- specialist work and ordinary hold/reject/approval decisions are blocked until explicit owner resolution
- `distinct` resumes normal verification; `duplicate` suppresses the record from the primary inbox while preserving server audit/state
- `distinct` is bound to the candidate identity signature so unchanged identity is not repeatedly reopened; identity changes are reassessed
- stale duplicate-resolution revisions fail through the existing HTTP 409 CAS boundary

### Portfolio / mobile UI

Pending duplicate reviews are priority-included in the bounded five-card Opportunity Inbox before score-based remainder selection. This prevents a low-score correctness task from becoming unreachable and keeps opportunity score from acting as the only inclusion authority.

The mobile workspace exposes matched candidate identity, similarity rationale, `서로 다른 제품`, and `중복으로 억제` actions. Evidence/content/approval controls are disabled while duplicate review is pending.

### Automated proof

Final PR-head GitHub Actions Run #182 (`31900089520`) on head `2ecb8811f96cdc35e070b6bbc31f591a728e86d9` completed successfully with **102 tests / 102 pass / 0 fail** plus `npm run orchestra:demo` success.

The suite covers exact suppression, source-URL mutation boundaries, known model/variant conflicts, possible duplicate review, specialist/human-decision bypass prevention, explicit resolution, identity-bound rechecks, post-verification suppression/reopening, portfolio priority inclusion, stale CAS, reload/idempotency, mobile controls, persistence locking, C-slice/Spike 0 regressions, fixture research and disabled live-source readiness.

`docs/implementation/CANDIDATE_DEDUPE_GUARDRAIL_PLAN.md`, `CANDIDATE_DEDUPE_REFERENCE_REVIEW.md`, and `CANDIDATE_DEDUPE_ACCEPTANCE.md` record four options, implementation self-review findings, source/reference boundaries, acceptance proof and limitations.

PR-head verification is complete. **PR #14 merged to `main` as `badb5ac`** — this paragraph previously still said merge and post-merge CI remained required, which was stale.

## AT-14 owner suppression — MERGED, BROWSER-VERIFIED, COMPLETE

Branch `feat/at14-user-suppression`, based on `1a104ee` (head of open PR #16) rather than `main`, because
`origin/main` carries no first-screen selection code at all — the ranking stage the approved pipeline puts
suppression in front of exists only on that branch.

Owner suppression is a deterministic faceted rule set: `{ axis, value, reason, createdAt, expiresAt }` over
the four axes `DAILY_OPERATING_MODEL.md` lists, matched by normalized equality. The rule set is **unordered
and any-match-wins** — no rule depends on its position — and suppression is a hard exclusion above the review
floor rather than a score deduction, because AT-14's "honor until the user reverses it" is a guarantee and a
deduction is outweighable.

Implemented boundaries:

- suppression is applied before ranking, per the approved pipeline, and carries its own `owner_suppressed`
  exclusion reason
- the reason is required, persisted, and inspectable per rule
- `복원` exempts that candidate and leaves the rule standing; removing the rule is a separate command
- user suppression never reuses the `suppressed_duplicate` state; a test asserts the two remain
  distinguishable on the same candidate, and `candidate-dedupe*.mjs` is untouched
- suppressing a candidate does not resolve or discard a pending duplicate review
- an expired rule stops suppressing on read, with no write in between
- suppression commands route `orchestrator → human_approval → orchestrator`; no specialist, no seventh agent
- stale revisions fail through the existing HTTP 409 CAS boundary; request ids stay idempotent; state
  survives reload and independent store instances

Automated proof: **145 tests / 145 pass / 0 fail** plus `npm run orchestra:demo` success, with 22 new tests.
A live HTTP run against a started server returned `candidate_suppressed` with the human-route receipt.

`docs/implementation/USER_SUPPRESSION_PLAN.md` (contract and four options),
`USER_SUPPRESSION_REFERENCE_REVIEW.md` (§16 gate), and `USER_SUPPRESSION_ACCEPTANCE.md` (proof, two
deviations, eight recorded findings, and the discharged completion gates) carry the detail.

**Complete, merged 2026-08-29 as `484956e` (PR #17).** `CLAUDE.md` §18 browser verification was
performed and passed 15/15: a real browser at 360x740 (DPR 3, touch on), every control driven by real
mouse input dispatched only after the click point was confirmed to hit-test to the control, covering
the suppress dialog, both reason rejections, a blocked axis failing closed, `복원`, `상세 보기`, the
dialog's two dismiss controls, reload persistence confirmed on disk, and four separate no-horizontal-
scroll measurements. PR-head CI and post-merge `main` CI (`33240991809`) both passed.

Three follow-ups came out of that run and are **open against the project, not against this slice**:
server error strings surface to the owner in English (§4.7, pre-existing and repo-wide), the
all-suppressed empty-state line sits 39px below the mobile fold (§4.8), and
`tests/persistence-lock.test.mjs` is load-flaky on Windows while green on CI (§4.6).

## Current precise status

**DESIGN COMPLETE / HARNESS DESIGN COMPLETE / SPIKE 0 VERIFIED / MANUAL-PRODUCT C VERTICAL SLICE MERGED / LOCAL SAME-HOST PERSISTENCE SERIALIZATION MERGED / MANUAL-CANDIDATE DEDUPE GUARDRAIL MERGED / AT-14 OWNER SUPPRESSION BROWSER-VERIFIED AND MERGED / FULL MASTER-DESIGN HARNESS + LIVE INTEGRATIONS NOT COMPLETE / LIVE CAPABILITIES OFF.**

This status intentionally does **not** claim production readiness. The current persistence bridge is single-host/local-filesystem only. Dedupe compares current persisted local manual-candidate history, not a global catalog or live Scout stream. Automated responsive/accessibility structure is tested, but a real-device/browser/assistive-technology acceptance matrix remains a separate verification item.

## Live capability state

Still intentionally disabled:

- Threads keyword discovery for the target app/account
- Threads insights
- Threads publishing
- live Coupang Partners commercial posting
- automated listing discovery beyond owner-supplied destinations
- live Scout/global candidate dedupe
- third-party media download/transform/republish without action-specific rights evidence
- schedule dispatch/reconciliation
- analytics learning

No credential, new dependency/framework, workflow-file change, model provider, live-network enablement, new agent, publication path, or scheduler activation is introduced by the candidate-dedupe slice.

## Remaining explicit boundaries

- user category/content suppression from AT-14 is separate from duplicate suppression and is now implemented on branch `feat/at14-user-suppression`; see the AT-14 section above. It remains unmerged and not browser-verified
- no UPC/EAN/GTIN or external catalog matching exists
- no embedding/LLM semantic dedupe exists
- no production database/trigram index exists; O(n) comparison is limited to the current bounded local candidate history
- multi-host/background production execution still requires database-backed transactional persistence
- real-device/browser/touch/assistive-technology acceptance is not replaced by structural web tests

## Next safe implementation boundary after PR #14

Do not jump directly to public posting. The next bounded non-live gap should be selected separately. Strong candidates are the real-device/browser acceptance harness and manual acceptance matrix, or AT-14 user/category suppression semantics. Production-store migration becomes the priority only when multi-host/background-worker execution is actually being introduced.

Before any live source or publishing slice, separately verify current account permissions/policies, credential storage, source-specific terms/rate limits, publication idempotency/reconciliation, kill switch, authorization preflight, evidence freshness, destination integrity, media rights and disclosure.
