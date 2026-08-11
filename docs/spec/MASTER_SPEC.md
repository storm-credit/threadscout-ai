# ThreadScout AI — Master Product & System Specification v1

Status: DESIGN BASELINE — implementation freeze until this spec set is reviewed.

## 1. Product purpose

ThreadScout AI is a Korean, mobile-first, approval-first operating system for discovering products worth discussing on Threads, proving what is true about them, creating useful content, and learning from results without turning the account into spam or gossip.

The system is not a generic trend scraper. It must connect a topic to a concrete reader value and a verifiable product or explicitly decide that no product should be attached.

## 2. Primary outcomes

The user should be able to open the dashboard and answer four questions quickly:

1. What is worth posting today?
2. Why is it interesting now?
3. What can safely be claimed and shown?
4. Which draft is worth approving?

The system optimizes for trustworthy repeatable operation, not maximum post volume.

## 3. Primary content lanes

### Lane A — practical novel items

Products with an unexpected mechanism that visibly solve an everyday problem. Target share: about 60%.

### Lane B — family / elementary-school household items

Low-risk products relevant to parents and children. Target share: about 20%.

### Lane C — travel / desk / storage

Useful products with a clear before/after or decision point. Target share: about 15%.

### Lane D — curiosity-only items

Novelty with weaker utility. Target share: no more than about 5%.

### Lane E — issue-triggered product discovery

A public celebrity, entertainer, program, sports, event, or cultural moment may create product interest. This lane is a trigger source, not a gossip category. It may enter the product pipeline only if the relationship to the product is verifiable and commercially or practically useful to the reader.

## 4. Non-goals

ThreadScout must not become:

- an automated celebrity-rumor account
- an unauthorized media re-uploader
- a fake personal-review generator
- a medical/health claim generator
- an engagement-farming bot
- an automatic purchasing or payment agent
- an auto-comment, auto-like, or auto-follow system
- a system that publishes without Guardian pass and human approval

## 5. Fixed six-agent orchestra

Exactly six agents exist:

1. Orchestrator — owns plan, routing, budgets, state, escalation, and human gates
2. Product Scout — discovers candidates and issue/product signals
3. Evidence Verifier — owns exact identity, claims, rights, commerce facts, and source conflicts
4. Content Strategist — turns verified evidence into four distinct reader-value angles
5. Threads Writer — writes four Korean Threads drafts from approved evidence only
6. Integrity Guardian — independently checks truth, rights, disclosure, duplication, tone, and platform risk

There is no price agent. Price, seller, stock, quantity, and variant are volatile commerce evidence owned by Evidence Verifier.

## 6. Deterministic services

These are services, not agents:

- source registry and adapters
- evidence store
- media registry
- scheduler
- publisher adapter
- metrics collector
- audit/event log
- duplicate detector
- link/affiliate mapper
- state machine

Deterministic work must remain deterministic unless a future design review proves an agent is necessary.

## 7. Canonical end-to-end flow

```text
User/account goals
      ↓
Orchestrator intake
      ↓
Discovery inputs
  ├─ Threads/product discussion
  ├─ search/trend corroboration
  ├─ public-figure/broadcast issue signal
  ├─ image/video references
  └─ user-supplied product/reference
      ↓
Product Scout candidate set
      ↓
Evidence Verifier
  ├─ exact product identity
  ├─ claims/evidence
  ├─ media rights
  ├─ public-figure relationship level
  └─ seller/variant/price/stock snapshot
      ↓
Candidate decision
  ├─ reject
  ├─ hold for more evidence
  ├─ discovery-only content
  └─ verified product content
      ↓
Content Strategist — four distinct angles
      ↓
Threads Writer — four mapped drafts
      ↓
Integrity Guardian — pass / revise / block
      ↓
Human edit + explicit approval
      ↓
Scheduler / publisher
      ↓
Metrics collection
      ↓
Analytics summary
      ↓
Next Scout run receives only validated learning signals
```

## 8. Source hierarchy

Evidence strength is not equal across sources.

Tier 1 — first-party / primary:
- official brand/product page
- official retailer/listing controlled by the seller or platform
- official public-figure/agency/broadcast account or release
- user-owned photo, receipt, product, or direct-use record

