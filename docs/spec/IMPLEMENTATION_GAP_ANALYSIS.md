# Existing Prototype vs Master Design v1 — Gap Analysis v3

Status: **DESIGN / HARNESS PLANNING ONLY.** This document classifies the pre-baseline prototype against the approved Master Design v1. It does not authorize runtime/product code changes.

## Current conclusion

The repository already contains useful executable prototype assets: a six-agent orchestra, deterministic replay/simulation, a tool broker, versioned evidence/artifact storage, fixture research, disabled live adapters, readiness checks, a local web approval prototype, and regression tests.

Those assets are **not discarded**, but they predate the approved Master Design v1. The next code task must therefore translate them through `keep / modify / retire / missing` rather than treating existing behavior as product authority.

The earlier v2 section titled `Still open in design` is obsolete. Master Design v1 subsequently resolved or explicitly deferred the P0/P1 items in `P0_P1_DECISION_TABLE.md`. Remaining unknowns are activation-time facts or implementation details, not missing core product design.

## Classification rules

- **KEEP** — concept and current implementation are useful enough to preserve as a starting asset; still subject to regression tests.
- **MODIFY** — implementation is useful but does not satisfy the approved contract without changes.
- **RETIRE** — behavior must not remain authoritative after its replacement exists. Deletion is not pre-authorized by this document.
- **MISSING** — approved behavior has no sufficient implementation yet.

## Harness/runtime inventory

| Current area | Representative paths | Classification | Approved-baseline treatment |
|---|---|---|---|
| fixed agent roster | `packages/orchestra/src/agent-registry.mjs`, `contracts.mjs` | KEEP + MODIFY | preserve exactly six roles; align authority, schemas, handoff envelopes, prompt/schema versions |
| Orchestrator | `packages/orchestra/src/orchestrator.mjs` | MODIFY | align with canonical state machine, routing, stale propagation, review binding, stop/hold/block semantics |
| executor/model abstraction | `executor.mjs`, `model-runtime.mjs`, `runtime-config.mjs` | KEEP + MODIFY | preserve provider-neutral execution; add approved budgets, cancellation/error classes, version receipts |
| tool brokerage | `tool-broker.mjs`, `research-tools.mjs`, `research-policy.mjs` | KEEP + MODIFY | preserve allowlists; add handler I/O contracts, mutability classes, design-authority checks |
| schemas/contracts | `schemas.mjs`, `contracts.mjs` | MODIFY | add ProductMatch, relation/media/claim states, review binding, canonical handoff validation |
| prompts | `prompts.mjs`, `packages/prompts/**` | MODIFY | align all six prompts with `PROMPT_SYSTEM_SPEC.md`; record prompt/schema versions and stop conditions |
| simulation/replay | `simulation.mjs`, `replay-fixtures.mjs`, `scripts/simulate-sinbak-orchestra.mjs`, `run-replay-runtime.mjs` | KEEP + MODIFY | preserve deterministic harness idea; replace/extend fixtures to approved scenarios and acceptance oracles |
| evidence/artifact store | `evidence-store.mjs`, `versioning.mjs`, `dependency-index.mjs`, `scripts/run-versioned-store.mjs` | KEEP + MODIFY | preserve immutable/content-addressed lineage; add operational revision/CAS/stale semantics required by review binding |
| fixture research | `fixture-research-adapter.mjs`, `fixture-research-pipeline.mjs`, `candidate-evidence.mjs`, `source-records.mjs` | KEEP + MODIFY | preserve offline research harness; add source-origin independence, product/media/issue semantics, TTL classes |
| live-source readiness | `live-source-registry.mjs`, `source-readiness.mjs`, `disabled-live-adapters.mjs`, readiness script | KEEP | continue fail-closed; never convert readiness metadata into live truth or automatic activation |
| mobile web prototype | `apps/web/**` | MODIFY / REFERENCE | preserve useful UX evidence only; migrate to Opportunity Inbox, server-authoritative state, current CTA matrix and stale-review behavior |
| prototype tests | `tests/*.test.mjs` | KEEP AS REGRESSION + MODIFY | retain legacy protection while adding Master-Design contract/scenario/UI tests; old green suite is not completion proof |
| analytics package | `packages/analytics/**` | MODIFY LATER | align metric classes/learning exclusions after the core vertical slice |
| database package | `packages/database/**` | MODIFY LATER | approved production class is durable server-side operational state; preserve artifact ideas but add transactional/version semantics |
| Threads API package | `packages/threads-api/**` | KEEP DISABLED / MODIFY LATER | keep disabled adapter boundary; actual account scope/token/publish behavior remains activation-time preflight |

## KEEP — preserve these foundations

The next implementation cycle should preserve, unless a focused spike disproves them:

- exactly six fixed agents and Orchestrator-only delegation
- provider-neutral model execution
- strict tool brokerage and agent tool allowlists
- bounded retries/invocation budgets
- structured output/schema checks
- deterministic simulation and replay
- receipts and audit-oriented metadata
- content-addressed/versioned evidence concepts
- dependency indexing and stale-invalidation concept
- fixture-first research
- disabled-by-default live adapters and readiness reporting
- regression fixtures proving blocked behavior

