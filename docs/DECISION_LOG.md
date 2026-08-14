# Decision Log

## 2026-08-08 — Repository working name

Use `threadscout-ai` and `ThreadScout AI`.

---

## 2026-08-08 — Approval-first B+C hybrid

Use a personal approval dashboard first, then discovery and learning. Truth, exact identity, rights, Guardian review, and human approval precede automation.

---

## 2026-08-08 — Fixed six-agent orchestra

Use Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian. Price is Verifier evidence, not an agent.

---

## 2026-08-08 — Practical demonstrable novel items

Select 실용 시연형 신박템 after comparing four niche options. Problem clarity, demonstration, and utility receive 60% of the score.

---

## 2026-08-08 — Provider-neutral replay runtime

Select a provider-neutral interface and deterministic replay after four runtime options. Add budgets, receipts, schema checks, and strict tool brokerage before live models.

---

## 2026-08-08 — Content-addressed JSONL evidence store

Select local content-addressed objects and per-run hash-chained JSONL after comparing in-memory, JSONL, SQLite, and managed database options.

---

## 2026-08-08 — Read-only fixture research before live sources

Select a fixture-first read-only adapter contract after four options. Prove source policy, privacy, provenance, rights, timestamps, role boundaries, normalization, persistence, and invalidation before live data.

---

## 2026-08-08 — Prepare Threads + NAVER source stack without activation

Future source stack: Threads as primary discovery, NAVER API HUB trends as Korean corroboration, manual references as fallback; Google Trends alpha deferred and Coupang Seller Open API rejected for general affiliate discovery. Keep every network source disabled until account-specific approval.

---

## 2026-08-12 — Freeze implementation and establish canonical Master Spec

### Original state

Prototype implementation had progressed through agent orchestration, replay, evidence storage, fixture research, and disabled live-source readiness. Design information was spread across phase documents, code contracts, and discussion.

### Problem

There was no single authoritative end-to-end product/system specification covering media discovery, celebrity/broadcast issue triggers, exact product matching, affiliate mapping, publishing reconciliation, analytics learning, and explicit handoffs.

### Decision

Freeze runtime/product code and create `docs/spec/` as the canonical design baseline before further implementation.

### Added design domains

- Master Product & System Specification
- Product Requirements and User Flows
- Fixed Agent Contracts and Handoffs
- Canonical Data Model
- Source Strategy
- Photo/Video Media Pipeline
- Celebrity/Broadcast/Trend Issue Pipeline
- Exact Product Matching
- Content Strategy
- Affiliate Mapping/Disclosure
- Publishing/Reconciliation
- Analytics/Learning
- Safety/Privacy/Compliance
- Traceability Matrix
- Acceptance Tests
- Design Freeze/Open Questions
- Prototype Gap Analysis

### Public-figure decision

Celebrity/public-figure/broadcast issues are permitted only as public, product-relevant discovery triggers. The system must not become a rumor/private-life account. Product identity, endorsement relationship, media rights, and affiliate destination remain separately verified facts.

### Impact

Existing code is treated as prototype evidence rather than authority. No runtime/product code changes occur during this design cycle. After design approval, implementation tasks must be created from the traceability/gap analysis rather than ad-hoc coding.

### Remaining risks

P0 account-specific questions remain around Threads permissions, authorized product/listing evidence, affiliate network rules, deployment/secret storage, and current media/platform rules. These are explicitly listed in `docs/spec/DESIGN_FREEZE.md` and are not guessed.

---

## 2026-08-12 — Select Opportunity Inbox first-screen design

### Four options

1. chronological feed
2. numeric scoreboard
3. kanban operations board
4. opportunity inbox with five decision cards

### Decision

Select Option 4 for mobile daily operation. Kanban may remain a later desktop operations view.

### Reason

The user needs to decide quickly what is worth inspecting today while seeing why-now, reader value, evidence readiness, risk, media state, and next safe action together.

### Guardrail

A high opportunity score never enables an action that evidence or risk gates block.

---

## 2026-08-12 — Separate ranking from readiness and risk

### Four options

