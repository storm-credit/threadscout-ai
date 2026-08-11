# Publishing, Scheduling & Reconciliation Specification v1

## 1. Principle

Publishing is deterministic infrastructure behind explicit human approval. No agent may directly publish.

## 2. Preconditions

A post can enter external schedule only if all are true:

- Guardian decision is `pass`
- explicit human approval exists
- approved draft hash matches current draft
- evidence packet is not stale
- media rights are publishable for the planned action
- affiliate mapping is valid or intentionally absent
- required disclosure is present
- public-figure relationship wording remains within verified class
- global publishing kill switch is off only by deliberate configuration

## 3. Schedule object

Stores:

- schedule_id
- approval_id
- desired local datetime
- timezone
- content/media/affiliate hashes
- idempotency key
- preflight window
- status

## 4. States

`approved → scheduled → preflight → ready → dispatching → published`

Recovery/terminal states:

`held`, `cancelled`, `failed`, `unknown_remote_state`, `invalidated`, `expired`

## 5. Preflight

Before dispatch:

- verify approval hashes still match
- recheck critical evidence TTL
- recheck affiliate destination if present
- confirm media asset still eligible
- confirm post has not already been published
- confirm schedule is still within issue freshness window

Material changes move state to `invalidated` and require user review.

## 6. Idempotency

Each intended publication gets one stable idempotency key. Retries must first reconcile remote state rather than blindly posting again.

## 7. Unknown remote state

If request times out after submission and remote outcome is unclear:

1. enter `unknown_remote_state`
2. query official status/reconciliation endpoint when available
3. do not repost until existence is resolved
4. escalate to user if no reliable reconciliation exists

## 8. Retry policy

Retries are bounded and error-class specific:

- transient network/server failure before accepted submission: bounded exponential backoff
- authorization failure: stop and request credential/account action
- content/policy rejection: stop; no automated wording bypass
- unknown remote state: reconcile first

## 9. Cancellation

User can cancel any post before dispatch. If remote scheduling is later used, cancellation behavior must be verified against provider semantics.

## 10. Publishing adapter activation

Requires separate explicit approval after source/readiness design. Activation must document official API capability, permission, limits, idempotency/reconciliation semantics, secret handling, and a rollback plan.
