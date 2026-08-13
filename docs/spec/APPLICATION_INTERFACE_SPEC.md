# Application Interface Specification v1

Status: DESIGN ONLY. Endpoint names are conceptual and do not select a framework.

## Read surfaces

- today opportunity inbox
- candidate detail and evidence timeline
- strategy bundle
- draft bundle and Guardian findings
- review packet
- schedule state
- results/learning summary
- suppression/settings state

## User command surfaces

- start discovery or add manual candidate
- attach user-owned reference/evidence metadata
- request verification
- request four strategies
- request drafts
- choose/edit a draft
- hold/reject/suppress/restore candidate
- record final review decision
- create/cancel a local schedule

## Command rule

The client sends intent, not authoritative state. For example, it may request verification, but it cannot set `exact=true` directly. It may submit a review decision, but it cannot manufacture a Guardian pass or fresh evidence state.

## Read model rule

User-facing read models may combine data from several internal entities, but they preserve visible distinctions between opportunity, evidence, risk, freshness, product match, media state, and review state.

## Idempotency rule

Commands that can be retried use a client/request identifier so duplicate UI submissions do not create duplicate logical work.

## Version conflict rule

A command referencing stale draft/evidence revisions is rejected with a refresh/review response rather than silently applying the action to a newer artifact.
