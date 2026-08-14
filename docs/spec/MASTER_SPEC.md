# ThreadScout AI — Master Product & System Specification v1

Status: **DESIGN APPROVED — canonical baseline for the next implementation cycle.**

Implementation remains frozen until a new implementation task explicitly names this baseline and selects a bounded slice. Live integrations remain disabled until their activation gates pass.

## Product purpose

ThreadScout AI is a Korean, mobile-first, approval-first operating system for discovering products worth discussing on Threads, proving what is true about them, creating useful content, and learning from results without turning the account into spam or gossip.

The system is not a generic trend scraper. It must connect a topic to concrete reader value and a verifiable product, or explicitly decide that no product should be attached.

## Primary outcomes

The owner should quickly answer:

1. what is worth posting today
2. why it is interesting now
3. what is actually verified
4. what may safely be claimed or shown
5. which of four approaches best serves the reader
6. whether the draft should be approved, held, rejected, or suppressed
7. whether a scheduled item is still valid immediately before dispatch
8. what was learned after publication without rewarding unsafe patterns

## v1 platform

ThreadScout v1 is a **mobile-first responsive web application**.

- phone browser is the primary recurring review surface
- desktop is supported for evidence-heavy research and configuration
- PWA capability is optional enhancement and never correctness authority
- native iOS/Android applications are outside MVP and require an evidence-based revisit
- durable state, scheduling, freshness, publication, approval bindings, and audit are server-authoritative

The selected platform and revisit rules are defined in `PLATFORM_OPTIONS.md` and `PLATFORM_DECISION.md`.

## Content lanes

Starting portfolio guardrails:

- practical novel/useful items: about 60%
- family / elementary-school household items: about 20%
- travel / desk / storage: about 15%
- curiosity-only: no more than about 5%
- issue-triggered product discovery: a trigger source only when the product connection is verifiable and useful

These are starting portfolio controls, not permanent ranking law.

## Fixed six-agent orchestra

Exactly six agents exist:

1. Orchestrator
2. Product Scout
3. Evidence Verifier
4. Content Strategist
5. Threads Writer
6. Integrity Guardian

There is no price agent. Price, seller, stock, quantity, variant, destination identity, and freshness are volatile commerce evidence owned by Evidence Verifier and deterministic commerce services.

Agreement among multiple agents does not create factual confidence. The Verifier evidence packet is the factual authority passed downstream.

## Deterministic services

Source adapters, evidence store, media registry, scheduler, publisher adapter, metrics collector, audit/event log, duplicate detector, affiliate mapper, state machine, configuration store, secret boundary, and version/conflict controls remain deterministic services.

Agents never receive a direct payment or publishing tool.

## Canonical flow

```text
Owner/account goals
→ Orchestrator
→ discovery inputs
→ Product Scout
→ Evidence Verifier
→ candidate decision
→ Content Strategist (4 angles)
→ Threads Writer (4 drafts)
→ Integrity Guardian
→ human approval bound to exact revisions
→ schedule/preflight
→ publish/reconcile
→ metrics/learning
```

The Orchestrator may skip Scout when the owner supplies a concrete product, but Verifier, Guardian, and human approval cannot be skipped for a publishable item.

## Discovery model

Potential signals may come from practical product discovery, authorized Threads keyword/public-post discovery, user-supplied links, public broadcast/event context, trend/search signals, and permitted commerce evidence.

Celebrity/public-figure attention is not a content lane by itself. Rumor/private-life content is blocked. A public appearance/use signal may create a product hypothesis but never automatically proves exact identity, endorsement, sponsorship, or final-use media rights.

## Core truth rules

Issue source reliability, public-figure relationship, exact product identity, publication media state, commercial mapping, source independence, and freshness are independent axes. A strong signal on one axis cannot compensate for a blocker on another.

Finding a photo/video and being allowed to use it in a final post are separate facts. Final media preference is:

1. user-owned media
2. permission-confirmed/licensed media
3. explicitly permitted native link/embed treatment
4. text-only treatment
5. hold/block

Public visibility alone is never republication permission.

Product state is `exact`, `likely`, `substitute`, or `unresolved`. A commercial destination may be described as the same product only at `exact`; a substitute must be labeled as an alternative.

First-hand wording requires a usage record. Research does not become personal experience through rewriting.

## Ranking and daily selection

Every candidate exposes separately:

- opportunity score
- evidence readiness
- risk level
- freshness
- suppression state
- publication-media feasibility

The final five are not simply the five highest scores. Portfolio selection also considers blockers, verification workload, repetition, lane concentration, issue concentration, source independence, and media feasibility.

Initial review score floor is 65/100 as a heuristic only. It cannot override evidence, rights, safety, freshness, or suppression gates.

A day may produce 0–3 posts. `오늘 추천 없음` is a valid successful outcome.

## Content output

Each verified candidate produces four genuinely distinct reader jobs:

