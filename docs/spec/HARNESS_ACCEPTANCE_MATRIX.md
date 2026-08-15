# Harness Fixture & Acceptance Matrix v1

Status: **HARNESS DESIGN ONLY.** This document translates Master Design behavioral acceptance into deterministic harness coverage. It does not replace `ACCEPTANCE_TESTS.md` and does not claim any test is implemented.

## Validation layers

- **H** — direct harness/domain/orchestration assertion; should be deterministic without browser or live provider.
- **UI** — application/browser interaction assertion.
- **E2E** — server + client + durable state assertion.
- **LIVE** — requires a separately authorized activation/sandbox/live-provider check.
- **AN** — analytics/learning stage after publication fixtures exist.

A single AT may require more than one layer.

## Canonical fixture families

| Fixture | Scenario | Truth / trap being exercised | Expected result |
|---|---|---|---|
| F01 | owner-supplied exact product | model/variant/seller dimensions align | Verifier may return `exact`; route can continue |
| F02 | visually similar, conflicting model | appearance matches but model number conflicts | never `exact`; hold/unresolved or alternative path |
| F03 | substitute commercial item | useful but not same item | explicit alternative/substitute wording only |
| F04 | high-score unresolved candidate | opportunity 90+ but identity unresolved | ranked candidate may appear; generation/exact commerce gate remains blocked |
| F05 | viral media, rights unknown | visible/researchable video/photo without reuse permission | analysis-only; final use falls back or holds |
| F06 | public event G1 + relation R2 | reliable public context, exact product/use unresolved | product hypothesis allowed; no endorsement/exact-use implication |
| F07 | rumor/private-life G4/R5 | viral but blocked context | issue-linked route blocks regardless of attention |
| F08 | three URLs, one origin | repost/mirror/quote dependence | counts as one evidence origin |
| F09 | stale price/stock | previously verified volatile fact exceeds TTL | current-price claim becomes stale; reverify/omit/qualify |
| F10 | commercial destination mutation | same URL now points to changed product/variant/seller | prior mapping invalid; reverify/reapprove |
| F11 | upstream mutation after approval | evidence/draft/media/destination changes after review | Guardian/human approval becomes stale; old decision rejected |
| F12 | run budget exhausted | specialist/source allowance reached | partial/hold/block; no extra agent or silent scope widening |
| F13 | unsupported endorsement wording | draft says public figure recommends/uses product without relation proof | Guardian revise/block |
| F14 | no viable day | candidates repetitive/stale/blocked/weak | fewer candidates or `오늘 추천 없음` |
| F15 | first-hand wording without UsageRecord | draft claims personal use from research only | wording rejected/revised to research framing |
| F16 | remote publish timeout | deterministic publisher double returns unknown outcome | `unknown_remote_state`; no blind retry |
| F17 | expired/revoked publish auth | preflight authorization invalid | dispatch blocked with actionable auth state |
| F18 | suppressed product/category | prior owner suppression exists | future candidate selection honors suppression |
| F19 | personal/raw source data excess | source payload includes irrelevant personal fields | minimized/redacted persistence only |
| F20 | contaminated upstream fact repeated by agents | Strategist/Writer/Guardian repeat same unsupported fact | confidence does not increase; Verifier packet remains authority |
| F21 | cross-device stale decision | mobile opened rev N, desktop creates rev N+1 | rev N approval compare-and-set fails |
| F22 | warning overload | blocker + material change + informational notices | blocker/change dominates; approval disabled until resolved |
| F23 | duplicate/portfolio concentration | 20 candidates include near-duplicates and same-lane clustering | final set uses portfolio/repetition reason codes, not top score only |
| F24 | publishable media fallback | candidate useful, external viral asset not reusable, owned/text fallback available | allowed fallback selected without lowering rights threshold |

## AT-01 through AT-44 ownership

