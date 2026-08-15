# ThreadScout AI Project Constitution

## 1. Verify context first

Read the README, `docs/spec/README.md`, Master Spec, requirements, user flows, agent contracts/handoffs, domain specs, traceability/acceptance tests, design freeze, blind spots, traps, and decision log. Verify repository and branch state rather than assuming completion.

## 2. Design authority and implementation freeze

`docs/spec/MASTER_SPEC.md` and the supporting `docs/spec/` set are the product/system design authority.

While `docs/spec/DESIGN_FREEZE.md` says design-only:

- do not add or modify runtime/product code
- do not activate live sources, models, credentials, affiliate actions, or publishing
- documentation, design analysis, source-policy research, and requirement clarification are allowed
- existing prototype code is evidence/prototype material, not the authority when it conflicts with the approved design

Implementation resumes only through the gate defined in `DESIGN_FREEZE.md`.

## 3. Automatic continuation boundary

Use existing context first. Reversible documentation/design work may continue automatically when assumptions and open questions are recorded. Stop before spending, credentials, live external data, public posting, deletion, irreversible actions, or implementation while the design freeze is active.

## 4. Four options and success conditions

Compare four options before major UI, workflow, niche, runtime, provider, storage, research-source, media strategy, or roster decisions. Every task states success criteria, non-goals, verification, and stop conditions.

Do not create four cosmetic variants merely to satisfy this rule. The four options must represent materially different approaches, tradeoffs, or operating models and should be presented so the owner can compare them at a glance.

## 5. Approval first

No post may be published without explicit human approval. Guardian pass is also required before queueing. Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement.

## 6. Truth and evidence

- Never claim personal use without a usage record.
- Separate verified fact, opinion, inference, unknown, and synthetic fixture data.
- Do not invent real product, price, seller, stock, effect, review, endorsement, or public-figure relationship.
- Exact product identity, claim sources, timestamps, media rights, and public-event context remain explicit.
- Hashes prove consistency, not factual truth.
- Fixture values cannot be surfaced as current market truth.
- Public visibility of an image/video does not imply reuse rights.

## 7. Fixed six-agent orchestra

Exactly six agents exist: `orchestrator`, `scout`, `verifier`, `strategist`, `writer`, and `guardian`.

- No seventh, dynamic, removed, merged, renamed, or split role without explicit user approval, four options, decision log, and tests.
- There is no dedicated price agent.
- Only Orchestrator delegates.
- Specialists return structured artifacts to Orchestrator.
- Guardian blockers cannot be bypassed.
- Scheduler, publisher, metrics, audit, source adapters, evidence store, media registry, and link mapper remain deterministic services.

## 8. Handoff rule

Use the artifact and handoff protocol in `docs/spec/AGENT_HANDOFFS.md`.

- Specialists do not call each other directly.
- Downstream facts come from the Verifier evidence packet, not fresh Writer research.
- Every handoff is versioned and references immutable inputs/evidence.
- Changed evidence marks downstream artifacts stale.
- Guardian revision requests are structured; Guardian does not silently become the Writer.

## 9. Public-figure and issue boundary

Public celebrity/broadcast/cultural issues may trigger product discovery only when public, product-relevant, and sourceable. Rumors/private-life speculation, health/appearance speculation, leaked/private material, and unsupported endorsement implications are blocked. Person identity must not be inferred from an image; textual/source context supplies public-figure identity/context.

## 10. Media boundary

A media reference may be usable for discovery/analysis without being publishable. Publication requires an explicit rights state for the intended action. Prefer user-owned or explicitly licensed media. Never fabricate imagery of a real public figure endorsing or using a product.

## 11. Runtime, tools, versioning, and storage

- Each agent has one prompt and one output schema.
- Outputs pass schema and semantic validation before progression.
- Runtime budgets cover exactly six agents and every invocation produces a receipt.
- Every tool call passes registry allowlists and a reviewed handler.
- Publication, purchase, payment, and equivalent tools are forbidden to agents.
- Sources and artifacts are content addressed; run events are sequential and hash chained.
- Tampered or stale artifacts cannot be treated as valid.
- `.threadscout-data/` and credentials remain outside Git.

## 12. Live source readiness

Every network source remains disabled until its source-specific gate is approved. Credentials alone cannot activate a source. Never silently fall back to scraping when official access is unavailable.

## 13. Traceability

Every implementation requirement must map through `docs/spec/TRACEABILITY_MATRIX.md` to design authority, owner, gate/artifact, and acceptance test. No code-only change may redefine product behavior.

## 14. Verification and deviations

Record where plans fail, the original plan, change, reason, impact, and remaining risks. Do not hide a deviation by rewriting the plan after the fact.

A deviation record must include:

- original plan
- where the plan stopped matching reality
- what changed
- why it changed
- affected requirements/design/tests
- remaining risk or follow-up

## 15. Interview gate — ask only for missing high-impact context

Before a major design or implementation slice, perform a context dump from the current conversation, repository, approved specs, decision log, prior user answers, and relevant evidence.

Then identify only unresolved questions that can materially change the result.

