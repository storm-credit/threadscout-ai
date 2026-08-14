# P0 / P1 Design Decision Table v1

Status: **APPROVED DESIGN BASELINE**. Live/account-specific activation checks remain fail-closed runtime gates; they no longer block completion of the design baseline.

## Promoted design decisions

| ID | Decision | Approved baseline |
|---|---|---|
| D-01 | v1 delivery platform | mobile-first responsive web app; desktop supported; PWA-ready; native apps outside MVP |
| D-02 | browser authority | browser/PWA never owns scheduling, publication, durable approval, or evidence truth state |
| D-03 | native-app revisit | reconsider only if measured browser/PWA friction materially harms capture, notification, approval, share/import, offline need, or retention |
| D-04 | product mode | one owner, one primary Threads account, Korean-first, approval-first |
| D-05 | orchestration | exactly six agents; no price agent; infrastructure and irreversible operations remain deterministic services |

## P0 — final disposition

A P0 may be **resolved by design** or **explicitly deferred behind a disabled live capability**. Deferred activation checks are not permission to guess.

| ID | Decision | Final design disposition | Activation rule |
|---|---|---|---|
| P0-01 | target Threads capabilities | **design resolved / account activation deferred** | Meta's Threads API architecture supports OAuth-based publishing, keyword discovery, and insights. The target app/account must still pass scope/token preflight before live discovery, insights, or publishing is enabled. |
| P0-02 | exact-product listing evidence source | **resolved for MVP** | MVP accepts a user-supplied commercial destination and captures a versioned product/variant/seller snapshot. Automated exact-product search is not required and cannot silently upgrade `likely/substitute/unresolved` to `exact`. |
| P0-03 | first affiliate program | **Coupang Partners selected; live operating-rule verification deferred** | Commercial output may be prepared for Coupang Partners, but live affiliate posting remains disabled until current account-specific disclosure/link requirements are reviewed at activation time. |
| P0-04 | deployment environment | **resolved architecture class** | single-region managed server/runtime for API+worker, managed PostgreSQL for durable operational state, object storage for permitted media/artifacts; exact vendor is implementation-time replaceable configuration |
| P0-05 | production credential storage | **resolved** | platform-managed secret storage or encrypted server-side secret injection only; never Git, browser bundle, client storage, prompt artifact, or normal application log |
| P0-06 | source-specific media actions | **resolved fail-closed baseline / source activation deferred** | discovery media is research-only by default. Final-use media must be user-owned, explicitly licensed/permitted for the intended action, or use an explicitly allowed native link/embed treatment. Unknown rights remain blocked. |

## P1 — approved baseline defaults

The owner has instructed the design to proceed automatically to completion. The following safe, reversible defaults are therefore promoted as the v1 baseline. They remain configuration values and may later be calibrated from measured use without weakening safety/evidence gates.

| ID | Decision | Approved v1 default |
|---|---|---|
| P1-01 | daily posting capacity | 0–3 posts; never a quota |
| P1-02 | affiliate-heavy content | normally no more than one per day |
| P1-03 | first-screen density | maximum five recommendations |
| P1-04 | opportunity review floor | 65/100 as an initial review/ranking heuristic only; never overrides evidence/risk/freshness/blockers |
| P1-05 | current price/stock freshness | 4 hours when the post explicitly states current price or stock |
| P1-06 | listing identity freshness | revalidate within 24 hours of scheduled publication and again at dispatch if material commerce facts are shown |
| P1-07 | fast issue-linked freshness | 12 hours; original-event time must remain distinguishable from retrieval time |
| P1-08 | attention-signal freshness | 6 hours for ranking input |
| P1-09 | suppression | persists until explicit restore by the owner |
| P1-10 | source excerpt retention | 30 days by default; shorter when source policy/privacy requires |
| P1-11 | media metadata retention | 90 days by default; actual media bytes are retained only when rights and product need justify it |
| P1-12 | audit retention | 365 days by default, excluding secrets and unnecessary raw source payloads |
| P1-13 | primary review cadence | morning / midday / evening review windows; schedule slots are configurable and may be skipped |
| P1-14 | supported client posture | touch-first mobile Safari/Chrome plus current desktop evergreen browsers; no critical action may depend on hover, PWA install, or an open tab |
| P1-15 | upload baseline | images and short-form videos are accepted only through server-validated upload flows; exact byte limits are configuration, not business logic, and must be set before the media implementation slice |
| P1-16 | notification posture | notify only for blocker/material change/approval-needed/publish incident states; informational noise is suppressed |

## Live activation matrix

| Capability | Design complete? | Enabled by design? | What must still happen at implementation/operation time |
|---|---|---|---|
| local/manual candidate workflow | yes | eligible for implementation | implementation tests |
| user-supplied product/link verification | yes | eligible for implementation | actual listing parser/manual confirmation behavior |
| Threads keyword discovery | yes | **disabled until configured** | verify current Meta app/account scope and token |
| Threads insights | yes | **disabled until configured** | verify current Meta app/account scope and available metrics |
| Threads publishing | yes | **disabled until configured** | verify current publish scope, identity, token, preflight, reconciliation, kill switch |
| Coupang affiliate publication | yes | **disabled until configured** | verify current account/program disclosure and destination rules |
| third-party media republication | yes | **blocked by default** | source/asset-specific final-use rights evidence |

## Change rule

A configuration change may tune capacity, thresholds, TTLs, retention, or UI density. It may not weaken the fixed six-agent boundary, human approval, exact-product semantics, media-rights separation, public-figure safety rules, evidence independence, fail-closed publishing, or approval-version binding without a new design decision and blind-spot review.
