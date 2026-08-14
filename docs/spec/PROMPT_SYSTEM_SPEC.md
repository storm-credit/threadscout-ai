# Prompt System Specification v1

Status: DESIGN ONLY.

## Canonical prompt lifecycle

1. context dump — collect objective, account boundaries, evidence, examples, prior decisions, and current artifact refs
2. missing-context questions — ask only high-impact unanswered questions; do not repeat known answers
3. success and stop conditions — state what a good artifact must satisfy and when the agent must stop
4. environment conversion — adapt the instruction to the executing role/tool
5. sample execution and failure classification
6. prompt reduction — remove ineffective repetition while preserving rules tied to recurring failures, safety, evidence, and user intent
7. result review — validate schema, semantics, evidence use, and acceptance conditions

## Role-specific emphasis

- Orchestrator prompt: objective, budgets, stage plan, gates, stop conditions
- Scout prompt: source scope, time window, discovery criteria, uncertainty, no exact-product conclusion
- Verifier prompt: evidence hierarchy, conflict handling, exact-match criteria, current-fact timestamps
- Strategist prompt: four distinct reader jobs and prohibited implications
- Writer prompt: verified claims only, Korean tone, no new research, disclosure state
- Guardian prompt: independent checks, blocker rules, bounded revision requests

## Prompt versioning

Every agent artifact records prompt version and schema version. A prompt change that can alter claim behavior, evidence rules, agent authority, or approval semantics requires a design decision and regression review.

## Prompt quality rule

Longer is not automatically better. Keep instructions only when they define authority, evidence boundaries, recurring-failure prevention, output structure, or measurable success.
