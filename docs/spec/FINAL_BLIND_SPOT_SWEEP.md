# Final Blind-Spot Sweep v1

Status: DESIGN ONLY.

Purpose: challenge the current Master Design before promotion. This is not a list of implementation bugs; it identifies assumptions the design could still be wrong about.

## Severity legend

- **B0** — could invalidate the product or create serious trust/safety risk
- **B1** — could materially damage usefulness, conversion, or operability
- **B2** — optimization/quality risk that can be deferred behind measurement

## 1. Product-value blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-01 | B0 | "interesting product" can become the goal instead of "useful decision for the reader" | Candidate ranking must include utility and buying-decision value; curiosity-only lane remains capped. |
| BS-02 | B1 | product discovery may produce more work than manual browsing | daily query/run budgets, top-five inbox, and `오늘 추천 없음` are valid outcomes |
| BS-03 | B1 | affiliate monetization can distort ranking toward high-commission but low-value items | commercial value is downstream and cannot override evidence/risk/user value |
| BS-04 | B1 | optimizing for one account may overfit quickly | analytics must distinguish repeated signal from small-sample coincidence |
| BS-05 | B2 | a fixed content-lane mix can become stale | ratios are starting guardrails, not permanent ranking law |

## 2. Mobile-first web / PWA blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-06 | B0 | background scheduling cannot rely on browser/PWA lifecycle | all scheduling, freshness checks, and publishing belong to server/background workers |
| BS-07 | B1 | mobile browser may suspend tabs during approval/upload | server-authoritative run state, resumable drafts, idempotent user actions |
| BS-08 | B1 | PWA push/install behavior differs by OS/browser | PWA features are optional enhancement, never a correctness dependency |
| BS-09 | B1 | camera/file upload may be awkward for repeated product media work | measure upload friction; native app reconsideration has an explicit evidence gate |
| BS-10 | B1 | five cards plus evidence/risk could still overwhelm a small screen | progressive disclosure; first card shows decision summary and blocker state before deep evidence |
| BS-11 | B1 | hover-centric desktop patterns could make mobile unusable | no critical action or information may depend on hover |
| BS-12 | B1 | user may research on PC and approve on phone with stale state | approval must bind the current server artifact hashes; changed evidence invalidates older mobile state |
| BS-13 | B2 | home-screen install may create false expectation of offline capability | offline operation is not promised in MVP; cached shell cannot authorize actions |

## 3. Source / evidence blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-14 | B0 | public visibility may be mistaken for permission to collect, store, or republish | source activation and media action rights remain separate explicit gates |
| BS-15 | B0 | two URLs may still be one underlying source | independence/dependency metadata required before corroboration counts |
| BS-16 | B0 | seller listing may silently change product behind the same URL | affiliate mapping binds product/variant evidence and is rechecked at preflight |
| BS-17 | B1 | source timestamp can mean retrieval time rather than event time | preserve original/observed/retrieved time separately where available |
| BS-18 | B1 | exact product identity may be impossible from social media alone | `likely/substitute/unresolved` are first-class outcomes; commercial mapping cannot upgrade them |
| BS-19 | B1 | deleted/edited source can invalidate a previously safe post | store evidence snapshot/reference hash and mark downstream state stale on material change |
| BS-20 | B1 | search/trend API data may be incomplete, personalized, delayed, or region-specific | ranking exposes uncertainty and source coverage rather than treating the feed as the market |

## 4. Media blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-21 | B0 | discovering a viral image/video can tempt direct reuse | research-use and publication-use are separate states; prefer user-owned/licensed/text-only fallback |
| BS-22 | B0 | AI-generated imagery can imply a real person used or endorsed a product | never fabricate a real public figure using/endorsing a product |
| BS-23 | B1 | an authorized image can still depict a different variant than the affiliate destination | media-product identity and commerce mapping are independently checked |
| BS-24 | B1 | frame extraction/transformation can create new rights questions | transform permission is an action-specific right, not inherited from viewability |
| BS-25 | B2 | text-only fallback may reduce performance | treat this as an experiment, not justification to lower rights standards |

## 5. Celebrity / public-event blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-26 | B0 | "wore/used" can be rewritten as "recommends" | public-figure relation grades and prohibited implications flow into Writer/Guardian |
| BS-27 | B0 | rumor/private-life virality may look commercially attractive | rumor/private-life lane remains blocked regardless of engagement |
| BS-28 | B1 | old content can resurface and appear current | issue freshness and original publication time must be visible |
| BS-29 | B1 | fandom activity can mimic purchase intent | intent classifier must preserve uncertainty and detect repetitive/coordinated signals where possible |
| BS-30 | B1 | public-figure context can overwhelm the product's actual value | reject/downgrade when product value disappears without fame context |

