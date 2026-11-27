# Minimum Action Agent OS — Adoption Record

Adopted 2026-08-19 as a **working method only**. No product canon, spec, freeze document, agent roster, or runtime behaviour changed.

Domain authority remains `docs/spec/` (`MASTER_SPEC.md` first). The OS governs how work is decomposed, delegated, verified, and recorded — never what is built.

## Installation state

The OS ships as a Claude Code plugin and was already installed and enabled at **user scope** before this adoption:

- marketplace `storm-credit-agent-os` → `storm-credit/minimum-action-agent-os`
- plugin `minimum-action-agent-os@storm-credit-agent-os` enabled
- local clone present with a clean working tree, carrying 1 agent and 2 skills (at initial `2026-08-19` adoption; expanded upstream to 1 agent and 3 skills at `0.1.16` with `os-intake`)

Nothing was installed, vendored, or copied into this repository. `CLAUDE.md` §21 carries only the short adoption rule; the full OS documentation deliberately stays in the plugin.

A session that started before the plugin was enabled will not list its skills or agent. New sessions resolve them.

## Local action space audit

The OS invariant is **local**: at most five directly selectable actions at one reasoning node. Total agent count is unconstrained and was not reduced.

### Reasoning nodes in this project

Two distinct kinds of node exist here, and conflating them would produce a false result:

1. **The six product agents** — the domain runtime defined by `packages/orchestra/src/agent-registry.mjs` and `docs/spec/AGENT_CONTRACTS.md`. Their action space is the `allowedTools` allowlist.
2. **The Claude Code working session** — governed by `CLAUDE.md`. The project contributes no `.claude/agents/` or `.claude/skills/`, so its project-contributed action space is zero.

### Product agents

| Node | Agents visible | Tools visible | Skills | Other callable | Total | Verdict |
|---|---:|---:|---:|---:|---:|---|
| `orchestrator` | 0 direct | 4 | 0 | 0 | **4** | PASS |
| `scout` | 0 | 4 | 0 | 0 | **4** | PASS |
| `verifier` | 0 | 5 | 0 | 0 | **5** | PASS (at bound) |
| `strategist` | 0 | 3 | 0 | 0 | **3** | PASS |
| `writer` | 0 | 3 | 0 | 0 | **3** | PASS |
| `guardian` | 0 | 5 | 0 | 0 | **5** | PASS (at bound) |

Specialists hand off only to the Orchestrator, so none of them sees another agent as a peer choice.

### Orchestrator delegation fan-out

**The Orchestrator passes because no model chooses at this node.** In the implemented runtime, `apps/web/manual-orchestrator.mjs` dispatches through a frozen `SPECIALIST_BY_COMMAND` map plus an explicit allowed-state table. Selection is deterministic, so there is no local action space to bound today.

The registry counts, stated exactly:

- `allowedTools` has **4** entries.
- `handoffTo` has **6** entries: the five specialists **plus `'human_approval'`**. The sixth is not a sixth agent — `human_approval` is a run *stage* (`RUN_STAGE_IDS.HUMAN_APPROVAL` in `packages/orchestra/src/orchestrator.mjs`), reached through the separate `request_human_decision` tool.
- A fully expanded peer-choice count — 2 state tools + 5 delegate targets + 1 human tool — would be **8**.

That expanded figure is recorded deliberately rather than argued away. It does not breach the bound today because the dispatch is deterministic, but it is the number that would apply the moment this node becomes model-driven.

No router layer is warranted now, and adding one would contradict `MASTER_SPEC.md`, which fixes the roster at six and forbids a seventh role without explicit approval, four options, a decision record, and tests.

### Application command surface

`POST /api/commands` accepts nine commands (at initial `2026-08-19` adoption; expanded to 20 deterministic/human commands by `2026-11-27`, still `0` model choices). This is a **deterministic API**, not a reasoning node: no model selects among them, and `manual-orchestrator.mjs` validates the route against explicit allowed states. Route validation via `allowedStates()` covers the four specialist commands; the remaining commands are gated by set membership. It is therefore out of scope for the action-space bound and was left unchanged.

### Claude Code session node

