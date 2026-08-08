# Live Research Source Stack — Four Options

| Option | Stack | Benefits | Largest risk | Decision |
|---|---|---|---|---|
| A. Threads official API only | Threads keyword search for discovery and purchase-intent language | closest to target platform and content format | permission/app review, incomplete market verification, platform concentration | insufficient alone |
| B. Threads + NAVER API HUB + manual evidence | Threads for social discussion, NAVER for Korean search/click trend corroboration, manual product evidence as fallback | complementary signals and official interfaces | two credentials, separate semantics, no exact retail catalogue | **selected readiness plan** |
| C. Google Trends-led research | broad regional interest comparison | consistent trend analysis if alpha access exists | alpha is limited-access and not suitable as a required dependency | deferred |
| D. Scraping or commercial aggregator | broad coverage with fewer official integration steps | speed and normalized data | terms, provenance, privacy, cost, vendor lock-in, source instability | rejected for current phase |

## Selected plan

Prepare option B without enabling network execution.

- Primary discovery: Meta Threads keyword search.
- Secondary corroboration: NAVER API HUB Search Trend and Shopping Insight.
- Fallback: user-supplied product and source references, still subject to Verifier and Guardian checks.
- Deferred: Google Trends API alpha until access is granted.
- Rejected for product discovery: Coupang Seller Open API because its documented purpose is seller/integrator catalogue and operations management rather than arbitrary affiliate-product discovery.

## Activation rule

Readiness code, disabled request builders, and tests may be committed. No live source is enabled until credentials are supplied outside Git, source-specific requirements are completed, explicit human activation approval is recorded, and a separate pull request changes the source registry flag.