1. one 100-point score
2. opportunity score plus independent readiness/risk/freshness
3. rule tiers only
4. learned ranking model

### Decision

Select Option 2. Keep rule tiers as supporting operational labels and defer learned ranking.

### Reason

One score creates false confidence. Viral or high-intent candidates can still have unresolved identity, rights, or rumor risk.

### Impact

Every candidate exposes:

- opportunity score
- evidence readiness
- risk level
- freshness state

These may disagree by design.

---

## 2026-08-12 — Public-figure issue content is a product trigger, not a gossip lane

### Decision

Use public celebrity, broadcast, sports, event, and cultural moments only when they create a verifiable product-relevant signal.

### Source model

- issue source grades G0–G4
- product relation grades R0–R5
- rumor/private-life grade is blocked
- source reliability, product relation, product identity, and media rights remain separate axes

### Reason

This preserves timely product discovery without turning ThreadScout into a rumor account or allowing celebrity attention to bypass evidence.

---

## 2026-08-12 — Separate media discovery from publication rights

### Decision

A photo/video may be valid as an internal discovery reference while remaining unusable in the final post.

### Preferred publication fallback

`user-owned/original > licensed commercial asset > permitted embed/link > text-only > hold`

Third-party download-and-reupload is not an MVP path.

### Impact

Media records track analyze/store/link/embed/transform/republish/commercial-use permissions independently.

---

## 2026-08-12 — Design three daily planning windows without forcing three posts

### Decision

Support morning, midday, and evening review windows as an operating model. Treat three daily slots as planning capacity, not a posting quota.

### Reason

The product should reduce decision fatigue and may legitimately return fewer recommendations or no publishable candidate when evidence is weak.

### Guardrail

`오늘 추천 없음` is valid. The system must not lower truth or media-rights standards to fill a schedule.

---

## 2026-08-12 — Specify future design-focused GitHub Actions without changing workflow

### Decision

Keep the current workflow untouched during design freeze, but define future jobs for:

- documentation-only scope
- design authority completeness
- traceability
- open P0/P1 gates
- design consistency
- prototype regression

### Reason

The current Actions green check proves the existing validation/prototype suite passes. It does not prove the new design has been approved or implemented.

---

## 2026-08-14 — Strengthen the project work constitution before implementation

### Context

The approved Master Design defines what ThreadScout should be, but future coding agents also need an explicit repeatable method for how to work. The owner wants the repository itself to preserve this method so a Claude/Codex/other coding session can recover it from GitHub without relying on conversational memory.

### Decision

Strengthen `CLAUDE.md` with four implementation-workflow gates:

1. **Interview Gate** — context dump first, then ask only unresolved high-impact questions; do not re-ask known answers.
2. **Reference-first Gate** — before substantial implementation, review relevant GitHub/official/product examples and record what is adopted, rejected, and why; do not cargo-cult or copy without license review.
3. **Meta-prompt Lifecycle** — context dump → missing-context questions → success/stop conditions → execution-environment conversion → failure classification → prompt reduction → result review.
4. **Completion Proof Gate** — automated tests alone never prove completion; verify end-to-end behavior, mobile/desktop UI where applicable, buttons/forms/CTAs, state transitions, errors/staleness, diff, blind spots/traps, Actions, and original success criteria.

### Supporting rules

- Four-option review applies to major decisions and must compare materially different approaches rather than cosmetic variants.
- Plan deviation records preserve original plan, mismatch point, reason, impact, affected requirements/tests, and residual risk.
- GitHub is the persistent project handoff surface: substantial work uses task branches, meaningful commits, PR/diff/Actions verification, and never stores secrets or unnecessary third-party raw media.

### Impact

This changes project execution governance, not the approved product behavior or six-agent architecture. Future coding agents should be able to read `CLAUDE.md` and reconstruct both the product authority and the required work method before implementation begins.

---

## 2026-08-14 — Select the implementation structure for Slice 1

### Context

Master Design v1 is approved and implementation may resume through the `DESIGN_FREEZE.md` gate. The owner selected the first vertical slice: manual product entry → Evidence Verifier → Opportunity Inbox → four strategies → four drafts → Guardian → human approve/hold/reject.

