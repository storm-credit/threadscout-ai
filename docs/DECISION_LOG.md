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

The bootstrap history contains several small commits. All subsequent implementation work is isolated on feature branches and reviewed through pull requests.

### Remaining risk

No runtime feature was placed on `main`; the impact is limited to noisier initial history.

---

## 2026-08-08 — Fix the orchestra at six total agents

### Clarification

The request was for role-specific agents, not a separate price agent.

### Decision

Fix the total roster at six, including the Orchestrator:

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

### Price responsibility

Do not create a price agent. The Evidence Verifier owns timestamped price, stock, seller, quantity, and product-variant evidence together with exact product identity.

### Reason

Price alone cannot determine whether a product should be recommended. Separating it would fragment exact-product verification and create conflicting snapshots. Six roles are enough to isolate coordination, discovery, evidence, strategy, writing, and final integrity risks.

### Impact

- agent count is enforced by code and tests
- only the Orchestrator delegates
- specialists return structured artifacts
- scheduler, publisher, metrics, and audit remain deterministic services
- agent creation becomes an architecture change requiring user approval

### Remaining risks

- model and runtime provider are not selected
- live agent cost and latency are unknown until model calls are introduced
- the fixed roster may require role-boundary tuning after real runs, but count changes remain prohibited without explicit review

---

## 2026-08-08 — Use a framework-neutral orchestrator first

### Options researched

LangGraph, CrewAI, OpenAI Agents SDK JS, and Microsoft AutoGen.

### Decision

Implement the registry, structured artifacts, deterministic routing, bounded loops, and human approval without adding an orchestration framework dependency.

### Reason

- CrewAI is Python-first while this repository is JavaScript.
- AutoGen is in maintenance mode and points new users to Microsoft Agent Framework.
- OpenAI Agents SDK JS is a strong future candidate but currently requires Node.js 22 or later; this project supports Node.js 20.
- LangGraph-style durable execution is useful later, but current local runs do not yet justify the dependency.

### Impact

The contracts are portable. A future runtime adapter may be evaluated without changing the six roles or their artifact boundaries.

### Remaining risk

The custom state machine must remain small. If durable cross-process execution becomes necessary, a framework migration should be reconsidered through four options.
