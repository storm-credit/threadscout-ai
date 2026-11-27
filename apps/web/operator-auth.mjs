// Operator Studio Authentication Boundary, Closure-Private Constant-Time Session/Bearer Verifier,
// Proxy-Aware CSRF / DNS-Rebinding Guard, and Three-Posture Surface Resolver
// (`SECURITY_ARCHITECTURE.md` §§1–3, `PLATFORM_DECISION.md`, `CLAUDE.md` §§11, 21).

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SURFACE_MODES = Object.freeze({
  LOCAL_DEV: 'local_dev',
  COMBINED: 'combined',
  PUBLIC_SHOWCASE: 'public_showcase'
});

export const VALID_SURFACE_MODES = new Set(Object.values(SURFACE_MODES));
export const MIN_OPERATOR_TOKEN_LENGTH = 16;
export const SESSION_COOKIE_NAME = 'ts_operator_session';
export const DEFAULT_SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_FAILED_LOGINS_PER_WINDOW = 5;
export const MAX_TRACKED_CLIENT_IPS = 2048;
export const MAX_REVOKED_SESSION_NONCES = 4096;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1']);

/**
 * Extract normalized RFC-3986 hostname from a bind host or HTTP `Host` header (`127.0.0.1:4173`, `[::1]:4173`).
 * Rejects malformed suffixes such as `[::1].evil.example` or non-numeric ports by returning `''`.
 */
export function normalizeHostname(rawHost = '') {
  const trimmed = String(rawHost ?? '').trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) {
    const closeIdx = trimmed.indexOf(']');
    if (closeIdx <= 1) return '';
    const suffix = trimmed.slice(closeIdx + 1);
    if (suffix !== '') {
      if (!/^:\d{1,5}$/.test(suffix)) return '';
      const portNum = Number(suffix.slice(1));
      if (portNum < 1 || portNum > 65535) return '';
    }
    return trimmed.slice(1, closeIdx);
  }
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx < 0) return trimmed;
  const secondColon = trimmed.indexOf(':', colonIdx + 1);
  if (secondColon >= 0) {
    // Unbracketed IPv6 literal (e.g. `::1` or `::ffff:127.0.0.1` bind host)
    return trimmed;
  }
  const portPart = trimmed.slice(colonIdx + 1);
  if (!/^\d{1,5}$/.test(portPart)) return '';
  const portNum = Number(portPart);
  if (portNum < 1 || portNum > 65535) return '';
  return trimmed.slice(0, colonIdx);
}

export function isLoopbackAddress(rawHost = '') {
  const normalized = normalizeHostname(rawHost);
  return Boolean(normalized) && LOOPBACK_HOSTS.has(normalized);
}

export function verifySecretConstantTime(candidateSecret, expectedSecret, comparisonKey) {
  const key = comparisonKey || 'threadscout-constant-time-compare-v1';
  const left = createHmac('sha256', key).update(String(candidateSecret ?? ''), 'utf8').digest();
  const right = createHmac('sha256', key).update(String(expectedSecret ?? ''), 'utf8').digest();
  return timingSafeEqual(left, right);
}

