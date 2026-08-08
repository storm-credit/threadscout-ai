# Success Criteria and Stop Conditions

## Product criteria

1. The mobile first screen shows five candidates with reasons, uncertainty, exact-match status, rights status, and risks.
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
6. Guardian returns pass, revise, or block and cannot be bypassed.
7. Human approval occurs after Guardian pass and before queueing.
8. Deterministic services remain outside the agent roster.
9. No agent can publish externally.
10. Bounded loops prevent circular execution.

## Practical novel-item criteria

1. Problem clarity, demonstration, and utility account for 60% of the score.
2. Gimmick-only candidates cannot receive recommended status.
3. Identity confidence and at least two source references are required.
4. High-risk health claims and blocked categories cannot pass automatically.
5. Product, seller, price, stock, option, rights, and timestamp are verified together.

## Provider runtime criteria

1. Runtime config contains budgets for exactly six agents.
2. Every agent has timeout, attempt, input, and output limits.
3. Every run has total invocation, elapsed-time, and output limits.
4. Outputs pass semantic and schema validation before progression.
5. Every invocation creates a receipt.
6. Tool broker rejects non-allowlisted and external-action tools.
7. Replay execution ends local-only.

## Phase 2D persistence criteria

1. Canonical serialization is stable across object key order.
2. The manifest hashes the roster, six prompts, and six schemas.
3. Every persisted artifact records version and dependency hashes.
4. Tampered artifact content fails integrity validation.
5. Changed evidence marks downstream artifacts stale.
6. Sources and artifacts are stored by SHA-256 content address.
7. Every run has an isolated append-only event stream.
8. Event sequence, payload, previous hash, and event hash are validated.
9. Concurrent writes in one process remain sequential.
10. The full replay run stores six artifacts, invocation records, human decision, and local queue event.
11. Human rejection creates no queue record.
12. External publishing remains disabled.

## Stop conditions

Stop when:

- output, artifact, stored object, or event-chain integrity fails
- a runtime or orchestration budget is reached
- exact identity, media rights, or high-risk claims remain unresolved
- an artifact is stale after evidence changes
- a seventh agent appears necessary
- a tool cannot be isolated to an existing allowlist
- credentials, cost, live personal data, or irreversible external action become necessary without approval
