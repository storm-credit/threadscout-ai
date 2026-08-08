# ThreadScout AI

Approval-first product discovery and content operations for Threads.

## Product direction

ThreadScout finds practical novel items worth talking about, verifies exact identity and evidence, creates four different content approaches, performs an independent integrity review, and requires human approval before anything enters a queue.

The primary niche is **실용 신박템**: products with a novel mechanism that solve a visible everyday problem and can be understood through a short demonstration. Novelty alone is not enough.

## Current phase

Phase 2C — the project now has a provider-neutral model runtime boundary, deterministic replay provider, strict tool broker, per-agent budgets, total-run budgets, and auditable invocation receipts.

No live model, product-data, affiliate, search, or Threads API is connected. Replay uses explicitly synthetic fixture data. External publishing is disabled.

## Fixed six-agent roster

1. Orchestrator / Conductor
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no dedicated price agent. Price, stock, seller, variant, and observation time belong to one Evidence Verifier commerce snapshot.

## Runtime flow

```text
objective
  ↓
provider-neutral runtime
  ↓
Orchestrator → Scout → Verifier → Strategist → Writer → Guardian
  ↓
validated artifact after every call
  ↓
human approval
  ↓
local-only scheduler record
```

Each call receives the fixed system prompt, machine-readable output schema, structured prior artifacts, and stage context. Output must pass both semantic contract and schema validation before the state machine advances.

## Runtime controls

- exactly six per-agent budget entries
- timeout, max attempts, max input characters, and max output characters per agent
- total invocation, elapsed-time, and output budgets
- one receipt per model invocation
- per-agent tool allowlists
- publication, purchase, and payment tools blocked
- replay provider for deterministic tests and incident reproduction

## Commands

```bash
npm run verify
npm run orchestra:demo
npm run orchestra:simulate
npm run orchestra:replay
npm start
```

## Repository map

- `packages/orchestra/src/agent-registry.mjs` — fixed six roles
- `packages/orchestra/src/prompts.mjs` — six detailed system prompts
- `packages/orchestra/src/schemas.mjs` — output schemas
- `packages/orchestra/src/orchestrator.mjs` — state machine and gates
- `packages/orchestra/src/model-runtime.mjs` — provider-neutral replay runtime
- `packages/orchestra/src/runtime-config.mjs` — budgets
- `packages/orchestra/src/tool-broker.mjs` — strict tool authorization
- `packages/orchestra/src/executor.mjs` — runtime-driven orchestration
- `packages/orchestra/src/replay-fixtures.mjs` — deterministic replay handlers
- `docs/RUNTIME_OPTIONS.md` — four runtime options and selection

## Current non-goals

- live LLM or paid API calls
- live product research or scraping
- real market claims from fixture data
- dynamic or seventh agents
- dedicated price agent
- automatic engagement
- external publication

## Next safe gate

Add a persistent evidence store and prompt/artifact version hashes, then design a read-only public-research adapter with source recency, access-policy, rate-limit, and evidence-retention checks. A live provider or publishing adapter remains a separate approval decision.
