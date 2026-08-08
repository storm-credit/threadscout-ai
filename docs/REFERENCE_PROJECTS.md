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
