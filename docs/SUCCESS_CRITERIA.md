# Success Criteria and Stop Conditions

## Product criteria

1. The mobile first screen shows five recommended product candidates with reasons, uncertainty, exact-match status, rights status, and risks.
2. A selected candidate produces four meaningfully different approaches.
3. The user can edit, approve, hold, reject, and suppress.
4. No content reaches a queue without Guardian pass and explicit human approval.
5. Unresolved identity, disclosure, rights, or unsupported first-hand language blocks approval.
6. Similar products are labeled as alternatives.
7. Failures provide a readable reason and next action.

## Fixed orchestra criteria

1. Exactly six agents including one Orchestrator.
2. No dedicated price agent.
3. Only Orchestrator delegates.
4. Specialists return structured artifacts.
5. Strategist produces four angles; Writer produces four mapped drafts.
6. Guardian returns pass, revise, or block and cannot be bypassed.
7. Human approval occurs after Guardian pass and before queueing.
8. Deterministic services remain outside the agent roster.
9. No agent can publish externally.
10. Bounded loops prevent circular execution.

## Practical novel-item criteria

1. Problem clarity, demonstration, and practical utility account for 60% of the score.
2. Gimmick-only candidates cannot receive recommended status.
3. Identity confidence and two source references are required.
4. High-risk health claims and blocked categories cannot pass automatically.
5. Product, seller, price, stock, option, rights, and timestamp are verified together.

## Phase 2C runtime criteria

1. Runtime configuration contains budgets for exactly six agents.
2. Every agent has timeout, attempt, input, and output limits.
3. Every run has total invocation, elapsed-time, and output limits.
4. Provider adapters receive the fixed prompt and output schema.
5. Every output passes semantic and schema checks before stage progression.
6. Every invocation creates a receipt.
7. Tool broker rejects non-allowlisted tools.
8. Publication, purchase, and payment tools are blocked.
9. Replay runtime completes all six agents and ends local-only.
10. Malformed and oversized outputs fail without advancing the run.
11. Human rejection produces no queue record.

## Stop conditions

Stop when:

- an output fails schema or semantic validation
- a budget or orchestration limit is reached
- identity, media rights, or high-risk claims remain unresolved
- a new/seventh agent appears necessary
- a tool cannot be isolated to an existing allowlist
- a provider requires weaker contracts
- fixture evidence could be confused with current facts
- credentials, cost, or irreversible external action become necessary without approval