## 6. Six-agent orchestra blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-31 | B0 | multiple agents can repeat the same wrong premise and create fake confidence | Verifier evidence packet is sole downstream factual authority; confidence is not additive across agents |
| BS-32 | B0 | Guardian can become a rubber stamp because it sees Writer framing | Guardian receives evidence and rule inputs independently and returns structured findings, not a stylistic review only |
| BS-33 | B1 | fixed six roles could force responsibilities into the wrong agent | deterministic services absorb infrastructure work; roster change requires explicit four-option review rather than silent seventh agent |
| BS-34 | B1 | retry loops can waste cost without improving evidence | bounded retry budgets; new evidence is required for Verifier re-evaluation |
| BS-35 | B1 | schema-valid output can still be semantically wrong | handoff has schema, semantic, evidence, and next-action gates |

## 7. Human-approval blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-36 | B0 | approval fatigue can turn "human in the loop" into automatic clicking | approval UI must foreground blockers/changes; low-value/no-op notifications suppressed |
| BS-37 | B0 | user may approve one version but system later publishes another | approval binds exact draft/media/evidence/affiliate hashes |
| BS-38 | B1 | too many warnings can hide the one important warning | notification severity and blocker hierarchy required |
| BS-39 | B1 | cross-device approval can conflict with an edit from another device | optimistic/version checks and stale decision rejection required |

## 8. Publishing / operations blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-40 | B0 | timeout after submit can cause duplicate repost on retry | `unknown_remote_state` and reconciliation before retry |
| BS-41 | B0 | publishing token/permission can expire between approval and dispatch | preflight authorization state; failure stops rather than bypasses |
| BS-42 | B1 | exact price/stock can change minutes before posting | volatile commerce TTL and preflight refresh |
| BS-43 | B1 | issue-linked post can become stale while scheduled | freshness gate at dispatch; invalidate rather than post late |
| BS-44 | B1 | timezone/device locale can shift schedule time | schedule stores explicit timezone and server-normalized timestamp |
| BS-45 | B1 | kill switch may exist but be inaccessible during incident | kill switch is an operational control outside agents and must be reachable independently of AI runtime |

## 9. Analytics / learning blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-46 | B0 | high-view misleading celebrity posts could train the system toward unsafe content | unsafe/blocked patterns excluded from learning even if performance is high |
| BS-47 | B1 | clicks/conversions may not be attributable accurately | metrics label unknown/partial attribution; no false causal claims |
| BS-48 | B1 | small samples can cause rapid oscillation in ranking weights | minimum sample/confidence requirement before promotion of patterns |
| BS-49 | B1 | platform algorithm changes can invalidate historical conclusions | time-bounded learning and periodic reset/review |
| BS-50 | B2 | user rejection may reflect timing rather than content quality | preserve reason codes instead of treating all rejection as negative product signal |

## 10. Security / privacy blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-51 | B0 | public repository makes accidental secret leakage especially costly | production secrets remain external; repository must never be credential authority |
| BS-52 | B0 | source excerpts may contain personal data even when the source is public | data minimization, redaction class, retention TTL, and no unnecessary raw payload storage |
| BS-53 | B1 | logs/artifacts can leak URLs/tokens/query parameters | secret redaction before persistence and user-visible diagnostics |
| BS-54 | B1 | a compromised agent tool handler can bypass role intent | reviewed deterministic tool registry with mutability classes and no publishing/payment tool for agents |
| BS-55 | B1 | audit hashes prove integrity but not completeness or truth | hashes are consistency evidence only; truth still depends on source/evidence class |

## 11. Business / scope blind spots

| ID | Severity | Blind spot | Design response |
|---|---|---|---|
| BS-56 | B1 | building a sophisticated orchestra before proving the daily habit may over-engineer the product | MVP remains one-owner, one-account, limited lane; no multi-tenant SaaS/billing |
| BS-57 | B1 | daily 0–3 target can be misread as requirement to fill slots | zero posts is valid when evidence/value is weak |
| BS-58 | B1 | a successful content format can make the account repetitive | duplicate/portfolio guardrails operate above per-post quality |
| BS-59 | B2 | affiliate revenue may be too low to justify operational cost | track time/cost/revenue separately before expanding automation |

## 12. Final assessment

No newly identified blind spot requires changing the fixed six-agent architecture or the selected mobile-first responsive web direction.

The most important implementation gates remain:

1. server-authoritative state; never browser/PWA-authoritative scheduling
2. exact artifact binding for approval and cross-device stale-state rejection
3. source/media rights separation
4. public-figure relation wording controls
5. unknown-remote publishing reconciliation
6. metrics learning that cannot reward unsafe patterns
7. explicit operational cost/value measurement before scope expansion

## Promotion rule

This sweep is not considered closed by documentation alone. Each B0 item must map to either an existing requirement/acceptance rule or a new one before the corresponding implementation slice begins.
