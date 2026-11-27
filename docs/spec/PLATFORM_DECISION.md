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

## Public Verified Showcase surface (`#NNN`) & closed projection schema

Because Meta Threads exposes no Direct Message API (`reported`) and `CLAUDE.md` §5 forbids automated comments/continuation replies, Option B provides a read-only **Public Verified Showcase** web route (`/showcase` and `/showcase/:cardNumber`) alongside the authenticated Owner Operations Surface.

### Closed default-deny public card schema (`PublicShowcaseCard`)

Public projection uses a strict allowlist (`additionalProperties: false`), never log-denylisting. Candidate `product_state` (`'exact' | 'likely' | 'substitute' | 'unresolved'`) and `AffiliateMapping.state` (`'exact' | 'alternative' | 'none'`) map deterministically as follows:

| `product_state` | `AffiliateMapping.state` | Publicly projectable? | `PublicShowcaseCard.matchBadge` |
|---|---|---|---|
| `'exact'` | `'exact'` | **Yes** (when approved & non-stale) | `'exact'` |
| `'exact'` | `'none'` | **Yes** (non-commercial, `verifiedDestinationUrl: null`) | `'exact'` |
| `'exact'` | `'alternative'` | **Yes** (substitute purchase destination) | `'alternative'` |
| `'substitute'` | `'alternative'` | **Yes** | `'alternative'` |
| `'substitute'` | `'none'` | **Yes** (non-commercial substitute) | `'alternative'` |
| `'substitute'` | `'exact'` | **No — invalid combination (hard-blocked)** | — |
| `'likely'` or `'unresolved'` | *any* | **No — hard-blocked from public projection** | — |

Allowed fields (`9` total):

1. `cardNumber` — monotonic, non-recycled sequential positive integer formatted `#NNN` (reserved at `evidence_ready` or `stale` for non-synthetic `exact`/`substitute` candidates so commercial drafts can reference `#NNN` before final approval while remaining withheld from public `/showcase` projection until `approved`; `synthetic` fixture candidates skip automatic `evidence_ready` pre-reservation so initial boot starts at `nextCardNumber = 0`, allocating `#NNN` only if the operator explicitly approves a synthetic preview candidate, and `reset_demo` resets demo state back to `0`)
2. `canonicalProductName` — verified `brand + model + variant` string
3. `matchBadge` — closed enum `'exact' | 'alternative'` derived strictly from the table above
4. `verifiedPros` — 1 to 3 concise synthesized consumer-value bullets explicitly bound into `evidence_packet` and `materialRevision` at verification time (defaulting to `[readerValue]` inside `Verifier` when operator input is blank, and never falling back to unbound fields or operator `internalNotes` / `whyNow`, `BS-37`/`BS-61`), checked in code (after masking exact `canonicalProductName` occurrences) to share zero `>= 12`-character contiguous verbatim substrings with any third-party `rawExcerpt` and zero email / `01X` phone / `@handle` PII tokens (street-address and non-public personal-name checks are human-approval review obligations — `declared, not enforced`)
5. `verifiedLimitation` — non-empty concrete synthesized product/buying caution string explicitly bound into `evidence_packet` and `materialRevision` at verification time (never falling back to internal Strategist copywriting rules, `BS-37`) and subject to the same zero-verbatim-excerpt and PII boundary above
6. `disclosureText` — verbatim statutory disclosure string rendered on both `/showcase` index cards and `/showcase/:cardNumber` as the **first visible, non-clipped, readable-contrast (`>= 4.5:1`, `>= 12px` CSS font-size, non-`sr-only`) text block** above product name, media, and CTA whenever `verifiedDestinationUrl` is non-null (`null` iff `verifiedDestinationUrl` is `null`)
7. `verifiedDestinationUrl` — HTTPS URL from the bound `AffiliateMapping` (rendered with `rel="noopener sponsored nofollow"`, plus anchor-scoped `referrerpolicy="origin"` strictly on non-loopback HTTPS showcase origins — i.e., `https:` origins outside trailing-dot-normalized `localhost`, `*.localhost`, `127.0.0.0/8`, `::1`, `[::1]`, and `[::ffff:127.0.0.0/104]` — while keeping document and subresource `Referrer-Policy: no-referrer`), or `null` when `AffiliateMapping.state === 'none'`
8. `publishableMediaUrl` — HTTPS URL only when `publication_media_state` is `user_owned` or `licensed_commercial`, otherwise `null`
9. `verifiedAt` — ISO-8601 UTC timestamp of the bound `evidence_packet`

Every unlisted property (`rawSourceExcerpts`, `sellerPii`, `opportunityScore`, `internalNotes`, `auditHashes`, `suppressionHistory`, unpermitted media refs) is dropped by construction.

### Dynamic Open Graph social preview & `1080×1350` Slide-2 inspection card export

