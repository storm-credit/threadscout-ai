# ThreadScout AI Project Constitution

## 1. Verify context first
Read `README.md`, `docs/spec/README.md`, `MASTER_SPEC.md`, domain specs, traceability/acceptance matrices, `DESIGN_FREEZE.md`, `BLIND_SPOTS.md`, `PRE_IMPLEMENTATION_TRAPS.md`, `IMPLEMENTATION_STATUS.md`, and `DECISION_LOG.md`. Verify repository and branch state from git and tests rather than assuming completion.

## 2. Design authority and implementation freeze
`docs/spec/MASTER_SPEC.md` and supporting `docs/spec/` documents are the canonical product/system authority. While `docs/spec/DESIGN_FREEZE.md` is active (`declared, not enforced` until a CI diff-scope job runs):
- do not add or modify runtime/product code without an explicit owner-approved bounded slice satisfying `DESIGN_FREEZE.md`
- do not activate live sources, models, credentials, affiliate actions, or external publishing
- documentation, design analysis, watch-vault intake (`docs/watch/`), and requirement clarification are allowed
- existing prototype code is regression/prototype evidence, never authority when it conflicts with `docs/spec/`

## 3. Automatic continuation boundary
Use repository context first. Reversible documentation/design work may continue when assumptions and open questions are recorded (`declared, not enforced`). Stop before spending, credentials, live external data, public posting, deletion, irreversible side effects, or unapproved code edits (`declared, not enforced` in coding-host sessions; `interrupt_before` required in runtime code).

## 4. Four options and success conditions
Compare four materially different options (never cosmetic variants) before major UI, workflow, niche, runtime, provider, storage, source, media, commercial-surface, or roster decisions (`declared, not enforced`). Every task states success criteria, non-goals, verification, and stop conditions.

## 5. Approval first
No post may be published without explicit human approval. Guardian `pass` is required before queueing (enforced in code). Do not automate comments, likes, follows, purchases, payments, or unsolicited engagement (enforced for agents in `agent-registry.mjs` / `tool-broker.mjs` and for single-post `no reply_to_id` publishing payloads in `threads-publisher-service.mjs`; external host/CLI usage remains `declared, not enforced`, and live network publishing remains disabled).

## 6. Truth and evidence
- Never claim personal use without a verified `UsageRecord` (enforced in `guardian-checks.mjs`).
- Separate verified fact, opinion, inference, `UNVERIFIED` hypothesis, unknown, and synthetic fixture data.
- Never invent product, price, seller, stock, effect, review, endorsement, or public-figure relationship.
- Exact product identity (`exact / likely / substitute / unresolved`), claim sources, timestamps, media rights, and public-event context remain independent axes; hashes prove lineage consistency, not factual truth.
- Public visibility of text/media never implies collection, republication, or commercial reuse rights.

## 7. Fixed six-agent orchestra
Exactly six runtime agents exist: `orchestrator`, `scout`, `verifier`, `strategist`, `writer`, and `guardian` (enforced in `agent-registry.mjs`).
- No seventh, dynamic, removed, merged, renamed, or split agent without explicit owner approval, four-option review, decision-log entry, and contract tests.
- There is no dedicated price or affiliate-yield agent; volatile price/stock/seller snapshots belong to `verifier`, and commission/ROI math belongs to deterministic services.
- Only `orchestrator` delegates; specialists return structured artifacts to `orchestrator`; Guardian `block` decisions cannot be bypassed.
- Scheduler, publisher, metrics, audit, source adapters, evidence store, media registry, affiliate/ROI mapper, and public showcase projector remain deterministic non-agent services.

## 8. Handoff rule
Follow `docs/spec/AGENT_HANDOFFS.md`: specialists never call peers directly; downstream factual claims come solely from the `verifier` evidence packet; every handoff binds immutable input versions; upstream mutations mark downstream artifacts and approvals `stale` (enforced in Spike 0 / C-slice store); Guardian returns structured findings rather than rewriting copy.

## 9. Public-figure and issue boundary
Public celebrity/broadcast/cultural moments may trigger discovery only when public, product-relevant, and sourceable (`G0–G3`, `R0–R4`). Rumor/private-life (`G4`/`R5`), health/appearance speculation, leaked material, image-inferred person identity, and unverified endorsement implications are blocked.

## 10. Media boundary
Discovery/analysis media state and final-use publication rights are independent (`MEDIA_PIPELINE.md`). Publication requires explicit action-specific rights (`user_owned > licensed_commercial > permitted_embed > text_only > hold`). Never fabricate imagery implying a real public figure used or endorsed a product.

