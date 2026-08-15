# Candidate Dedupe Guardrail — Acceptance Proof

Status: **AUTOMATED LOCAL MANUAL-CANDIDATE DEDUPE PROOF.** This report does not claim live Scout/global dedupe, production database indexing, semantic model matching, or user-category suppression.

Baseline: `97fc8c7b340728dcc13756366f86fba3a4b099ce`.

## Implemented boundary

The manual-product application path now applies a deterministic portfolio/workflow guardrail around persisted candidate history:

`manual candidate / identity update → normalized identity check → exact suppress OR possible-duplicate review OR unique → owner resolution if needed → normal Verifier/content flow`

The guardrail is deliberately separate from Verifier's exact-product authority. Fuzzy/name similarity can only create `possible_duplicate`; it cannot create an exact ProductMatch or merge factual evidence.

## Exact duplicate behavior

Exact automatic suppression requires all three normalized dimensions to exist and match an existing active non-synthetic candidate:

- brand
- model
- variant

Unicode width/case/punctuation/spacing differences are normalized for the comparison. Seller/source URL and display-name equality are not exact-duplicate keys.

At ingestion, an exact duplicate does not create a second candidate. If a previously distinct candidate later becomes exact-duplicate because Verifier edits its identity, the record is moved to `suppressed_duplicate` so its audit/history remains persisted while it disappears from the primary inbox.

## Possible duplicate behavior

A possible duplicate is raised only when there is no known brand/model/variant contradiction and normalized names match or conservative token overlap is high.

Possible duplicates:

- enter `duplicate_review`
- expose the matched candidate and reason in the mobile workspace
- block Verifier/Strategist/Writer/Guardian progression
- block ordinary hold/reject/approval decisions
- require explicit owner `distinct` or `duplicate` resolution
- use expected-revision CAS for the resolution

`distinct` is bound to the candidate's normalized identity signature so ordinary source/evidence edits do not repeatedly reopen the same decision. Identity changes trigger reassessment.

## Portfolio behavior

The Opportunity Inbox remains capped at five candidates. Pending duplicate-review candidates are priority-included before score-based remainder selection so a low-score correctness task cannot become unreachable. Confirmed duplicate records are excluded from the five-card read model but retained in server-owned persisted state and audit.

## Automated acceptance scenarios

| Scenario | Expected behavior | Result |
|---|---|---|
| same normalized brand+model+variant | second ingestion suppressed, existing candidate referenced | PASS |
| same source URL but conflicting model/variant | distinct candidate retained | PASS |
| similar name + incomplete identity | `possible_duplicate` / `duplicate_review` | PASS |
| known different model or variant | fuzzy matching does not collapse the candidates | PASS |
| specialist work while duplicate review pending | fail closed with `duplicate_review_required` | PASS |
| hold/reject while duplicate review pending | fail closed; dedicated review state preserved | PASS |
| owner resolves `distinct` | candidate returns to normal verification | PASS |
| owner resolves `duplicate` | candidate suppressed from inbox, persisted audit retained | PASS |
| unchanged identity after `distinct` | routine verification does not reopen duplicate review | PASS |
| identity changes to exact duplicate during verification | candidate suppressed and audit retained | PASS |
| identity change removes contradiction but remains ambiguous | duplicate review reopens | PASS |
| stale duplicate-resolution revision | HTTP 409/version conflict | PASS |
| duplicate suppression replay | request-id idempotent across reload | PASS |
| low-score duplicate review with >5 other candidates | review candidate remains inside five-card inbox | PASS |
| live capability boundary | external publishing/live sources remain disabled | PASS |

## Executable proof

GitHub Actions Run #178 (`31899973399`) on implementation head `2526921154d62d58954c66bd7a1f40e5948f34ac` completed successfully:

- `npm run verify`: success
- `npm run orchestra:demo`: success
- **102 tests / 102 pass / 0 fail**
- candidate-dedupe tests: exact suppression, source mutation boundary, possible review, human-decision bypass prevention, identity conflict, resolution, identity-bound reopen behavior, post-verification suppression, portfolio inclusion, CAS, reload/idempotency — green
- persistence-lock regressions — green
- manual C-slice and Spike 0 regressions — green
- simulation/replay/evidence store/fixture research/readiness — green
- readiness output still reports network execution disabled

A final documentation-head PR CI run is required after status/trap/acceptance records are committed, followed by post-merge main CI.

## Design / blind-spot mapping

- `BS-58`: repeated/same-product candidates are guarded before expensive content work.
- `AT-28`: duplicate suppression can reduce useful recommendations; the system does not fill a quota with repeats.
- `AT-29`: pending duplicate review is an explicit portfolio-inclusion reason and cannot be hidden solely by opportunity score.
- `BS-16`: same seller/source URL never establishes stable product identity.
- `AT-25`: opportunity score cannot bypass evidence/duplicate correctness gates.
- `AT-36` and `AT-38`: duplicate-resolution uses the existing candidate revision CAS and does not weaken later exact approval binding.
- fixed-six-agent rule: dedupe is a deterministic application/portfolio service; it adds no seventh agent.

## Self-review findings closed before merge

The first implementation pass was intentionally reviewed for bypasses. Three were found and fixed in-slice:

1. ordinary hold/reject could otherwise strand a pending `duplicate_review` candidate;
2. ingestion-only dedupe could otherwise be bypassed by changing brand/model/variant during Verifier work;
3. score-only top-five truncation could otherwise hide a low-score pending duplicate review.

These fixes stay within the selected deterministic Option A and are recorded in `CANDIDATE_DEDUPE_GUARDRAIL_PLAN.md`.

## Explicit limitations

- comparison is against current persisted local candidate history, not a global product catalog
- synthetic demo candidates are deliberately excluded as canonical duplicate targets
- no live Scout discovery dedupe is implemented yet
- no cross-account dedupe
- no embeddings/LLM semantic dedupe
- no UPC/EAN/GTIN external catalog matching
- no URL redirect/canonicalization network work
- no PostgreSQL/SQLite/trigram index; O(n) comparison is acceptable only for the current bounded local candidate set
- user category/content suppression from AT-14 is a different feature and remains unimplemented
- this guardrail does not replace Verifier exact-product/evidence truth

## Live capability state

Still OFF / blocked:

- Threads keyword discovery
- Threads insights
- Threads publishing
- Coupang Partners commercial posting
- automated live listing discovery beyond owner-supplied references
- third-party media download/transform/republish without action-specific rights evidence
- schedule dispatch/reconciliation
- analytics learning

No credential, dependency, workflow file, model provider, new agent, live-network flag, publication adapter, or scheduler activation is introduced by this slice.
