# ThreadScout AI Project Constitution

## 1. Verify context first

Read the README, `docs/spec/README.md`, Master Spec, requirements, user flows, agent contracts/handoffs, domain specs, traceability/acceptance tests, design freeze, blind spots, traps, and decision log. Verify repository and branch state rather than assuming completion.

## 2. Design authority and implementation freeze

`docs/spec/MASTER_SPEC.md` and the supporting `docs/spec/` set are the product/system design authority.

While `docs/spec/DESIGN_FREEZE.md` says design-only:

- do not add or modify runtime/product code
- do not activate live sources, models, credentials, affiliate actions, or publishing
- documentation, design analysis, source-policy research, and requirement clarification are allowed
- existing prototype code is evidence/prototype material, not the authority when it conflicts with the approved design

Implementation resumes only through the gate defined in `DESIGN_FREEZE.md`.

## 3. Automatic continuation boundary

Use existing context first. Reversible documentation/design work may continue automatically when assumptions and open questions are recorded. Stop before spending, credentials, live external data, public posting, deletion, irreversible actions, or implementation while the design freeze is active.

## 4. Four options and success conditions

Compare four options before major UI, workflow, niche, runtime, provider, storage, research-source, media strategy, or roster decisions. Every task states success criteria, non-goals, verification, and stop conditions.

## 5. Approval first

No post may be published without explicit human approval. Guardian pass is also required before queueing. Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement.

## 6. Truth and evidence

- Never claim personal use without a usage record.
- Separate verified fact, opinion, inference, unknown, and synthetic fixture data.
- Do not invent real product, price, seller, stock, effect, review, endorsement, or public-figure relationship.
- Exact product identity, claim sources, timestamps, media rights, and public-event context remain explicit.
- Hashes prove consistency, not factual truth.
- Fixture values cannot be surfaced as current market truth.
- Public visibility of an image/video does not imply reuse rights.

## 7. Fixed six-agent orchestra

Exactly six agents exist: `orchestrator`, `scout`, `verifier`, `strategist`, `writer`, and `guardian`.

- No seventh, dynamic, removed, merged, renamed, or split role without explicit user approval, four options, decision log, and tests.
- There is no dedicated price agent.
- Only Orchestrator delegates.
- Specialists return structured artifacts to Orchestrator.
- Guardian blockers cannot be bypassed.
- Scheduler, publisher, metrics, audit, source adapters, evidence store, media registry, and link mapper remain deterministic services.

## 8. Handoff rule

Use the artifact and handoff protocol in `docs/spec/AGENT_HANDOFFS.md`.

- Specialists do not call each other directly.
- Downstream facts come from the Verifier evidence packet, not fresh Writer research.
- Every handoff is versioned and references immutable inputs/evidence.
- Changed evidence marks downstream artifacts stale.
- Guardian revision requests are structured; Guardian does not silently become the Writer.

## 9. Public-figure and issue boundary

Public celebrity/broadcast/cultural issues may trigger product discovery only when public, product-relevant, and sourceable. Rumors/private-life speculation, health/appearance speculation, leaked/private material, and unsupported endorsement implications are blocked. Person identity must not be inferred from an image; textual/source context supplies public-figure identity/context.

## 10. Media boundary

A media reference may be usable for discovery/analysis without being publishable. Publication requires an explicit rights state for the intended action. Prefer user-owned or explicitly licensed media. Never fabricate imagery of a real public figure endorsing or using a product.

## 11. Runtime, tools, versioning, and storage

- Each agent has one prompt and one output schema.
- Outputs pass schema and semantic validation before progression.
- Runtime budgets cover exactly six agents and every invocation produces a receipt.
- Every tool call passes registry allowlists and a reviewed handler.
- Publication, purchase, payment, and equivalent tools are forbidden to agents.
- Sources and artifacts are content addressed; run events are sequential and hash chained.
- Tampered or stale artifacts cannot be treated as valid.
- `.threadscout-data/` and credentials remain outside Git.

## 12. Live source readiness

Every network source remains disabled until its source-specific gate is approved. Credentials alone cannot activate a source. Never silently fall back to scraping when official access is unavailable.

## 13. Traceability

Every implementation requirement must map through `docs/spec/TRACEABILITY_MATRIX.md` to design authority, owner, gate/artifact, and acceptance test. No code-only change may redefine product behavior.

## 14. Verification and deviations

Record where plans fail, the original plan, change, reason, impact, and remaining risks. During design freeze, completion means design artifacts are internally consistent and open P0/P1 questions are visible—not that code has been changed.