To support visual purchase conversion on Threads without video-editing overhead or unpermitted third-party media scraping:
1. **Dynamic Open Graph metadata on `/showcase` and `/showcase/:cardNumber`:** Server HTML responses inject per-card `<meta property="og:*">` and `<meta name="twitter:*">` tags derived strictly from a fail-closed validated 9-field `PublicShowcaseCard` (single trailing slashes on `/showcase/:cardNumber/` normalize identically across server OG and client SPA). `${origin}` resolves from configured `THREADSCOUT_PUBLIC_ORIGIN` when set (recommended behind reverse proxies/caches), and otherwise from the RFC-3986 authority-validated `Host` (`X-Forwarded-Host`/`X-Forwarded-Proto` honored strictly when `THREADSCOUT_TRUST_PROXY=true`, with `Vary: Host` emitted whenever `THREADSCOUT_PUBLIC_ORIGIN` is unset). On monetized cards (`verifiedDestinationUrl` and `disclosureText` symmetrically non-null), `og:description` and `<meta name="description">` place the verbatim `disclosureText` at **Unicode code-point offset `0`** without truncation (`AT-45`). `og:image` promotes `publishableMediaUrl` when it is a credential-free `https:` raster URL (`user_owned` or `licensed_commercial` whose pathname does not end in `.svg`, `.svgz`, `.mp4`, `.webm`, `.mov`, `.m4v`, `.avi`, `.mkv`, `.mp3`, `.wav`, `.ogg`, or `.pdf`), and otherwise falls back to `${origin}/api/showcase/:cardNumber/og.png` (`1200×630` `image/png` generated deterministically via `node:zlib`, emitting `og:image:width`/`height` only when the generated fallback is active). Stateless `GET`/`HEAD` requests to exact `/api/showcase-og.png` and `/api/showcase/:cardNumber/(og.png|card.svg)` permit cross-site `Sec-Fetch-Dest: image` and top-level `navigate`/`document` loads while keeping cross-site `fetch('/api/showcase')` JSON blocked (`403`). Requests for unapproved, `stale`, TTL-expired (`remainingMs <= 0`), malformed, missing, or kill-switched cards emit `<meta name="robots" content="noindex, nofollow" />` with neutral generic withdrawn strings only (`og:image` omitted and zero `PublicShowcaseCard` fields present) and return `404`/`503` on `/api/showcase/:cardNumber/og.png` and `/api/showcase/:cardNumber/card.svg`.
2. **Deterministic `1080×1350` (`4:5`) Slide-2 inspection card PNG exporter:** Both Operator Studio Step 3 and `/showcase` provide a 1-click `1080×1350` `image/png` download pairing Slide 1 (`user_owned` / `licensed_commercial` product photo) with Slide 2 (`✕ 사기 전 걸러야 할 한계` + `✔ 교차 확인된 핵심 강점` + 3-point check strip), failing closed whenever any of the 9 `PublicShowcaseCard` fields (including closed `'exact' | 'alternative'` `matchBadge`, ISO `verifiedAt`, or symmetric monetization/disclosure) is missing or invalid. Monetized cards render the high-contrast (`>= 4.5:1`, `allowEllipsis: false`) verbatim statutory disclosure banner as the top element inside the `1080×1350` frame with adaptive font scaling so `1..500`-code-point disclosures never overlap lower sections (`AT-45`), while non-commercial (`verifiedDestinationUrl === null`) cards omit `[광고]`, `#NNN` card stamps, and `/showcase` pointers across exported PNG/SVG cards so non-commercial image uploads remain 100% solicitation-free even prior to `record_manual_publication` (`BS-60`).

### Stale-card withdrawal, bounded snapshot re-confirmation & post-publication showcase TTL

Published showcase cards (`workflowState === 'approved'`, `review.stale !== true`, `cardNumber != null`) carry a **7-day rolling destination-revalidation TTL** (`12h` for fast issue-linked cards; `4h` only while a separate post claims an exact live price). Cards strictly within the proportional expiring-soon window (`0 < remainingMs <= min(24h, ttlMs * 0.25)` — `<= 24h` for `7d` cards, `<= 3h` for `12h` issue cards) surface an operator warning prompt (`#showcase-reconfirm-box`; while `remainingMs > warningWindowMs`, only a collapsed optional re-check details panel is available). Bounded operator snapshot re-confirmation (`reconfirm_showcase_snapshot`) is permitted **only while `remainingMs > 0`**, requires echoing `{ brand, model, variant, seller, destinationUrl }` byte-equal to the bound snapshot (mismatch marks `stale`), preserves existing `strategies`/`drafts`, re-runs deterministic `Guardian` checks, and binds a fresh `approvalHash` to `materialRevision` without consuming the 16-invocation specialist model budget. Once `remainingMs <= 0` (showcase TTL expiry), public `/showcase` and `/showcase/:cardNumber` immediately withdraw the card on read, the operator read model surfaces `showcaseExpiry.expired === true` requiring full re-verification, and any `reconfirm_showcase_snapshot` attempt persists `workflowState = 'stale'` so the card cannot return without Verifier + Guardian + Human Approval.

Once any Threads post referencing a candidate's card (`#NNN`, `N번`, `/showcase/N`) or `/showcase` enters `published` or `unknown_remote_state` without offset-`0` statutory disclosure on that root post, that `#NNN` card is **permanently locked to `AffiliateMapping.state === 'none'`** (`BS-60`).

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
