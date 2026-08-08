# ThreadScout AI Project Constitution

These rules apply to every human or AI contributor.

## 1. Read before changing

Read `README.md`, project brief, success criteria, orchestra design, practical-novelty strategy, runtime options, blind spots, traps, and decision log. Verify repository state rather than assuming prior work exists.

## 2. Missing context and automatic continuation

Use conversation and repository information first. Do not repeat answered questions. Reversible, local, credential-free work may continue from recorded defaults when assumptions are documented. Stop before spending, credentials, live external data, public posting, or irreversible actions.

## 3. Success and stop conditions

Every task states user-visible success, technical verification, non-goals, and stop conditions. Do not improvise around permissions, identity, media rights, failed tests, or required decisions.

## 4. Blind spots, traps, and four options

Review product, legal, operational, platform, cost, security, source, runtime, tool, agent, and trust risks. Compare four options before major UI, workflow, niche, runtime, provider, or roster decisions.

## 5. Conservative implementation

Preserve behavior, avoid unrelated refactoring and unnecessary dependencies, and prefer reversible verifiable changes. Record deviations and remaining risks.

## 6. Approval first

No post may be published without explicit human approval. Guardian pass is also required before queueing. Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement.

## 7. Truth and fixtures

- Never claim personal use without a record.
- Separate verified fact, opinion, inference, unknown, and synthetic fixture data.
- Do not invent real product, seller, price, stock, effect, or review.
- Record media origin and rights.
- Distinguish exact, likely, substitute, and unresolved.
- Show affiliate disclosure visibly.
- Fixture values cannot be surfaced as current market truth.

## 8. Fixed six-agent orchestra

Exactly six agents exist: `orchestrator`, `scout`, `verifier`, `strategist`, `writer`, and `guardian`.

- No seventh, dynamic, removed, merged, renamed, or split role without user approval, four options, decision log, and tests.
- There is no dedicated price agent.
- Only Orchestrator delegates.
- Specialists return structured artifacts to Orchestrator.
- Scheduler, publisher, metrics, and audit remain deterministic services.
- Guardian blockers cannot be bypassed.
- Default orchestration limits remain one Scout refinement, two Writer revisions, and twelve specialist invocations.

## 9. Practical novel-item niche

Novelty alone is insufficient. Scout prioritizes problem clarity, short demonstration, utility, purchase intent, audience fit, identity confidence, and source readiness. Four content angles are problem/result, mechanism/demo, buying checklist, and honest fit.

## 10. Prompt and schema rules

Each agent has one detailed system prompt and one output schema. Outputs are one JSON object. Schema validation supplements semantic validation. Unknown or conflicting facts become blockers rather than invented fields.

## 11. Provider-neutral runtime

- Provider adapters receive fixed prompt, schema, run ID, agent ID, and structured input.
- Runtime config contains budgets for exactly six agents.
- Enforce timeout, attempts, input/output, total invocation, elapsed-time, and total output limits.
- Validate output before state progression.
- Create a receipt for every invocation.
- A provider cannot change the roster, gates, schemas, or publication policy.
- Current provider is deterministic replay only.
- Live provider credentials and cost require a separate approved phase.

## 12. Tool broker

- Every tool call passes through the broker and the registry allowlist.
- No unregistered handler executes.
- Publication, purchase, payment, or equivalent external-action tools are forbidden.
- A safe tool name does not make an unsafe implementation acceptable; handlers require review and schemas before live use.

## 13. Verification

Run documentation checks, all tests, fixture simulation, replay execution, and relevant user-flow checks. Do not claim completion from file creation alone.
