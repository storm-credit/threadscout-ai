# Master Design v1 Harness Blueprint

Status: **HARNESS DESIGN — approved implementation handoff candidate. No runtime code change is authorized by this document.**

## Purpose

The harness is the executable translation layer between the approved Master Design v1 and implementation. Its job is not to make the product look complete. Its job is to make contract violations, stale state, unsupported facts, blocked media, invalid routing, budget exhaustion, and review-binding failures reproducible before live integrations are introduced.

The repository already has useful prototype harness assets. This blueprint defines how those assets are retained and upgraded without allowing pre-baseline behavior to become authority.

## Success condition

Harness Design v1 is complete when a future coding agent can implement the harness without inventing:

- agent roster or authority
- routing/state semantics
- handoff validation
- fixture families
- acceptance ownership
- stale/review-binding behavior
- budget/receipt expectations
- live-capability boundaries
- first Coding Spike scope

## Stop conditions

The harness-design task stops rather than guessing when it would require:

- real Threads/Coupang/account credentials
- live publication
- paid provider spend
- third-party media reuse permission not already established
- a seventh/dynamic agent
- a change to Master Design invariants

Those require a separate explicit task or activation gate.

## Four harness architecture options

### Option A — rewrite the harness from scratch

Create a clean new harness and ignore most Phase2A–2F runtime assets.

**Pros:** conceptual cleanliness, no legacy semantics leak.

**Cons:** duplicates already-proven replay/store/broker work, increases code volume, hides which prototype assets were actually reusable.

**Decision:** reject.

### Option B — incrementally patch existing scripts

Keep `simulate`, `replay`, `store`, and research scripts as independent truth sources and add missing assertions where convenient.

**Pros:** smallest immediate edits.

**Cons:** fragmented completion semantics, difficult AT traceability, high risk that legacy script behavior silently remains authoritative.

**Decision:** reject as final architecture; scripts may remain adapters into the canonical harness.

### Option C — contract-first harness around existing runtime

Define one canonical scenario/result contract, reuse existing provider-neutral runtime/replay/store/research components behind it, and make Master Design contracts/AT IDs the oracle.

**Pros:** preserves proven assets, exposes gaps explicitly, deterministic first, provider-neutral, supports blocked-path testing, minimizes rewrite.

**Cons:** requires adapters around some legacy modules and deliberate migration of schemas/state names.

**Decision:** **selected.**

### Option D — live-provider integration harness first

Use real Threads/search/affiliate providers to validate the system end to end.

**Pros:** early live realism.

**Cons:** mixes product-contract failures with auth/rate-limit/policy/network failures, introduces secrets and irreversible risk too early, violates fail-closed staging.

**Decision:** reject for first implementation cycle.

## Selected harness architecture

```text
Scenario Fixture / Manual Test Input
              │
              ▼
      Harness Context Builder
              │
              ▼
     Canonical Orchestrator Runner
              │
              ├── validates route/state/budget
              │
              ▼
        Specialist Adapter
   (one of fixed six roles only)
              │
              ▼
      Handoff Contract Validator
              │
              ├── schema
              ├── semantic authority
              ├── immutable refs
              ├── evidence refs
              ├── version/freshness
              └── next action
              │
              ▼
   Evidence / Artifact / State Stores
              │
              ├── immutable artifact lineage
              ├── mutable operational revision
              ├── stale dependency propagation
              └── approval binding
              │
              ▼
   Deterministic Service Test Doubles
              │
              ├── source adapter
              ├── duplicate/suppression
              ├── media registry
              ├── affiliate mapping
              ├── scheduler/publisher stub
              └── metrics stub
              │
              ▼
        Acceptance Oracle
              │
              ├── AT IDs
              ├── expected state
              ├── prohibited state
              ├── evidence/rights assertions
              └── audit/receipt assertions
              │
              ▼
          Run Report
```

## Harness layers

### H0 — Fixture catalog

A fixture is versioned, synthetic or owner-supplied test material with explicit truth labels. No fixture value may be surfaced as live truth.

Required metadata:

- fixture ID/version
- scenario family
- known facts
- deliberately unknown facts
- evidence origins/dependencies
- product match truth
- media rights truth
- issue/relation truth when applicable
- volatile timestamps
- expected route/state
- relevant AT IDs

Canonical fixture families are in `HARNESS_ACCEPTANCE_MATRIX.md`.

### H1 — Context builder

Produces the exact initial run context from fixture/manual input and configuration revision.

It must distinguish:

- explicit owner-supplied product, where Scout may be skipped
- discovery candidate, where Scout is required
- synthetic fixture versus current fact
- configured capability versus enabled capability

### H2 — Canonical Orchestrator runner

The Orchestrator is the only routing authority.

