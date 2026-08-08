# Project Brief

## Working name

ThreadScout AI

## Problem

A creator who wants to operate a Threads affiliate-content account does not know which products are worth covering, how to distinguish genuine purchase intent from empty engagement, how to create non-spammy drafts quickly, or how to automate safely without losing trust.

## Intended initial user

One Korean-speaking creator operating a personal Threads account from mobile most of the time.

This is a working assumption, not a permanently fixed requirement. Confirm it in the user interview.

## Core value

On the first mobile screen, the user should be able to see the best product candidates for today, understand why each was recommended and what could go wrong, and generate four differentiated draft approaches without publishing anything automatically.

## Proposed content direction

Initial hypothesis:

- value-for-money household products
- family and elementary-school household items
- practical parent/office-worker observations

The exact niche must be confirmed before implementation.

## Proposed operating model

- Product Scout returns 20 candidates.
- Risk and duplication filters reduce them to 5 recommendations.
- Each candidate can generate four content approaches.
- A human can edit, approve, hold, reject, or block future recommendations.
- Only approved drafts are eligible for scheduling or publishing.
- Performance is collected after publication and used as a recommendation signal, not as an instruction to maximize outrage or addiction.

## Phase plan

### Phase 0 — definition

Interview, success criteria, blind spots, traps, references, four designs, architecture choice.

### Phase 1 — draft workspace

Manual product entry, four draft angles, factual-use status, risk checks, edit/approve/hold/reject.

### Phase 2 — product discovery

Candidate ingestion, keyword/product normalization, purchase-intent classification, saturation and risk scoring.

### Phase 3 — publishing integration

Approval-gated scheduling, idempotent publishing, status monitoring, failure recovery.

### Phase 4 — analytics feedback

Performance collection, topic/time/format analysis, weekly review, recommendation adjustment.

## Initial constraints

- Mobile-first interface
- Korean primary language
- Human approval required
- Exact product identity required before an affiliate link is attached
- No reliance on unlicensed third-party media
- No claims of personal use without an explicit usage record
- No automated engagement farming