These are implementation assets, not permission to preserve obsolete schemas or state names.

## MODIFY — required before the approved vertical slice is complete

### 1. Orchestration state and handoffs

Align the existing Orchestrator with:

- `ORCHESTRATOR_STATE_MACHINE.md`
- `ROUTING_RULES.md`
- `HANDOFF_VALIDATION_RULES.md`
- `AGENT_HANDOFFS.md`
- `RUN_BUDGETS.md`

Required changes include explicit `hold / block / stale / cancel` behavior, immutable input refs, semantic authority checks, bounded revision loops, and rejection of invalid specialist envelopes rather than repairing truth by free-text invention.

### 2. Evidence and product semantics

Add/align:

- `exact / likely / substitute / unresolved` ProductMatch
- claim evidence class and minimum threshold
- source-origin/dependency identity rather than URL-count confidence
- issue source grade G0–G4 and relation grade R0–R5
- discovery-media state versus final-use rights state
- volatile-commerce freshness and observed time
- prohibited implications such as unsupported endorsement

### 3. Prompt and schema lifecycle

All six agent calls must record prompt and schema versions. Prompt text must include role authority, current evidence refs, success/stop conditions, and bounded output semantics. A downstream agent cannot create factual authority that is absent from the Verifier packet.

### 4. Review binding and stale propagation

Human review must bind exact revisions of:

- draft bundle / selected draft
- evidence packet
- media treatment/assets
- affiliate/destination mapping when present
- relevant configuration revision

Any material upstream change invalidates downstream Guardian/human approval. Cross-device decisions require compare-and-set/version rejection rather than last-write-wins.

### 5. Mobile product surface

The prototype UI must be aligned to:

- Opportunity Inbox as first screen
- max five decision cards
- visible evidence/readiness/risk/freshness/blocker states
- CTA controlled by current safe state
- 360px/touch-only behavior
- stale-review rejection and material-change explanation
- server-authoritative durable decisions

### 6. Harness verification

Current `simulate / replay / store / fixture / readiness` commands must evolve into one Master-Design-aware harness contract defined in `HARNESS_BLUEPRINT.md` and `HARNESS_ACCEPTANCE_MATRIX.md`.

## RETIRE — behavior that cannot remain authoritative

After equivalent approved behavior and regression coverage exist, retire any path that:

- surfaces fixture/synthetic values as current market truth
- treats one numeric score as permission to proceed
- lets URL count manufacture independent evidence
- lets repeated agent agreement manufacture factual confidence
- treats visible/research media as automatically publishable
- silently upgrades a similar listing to exact identity
- allows specialists to bypass Orchestrator or exceed role authority
- allows stale approval to survive material evidence/draft/media/destination changes
- makes browser/local state authoritative for durable approval or scheduling
- learns from blocked/misleading high-performing content
- lowers evidence or rights standards to fill a daily quota

No file deletion is authorized merely because a behavior is marked RETIRE. Replacement behavior, tests, migration/rollback, and diff review come first.

## MISSING — approved capabilities not sufficiently implemented

The following remain missing or not yet proven against Master Design v1:

- Master-Design handoff validator at every specialist boundary
- full canonical Orchestrator state machine with stale/hold/block behavior
- ProductMatch and exact-versus-alternative commercial eligibility
- source-origin independence/dependency graph in confidence decisions
- issue source/relation grading propagation
- media analysis/final-use separation in run artifacts
- claim/evidence threshold oracle
- non-sovereign 20→5 portfolio selector with reason codes
- server-authoritative HumanApproval with revision binding
- compare-and-set cross-device review decisions
- stale propagation from evidence/media/destination/config changes
- Guardian revision loop tied to exact changed inputs
- approved notification priority semantics
- dispatch preflight/reconciliation/kill switch for future live publishing
- Master-Design-specific UI behavior tests at 360px
- acceptance-result report that maps each scenario to AT IDs

## Live-dependent work remains deliberately outside the first harness spike

Do not require or activate these to prove the first Master Design harness:

- live Threads keyword discovery
- Threads insights
- Threads publishing
- live Coupang Partners posting
- automated exact-product discovery
- third-party media republication
- paid provider dependence

They remain designed but disabled until their separate activation gates pass.

## First implementation target after harness-design finalization

The first code spike is defined in `CODING_SPIKE_ENTRY.md`.

It proves a **manual-product, no-network orchestration path** using approved fixtures:

`owner-supplied product input → Verifier → Strategist(4) → Writer(4) → Guardian → human-decision binding`,

with a deliberate upstream mutation that must invalidate the old approval.

Scout may be skipped only because the input is an explicit owner-supplied product; the fixed six-agent roster remains unchanged.

## Implementation-resume rule

A code task may begin only when it explicitly names:

- Master Design v1 baseline
- `HARNESS_BLUEPRINT.md`
- `HARNESS_ACCEPTANCE_MATRIX.md`
- `CODING_SPIKE_ENTRY.md`
- relevant requirement/AT IDs
- applicable B0 and pre-implementation traps
- files allowed to change
- live capabilities that remain disabled
- success, rollback, and stop conditions

Do not resume ad-hoc coding from this gap list alone.