Tier 2 — reliable secondary:
- established reporting describing a public event or appearance
- platform-native public post with clear original authorship
- independent search/trend statistics with known semantics

Tier 3 — discovery-only:
- reposts
- fan accounts
- community posts
- comments
- aggregator pages

Tier 3 can trigger research but cannot by itself support an exact product, endorsement, relationship, or sensitive claim.

## 9. Public-figure and issue rule

A public-figure issue enters the product workflow only when all are true:

- the event is public and sourceable
- the product relationship is relevant to the post
- the relationship level can be classified
- the content does not rely on private-life speculation
- the media can be lawfully referenced or replaced with licensed/original media

Relationship levels:

- `official_endorsement` — explicitly advertised or officially partnered
- `confirmed_use` — verifiably used/worn/held in a public context, without implying endorsement
- `visible_unconfirmed_identity` — product appears visible but exact identity is not proved
- `reported_association` — reliable reporting connects person/event and product
- `similar_only` — only a similar product can be found
- `rumor_or_private` — blocked

Only the first four may appear in factual copy, with wording matched to the evidence level. `similar_only` must be labeled as an alternative. `rumor_or_private` never proceeds.

## 10. Media rule

Finding a photo/video and being allowed to republish it are separate facts.

Every media object must have:

- origin URL/reference
- creator/owner when known
- media type
- capture/observed time
- relationship to candidate
- rights state
- allowed uses
- transformation history
- whether the asset can be downloaded, embedded, quoted, linked, or only used for internal analysis

No asset is publishable while rights state is unresolved.

## 11. Product matching rule

The system distinguishes:

- exact
- high-confidence likely
- substitute
- unresolved

An affiliate link may be attached as “the same product” only at `exact`. `substitute` may be used only with explicit alternative wording. `likely` and `unresolved` cannot be represented as the exact item shown by a celebrity, broadcast, image, or video.

## 12. Approval gates

A draft may enter the human-approval screen only when:

- evidence packet is valid and current
- Guardian decision is `pass`
- no mandatory disclosure is missing
- rights state for publishable media is resolved
- first-hand language matches an actual usage record
- exact/substitute wording matches product-match state
- sensitive public-figure claims are absent or source-supported

External publication additionally requires explicit user approval for that post.

## 13. Staleness and recency

Volatile fields have timestamps and TTL policies. At minimum:

- price/stock/seller/variant availability: recheck before publication when older than configured threshold
- issue/trend relevance: mark stale when outside the content window
- rights state: revalidate if source terms or asset status changes
- exact product identity: invalidate downstream artifacts if supporting evidence changes

A stale artifact cannot silently pass forward.

## 14. Human controls

The user must be able to:

- approve
- edit
- hold
- reject
- suppress a product
- suppress a category
- mark personal use
- attach owned media/evidence
- select a different draft angle
- cancel scheduled content
- globally disable publishing

## 15. Design completion gate

Implementation may resume only when this specification set has no unresolved P0/P1 design questions in `DESIGN_FREEZE.md` and the traceability matrix maps every MVP requirement to an owner, artifact, gate, and acceptance test.

## 16. Document map

This file is the product/system authority. Supporting specs:

- `PRODUCT_REQUIREMENTS.md`
- `USER_FLOWS.md`
- `AGENT_CONTRACTS.md`
- `AGENT_HANDOFFS.md`
- `DATA_MODEL.md`
- `SOURCE_STRATEGY.md`
- `MEDIA_PIPELINE.md`
- `TREND_ISSUE_PIPELINE.md`
- `PRODUCT_MATCHING.md`
- `CONTENT_STRATEGY.md`
- `AFFILIATE_SPEC.md`
- `PUBLISHING_SPEC.md`
- `ANALYTICS_SPEC.md`
- `SAFETY_COMPLIANCE.md`
- `TRACEABILITY_MATRIX.md`
- `ACCEPTANCE_TESTS.md`
- `DESIGN_FREEZE.md`

If supporting documents conflict with this master spec, this file wins until a recorded design decision changes it.
