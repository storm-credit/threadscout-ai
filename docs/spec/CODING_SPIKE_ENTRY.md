# Coding Spike 0 — Master Harness Contract Spine

Status: **READY AS A FUTURE IMPLEMENTATION ENTRY CONTRACT. NOT AUTHORIZED TO CODE BY THIS DOCUMENT.**

The owner must explicitly resume coding after this harness-design baseline is merged. Until then this file is planning only.

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

## Four implementation-shape options to recheck at spike start

The coding agent must verify these against the then-current repo and record the choice before implementation:

1. **rewrite orchestration core** — high replacement risk; default reject
2. **patch existing Orchestrator only** — too narrow if contracts/store cannot express revision binding
3. **adapt existing runtime behind canonical harness contract** — **current recommended option**
4. **new parallel harness package** — acceptable only if adapting existing modules would create unsafe coupling; must justify duplication

The recommendation may change only with a recorded deviation explaining the repo evidence that invalidated it.

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

These are separate slices.

## Preferred allowed-change surface

Start by inspecting and minimizing changes around:

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
- `prompts.mjs` / existing prompt package only as required
- `scripts/` for one canonical harness runner or report adapter
- `tests/` for spike-specific contract/scenario tests

Do **not** touch `apps/web/**`, `packages/threads-api/**`, workflow logic, credentials, dependencies, or live enablement unless the spike proves this scope is impossible. If scope must widen, stop and record the deviation before proceeding.

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

F08 source-independence may be added only if it does not widen the architecture.

## Required acceptance IDs

Minimum:

`AT-04, AT-06, AT-07, AT-08, AT-09(domain), AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-23, AT-25(domain), AT-36(domain), AT-38, AT-39, AT-41`

This is intentionally smaller than AT-01~44.

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
11. every specialist/tool invocation has a receipt without secrets
12. artifacts expose prompt/schema/config versions and immutable refs
13. deterministic replay of the same fixture/config produces equivalent semantic outcome and traceable lineage
14. a report identifies baseline, fixture, route, artifacts, AT IDs, and result
15. old prototype regression tests still pass, or any intentional break has a recorded requirement/AT-backed deviation

## Failure / stop conditions

Stop the spike and report rather than expanding scope if:

- existing state/storage model cannot represent revision binding without a wider persistence redesign
- a seventh agent appears necessary
- live network data becomes required to prove a core contract
- product truth cannot be separated from model-generated text
- implementing CAS/stale semantics requires changing the approved server-authoritative architecture
- required changes spread into unrelated UI/publishing/analytics packages
- secrets or real credentials would be needed
- the current recommended implementation option is invalidated by repository evidence

The report must state original plan, exact mismatch, why, affected requirements/ATs, recommended next option, and residual risk.

## Completion Proof Gate

Passing unit tests is not enough. Before claiming Spike 0 complete, the coding agent must:

- run the canonical harness scenarios
- inspect generated route/artifact/receipt reports
- prove at least one blocked and one stale path
- run the full existing verification suite
- review the diff for role drift, hidden network activation, secrets, and scope creep
- re-run the applicable pre-implementation traps/B0 mapping
- compare results against every success condition above
- push branch/commits, create PR, inspect Actions, and resolve failures

## Handoff after a successful spike

A successful Spike 0 does **not** mean the product UI or live integrations are complete.

It unlocks planning for the first manual-product C vertical slice:

`input → verified candidate → Opportunity Inbox → four strategies → four drafts → Guardian → owner approve/hold/reject`,

with external publishing still stubbed/off.