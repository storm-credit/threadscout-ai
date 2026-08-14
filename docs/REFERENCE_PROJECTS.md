# Reference Project Review

Reviewed on 2026-08-08. ThreadScout adopts principles and workflow patterns only; it does not copy implementation code or prompts.

## `multica-ai/andrej-karpathy-skills`

- License stated in README: MIT.
- Useful principles: think before coding, simplicity first, surgical changes, goal-driven execution.
- Adopted: explicit assumptions, measurable success, minimal scope, changes traceable to the task.
- Not adopted: wholesale replacement of the project-specific `CLAUDE.md`.

## `obra/superpowers`

- License stated in README: MIT.
- Useful principles: brainstorm before coding, design approval, small implementation tasks, test-driven work, verification before completion, branch finishing workflow.
- Adopted: four-option design gate, feature branch, tests before completion claims, spec and code review separation.
- Not adopted: mandatory subagent framework or plugin dependency for this small prototype.

## `bradautomates/claude-video`

- License: MIT.
- Useful principles: progressive fallback, bounded resource budgets, explicit setup checks, grounded outputs, cleanup.
- Adopted: external capability preflight, bounded candidate/draft volume, local-only fallback, explicit unavailable-state messaging.
- Not adopted: video tooling, download workflow, or media extraction code.

## `rohitg00/agentmemory`

- License: Apache-2.0.
- Useful principles: durable decision memory, confidence and lifecycle, searchable evidence, cross-session continuity.
- Adopted: decision log, audit events, evidence state, explicit timestamps and lifecycle transitions.
- Not adopted: external memory server, MCP integration, or infrastructure dependency during Phase 1.

## `Lum1104/Understand-Anything`

The exact repository supplied by name was not resolvable during review. Search returned forks and related repositories, but not a verifiable original repository under that exact owner/name. No code or design was adopted from an unverified substitute.

## Guardrail

Public visibility is not permission to copy. ThreadScout records what is adopted, what is rejected, and why; code or content reuse requires a verified license and attribution obligations.

---

# Slice 1 domain review — approval-first review pipeline

Reviewed on 2026-08-14 for implementation slice `S1 — Manual Candidate Approval Pipeline`. The 2026-08-08 review above covered agent *working method*. This review covers the slice's actual domain: typed artifact handoffs, durable run state, draft/approval version binding, append-only integrity, and narrow-width review queues.

No code, prompt, or schema was copied from any reference. Only structural patterns were considered.

## `openai/openai-agents-js`

- License: MIT (verified on the repository page).
- Relevant patterns: explicit *handoff* as a first-class construct rather than free-form agent chat; *guardrails* as configurable input/output checks separate from the agent's own instructions; structured output enforced by schema; built-in human-in-the-loop interruption points.
- Adopt: handoff as a named, validated object; guardrail checks that run outside the producing agent's own reasoning (this is our Guardian-independence requirement, BS-32).
- Do not adopt: the framework itself, agent-as-tool hierarchies, or dynamic agent creation. ThreadScout's roster is fixed at six by `MASTER_SPEC.md`; a framework that makes new agents cheap works against our constitutional invariant.
- Conflict: its handoff model lets agents delegate to each other. Our `AGENT_HANDOFFS.md` requires a star topology where only the Orchestrator routes. We keep the star.
- Changes the plan? No.

## `langchain-ai/langgraphjs`

- License: MIT (verified on the repository page).
- Relevant patterns: durable execution via checkpointers so a run resumes exactly where it stopped; `interrupt`/resume for human review; state inspection and modification at any point.
- Adopt: the principle that a run is resumable server-side state, not in-flight process memory. This is the direct answer to BS-06/AT-35 — a human approval pause must survive process and browser lifecycle.
- Do not adopt: the graph/Pregel execution model or the dependency. Our stage sequence is fixed and linear with defined back-edges (`ORCHESTRATOR_STATE_MACHINE.md`); a general graph runtime adds expressive power we are specifically trying not to have.
- Conflict: LangGraph lets human-in-the-loop *modify agent state* directly. `APPLICATION_INTERFACE_SPEC.md` forbids that — our client sends intent, never authoritative state. We keep the stricter rule.
- Changes the plan? Yes, mildly: it confirmed that run resumption must be reconstructible from persisted artifacts alone, so the API exposes no in-memory run handle.

