# Decision Log

## 2026-08-08 — Repository working name

Use `threadscout-ai` and `ThreadScout AI`.

---

## 2026-08-08 — Approval-first B+C hybrid

Use a personal approval dashboard first, then add discovery and learning. Truth, identity, rights, Guardian review, and human approval precede automation.

---

## 2026-08-08 — Fixed six-agent orchestra

The roster is Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian. Price is Verifier evidence, not an agent.

---

## 2026-08-08 — Practical demonstrable novel items

Four niche options were compared. Select 실용 시연형 신박템. Problem clarity, demonstration, and practical utility receive 60% of the score.

---

## 2026-08-08 — Prompt/schema fixture before live models

Create six prompts, six schemas, and a deterministic full-run fixture before any paid or nondeterministic model call.

---

## 2026-08-08 — Provider-neutral replay runtime

Four runtime options were compared. Select a small provider-neutral interface and replay provider. Add per-agent budgets, receipts, schema validation, and a strict tool broker. Defer live SDK and durable workflow infrastructure.

---

## 2026-08-08 — Content-addressed JSONL evidence store

### Options considered

1. in-memory only
2. content-addressed objects plus per-run JSONL event chain
3. SQLite
4. managed PostgreSQL/object storage

### Decision

Select option 2 for Phase 2D.

### Reason

The project needs reproducible version and invalidation contracts before it needs production infrastructure. This design is dependency-free, inspectable, and testable without credentials or cost.

### Impact

- roster, prompt, schema, evidence, parent, and artifact hashes are recorded
- artifacts can be detected as stale after evidence or configuration changes
- sources/artifacts are immutable content-addressed objects
- run actions are append-only and hash chained
- the replay executor can persist six artifacts, model invocation metadata, human decision, failure, and local queue events

### Boundary

Per-run writes are serialized only inside one process. Multi-process workers require SQLite or another transactional backend.

### Remaining risks

- partial-line crash recovery is not implemented
- retention, redaction, deletion, export, and garbage collection are not implemented
- hash consistency does not establish factual truth
- dependency invalidation is evaluated but not yet indexed across all stored runs
