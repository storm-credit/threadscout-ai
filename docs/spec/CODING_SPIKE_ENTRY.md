# Coding Spike 0 — Master Harness Contract Spine

Status: **IMPLEMENTED AND VERIFIED ON PR #11. MERGE/PROMOTION TO `main` IS THE FINAL COMPLETION STEP.**

The owner explicitly resumed coding after the Harness Design baseline was merged. This document now records both the original implementation entry contract and the verified result.

## Why a spike comes before the full C vertical slice

The highest-risk unknown is not whether a form can be drawn. It is whether the pre-baseline six-agent runtime can enforce the approved Master Design contracts without a rewrite: semantic authority, revision binding, stale propagation, bounded routing, and deterministic acceptance reporting.

Spike 0 isolates that risk without browser, network, credentials, affiliate posting, or public publication.

## Spike goal

Prove one no-network manual-product path using existing runtime assets where possible:

```text
owner-supplied fixture product
        ↓
Orchestrator intake
        ↓
Scout skipped by explicit-input routing rule only
        ↓
Evidence Verifier
        ↓
Content Strategist — exactly 4 angles
        ↓
Threads Writer — exactly 4 drafts
        ↓
Integrity Guardian
        ↓
human-decision domain record
        ↓
material upstream mutation
        ↓
old approval becomes stale / rejected
```

The six-agent roster remains exactly six. Skipping Scout in this route does not remove or merge the Scout role.

## Context / Interview Gate

No new user question is required to start this spike **if** all of the following remain true:

- no live Threads call
- no live Coupang call
- no paid provider requirement
- no public publication
- no third-party media reuse
- fixture/manual product input only
- no change to approved six-agent/product architecture

If any condition changes, stop and ask only the high-impact missing questions before coding.

## Reference-first Gate

Before editing runtime code, the coding agent must:

1. inspect the existing orchestra/replay/store tests and modules in this repository
2. inspect 3–5 relevant primary/reference implementations or official docs only if they materially reduce risk for the chosen technical mechanism
3. record adopt / reject / reason / license or source authority
4. prefer existing project-compatible patterns over introducing a new framework

Reference review is for architecture/pattern learning, not code cargo-culting.

Implementation reference evidence is recorded in `docs/implementation/SPIKE0_REFERENCE_REVIEW.md`.

## Four implementation-shape options to recheck at spike start

The coding agent must verify these against the then-current repo and record the choice before implementation:

1. **rewrite orchestration core** — high replacement risk; default reject
2. **patch existing Orchestrator only** — too narrow if contracts/store cannot express revision binding
3. **adapt existing runtime behind canonical harness contract** — **selected and validated**
4. **new parallel harness package** — acceptable only if adapting existing modules would create unsafe coupling; must justify duplication

Repository inspection did not invalidate Option 3. No parallel framework/package was required.

## In-scope behavior

Spike 0 may implement only what is needed to prove:

- fixed six-agent registry invariant
- explicit owner-supplied-product route with Scout skip rule
- canonical handoff envelope validation
- Verifier factual authority
- ProductMatch minimum semantics needed for `exact` versus unresolved
- exactly four Strategist outputs
- exactly four Writer drafts mapped 1:1 to strategies
- Guardian revise/block independence
- prompt/schema/config version refs on artifacts
- immutable input/evidence refs
- run budgets and receipts
- human-decision revision binding at domain/state level
- stale invalidation after material upstream mutation
- compare-and-set rejection of an old revision decision
- deterministic run report with AT IDs

## Out of scope

Do not add during Spike 0:

- live Threads discovery/insights/publishing
- live Coupang/affiliate posting
- automatic product search
- media download/transform/republish
- public-figure issue pipeline implementation
- 20→5 discovery portfolio selection
- scheduling/publisher network calls
- analytics learning
- PWA/service worker/push
- full UI redesign
- multi-user/auth system
- new agent roles

These remained out of scope during implementation.

## Preferred allowed-change surface

The spike was constrained to the existing orchestra/runtime surface, one harness runner, tests, package script wiring, and implementation/status documentation. It did **not** require changes to `apps/web/**`, `packages/threads-api/**`, workflow logic, credentials, dependencies, or live enablement.

Relevant runtime files inspected included:

