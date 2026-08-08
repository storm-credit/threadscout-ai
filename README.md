# ThreadScout AI

AI-assisted product discovery and approval-first content operations for Threads.

## Product direction

ThreadScout finds products worth talking about, verifies exact identity and evidence, creates four different content approaches, performs an independent integrity review, and requires human approval before anything enters a queue.

The primary operating niche is now **실용 신박템**: products with a novel or unexpected mechanism that solve a visible everyday problem and can be understood through a short demonstration. Novelty alone is not enough.

## Current phase

Phase 2B — the fixed six-agent orchestra now has detailed system prompts, machine-readable output schemas, a practical-novelty scoring profile, and a deterministic end-to-end fixture simulation.

No live model, product-data, affiliate, or Threads API is connected. The simulation uses explicitly synthetic product, seller, price, stock, media, and evidence records. External publishing is disabled.

## Fixed six-agent roster

1. Orchestrator / Conductor
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no dedicated price agent. Price, stock, seller, product variant, and observation time belong to one Evidence Verifier commerce snapshot.

Scheduling, publishing, metrics collection, and audit logging are deterministic services—not agents.

## Core flow

1. Orchestrator fixes objective, constraints, success criteria, stop conditions, and limits.
2. Product Scout ranks practical novel-item candidates.
3. Evidence Verifier checks exact product, claims, media rights, and time-stamped commerce evidence.
4. Content Strategist creates four logically different angles.
5. Threads Writer creates four Korean drafts from verified evidence only.
6. Integrity Guardian returns pass, revise, or block.
7. Human edits and approves.
8. Scheduler writes a local-only queue record.

## Practical novel-item gates

A candidate cannot be recommended only because it looks surprising. The current score prioritizes:

- problem clarity: 20
- demonstration potential: 20
- practical utility: 20
- novelty: 15
- purchase intent: 15
- audience fit: 10

Low utility, unclear problems, weak evidence, product-identity risk, rights risk, health-claim risk, and over-saturation reduce or block a recommendation.

## Repository map

- `CLAUDE.md` — project constitution, six-agent rules, and niche rules
- `docs/SINBAK_ITEM_STRATEGY.md` — four niche options and selected strategy
- `docs/PHASE2B_PLAN.md` — Phase 2B success and stop conditions
- `packages/orchestra/src/prompts.mjs` — six system prompts
- `packages/orchestra/src/schemas.mjs` — six output schemas and validator
- `packages/orchestra/src/niche-profile.mjs` — practical-novelty score and gates
- `packages/orchestra/src/simulation.mjs` — deterministic full-run fixture
- `packages/orchestra/src/agent-registry.mjs` — immutable six-agent roster
- `packages/orchestra/src/contracts.mjs` — artifact integrity contracts
- `packages/orchestra/src/orchestrator.mjs` — state machine and bounded routing

## Commands

```bash
npm run verify
npm run orchestra:demo
npm run orchestra:simulate
npm start
```

## Non-goals for the current phase

- Dynamic or seventh agents
- Dedicated price agent
- Live product scraping
- Real product-price claims from fixture data
- Live LLM or paid API calls
- Automatic comments, likes, follows, or engagement farming
- External publication
- Publishing without Guardian pass and explicit human approval

## Next gate

Build a provider-neutral model adapter and tool boundary only after prompt/schema fixtures remain stable. Live public-product research must be added separately with source, recency, robots/terms, rate-limit, and evidence-retention checks.
