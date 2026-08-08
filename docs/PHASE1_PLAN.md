# Phase 1 Plan — Draft Workspace

## Goal

Deliver a mobile-first, approval-first local prototype that helps one Korean Threads creator choose a product, review four genuinely different draft angles, validate truth and rights, approve a draft, and place it in a local-only schedule queue.

## User-visible success conditions

1. The first mobile screen shows five scored product candidates and their reasons and risks.
2. Every candidate can open a workspace that generates four differentiated drafts.
3. The user can edit evidence fields and draft text.
4. Approval is blocked when product identity, media rights, disclosure, or first-hand claims are unresolved.
5. Hold, reject, block, approve, reset, filter, and local queue actions work.
6. State persists in local storage.
7. External publishing remains disabled.

## Technical verification

- documentation checker passes
- unit tests pass
- web action smoke test passes
- local HTTP server returns the dashboard and JavaScript modules
- no dependency install is required

## Non-goals

- Threads API connection
- automated product scraping
- actual affiliate-link generation
- external database
- multi-user authentication
- automated comments, likes, follows, or posting

## Stop conditions

Stop before external integration if official API permissions, exact product evidence, media rights, or secret handling are unresolved.
