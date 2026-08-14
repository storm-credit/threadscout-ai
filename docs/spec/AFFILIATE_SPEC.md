# Affiliate Mapping & Disclosure Specification v1

## 1. Purpose

Affiliate monetization is downstream of product verification. A commission opportunity never upgrades weak evidence.

## 2. Mapping states

- `exact` — destination is verified as the exact product/variant represented in copy
- `alternative` — different but intentionally suggested substitute
- `none` — no safe or useful affiliate destination

There is no “close enough but label as exact” state.

## 3. Required mapping record

- candidate/product ID
- destination product/listing reference
- affiliate network
- exact/alternative state
- seller
- variant/package
- verification timestamp
- evidence refs
- disclosure policy version

## 4. Disclosure

Affiliate relationship must be clear and visible according to current applicable platform/network/legal rules. Disclosure text is configurable and versioned; it must not be hidden only in an inaccessible secondary context when policy requires clearer placement.

## 5. Public-figure rule

An affiliate post must never imply that a celebrity/public figure endorses the affiliate destination unless an official endorsement is actually verified.

Examples:

- exact confirmed public use + no endorsement → describe use/context, not recommendation
- substitute → explicitly label as similar/alternative
- unknown exact product → do not use “same item” language to increase clicks

## 6. Price language

Current price may be included only from a timestamped commerce snapshot. Prefer wording that survives change unless the post's value depends on exact price.

If price is stale at preflight:

- refresh and require reapproval if materially changed, or
- remove the exact price claim

## 7. Broken/unavailable links

Preflight handles:

- listing removed
- variant unavailable
- seller changed
- destination redirects unexpectedly
- product changed behind same URL

Material destination changes invalidate approval.

## 8. Conversion learning

Affiliate conversion/revenue can inform category and format evaluation when legitimately available, but must not cause the system to favor misleading, sensitive, or rumor-based content.