## `payloadcms/payload`

- License: MIT (verified on the repository page).
- Relevant patterns: the strongest match in this review. Documents carry a `_status` field; drafts live in a separate versions table while published state lives in the main collection; the Admin UI shows three states — **Draft**, **Published**, and **Changed** (published but a newer draft exists). Draft writes skip required-field validation; publishing requires explicitly setting `_status: 'published'`; publish capability is gated by access control, and the publish button disappears when the constraint blocks it.
- Adopt: (a) the **Changed** tri-state, which is exactly our `stale` approval condition — approved-then-upstream-moved is a distinct visible state, not an error; (b) the split between a mutable operational record and an immutable version series, matching `SYSTEM_ARCHITECTURE.md`'s persistence boundary; (c) hiding/disabling the publish affordance from the gate rather than validating after the click.
- Do not adopt: skipping validation on draft writes. Our Verifier/Guardian gates must run on the draft itself, because the draft is the thing under review, not a scratch buffer.
- Conflict: Payload's gate is role-based access control. Ours is evidence-based and cannot be satisfied by any role — no permission level lets a human override a Guardian `block`.
- Changes the plan? Yes: adopted the explicit tri-state naming for approval (`current` / `approved` / `stale`) instead of encoding staleness as a validation failure.

## `holepunchto/hypercore`

- License: MIT (verified on the repository page).
- Relevant patterns: append-only log whose integrity is provable via a merkle tree; any modification of an earlier block produces a detectable inconsistency; verification is possible on a subset without reading the whole log.
- Adopt: confirmation that our existing `evidence-store.mjs` design (sequential events, `previousEventHash`, `payloadHash`, `eventHash`) is the right shape, and that chain validation should be a callable operation rather than an assumption.
- Do not adopt: signatures, merkle proofs, replication, or the dependency. We are single-owner and single-process; Ed25519 signing would imply an identity/key-management surface that `P0-05` has explicitly deferred, and adding key material to a public repository's runtime path is the wrong direction (BS-51).
- Conflict: none, but its guarantee is worth restating in our terms — a hash chain proves *consistency*, not *truth*. `CLAUDE.md` §6 already says this; the reference reinforced it rather than changing it.
- Changes the plan? Yes, one item: added a partial/truncated final-line recovery requirement for the JSONL event log, since an append-only log's failure mode is a torn last write.

## `mastodon/mastodon`

- License: **AGPL-3.0** (verified on the repository page). **Read-only reference. No code, markup, or CSS may be reused.**
- Relevant patterns: a moderation report queue that a human works through on narrow screens, where each item must expose its severity and next action before the reviewer opens it.
- Adopt: the general principle only — queue items surface the deciding fact and the action at list level, so the reviewer is not forced into a detail page to triage. This supports AT-32 and BS-10.
- Do not adopt: anything implementable. Given AGPL, we did not read or reuse its templates, styles, or state machine. The pattern above is a widely known UI convention, not a Mastodon invention, and our card hierarchy comes from `MOBILE_WIREFRAMES.md`, which predates this review.
- Changes the plan? No.

## Net effect on the implementation plan

1. Run state is durable server-side and reconstructible from persisted artifacts (LangGraph).
2. Approval carries an explicit tri-state including a visible `stale`, not a validation error (Payload).
3. Guardian checks run outside the producing agent's reasoning path (OpenAI Agents SDK).
4. The event log needs torn-final-write recovery and a callable chain validation (Hypercore).
5. No new runtime dependency is justified by this review. Every adopted item is a structural principle already compatible with the zero-dependency Node baseline.
