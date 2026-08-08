# Success Criteria and Stop Conditions

## Product criteria

1. The first mobile screen shows five candidates with reasons, uncertainty, exact-match status, rights status, and risks.
2. A selected candidate produces four meaningfully different approaches.
3. The user can edit, approve, hold, reject, and suppress.
4. No content reaches a queue without Guardian pass and explicit human approval.
5. Exact product identity, disclosure, media rights, and first-hand claims must be resolved before approval.
6. Similar products are labeled as alternatives.
7. Failures provide a readable reason and next action.

## Fixed orchestra criteria

1. Exactly six agents including one Orchestrator.
2. No dedicated price agent.
3. Only Orchestrator delegates.
4. Specialists return structured artifacts.
5. Strategist produces four angles and Writer produces four mapped drafts.
6. Guardian cannot be bypassed.
7. Human approval occurs after Guardian pass and before queueing.
8. No agent can publish externally.

## Runtime and persistence criteria

1. Budgets exist for exactly six agents and each run.
2. Outputs pass semantic and schema validation.
3. Every invocation creates a receipt.
4. Sources and artifacts are content addressed.
5. Stored artifacts contain prompt, schema, manifest, parent, evidence, and integrity hashes.
6. Every run has an isolated, validated event hash chain.
7. Changed evidence marks downstream artifacts stale.

## Phase 2E research criteria

1. Research policy disables network and mutation.
2. Only approved `fixture:` source schemes and fixture source types pass.
3. Source records include timestamps, policy, rights, retention, redaction, product mentions, purchase signals, and content hash.
4. Tampered source records fail validation.
5. Raw payload and personal-data storage are disabled.
6. Fixture research is deterministic and refuses writes.
7. Scout can use brokered search, trend, and normalization tools.
8. Verifier can use brokered listing, cross-source, rights, and commerce tools.
9. Writer cannot use public research tools.
10. Candidate evidence requires at least two source records and two source types for exact-match readiness.
11. Candidate evidence never replaces Verifier's exact-match decision.
12. Source records persist to the content-addressed store and hash-chained run events.
13. Evidence invalidation propagates to dependent artifacts.
14. No live source or external publication is enabled.

## Stop conditions

Stop when:

- source access would bypass terms, robots, permissions, or rate limits
- personal data or unlicensed media would be required
- exact identity relies on one unverified source
- output, source, artifact, stored object, or event integrity fails
- an artifact is stale after evidence changes
- a seventh agent appears necessary
- credentials, cost, or irreversible external action become necessary without approval
