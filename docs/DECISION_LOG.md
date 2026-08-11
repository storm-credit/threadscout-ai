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