- `packages/orchestra/src/agent-registry.mjs`
- `contracts.mjs`
- `schemas.mjs`
- `orchestrator.mjs`
- `executor.mjs`
- `model-runtime.mjs`
- `tool-broker.mjs`
- `evidence-store.mjs`
- `versioning.mjs`
- `dependency-index.mjs`
- `replay-fixtures.mjs`
- `simulation.mjs`
- `prompts.mjs`

## Required fixtures

From `HARNESS_ACCEPTANCE_MATRIX.md`:

- F01 owner-supplied exact product
- F02 conflicting-model similar product
- F04 high-score unresolved gate
- F11 upstream mutation after approval
- F12 budget exhaustion
- F13 unsupported endorsement wording
- F15 first-hand wording without UsageRecord
- F20 contaminated fact repeated downstream
- F21 stale cross-revision decision

All required fixtures are executable in the Spike 0 harness. F08 was not added because it was optional and unnecessary to prove this contract spine.

## Required acceptance IDs

Minimum:

`AT-04, AT-06, AT-07, AT-08, AT-09(domain), AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-23, AT-25(domain), AT-36(domain), AT-38, AT-39, AT-41`

All required Spike 0 AT checks pass in the deterministic suite.

## Success conditions

Spike 0 succeeds only if all are true:

1. existing six-agent roster remains exactly six
2. owner-supplied route skips Scout only through the documented routing exception
3. F01 reaches Guardian/human-decision state with exactly four strategies and four mapped drafts
4. F02 cannot become `exact`
5. F04 cannot proceed merely because of a high opportunity score
6. F13 forces Guardian revise/block
7. F15 prevents fake first-hand language
8. F20 proves downstream repetition does not raise factual confidence
9. F12 stops within configured budget without creating another role or silently widening scope
10. F11/F21 prove an old approval becomes stale and stale CAS decision is rejected after material upstream change
11. every attempted specialist invocation has a receipt without secrets
12. artifacts expose prompt/schema/config versions and immutable refs
13. deterministic replay of the same fixture/config produces equivalent semantic outcome and traceable lineage
14. a report identifies baseline, fixture, route, artifacts, AT IDs, and result
15. old prototype regression tests still pass, or any intentional break has a recorded requirement/AT-backed deviation

All fifteen success conditions are satisfied by PR #11 verification.

## Failure / stop conditions

The original stop conditions were:

- existing state/storage model cannot represent revision binding without a wider persistence redesign
- a seventh agent appears necessary
- live network data becomes required to prove a core contract
- product truth cannot be separated from model-generated text
- implementing CAS/stale semantics requires changing the approved server-authoritative architecture
- required changes spread into unrelated UI/publishing/analytics packages
- secrets or real credentials would be needed
- the recommended implementation option is invalidated by repository evidence

None triggered. The only deviation was an observability gap in preflight budget rejection receipts, resolved inside `model-runtime.mjs` without widening architecture.

## Completion Proof Gate

Completion proof performed on PR #11 includes:

- canonical harness scenarios executed
- normal, blocked, budget-exhausted, Guardian-revise, and stale/CAS paths inspected
- all required Spike 0 AT checks green
- deterministic F01 semantic replay confirmed
- secret sentinel absent from reports/receipts
- full existing verification suite executed
- legacy simulation/replay/store/research/readiness checks remained green
- 69 automated tests passed with 0 failures on GitHub Actions Run #138
- diff remained outside UI, live provider, dependency, credential, and workflow-file scope
- the F12 receipt deviation was recorded in `docs/IMPLEMENTATION_STATUS.md` and `docs/DECISION_LOG.md`

## Implementation result

The spike answered the migration question positively: **the existing ThreadScout runtime can be adapted behind the approved Master Design contract without a rewrite.**

Implemented artifacts include:

- `packages/orchestra/src/master-harness.mjs`
- `scripts/run-master-harness-spike0.mjs`
- `tests/master-harness-spike0.test.mjs`
- `npm run harness:spike0`
- the rejected-invocation receipt correction in `model-runtime.mjs`

This is the Master Harness **contract spine**, not the complete AT-01~44 executable product harness.

## Handoff after a successful spike

After PR #11 is merged and `main` verification remains green, the next bounded product implementation slice is the manual-product C vertical slice:

`input → verified candidate → Opportunity Inbox → four strategies → four drafts → Guardian → owner approve/hold/reject`

External publishing remains stubbed/off. The C slice must separately refresh its gap map, B0/trap coverage, UI acceptance set, server-state boundary, and 360px completion proof before coding.