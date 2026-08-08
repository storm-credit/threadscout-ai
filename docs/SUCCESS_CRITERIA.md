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
9. Similar products are labeled as alternatives and never presented as the pictured exact product.
10. Failures show a human-readable reason and recoverable next action.

## Six-agent orchestra success criteria

1. The registry contains exactly six agents including one Orchestrator.
2. The roles are Orchestrator, Product Scout, Evidence Verifier, Content Strategist, Threads Writer, and Integrity Guardian.
3. No dedicated price agent exists.
4. Only the Orchestrator delegates.
5. Specialists return structured artifacts.
6. Guardian blockers cannot be bypassed.
7. Human approval occurs after Guardian pass and before queueing.
8. Scheduler, publisher adapter, metrics collector, and audit log remain deterministic services.
9. No agent can publish externally.
10. Bounded loops prevent circular handoffs.

## Phase 2B success criteria

1. All six agents have detailed system prompts.
2. Every prompt includes mission, inputs, allowed tools, forbidden actions, stop conditions, and a JSON output contract.
3. All six artifacts have machine-readable schemas.
4. Practical-novelty scoring prioritizes problem clarity, demonstration, and utility over novelty alone.
5. Gimmick-only candidates do not receive recommended status.
6. A deterministic synthetic product run invokes all six agents exactly once.
7. The fixture run produces four angles and four drafts.
8. Evidence Verifier owns one timestamped price/stock/seller/variant snapshot.
9. Guardian pass and human approval are required.
10. The completed fixture ends in a local-only queue with external publishing disabled.
11. Every fixture value that could be mistaken for current commerce data is marked synthetic.

## Technical verification criteria

- documentation check passes
- unit tests pass
- prompt-set tests pass
- schema tests pass
- practical-novelty scoring tests pass
- end-to-end fixture simulation passes
- orchestra registry and routing tests pass
- malformed or cross-run artifacts are rejected
- Guardian and human approval gate tests pass
- secrets are not committed
- external publishing remains disabled

## Stop conditions

Stop and request a decision when:

- required API permissions are unavailable
- platform capability or policy conflicts with the proposed workflow
- exact product identity or media rights cannot be verified
- a health or skincare claim cannot be supported
- an agent artifact fails its schema
- a loop or invocation limit is reached
- adding, removing, splitting, or merging an agent appears necessary
- Guardian returns a blocker
- fixture data would need to be represented as real evidence
- a test or build fails and the safe fix changes scope
- costs or rate limits exceed the accepted budget
