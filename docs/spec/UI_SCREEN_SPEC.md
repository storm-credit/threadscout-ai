# UI Screen Specification v1

Status: DESIGN ONLY

## 1. Goal

The mobile UI must let the user answer, within the first screen and without opening every detail:

1. what is worth considering today
2. why it is interesting now
3. whether the evidence is ready
4. whether a media asset can actually be published
5. what the next safe action is

The UI must not hide blockers behind a single score.

## 2. Four first-screen options

| Option | First screen | Strength | Weakness | Decision |
|---|---|---|---|---|
| A. Feed | chronological candidate feed | familiar | weak prioritization | reject |
| B. Scoreboard | ranked numeric list | fast comparison | false confidence from one score | reject |
| C. Kanban | discovered / verify / draft / approve columns | operational clarity | poor on narrow mobile | secondary desktop view only |
| D. Opportunity Inbox | five ranked cards with why-now + evidence + risk + next action | best daily decision support | card density must be controlled | **selected** |

## 3. Global navigation

Mobile bottom navigation:

- `오늘` — daily opportunity inbox
- `검증` — candidates waiting for evidence or rights
- `초안` — strategy/draft workspace
- `예약` — approved schedule queue
- `성과` — weekly metrics and learning summary

Settings, source readiness, suppression lists, and audit details sit behind a secondary menu rather than competing with the daily workflow.

## 4. Screen S01 — Today / Opportunity Inbox

### Header

- date and timezone
- source freshness indicator
- `외부 게시` status: disabled / enabled
- unresolved blocking-system alert, if any

### Summary strip

Show four small counters:

- raw candidates observed
- recommended candidates
- verification-needed candidates
- approved/scheduled candidates

### Candidate cards

Show maximum five primary cards before a `더 보기` action.

Each card contains:

- product/candidate name
- lane badge: practical-novel / family / travel-desk-storage / curiosity / issue-triggered
- `why now` one-line reason
- `reader value` one-line reason
- opportunity score
- evidence readiness state, separate from score
- risk state, separate from score
- exact-match state
- media publication state
- issue freshness when issue-triggered
- top blocker or uncertainty
- primary CTA

Primary CTA states:

- `근거 확인` when evidence is incomplete
- `전략 4개 만들기` when evidence is sufficient
- `초안 검토` when drafts exist
- `승인 검토` after Guardian pass
- disabled with reason when blocked

### Card rule

A high score never turns a blocked CTA into an enabled CTA.

## 5. Screen S02 — Candidate Detail

Sections appear in this order:

1. Why now
2. Reader value
3. Source timeline
4. Exact-product match
5. Issue/public-figure relationship, if any
6. Media evidence and publication rights
7. Commerce snapshot
8. Verified claims / prohibited claims
9. Risks and unresolved conflicts
10. Action history

The detail view must visibly separate:

- `관심 근거`
- `제품 동일성 근거`
- `사진/영상 사용권`
- `판매 링크 근거`

These are independent proof questions.

## 6. Screen S03 — Evidence Workbench

Designed for unresolved candidates.

### Left/top summary

- current canonical hypothesis
- match state
- confidence label
- staleness state

### Evidence groups

- social observations
- official/public sources
- listing evidence
- media references
- user-supplied evidence
- conflict list

### Actions

- mark source irrelevant
- request another source pass
- attach user photo/reference
- mark exact / likely / substitute / unresolved
- hold candidate

Only Evidence Verifier may produce the final evidence packet; UI actions are user evidence/decision inputs, not silent verification overrides.

## 7. Screen S04 — Strategy Board

Four strategies must be visible in a comparable layout.

Each strategy card shows:

- angle title
- reader promise
- hook logic
- proof required
- recommended media treatment
- CTA logic
- commercial intensity: none / soft / affiliate
- primary weakness

Mobile layout: horizontally swipeable four-card set plus a compact comparison table toggle.

The user can select one primary strategy while keeping the other three for later.

## 8. Screen S05 — Draft Review

Each draft shows:

- hook
- body
- limitation/caution
- CTA
- affiliate disclosure
- claim-to-evidence chips
- media asset state
- Guardian decision

Guardian results are placed above the approval CTA.

CTA states:

- `수정 필요`
- `차단됨`
- `사람 승인`

There is no `바로 게시` button in the draft screen.

## 9. Screen S06 — Human Approval

Approval is a distinct action, not a side effect of saving.

Approval panel binds:

- exact draft revision
- exact evidence packet revision
- exact media asset revision
- affiliate mapping revision
- disclosure version
- approval timestamp and actor

If any bound artifact changes materially, approval becomes stale.

## 10. Screen S07 — Schedule Queue

Each item shows:

- product
- draft version
- planned time
- evidence freshness
- preflight status
- external publishing status

States:

- approved
- scheduled
- needs-reapproval
- preflight-blocked
- publishing
- published
- unknown-remote-state
- failed
- cancelled

## 11. Screen S08 — Performance / Weekly Learning

Do not show one vanity leaderboard only.

Separate:

- attention: views, reach where available
- engagement quality: meaningful replies, saves/bookmarks where available
- purchase intent: product/link questions, clicks where available
- commerce: attributable conversion/revenue where available
- trust/safety: hides, reports, Guardian blocks, disclosure errors

Weekly recommendations must state evidence strength and sample size.

## 12. Screen S09 — Source & Rights Status

For each configured source show:

- selected / deferred / rejected / fallback
- enabled state
- credential readiness without secret values
- permission readiness
- last successful read
- freshness
- retention policy
- allowed actions

For media sources show separate permissions for:

- analyze
- store metadata
- embed/link
- download
- transform
- republish

## 13. Screen S10 — Suppression & Safety Controls

User controls:

- blocked product
- blocked brand
- blocked category
- blocked keyword
- blocked public figure/topic
- blocked source
- temporary mute with expiry

Restoring an item requires an explicit user action and is logged.

## 14. Responsive rule

360 px width is the minimum design review width.

At that width the first card must still display:

- candidate name
- why-now
- score
- evidence state
- risk state
- primary CTA

No critical state may be communicated by color alone.
