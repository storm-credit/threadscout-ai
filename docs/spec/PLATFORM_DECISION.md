# Platform Decision v1

Status: DESIGN BASELINE.

## Decision

ThreadScout v1 is a **mobile-first responsive web application**.

- primary interaction target: mobile browser at narrow width
- desktop: fully supported for research-heavy review
- PWA: architecture-ready, but installability is not an MVP acceptance requirement
- native iOS/Android: out of MVP
- backend/application state: shared across devices

## Why this fits the product

ThreadScout's primary recurring actions are short review decisions rather than long-form creation sessions:

- inspect today's opportunities
- open evidence and media references
- compare four strategy angles
- review four drafts
- approve, hold, reject, or suppress
- check schedule/preflight status

These actions should be possible from a phone without forcing the user to sit at a desktop. At the same time, detailed evidence inspection and configuration benefit from a larger screen. A responsive web application lets both contexts use one authority/state model.

## Cross-device operating model

A run is server-authoritative, not browser-authoritative.

Example:

```text
Desktop
  research/evidence inspection
        ↓
shared account/run state
        ↓
Mobile
  Guardian result → final approval
        ↓
background scheduler
```

No decision is considered complete because one browser tab has local state.

## Mobile-first rules

- essential blockers and action state must be visible without horizontal scrolling
- first screen shows at most five recommendation cards
- primary CTA must remain reachable with one-hand use
- evidence details may progressively disclose beneath the decision summary
- no critical state may be conveyed only by hover
- upload controls must support mobile file/camera selection where browser capability allows
- interruption/reload must not lose a server-accepted decision

## Desktop rules

Desktop may expose denser evidence, side-by-side comparisons, audit lineage, and configuration panels, but cannot gain authority unavailable on mobile. The same approval and blocker rules apply on every device.

## PWA boundary

PWA-related features are optional enhancements:

- home-screen installation
- push notifications where supported
- share target where supported
- cached application shell

They must degrade safely. Scheduling, publication, evidence freshness, and background processing must never depend on a service worker or an open browser tab.

## Native-app revisit gate

Native development requires evidence of a persistent problem that responsive web/PWA cannot solve acceptably. The proposal must compare four options again and show measurable benefit in at least one of:

- capture/upload completion rate
- notification reliability
- approval latency
- share/import friction
- offline requirement
- user retention attributable to native capability

## Acceptance implications

Future implementation tests must include narrow mobile width, desktop width, reload/interruption recovery, cross-device stale-state behavior, touch-only navigation, and absence of hover-only critical actions.
