# ThreadScout AI — Master Product & System Specification v1

Status: DESIGN BASELINE — implementation freeze until this spec set is reviewed.

## Product purpose

ThreadScout AI is a Korean, mobile-first, approval-first operating system for discovering products worth discussing on Threads, proving what is true about them, creating useful content, and learning from results without turning the account into spam or gossip.

The system is not a generic trend scraper. It must connect a topic to concrete reader value and a verifiable product, or explicitly decide that no product should be attached.

## Primary outcomes

The user should quickly answer: what is worth posting today, why it is interesting now, what can safely be claimed or shown, and which draft is worth approving.

## Content lanes

- practical novel items: about 60%
- family / elementary-school household items: about 20%
- travel / desk / storage: about 15%
- curiosity-only: no more than about 5%
- issue-triggered product discovery: a trigger source only when the product connection is verifiable and useful

## Fixed six-agent orchestra

Exactly six agents exist: Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian.

There is no price agent. Price, seller, stock, quantity, and variant are volatile commerce evidence owned by Evidence Verifier.

## Deterministic services

Source adapters, evidence store, media registry, scheduler, publisher adapter, metrics collector, audit/event log, duplicate detector, affiliate mapper, and state machine remain deterministic services.

## Canonical flow

```text
User/account goals
→ Orchestrator
→ discovery inputs
→ Product Scout
→ Evidence Verifier
→ candidate decision
→ Content Strategist (4 angles)
→ Threads Writer (4 drafts)
→ Integrity Guardian
→ human approval
→ schedule/publish
→ metrics/learning
```

## Core truth rules

Issue source reliability, product relationship, exact product identity, publication media state, commercial mapping, and freshness are independent. A strong signal on one axis cannot compensate for a blocker on another.

Finding a photo/video and being allowed to use it in a final post are separate facts. Final media prefers user-owned material, permission-confirmed material, permitted native treatment, text-only, then hold.

Product state is `exact`, `likely`, `substitute`, or `unresolved`. A commercial destination may be described as the same product only at `exact`; a substitute must be labeled as an alternative.

## Ranking and daily selection

Every candidate exposes opportunity score, evidence readiness, risk level, and freshness separately. The final five are not simply the five highest scores; portfolio selection also considers blockers, suppression, verification workload, repetition, lane concentration, issue concentration, and publication-media feasibility.

## Approval gates

A draft reaches human approval only when evidence is current, Guardian passes, disclosure is resolved, publication media state is valid, first-hand wording matches an actual usage record, and product-match wording is accurate. External publication additionally requires explicit human approval for that post.

## Staleness

Volatile facts have TTLs and invalidation rules. Provisional design defaults live in `P0_P1_DECISION_TABLE.md`; they are not production-approved until promoted.

## Design completion gate

Implementation resumes only when the Master Spec direction is approved, P0 items are resolved or safely deferred behind disabled features, required P1 values are promoted, traceability is complete, and the implementation plan names the approved baseline commit.

## Supporting authority

The `docs/spec/` set covers product requirements, user flows, UI/wireframes, six-agent contracts/handoffs, data model, source strategy, ranking, daily selection, media strategy/pipeline, issue pipeline/grading/decision rules, product matching, content/affiliate strategy, operations, publishing, analytics, safety/compliance, scenarios, P0/P1 decisions, traceability, acceptance tests, design-CI semantics, design review, freeze rules, and prototype gap analysis.

If supporting documents conflict with this Master Spec, this file wins until a recorded design decision changes it.
