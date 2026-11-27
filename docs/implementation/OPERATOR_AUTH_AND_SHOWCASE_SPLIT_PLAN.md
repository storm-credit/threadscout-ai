# Operator Studio Authentication Boundary & Public `/showcase` Surface Split Plan

## 1. Context & Baseline Authority

- **Baseline `main` SHA:** `087672654ccdc766a730d686c119fcde3009c8b1` (post-merge of PRs #26–#29).
- **Design Authorities:**
  - `docs/spec/MASTER_SPEC.md`
  - `docs/spec/SECURITY_ARCHITECTURE.md` §§1–3 (*"'Single user' does not mean 'no authentication boundary' in a network deployment"*)
  - `docs/spec/PLATFORM_DECISION.md` (Public Verified Showcase `/showcase` `#NNN` 9-field allowlist vs authenticated Owner Operations Surface)
  - `docs/spec/CONFIGURATION_AUTHORITY.md` (3-layer configuration precedence; external settings never weaken constitutional safeguards)
  - `docs/spec/DESIGN_FREEZE.md` (Public Verified Showcase hosting, secret boundary, and external global kill switch)
  - `CLAUDE.md` §§2, 4, 5, 11, 16, 18, 20, 21 (`<= 5` local action space, default-deny code boundaries, zero live external API enablement)
- **Mapped Requirements, Blind Spots & Acceptance Criteria:**
  - `PR-20`, `PR-24`, `PR-25`, `NFR-01`, `NFR-03`, `NFR-06`, `NFR-08`
  - `BS-51` (secret redaction), `BS-61` (public showcase isolation)
  - `AT-15`, `AT-17` (fail-closed on missing/invalid operator auth & storage errors), `AT-20` (zero token/env-name leakage in read models, config objects, or child envs), `AT-22` / `AT-34` (non-occluded Top Layer `role="alert"` & `360px` touch-friendly login/logout controls), `AT-43` (authorization check), `AT-46` (read-only 9-field `/showcase` projection)

## 2. Live External API Boundary (Unchanged)

All external network integrations remain **disabled** (`externalPublishingEnabled: false`, `liveSourcesEnabled: false`, `ready: false`):
- Zero external SaaS auth calls, zero LLM API calls, zero Threads/Coupang/Naver network requests.
- Enables immediate `₩0` commercial operation via manual affiliate links + 1-click single-root-post copy + publicly hosted read-only `/showcase`.

## 3. Four Architectural Options Compared (`CLAUDE.md` §4)

| Criterion | Option 1: HTTP Basic Auth Only | Option 2: Three-Posture Surface Split (`local_dev | combined | public_showcase`) + Constant-Time HMAC Session/Bearer Auth + CSRF & Read-Only SQLite (**Selected**) | Option 3: External OAuth SaaS (Auth0 / Clerk) | Option 4: Separate Duplicated Showcase Codebase |
| :--- | :--- | :--- | :--- | :--- |
| **Security & Fail-Closed** | Weak logout UX; browser URL credential leak risk; no CSRF header check. | Constant-time `HMAC-SHA256` `timingSafeEqual` (zero length leak), server-revocable `HttpOnly; SameSite=Strict` cookie + CSRF origin/header guard, unified IP brute-force limiter across `POST /api/auth/login` & `Bearer`, DNS-rebinding check in `local_dev`, physical route/static/DB read-only isolation in `public_showcase`, and HTTP `503` fail-closed on invalid config. | Introduces third-party network & secret dependency. | Schema & 9-field projection drift risk. |
| **Cost & Dependencies** | `₩0`, Node stdlib | **`₩0`, 100% Node 24 stdlib (`node:crypto`, `node:http`, `node:sqlite`)** | Paid tier / external account setup | Double maintenance |
| **Mobile (`360px`) & Local Dev UX** | Native browser popup blocks custom Korean guidance. | Seamless zero-config `local_dev` on `127.0.0.1` + accessible Korean `360px` unlock sheet with inline Top Layer `role="alert"` in `combined` + zero-operator-UI `public_showcase`. | Redirect latency | Separate deploy pipeline |
| **Decision** | Rejected | **Selected** | Rejected | Rejected |

## 4. Reference & Exemplar Review (`CLAUDE.md` §16)

1. **OWASP Session Management, W3C Fetch Metadata Resource Isolation & CSRF Prevention Cheat Sheets:**
   - *Adopted:* `HttpOnly; SameSite=Strict; Path=/` (`; Secure` when TLS socket is encrypted or `trustProxy === true` with `x-forwarded-proto: https`), ephemeral 256-bit CSPRNG session signing key when `THREADSCOUT_SESSION_SECRET` is omitted, server-side bounded nonce revocation on `POST /api/auth/logout`, custom `X-ThreadScout-Csrf: 1` header on cookie-authenticated `POST` requests, proxy-aware `Origin` vs `Host` (`x-forwarded-host` first hop only when `trustProxy === true`), W3C Fetch Metadata `Sec-Fetch-Site: cross-site` isolation (allowing strictly top-level `GET`/`HEAD` `navigate` `document` loads of non-`/api/` pages such as external Threads link clicks into `/showcase` while blocking all cross-site `/api/*`, mutations, and subresource/frame fetches), and strict DNS-rebinding `Host` allowlist across all routes in `local_dev`.
2. **Node.js `node:crypto` Constant-Time Digest Verification:**
   - *Adopted:* Hash both candidate and expected secrets with `createHmac('sha256', comparisonKey)` into fixed 32-byte buffers before `timingSafeEqual` so neither character prefixes nor secret length leak through timing, keeping raw secrets inside private closures (never exposed as enumerable config properties).
3. **SQLite WAL Read-Only Replica / Dual-Process Pattern (`sqlite.org/wal.html`):**
   - *Adopted:* `SqliteApplicationStore` `readOnlyMode: true` opens `DatabaseSync(dbPath, { readOnly: true })` with `PRAGMA query_only = ON`, returning empty cards **solely** when `dbPath` / `jsonPath` is absent (`error.code === 'ENOENT'`) while propagating all corruption or permission errors (`SQLITE_CORRUPT`, `EACCES`) fail-closed (`500`).

## 5. Module Classification & Normative Definitions (`CLAUDE.md` §20)

| File / Module | Classification | Responsibility |
| :--- | :--- | :--- |
| `apps/web/operator-auth.mjs` | **MISSING -> ADD** | Surface-mode resolver, RFC-3986 loopback/DNS-rebinding guards, closure-private constant-time token & revocable HMAC session verifier, unified `login`+`Bearer` IP brute-force limiter, and proxy-aware CSRF validator. |
| `apps/web/server.mjs` | **MODIFY** | Enforce `public_showcase` vs `combined` vs `local_dev` route & closed static-file allowlists, `GET`+`HEAD` parity across all read routes, `/api/auth/{session,login,logout}` endpoints, CSP/frame security headers, and `--surface` / `--host` CLI flags. |
| `packages/database/src/sqlite-store.mjs` | **MODIFY** | Support `readOnlyMode: true` (`query_only = ON`, strict `ENOENT`-only empty read, hard `403` block on `execute`/`persist`, universal `expires_at` TTL parity). |
| `apps/web/{index.html,styles.css,app.js,showcase.html,showcase.js}` | **MODIFY** | Accessible Korean operator unlock dialog with non-occluded Top Layer `#operator-auth-error` (`role="alert"`), `[hidden] { display: none !important; }`, logout control, CSRF header forwarding, and authenticated-only `#studio-return-link` visibility (`showcase.js`). |
| `apps/web/application-state.mjs` & `packages/orchestra/src/live-activation-preflight.mjs` | **MODIFY** | Add `THREADSCOUT_OPERATOR_TOKEN` and `THREADSCOUT_SESSION_SECRET` to `assertPublicReadModelSafe` and preflight redaction labels. |
| `Dockerfile`, `.dockerignore`, `.env.example`, `docs/DEPLOYMENT_GUIDE.md`, `package.json` | **MISSING -> ADD / MODIFY** | Production non-root Node 24 container, redacted env template, `npm run start:showcase`, and Korean deployment runbook. |
| `tests/operator-auth-and-showcase-split.test.mjs` | **MISSING -> ADD** | Calibrated unit & E2E tests across `local_dev`, `combined`, `public_showcase`, `invalid_surface_mode`, and `misconfigured_fail_closed` modes (`sqlite` + `json`). |

### Normative Definitions (Undefined-Term Prevention)

- **`SURFACE_MODES` & Pre-Store Initialization Guard:** Closed set `{'local_dev', 'combined', 'public_showcase'}`. Any unrecognized non-empty `THREADSCOUT_SURFACE_MODE` resolves to `authPosture = 'invalid_surface_mode'` (returning HTTP `503` on all routes including `/api/health` without echoing the raw string and without instantiating or initializing any writable store). When omitted, defaults to `'combined'` if `Boolean(operatorToken)` or `!isLoopbackAddress(bindHost)` or `nodeEnv === 'production'`, else `'local_dev'`.
- **`isLoopbackAddress(host)`:** Full-string host match after stripping optional `:digits` port (`1..5` digits; for bracketed IPv6 `[addr]`, zero characters permitted after `]` except optional `:digits`) against `{'127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'}`. In `'local_dev'`, every request (HTML, static, `/api/*`) must carry a non-empty `Host` header satisfying `isLoopbackAddress`, else HTTP `403` (`dns_rebinding_blocked`).
- **Secret Strength & Fail-Closed Operator Route Set (`MIN_OPERATOR_TOKEN_LENGTH = 16`):** Trimmed `THREADSCOUT_OPERATOR_TOKEN` in `'combined'` mode — and trimmed `THREADSCOUT_SESSION_SECRET` whenever non-empty — must be `>= 16` Unicode code points (`[...str].length >= 16`). Setting `'local_dev'` when `!isLoopbackAddress(bindHost)` or `nodeEnv === 'production'` or `operatorToken` is non-empty, or violating secret length, yields `authPosture = 'misconfigured_fail_closed'`: zero writable store initialization occurs, `GET/HEAD /api/health` returns HTTP `503` (`{ ok: false, error: 'operator_auth_not_configured' }`), and the closed operator API set `{'/api/today', '/api/preflight', '/api/commands', '/api/auth/session', '/api/auth/login', '/api/auth/logout'}` returns HTTP `503` (`operator_auth_not_configured`).
- **Unified Brute-Force Predicate, W3C Fetch Metadata Isolation & Proxy-Aware `Host`:** Failed operator credential checks are counted per client IP (`req.socket?.remoteAddress || 'unknown'`, or `x-forwarded-for` first hop iff `trustProxy === true`) across `POST /api/auth/login`, any operator request presenting an `Authorization: Bearer` header (public `/api/showcase*` ignores `Bearer`), and any `tampered` `ts_operator_session` cookie (failing 4-part hex/integer format or HMAC verification after passing `atMs <= expiresMs && issuedMs <= expiresMs && !revokedSessionNonces.has(nonce)`; unauthenticated loads and `expired` or `revoked` cookies are never counted). Max `5` failures per `15` minutes (`900_000 ms`, sweeping expired windows before `2048`-entry eviction) -> HTTP `429` (`auth_rate_limited`). `Sec-Fetch-Site: cross-site` blocks with `403` (`csrf_cross_site_blocked`) unless `(method === 'GET' || method === 'HEAD') && !pathname.startsWith('/api/') && secFetchMode === 'navigate' && secFetchDest === 'document'`. Effective `Host` for `Origin` comparison is `x-forwarded-host` first hop when `trustProxy === true` and non-empty, else `req.headers.host`.
- **Read-Method (`GET` / `HEAD`) Parity & `ENOENT`-Only Empty Store:** Every readable endpoint (`/api/health`, `/api/showcase`, `/api/showcase/:cardNumber`, `/api/auth/session`, `/api/preflight`, `/api/today`, `/`, `/showcase*`, and allowed static assets) serves both `GET` and `HEAD` with identical status and headers (`HEAD` body omitted). Read-only showcase readers return empty results **iff** `dbPath` / `jsonPath` fails with `error.code === 'ENOENT'`; all other storage/parse errors propagate fail-closed (`500`).

## 6. Success, Rollback & Completion Proof Conditions (`CLAUDE.md` §§18, 20)

- **Success Criteria:**
  1. `npm run verify` (including `check:docs`, `check:governance`, all `170+` tests) and `npm run orchestra:demo` exit `0` on Node 20 and Node 24.
  2. Real browser hit-testing at `360x740` & `1440x900` verifies wrong-token inline `role="alert"` visibility inside `#operator-auth-dialog`, valid unlock + logout cycle, `public_showcase` isolation, and desktop Split Studio with zero console/page/CSP errors.
  3. Independent `maos-critic` review returns `0` blocking findings, and GitHub Actions passes on PR #30 and `main`.
