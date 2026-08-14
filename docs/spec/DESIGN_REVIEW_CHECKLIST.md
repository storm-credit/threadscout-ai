# Master Design Review Checklist

Status: **PASS — Master Design v1 may be promoted/merged as design authority.**

This checklist distinguishes design completeness from live implementation verification. Runtime/account-specific checks that must occur later are recorded as activation gates rather than left as ambiguous design TODOs.

## Product

- [x] Core user and job-to-be-done defined
- [x] Primary content lanes defined
- [x] Issue-trigger lane bounded
- [x] Non-goals defined
- [x] MVP boundary defined
- [x] Daily operating model defined
- [x] Worked 20-to-5 selection example defined
- [x] Owner direction accepted and reversible defaults promoted

## Delivery platform

- [x] Four delivery-platform options compared
- [x] Mobile-first responsive web selected for v1
- [x] Desktop support retained for research-heavy review
- [x] PWA treated as optional enhancement rather than correctness dependency
- [x] Native iOS/Android excluded from MVP with evidence-based revisit gate
- [x] Server-authoritative cross-device state defined
- [x] Client posture defined: touch-first mobile Safari/Chrome plus evergreen desktop; exact implementation support matrix is a slice-level verification item
- [x] Upload byte/format limits deliberately classified as implementation configuration, not architecture authority

## UX / decision support

- [x] Four first-screen layout options compared
- [x] Four structural mobile wireframes documented
- [x] Opportunity Inbox selected as mobile primary view
- [x] Detailed screen set S01–S10 defined
- [x] Critical first-card fields defined for 360 px width
- [x] Guardian status placed before review CTA
- [x] Suppression controls defined
- [x] No hover-only critical behavior allowed
- [x] Visual styling is non-authoritative product polish and may be implemented without changing decision hierarchy

## Ranking and evidence

- [x] Opportunity score separated from evidence readiness, risk, freshness, and suppression
- [x] Score weights defined conceptually
- [x] Portfolio diversity behavior defined
- [x] Worked selection demonstrates score is not sovereign
- [x] Claim strength/evidence thresholds defined
- [x] High score cannot bypass a blocker
- [x] Initial 65/100 review floor promoted as a reversible heuristic, not a production truth claim

## Orchestra and prompts

- [x] Exactly six agents fixed
- [x] No price agent
- [x] Agent responsibilities defined
- [x] Agent inputs/outputs defined
- [x] Tool boundaries defined
- [x] Handoff envelope defined
- [x] Handoff schema/semantic/evidence/next-action gates defined
- [x] Orchestrator state machine defined
- [x] Retry/escalation rules defined
- [x] Prompt lifecycle and version discipline defined
- [x] Guardian and human review gates defined
- [x] Agent agreement explicitly cannot manufacture factual confidence

## Evidence, media, and issue triggers

- [x] Source hierarchy defined
- [x] Source independence/dependency behavior defined
- [x] Exact product states defined
- [x] Research media and final-use media separated
- [x] Four media strategy options compared
- [x] Dual-funnel strategy selected
- [x] Media fallback order defined
- [x] Issue source grades G0–G4 defined
- [x] Product relation grades R0–R5 defined
- [x] Issue-to-product action matrix defined
- [x] Rumor/private-life monetization blocked
- [x] Edge cases documented
- [x] Live source allowlists are activation-time configuration; unknown sources remain disabled
- [x] Source/asset/action-specific final-use permission is an activation/preflight requirement

## Content, commerce, and publishing

- [x] Four-angle content output contract defined
- [x] Research vs first-hand wording boundary defined
- [x] Commerce snapshot concept defined
- [x] Exact vs alternative mapping defined
- [x] Stale listing/destination mutation behavior defined
- [x] Review binding to exact artifact revisions defined
- [x] Publishing state and reconciliation model defined
- [x] Browser/PWA excluded from scheduling/publication authority
- [x] Coupang Partners selected as first affiliate target
- [x] MVP exact-product evidence may start from a user-supplied commercial destination + versioned identity snapshot
- [x] Current affiliate disclosure/link rules explicitly remain a live activation check, not a guessed design fact
- [x] Threads discovery/insights/publish adapter boundaries defined; target account scopes/tokens remain live activation checks

## Analytics

- [x] Attention/intent/commercial/trust metrics separated
- [x] Learning output bounded
- [x] Unsafe high-performing patterns excluded from learning
- [x] Daily vs weekly learning behavior defined
- [x] Partial/unavailable attribution is represented explicitly
- [x] Actual platform metric availability is an activation/configuration check

## Security / operations

- [x] Managed server/runtime + PostgreSQL + permitted object-store deployment class selected
- [x] Exact vendor left replaceable at implementation time
- [x] Production credentials restricted to server-side managed secret storage/encrypted injection
- [x] Secrets prohibited from Git, browser storage, prompts, artifacts, and normal logs
- [x] Global kill-switch requirement defined outside AI runtime
- [x] Unknown remote publish state requires reconciliation before retry
- [x] Dispatch authorization freshness required

## Blind spots / traps

- [x] Final cross-domain blind-spot sweep completed
- [x] Mobile/PWA/cross-device blind spots explicitly reviewed
- [x] Celebrity/media/approval-fatigue blind spots explicitly reviewed
- [x] Publishing/analytics/security/economics blind spots explicitly reviewed
- [x] Pre-implementation trap checklist expanded
- [x] All current B0 blind spots mapped to design authority and acceptance behavior
- [x] New/promoted B0 findings automatically reopen the affected slice gate

## Traceability / acceptance

- [x] `TRACEABILITY_MATRIX.md` consolidated
- [x] `ACCEPTANCE_TESTS.md` consolidated through AT-44
- [x] temporary acceptance/traceability addenda removed after consolidation
- [x] B0 traceability matrix complete for current sweep
- [x] no known core MVP domain lacks named authority

## Cross-spec review

- [x] Contradiction review completed before final sweep
- [x] Post-sweep consistency review recorded
- [x] Six-agent/no-price-agent rules consistent
- [x] Ranking/evidence/media rules consistent
- [x] Product match and alternative wording consistent
- [x] Daily quota and no-candidate behavior consistent
- [x] Mobile-web platform does not move scheduling/publication authority into the client

## Design governance

- [x] `docs/spec/` is design authority
- [x] `MASTER_SPEC.md` promoted to DESIGN APPROVED
- [x] runtime/product code unchanged during final design cycle
- [x] live capabilities fail closed until activation preflight
- [x] P0 items resolved or explicitly deferred behind disabled capabilities
- [x] reversible P1 defaults promoted
- [x] owner decision register updated
- [x] finalization gates closed
- [x] design PR eligible for Ready + merge

## Result

**Master Design v1 is complete as a design baseline.**

This checklist does not assert that the product is implemented, that current platform/account credentials are configured, or that any live external capability is enabled.