A gap review against the prototype found the decisive problem: all product state lives in `localStorage` and the UI never calls the six-agent runtime. That violates `PLATFORM_DECISION.md` D-02, blind spot BS-06, and acceptance AT-35, and it makes the slice's core requirements untestable.

### Four options

| Option | State authority | Storage | Runtime deps | D-02 / AT-35 | Path to P0-04 managed PostgreSQL |
|---|---|---|---|---|---|
| A. Extend the client prototype | `localStorage` | browser | 0 | **violated** | none |
| B. Server-authoritative, thin | Node HTTP server | orchestrator calls the JSONL store directly | 0 | satisfied | requires rewrite |
| C. Framework full stack | Fastify/Next + SQL | DB schema + migrations | many, plus a build step | satisfied | already close |
| D. Domain core behind storage ports | Node HTTP server | port interface; in-memory and JSONL adapters | 0 | satisfied | isolated to one adapter |

### Decision

Select **Option D**: a pure domain core with explicit storage ports, a thin zero-dependency Node HTTP API as the only state authority, in-memory and JSONL adapters, and a vanilla mobile-first client.

### Reason

- Option A is the cheapest and was rejected first: it reproduces the exact defect the slice exists to fix. Keeping browser-owned state would let the acceptance tests pass while the requirement fails.
- Option C matches the `P0-04` target architecture class, but it opens the deployment, migration, and secret-injection surface now, while `P0-05` (production credential storage) is still a deferred activation gate. Widening the secret surface of a public repository before that gate is resolved is the wrong order (BS-51). It remains the right choice for a later slice.
- Between B and D the difference is real, not cosmetic. B couples stage transitions to the JSONL file layout; D puts them behind ports. D wins on three counts: an in-memory adapter makes staleness, version-conflict, double-submit, and cross-session tests deterministic and fast; the eventual PostgreSQL move is contained in one adapter instead of the orchestrator; and `SYSTEM_ARCHITECTURE.md`'s required split between mutable operational records and immutable versioned records becomes a structural boundary rather than a convention.
- D preserves the repository's existing idiom — zero dependencies, ESM, `node:test`, `.threadscout-data/` outside Git — so CI stays fast and the diff stays reviewable.

### Supporting decisions

- **Agent execution: deterministic replay only.** No model provider, no network, no API key. The existing provider-neutral replay runtime supplies budgets, receipts, timeouts, and schema validation. Consequence recorded openly: with rule-based agents, "four angles are not paraphrases" (AT-06) is proven by a distinctness gate plus a negative fixture, not by model output quality.
- **Slice ends at the human decision.** Approve/hold/reject is the terminal state. The local schedule queue, preflight, and suppression screens are later slices.
- **Local single process.** No Docker, no hosting, no deployment configuration. Multi-process transactional locking stays an open trap rather than a claimed solution.
- **User-supplied links are not fetched.** A commercial destination URL is stored as string evidence only. Fetching it would activate a live source, which `P0-02` and `DESIGN_FREEZE.md` keep disabled. Identity therefore comes from owner-entered evidence or stays `unresolved`.

### Guardrails

- The client sends intent, never authoritative state. No request may set match state, evidence readiness, Guardian outcome, or approval validity.
- Approval binding hashes are computed from server-held artifacts. A client-supplied hash is only a claim to be compared, never a value to be stored.
- No configuration value may enable external publishing, live sources, or affiliate posting in this slice.

### Impact

`packages/core` and `apps/web` are largely replaced; `packages/orchestra` is extended rather than rewritten; `docs/spec/` is not modified, because design authority is not what this slice changes.

### Remaining risks

- Deterministic agents cannot demonstrate real Korean copy quality. The slice proves the pipeline and its gates, not writing quality.
- Single-process file storage is adequate for one owner and is explicitly not adequate for concurrent workers; this stays recorded as an open trap.
- `P0-04` and `P0-05` remain unresolved, so nothing here claims deployment readiness.
