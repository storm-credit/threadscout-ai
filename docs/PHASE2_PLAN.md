# Phase 2A Plan — Fixed Six-Agent Orchestra

## Goal

Replace the vague multi-agent concept with a fixed, testable orchestra of exactly six agents and a deterministic coordinator contract.

## Success criteria

1. Exactly six agent definitions exist, including the Orchestrator.
2. The six roles have non-overlapping missions, inputs, outputs, tools, prohibitions, and stop conditions.
3. No dedicated price agent exists.
4. Price, stock, seller, model, and observation time belong to the Evidence Verifier's evidence packet.
5. Only the Orchestrator delegates work.
6. Specialists return structured artifacts to the Orchestrator.
7. Four drafts and four content angles are contractually required.
8. Guardian pass is required before human approval.
9. Human approval is required before local queueing.
10. No agent can publish externally.
11. Loop and total invocation limits prevent circular handoffs.
12. Tests fail if a seventh agent is added or a required role is removed.

## Non-goals

- model-provider integration
- paid API calls
- live product scraping
- live Threads publishing
- dynamic agent generation
- agent-to-agent free conversation
- dedicated price optimization

## Implementation steps

1. Research current orchestration projects and record adopted/rejected patterns.
2. Define immutable six-agent registry.
3. Define structured output contracts.
4. Implement deterministic run planning and stage routing.
5. Implement bounded revision and human approval gates.
6. Add a local dry-run command.
7. Add tests for roster, contracts, routing, blockers, and publication prohibition.
8. Update architecture, constitution, blind spots, traps, and decision log.

## Stop conditions

- an agent responsibility cannot be separated without overlap
- adding a seventh agent appears necessary
- a framework dependency is required to pass the local contract tests
- an external credential or irreversible action becomes necessary
- Guardian blockers would need to be bypassed