## 11. Runtime, tools, versioning, and storage
- Each agent has one prompt and one output schema, recording prompt/schema versions and an audit receipt on every call, including preflight budget rejections (enforced in `model-runtime.mjs`).
- Every tool call passes closed allowlists and forbids agent access to publishing or payment tools (enforced in `tool-broker.mjs`). Wrapping untrusted external, MCP, and owner-pasted `user_evidence` inputs in per-call CSPRNG passive-data fences is enforced unconditionally in `model-runtime.mjs` and `application-state.mjs` (`passive-data-fencer.mjs`), and child-process secret scrubbing (`scrubSubprocessEnv` in `scrub-env.mjs`) is provided for subprocess boundaries (no runtime path currently spawns child processes).
- Candidate-lifecycle run budgets cap cumulative invocations, tokens/chars, and KRW cost across all retries for `(candidate_id, lifecycle_epoch)` (enforced by default in `model-runtime.mjs`, `application-state.mjs`, and `sqlite-store.mjs` `lifecycle_budgets`, reset solely by `reopen_rejected_candidate` from `'rejected'`).
- Public showcase cards project only a closed default-deny 9-field allowlist (enforced in `public-showcase-projector.mjs` and read-only SQLite WAL `/api/showcase` in `sqlite-store.mjs`).
- `.threadscout-data/` and credentials remain outside Git (enforced by `.gitignore` and AT-20 tests; `gitleaks --redact` `Floor Guard` is `declared, not enforced` / `NOT_MEASURED` locally until binary/CI job is installed).

## 12. Live source readiness and anti-scraping rule
Every network source stays disabled (`ready: false` in `live-source-registry.mjs`) until its account-specific gate and explicit human activation approval pass. Never fall back to unauthorized scraping — whether browser CUA/Playwright or plain HTTP `fetch`/`curl` HTML parsing — when official API access is unavailable (code broker allowlist + `declared, not enforced` outside runtime).

## 13. Traceability
Every requirement maps through `docs/spec/TRACEABILITY_MATRIX.md` and `B0_TRACEABILITY_MATRIX.md` to design authority, owner, artifact/gate, and `AT-*` acceptance criteria. Follow the 8-step change-control sequence in `TRACEABILITY_MATRIX.md` before any implementation task (`declared, not enforced` until design-CI checks run).

## 14. Verification and deviations
Never rewrite history to hide plan drift (`declared, not enforced`). Every deviation record states: original plan, mismatch point, exact change, reason, affected requirements/specs/tests, and residual risk.

## 15. Interview gate
Dump repository/spec/decision context first, then ask at most 3–5 unresolved high-impact questions before choices affecting intent, primary user, public surfaces, spending, credentials, live publication, or constitutional boundaries (`declared, not enforced`). Record safe reversible defaults explicitly.

## 16. Reference-first gate
Before substantial implementation, inspect 3–5 primary docs, official SDKs, or comparable repositories and record adopted patterns, rejected patterns, fit/conflict rationale, license constraints, and plan impact under `docs/implementation/` (`declared, not enforced`). Never copy unlicensed code or prose.

## 17. Meta-prompting lifecycle
Follow `docs/spec/PROMPT_SYSTEM_SPEC.md` and `os-preflight` §7: dump context, ask before shaving, fix success/stop conditions, translate to executor constraints (orchestrator, coder, research, image), shave redundant prose, bound tools/context, execute, and verify independently (`declared, not enforced`).

## 18. Completion proof gate
Passing automated tests is the floor, never completion proof (`declared, not enforced`). Completion requires evidence bearing on the claimed behaviour: requirement/AT mapping, full `npm run verify`, end-to-end user flow, 360px touch-only mobile + desktop UI hit-tested controls where applicable, reload/CAS/stale/blocked fail-closed checks, diff/trap/B0 review, deviation log, and green GitHub Actions. Mocked external calls never prove live readiness.

## 19. GitHub handoff discipline
Work on task branches rather than `main`, commit meaningful checkpoints, never commit secrets/raw third-party media/local stores, open a PR, inspect diffs, and verify GitHub Actions (`declared, not enforced` locally; branch protection on remote). External watch intake lives in `docs/watch/` and never overwrites `docs/spec/` canon directly.

## 20. Harness-before-coding gate
Before any coding slice, obey `HARNESS_BLUEPRINT.md`, `HARNESS_ACCEPTANCE_MATRIX.md`, `IMPLEMENTATION_GAP_ANALYSIS.md`, and `CODING_SPIKE_ENTRY.md`: name baseline `main` SHA, classify modules `KEEP/MODIFY/RETIRE/MISSING`, bind explicit `F*` and `AT-*` IDs, keep unapproved live capabilities off, and prove normal, blocked, and stale paths (`declared, not enforced`).

## 21. Minimum Action Agent OS

This project follows the `minimum-action-agent-os` working method.

