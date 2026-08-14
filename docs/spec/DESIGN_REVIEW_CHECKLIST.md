# Master Design Review Checklist

Use this before declaring design complete.

## Product

- [x] Core user and job-to-be-done defined
- [x] Primary content lanes defined
- [x] Issue-trigger lane bounded
- [x] Non-goals defined
- [x] MVP boundary defined
- [x] Daily operating model defined
- [x] Worked 20-to-5 selection example defined
- [ ] User approves Master Spec direction

## Delivery platform

- [x] Four delivery-platform options compared
- [x] Mobile-first responsive web selected for v1
- [x] Desktop support retained for research-heavy review
- [x] PWA treated as optional enhancement rather than correctness dependency
- [x] Native iOS/Android excluded from MVP with evidence-based revisit gate
- [x] Server-authoritative cross-device state defined
- [ ] Supported browser/device matrix confirmed for implementation slice
- [ ] Mobile capture/upload constraints validated on target devices

## UX / decision support

- [x] Four first-screen layout options compared
- [x] Four structural mobile wireframes documented
- [x] Opportunity Inbox selected as mobile primary view
- [x] Detailed screen set S01–S10 defined
- [x] Critical first-card fields defined for 360 px width
- [x] Guardian status placed before review CTA
- [x] Suppression controls defined
- [x] No hover-only critical behavior allowed
- [ ] Final visual styling and interaction pattern approved

## Ranking and evidence

- [x] Opportunity score separated from evidence readiness, risk, and freshness
- [x] Score weights defined conceptually
- [x] Portfolio diversity behavior defined
- [x] Worked selection demonstrates score is not sovereign
- [x] Claim strength/evidence thresholds defined
- [x] High score cannot bypass a blocker
- [ ] Production score threshold calibrated

## Orchestra and prompts

- [x] Exactly six agents fixed
- [x] Agent responsibilities defined
- [x] Agent inputs/outputs defined
- [x] Tool boundaries defined
- [x] Handoff envelope defined
- [x] Orchestrator state machine defined
- [x] Retry/escalation rules defined
- [x] Prompt lifecycle and version discipline defined
- [x] Guardian and human review gates defined

## Evidence, media, and issue triggers

- [x] Source hierarchy defined
- [x] Exact product states defined
- [x] Research media and final-use media separated
- [x] Four media strategy options compared
- [x] Dual-funnel strategy selected
- [x] Media fallback order defined
- [x] Issue source grades G0–G4 defined
- [x] Product relation grades R0–R5 defined
- [x] Issue-to-product action matrix defined
- [x] Edge cases documented
- [ ] Exact live source allowlist approved
- [ ] Source-specific final-use policy reviewed at implementation time

## Content, commerce, and publishing

- [x] Four-angle content output contract defined
- [x] Research vs first-hand wording boundary defined
- [x] Commerce snapshot concept defined
- [x] Exact vs alternative mapping defined
- [x] Stale listing behavior defined conceptually
- [x] Review binding to exact artifact revisions defined
- [x] Publishing state and reconciliation model defined
- [x] Browser/PWA excluded from scheduling/publication authority
- [ ] First affiliate program confirmed
- [ ] Current disclosure/link rules confirmed
- [ ] Authorized exact-product listing source confirmed
- [ ] Live Threads capability confirmed

## Analytics

- [x] Attention/intent/commercial/trust metrics separated
- [x] Learning output bounded
- [x] Unsafe high-performing patterns excluded from learning
- [x] Daily vs weekly learning behavior defined
- [ ] Actual available metrics confirmed

## Blind spots / traps

- [x] Legacy blind-spot list exists
- [x] Final cross-domain blind-spot sweep completed
- [x] Mobile/PWA/cross-device blind spots explicitly reviewed
- [x] Celebrity/media/approval-fatigue blind spots explicitly reviewed
- [x] Publishing/analytics/security/economics blind spots explicitly reviewed
- [x] Pre-implementation trap checklist expanded for mobile web and cross-device state
- [x] B0 blind spots require traceability before affected implementation slice
- [x] All current B0 items mapped to design authority and acceptance behavior

## Cross-spec review

- [x] Contradiction review completed
- [x] Six-agent/no-price-agent rules consistent
- [x] Ranking/evidence/media rules consistent
- [x] Product match and alternative wording consistent
- [x] Daily quota and no-candidate behavior consistent
- [x] Mobile-web platform does not move scheduling/publication authority into the client

## Design governance

- [x] `docs/spec/` is design authority
- [x] Runtime/product code freeze is explicit
- [x] Design PR scope is documentation-only
- [x] Future Actions design checks are specified
- [x] P0/P1 table added
- [x] Platform direction promoted separately from provisional P1 values
- [x] Acceptance addendum extended through AT-44
- [x] Traceability addendum extended
- [x] B0 traceability matrix added
- [x] Detailed Review Round 2 recorded
- [ ] Deployment target selected
- [ ] Production credential storage selected
- [ ] Provisional TTL/retention defaults promoted or revised
- [ ] Master Design v1 approved and promoted from draft baseline

## Resume condition

Design is not “done” until required P0 items are resolved or explicitly deferred behind disabled features, required P1 defaults for the first implementation slice are promoted, and the Master Spec direction is approved. A green prototype-regression job does not lift the implementation freeze.
