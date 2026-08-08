# ThreadScout AI Project Constitution

These rules apply to every human or AI contributor.

## 1. Read before changing

Before editing, read `README.md`, `docs/PROJECT_BRIEF.md`, `docs/SUCCESS_CRITERIA.md`, `docs/AGENT_ORCHESTRA.md`, `docs/SINBAK_ITEM_STRATEGY.md`, `docs/BLIND_SPOTS.md`, `docs/PRE_IMPLEMENTATION_TRAPS.md`, and `docs/DECISION_LOG.md`. Verify repository state rather than assuming prior work exists.

## 2. Ask only for missing context

Use existing conversation and repository information first. Do not repeat answered questions. When a reversible implementation can proceed from recorded defaults, document assumptions and continue; stop before credentials, spending, public posting, or other irreversible actions.

## 3. Define success and stopping conditions

Every task must state user-visible success conditions, technical verification, non-goals, and stop conditions. Stop rather than improvise when permissions, identity, media rights, tests, or required decisions are unresolved.

## 4. Sweep blind spots and traps

Review product, legal, operational, platform, cost, security, data quality, agent coordination, source recency, and user-trust risks before implementation. Record new risks in the relevant document.

## 5. Present four options for major changes

Before locking a major UI, workflow, architecture, niche, runtime, or agent-roster change, compare four options with benefits, drawbacks, cost, complexity, and largest risk.

## 6. Study references without copying

Record what was studied, adopted, rejected, why, and any license risk. Public visibility is not permission to copy code, prompts, media, or creative material.

## 7. Implement conservatively

Preserve existing behavior. Avoid unrelated refactoring, unnecessary dependencies, and scope expansion. Prefer small, verifiable, reversible changes.

## 8. Approval first

No post may be published without explicit human approval. Guardian pass is also required before human approval can move content into a queue. Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement.

## 9. Truth and content integrity

- Never claim personal use without a usage record.
- Separate verified facts, opinion, inference, fixture data, and unknown information.
- Do not invent real price, stock, seller, effect, review, or product identity.
- Distinguish exact product, likely match, substitute, and unresolved.
- Record media origin and rights.
- Place affiliate disclosure visibly.
- Do not make unsupported health, skincare, or child-development claims.
- Synthetic fixture evidence must be labeled and cannot be surfaced as current market truth.

## 10. Record deviations

When blocked or changing plan, record where the original plan failed, the original plan, the change, reason, impact, and remaining risks in `docs/DECISION_LOG.md`.

## 11. Prompt adaptation and refinement

Goal prompts include completion and stop conditions. Coding prompts include constraints, affected files, commands, tests, and rollback. Research prompts include source quality, scope, recency, verification, and uncertainty. Refine through sample output, failure classification, instruction reduction, and retesting.

## 12. Verify before completion

Run relevant documentation, unit, integration, schema, simulation, build, and user-flow checks. Do not claim completion from file creation alone.

## 13. Fixed six-agent orchestra

The project has exactly six agents:

1. `orchestrator`
2. `scout`
3. `verifier`
4. `strategist`
5. `writer`
6. `guardian`

Rules:

- No seventh, dynamic, removed, merged, renamed, or split agent without explicit user approval, four options, decision log, and updated tests.
- There is no dedicated price agent.
- Only Orchestrator delegates.
- Specialists return structured artifacts to Orchestrator.
- Every agent has a narrow mission, inputs, output schema, tool allowlist, forbidden actions, and stop conditions.
- Scheduler, publisher adapter, metrics collector, and audit log are deterministic services.
- No agent owns external publication.
- Guardian blockers cannot be bypassed.
- Default limits are one Scout refinement, two Writer revisions, and twelve total specialist invocations.

## 14. Current niche: 실용 신박템

- Novelty alone never justifies recommendation.
- Product Scout prioritizes problem clarity, short demonstration, practical utility, purchase intent, and audience fit.
- Practical utility under 60, demonstration under 55, problem clarity under 55, weak identity confidence, fewer than two sources, blocked categories, and health-claim risk prevent automatic recommendation.
- Pure curiosity items are limited supporting content.
- Product Scout proposes; Evidence Verifier confirms exact product and commerce evidence.
- Four strategy angles are problem/result, mechanism/demo, buying checklist, and honest fit.

## 15. Phase 2B fixture/runtime rule

- System prompts must request one structured JSON object.
- Schema validation supplements semantic contract validation.
- Full-run fixtures must be deterministic and explicitly synthetic.
- Fixture product, price, seller, stock, rights, and source values cannot be presented as live facts.
- No network, paid model, affiliate, or publishing call is allowed in Phase 2B.