- Minimize local action space. The `minimum-action-agent-os` plugin's `rules/local-action-space.md` governs the bound (`<= 5` meaningful choices where a model selects), what counts as an action, its payload test, and the record a node owes (scope limit, waiver, or deterministic-node record). Read it when sizing or auditing a node; do not maintain a hand-edited restatement here.
- The bound is per node, not a global limit on total agents. Scale hierarchically through routers/specialists — but a router the caller must hand a means to does not reduce the count.
- Use least tool, least context, and least authority; give decidable checks (counts, hashes, schemas, exit codes) to code rather than model confirmation, pair linters/tests with a diff-scoped `Floor Guard` (blocking per-category net-new inline/config suppressions, test skips/deletions, lowered thresholds, and committed secrets via `gitleaks --redact`, reporting `NOT_MEASURED` locally if absent) plus static negative-routing (`stays-quiet`) collision checks, treat `0/0`, `NaN`, or degraded-fallback gates as `NOT_MEASURED` (fail-closed), and separate `pass^k` (reliability) from `pass@k` (search) (`rules/verification-placement.md`).
- Enforce boundary control rules (security, permissions, tool reach, budgets, side-effect prohibitions) in default-deny code outside the model's turn (labelling prose-only boundary rules `declared, not enforced`, calibrating secret blocks across search/shell tools as well as file tools, keeping active guardrails/hooks outside runtime self-modification, and launching edit/commit sessions rooted at the target child repository rather than via shell `cd` from a hub), bound delegated authority to `Caller ∩ Agent ∩ Tool` while scrubbing ambient tokens/overrides from child subprocess environments (`SCRUB_ENV`), and escalate `Single-Pass -> Bounded Loop -> State Graph` only on concrete failure modes — keeping `Hub/Tree` delegation (`no sibling mesh`) at 0-indexed `depth <= 2`, isolated per-worker parallel output keys/files, falsifiable hypothesis-bound retries, incoming `interrupt_before` gates on every irreversible or external side effect, `unknown != failed` timeout handling, and single-use hash-bound release approvals (`proposer != approver` in multi-principal repos; isolated critic + owner approval in single-principal repos; `rules/execution-architecture.md` governs).
- Prefer direct work/rules/skills over creating a new agent. The text below is extracted verbatim from `rules/agent-vs-skill.md`, which governs; it is regenerated from that file and never edited here (first 16 hex chars of sha256: `76e1e6d8bbd45f97`):

  At least one meaningful boundary exists:

  - separate context is valuable,
  - separate tools or permissions are required,
  - independent critique is required,
  - a different evidence/source regime is required,
  - the task has a materially different failure mode,
  - delegation genuinely reduces the parent's local action space, judged by the payload test in
    `rules/local-action-space.md`. A delegate that fails that test does not reduce the count, which
    disqualifies this bullet and nothing else in the list — the boundaries above stand on their own.

  "Security expert", "UX expert", "novel expert", or "red team" labels are not sufficient by themselves.

  If the role only adds a viewpoint, prefer a rubric/checklist/skill.
- For non-trivial work, run `/minimum-action-agent-os:os-preflight` when preflight materially helps.
- When asked to review a design, plan, or document that other people will rely on, delegate the review to the `minimum-action-agent-os:independent-critic` agent instead of reviewing it yourself, supplying the artifact, requirements, mandatory constraints, acceptance criteria, and verification evidence without your private rationale. Withholding rationale removes anchoring, and its separate undefined-term pass tests whether weaker text-consistent readings defeat normative clauses (`rules/anti-patterns.md` entry 7 and `agents/independent-critic.md` govern).
- After meaningful state or plan changes, run `/minimum-action-agent-os:os-state` — keeping expanded always-on root `AGENTS.md`/`CLAUDE.md`/`MEMORY.md` payloads compact (`<= 200` lines and `<= 25 KB`), omitting workspace-derivable transient facts, verifying working lessons against execution transcripts/diffs before promoting them into persistent rules, and keeping unverified working hypotheses explicitly labelled `UNVERIFIED` rather than persisted as fact.
- State what evidence a slice owes before it can be called done, and require evidence that **bears on the behaviour whose completion is claimed** — more than "the tests passed" is the floor, not the test (a checksum is also more than passing tests and proves nothing about whether the behaviour works). In the AT-14 field slice (`2026-08-29`), this completion gate caught two runtime defects a green suite missed.
- Adoption has two halves: **Installed** (the structure exists) and **Exercised** (at least one slice of domain work carried under it). Once a slice of this project's own work has been carried under this method, record for each adopted item one of **three** answers — *changed the outcome*, *applied and changed nothing*, or *never applied* — with a one-line reason (collapsing the last two hides an unexercised rule inside an unhelpful one, and adopting is not itself the slice). Report which half this project is at rather than reporting adoption complete (`AGENT_OS_SPEC.md` §11 governs).
- Project-specific canon/spec/status in this repository remains the source of truth for domain content.

**Domain authority:** `docs/spec/` governs product/system content; where project method rules above are more specific than the OS, the project rule wins and any deviation is recorded. Current action-space and §11 Exercised records live in `docs/AGENT_OS_ADOPTION.md`.
