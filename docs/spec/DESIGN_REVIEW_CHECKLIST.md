# Master Design Review Checklist

Use this before declaring design complete.

## Product

- [x] Core user and job-to-be-done defined
- [x] Primary content lanes defined
- [x] Issue/public-figure lane bounded
- [x] Non-goals defined
- [ ] User approves Master Spec direction

## Orchestra

- [x] Exactly six agents fixed
- [x] Agent responsibilities defined
- [x] Agent inputs/outputs defined
- [x] Tool boundaries defined
- [x] Handoff envelope defined
- [x] Retry/escalation rules defined
- [x] Guardian/human gates defined

## Evidence and media

- [x] Source hierarchy defined
- [x] Source roles/independence rule defined
- [x] Exact product states defined
- [x] Media analysis vs publication-right distinction defined
- [x] Public-figure relationship classes defined
- [ ] Exact live issue/news source allowlist approved
- [ ] Exact media source/action policy reviewed at implementation time

## Commerce and affiliate

- [x] Commerce snapshot concept defined
- [x] Exact vs alternative affiliate mapping defined
- [x] Stale price/listing behavior defined conceptually
- [ ] First affiliate network/program confirmed
- [ ] Current disclosure/link policy confirmed
- [ ] Authorized exact-product listing evidence source confirmed

## Publishing

- [x] State model defined
- [x] Human approval binding defined
- [x] Idempotency and unknown-remote-state design defined
- [x] Preflight invalidation defined
- [ ] Live Threads publishing capability/permission confirmed

## Analytics

- [x] Attention/intent/commercial/trust metrics separated
- [x] Learning output bounded
- [x] Viral-but-unsafe pattern excluded from learning
- [ ] Actual available metrics confirmed from live source/account

## Security/operations

- [x] Secret boundary defined
- [x] Fail-closed behavior defined
- [x] Traceability matrix exists
- [x] Behavioral acceptance tests exist
- [ ] Deployment target selected
- [ ] Secret manager/environment selected
- [ ] Retention/TTL defaults approved

## Resume condition

Design is not “done” until all P0 items are checked or explicitly deferred behind disabled features and the user approves the Master Spec direction.
