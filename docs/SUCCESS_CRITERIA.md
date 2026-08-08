# Success Criteria and Stop Conditions

## Product success criteria for the first usable release

1. The mobile first screen shows today's five recommended product candidates.
2. Each recommendation shows score, recommendation reasons, uncertainty, exact-match status, media-rights status, and key risks.
3. Selecting a candidate generates four meaningfully different draft approaches.
4. The user can edit, approve, hold, reject, and block future recommendations.
5. Every visible button and form in the release scope works end to end.
6. No content can reach the publishing queue without Guardian pass and explicit human approval.
7. A post cannot be approved if exact product identity, disclosure requirement, or media-rights status is unresolved.
8. A product not personally used cannot produce first-hand-experience language.
9. Similar products are clearly labeled as alternatives and never presented as the pictured exact product.
10. Failures show a human-readable reason and recoverable next action.

## Six-agent orchestra success criteria

1. The registry contains exactly six agents including one Orchestrator.
2. The fixed roles are Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian.
3. No dedicated price agent exists.
4. Evidence Verifier owns timestamped price, stock, seller, quantity, and variant evidence.
5. Only the Orchestrator delegates work.
6. Specialists return structured artifacts to the Orchestrator.
7. The Strategist returns exactly four distinct angles.
8. The Writer returns exactly four drafts mapped to those angles.
9. The Guardian independently returns pass, revise, or block.
10. Guardian blockers cannot be bypassed.
11. Human approval happens after Guardian pass and before queueing.
12. Scheduler, publisher adapter, metrics collector, and audit log remain deterministic services.
13. No agent can publish externally.
14. One Scout refinement, two Writer revisions, and a total invocation ceiling prevent unbounded loops.
15. Adding a seventh agent causes automated tests to fail.

## Technical verification criteria

- documentation check passes
- unit tests pass
- core approval-state integration tests pass
- orchestra registry and routing tests pass
- contract tests reject malformed or cross-run artifacts
- loop-limit tests pass
- Guardian and human approval gate tests pass
- duplicate-publication/idempotency test passes before live publishing
- mobile viewport review passes for user-facing changes
- secrets are not committed
- external publishing is disabled by default until explicitly configured

## Stop conditions

Stop and request a decision when:

- required API permissions are unavailable
- platform capability or policy conflicts with the proposed workflow
- exact product identity cannot be verified
- media usage rights cannot be verified
- a health or skincare claim cannot be supported
- an agent artifact fails its schema
- a Scout or Writer loop limit is reached
- adding, removing, splitting, or merging an agent appears necessary
- Guardian returns a blocker
- a test or build fails and the safe fix changes scope
- the requested implementation requires changing an agreed success criterion
- costs or rate limits exceed the accepted budget
- a repository or branch write cannot be completed with available permissions
