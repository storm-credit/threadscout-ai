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

## 2026-08-15 — Finalize Harness Design before coding

### Context

Master Design v1 is complete, while the repository still contains executable Phase2A–2F prototype harness assets (`simulate`, `replay`, evidence store, fixture research, readiness checks). Those assets are useful but predate the approved contracts. Calling them the final harness would confuse “executable prototype” with “Master-Design-compliant executable specification.”

### Four options reviewed

1. rewrite the harness from scratch
2. patch existing scripts independently
3. wrap/adapt existing runtime behind one contract-first Master Design harness
4. validate against live providers first

### Decision

Select **Option 3: contract-first harness around existing runtime**.

Preserve provider-neutral runtime, replay, tool brokerage, versioned evidence, fixture research, disabled live adapters, and regression assets where useful. Upgrade them behind canonical routing, handoff, stale/review-binding, fixture, and AT-report semantics.

### Harness authority added

- `docs/spec/HARNESS_BLUEPRINT.md`
- `docs/spec/HARNESS_ACCEPTANCE_MATRIX.md`
- refreshed `docs/spec/IMPLEMENTATION_GAP_ANALYSIS.md`
- `docs/spec/CODING_SPIKE_ENTRY.md`

### Prototype classification

Existing implementation is now explicitly classified as `KEEP / MODIFY / RETIRE / MISSING` rather than vaguely “old code.” RETIRE is not permission to delete; replacement behavior and regression coverage must exist first.

### First Coding Spike

The first future code experiment is a no-network manual-product contract spine:

`owner-supplied fixture → Verifier → Strategist(4) → Writer(4) → Guardian → human-decision domain binding → material mutation → stale approval rejection`.

Scout is skipped only under the explicit-owner-product routing rule; the six-agent roster remains unchanged.

### Why this comes before the C vertical slice

The spike isolates the riskiest migration question — whether legacy orchestration/store/contracts can enforce Master Design revision/authority semantics without a rewrite — before browser/UI and external provider complexity are added.

### Live boundary

No live Threads, Coupang, paid model requirement, public posting, automated product search, or third-party media republication is needed for Harness Design or Spike 0.

### Final status after this decision

`Master Design COMPLETE / Harness Design COMPLETE / legacy prototype harness executable / Master-Design harness not yet implemented / Coding Spike READY but not started`.

Coding still requires a separate explicit owner instruction.

---

## 2026-08-15 — Implement and verify Coding Spike 0

### Context

After Harness Design v1 was merged, the owner explicitly authorized implementation. The goal was to answer one bounded technical question before any UI/live work: can the existing six-agent runtime enforce Master Design authority, revision binding, stale invalidation, budgets, receipts, and deterministic acceptance reporting without a rewrite?

### Implementation-shape decision

Repository inspection confirmed the existing `orchestrator`, replay runtime, versioning, dependency, simulation, and fixture assets were reusable. The four implementation shapes were rechecked and **Option 3 — adapt existing runtime behind a canonical harness contract — remained selected**.

Reference review recorded in `docs/implementation/SPIKE0_REFERENCE_REVIEW.md` used upstream LangGraph, Temporal TypeScript SDK, and OpenAI Agents JS only for state/replay/traceability patterns. No framework or dependency was imported.

### Implemented contract spine

`packages/orchestra/src/master-harness.mjs` adds deterministic fixture execution and acceptance reporting for:

- F01 owner-supplied exact product
- F02 conflicting model
- F04 high-score unresolved candidate
- F11 approval followed by material mutation
- F12 budget exhaustion
- F13 unsupported endorsement wording
- F15 fake first-hand wording without UsageRecord
- F20 repeated unsupported fact
- F21 stale cross-revision decision

The harness reuses the fixed six-agent roster, permits Scout skip only for the owner-supplied route, binds downstream facts to Verifier evidence, requires four strategies and four mapped drafts, records version/lineage refs, binds human approval to a material revision, and rejects stale compare-and-set decisions.

### Deviation found during verification

**Original plan:** reuse replay-runtime receipts unchanged.

**Mismatch:** F12 showed that a run-level invocation budget rejection occurred before the existing runtime wrote a receipt. The attempt was correctly blocked but was not auditable, violating AT-18 and the Harness Blueprint receipt invariant.

**Change:** `model-runtime.mjs` now records a failure receipt before throwing for preflight attempt/run/elapsed/input-budget rejection and missing replay handler.

