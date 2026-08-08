# Decision Log

## 2026-08-08 — Repository working name

Use `threadscout-ai` and `ThreadScout AI`.

---

## 2026-08-08 — Approval-first B+C hybrid

Use a personal approval dashboard first, then add discovery and learning. Truth, identity, rights, and approval precede automation.

---

## 2026-08-08 — Phase 1 local-first implementation

Proceed with reversible local behavior because automatic continuation was requested. No credentials, cost, or irreversible external action were introduced.

---

## 2026-08-08 — Fix the orchestra at six total agents

The fixed roster is Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian. Price is evidence owned by Verifier, not an agent.

---

## 2026-08-08 — Use a framework-neutral orchestrator first

Keep registry, artifacts, routing, loops, and human approval independent of a heavy framework.

---

## 2026-08-08 — Select practical demonstrable novel items

Four options were compared: viral gimmicks, practical demonstrations, ultra-low-price novelty, and parenting novelty. Select practical demonstration-first novel items. Problem clarity, demonstration, and utility receive 60% of the score.

---

## 2026-08-08 — Add prompts, schemas, and synthetic fixture before live models

Create six prompts, six schemas, and a deterministic fixture so failures are reproducible before paid calls.

---

## 2026-08-08 — Select a provider-neutral runtime adapter

### Options

1. direct provider calls inside each agent
2. provider-neutral adapter
3. full agent framework immediately
4. durable job/workflow infrastructure immediately

### Decision

Select option 2. Add a common runtime that receives fixed prompt, schema, agent ID, run ID, and structured input. It returns one validated artifact and one invocation receipt.

### First provider

Use a deterministic `replay` provider. Do not connect a live model yet.

### Reason

Direct calls duplicate retry, budget, audit, and schema behavior. A full framework or durable queue is premature. Replay tests the same boundary without credentials, cost, or non-determinism.

### Impact

- runtime budgets are defined for exactly six agents
- malformed or oversized outputs fail before state progression
- every invocation produces a receipt
- a strict tool broker enforces registry allowlists
- publication, purchase, and payment tools are blocked
- future providers must fit the contract rather than changing the orchestra

### Remaining risks

- character budgets are not provider token/cost budgets
- timeout cancellation semantics differ by provider
- prompt and schema version hashes are not yet persisted
- replay cannot expose all live model failure modes
- live SDK runtime requirements may require a separate Node version decision