It owns:

- stage/state
- call/source budgets
- retry counters
- hold/block/stale/cancel
- human gate
- specialist dispatch
- stale invalidation propagation

A specialist never chooses another specialist directly.

### H3 — Fixed specialist adapters

Exactly six role adapters exist:

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

No harness helper becomes a seventh agent. Deterministic utilities remain services/test doubles.

### H4 — Handoff validator

Every handoff is rejected unless all five classes pass:

1. schema validity
2. semantic/role authority
3. evidence and immutable input refs
4. version/freshness/stale validity
5. allowed next action

The validator must not repair unsupported claims by inventing text.

### H5 — Evidence/artifact lineage

Preserve the prototype's content-addressed/versioning ideas, but distinguish:

- immutable evidence/artifact content
- mutable operational state
- material revision identity
- dependency edges
- stale propagation

A hash proves identity/consistency, not truth.

### H6 — Review-binding state

Guardian and human approval bind an exact revision set.

Minimum binding set:

- selected draft revision
- evidence packet revision
- media set/treatment revision
- destination/affiliate mapping revision when applicable
- relevant configuration revision

A material upstream mutation invalidates Guardian/human approval. A stale approval attempt must fail rather than silently apply to the new state.

### H7 — Deterministic service doubles

For harness runs, external effects are replaced with deterministic doubles unless the test explicitly belongs to a later live activation stage.

Required doubles/interfaces:

- source result provider
- duplicate/suppression lookup
- media-rights registry
- commercial destination mapping
- scheduler/publisher
- metrics collector
- notification sink

The publisher double may record intended actions but cannot perform public posting.

### H8 — Budget and receipt layer

Default constraints follow `RUN_BUDGETS.md`:

- specialist invocation ceiling: 12/run
- Scout refinement: max 1
- Writer Guardian-driven revisions: max 2
- budget exhaustion: partial/hold/block, never new agent or silent scope expansion

Every specialist/tool/source call emits a receipt without secrets.

### H9 — Acceptance oracle

The oracle compares actual artifacts/state against behavioral acceptance, not string snapshots alone.

It can assert:

- must equal
- must contain required refs
- must not contain prohibited claim/state
- route must stop
- route may skip only allowed stage
- previous approval must become stale
- budget/receipt counts
- evidence origins counted independently

### H10 — Run report

Each scenario reports:

- scenario/fixture version
- Master Design baseline ref
- prompt/schema/config versions
- route taken
- artifact refs
- receipts
- acceptance IDs checked
- passed/failed/blocked/partial result
- unexpected deviations

A green run without AT mapping is diagnostic, not completion proof.

## Execution modes

### Mode 1 — deterministic replay

No model/network. Replays fixed specialist outputs to prove routing, handoff, stale, budget, and lineage behavior.

**First priority.**

### Mode 2 — deterministic fixture simulation

Uses fixture research and provider-neutral specialist simulation to prove evidence/content/review scenarios.

### Mode 3 — local manual vertical slice

Owner-supplied product input reaches Verifier → Strategist → Writer → Guardian → human decision through the real application boundary, while external publishing remains stubbed.

### Mode 4 — configured provider test

A later stage. Model/provider calls may be enabled in a non-public sandbox with budgets and no publication authority.

### Mode 5 — live activation test

Separate activation task only. Threads/Coupang/live media actions require current permissions/policies/preflight and explicit enablement.

## Prototype reuse map

The initial implementation should prefer adapting these existing assets rather than replacing them blindly:

- `packages/orchestra/src/orchestrator.mjs`
- `agent-registry.mjs`
- `contracts.mjs`
- `schemas.mjs`
- `executor.mjs`
- `model-runtime.mjs`
- `tool-broker.mjs`
- `simulation.mjs`
- `replay-fixtures.mjs`
- `evidence-store.mjs`
- `versioning.mjs`
- `dependency-index.mjs`
- fixture-research/source-record/readiness modules
- existing `tests/*.test.mjs` as legacy regression protection

Exact keep/modify/retire treatment is in `IMPLEMENTATION_GAP_ANALYSIS.md`.

## Harness completion proof

Harness implementation may later be called complete only when:

- canonical scenario runner exists
- selected fixture families are executable
- required AT IDs produce explicit results
- normal and blocked paths are tested
- stale approval mutation is reproduced
- six-agent/Orchestrator authority is enforced
- budgets and receipts are observable
- no live external action is required
- legacy regression suite still passes or an approved deviation is recorded
- diff review finds no hidden live enablement, secret handling regression, or seventh-agent path

## First Coding Spike

`CODING_SPIKE_ENTRY.md` defines the only authorized first spike target after the owner explicitly resumes coding.

Harness design itself does not resume coding.