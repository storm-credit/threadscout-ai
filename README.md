# ThreadScout AI

Approval-first product discovery and content operations for Threads.

## Product direction

ThreadScout finds **실용 신박템**, verifies exact product evidence, creates four different content approaches, performs an independent Guardian review, and requires human approval before a local queue record is created.

## Current phase

Phase 2D — the fixed six-agent orchestra now has:

- six detailed prompts and output schemas
- provider-neutral replay execution
- strict per-agent runtime and tool budgets
- content-addressed source/artifact storage
- prompt, schema, roster, evidence, parent, and artifact hashes
- append-only per-run event streams with hash-chain validation
- stale-artifact detection when evidence changes

No live model, product-data, affiliate, search, or Threads API is connected. All demonstrations use explicitly synthetic fixture data. External publishing is disabled.

## Fixed six-agent roster

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no dedicated price agent. Price, stock, seller, variant, and observation time are one Evidence Verifier snapshot.

## Runtime and persistence flow

```text
objective
  ↓
provider-neutral replay runtime
  ↓
6 validated agent artifacts
  ↓
version metadata + content hashes
  ↓
content-addressed object store
  ↓
hash-chained run events
  ↓
Guardian pass → explicit human approval → local-only queue
```

## Commands

```bash
npm run verify
npm run orchestra:demo
npm run orchestra:simulate
npm run orchestra:replay
npm run orchestra:store
npm start
```

## Key files

- `packages/orchestra/src/agent-registry.mjs` — fixed six roles
- `packages/orchestra/src/prompts.mjs` — six prompts
- `packages/orchestra/src/schemas.mjs` — six output schemas
- `packages/orchestra/src/model-runtime.mjs` — provider-neutral replay runtime
- `packages/orchestra/src/tool-broker.mjs` — strict tool authorization
- `packages/orchestra/src/versioning.mjs` — canonical hashes and artifact freshness
- `packages/orchestra/src/evidence-store.mjs` — content-addressed objects and JSONL event chain
- `packages/orchestra/src/executor.mjs` — runtime, versioning, persistence, and approval flow
- `docs/STORAGE_OPTIONS.md` — four persistence options and selected design

## Current non-goals

- live LLM/API credentials
- live product scraping or current price claims
- distributed/multi-process workers
- automatic comments, likes, follows, purchase, payment, or publication
- dynamic or seventh agents

## Next safe gate

Add source/evidence schemas, artifact invalidation indexes, and a read-only fixture research adapter. Live public research remains blocked until source access terms, recency, rate limits, retention, and redaction are explicitly checked.
