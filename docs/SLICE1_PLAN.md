# Slice 1 — Manual Candidate Approval Pipeline

Implementation entry contract required by `docs/spec/DESIGN_BASELINE_MANIFEST.md` and `docs/spec/DESIGN_FREEZE.md`.

## Baseline

Master Design v1, approved in PR #8 (`docs: approve ThreadScout Master Design v1`). Design authority is `docs/spec/`; this document does not modify it.

## Slice

Owner enters a product directly → Evidence Verifier → Opportunity Inbox → Content Strategist four angles → Threads Writer four drafts → Integrity Guardian → human approve / hold / reject.

This is `USER_FLOWS.md` Flow B. `MASTER_SPEC.md` allows the Orchestrator to skip Product Scout when the owner supplies a concrete product, but Verifier, Guardian, and human approval cannot be skipped.

Terminal state is the recorded human decision. Scheduling, publishing, and suppression are out of scope.

## Requirements in scope

`PR-01`, `PR-04`, `PR-06`, `PR-07`, `PR-08`, `PR-09`, `PR-13`, `PR-15`, `PR-19`, `PR-20`, `PR-22`, `PR-23`,
`NFR-01`, `NFR-02`, `NFR-03`, `NFR-04`, `NFR-05`, `NFR-06`, `NFR-08`, `NFR-09`, `NFR-11`.

Deliberately out of scope: `PR-02`, `PR-03`, `PR-05`, `PR-10`, `PR-11`, `PR-12`, `PR-14`, `PR-16`, `PR-17`, `PR-18`, `PR-21`, `NFR-07` beyond existing budgets, `NFR-10` beyond existing redaction.

`PR-24` is partially in scope: capability state must be *displayed* as `designed / configured / enabled / verified`, but no capability is enabled.

## Acceptance behaviour in scope

`AT-01`, `AT-04`, `AT-06`, `AT-07`, `AT-08`, `AT-09`, `AT-13`, `AT-16`, `AT-17`, `AT-18`, `AT-19`, `AT-20`,
`AT-22`, `AT-23`, `AT-25`, `AT-32`, `AT-33`, `AT-34`, `AT-35`, `AT-36`, `AT-38`, `AT-41`, `AT-42`.

`AT-10` is covered only for wording: a non-`exact` match must never be described as the same product. Affiliate mapping itself is not implemented.

`AT-05` is covered only as state display: media rights are shown and gate progression, but no media is uploaded, downloaded, or transformed.

## Applicable B0 blind spots

| B0 | How this slice addresses it |
|---|---|
| BS-01 | Inbox ranks on reader value and utility, and exposes readiness/risk separately from score |
| BS-06 | All durable state is server-side; the browser holds no authority |
| BS-16 | A commercial destination is bound to a versioned identity snapshot; changing it invalidates downstream artifacts |
| BS-31 | Only the Verifier evidence packet carries factual authority; downstream agents cannot add facts |
| BS-32 | Guardian receives evidence and drafts, shares no generation logic with Writer, and its blockers are non-overridable |
| BS-36 | Blockers and material changes render above the approval CTA |
| BS-37 | Approval binds artifact hashes; a changed upstream artifact marks the approval stale |
| BS-51 | No credential is read, stored, logged, or required by this slice |
| BS-52 | Owner-entered evidence is stored as minimal structured fields, not raw payloads |

## Live capabilities: all remain disabled

Threads keyword discovery, Threads insights, Threads publishing, Coupang affiliate publication, automated listing discovery, and third-party media republication stay fail-closed. No network call is made by any code path in this slice. A user-supplied destination URL is stored as string evidence and is never fetched.

## Prototype disposition

| Component | Disposition |
|---|---|
| `packages/orchestra/src/agent-registry.mjs` | keep |
| `packages/orchestra/src/versioning.mjs` | keep, extended |
| `packages/orchestra/src/evidence-store.mjs` | keep, extended with torn-line recovery |
| `packages/orchestra/src/model-runtime.mjs` | keep |
| `packages/orchestra/src/tool-broker.mjs`, `live-source-registry.mjs`, `disabled-live-adapters.mjs`, `research-*.mjs`, `source-*.mjs` | keep, untouched |
| `packages/orchestra/src/orchestrator.mjs` | modify — align states with `ORCHESTRATOR_STATE_MACHINE.md`, add stale routing and handoff gates |
| `packages/orchestra/src/contracts.mjs`, `schemas.mjs`, `prompts.mjs` | modify — expand artifacts to `AGENT_CONTRACTS.md` shape |
| `packages/core/src/index.mjs`, `fixtures.mjs` | remove — client-side approval logic and draft generation conflict with the approved design |
| `apps/web/app.js`, `index.html`, `styles.css` | remove and replace with the Opportunity Inbox |
| `apps/web/server.mjs` | modify — becomes the application API, not a static file server only |
| `tests/web-smoke.test.mjs` | rewrite against the new surface; coverage is not dropped |

## Files allowed to change

`packages/orchestra/**`, `packages/core/**`, `apps/web/**`, `tests/**`, `scripts/**`, `package.json`, `docs/DECISION_LOG.md`, `docs/REFERENCE_PROJECTS.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/SLICE1_PLAN.md`, `.github/workflows/ci.yml`.

`docs/spec/**` and `CLAUDE.md` are not changed by this slice.

## Verification before completion

1. `node scripts/check-docs.mjs` and the full `node --test` suite pass.
2. Every acceptance ID above has at least one implementation test, including a negative case where the gate must refuse.
3. The application is actually run; every button, form, and CTA is exercised.
4. The Opportunity Inbox is checked at 360 px with no horizontal scrolling of core controls and no hover dependency.
5. Reload, second session, stale approval, Guardian block, and invalid input are exercised as real states, not only as unit assertions.
6. Diff reviewed for unintended scope.
7. Pre-implementation traps rechecked against finished behaviour.
8. PR opened and GitHub Actions verified green.

## Stop conditions

- Any change that would enable a live capability, require a credential, or perform a network request.
- Any change to a fixed invariant in `MASTER_SPEC.md` "Design authority and change control".
- A new B0 blind spot that applies to this slice and is not mapped.

## Rollback

The slice is a single feature branch with no migrations and no external side effects. Rollback is closing the PR; `.threadscout-data/` is local and outside Git.
