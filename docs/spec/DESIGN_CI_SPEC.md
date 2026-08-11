# Design CI / GitHub Actions Specification v1

Status: DESIGN ONLY — this document does not modify the workflow.

## 1. What GitHub Actions currently does

The existing repository workflow runs on pull requests and on pushes to `main`.

Current steps:

1. checkout repository
2. set up Node 20
3. run `npm run verify`
4. run `npm run orchestra:demo`

`npm run verify` currently executes the existing documentation checker, automated tests, six-agent simulation, provider replay, versioned-store validation, fixture research, and live-source readiness checks.

This means the current green check proves the old prototype/test suite still passes after documentation changes. It does **not** yet prove that the new master design is complete, internally linked, approved, or fully traceable.

## 2. How to read the current Actions screen

A successful current run should be interpreted as:

> Existing prototype validation assets still work after this design-document change.

It should **not** be interpreted as:

- Master Design v1 approved
- new screen design implemented
- celebrity/issue discovery implemented
- photo/video rights automation implemented
- candidate ranking v1 implemented
- live Threads/NAVER access enabled
- publication enabled

The workflow name `CI` is therefore broader than the actual meaning of the design status. The future workflow should make this distinction visible.

## 3. Goal for future design CI

Before implementation resumes, GitHub Actions should present a separate design-quality job so a green build has a clear meaning.

Proposed jobs:

- `design-scope`
- `design-authority`
- `design-traceability`
- `design-open-gates`
- `design-consistency`
- `prototype-regression`

No workflow change is made while the project is under design-only instruction.

## 4. Job: design-scope

Purpose: enforce the design freeze on design PRs.

For a branch/PR marked as design-only, fail if files outside the approved design scope change.

Allowed by default:

- `CLAUDE.md`
- `docs/**`

Blocked during design freeze:

- `apps/**`
- `packages/**`
- `scripts/**`
- `tests/**`
- runtime dependencies
- workflow logic
- credentials/configuration enabling live sources

Expected GitHub UI output:

`Design scope: PASS — documentation-only change`

## 5. Job: design-authority

Purpose: make sure the canonical spec set exists and references are valid.

Checks should eventually include:

- every required canonical document exists
- required reading order references real files
- `MASTER_SPEC.md` exists
- design freeze status is explicit
- no two design-authority files define conflicting roster counts or product-match states

Expected output:

`Design authority: required specs present`

## 6. Job: design-traceability

Purpose: ensure every product requirement has a design owner and acceptance test.

Checks:

- every `PR-*` and `NFR-*` appears in traceability matrix
- referenced design authority exists
- referenced acceptance test ID exists
- no acceptance test points to a removed requirement

Expected output example:

`Traceability: all requirements mapped, 0 orphaned`

## 7. Job: design-open-gates

Purpose: show unresolved design decisions without pretending they are failures that can be guessed away.

Output categories:

- P0 unresolved
- P0 explicitly deferred behind disabled feature
- P1 unresolved
- P2 experimental

A design PR may still be green with open P0 items **only** when it remains in draft/design-review state and implementation is frozen.

Before an implementation-resume PR, unresolved P0 items become blocking.

Expected output:

```text
P0 unresolved: <count>
P0 deferred safely: <count>
P1 unresolved: <count>
Implementation resume: BLOCKED|READY
```

## 8. Job: design-consistency

Future checks should detect simple contradictions such as:

- agent count other than six
- price agent introduced
- Guardian bypass path
- external publication before human approval
- issue rumor/private-life content allowed
- public media treated as automatically reusable
- substitute product represented as exact
- opportunity score used to bypass evidence readiness

This is not intended to replace human design review; it catches structural regressions.

## 9. Job: prototype-regression

The current runtime checks can remain as a separate non-authoritative job:

- documentation checker
- automated prototype tests
- orchestra simulation
- replay
- evidence-store validation
- fixture research
- source readiness

Label clearly:

`Prototype regression — existing validation assets still pass`

This prevents users from misreading prototype tests as proof that the newly written design has been implemented.

## 10. Pull request summary artifact

A future design CI run should generate a short Markdown summary visible in Actions/PR checks:

```text
ThreadScout Design Status
-------------------------
Scope: docs-only PASS
Canonical specs: PASS
Traceability: PASS
Six-agent invariant: PASS
Media-rights invariant: PASS
Issue-rumor invariant: PASS
Ranking/evidence separation: PASS
P0 unresolved: <count>
P1 unresolved: <count>
Implementation freeze: ACTIVE
Prototype regression: PASS
```

## 11. Merge semantics

### Draft design PR

May merge only when the user intentionally wants to establish a design baseline with unresolved live-environment gates recorded.

### Design finalization PR

Must not claim `DESIGN COMPLETE` until:

- user approves the master direction
- P0 is resolved or safely deferred
- selected P1 defaults are recorded
- traceability is complete
- acceptance criteria are complete

### Implementation PR

Must reference the specific approved design baseline commit and affected requirement IDs.

## 12. Current action

Do not modify `.github/workflows/ci.yml` under the current instruction. This spec records how Actions should be improved after the user permits implementation/configuration work again.
