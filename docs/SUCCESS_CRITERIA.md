# Success Criteria and Stop Conditions

## Product success criteria for the first usable release

1. The mobile first screen shows today's five recommended product candidates.
2. Each recommendation shows score, recommendation reasons, uncertainty, exact-match status, media-rights status, and key risks.
3. Selecting a candidate generates four meaningfully different draft approaches.
4. The user can edit, approve, hold, reject, and block future recommendations.
5. Every visible button and form in the release scope works end to end.
6. No content can reach the publishing queue without explicit approval.
7. A post cannot be approved if exact product identity, disclosure requirement, or media-rights status is unresolved.
8. A product not personally used cannot produce first-hand-experience language.
9. Similar products are clearly labeled as alternatives and never presented as the pictured exact product.
10. Failures show a human-readable reason and recoverable next action.

## Technical verification criteria

- type check passes
- lint passes
- unit tests pass
- core approval-state integration tests pass
- duplicate-publication/idempotency test passes
- mobile viewport review passes
- secrets are not committed
- external publishing is disabled by default until explicitly configured

## Stop conditions

Stop and request a decision when:

- required API permissions are unavailable
- platform capability or policy conflicts with the proposed workflow
- exact product identity cannot be verified
- media usage rights cannot be verified
- a health or skincare claim cannot be supported
- a test or build fails and the safe fix changes scope
- the requested implementation requires changing an agreed success criterion
- costs or rate limits exceed the accepted budget
- a repository or branch write cannot be completed with available permissions
