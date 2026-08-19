# Minimum Action Agent OS — Adoption Record

Adopted 2026-08-19 as a **working method only**. No product canon, spec, freeze document, agent roster, or runtime behaviour changed.

Domain authority remains `docs/spec/` (`MASTER_SPEC.md` first). The OS governs how work is decomposed, delegated, verified, and recorded — never what is built.

## Installation state

The OS ships as a Claude Code plugin and was already installed and enabled at **user scope** before this adoption:

- marketplace `storm-credit-agent-os` → `storm-credit/minimum-action-agent-os`
- plugin `minimum-action-agent-os@storm-credit-agent-os` enabled
- local clone present with a clean working tree, carrying 1 agent and 2 skills

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

`POST /api/commands` accepts nine commands. This is a **deterministic API**, not a reasoning node: no model selects among them, and `manual-orchestrator.mjs` validates the route against explicit allowed states. Route validation via `allowedStates()` covers the four specialist commands; the remaining five are gated by set membership. It is therefore out of scope for the action-space bound and was left unchanged.

### Claude Code session node

| Source | Count |
|---|---:|
| project `.claude/agents/` | 0 (directory does not exist) |
| project `.claude/skills/` | 0 |
| project MCP servers | 0 |
| OS plugin (user scope) | 1 agent, 2 skills |

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
