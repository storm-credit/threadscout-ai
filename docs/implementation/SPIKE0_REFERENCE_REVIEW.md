# Coding Spike 0 Reference Review

Baseline: `691aad24cd307c7094ed1531f06e5b1d2976b088`

Scope: no-network Master Harness Contract Spine only.

## Repository evidence reviewed first

The implementation shape was rechecked against the existing ThreadScout assets before choosing a code path:

- `packages/orchestra/src/orchestrator.mjs` already owns the fixed route, explicit owner-product Scout skip, Guardian revision loop, human gate, and specialist invocation ceiling.
- `model-runtime.mjs` already provides provider-neutral deterministic replay, per-agent/run budgets, schema/semantic validation, and receipts.
- `versioning.mjs` already provides canonical hashing, prompt/schema/runtime manifest hashes, immutable parent refs, evidence refs, and artifact integrity checks.
- `dependency-index.mjs` already models parent/evidence dependency traversal.
- `simulation.mjs` and `replay-fixtures.mjs` already prove the legacy happy-path contract and remain regression assets.

This evidence rejects a rewrite and confirms the Harness Design Option C recommendation: adapt the existing runtime behind a canonical harness layer.

## External primary/reference implementations

### 1. LangGraph — `langchain-ai/langgraph`

Authority: upstream project repository. License: MIT.

Adopt conceptually:

- explicit state-machine/durable-state thinking for agent workflows
- treating interruption/resume and state as first-class concerns rather than prompt convention

Reject for Spike 0:

- adding LangGraph as a dependency
- replacing the existing ThreadScout state machine or fixed six-agent contract

Reason: ThreadScout already has bounded routing and replay primitives. A framework migration would widen the spike without proving the actual legacy-to-Master-Design compatibility risk.

### 2. Temporal TypeScript SDK — `temporalio/sdk-typescript`

Authority: Temporal upstream SDK repository.

Adopt conceptually:

- deterministic replay as a correctness property
- immutable history/version-aware state changes
- explicit treatment of retries and side effects

Reject for Spike 0:

- adding Temporal infrastructure or SDK dependencies
- turning the local harness into distributed workflow infrastructure

Reason: the useful lesson is deterministic semantics and history binding; the product does not yet need distributed workflow machinery to prove revision/CAS behavior.

### 3. OpenAI Agents JS — `openai/openai-agents-js`

Authority: OpenAI upstream agent SDK repository.

Adopt conceptually:

- explicit agent/tool boundaries and traceability
- structured run artifacts instead of hidden specialist-to-specialist delegation

Reject for Spike 0:

- replacing the provider-neutral replay runtime
- adopting dynamic handoffs that would conflict with ThreadScout's Orchestrator-only delegation invariant

Reason: ThreadScout deliberately uses a fixed six-agent roster and deterministic services. The reference reinforces traceability, but its runtime is not required for this contract spike.

## Four implementation-shape recheck

| Option | Repo evidence | Decision |
|---|---|---|
| rewrite orchestration core | existing route/replay/version/store primitives are reusable | reject |
| patch Orchestrator only | cannot by itself express canonical report, revision binding, fixture oracle | reject |
| adapt existing runtime behind canonical harness contract | reuses current primitives while adding missing binding/oracle semantics | **selected** |
| parallel new harness package | duplicates existing orchestra/version/runtime concepts | reject unless current modules prove unusable |

## Selected implementation consequence

Add a small canonical harness layer inside `packages/orchestra/src/` plus a deterministic runner and spike tests. Preserve legacy modules unless a concrete test proves a required Master Design behavior cannot be represented. No new dependency, framework, network call, credential, UI change, or live capability is introduced.