| AT | Primary layer | Fixture(s) / method | First Harness Spike |
|---|---|---|---:|
| AT-01 Daily inbox | UI/E2E | F01/F03/F04/F05/F18 mixed set | later vertical slice |
| AT-02 Discovery boundaries | H | discovery fixture where Scout cannot assert exact/rights | later Scout slice |
| AT-03 Celebrity/issue safety | H | F06, F07 | later issue slice |
| AT-04 Exact product verification | H | F01, F02 | **yes** |
| AT-05 Media rights | H | F05 | later media slice |
| AT-06 Four strategies | H | F01 | **yes** |
| AT-07 Four drafts | H | F01 | **yes** |
| AT-08 Guardian independence | H | F13 | **yes** |
| AT-09 Human approval | H + E2E | F01, F11 | **yes: domain binding; UI later** |
| AT-10 Affiliate exact vs alternative | H | F03 | later commercial slice |
| AT-11 Publishing reconciliation | H + LIVE | F16 with publisher double; later real sandbox | later publishing slice |
| AT-12 Analytics guardrail | AN | blocked high-performance synthetic metrics | later analytics slice |
| AT-13 Provenance | H | F01 lineage | **yes** |
| AT-14 Suppression | H + UI | F18 | later selection/UI slice |
| AT-15 Mobile usability | UI | 360px interaction suite | later vertical slice |
| AT-16 Unknown facts | H | F02/F09 | **yes** |
| AT-17 Fail closed | H | F02/F05/F09/F13 | **yes** |
| AT-18 Audit receipts | H | every first-spike call/tool | **yes** |
| AT-19 Replay lineage | H | F01 replay | **yes** |
| AT-20 Secret handling | H + static/config | sentinel secret fixture; logs/artifacts must exclude value | **yes** |
| AT-21 Budget exhaustion | H | F12 | **yes** |
| AT-22 Accessibility | UI | semantic status/keyboard/touch assertions | later UI slice |
| AT-23 Korean truthfulness | H | F15 | **yes** |
| AT-24 Data minimization | H | F19 | later source/store slice |
| AT-25 Ranking cannot override evidence | H + UI | F04 | **yes: domain; UI later** |
| AT-26 Media fallback | H + UI | F05/F24 | later media slice |
| AT-27 Issue source/relation grading | H | F06/F07 | later issue slice |
| AT-28 Daily operating quality | H + UI | F14 | later selection slice |
| AT-29 Portfolio selection explainable | H | F23 | later Scout/selection slice |
| AT-30 Issue-to-product routing | H | F06/F03/F07 | later issue slice |
| AT-31 Media strategy separation | H | F05/F24 | later media slice |
| AT-32 First-screen hierarchy | UI | 360px Opportunity Inbox | later vertical slice |
| AT-33 Capability-state visibility | H + UI | designed/configured/enabled/verified state fixture | later platform UI slice |
| AT-34 Mobile-first correctness | UI/E2E | touch-only 360px suite | later vertical slice |
| AT-35 Browser/PWA independence | E2E | reload/suspend/no-PWA + server state | later server/UI slice |
| AT-36 Cross-device stale approval | H + E2E | F21/F11 | **yes: CAS/domain; browser later** |
| AT-37 Media/public-figure safety | H | F05/F06/F13 | later media/issue slice |
| AT-38 Human approval binding | H + E2E | F11/F21 | **yes** |
| AT-39 Blind-spot B0 coverage | static/design gate | slice manifest maps B0 before code | **yes** |
| AT-40 Independent-source counting | H | F08 | later evidence slice; may be added to spike if low-cost |
| AT-41 Agent agreement ≠ truth | H | F20 | **yes** |
| AT-42 Approval attention hierarchy | UI + H state | F22 | later UI; state priority can be modeled in harness |
| AT-43 Dispatch authorization freshness | H + LIVE | F17 double, later real auth | later publishing slice |
| AT-44 Affiliate destination mutation | H + E2E | F10 | later commercial/preflight slice |

## First Harness Coding Spike acceptance set

The first spike must not attempt all 44 criteria. It proves the highest-risk contract spine before UI/live integration.

Required AT set:

`AT-04, AT-06, AT-07, AT-08, AT-09(domain binding), AT-13, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-23, AT-25(domain gate), AT-36(domain CAS), AT-38, AT-39, AT-41`

Required fixture set:

`F01, F02, F04, F11, F12, F13, F15, F20, F21`

Optional low-cost extension if it fits without widening architecture:

`F08 / AT-40` source-independence assertion.

## First vertical-slice acceptance set after the spike

When the owner later authorizes the manual-product C vertical slice, add UI/application proof for:

- AT-01
- AT-09 full user decision
- AT-15
- AT-22
- AT-25 visible gate
- AT-32
- AT-34
- AT-35
- AT-36 full cross-device behavior
- AT-38
- AT-42

External publishing remains stubbed.

## Harness oracle rules

A scenario is not `pass` merely because execution finished.

The oracle must fail when any of these occur:

- route skipped a required gate
- specialist output lacks immutable/evidence/version refs
- unsupported fact appears downstream
- `exact` is emitted against conflicting identity evidence
- stale artifact retains approval
- budget limit silently expands
- role count changes from six
- specialist delegates directly to specialist
- blocked state is converted into a lower-priority warning
- fixture truth is presented as current/live truth

## Completion report format

Every implemented scenario should eventually emit a compact report containing:

- baseline commit
- fixture/version
- route
- specialist/tool call counts
- prompt/schema/config versions
- artifact/evidence refs
- stale/revision transitions
- AT IDs executed
- pass/fail/block/partial results
- unexpected deviation

A report without baseline/fixture/AT identity is debugging output, not harness evidence.