**Impact:** observability only within the approved change surface. No provider, network capability, agent authority, product behavior, or dependency was added.

**Residual risk:** later provider-specific runtimes must implement the same rejected-attempt receipt guarantee; Spike 0 proves it only for deterministic replay.

### Verification result

The required Spike 0 acceptance set passed:

`AT-04, AT-06, AT-07, AT-08, AT-09, AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-23, AT-25, AT-36, AT-38, AT-39, AT-41`.

GitHub Actions Run #138 passed with 69 tests, 0 failures, the full `npm run verify` chain, deterministic `harness:spike0`, and all legacy simulation/replay/store/research checks green.

### Decision / next boundary

Spike 0 is successful. The existing runtime can be adapted to the Master Design contract spine without a rewrite. This **does not** mean the full AT-01~44 harness, mobile UI, or live integrations are complete.

The next bounded slice is the manual-product C vertical slice. Live Threads/Coupang/public posting and third-party media reuse remain disabled until separate activation work.
---

## 2026-08-18 — Deepen the manual slice to the approved product contracts

### Context

Two implementation efforts ran against this repository in parallel. PRs #11–#14 landed the manual-product vertical slice with server-authoritative state, CAS, idempotency, orchestration receipts, interprocess locking, and duplicate guardrails. A separate effort built the same slice from the design contracts and produced a gap review.

Rather than choose one and discard the other, the owner directed that the second effort be reworked on top of the merged implementation, keeping what main already proved and adding only what the approved design requires and main did not yet have.

### Gap that was closed

1. **Only two match states existed.** `exact` and `unresolved`. `PRODUCT_MATCHING.md` section 2 makes four states first-class, and the two missing ones — `likely` and `substitute` — are exactly the commercially dangerous middle ground. AT-10 was unimplementable without them.
2. **`exact` could be reached from a single reference.** Section 4 requires a strong identity source *plus* corroboration. Independence is now counted by declared origin, so two references from one origin remain one piece of evidence (AT-40, BS-15).
3. **No verifier decision.** `AGENT_HANDOFFS.md` H4 gates the Strategist on `verified / limited / hold / reject`. Gating on the readiness label instead conflated a ranking output with a factual conclusion.
4. **Guardian findings were all revisable.** A fabricated first-hand claim and an unsupported endorsement are non-overridable under `SAFETY_COMPLIANCE.md` and AT-08. They now block, and the eight named checks from `AGENT_CONTRACTS.md` section 6 are reported individually.
5. **Ranking was ad hoc, and selection was a sort.** Scoring now follows the A–G buckets, readiness / risk / freshness are independent, and first-screen selection states a reason for every inclusion and exclusion, with `오늘 추천 없음` as a valid outcome (AT-28, AT-29).

### Deliberate behaviour changes

Two existing tests encoded behaviour the design contradicts, and were changed rather than worked around:

- a single owner reference no longer yields `exact`; the fixtures now corroborate from a second origin, which is what the spec always required;
- a fabricated first-hand claim now returns `block` rather than `revise`, and the test additionally proves the owner cannot approve past it.

### Judgement calls recorded

- **The review floor does not apply to owner-supplied candidates.** The floor exists to stop weak *discovered* candidates from filling the inbox. A product the owner typed in was already chosen deliberately, and scoring it out of its own inbox hid the thing they had just asked to work on.
- **Lane concentration caps apply only when another lane is waiting.** The main lane is ~60% of the intended portfolio; capping it with nothing else to promote shortened the inbox for no benefit.

### Defects found and fixed during verification

- **Any request outside `/apps/web/` crashed the server.** `serveStatic` was returned without `await`, so its rejection escaped the handler's try/catch and became an unhandled rejection. A browser requesting `/favicon.ico` was enough to end the process.
- **A clean checkout could not start.** The write lock was taken before its directory existed, so `initialize()` failed on the first request.
- Two Korean detectors flagged the very disclaimers the rules require: "같은 제품이 아니라 비슷한 제품" and "직접 써본 기록이 없다면". Negations are now stripped before the claim checks run.

### Impact

`docs/spec/` and `CLAUDE.md` are unchanged; this closes implementation gaps against the existing design authority rather than altering it.

### Remaining risks

Single process only; multi-process locking is bounded to one host and remains an open trap. Agents remain deterministic, so the slice proves the pipeline and its gates, not Korean writing quality. Live sources, publishing, and affiliate posting stay disabled.
