# Product Requirements v1

## 1. MVP user

One Korean-speaking owner of a Threads account, operating primarily from mobile.

## 2. MVP job to be done

“When I have limited time, show me a small number of product/content opportunities that are actually worth considering, explain why, prove what can be safely claimed, and let me approve a strong Threads post without manually researching everything.”

## 3. Functional requirements

### PR-01 Daily opportunity inbox

Show up to five ranked opportunities from a larger candidate pool. Each card must include:

- candidate name
- content lane
- why now
- reader problem/value
- purchase-intent evidence
- novelty/demonstration value
- exact-match state
- media-rights state
- issue/public-figure context when relevant
- key blockers
- confidence/uncertainty

### PR-02 Multi-source discovery

Support candidate input from approved sources, user-supplied references, issue signals, and media references. Discovery sources propose; they do not establish truth.

### PR-03 Public-figure / broadcast issue discovery

The system may surface a public event involving a celebrity/entertainer/public figure only when a product-relevant signal exists. It must not surface private-life rumors as commercial candidates.

### PR-04 Evidence verification

Before a candidate is used for product content, verify identity, claims, rights, and commerce facts according to the matching and evidence specs.

### PR-05 Media evidence and rights

Media may be found for analysis even when it cannot be published. Publishable rights must be explicit.

### PR-06 Four-strategy requirement

Every viable verified candidate receives four meaningfully different strategic angles before final copy generation.

### PR-07 Four-draft requirement

Every strategy angle maps one-to-one to a Korean Threads draft. The Writer cannot add unsupported facts.

### PR-08 Guardian gate

Every candidate/draft bundle receives an independent Guardian decision: pass, revise, or block.

### PR-09 Human approval

No post is queued for external publication without explicit user approval after Guardian pass.

### PR-10 Affiliate mapping

Exact-product and alternative links must be distinguished. Affiliate disclosures must follow configured policy and remain visible.

### PR-11 Scheduling and cancellation

Approved posts may be scheduled. User can cancel before dispatch. Duplicate dispatch must be prevented.

### PR-12 Metrics and learning

Collect post outcomes when available and convert them into bounded learning signals rather than direct “maximize views” instructions.

### PR-13 Auditability

Every run must preserve source references, agent artifacts, revisions, decisions, human approval, and publication/metrics IDs.

### PR-14 User suppression controls

Support product/category/source suppression and record the reason.

### PR-25 Public Verified Showcase projection (`#NNN`)

Project approved non-stale candidates with `product_state` in `['exact', 'substitute']` onto a read-only consumer showcase web surface using the closed default-deny 9-field `PublicShowcaseCard` schema and deterministic `matchBadge` mapping (`PLATFORM_DECISION.md`), blocking `likely`, `unresolved`, and `stale` candidates and withholding all raw third-party excerpts, PII, internal scores, and unpermitted media.

### PR-26 Offset-`0` disclosure, post-publish monetization lock & dual-affiliate mapping

Support Coupang Partners (corroborated manual link/snapshot pre-eligibility; `<= 10/hr` rate-limited official API post-activation) and Naver Shopping Connect (owner-issued manual link + corroborated `CanonicalListingSnapshot`, zero CUA or HTTP HTML/redirect scraping), block any commercial solicitation surface (`AFFILIATE_SPEC.md` §5: direct/redirect commercial URLs, `#NNN`/`N번`/`/showcase/N` pointers to monetized cards, `/showcase` pointers when active monetized cards exist, and monetized showcase cards) missing verbatim statutory disclosure at offset `0`, and permanently lock any `#NNN` card referenced by an undisclosed published post to `AffiliateMapping.state = 'none'`.

## 4. Non-functional requirements

### NFR-01 Mobile-first

Core daily flow must work at narrow mobile width without hidden essential state.

### NFR-02 Truth before throughput

Missing evidence must reduce automation rather than produce guesses.

### NFR-03 Fail closed

Unknown rights, unresolved exact identity, unsupported public-figure claims, stale critical evidence, invalid contracts, or Guardian blockers stop progression.

### NFR-04 Observability

Every external call and agent call must have a traceable receipt without leaking credentials.

### NFR-05 Reproducibility

Given the same immutable evidence and prompt/schema versions, replay should explain why a decision was produced.

### NFR-06 Security

Credentials never enter repository content, prompts, user-visible logs, artifacts, or analytics payloads.

### NFR-07 Cost controls

Per-run and per-agent budgets, source query budgets, and media-processing budgets must exist before live operation.

### NFR-08 Accessibility

Primary actions, blockers, status, and evidence labels must not rely only on color.

### NFR-09 Korean copy quality

Drafts must sound natural in Korean and preserve distinction between fact, inference, discovery, and personal experience.

### NFR-10 Data minimization

Store only source excerpts and identifiers required for evidence/audit; do not retain unnecessary personal information or raw scraped payloads.

### NFR-13 Lifecycle cost ceiling, `SCRUB_ENV` & passive-data fencing

Enforce a cumulative invocation, token, and KRW/USD cost ceiling across all specialist calls and revision retries for each `(candidate_id, lifecycle_epoch)` run (where `lifecycle_epoch` increments exclusively on explicit owner re-open after owner `reject` or archival), scrub ambient secrets from child-process environments (`SCRUB_ENV`), and wrap all untrusted text — including owner-pasted `user_evidence` as well as network/MCP outputs — in per-call cryptographic-nonce passive-data fences verified absent from the payload.

## 5. MVP exclusions

- auto comments/likes/follows
- mass account operations
- direct purchase/payment
- unrestricted scraping
- private-account content collection
- face recognition or identity inference from images
- rumor aggregation
- automatic medical/health recommendations
- multi-tenant billing/admin
