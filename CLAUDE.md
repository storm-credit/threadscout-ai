# ThreadScout AI Project Constitution

These rules apply to every human or AI contributor.

## 1. Read before changing

Before editing code or documents, read:

1. `README.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/SUCCESS_CRITERIA.md`
4. `docs/AGENT_ORCHESTRA.md`
5. `docs/BLIND_SPOTS.md`
6. `docs/PRE_IMPLEMENTATION_TRAPS.md`
7. `docs/DECISION_LOG.md`

Do not assume a planned file, feature, integration, or previous completion exists. Verify the repository state first.

## 2. Ask only for missing context

Use the existing conversation and repository first. Do not repeat questions that have already been answered. Ask 3–5 high-impact questions at a time and provide a recommended default for difficult choices.

## 3. Define success and stopping conditions

Every implementation task must state:

- user-visible success conditions
- technical verification steps
- non-goals
- stop conditions

Stop and report rather than improvise when permissions, product identity, media rights, test results, or required decisions are unresolved.

## 4. Sweep blind spots before implementation

Review product, legal, operational, platform, cost, security, data quality, agent coordination, and user-trust risks. Update `docs/BLIND_SPOTS.md` when a new risk is discovered.

## 5. Check implementation traps first

Confirm API capabilities, token lifecycle, rate limits, idempotency, retry behavior, exact product matching, agent contracts, loop limits, data retention, secrets handling, and rollback before implementation. Update `docs/PRE_IMPLEMENTATION_TRAPS.md`.

## 6. Present four comparable options for major design decisions

Before locking a major UI, workflow, architecture, or agent-roster change, present four options in one comparable view. Include user flow, benefits, drawbacks, cost, complexity, largest risk, and recommended audience.

## 7. Study references without copying

Use similar GitHub projects and products as structural references. Record:

- what was studied
- what will be adopted
- what will not be adopted
- licensing or copying risks
- the reason for each decision

For creative-writing projects, references are for structure, reader expectation, and genre convention—not sentence, scene, character, or setting replication.

## 8. Implement conservatively

Preserve existing behavior. Avoid unrelated refactoring, premature abstraction, unnecessary dependencies, and scope expansion. Prefer the smallest verifiable change.

## 9. Approval first

No post may be published without explicit human approval. Do not implement automatic comments, likes, follows, or unsolicited engagement. Draft generation and recommendation may be automated; irreversible external actions require approval.

## 10. Truth and content integrity

- Never describe a product as personally used unless the record says it was used.
- Separate verified facts, user opinion, inference, and unknown information.
- Do not invent price, stock, effect, review, or product identity.
- Distinguish an exact product from a similar substitute.
- Record media origin and usage rights.
- Place affiliate disclosure where a reader can easily see it.
- Do not make medical, skincare, or health guarantees.

## 11. Record deviations

When blocked or when the plan changes, update `docs/DECISION_LOG.md` with:

- where the original plan failed
- the original plan
- the change
- the reason
- the impact
- remaining risks

Do not silently change direction.

## 12. Adapt prompts to the execution environment

- Goal prompt: include completion and stop conditions.
- Coding agent: include constraints, affected files, commands, tests, and rollback.
- Image generation: include composition, subject, style, lighting, camera direction, aspect ratio, and prohibited elements.
- Research agent: include source quality, scope, recency, verification method, and uncertainty format.

## 13. Refine prompts through evidence

Use this cycle:

context dump → missing-context questions → explicit success criteria → first prompt → sample outputs → failure classification → remove ineffective instructions → retain safety and recurring-failure rules → re-test → final output review

## 14. Verify before claiming completion

Run the relevant tests, build, lint, type checks, and user-flow checks. Every visible button and form in a claimed-complete scope must actually work. Do not report completion based only on file creation.

## 15. Fixed six-agent orchestra

The project has exactly six agents in total, including the Orchestrator:

1. `orchestrator`
2. `scout`
3. `verifier`
4. `strategist`
5. `writer`
6. `guardian`

Rules:

- Do not add a seventh or dynamically generated agent.
- Do not remove, merge, rename, or split an agent role without explicit user approval, four design options, a decision-log entry, and updated tests.
- There is no dedicated price agent. Price, stock, seller, quantity, model, and observation time are evidence fields owned by `verifier`.
- Only `orchestrator` may delegate work.
- Specialists return structured artifacts to `orchestrator`; they do not form hidden agent-to-agent conversations.
- Every agent must have a narrow mission, input contract, output contract, tool allowlist, forbidden actions, and stop conditions.
- Scheduler, publisher adapter, metrics collector, and audit log remain deterministic services, not agents.
- No agent may own or invoke external publication directly.
- Guardian blockers cannot be bypassed by the Orchestrator, Writer, or user-interface code.
- Default loop limits are one Scout refinement, two Writer revisions, and twelve total specialist invocations.
- Reaching a limit triggers a human decision; it never triggers creation of another agent.