export function parseCookieHeader(cookieHeader = '') {
  const cookies = {};
  for (const part of String(cookieHeader ?? '').split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    const rawVal = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

/**
 * Pure surface & auth posture resolver (never exposes raw secrets as enumerable properties).
 */
export function resolveSurfaceAuthConfig({
  surfaceMode = '',
  bindHost = '127.0.0.1',
  operatorToken = '',
  sessionSecret = '',
  sessionTtlSeconds = DEFAULT_SESSION_TTL_SECONDS,
  trustProxy = false,
  nodeEnv = 'development'
} = {}) {
  const rawMode = String(surfaceMode ?? '').trim();
  const trimmedToken = String(operatorToken ?? '').trim();
  const tokenCodePoints = [...trimmedToken].length;
  const trimmedSessionSecret = String(sessionSecret ?? '').trim();
  const sessionSecretCodePoints = [...trimmedSessionSecret].length;
  const loopbackBind = isLoopbackAddress(bindHost);
  const isProd = String(nodeEnv ?? '').trim().toLowerCase() === 'production';

  if (rawMode && !VALID_SURFACE_MODES.has(rawMode)) {
    return Object.freeze({
      validSurfaceMode: false,
      surfaceMode: 'invalid',
      authPosture: 'invalid_surface_mode',
      operatorStudioAvailable: false,
      authRequired: true,
      misconfiguredReason: 'Unsupported THREADSCOUT_SURFACE_MODE value. Allowed: local_dev, combined, public_showcase.'
    });
  }

  const effectiveMode = rawMode
    || ((trimmedToken.length > 0 || !loopbackBind || isProd)
      ? SURFACE_MODES.COMBINED
      : SURFACE_MODES.LOCAL_DEV);

  if (effectiveMode === SURFACE_MODES.PUBLIC_SHOWCASE) {
    return Object.freeze({
      validSurfaceMode: true,
      surfaceMode: SURFACE_MODES.PUBLIC_SHOWCASE,
      authPosture: 'public_showcase_readonly',
      operatorStudioAvailable: false,
      authRequired: false,
      misconfiguredReason: null,
      trustProxy: Boolean(trustProxy)
    });
  }

  if (effectiveMode === SURFACE_MODES.LOCAL_DEV) {
    if (!loopbackBind || isProd || trimmedToken.length > 0) {
      return Object.freeze({
        validSurfaceMode: true,
        surfaceMode: SURFACE_MODES.LOCAL_DEV,
        authPosture: 'misconfigured_fail_closed',
        operatorStudioAvailable: true,
        authRequired: true,
        misconfiguredReason: 'local_dev unauthenticated mode is permitted only on loopback bind in non-production without THREADSCOUT_OPERATOR_TOKEN.',
        trustProxy: Boolean(trustProxy)
      });
    }
    return Object.freeze({
      validSurfaceMode: true,
      surfaceMode: SURFACE_MODES.LOCAL_DEV,
      authPosture: 'local_loopback_open',
      operatorStudioAvailable: true,
      authRequired: false,
      misconfiguredReason: null,
      trustProxy: Boolean(trustProxy)
    });
  }

  // `combined` mode: requires `>= 16`-code-point `THREADSCOUT_OPERATOR_TOKEN`, and if `THREADSCOUT_SESSION_SECRET` is non-empty, `>= 16` code points too!
  if (tokenCodePoints < MIN_OPERATOR_TOKEN_LENGTH) {
    return Object.freeze({
      validSurfaceMode: true,
      surfaceMode: SURFACE_MODES.COMBINED,
      authPosture: 'misconfigured_fail_closed',
      operatorStudioAvailable: true,
      authRequired: true,
      misconfiguredReason: `THREADSCOUT_OPERATOR_TOKEN must be at least ${MIN_OPERATOR_TOKEN_LENGTH} characters when running in combined/networked mode.`,
      trustProxy: Boolean(trustProxy)
    });
  }

  if (sessionSecretCodePoints > 0 && sessionSecretCodePoints < MIN_OPERATOR_TOKEN_LENGTH) {
    return Object.freeze({
      validSurfaceMode: true,
      surfaceMode: SURFACE_MODES.COMBINED,
      authPosture: 'misconfigured_fail_closed',
      operatorStudioAvailable: true,
      authRequired: true,
      misconfiguredReason: `THREADSCOUT_SESSION_SECRET must be empty (ephemeral CSPRNG) or at least ${MIN_OPERATOR_TOKEN_LENGTH} characters.`,
      trustProxy: Boolean(trustProxy)
    });
  }

  const boundedTtl = Math.min(604_800, Math.max(60, Number(sessionTtlSeconds) || DEFAULT_SESSION_TTL_SECONDS));

  return Object.freeze({
    validSurfaceMode: true,
    surfaceMode: SURFACE_MODES.COMBINED,
    authPosture: 'token_and_session_enforced',
    operatorStudioAvailable: true,
    authRequired: true,
    misconfiguredReason: null,
    sessionTtlSeconds: boundedTtl,
    trustProxy: Boolean(trustProxy),
    isProd
  });
}

/**
 * Create stateful operator auth & CSRF controller for an HTTP server instance.
 * Secrets (`trimmedToken`, `signingKey`) remain strictly inside closure scope; when `THREADSCOUT_SESSION_SECRET`
 * is omitted, `signingKey` uses an ephemeral 256-bit CSPRNG key (`randomBytes(32)`).
 */
export function createOperatorAuthController(rawOptions = {}) {
  const clock = rawOptions.clock ?? (() => new Date());
  const comparisonKey = randomBytes(32);
  const config = resolveSurfaceAuthConfig(rawOptions);

  const trimmedToken = String(rawOptions.operatorToken ?? '').trim();
  const trimmedSessionSecret = String(rawOptions.sessionSecret ?? '').trim();
  const signingKey = config.authPosture === 'token_and_session_enforced'
    ? ([...trimmedSessionSecret].length >= MIN_OPERATOR_TOKEN_LENGTH
        ? createHmac('sha256', 'threadscout-explicit-session-v1').update(trimmedSessionSecret, 'utf8').digest()
        : randomBytes(32))
    : null;

  const failedLoginsByIp = new Map();
  const revokedSessionNonces = new Map(); // nonce -> expiresAtMs

  function nowMs() {
    return clock().getTime();
  }

  function clientIp(req) {
    if (config.trustProxy) {
      const xff = String(req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
      if (xff) return xff;
    }
    return String(req.socket?.remoteAddress || 'unknown');
  }

  function effectiveHostHeader(req) {
    if (config.trustProxy) {
      const xfh = String(req.headers?.['x-forwarded-host'] ?? '').split(',')[0].trim();
      if (xfh) return xfh;
    }
    return String(req.headers?.host ?? '').trim();
  }

  function isSecureRequest(req) {
    if (req.socket?.encrypted) return true;
    if (config.trustProxy) {
      const proto = String(req.headers?.['x-forwarded-proto'] ?? '').split(',')[0].trim().toLowerCase();
      if (proto === 'https') return true;
    }
    return false;
  }

  function sweepExpiredFailures(atMs) {
    for (const [ip, timestamps] of failedLoginsByIp.entries()) {
      const active = timestamps.filter((ts) => atMs - ts < LOGIN_WINDOW_MS);
      if (active.length === 0) failedLoginsByIp.delete(ip);
      else failedLoginsByIp.set(ip, active);
    }
  }

  function pruneAndGetFailures(ip, atMs) {
    const existing = failedLoginsByIp.get(ip);
    if (!existing) return [];
    const recent = existing.filter((ts) => atMs - ts < LOGIN_WINDOW_MS);
    if (recent.length === 0) {
      failedLoginsByIp.delete(ip);
      return [];
    }
    failedLoginsByIp.set(ip, recent);
    return recent;
  }

  function recordFailedLogin(ip, atMs) {
    const recent = pruneAndGetFailures(ip, atMs);
    recent.push(atMs);
    if (!failedLoginsByIp.has(ip) && failedLoginsByIp.size >= MAX_TRACKED_CLIENT_IPS) {
      sweepExpiredFailures(atMs);
      if (failedLoginsByIp.size >= MAX_TRACKED_CLIENT_IPS) {
        const oldestKey = failedLoginsByIp.keys().next().value;
        if (oldestKey !== undefined) failedLoginsByIp.delete(oldestKey);
      }
    }
    failedLoginsByIp.set(ip, recent);
  }

  function revokeSessionNonce(nonce, expiresAtMs, atMs) {
    for (const [n, exp] of revokedSessionNonces.entries()) {
      if (atMs > exp) revokedSessionNonces.delete(n);
    }
    if (revokedSessionNonces.size >= MAX_REVOKED_SESSION_NONCES) {
      const oldest = revokedSessionNonces.keys().next().value;
      if (oldest !== undefined) revokedSessionNonces.delete(oldest);
    }
    revokedSessionNonces.set(nonce, expiresAtMs);
  }

  function issueSessionToken(atMs = nowMs()) {
    const expiresAtMs = atMs + config.sessionTtlSeconds * 1000;
    const nonce = randomBytes(16).toString('hex');
    const payload = `${atMs}.${expiresAtMs}.${nonce}`;
    const sig = createHmac('sha256', signingKey).update(payload, 'utf8').digest('hex');
    return { token: `${payload}.${sig}`, expiresAtMs };
  }

  function verifySessionToken(rawToken, atMs = nowMs()) {
    if (!signingKey) return { valid: false };
    const parts = String(rawToken ?? '').split('.');
    if (parts.length !== 4) return { valid: false, tampered: true };
    const [issuedStr, expiresStr, nonce, providedSig] = parts;
    const issuedMs = Number(issuedStr);
    const expiresMs = Number(expiresStr);
    if (!Number.isInteger(issuedMs) || !Number.isInteger(expiresMs) || !/^[0-9a-f]{32}$/.test(nonce) || !/^[0-9a-f]{64}$/.test(providedSig)) {
      return { valid: false, tampered: true };
    }
    if (atMs > expiresMs || issuedMs > expiresMs) {
      return { valid: false, expired: true };
    }
    if (revokedSessionNonces.has(nonce)) {
      return { valid: false, revoked: true };
    }
    const payload = `${issuedStr}.${expiresStr}.${nonce}`;
    const expectedSig = createHmac('sha256', signingKey).update(payload, 'utf8').digest('hex');
    if (!verifySecretConstantTime(providedSig, expectedSig, comparisonKey)) {
      return { valid: false, tampered: true };
    }
    return { valid: true, nonce, expiresMs, expiresAt: new Date(expiresMs).toISOString() };
  }

  function buildSessionCookie(req, tokenValue, maxAgeSeconds) {
    const attrs = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(tokenValue)}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
    ];
    if (isSecureRequest(req)) attrs.push('Secure');
    return attrs.join('; ');
  }

  function validateOriginAndRebinding(req, context = {}) {
    const rawHostHeader = String(req.headers?.host ?? '').trim();
    if (config.surfaceMode === SURFACE_MODES.LOCAL_DEV && (!rawHostHeader || !isLoopbackAddress(rawHostHeader))) {
      return {
        ok: false,
        statusCode: 403,
        code: 'dns_rebinding_blocked',
        message: 'Missing or non-loopback Host header rejected in local_dev mode.'
      };
    }

    const normalizedMethod = String(context.method ?? req.method ?? 'GET').toUpperCase();
    let normalizedPathname = typeof context.pathname === 'string' ? context.pathname : '';
    if (!normalizedPathname) {
      try {
        normalizedPathname = new URL(String(req.url ?? '/'), 'http://localhost').pathname;
      } catch {
        normalizedPathname = '/';
      }
    }

    const secFetchSite = String(req.headers?.['sec-fetch-site'] ?? '').trim().toLowerCase();
    if (secFetchSite === 'cross-site') {
      const secFetchMode = String(req.headers?.['sec-fetch-mode'] ?? '').trim().toLowerCase();
      const secFetchDest = String(req.headers?.['sec-fetch-dest'] ?? '').trim().toLowerCase();
      const isSafeTopLevelDocumentNavigation =
        (normalizedMethod === 'GET' || normalizedMethod === 'HEAD')
        && !normalizedPathname.startsWith('/api/')
        && secFetchMode === 'navigate'
        && secFetchDest === 'document';
      if (!isSafeTopLevelDocumentNavigation) {
        return {
          ok: false,
          statusCode: 403,
          code: 'csrf_cross_site_blocked',
          message: 'Cross-site browser request blocked.'
        };
      }
    }

    const origin = String(req.headers?.origin ?? '').trim();
    if (origin) {
      const targetHost = effectiveHostHeader(req);
      try {
        const parsedOrigin = new URL(origin);
        if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
          return {
            ok: false,
            statusCode: 403,
            code: 'csrf_origin_mismatch',
            message: 'Unsupported Origin protocol.'
          };
        }
        const expectedHostUrl = new URL(`${parsedOrigin.protocol}//${targetHost}`);
        const cleanAuthority =
          Boolean(targetHost)
          && expectedHostUrl.username === ''
          && expectedHostUrl.password === ''
          && expectedHostUrl.pathname === '/'
          && expectedHostUrl.search === ''
          && expectedHostUrl.hash === '';
        if (!cleanAuthority || parsedOrigin.host.toLowerCase() !== expectedHostUrl.host.toLowerCase()) {
          return {
            ok: false,
            statusCode: 403,
            code: 'csrf_origin_mismatch',
            message: 'Origin header does not match Host.'
          };
        }
      } catch {
        return {
          ok: false,
          statusCode: 403,
          code: 'csrf_origin_mismatch',
          message: 'Invalid Origin header.'
        };
      }
    }

    return { ok: true };
  }

  function authenticateRequest(req, { requireCsrfForCookieMutation = false } = {}) {
    if (!config.validSurfaceMode) {
      return {
        ok: false,
        statusCode: 503,
        code: 'invalid_surface_mode',
        message: config.misconfiguredReason
      };
    }
    if (config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE) {
      return {
        ok: false,
        statusCode: 404,
        code: 'not_found',
        message: 'Operator route disabled in public_showcase mode.'
      };
    }
    if (config.authPosture === 'misconfigured_fail_closed') {
      return {
        ok: false,
        statusCode: 503,
        code: 'operator_auth_not_configured',
        message: config.misconfiguredReason
      };
    }

    const originCheck = validateOriginAndRebinding(req);
    if (!originCheck.ok) return originCheck;

    if (config.surfaceMode === SURFACE_MODES.LOCAL_DEV) {
      return {
        ok: true,
        authenticated: true,
        authRequired: false,
        authMethod: 'local_loopback',
        actor: 'owner'
      };
    }

    const authHeader = String(req.headers?.authorization ?? '').trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      const ip = clientIp(req);
      const atMs = nowMs();
      const recentFailures = pruneAndGetFailures(ip, atMs);
      if (recentFailures.length >= MAX_FAILED_LOGINS_PER_WINDOW) {
        return {
          ok: false,
          statusCode: 429,
          code: 'auth_rate_limited',
          message: 'Too many failed operator authentication attempts. Try again after 15 minutes.'
        };
      }
      const providedBearer = authHeader.slice(7).trim();
      if (providedBearer && verifySecretConstantTime(providedBearer, trimmedToken, comparisonKey)) {
        failedLoginsByIp.delete(ip);
        return {
          ok: true,
          authenticated: true,
          authRequired: true,
          authMethod: 'bearer',
          actor: 'owner'
        };
      }
      recordFailedLogin(ip, atMs);
      return {
        ok: false,
        statusCode: 401,
        code: 'operator_auth_invalid',
        message: 'Invalid operator Bearer token.'
      };
    }

    const cookies = parseCookieHeader(req.headers?.cookie ?? '');
    const rawSession = cookies[SESSION_COOKIE_NAME];
    if (rawSession) {
      const ip = clientIp(req);
      const atMs = nowMs();
      if (pruneAndGetFailures(ip, atMs).length >= MAX_FAILED_LOGINS_PER_WINDOW) {
        return {
          ok: false,
          statusCode: 429,
          code: 'auth_rate_limited',
          message: 'Too many failed operator authentication attempts. Try again after 15 minutes.'
        };
      }
      const verified = verifySessionToken(rawSession, atMs);
      if (verified.valid) {
        if (requireCsrfForCookieMutation && String(req.headers?.['x-threadscout-csrf'] ?? '') !== '1') {
          return {
            ok: false,
            statusCode: 403,
            code: 'csrf_header_missing',
            message: 'Missing X-ThreadScout-Csrf header for cookie-authenticated mutation.'
          };
        }
        return {
          ok: true,
          authenticated: true,
          authRequired: true,
          authMethod: 'cookie',
          expiresAt: verified.expiresAt,
          actor: 'owner'
        };
      }
      if (verified.tampered) {
        recordFailedLogin(ip, atMs);
      }
      return {
        ok: false,
        statusCode: 401,
        code: 'operator_auth_required',
        message: 'Operator authentication is required.',
        clearCookie: buildSessionCookie(req, '', 0)
      };
    }

    return {
      ok: false,
      statusCode: 401,
      code: 'operator_auth_required',
      message: 'Operator authentication is required.'
    };
  }

  /**
   * Cookie-only viewer check used solely to decide whether to show `#studio-return-link` on `/showcase`.
   * Ignores `Authorization: Bearer` (preventing public `/api/showcase` token probing) and enforces IP rate limiting on tampered cookies.
   */
  function isOperatorViewer(req) {
    if (!config.validSurfaceMode || config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE || config.authPosture === 'misconfigured_fail_closed') {
      return false;
    }
    if (config.surfaceMode === SURFACE_MODES.LOCAL_DEV) return true;
    const cookies = parseCookieHeader(req.headers?.cookie ?? '');
    const rawSession = cookies[SESSION_COOKIE_NAME];
    if (!rawSession) return false;
    const ip = clientIp(req);
    const atMs = nowMs();
    if (pruneAndGetFailures(ip, atMs).length >= MAX_FAILED_LOGINS_PER_WINDOW) {
      return false;
    }
    const verified = verifySessionToken(rawSession, atMs);
    if (verified.valid) return true;
    if (verified.tampered) {
      recordFailedLogin(ip, atMs);
    }
    return false;
  }

  function handleLogin(req, body = {}) {
    if (!config.validSurfaceMode) {
      return { ok: false, statusCode: 503, code: 'invalid_surface_mode', message: config.misconfiguredReason };
    }
    if (config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE) {
      return { ok: false, statusCode: 404, code: 'not_found', message: 'Login endpoint unavailable.' };
    }
    if (config.authPosture === 'misconfigured_fail_closed') {
      return { ok: false, statusCode: 503, code: 'operator_auth_not_configured', message: config.misconfiguredReason };
    }
    const originCheck = validateOriginAndRebinding(req);
    if (!originCheck.ok) return originCheck;
    if (String(req.headers?.['x-threadscout-csrf'] ?? '') !== '1') {
      return { ok: false, statusCode: 403, code: 'csrf_header_missing', message: 'Missing X-ThreadScout-Csrf header.' };
    }

    if (config.surfaceMode === SURFACE_MODES.LOCAL_DEV) {
      return { ok: true, authenticated: true, authRequired: false, setCookie: null };
    }

    const ip = clientIp(req);
    const atMs = nowMs();
    const recentFailures = pruneAndGetFailures(ip, atMs);
    if (recentFailures.length >= MAX_FAILED_LOGINS_PER_WINDOW) {
      return {
        ok: false,
        statusCode: 429,
        code: 'auth_rate_limited',
        message: 'Too many failed operator login attempts. Try again after 15 minutes.'
      };
    }

    const submittedToken = String(body?.token ?? '').trim();
    if (!submittedToken || !verifySecretConstantTime(submittedToken, trimmedToken, comparisonKey)) {
      recordFailedLogin(ip, atMs);
      return {
        ok: false,
        statusCode: 401,
        code: 'operator_auth_invalid',
        message: 'Invalid operator token.'
      };
    }

    failedLoginsByIp.delete(ip);
    const issued = issueSessionToken(atMs);
    return {
      ok: true,
      authenticated: true,
      authRequired: true,
      expiresAt: new Date(issued.expiresAtMs).toISOString(),
      setCookie: buildSessionCookie(req, issued.token, config.sessionTtlSeconds)
    };
  }

  function handleLogout(req) {
    if (!config.validSurfaceMode) {
      return { ok: false, statusCode: 503, code: 'invalid_surface_mode', message: config.misconfiguredReason };
    }
    if (config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE) {
      return { ok: false, statusCode: 404, code: 'not_found', message: 'Logout endpoint unavailable.' };
    }
    if (config.authPosture === 'misconfigured_fail_closed') {
      return { ok: false, statusCode: 503, code: 'operator_auth_not_configured', message: config.misconfiguredReason };
    }
    const originCheck = validateOriginAndRebinding(req);
    if (!originCheck.ok) return originCheck;
    if (String(req.headers?.['x-threadscout-csrf'] ?? '') !== '1') {
      return { ok: false, statusCode: 403, code: 'csrf_header_missing', message: 'Missing X-ThreadScout-Csrf header.' };
    }
    const atMs = nowMs();
    const cookies = parseCookieHeader(req.headers?.cookie ?? '');
    const rawSession = cookies[SESSION_COOKIE_NAME];
    if (rawSession) {
      const verified = verifySessionToken(rawSession, atMs);
      if (verified.valid && verified.nonce) {
        revokeSessionNonce(verified.nonce, verified.expiresMs, atMs);
      }
    }
    return {
      ok: true,
      setCookie: buildSessionCookie(req, '', 0)
    };
  }

  function getSessionStatus(req) {
    if (!config.validSurfaceMode) {
      return { statusCode: 503, payload: { ok: false, error: 'invalid_surface_mode', authRequired: true, authenticated: false } };
    }
    if (config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE) {
      return { statusCode: 404, payload: { error: 'not_found', message: 'Route disabled in public_showcase mode.' } };
    }
    if (config.authPosture === 'misconfigured_fail_closed') {
      return {
        statusCode: 503,
        payload: {
          ok: false,
          error: 'operator_auth_not_configured',
          surfaceMode: config.surfaceMode,
          authRequired: true,
          authenticated: false
        }
      };
    }
    const check = authenticateRequest(req, { requireCsrfForCookieMutation: false });
    if (!check.ok && ['dns_rebinding_blocked', 'csrf_cross_site_blocked', 'csrf_origin_mismatch', 'auth_rate_limited'].includes(check.code)) {
      return { statusCode: check.statusCode, payload: { ok: false, error: check.code, authenticated: false, authRequired: config.authRequired } };
    }
    return {
      statusCode: 200,
      payload: {
        ok: true,
        surfaceMode: config.surfaceMode,
        authPosture: config.authPosture,
        authRequired: config.authRequired,
        authenticated: Boolean(check.ok && check.authenticated),
        expiresAt: check.expiresAt ?? null
      }
    };
  }

  return Object.freeze({
    config,
    validateOriginAndRebinding,
    authenticateRequest,
    isOperatorViewer,
    handleLogin,
    handleLogout,
    getSessionStatus
  });
}
