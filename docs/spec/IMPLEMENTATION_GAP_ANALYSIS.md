# Existing Prototype vs Master Spec — Gap Analysis v1

This is design analysis only. It does not authorize code changes.

## 1. Keep conceptually

The following existing concepts align with the master design and should be preserved unless later evidence contradicts them:

- exactly six fixed agents
- Orchestrator-only delegation
- Product Scout does discovery, Verifier owns facts
- no separate price agent
- four strategy angles and four Writer drafts
- Guardian before human approval
- explicit human approval before publication
- deterministic scheduler/publisher/metrics/audit services
- bounded retries and budgets
- provider-neutral runtime concept
- artifact/schema validation
- content-addressed evidence and hash-chained events
- fail-closed source readiness
- secret redaction and no credentials in Git
- fixture/replay testing for deterministic scenarios

## 2. Modify later after design approval

### Discovery model

Current prototype is oriented around product-first practical novel items. Future implementation must also model `IssueSignal`, media references, and public-figure/broadcast triggers without changing the fixed six-agent roster.

### Source registry

Current source-readiness structure is useful, but future design requires source evidence tiers, independence/dependency metadata, issue/news source classes, and explicit media-purpose separation.

### Candidate artifact

Must evolve to include:

- content lane
- issue context
- media refs
- multiple product hypotheses
- purchase-intent evidence
- relationship uncertainty

### Evidence packet

Must evolve to include explicit:

- ProductMatch entity/reference
- PublicFigureRelation
- MediaAsset rights refs
- stale/TTL state
- prohibited implications
- exact vs alternative affiliate eligibility

### Approval model

Approval should bind draft, evidence, media, and affiliate mapping hashes, not only a general candidate/draft state.

### Scheduling

Future implementation needs preflight, invalidated/expired/unknown_remote_state, idempotency and remote reconciliation behavior from `PUBLISHING_SPEC.md`.

### Analytics

Current prototype does not yet provide the bounded learning model required by `ANALYTICS_SPEC.md`.

## 3. Remove/avoid later

No existing validated safety mechanism should be removed solely for convenience. However future implementation should avoid or retire any behavior that:

- treats fixture scores as market truth
- uses a single numeric score without reasons/uncertainty
- equates public visibility with media reuse permission
- treats social observation + similar listing as exact identity
- lets raw trend performance directly drive copy imitation
- allows an agent to act as scheduler/publisher

## 4. Missing capabilities by design domain

### User experience

- issue-triggered candidate card state
- media rights/usage display
- simplified evidence lineage
- exact vs alternative affiliate label
- stale-evidence preflight UI
- suppression restore flow

### Discovery / research

- approved live issue/news source classes
- independent-source detection
- media metadata/reference pipeline
- public-event product co-occurrence signals

### Verification

- full product matching dimensions and conflict model
- public-figure relationship classifier
- publication-rights decision per asset/action
- evidence TTL policy

### Content

- issue-linked safe wording classes
- prohibited implication propagation into strategy/writer
- account-wide content portfolio/rate guardrails

### Publishing

- live official publisher activation
- preflight refresh
- reconciliation after unknown outcome
- destination/link integrity preflight

### Analytics

- metric snapshots
- intent vs attention separation
- trust/quality metrics
- minimum-sample/confidence logic
- approved learning summary to Scout

## 5. Design/code mismatch rule

Once Master Spec v1 is approved, create implementation issues from this gap analysis. Each issue must point to requirement IDs and acceptance-test IDs. Code must not be changed directly from this document without that mapping.
