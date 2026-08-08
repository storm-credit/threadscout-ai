# Proposed Architecture

## Recommended direction

Approval-first personal application with a staged Product Scout.

```text
Candidate sources
      ↓
Normalizer and evidence store
      ↓
Scoring and blocking-risk checks
      ↓
Top-five mobile recommendation inbox
      ↓
Four-angle draft generator
      ↓
Fact/use/rights/disclosure/duplicate checks
      ↓
Human edit and approval
      ↓
Schedule and publish adapter
      ↓
Publication reconciliation and analytics
```

## Bounded areas

### Product evidence

Canonical identity, listing evidence, source observations, price timestamp, exact-match status, personal-use status, media rights.

### Recommendations

Signals, score components, plain-language reasons, uncertainty, blocking risks, suppression rules.

### Content

Draft angle, claims, disclosure, media, revisions, duplicate similarity, approval state.

### Publishing

Schedule, idempotency key, attempt history, remote post ID, reconciliation, retry/cancel state.

### Analytics

Post metrics, link outcomes when available, topic/format/time grouping, weekly conclusions with uncertainty.

## Approval state model

`draft → needs_evidence → ready_for_review → approved → scheduled → publishing → published`

Alternative terminal or recovery states:

`held`, `rejected`, `cancelled`, `failed`, `unknown_remote_state`

No transition into `scheduled` or `publishing` is valid without an approval actor and timestamp.

## Implementation order

1. Domain types and state machine
2. Local fixture-based recommendation inbox
3. Four-angle draft generation interface
4. Integrity and blocking checks
5. Approval audit trail
6. Semi-automatic candidate import
7. Official publishing adapter after capability verification
8. Analytics feedback after reliable post reconciliation
