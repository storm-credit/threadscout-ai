# Architecture

## Direction

Approval-first application using a fixed six-agent orchestra, provider-neutral runtime, versioned evidence store, and explicit read-only research boundary.

```text
Read-only source adapter
      ↓
Validated source records
      ↓
Content-addressed source store
      ↓
Product Scout candidate evidence
      ↓
Evidence Verifier exact-product package
      ↓
Strategist → Writer → Guardian
      ↓
Versioned artifacts + hash-chained events
      ↓
Explicit human approval → local-only scheduler
```

Only Orchestrator delegates. Specialists return artifacts to Orchestrator and cannot publish.

## Fixed layers

### Six-agent registry

Exactly six roles with narrow missions, tool allowlists, forbidden actions, and stop conditions. There is no price agent. Scheduler, publisher adapter, metrics collector, and audit log are deterministic services.

### Prompt, schema, and state machine

Each agent has one system prompt and one output schema. Outputs pass schema and semantic validation. The state machine owns stage order, bounded revisions, Guardian gate, human gate, and local queue.

### Provider-neutral runtime and tool broker

The current provider is deterministic replay. Every invocation has budgets and receipts. Every tool call is checked against the registry. Publication, purchase, payment, and equivalent tools are rejected.

### Versioned evidence store

Canonical SHA-256 hashes cover roster, prompts, schemas, evidence, parents, and artifacts. Sources and artifacts are content addressed. Per-run JSONL events are sequential and previous-hash chained. One-process write serialization is not a distributed transaction guarantee.

## Phase 2E research boundary

### Research policy

The fixture policy fixes:

- `networkAllowed=false`
- `mutationAllowed=false`
- only `fixture:` schemes
- approved source types only
- maximum result and excerpt sizes
- no personal data
- no raw payload storage
- explicit retention, rights, observed time, and retrieved time

### Source records

A source record contains version, ID, type, URL, title, sanitized excerpt, timestamps, synthetic/network flags, policy ID, rights state, retention class, redaction state, product mentions, purchase signals, optional commerce metadata, and content hash.

### Role separation

Product Scout may use `public_search`, `topic_search`, `trend_lookup`, and `candidate_normalization` through the broker.

Evidence Verifier may use official/listing lookup, cross-source checks, rights checks, and commerce snapshots.

Writer cannot browse for new facts. Strategist and Guardian read verified evidence rather than discovering new sources.

### Candidate evidence

Mentions are grouped by normalized brand, model, variant, and product name. Exact-match readiness requires a listing, complete identity hints, at least two records, and at least two source types. Scout readiness remains a proposal; Verifier owns the final exact-match decision.

### Dependency index

Artifact-save events record parent and evidence hashes. The index can find artifacts directly linked to an evidence version and recursively collect dependent descendants for invalidation.

## Live-source gate

No live adapter is enabled. Each future source requires separate review of official access, terms, robots, rate limits, permissions, privacy, retention, rights, recency, citations, failure behavior, and revocation.

## Next implementation order

1. Select one candidate live source only after public-policy research
2. Add source-specific adapter contract tests without credentials
3. Add partial-line recovery and SQLite migration interface
4. Add claim-to-source indexes in the dashboard
5. Evaluate a live model provider separately
6. Keep publishing disabled until a later explicit gate
