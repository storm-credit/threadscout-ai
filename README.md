# ThreadScout AI

AI-assisted product discovery and approval-first content operations for Threads.

## Product direction

ThreadScout discovers product candidates, scores purchase intent and content fit, produces four draft angles, runs safety/compliance checks, and lets a human approve before publishing. Performance data is then fed back into the next recommendations.

## Current phase

Phase 1 — a mobile-first local draft workspace is implemented.

No automatic publishing is enabled. The prototype uses fixture products and local storage so the approval, integrity, and queue workflow can be validated before any external API is connected.

## Core flow

1. Collect candidate topics and products.
2. Verify exact product identity and source rights.
3. Score trend, purchase intent, visual fit, saturation, and risk.
4. Generate four content approaches.
5. Run factual, duplication, affiliate-disclosure, and policy checks.
6. Human edits and approves.
7. Publish only approved content.
8. Collect performance after publication and improve future suggestions.

## Repository map

- `CLAUDE.md` — project constitution for AI coding agents
- `docs/PROJECT_BRIEF.md` — goals, users, scope, and assumptions
- `docs/USER_INTERVIEW.md` — unanswered product questions
- `docs/SUCCESS_CRITERIA.md` — measurable completion and stop conditions
- `docs/DESIGN_OPTIONS.md` — four comparable product designs
- `docs/BLIND_SPOTS.md` — product, legal, operational, and business blind spots
- `docs/PRE_IMPLEMENTATION_TRAPS.md` — technical traps to resolve before coding
- `docs/PRODUCT_SCOUT_SPEC.md` — candidate discovery and scoring specification
- `docs/PROMPTING_PLAYBOOK.md` — context dump, prompt refinement, and output review
- `docs/DECISION_LOG.md` — changes from the original plan and their impact
- `docs/ARCHITECTURE.md` — proposed approval-first architecture

## Non-goals for Phase 0

- Automatic comments, likes, follows, or engagement farming
- Publishing without explicit approval
- Claiming first-hand use when the product was not used
- Reposting third-party media without recorded usage rights
- Hiding affiliate relationships
- Building a multi-tenant SaaS before the personal workflow is validated

## Next gate

Run `npm start`, test the local approval workflow, and validate the working assumptions before connecting product discovery or Threads publishing APIs.
