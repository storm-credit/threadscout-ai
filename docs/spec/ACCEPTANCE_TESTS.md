# Design Acceptance Tests v1

These are behavioral acceptance criteria. They are not implementation test code.

## AT-01 Daily inbox

Given at least five viable candidates, the mobile first screen shows up to five with why-now, reader value, uncertainty, exact-match, rights, and blockers.

## AT-02 Discovery boundaries

Given a discovery run, Scout may produce hypotheses from allowed sources but cannot mark a listing exact or media publishable.

## AT-03 Celebrity/issue safety

Given a trending dating rumor with no product-relevant public evidence, the candidate is blocked. Given a verified public broadcast moment with purchase questions, it may proceed to verification without implying endorsement.

## AT-04 Exact product verification

Given a visually similar listing but conflicting model number, Verifier cannot return `exact`.

## AT-05 Media rights

Given a publicly visible third-party photo with unknown reuse rights, it may remain internal evidence but cannot be selected for re-upload.

## AT-06 Four strategies

Given one verified product, the Strategist returns four angles with distinct reader jobs/arguments, not paraphrases.

## AT-07 Four drafts

Each of four Writer drafts maps to one strategy angle and all factual claims have evidence refs.

## AT-08 Guardian independence

Given unsupported endorsement wording, Guardian returns revise/block even if the draft is otherwise high performing.

## AT-09 Human approval

No scheduled post exists without a human approval bound to the exact draft/evidence/media/affiliate hashes.

## AT-10 Affiliate exact vs alternative

Given an alternative product, the UI/copy explicitly labels it as similar/alternative and never says it is the same item.

## AT-11 Publishing reconciliation

Given a timeout after submission with unknown outcome, the system enters `unknown_remote_state` and does not blindly post again.

## AT-12 Analytics guardrail

Given a rumor-style post with high views but a policy/trust violation, analytics does not promote rumor hooks as a recommended pattern.

## AT-13 Provenance

User can inspect simplified lineage from discovery through approval and each stage references the correct immutable artifact/evidence versions.

## AT-14 Suppression

When user suppresses a product/category, future Scout runs honor the suppression until user reverses it.

## AT-15 Mobile usability

At narrow width, primary candidate status and approval/blocker CTA remain visible and operable without horizontal scrolling for core controls.

## AT-16 Unknown facts

When current price or exact identity is unavailable, drafts omit/qualify the fact rather than inventing it.

## AT-17 Fail closed

Unknown media rights, unresolved required exact identity, Guardian block, stale critical evidence, or invalid schema prevents progression.

## AT-18 Audit receipts

Each agent/external-source call has a receipt with timing/status/version metadata and no secret values.

## AT-19 Replay lineage

An artifact can be traced to exact input artifact refs, evidence refs, prompt/schema versions, and hash.

## AT-20 Secret handling

No credential value appears in Git, logs, prompts, artifacts, readiness reports, or user-visible error messages.

## AT-21 Budget exhaustion

When source/agent budget is exhausted, Orchestrator returns partial/block status and does not create an extra agent or silently expand queries.

## AT-22 Accessibility

Pass/fail/blocked states have text/icon semantics and are not conveyed by color alone.

## AT-23 Korean truthfulness

Research-based drafts use wording such as “확인해보니/찾아보니” rather than fake first-hand claims; actual first-hand wording requires UsageRecord.

## AT-24 Data minimization

Source collection retains only evidence-required fields and respects defined retention/redaction policy.

## AT-25 Ranking cannot override evidence

Given a candidate with opportunity score 94 but unresolved exact-product identity, the first screen may rank it highly but the CTA remains `근거 확인`; strategy generation and affiliate exact mapping stay disabled.

## AT-26 Media fallback

Given a useful candidate whose viral source video has no republication permission, the system keeps the video as analysis evidence and offers owned/licensed/embed-link/text-only fallback. It never treats public visibility as download-and-reupload permission.

## AT-27 Issue source/relation grading

Given a G0/G1 public event source but only R2 product relation, the system may create a product hypothesis but cannot say the public figure endorsed or used the exact product. Given G4 or R5, issue-linked progression is blocked.

## AT-28 Daily operating quality

Given a day where available candidates are repetitive, rumor-heavy, stale, or lack evidence, the system may return fewer than five recommendations or `오늘 추천 없음` instead of lowering standards to fill three slots.

## Design acceptance gate

Before implementation resumes:

- every MVP requirement has at least one acceptance test
- user has approved the Master Spec direction
- all P0 items are resolved or explicitly deferred behind disabled features
- affected P1 defaults required for the implementation slice are documented
- traceability has no orphaned requirement/test references

P2 experiments may remain open.
