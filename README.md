# ThreadScout AI

Approval-first product discovery and content operations for Threads.

## Direction

The primary niche is **실용 신박템**: products with an unexpected mechanism that solve a visible everyday problem and can be demonstrated quickly. Novelty alone is not enough.

## Current phase

Phase 2E adds a strictly read-only research boundary before any real source is connected.

The repository now contains:

- fixed six-agent orchestra
- detailed prompts and schemas
- provider-neutral replay runtime and strict tool broker
- practical-novelty scoring
- versioned content-addressed evidence/artifact store
- hash-chained run events and stale-artifact detection
- source-record policy and schemas
- deterministic fixture research adapter
- candidate normalization across observation and listing records
- evidence dependency index

No live model, Threads/product/affiliate search, retailer API, or publication is connected. Fixture URLs, products, prices, sellers, stock, and signals are synthetic.

## Fixed agents

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no price agent. Commerce facts belong to Evidence Verifier.

## Research boundary

```text
read-only source adapter
  ↓
validated source records
  ↓
content-addressed storage
  ↓
Scout candidate evidence
  ↓
Verifier exact-product and commerce checks
```

Only Scout and Verifier have research tools. Writer, Strategist, Guardian, and Orchestrator cannot use Scout search tools outside their own allowlists.

## Commands

```bash
npm run verify
npm run research:fixture
npm run orchestra:simulate
npm run orchestra:replay
npm run orchestra:store
npm start
```

## Key Phase 2E files

- `research-policy.mjs` — network, mutation, schemes, source types, retention, and privacy rules
- `source-records.mjs` — sanitized, hashed source records
- `fixture-research-adapter.mjs` — deterministic read-only fixture source
- `research-tools.mjs` — handlers matching Scout/Verifier allowlists
- `candidate-evidence.mjs` — cross-source product grouping and readiness
- `dependency-index.mjs` — evidence-to-artifact invalidation relationships
- `fixture-research-pipeline.mjs` — research, persistence, and audit flow

## Next blocked gate

The next step would be a **live read-only public-source adapter**, but it is intentionally blocked pending a source-by-source review of official access, terms, robots, rate limits, privacy, retention, media rights, and recency. External publishing remains a later separate approval decision.
