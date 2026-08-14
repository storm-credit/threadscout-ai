# Orchestrator State Machine v1

Status: DESIGN ONLY.

## Run states

`intake → discovery → verification → strategy → drafting → guardian_review → human_review → scheduled_local → completed`

Alternative states:

- `needs_context`
- `needs_evidence`
- `held`
- `rejected`
- `blocked`
- `stale`
- `cancelled`
- `partial`

Live-source and live-publication states remain outside the active design boundary until the relevant P0 gates are resolved.

## Transition rules

- intake → discovery when objective and constraints are sufficient
- intake → verification when the user supplies a sufficiently specific candidate
- discovery → verification only through a `candidate_set` handoff
- verification → strategy only when the proposed content can be supported by the evidence packet
- strategy → drafting only with four distinct valid angles
- drafting → guardian_review only with four mapped drafts
- guardian `revise` → bounded drafting revision
- guardian `block` → blocked until evidence/design state changes
- guardian `pass` → human_review
- human review can hold, reject, or move the exact reviewed artifact set to local scheduling

## Stale transition

A material upstream artifact change marks dependent downstream artifacts stale. Stale artifacts cannot silently advance; the Orchestrator routes them back to the earliest affected stage.

## Budget transition

When the configured source or specialist-call budget is exhausted, the run becomes `partial` or `held`. The Orchestrator does not create an extra role or silently expand the budget.

## Audit rule

Every transition records previous state, next state, reason code, actor, artifact refs, time, and any blocker/warning refs.
