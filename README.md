# ThreadScout AI

AI-assisted product discovery and approval-first content operations for Threads.

## Product direction

ThreadScout discovers product candidates, verifies evidence, designs four content angles, writes four drafts, performs an independent integrity review, and lets a human approve before any queue or publication action.

## Current phase

Phase 2A — the framework-neutral fixed six-agent orchestra and deterministic dry-run coordinator are implemented.

No automatic publishing is enabled. The prototype uses fixture products, local storage, structured agent contracts, bounded loops, and a local-only queue so integrity can be validated before any external model, product-data, or Threads API is connected.

## Fixed six-agent roster

1. Orchestrator / Conductor
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no dedicated price agent. Price, stock, seller, product variant, and observation time are evidence handled by the Evidence Verifier.

Scheduling, publishing, metrics collection, and audit logging are deterministic services—not agents.

## Core flow

1. Orchestrator records objective, constraints, success criteria, loop limits, and stop conditions.
2. Product Scout collects candidates unless the user supplied an exact product.
3. Evidence Verifier resolves exact product identity, evidence, rights, and volatile commerce snapshots.
4. Content Strategist creates four genuinely different content angles.
5. Threads Writer writes four Korean drafts using verified facts only.
6. Integrity Guardian returns pass, revise, or block.
7. Human edits and approves.
8. Deterministic scheduler stores an approved local queue record.
9. A future publisher adapter may run only after official API and permission verification.

## Repository map

- `CLAUDE.md` — project constitution and fixed-agent rules
- `docs/AGENT_ORCHESTRA.md` — detailed six-agent responsibilities and handoffs
- `docs/AGENT_RESEARCH.md` — current orchestration-framework research
- `docs/PHASE2_PLAN.md` — success, non-goals, and stop conditions for the orchestra
- `packages/orchestra/` — fixed registry, artifact contracts, and deterministic routing
- `docs/PROJECT_BRIEF.md` — goals, users, scope, and assumptions
- `docs/USER_INTERVIEW.md` — unanswered product questions
- `docs/SUCCESS_CRITERIA.md` — measurable completion and stop conditions
- `docs/DESIGN_OPTIONS.md` — four comparable product designs
- `docs/BLIND_SPOTS.md` — product, legal, operational, agent, and business blind spots
- `docs/PRE_IMPLEMENTATION_TRAPS.md` — technical traps to resolve before live integration
- `docs/PRODUCT_SCOUT_SPEC.md` — candidate discovery and scoring specification
- `docs/PROMPTING_PLAYBOOK.md` — context dump, prompt refinement, and output review
- `docs/DECISION_LOG.md` — changes from the original plan and their impact
- `docs/ARCHITECTURE.md` — approval-first six-agent architecture

## Commands

```bash
npm run verify
npm run orchestra:demo
npm start
```

## Non-goals for the current phase

- Dynamic or seventh agents
- Dedicated price agent
- Automatic comments, likes, follows, or engagement farming
- Publishing without Guardian pass and explicit human approval
- Claiming first-hand use when the product was not used
- Reposting third-party media without recorded usage rights
- Hiding affiliate relationships
- Installing a heavy orchestration framework before contracts are validated
- Building a multi-tenant SaaS before the personal workflow is validated

## Next gate

Connect a model runtime only after the six contracts are stable, the user confirms the content niche and disclosure wording, and the framework/runtime choice passes a separate four-option review.