1. problem → practical result
2. curiosity / demonstration
3. comparison / decision support
4. limitation / best-fit audience

The Strategist creates four distinct briefs; the Writer creates one draft per brief. Four paraphrases of one argument are invalid output.

## Approval gates

A draft reaches human approval only when:

- required evidence is current
- exact/alternative wording is correct
- public-figure relation wording is within verified bounds
- publication media state is valid
- affiliate/disclosure state is resolved for the intended commercial action
- first-hand wording matches an actual usage record
- Guardian returns a non-blocking result
- the candidate is not suppressed

Human approval binds the exact draft, evidence, media, commercial mapping, and relevant configuration revisions. A material upstream change makes that approval stale.

Cross-device stale approvals are rejected rather than silently accepted.

## Publishing model

Scheduling and dispatch run on server/background workers, never browser/PWA lifecycle.

Before dispatch, preflight rechecks applicable volatile facts, authorization, product destination, disclosure state, media rights, issue freshness, and approval binding.

A timeout with unknown remote outcome enters `unknown_remote_state`. The system reconciles before any retry. Duplicate publication is never an acceptable retry strategy.

A global kill switch exists outside AI runtime.

## Affiliate baseline

Coupang Partners is the first commercial target. MVP exact-product evidence may begin from a user-supplied commercial destination plus a versioned identity snapshot and manual/Verifier confirmation.

Automated product search is not required for v1 and cannot be replaced by an unauthorized scraper.

Live affiliate posting remains disabled until current account-specific program/disclosure/link rules are verified during activation.

## Analytics and learning

Attention, purchase intent, commercial outcome, and trust/quality metrics remain separate. Partial or unavailable attribution is labeled as such.

High-performing content that is misleading, rumor-based, hidden-disclosure, rights-violating, blocked, or otherwise unsafe is excluded from learning even if views or clicks are high.

Ranking changes require sufficient sample/confidence and remain reversible. Safety/evidence gates are never learned away.

## Security and privacy

- production secrets are server-side only and never stored in Git/client/prompt artifacts/logs
- source collection is minimized to evidence-required fields
- raw public content is not retained merely because it is accessible
- personal data is redacted/minimized according to retention class
- agent tool handlers are deterministic, reviewed, and classified by mutability
- audit hashes prove consistency/lineage, not truth

## Approved v1 operating defaults

- 0–3 daily posts, never a quota
- normally no more than one affiliate-heavy post per day
- maximum five first-screen recommendations
- initial opportunity review floor 65/100, non-sovereign
- price/stock TTL 4h when explicitly claimed
- listing revalidation within 24h of scheduled publication and as needed at dispatch
- fast issue-linked freshness 12h
- attention ranking input freshness 6h
- suppression persists until explicit restore
- source excerpts 30d, media metadata 90d, audit 365d default retention ceilings subject to stricter source/privacy rules
- mobile touch-first review; no hover-only critical behavior

## Live activation gates

The design is complete even though some capabilities remain intentionally disabled until runtime evidence exists.

Before enabling a live capability, verify its applicable gate:

- target Meta Threads app/account scope and token
- authorized product/listing source when automation beyond user-supplied destinations is required
- current Coupang Partners account/program disclosure and link rules
- deployed secret backend and runtime identity
- source/asset/action-specific media rights
- current metrics exposed by configured platforms

Unknown gate state means disabled, not guessed.

## Blind-spot and trap gates

`FINAL_BLIND_SPOT_SWEEP.md` is the canonical product/design blind-spot review. `B0_TRACEABILITY_MATRIX.md` maps every current B0 finding to design authority and behavioral acceptance. `../PRE_IMPLEMENTATION_TRAPS.md` remains the implementation-facing checklist.

A new or promoted B0 finding blocks the affected implementation slice until mapped and resolved by design.

## Design authority and change control

The `docs/spec/` set is the canonical design authority. `MASTER_SPEC.md` wins if a supporting spec conflicts until a recorded decision resolves the conflict.

The following cannot be weakened by configuration alone:

- exactly six agents / no price agent
- human approval for external publication
- exact vs alternative product semantics
- evidence independence and factual authority
- research-media vs final-use-media separation
- rumor/private-life block
- approval revision binding
- fail-closed live activation and publishing

Changing one of these requires a new design decision, four-option review where material, blind-spot sweep, traceability update, and acceptance update before implementation.

## Design completion state

Master Design v1 is **approved as the implementation authority**.

This approval does not mean the design is implemented. Runtime/product code from before this baseline remains a prototype/validation asset and must be gap-reviewed against this specification.

Implementation may begin only in a separately requested task that:

1. names the approved design baseline/PR
2. selects a bounded implementation slice
3. confirms its live activation gates or keeps them disabled
4. maps the slice to requirements and acceptance behavior
5. performs implementation-trap checks before code changes
6. runs real verification before completion claims