| Source | Count |
|---|---:|
| project `.claude/agents/` | 0 (directory does not exist) |
| project `.claude/skills/` | 0 |
| project MCP servers | 0 |
| OS plugin (user scope) | 1 agent, 3 skills (`os-intake` added at `0.1.16`; was 2 skills at `2026-08-19`) |

The project itself widens nothing. Built-in harness tools are supplied by Claude Code, not configured by this repository, and are outside the project's control.

## Result

**Every node passes at or under the bound.** No tool was removed, no agent was merged, split, or deleted, and no router layer was introduced. Per the OS rule that an already-conforming structure is left alone, the only change is the adoption rule itself plus this record.

## Primitives already covered by existing rules

These are preserved and deliberately **not** duplicated:

| OS primitive | Existing home |
|---|---|
| Intent Interview | `CLAUDE.md` §15 |
| Blindspot Scan | `CLAUDE.md` §18, `docs/BLIND_SPOTS.md`, `docs/spec/FINAL_BLIND_SPOT_SWEEP.md` |
| Preflight Trap Check | `docs/PRE_IMPLEMENTATION_TRAPS.md`; rechecked by `CLAUDE.md` §18, with §20 gating the harness reading |
| Four Alternatives | `CLAUDE.md` §4 |
| Exemplar Research | `CLAUDE.md` §16, `docs/REFERENCE_PROJECTS.md` |
| Meta Prompting | `CLAUDE.md` §17, `docs/spec/PROMPT_SYSTEM_SPEC.md` |
| Harness / Golden Case | `CLAUDE.md` §20, `docs/spec/HARNESS_*`, `tests/` |
| Plan Drift Log | `CLAUDE.md` §14 |
| State / Canon Update | `docs/IMPLEMENTATION_STATUS.md`, `docs/DECISION_LOG.md`; §13 governs traceability and §19 the GitHub handoff |

### The one genuine gap

**Independent evaluation.** The project had no independent Critic or Red Team role — only self-review inside the completion-proof gate, which is the Groupthink Critic anti-pattern the OS names. This is now filled by the plugin's `independent-critic` agent rather than by a new project agent, so the project agent count stays at zero.

## Open risk

**If the Orchestrator ever becomes model-driven, re-audit it.** Its expanded peer-choice count is 8. Today deterministic dispatch keeps that theoretical, but a move to model-selected delegation would breach the bound and a router should be reconsidered at that point — subject to the roster constraint in `MASTER_SPEC.md`.


The Guardian is the product's own integrity reviewer, but it is not an *independent* reviewer of the **implementation**: it checks drafts against evidence inside the runtime. Independent review of code and design changes relies on the OS critic being actually invoked. Nothing enforces that automatically; `CLAUDE.md` §18 remains the human-facing gate.

## Drift found and corrected, 2026-09-13

`CLAUDE.md` §21 had carried the **pre-`0.1.5`** adoption block since 2026-08-19 — 21 days, across seven
OS releases. Three divergences from `rules/local-action-space.md`, all in the direction of weakening it:

- **"default target `<= 5`"** where the authority says *"The bound is: no more than five meaningful choices
  at one reasoning node."* An obligation was stated here as advice. That phrasing was retired upstream on
  2026-08-22.
- **The waiver / scope-limit obligation was absent entirely.** The authority says a node above five is
  never simply allowed — it is either outside the bound's reach (a scope limit) or carries a waiver, and
  *"there is no third outcome"*. This project stated a bound whose excess carried no recorded consequence.
- **The payload-test qualifier was missing**, so a router the caller must hand a means to appeared to
  reduce a node's count. It does not.

The third has a consequence worth naming: this project's per-node counts were recorded as conforming in the
OS repository's adapter. Those counts were taken against a constitution that omitted the payload test, so
they were measured under a weaker rule than the one that governs. They are not re-measured here.

**Fixed by replacing §21 with the canonical block verbatim**, extracted from the adapter rather than
retyped — retyping is how this drift began. Byte-identical to the source. That also restored two bullets
this project never had: the completion-evidence bullet and the two-halves adoption bullet.

**Knowingly imported with it:** the canonical block contains a clause the OS repository already records as
defective — *"make it more than 'the tests passed'"* is satisfiable by evidence unrelated to the behaviour
whose completion is claimed. A repaired local variant was considered and rejected: a hand-improved copy is
exactly what produced the 21-day drift, and the defect is tracked upstream where its fix belongs.

