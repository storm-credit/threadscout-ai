# ThreadScout AI Project Constitution

## 1. Read and verify first

Read the README, project brief, success criteria, orchestra design, niche strategy, runtime/storage options, blind spots, traps, and decision log. Verify repository and branch state rather than assuming completion.

## 2. Automatic continuation boundary

Use existing context first and do not repeat answered questions. Reversible, local, credential-free work may continue automatically when assumptions are documented. Stop before spending, credentials, live external data, public posting, deletion, or irreversible actions.

## 3. Four options and success conditions

Compare four options before major UI, workflow, niche, runtime, provider, storage, or roster decisions. Every implementation states success criteria, non-goals, verification, and stop conditions.

## 4. Approval first

No post may be published without explicit human approval. Guardian pass is also required before queueing. Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement.

## 5. Truth and evidence

- Never claim personal use without a usage record.
- Separate verified facts, opinion, inference, unknown, and synthetic fixture data.
- Do not invent real product, price, seller, stock, effect, or review.
- Exact product identity, media origin/rights, and claim sources must remain explicit.
- Fixture values cannot be surfaced as current market truth.
- Hashes prove consistency, not factual truth.

## 6. Fixed six-agent orchestra

Exactly six agents exist: `orchestrator`, `scout`, `verifier`, `strategist`, `writer`, and `guardian`.

- No seventh, dynamic, removed, merged, renamed, or split role without explicit user approval, four options, decision log, and tests.
- There is no dedicated price agent.
- Only Orchestrator delegates.
- Specialists return structured artifacts to Orchestrator.
- Scheduler, publisher, metrics, and audit remain deterministic services.
- Guardian blockers cannot be bypassed.
- One Scout refinement, two Writer revisions, and twelve specialist invocations are the default limits.

## 7. Practical novel-item niche

Novelty alone is insufficient. Scout prioritizes problem clarity, short demonstration, utility, purchase intent, audience fit, identity confidence, and evidence readiness. The four angles are problem/result, mechanism/demo, buying checklist, and honest fit.

## 8. Prompt, schema, runtime, and tool rules

- Each agent has one detailed prompt and one output schema.
- Provider output passes schema and semantic validation before progression.
- Runtime config contains budgets for exactly six agents.
- Every invocation creates a metadata receipt.
- Every tool call passes through registry allowlists and a reviewed registered handler.
- Publication, purchase, payment, and equivalent tools are forbidden.
- Current provider is deterministic replay only.

## 9. Versioning and storage

- Canonical serialization and hashing behavior are part of the data contract.
- Persisted artifacts include roster/manifest, prompt, schema, parent, evidence, and integrity hashes.
- Tampered or stale artifacts cannot be treated as valid.
- Sources and artifacts are stored by content hash.
- Run events are append-only, sequential, isolated by run ID, and previous-hash chained.
- Phase 2D concurrency guarantees apply only inside one Node.js process.
- `.threadscout-data/` and all credentials remain outside Git.
- Fixture, provider, or source payloads must be sanitized before durable storage.
- Do not claim production durability until transactional cross-process storage is implemented.

## 10. Deviations and verification

Record where a plan failed, the original plan, change, reason, impact, and remaining risks. Run documentation checks, all tests, simulations, replay execution, storage-chain validation, and relevant user-flow checks before reporting completion.
