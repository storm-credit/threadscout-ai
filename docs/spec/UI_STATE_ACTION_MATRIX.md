# UI State → Action Matrix v1

Status: DESIGN ONLY.

## Candidate card actions

| State | Primary action | Secondary action | Hidden/disabled behavior |
|---|---|---|---|
| discovery only | `근거 확인` | 보류 | strategy creation disabled |
| evidence partial | `근거 확인` | 보류 | exact commercial wording disabled |
| evidence ready | `전략 4개 만들기` | 보류 | none beyond policy blocks |
| strategy ready | `초안 만들기/검토` | 보류 | scheduling disabled |
| Guardian revise | `수정사항 보기` | 보류 | human approval disabled |
| Guardian pass | `승인 검토` | 보류 | scheduling still requires user decision |
| blocked | `차단 이유 보기` | 후보 제외 | progression disabled |
| stale | `다시 확인` | 보류 | old review state cannot be reused |
| suppressed | `복원` | 상세 보기 | excluded from normal ranking |

## Evidence screen actions

The evidence screen separates:

- source timeline
- exact-product state
- issue/relation state when present
- media research state and final-use state
- commerce snapshot
- conflicts
- freshness

A user-facing action should describe the next safe step rather than an internal agent name.

## Review screen actions

Show the selected draft, evidence freshness, product mapping, media treatment, commercial/disclosure state, Guardian result, and material warnings before the review decision.

## Disabled-action rule

A disabled CTA always has a visible reason. The UI must not show a tempting enabled action that the Orchestrator will later reject for a known blocker.
