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

ThreadScout v1 is a **mobile-first responsive web application** comprising two server-authoritative surfaces backed by one canonical store:

- **Owner Operations Surface:** phone-first recurring review inbox, desktop evidence/configuration workbench, approval, queue, and performance views
- **Public Verified Showcase Surface (`#NNN`):** read-only consumer web directory addressable by sequential card number (`#001`, `#042`, ...) and search query, projecting **only** `approved` non-stale items through a closed default-deny 9-field public card schema (`PLATFORM_DECISION.md`) so ephemeral Threads readers can inspect verified pros, concrete limitations, `exact` vs `alternative` badges, and disclosed commercial links without requiring a Threads DM endpoint
- PWA capability is optional enhancement and never correctness authority
- native iOS/Android applications are outside MVP and require an evidence-based revisit
- durable state, scheduling, freshness, publication, approval bindings, public card projection, and audit are server-authoritative

The selected platform, closed public-card projection schema, and revisit rules are defined in `PLATFORM_OPTIONS.md` and `PLATFORM_DECISION.md`.

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

Source adapters, evidence store, media registry, scheduler, publisher adapter, metrics collector, audit/event log, duplicate detector, affiliate mapper, affiliate yield/ROI & rate-limit service (`affiliate_yield_service`), public showcase projector & non-LLM template exporter (`public_showcase_projector`), state machine, configuration store, secret boundary, passive-data payload fencer, and version/conflict controls remain deterministic services.

Creator commission rates and run ROI math belong exclusively to `affiliate_yield_service` and never enter the `Verifier` factual `evidence_packet`. Agents never receive a direct payment or publishing tool.

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

Scheduling and dispatch run on server/background workers, never browser/PWA lifecycle. Each approved publication dispatches a **single root Threads post** (inline link or `#NNN` pointer to the Public Verified Showcase URL); automated comments and automated continuation self-replies (`reply_to_id`) are prohibited (`CLAUDE.md` §5).

Before dispatch, preflight rechecks applicable volatile facts, authorization, product destination, code-point offset-`0` verbatim statutory disclosure on every commercial solicitation surface (`AFFILIATE_SPEC.md` §5: direct commercial/redirect URLs, any `#NNN`/`N번`/`/showcase/N` pointer to a monetized card, or any profile `/showcase` pointer when active monetized cards exist), media rights, issue freshness, and approval binding.

A timeout with unknown remote outcome enters `unknown_remote_state`. The system reconciles before any retry. Duplicate publication is never an acceptable retry strategy.

Candidate-lifecycle run budgets cap cumulative specialist invocations, tool calls, and configured KRW/USD token cost across all retries for a single `(candidate_id, lifecycle_epoch)` — where `lifecycle_epoch` increments **exclusively** on an explicit owner `reopen_rejected_candidate` command after an explicit owner `reject` decision or post-retention archival (never on `Guardian` `block`/`revise`, `Verifier` `hold`, or freshness TTL `stale`) — halting with `budget_exhausted` and an audit receipt when reached. Child subprocesses scrub ambient secrets (`SCRUB_ENV`), and all untrusted text (including owner-pasted `user_evidence` as well as network/MCP outputs) enters models only inside per-call cryptographic-nonce passive-data fences.

A global kill switch exists outside AI runtime.

## Affiliate baseline

ThreadScout supports a dual Korean affiliate baseline downstream of product verification (`AFFILIATE_SPEC.md`):

1. **Coupang Partners:** owner-supplied partner short-URL plus corroborated `CanonicalListingSnapshot` before the account clears the official API eligibility gate (`>= ₩150,000` cumulative sales and channel review approval, `reported`); once explicitly activated by the owner, deterministic search calls are rate-limited to `<= 10` requests per rolling 60-minute window (`reported`).
2. **Naver Shopping Connect / Brand Connect:** owner-supplied official short-URL plus corroborated `CanonicalListingSnapshot` verified by `Verifier` (`exact` vs `alternative`), because no public external Open API exists (`reported`).

Automated product scraping — whether headless browser CUA/Playwright or plain HTTP `fetch`/`curl` HTML/redirect parsing — is forbidden across all networks (`CLAUDE.md` §12). Every commercial solicitation surface (`AFFILIATE_SPEC.md` §5) must carry verbatim statutory disclosure at offset `0`, and any `#NNN` card referenced by a non-disclosed published post is permanently locked to `AffiliateMapping.state = 'none'` (`BS-60`).

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
- published monetized `#NNN` showcase card destination-revalidation TTL 7d rolling (withdrawing the entire card as `stale` on expiry or mutation)
- fast issue-linked freshness 12h (applies to both scheduled posts and `#NNN` showcase cards)
- attention ranking input freshness 6h
- suppression persists until explicit restore
- source excerpts 30d, media metadata 90d, audit 365d default retention ceilings subject to stricter source/privacy rules
- mobile touch-first review; no hover-only critical behavior

## Live activation gates

The design is complete even though some capabilities remain intentionally disabled until runtime evidence exists.

Before enabling a live capability, verify its applicable gate:

- target Meta Threads app/account scope and token
- authorized product/listing source when automation beyond user-supplied destinations is required
- current Coupang Partners and Naver Shopping Connect account/program disclosure and link rules
- Public Verified Showcase hosting identity, TLS domain, and external global kill switch
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
