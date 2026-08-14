# Design Acceptance Tests — Addendum v1

Status: DESIGN ONLY. These are behavioral criteria, not implementation test code.

## AT-29 Portfolio selection is explainable

Given twenty synthetic candidates, the final five cannot be derived from opportunity score alone. Inclusion/exclusion must expose evidence, risk, freshness, suppression, and portfolio reasons.

## AT-30 Issue-to-product routing

Given a candidate whose commercial item is only a substitute, final copy must label it as an alternative. A blocked issue or relationship state prevents issue-linked promotion regardless of score.

## AT-31 Media strategy separation

A useful research reference never becomes final-use material automatically. The final-use funnel must resolve an allowed treatment or fall back to text-only/hold.

## AT-32 Selected first-screen hierarchy

At 360 px, the Opportunity Inbox must show candidate name, why-now, opportunity score, evidence state, risk state, dominant blocker, and primary CTA without horizontal scrolling.

## AT-33 Design gate visibility

With unresolved P0 items, the design may remain reviewable while implementation resume stays blocked. Provisional P1 values are simulation defaults only until explicitly promoted.

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
