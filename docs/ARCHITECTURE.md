# Proposed Architecture

## Recommended direction

Approval-first personal application using a fixed six-agent orchestra supervised by a deterministic state machine.

## Agent layer

```text
                         ┌──────────── Product Scout
                         │
User → Orchestrator ─────┼──────────── Evidence Verifier
                         │
                         ├──────────── Content Strategist
                         │
                         ├──────────── Threads Writer
                         │
                         └──────────── Integrity Guardian
                                      ↓
                                Human approval
```

Only the Orchestrator delegates. Every specialist returns a structured artifact to the Orchestrator.

The six-agent roster is fixed. A request may skip an unnecessary specialist, but the system may not create a new role.

## End-to-end flow

```text
User objective and constraints
      ↓
Orchestrator run plan
      ↓
Product Scout candidate_set
      ↓
Evidence Verifier evidence_packet
      ↓
Content Strategist content_brief with four angles
      ↓
Threads Writer draft_bundle with four drafts
      ↓
Integrity Guardian review_report
      ↓
Human approval
      ↓
Deterministic scheduler and local queue
      ↓
Future official publisher adapter
      ↓
Deterministic metrics collection
```

When an exact product is supplied, Product Scout may be skipped. Evidence verification, Guardian review, and human approval are never skipped.

## Why price is not an agent

Price is volatile evidence, not an independent decision-maker. The Evidence Verifier records price together with seller, stock, quantity, product variant, source, and observation timestamp. The system must not recommend a product by price alone or present a snapshot as permanent truth.

## Structured artifacts

### `run_plan`

Objective, constraints, stage order, loop limits, stop conditions, and human gates.

### `candidate_set`

Normalized products, sources, attention, purchase intent, saturation, account fit, visual potential, and uncertainty.

### `evidence_packet`

Canonical identity, exact-match state, source evidence, claim evidence, personal-use state, media rights, and timestamped price/stock/seller snapshot.

### `content_brief`

Audience, core value, CTA, and exactly four distinct content angles.

### `draft_bundle`

Exactly four drafts, each mapped to a distinct angle and limited to verified claims.

### `review_report`

Guardian decision of pass, revise, or block; blockers, warnings, and bounded revision instructions.

## Bounded areas

### Product evidence

Canonical identity, listing evidence, source observations, price timestamp, exact-match status, personal-use status, media rights.

### Recommendations

Signals, score components, plain-language reasons, uncertainty, blocking risks, suppression rules.

### Content

Draft angle, claims, disclosure, media, revisions, duplicate similarity, approval state.

### Orchestra runtime

Fixed registry, run plan, current stage, artifact validation, invocation counts, revision limits, blockers, human decisions, and trace events.

### Publishing

Schedule, idempotency key, attempt history, remote post ID, reconciliation, retry/cancel state.

### Analytics

Post metrics, link outcomes when available, topic/format/time grouping, weekly conclusions with uncertainty.

## Agent state model

`ready → running → revision_requested → running → needs_human_decision / blocked / approved_for_local_queue → completed_local_only`

## Content approval state model

`draft → needs_evidence → ready_for_review → guardian_passed → human_approved → scheduled → publishing → published`

Alternative terminal or recovery states:

`held`, `rejected`, `cancelled`, `failed`, `unknown_remote_state`

No transition into `scheduled` or `publishing` is valid without Guardian pass, a human approval actor, and timestamp.

## Deterministic services

The following are not agents:

- scheduler
- publisher adapter
- metrics collector
- audit log

They execute validated commands and must not invent content or evidence.

## Implementation order

1. Domain types and state machine
2. Local fixture-based recommendation inbox
3. Four-angle draft generation interface
4. Integrity and blocking checks
5. Fixed six-agent registry and artifact contracts
6. Deterministic orchestration, loop limits, and human gate
7. Semi-automatic candidate import
8. Official publishing adapter after capability verification
9. Analytics feedback after reliable post reconciliation
