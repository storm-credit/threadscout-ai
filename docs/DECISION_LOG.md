# Decision Log

## 2026-08-08 — Repository working name

### Decision

Use `threadscout-ai` as the repository name and `ThreadScout AI` as the product name.

### Reason

The name describes the initial core function—scouting worthwhile Threads product topics—without tying the project permanently to one affiliate network.

### Remaining risk

Name availability and trademark/domain suitability have not been assessed.

---

## 2026-08-08 — Approval-first B+C hybrid

### Original possibilities

A sheet workflow, a personal approval dashboard, a discovery-and-learning dashboard, or a multi-agent SaaS.

### Decision

Use the personal dashboard's integrity and approval model, then add the discovery-and-learning pipeline incrementally.

### Reason

The user's hardest problem is choosing products, but automated discovery should not be built before the truth, identity, rights, and approval model is reliable.

### Impact

The first implementation will use manual or fixture candidates before connecting external discovery and publishing APIs.

### Remaining risk

The final discovery sources and official API permissions are not yet verified.

---

## 2026-08-08 — Phase 1 local-first implementation

### Original plan

Complete the user interview before any implementation.

### Change

Proceed with a reversible local prototype using the recommended defaults already present in the conversation and record them in `docs/ASSUMPTIONS.md`.

### Reason

The user explicitly requested automatic continuation. The prototype does not make external posts, spend money, or require credentials, so unanswered integration decisions do not create irreversible risk.

### Impact

Phase 1 implements the approval state machine, five fixture candidates, four draft angles, integrity checks, mobile UI, local persistence, and a local-only queue. Threads API and automated discovery remain blocked.

### Remaining risks

Content niche, 30-day business targets, exact disclosure wording, and final API permissions still require validation before live use.

---

## 2026-08-08 — Bootstrap committed directly to `main`

### Original workflow

Feature work should use a branch and pull request.

### What happened

The initial constitution, documentation skeleton, templates, and status markers were committed directly to the newly created empty repository before the branching rule was established.

### Reason

The repository required a usable baseline before a feature branch could be created through the connected GitHub tools.

### Impact

The bootstrap history contains several small commits. All subsequent implementation work is isolated on `feat/phase1-draft-workspace` and reviewed through a pull request.

### Remaining risk

No runtime feature was placed on `main`; the impact is limited to noisier initial history.