- Do not ask the owner to repeat information already present in the current context or repository.
- Ask at most 3–5 high-impact questions at a time when clarification is genuinely needed.
- If a safe, reversible default is sufficient, record the assumption and continue automatically instead of blocking.
- Ask before making a choice that changes product intent, primary user, irreversible scope, spending, credentials, live publication, or another high-impact boundary.
- Every implementation slice must state the user intent, primary user, job-to-be-done, success conditions, non-goals, and stop conditions before coding begins.

`docs/USER_INTERVIEW.md` is a question bank, not a script that must be repeated every time.

## 16. Reference-first gate — inspect examples before implementing

Before a substantial implementation slice, review 3–5 relevant examples when they can materially reduce design or implementation risk.

Reference type depends on the task:

- software: similar GitHub repositories, official framework examples, or primary documentation
- UI/UX: comparable product flows and interaction patterns
- research/source adapters: official source/API documentation and existing safe adapter patterns
- prompts/agents: relevant agent/prompt systems and evaluation patterns
- fiction/story work in other repositories: comparable works for structural reference, never copied prose

For each useful reference, record:

- what pattern is worth adopting
- what should not be adopted
- why it fits or conflicts with ThreadScout
- license or reuse constraints when code/content reuse is possible
- whether the reference changes the implementation plan

Do not cargo-cult code, prompts, architecture, or agent frameworks. Public visibility is not permission to copy. Prefer principles and small patterns over wholesale transplantation.

Existing project references include Karpathy-style simplicity/goal discipline, Superpowers-style design and verification gates, claude-video-style capability preflight/fallback, and agentmemory-style durable decision/evidence memory. Re-check references when the implementation domain changes materially.

## 17. Meta-prompting lifecycle

Use the canonical prompt lifecycle in `docs/spec/PROMPT_SYSTEM_SPEC.md` for substantial AI instructions:

1. context dump
2. missing-context questions
3. success criteria and stop conditions
4. execution-environment conversion
5. sample execution/failure classification when useful
6. prompt reduction
7. result review

Execution-environment conversion must make the instruction fit the actual executor:

- orchestration/goal prompt: objective, authority, budgets, stop conditions
- coding agent: constraints, repository authority, test/verification requirements
- image generation: composition, subject, style, lighting, camera/viewpoint, required text/format
- research agent: source hierarchy, scope/time window, verification method, uncertainty rules

Longer prompts are not automatically better. Remove repetition that does not protect authority, evidence, safety, recurring-failure prevention, output structure, or measurable success.

## 18. Completion proof gate — tests alone are not completion

Never claim a substantial slice is complete merely because code exists or automated tests pass.

Completion requires evidence appropriate to the slice, including all applicable items below:

- requirements and acceptance-test mapping reviewed
- automated tests passed
- real user flow exercised end-to-end
- UI checked at the required mobile width and desktop where applicable
- every visible button, form, and primary CTA actually works
- reload/interruption/state-transition/error behavior checked when applicable
- stale/blocked/unknown states fail closed
- diff reviewed for unintended scope or duplicated logic
- blind spots and pre-implementation traps rechecked against the finished behavior
- plan deviations recorded
- GitHub Actions checked
- success conditions compared against observed results
- unnecessary prompt/code/temporary scaffolding removed or explicitly retained with reason

For UI work, a screenshot that merely renders is insufficient. The primary value and CTA must be understandable on the first mobile screen, and the interactions must work.

For external integrations, mocked success is insufficient to claim live readiness. Live capability remains disabled until its activation/preflight gate is actually satisfied.

## 19. GitHub handoff discipline

GitHub is the persistent project handoff surface.

- Do not work directly on `main` for substantial changes; use a task branch.
- Commit meaningful checkpoints rather than one opaque final dump.
- Push source, tests, design updates, decision/deviation records, and verification artifacts that belong in version control.
- Never commit secrets, tokens, real `.env` values, unnecessary raw third-party media, local databases, caches, or generated junk.
- Open a PR for a completed substantial slice, inspect the diff, verify GitHub Actions, and fix failures before completion is claimed.
- Another agent should be able to recover the intent, decisions, current status, and next step from GitHub without relying on hidden local context.

## 20. Harness-before-coding gate

Master Design completion does not authorize ad-hoc coding from the old prototype.

Before the first implementation slice, read and obey:

- `docs/spec/HARNESS_BLUEPRINT.md`
- `docs/spec/HARNESS_ACCEPTANCE_MATRIX.md`
- `docs/spec/IMPLEMENTATION_GAP_ANALYSIS.md`
- `docs/spec/CODING_SPIKE_ENTRY.md`

The pre-baseline `simulate / replay / store / fixture / readiness` assets are useful prototype harness components, not the final executable specification.

For a new coding slice:

- classify affected existing modules as `KEEP / MODIFY / RETIRE / MISSING`
- select explicit fixture IDs and AT IDs
- keep live capabilities disabled unless the task is an approved activation slice
- use the canonical harness/report semantics rather than inventing a parallel truth source
- prove normal, blocked, and stale behavior where applicable
- do not widen the spike into UI/live/provider work merely because the existing prototype makes that convenient

The first coding task after Harness Design v1 is `CODING_SPIKE_ENTRY.md` unless the owner explicitly chooses a different bounded slice and records why.