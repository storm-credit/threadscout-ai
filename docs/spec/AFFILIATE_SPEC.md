# Affiliate Mapping & Disclosure Specification v1.2

## 1. Purpose

Affiliate monetization is downstream of product verification. A commission opportunity never upgrades weak evidence, and creator commission/ROI calculations live in the deterministic `affiliate_yield_service` outside the `Verifier` factual `evidence_packet`.

## 2. Supported affiliate networks, manual snapshot schema & acquisition rules

1. **Coupang Partners (`coupang_partners`):**
   - **Pre-API manual mode:** before the account clears Coupang's API issuance gate (`>= ₩150,000` cumulative sales and final channel approval, `reported`), the owner supplies an official partner short-URL plus a structured `CanonicalListingSnapshot` (`{ brand, model, variant, seller, destinationUrl, capturedAt }`), corroborated by an independent second origin (`AT-40`) before `Verifier` may emit `product_state = 'exact'`.
   - **Approved API mode (disabled until explicit owner activation):** deterministic search calls enforce a token-bucket ceiling of `<= 10` search calls per rolling 60-minute window (`<= 50`/hr for report endpoints, `reported`).
2. **Naver Shopping Connect / Brand Connect (`naver_shopping_connect`):**
   - Because no official external Open API exists (`reported`), links are always owner-issued from the official partner console and paired with an owner-supplied `CanonicalListingSnapshot` (`{ brand, model, variant, seller, destinationUrl, capturedAt }`) corroborated by an independent second origin (`AT-40`) for `'exact'`.
3. **Zero-scraping invariant (`CLAUDE.md` §12):** Unauthenticated or session-cookie scraping — whether browser CUA/Playwright/Selenium or plain HTTP `fetch`/`curl` HTML/redirect parsing — is strictly prohibited across all commerce and affiliate domains. Where no official API is enabled, preflight destination revalidation (`<= 24h` pre-dispatch and `7d` rolling on `/showcase`) requires bounded owner snapshot re-confirmation rather than automated HTML fetching.

## 3. Mapping states & compatibility with `product_state`

- `exact` — destination is verified as the exact product/variant represented in copy; allowed **only** when candidate `product_state === 'exact'`
- `alternative` — intentionally suggested substitute explicitly labelled as an alternative; allowed when `product_state` is `'exact'` or `'substitute'` (`likely` and `unresolved` candidates are blocked from Public Verified Showcase projection per `PLATFORM_DECISION.md`)
- `none` — non-commercial candidate with no affiliate/compensated destination

## 4. Required mapping record

- `candidate_id`
- `state` (`'exact' | 'alternative' | 'none'`)
- When `state` is `'exact'` or `'alternative'` (all non-null):
  - `affiliate_network` (`'coupang_partners' | 'naver_shopping_connect'`)
  - `acquisition_mode` (`'manual_owner_link' | 'approved_official_api'`)
  - `destination_url` (HTTPS URL) and `canonical_listing_snapshot` (`{ brand, model, variant, seller, destinationUrl, capturedAt }`)
  - `verification_timestamp` and `evidence_refs`
  - `disclosure_policy_version` and verbatim `required_disclosure_text`
- When `state === 'none'`: `affiliate_network`, `acquisition_mode`, `destination_url`, `canonical_listing_snapshot`, `disclosure_policy_version`, and `required_disclosure_text` are explicitly `null`.

## 5. Offset-`0` verbatim disclosure rule & post-publication monetization lock

A **commercial solicitation surface** is defined closedly as any of:
1. **Direct commercial URL draft:** any Threads draft containing a URL that resolves (directly or via any custom shortener/redirect) to a purchasable listing, storefront, or compensated landing page (any URL outside an explicitly configured exact-hostname non-merchant reference allowlist — e.g. `news.naver.com` never wildcard-matching `smartstore.naver.com` — is treated as commercial by default);
2. **Indirect showcase-pointer draft:** any Threads draft whose `cta` enum or text cues (`#042`, `42번`, `/showcase/42`, `쇼케이스`, `프로필 링크`, `바이오`, `소개란`) direct readers to a showcase card whose bound `AffiliateMapping.state` is `'exact'` or `'alternative'`, **or** to the general profile `/showcase` index when one or more non-stale approved showcase cards carry a non-null `verifiedDestinationUrl`;
3. **Monetized showcase card:** both `/showcase` index cards and `/showcase/:cardNumber` detail views whenever `verifiedDestinationUrl` is non-null.

Every commercial solicitation surface must place the verbatim `required_disclosure_text` at **Unicode code-point offset `0`** on text surfaces (zero preceding characters, hooks, emojis, or whitespace) and as the **first visible, non-clipped, readable-contrast (`>= 4.5:1`, `>= 12px`, non-`sr-only`) text block** above title/media/CTA on HTML surfaces (`AT-45`, `BS-60`). Non-commercial drafts (zero commercial URLs and zero pointers to monetized cards/showcase) pass without disclosure (`stays-quiet`).

**Post-publication monetization lock (`BS-60`):** Once any Threads post referencing a candidate's card (`#NNN` / `N번` / `/showcase/N`) or `/showcase` enters `published` or `unknown_remote_state` without offset-`0` statutory disclosure on that root post, that `#NNN` card is permanently locked to `AffiliateMapping.state === 'none'` (`verifiedDestinationUrl: null`). Monetizing the product later requires creating a new candidate/card and a newly disclosed post.

## 6. Public-figure rule

An affiliate post or `#NNN` card must never imply that a celebrity/public figure endorses the affiliate destination unless official endorsement (`R0`/`R1`) is confirmed:
- confirmed public use + no endorsement → describe public context only, never recommendation
- `alternative` → explicitly state that the linked item is a similar/alternative product (`같은 제품이 아니라 비슷한 대체품` / `비슷한 제품`)
- unknown exact product → never use "same item" language

## 7. Price language & destination mutation

Current price may appear only from a timestamped commerce snapshot within the 4h TTL (`MASTER_SPEC.md`). Any change in product, variant, package, or seller reported by an approved official API or owner re-confirmation invalidates prior approval (`AT-44`) and withdraws any published `PublicShowcaseCard` (`stale`).

## 8. Conversion learning

Confirmed net-of-cancellation payout metrics may inform category/angle evaluation via `affiliate_yield_service` when legitimately available, without ever rewarding misleading, rumor-based, hidden-disclosure, or blocked patterns.
