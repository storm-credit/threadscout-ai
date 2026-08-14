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

## AT-29 Portfolio selection is explainable

Given twenty synthetic candidates, the final five cannot be derived from opportunity score alone. Inclusion/exclusion must expose evidence, risk, freshness, suppression, and portfolio reasons.

## AT-30 Issue-to-product routing

Given a candidate whose commercial item is only a substitute, final copy must label it as an alternative. A blocked issue or relationship state prevents issue-linked promotion regardless of score.

## AT-31 Media strategy separation

A useful research reference never becomes final-use material automatically. The final-use funnel must resolve an allowed treatment or fall back to text-only/hold.

## AT-32 Selected first-screen hierarchy

At 360 px, the Opportunity Inbox must show candidate name, why-now, opportunity score, evidence state, risk state, dominant blocker, and primary CTA without horizontal scrolling.

## AT-33 Design gate visibility

A live/account-specific capability may remain disabled behind an activation gate while the design baseline is complete. The UI/ops state must distinguish `designed`, `configured`, `enabled`, and `verified` rather than treating them as synonyms.

## AT-34 Mobile-first web correctness

At narrow mobile width, every critical status and action required for candidate review and approval is available with touch-only navigation and no horizontal scrolling or hover dependency.

## AT-35 Browser/PWA independence

Closing, suspending, reloading, or failing to install the PWA cannot lose a server-accepted approval decision, cancel a valid schedule, or become the reason background publishing succeeds. Correctness remains server/background-worker authoritative.

## AT-36 Cross-device stale approval

Given a draft/evidence/media/affiliate change on desktop after the same candidate was opened on mobile, a stale mobile approval attempt must be rejected and the material change must be shown before reapproval.

## AT-37 Media/public-figure safety

A public or viral image/video may support discovery without becoming publishable. Generated/transformed media must never imply that a real public figure used, recommended, or endorsed a product without the corresponding verified relation evidence.

## AT-38 Human approval binding

The publication candidate must bind the exact approved draft, evidence packet, media asset set, and affiliate mapping revisions. A material hash/version mismatch invalidates the approval.

## AT-39 Blind-spot B0 coverage

Before an implementation slice begins, every B0 item in `FINAL_BLIND_SPOT_SWEEP.md` that applies to that slice must map to a requirement, design authority, or acceptance behavior. An unmapped B0 item keeps the slice blocked.

## AT-40 Independent-source counting

Given three URLs that all reproduce or quote the same original source, corroboration counts them as one origin rather than three independent pieces of evidence. A second independent origin is required when the applicable evidence rule requires independence.

## AT-41 Agent agreement does not manufacture truth

Given an upstream factual error repeated by Strategist, Writer, and Guardian context, the system must not increase factual confidence merely because multiple agents repeated it. Downstream factual claims remain bounded by the Verifier evidence packet and evidence class.

## AT-42 Approval attention hierarchy

When a review contains both a blocker/material-change notice and several informational warnings, the blocker/change is presented before the approval CTA and cannot be visually buried by low-priority notices. Approval of a stale or materially changed artifact is disabled until re-review.

## AT-43 Dispatch authorization freshness

If publishing authorization is expired, revoked, or invalid at preflight, dispatch stops with an actionable authorization state. It cannot silently refresh with an unapproved identity, bypass the gate, or treat a prior approval as permission to publish through another account.

## AT-44 Affiliate destination mutation

If the same commercial URL now resolves to a different product, variant, package, or materially different seller destination than the approved mapping, preflight invalidates the mapping and requires new verification/reapproval rather than publishing with the old exact-product claim.

## Design acceptance gate

Master Design v1 is accepted when:

- every MVP capability has named design authority
- every current B0 blind spot has traceability and behavioral acceptance coverage
- owner direction and reversible defaults are recorded
- live/account-specific facts are either verified or explicitly deferred behind disabled capabilities
- traceability has no known orphaned requirement/test references
- implementation authority and prototype status are clearly separated

Master Design v1 satisfying these conditions does **not** mean code is implemented or live services are enabled.
