# Meta-Prompting Playbook

## 1. Context dump

Collect the raw objective, current situation, examples, constraints, worries, available data, preferred tone, and definition of success without requiring perfect organization.

## 2. AI-led context questions

Prompt pattern:

> Based on the conversation and repository, identify only the missing context required to produce a strong result. Do not repeat answered questions. Ask the 3–5 decisions with the greatest effect first and provide a recommended default for difficult choices.

## 3. Explicit success criteria

Examples:

- The core value must be visible on the first mobile screen.
- The primary CTA must be unambiguous.
- Every button and form in the claimed scope must work.
- No external publish action occurs without approval.
- Completion must be supported by executed verification.

## 4. Environment-specific conversion

### Goal prompt

Include objective, deliverables, measurable success, non-goals, and stop conditions.

### Coding agent prompt

Include repository state to verify, files allowed to change, constraints, commands, tests, migration/rollback, and when to stop.

### Image-generation prompt

Include composition, subject, style, lighting, lens/camera direction, aspect ratio, text treatment, and prohibited elements.

### Research-agent prompt

Include source hierarchy, date range, geographic scope, query scope, verification method, conflicting-evidence handling, and required uncertainty labels.

## 5. Prompt reduction

Generate a representative sample, classify failures, keep rules tied to recurring failures or safety, remove repetition and ineffective wording, then retest.

## 6. Output review

Review function, factuality, user value, legal/policy risk, duplication, mobile usability, and whether the output satisfies every success criterion.