## Updated to canonical `0.2.0` block, 2026-11-19

Pinned upstream source: `storm-credit/minimum-action-agent-os` version `0.2.0`, commit `7ff9935` (`adapters/claude-code.md`). The user-scope OS plugin ships 1 agent (`independent-critic`, narrowed to `3` read-only tools `Read, Grep, Glob` at `0.1.18`) and 3 skills (`os-preflight`, `os-state`, and `os-intake` added at `0.1.16`).

Replaced `CLAUDE.md` §21 programmatically from `adapters/claude-code.md` (`7ff9935`) and verified byte-identity of the extracted body. Four upstream updates arrive with this replacement:

- **Self-contained agent-boundary and critic triggers (`0.1.17`, D32):** replaces the pointer-only `agent-vs-skill` line with the verbatim `rules/agent-vs-skill.md` extract (`sha256` prefix `76e1e6d8bbd45f97`) and replaces `"material independent review"` with concrete review-input and undefined-term obligations, after `claude plugin eval` measured `0/3` on both pointer-only lines and `3/3` on the self-contained replacements.
- **Completion-proof defect repaired upstream (`0.1.18`, D33):** the defect noted under `2026-09-13` above (*"make it more than 'the tests passed'"*) is resolved upstream and here — completion evidence must **bear on the behaviour whose completion is claimed**.
- **Three-answer §11 Exercised ledger & epistemic hygiene (`0.1.18`, D30/D33):** distinguishes *changed the outcome*, *applied and changed nothing*, and *never applied* so unexercised rules are not reported as unhelpful ones, and adds `UNVERIFIED` hypothesis labelling.
- **Harness, loop, graph, and evaluation-integrity invariants (`0.2.0`, D34):** adds `rules/execution-architecture.md` (default-deny code enforcement outside the model's turn with prose-only boundary rules marked `declared, not enforced`, `Caller ∩ Agent ∩ Tool` delegated authority, `Single-Pass -> Bounded Loop -> State Graph` escalation at 0-indexed `depth <= 2` with `no sibling mesh`, falsifiable hypothesis-bound retries, incoming `interrupt_before` gates on irreversible/external side effects, `unknown != failed` timeout handling, and single-use hash-bound release approvals) plus `rules/verification-placement.md` evaluation integrity (`0/0` and degraded-fallback runs evaluate to `NOT_MEASURED` fail-closed; `pass^k` vs `pass@k`).

## Updated to canonical `0.2.1` block & Exercised ledger, 2026-11-27

Pinned upstream source: `storm-credit/minimum-action-agent-os` version `0.2.1` (`adapters/claude-code.md` + Antigravity bundle `minimum-action-agent-os` `0.2.1`).

### Root payload compaction & boundary audit (`0.2.1`)

- **Always-on root cap (`<= 200` LF lines and `<= 25 KB`):** `CLAUDE.md` previously stood at `258` lines (`17,850` bytes), exceeding `0.2.1`'s `<= 200` line bound across expanded root instruction files. Compacted `CLAUDE.md` to `< 150` lines with zero `@import` indirection, keeping every section's normative trigger inline (avoiding D32's pointer-only `0/3` regression) and replacing §21 verbatim from `0.2.1`'s `adapters/claude-code.md` (`sha256` extract prefix `76e1e6d8bbd45f97` preserved).
- **Explicit `declared, not enforced` boundary labelling:** `CLAUDE.md` now distinguishes code-enforced controls (`agent-registry.mjs`, `tool-broker.mjs`, `guardian-checks.mjs`, `locked-application-store.mjs`) from prose-only host/process rules (`declared, not enforced`). In Google Antigravity sessions, `maos-critic` declares `tools: [read_file]` (`1` tool), which is **`declared, not enforced`** because the host runtime unconditionally injects MCP/task/workspace callables; in Claude Code sessions, `independent-critic` declares `3` read-only tools (`Read, Grep, Glob`).
- **Payload-tested node freeze under Option B commercial expansion:** Kept all six product agents at or under `<= 5` (`orchestrator` 4 deterministic, `scout` 4, `verifier` 5, `strategist` 3, `writer` 3, `guardian` 5), prohibiting multiplexed `mode` parameters inside `verifier` and routing commission/ROI calculation (`affiliate_yield_service`) and public card rendering (`public_showcase_projector`) to deterministic non-agent services.

### Adoption status: **Installed and Exercised** (`AGENT_OS_SPEC.md` §11)

Both halves of OS adoption are now complete across three carried domain slices: the **AT-14 owner-suppression slice (`2026-08-29`, PR #17)**, the **Option B commercial-showcase & dual-affiliate specification slice (`2026-11-27`)**, and the **Option B SQLite WAL + Hybrid Editorial Studio + `/showcase` implementation slice (`2026-11-27`, `154/154` tests + browser hit-test + critic Round 2 `PASS_WITH_RISKS`)**. Per `AGENT_OS_SPEC.md` §11, each installed item is recorded with one of three outcomes (*changed the outcome*, *applied and changed nothing*, or *never applied*) and a one-line empirical reason:

| §11 Installed item | Exercised verdict | One-line reason from carried project slices |
|---|---|---|
| 1. Clear OS entry point (`CLAUDE.md` §21) | *changed the outcome* | Kept the AT-14 (`2026-08-29`) and Option B (`2026-11-27`) domain slices routed through preflight, four-option comparison, and independent critique directly from root context without custom `.claude/` scaffolding. |
| 2. Local action space review (`<= 5` + payload test) | *changed the outcome* | Blocked adding affiliate-tier/mode choices to `verifier` (already at the `5`-tool bound) and rejected proposed price/style/persona 7th agents in favour of deterministic services and rubrics (`2026-11-27`). |
| 3. Justified tool/context/authority exposure | *changed the outcome* | Replaced log-denylisting on the Option B public showcase with a closed default-deny 9-field projection schema so raw source excerpts and `likely`/`unresolved` items never leave the server (`2026-11-27`). |
| 4. Blindspot and preflight trap checks | *changed the outcome* | Cross-checking NotebookLM watch claims against official Meta/affiliate docs caught the non-existent Threads DM API myth and promoted two new B0 gates (`BS-60` indirect `#NNN` offset-`0` disclosure, `BS-61` showcase leak block, `2026-11-27`). |
| 5. Independent evaluation (`maos-critic` + undefined-term pass) | *changed the outcome* | Zero-rationale `maos-critic` review (`2026-11-27`) failed v1 of the commercial blueprint on 5 blocking findings (including `CLAUDE.md` §5's unconditional comment ban vs self-replies and 12 undefined terms), directly changing the approved design to single-post + `#NNN` showcase. |
| 6. Project state/canon as source of truth | *changed the outcome* | Reconciling `IMPLEMENTATION_STATUS.md` against git commits (`484956e`, `4ae6afb`, `c857843`) exposed 4 stale pre-PR-#17 lines (`168, 172, 179–180`) that contradicted merged `main` (`2026-11-27`). |
| 7. Plan-drift / deviation records | *changed the outcome* | Recorded two AT-14 deviations (`USER_SUPPRESSION_ACCEPTANCE.md`, `2026-08-29`) and the `2026-11-27` commercial architecture shift from Threads-only Coupang baseline to Option B Public Verified Showcase + Dual Affiliate (`DECISION_LOG.md`). |
| 8. Behaviour-bearing completion proof | *changed the outcome* | Real 360×740 hit-tested browser verification on AT-14 (`2026-08-29`) caught English server error leakage (later fixed in PR #23 `4ae6afb`) and a 39px below-fold empty state that `145/145` passing unit tests missed. |

### Per-round review change records (`rules/anti-patterns.md` entry 9)

- **Round 1 (`2026-11-27`, pre-decision blueprint review by `maos-critic` `cea9c520`):** Verdict `FAIL` (`B1..B5` + 12 undefined terms). Removed programmatic continuation self-replies (preserving `CLAUDE.md` §5 single-post rule), flagged Option B `MASTER_SPEC.md` amendments, separated `os-intake` (skill) from `maos-critic` (`1` tool in Antigravity `declared, not enforced`; `3` tools in Claude Code), enforced `{measured, reported, claimed, UNVERIFIED}` tags, and defined the closed 9-field showcase allowlist.
- **Round 2 (`2026-11-27`, Phase 1 repo-spec review by `maos-critic` `6688198b`):** Verdict `FAIL` (`BF-1..BF-5`, `NBR-1..4`, `UT-01..11`), then re-review **`PASS_WITH_RISKS` (`0` blockers, commit `1c47055`)**. Added the deterministic `(product_state, AffiliateMapping.state) -> matchBadge` table and nullable `'none'` schema (`BF-1`/`UT-04`), unified `stale` full-card withdrawal with a 7d rolling showcase TTL (`BF-2`/`UT-06`), added the post-publication `'none'` monetization lock and unified commercial solicitation surface rules (`BF-3`/`UT-01..03`), propagated `SCRUB_ENV` + nonce-fenced `user_evidence` across `NFR-13`/`AT-48`/`F28` and added `declared, not enforced` labels to `CLAUDE.md` §§3, 5, 11 (`BF-4`/`UT-11`/`NBR-4`), specified pre-count `AT-10`/`AT-23` disclaimer stripping, incentivized-bait criteria, and owner-`reject`-only `lifecycle_epoch` increments (`BF-5`/`UT-05,07..10`), and reconciled `DESIGN_FREEZE.md`, `PUBLISHING_SPEC.md`, `RUN_BUDGETS.md`, and `docs/watch/SOURCES.md` (`NBR-1..3`).
- **Round 3 (`2026-11-27`, Phase 2 Option B implementation review by `maos-critic` `6688198b`):** Initial implementation verdict `FAIL` (`BL-1..3`, `MJ-1..4`, `MN-1`, `UT-IMPL-01..05`) despite `153/153` passing tests — catching unwired `activeMonetizedShowcaseCount` & bare-`N번` pointers in `runGuardian` (`BL-1`), `exactMatchStatus === 'exact'` blocking `substitute`/`alternative` end-to-end (`BL-2`), opt-in-only fencing/budgeting (`BL-3`), a 200-event freeze in SQLite `audit_events` (`MJ-1`), `updatedAt` vs `now` TTL skew in `showcaseProjected` (`MJ-2`), hidden `#reset-demo` at `360px` & `/showcase/:cardNumber` detail fetch (`MJ-3`), and JSON fallback parity (`MJ-4`). Closed all 8 findings (`154/154` tests + `360×740` & `1440×900` browser verification); Round 3 re-review returned **`PASS_WITH_RISKS` (`0` blockers)**, with `R2-RISK-2..3` verb-lookahead and statutory-prefix polishes also applied (PR #26 green on Node 20 & Node 24).
- **Round 4 (`2026-11-27`, Slice C Live-Activation Preflight & Single-Root-Post Publisher review by `maos-critic` `6688198b`):** Caught open denylist vs closed `['text', 'imageUrl']` allowlist in `assertSingleRootPostPayload` (`BL-PUB-1`), terminal `invalidated` cancellation hash-release & §2 schedule-admission preconditions / synthetic `'verified_seller'` fallbacks (`BL-PUB-2` / `BL-PUB-R2-1..2`), raw LLM env-var names in `/api/preflight` (`BL-PUB-3`), and a vacuous ternary test assertion (`MN-PUB-1`). Closed all findings (`157/157` tests); Round 4 final re-review returned **`PASS_WITH_RISKS` (`0` blockers)**, with `policy_rejected` hash retention (`R3-RISK-1`) also applied.
- **Round 5 (`2026-11-27`, Slice D Local Schedule Queue `S07`, Guardrailed Analytics & ROI `S08`, and Provenance `AT-13` review by `maos-critic` `b5bcab40`):** Initial verdict `FAIL` (`BLOCKER-1..3`, `MAJOR-1..3`, `MINOR-1`) — catching 4-draft scheduling from one approval + unsaved Step 2 radio selection (`BLOCKER-1`), owner-suppression bypass + wedged `approved` state after schedule invalidation + discarded preflight invalidation in `record_manual_publication` (`BLOCKER-2`), multi-window `24h/7d/manual` snapshot inflation of `cleanSampleCount` / ROI double-counting / `>70%` affiliate bucket & dilution loopholes (`BLOCKER-3`), static `evidenceFreshness` & unwired `killSwitchActive` (`MAJOR-1`), mutable Stage 1 intake hash / missing prompt-schema versions / `AT-22` checkmarks (`MAJOR-2`), and `sourceOrigin` seller fallback / CSS 380px ordering / `S08` fields (`MAJOR-3`). Resolved all 7 findings (`160/160` tests + `1440×900` & `360×740` browser re-verification); Round 2 re-evaluation returned **`PASS_WITH_RISKS` (`0` blockers)**, and all 4 Round 2 polishes (`MAJOR-R2-1` `reconcile_unknown_schedule(false)` hydration hash release, `MAJOR-R2-2` default published `scheduleId` binding on `record_outcome_snapshot`, `MINOR-R2-1` artifact-persisted `promptVersion`/`schemaVersion`, and `MINOR-R2-2` textarea preservation + historical command-count qualifier) were applied prior to PR #28 (`c797e46`).
- **Round 6 (`2026-11-27`, Slice E Issue/Public-Figure Governance `G0–G4` × `R0–R5`, Discovery-vs-Publication Media Rights Funnel, and Calibrated `Floor Guard` `AT-39` review by `maos-critic` `80b5fe30`):** Round 1 verdict `FAIL` (`BF-1..5`, `NBR-1..5`, `UT-01..09`) — catching `R4 + exact` same-product claim & `draft.title` alternative-label bypass (`BF-1`), named-person endorsement (`김태리가 강추한 텀블러`, `김태리의 최애`) & `R3` ceiling gaps (`BF-2`), `R4` auto-mapped `OutcomeSnapshot.matchBadge` & `AT-12` quarantine gaps (`BF-3`), shallow-clone `0/0` diff fallback, file-level exclusions, substring vs cryptographic `sha256` extract verification, and unidirectional traceability (`BF-4` + `PRODUCT_REQUIREMENTS.md` `PR-15..24`/`NFR-11..12`), and invalid-grade / missing-rights / non-monetized `12h` showcase TTL gaps (`BF-5`). Round 2 caught a greedy wildcard `[^\n.?!]{0,28}` in negated sponsorship disclaimer stripping (`BF-R2-1`) plus 3 polishes (`NBR-R2-1..3`). All findings were resolved (`166/166` tests + `360×740` & `1440×900` browser hit-testing); Round 3 returned **`PASS_WITH_RISKS` (`0` blockers)**, merged as PR #29 (`0876726`).
- **Round 7 (`2026-11-27`, Slice F Operator Studio Authentication Boundary & Public `/showcase` Surface Split review by `maos-critic` `353cd15c`):** Owner selected Option B from a 4-track comparison (`ask_question`) to enable `₩0` external `/showcase` deployment (`SECURITY_ARCHITECTURE.md` §§1–3) via deterministic non-agent `apps/web/operator-auth.mjs` (preserving the fixed 6-agent `<= 5` tool bound). Round 1 verdict `FAIL` (`BF-1..4`, `NBR-1..2`, `UT-01..06`) caught `Bearer` rate-limit bypass (`BF-1`), pre-`503` store initialization / blanket read-only `catch` masking corrupt DBs / `<16`-char `sessionSecret` / `200` on misconfigured `/api/health` & `/api/auth/logout` (`BF-2`), `HEAD` `404` on `/api/health` & `/api/showcase*` (`BF-3`), Top Layer `<dialog>::backdrop` `#toast` occlusion & `.form-stack label` `[hidden]` override (`BF-4`), and `[::1].evil.example` hostname parsing, `X-Forwarded-Host`, closure-private secrets, and server-side logout nonce revocation (`NBR-1..2`). Round 2 verdict `FAIL` (`BF-R2-1..2`, `NBR-R2-1`, `UT-R2-01..02`) caught unscoped `Sec-Fetch-Site: cross-site` blocking external Threads top-level `navigate` `document` link clicks into `/showcase` (`BF-R2-1`) and unthrottled `isOperatorViewer` `Bearer` / derived-key tampered-cookie brute-force oracles (`BF-R2-2`). Resolved all findings with W3C Fetch Metadata navigation exemption, ephemeral CSPRNG default session key, `Bearer`-free `isOperatorViewer`, and `tampered` (vs `expired`/`revoked`) cookie rate-limiting; Round 3 re-evaluation returned **`PASS_WITH_RISKS` (`0` blockers)**, with `NBR-R3-1` stale-cookie `Max-Age=0` auto-clear on `401` and `(ephemeral CSPRNG)` diagnostic wording applied prior to PR #30.
