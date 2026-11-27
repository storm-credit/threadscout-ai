import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApplicationCommandError, assertPublicReadModelSafe } from './application-state.mjs';
import { SuppressionApplicationStore } from './candidate-suppression-store.mjs';
import { ManualProductOrchestratorService } from './manual-orchestrator.mjs';
import { SURFACE_MODES, createOperatorAuthController } from './operator-auth.mjs';
import { SqliteApplicationStore, isNodeSqliteAvailable } from '../../packages/database/src/sqlite-store.mjs';
import {
  buildLiveActivationPreflightReport,
  toPublicWebPreflightSummary
} from '../../packages/orchestra/src/live-activation-preflight.mjs';
import {
  exportDeterministicMarkdownCard,
  projectPublicShowcaseCard
} from '../../packages/core/src/public-showcase-projector.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(currentDir, '../..');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};
const MAX_JSON_BODY = 64 * 1024;

const PUBLIC_SHOWCASE_STATIC_ALLOWLIST = new Set([
  '/apps/web/showcase.html',
  '/apps/web/showcase.js'
]);

const OPERATOR_STATIC_ALLOWLIST = new Set([
  ...PUBLIC_SHOWCASE_STATIC_ALLOWLIST,
  '/apps/web/index.html',
  '/apps/web/styles.css',
  '/apps/web/app.js'
]);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' https://cdn.jsdelivr.net data:",
  "img-src 'self' https: data:",
  "script-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

function securityHeaders(extra = {}) {
  return {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY',
    'content-security-policy': CONTENT_SECURITY_POLICY,
    ...extra
  };
}

function json(res, statusCode, value, extraHeaders = {}, method = 'GET') {
  const body = `${JSON.stringify(value)}\n`;
  res.writeHead(statusCode, securityHeaders({
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    ...extraHeaders
  }));
  res.end(method === 'HEAD' ? undefined : body);
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BODY) {
      throw new ApplicationCommandError('Request body is too large.', { code: 'payload_too_large', statusCode: 413 });
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApplicationCommandError('Request body must be valid JSON.', { code: 'invalid_json', statusCode: 400 });
  }
}

function resolveStaticRequestPath(repoRoot, urlPath, surfaceMode) {
  let mapped = urlPath;
  if (urlPath === '/') mapped = '/apps/web/index.html';
  else if (urlPath === '/showcase' || urlPath.startsWith('/showcase/')) mapped = '/apps/web/showcase.html';
  let normalized;
  try {
    normalized = decodeURIComponent(mapped);
  } catch {
    return null;
  }
  if (!normalized.startsWith('/apps/web/')) return null;

  const allowedSet = surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE
    ? PUBLIC_SHOWCASE_STATIC_ALLOWLIST
    : OPERATOR_STATIC_ALLOWLIST;
  if (!allowedSet.has(normalized)) return null;

  const webRoot = path.resolve(repoRoot, 'apps/web');
  const fullPath = path.resolve(repoRoot, `.${normalized}`);
  if (fullPath !== webRoot && !fullPath.startsWith(`${webRoot}${path.sep}`)) return null;
  return fullPath;
}

async function serveStatic(repoRoot, requestUrl, res, surfaceMode, method = 'GET') {
  let filePath = resolveStaticRequestPath(repoRoot, requestUrl.pathname, surfaceMode);
  if (!filePath) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');
  const body = await readFile(filePath);
  res.writeHead(200, securityHeaders({
    'content-type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
    'content-length': body.length
  }));
  res.end(method === 'HEAD' ? undefined : body);
}

function queryShowcaseFallback(candidates = [], { query = '', cardNumber = null, now } = {}) {
  const projectedCards = candidates
    .filter((c) => c.cardNumber != null)
    .map((c) => projectPublicShowcaseCard(c, { now }))
    .filter((p) => p.projected)
    .map((p) => p.card)
    .sort((a, b) => Number(b.cardNumber.slice(1)) - Number(a.cardNumber.slice(1)));

  if (cardNumber != null) {
    const numeric = Number(String(cardNumber).replace(/^#/, ''));
    if (!Number.isInteger(numeric) || numeric <= 0) return { card: null, status: 'invalid_card_number' };
    const hit = projectedCards.find((card) => Number(card.cardNumber.slice(1)) === numeric) ?? null;
    return hit ? { card: hit, status: 'ok' } : { card: null, status: 'withdrawn_or_not_found' };
  }

  const trimmed = String(query ?? '').trim();
  if (!trimmed) return { query: '', cards: projectedCards.slice(0, 50) };

  const numMatch = trimmed.match(/^#?0*(\d{1,5})$/);
  if (numMatch) {
    const numeric = Number(numMatch[1]);
    return { query: trimmed, cards: projectedCards.filter((card) => Number(card.cardNumber.slice(1)) === numeric) };
  }

  const needle = trimmed.toLowerCase().normalize('NFD');
  const filtered = projectedCards.filter((card) =>
    [card.cardNumber, card.canonicalProductName, ...(card.verifiedPros ?? []), card.verifiedLimitation]
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .includes(needle)
  );
  return { query: trimmed, cards: filtered.slice(0, 30) };
}

async function readCandidatesReadOnlyJson(jsonPath) {
  try {
    const raw = await readFile(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function isGlobalKillSwitchActive(env = process.env) {
  const raw = String(env?.THREADSCOUT_GLOBAL_KILL_SWITCH ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

function parseBoolEnv(raw) {
  const norm = String(raw ?? '').trim().toLowerCase();
  return norm === '1' || norm === 'true' || norm === 'on';
}

export function parseCliArgs(argv = []) {
  const parsed = {};
  for (const arg of argv) {
    if (arg.startsWith('--surface=')) parsed.surfaceMode = arg.slice('--surface='.length).trim();
    else if (arg.startsWith('--host=')) parsed.bindHost = arg.slice('--host='.length).trim();
    else if (arg.startsWith('--port=')) parsed.port = Number(arg.slice('--port='.length).trim());
  }
  return parsed;
}

export function createThreadScoutServer({
  repoRoot = defaultRepoRoot,
  dataDir = process.env.THREADSCOUT_DATA_DIR || path.resolve(repoRoot, '.threadscout-data'),
  stateFile = 'application-state.json',
  dbFile = 'threadscout.sqlite',
  storageMode = process.env.THREADSCOUT_STORAGE_MODE || 'sqlite',
  surfaceMode = process.env.THREADSCOUT_SURFACE_MODE || '',
  bindHost = process.env.THREADSCOUT_BIND_HOST || '127.0.0.1',
  operatorToken = process.env.THREADSCOUT_OPERATOR_TOKEN || '',
  sessionSecret = process.env.THREADSCOUT_SESSION_SECRET || '',
  sessionTtlSeconds = process.env.THREADSCOUT_SESSION_TTL_SECONDS || undefined,
  trustProxy = parseBoolEnv(process.env.THREADSCOUT_TRUST_PROXY),
  nodeEnv = process.env.NODE_ENV || 'development',
  clock,
  storeOptions = {}
} = {}) {
  const auth = createOperatorAuthController({
    surfaceMode,
    bindHost,
    operatorToken,
    sessionSecret,
    sessionTtlSeconds,
    trustProxy,
    nodeEnv,
    clock
  });
  const isPublicShowcaseOnly = auth.config.surfaceMode === SURFACE_MODES.PUBLIC_SHOWCASE;
  const isStoreReadOnlyOrDisabled =
    !auth.config.validSurfaceMode
    || isPublicShowcaseOnly
    || auth.config.authPosture === 'misconfigured_fail_closed';

  const usesLegacyFileLockOptions = 'lockTimeoutMs' in storeOptions || 'lockStaleMs' in storeOptions || 'lockRetryMs' in storeOptions;
  const useJsonStore = storageMode === 'json' || usesLegacyFileLockOptions || !isNodeSqliteAvailable();
  const legacyJsonPath = path.resolve(dataDir, stateFile);
  const store = !auth.config.validSurfaceMode
    ? null
    : useJsonStore
      ? (isStoreReadOnlyOrDisabled
          ? null
          : new SuppressionApplicationStore({
              filePath: legacyJsonPath,
              clock,
              ...storeOptions
            }))
      : new SqliteApplicationStore({
          dbPath: path.resolve(dataDir, dbFile),
          legacyJsonPath: isStoreReadOnlyOrDisabled ? null : legacyJsonPath,
          readOnlyMode: isStoreReadOnlyOrDisabled,
          clock
        });
  const orchestrator = (!isStoreReadOnlyOrDisabled && store)
    ? new ManualProductOrchestratorService({ store })
    : null;

  let initialized = null;
  const ensureInitialized = () => {
    if (!store) return Promise.resolve();
    initialized ??= store.initialize();
    return initialized;
  };

  const server = http.createServer(async (req, res) => {
    const method = req.method ?? 'GET';
    const isRead = method === 'GET' || method === 'HEAD';
    try {
      const rawUrl = req.url ?? '/';
      if (!rawUrl.startsWith('/')) {
        return json(res, 400, { error: 'bad_request', message: 'Origin-form request path required.' }, {}, method);
      }
      let requestUrl;
      try {
        requestUrl = new URL(rawUrl, 'http://localhost');
      } catch {
        return json(res, 400, { error: 'bad_request', message: 'Invalid request URL.' }, {}, method);
      }

      if (!auth.config.validSurfaceMode) {
        return json(res, 503, {
          ok: false,
          error: 'invalid_surface_mode',
          message: auth.config.misconfiguredReason
        }, {}, method);
      }

      const originGuard = auth.validateOriginAndRebinding(req, { pathname: requestUrl.pathname, method });
      if (!originGuard.ok) {
        if (requestUrl.pathname.startsWith('/api/')) {
          return json(res, originGuard.statusCode, { error: originGuard.code, message: originGuard.message }, {}, method);
        }
        res.writeHead(originGuard.statusCode, securityHeaders({ 'content-type': 'text/plain; charset=utf-8' }));
        return res.end(method === 'HEAD' ? undefined : 'Forbidden');
      }

      await ensureInitialized();

      if (isRead && requestUrl.pathname === '/api/health') {
        if (auth.config.authPosture === 'misconfigured_fail_closed') {
          return json(res, 503, {
            ok: false,
            error: 'operator_auth_not_configured',
            surfaceMode: auth.config.surfaceMode,
            authPosture: auth.config.authPosture
          }, {}, method);
        }
        if (isPublicShowcaseOnly) {
          return json(res, 200, {
            ok: true,
            surfaceMode: SURFACE_MODES.PUBLIC_SHOWCASE,
            operatorStudioAvailable: false,
            publicShowcase: 'closed_9_field_default_deny_projection',
            persistence: useJsonStore ? 'readonly_json_projection' : 'readonly_sqlite_wal_fts5',
            killSwitchActive: isGlobalKillSwitchActive(),
            externalPublishingEnabled: false
          }, {}, method);
        }
        return json(res, 200, {
          ok: true,
          surfaceMode: auth.config.surfaceMode,
          authPosture: auth.config.authPosture,
          authRequired: auth.config.authRequired,
          operatorStudioAvailable: true,
          fixedAgentCount: 6,
          orchestratorOnlyDispatch: true,
          persistence: useJsonStore ? 'server_atomic_json_local_interprocess_locked' : 'server_sqlite_wal_acid_fts5',
          persistenceScope: useJsonStore ? 'single_host_local_filesystem' : 'single_host_sqlite_wal',
          duplicateGuardrail: 'deterministic_exact_plus_human_reviewed_possible_duplicate',
          ownerSuppression: 'deterministic_faceted_rules_unordered_any_match',
          publicShowcase: 'closed_9_field_default_deny_projection',
          killSwitchActive: isGlobalKillSwitchActive(),
          externalPublishingEnabled: false
        }, {}, method);
      }

      if (isPublicShowcaseOnly && !isRead) {
        return json(res, 405, {
          error: 'method_not_allowed',
          message: 'public_showcase mode accepts GET and HEAD only.'
        }, { allow: 'GET, HEAD' }, method);
      }

      if (isPublicShowcaseOnly && requestUrl.pathname === '/') {
        res.writeHead(302, securityHeaders({ location: '/showcase' }));
        return res.end();
      }

      if (isRead && requestUrl.pathname === '/api/showcase') {
        const showOperatorLink = auth.isOperatorViewer(req);
        if (isGlobalKillSwitchActive()) {
          return json(res, 200, {
            ok: true,
            query: '',
            cards: [],
            killSwitchActive: true,
            operatorStudioAvailable: showOperatorLink
          }, {}, method);
        }
        const query = requestUrl.searchParams.get('q') ?? '';
        const now = (clock?.() ?? new Date()).toISOString();
        const payload = typeof store?.readShowcase === 'function'
          ? await store.readShowcase({ query })
          : queryShowcaseFallback(
              store ? (await store.readState()).candidates : await readCandidatesReadOnlyJson(legacyJsonPath),
              { query, now }
            );
        const safe = assertPublicReadModelSafe(payload);
        if (!safe.ok) throw new Error(`Unsafe showcase payload: ${safe.leaks.join(', ')}`);
        return json(res, 200, {
          ok: true,
          ...payload,
          killSwitchActive: false,
          operatorStudioAvailable: showOperatorLink
        }, {}, method);
      }

      if (isRead && requestUrl.pathname.startsWith('/api/showcase/')) {
        const showOperatorLink = auth.isOperatorViewer(req);
        if (isGlobalKillSwitchActive()) {
          return json(res, 503, {
            ok: false,
            status: 'kill_switch_active',
            card: null,
            operatorStudioAvailable: showOperatorLink
          }, {}, method);
        }
        const rawNumber = decodeURIComponent(requestUrl.pathname.slice('/api/showcase/'.length));
        const now = (clock?.() ?? new Date()).toISOString();
        const result = typeof store?.readShowcase === 'function'
          ? await store.readShowcase({ cardNumber: rawNumber })
          : queryShowcaseFallback(
              store ? (await store.readState()).candidates : await readCandidatesReadOnlyJson(legacyJsonPath),
              { cardNumber: rawNumber, now }
            );
        if (!result.card) {
          return json(res, 404, {
            ok: false,
            status: result.status,
            card: null,
            operatorStudioAvailable: showOperatorLink
          }, {}, method);
        }
        const markdown = exportDeterministicMarkdownCard(result.card);
        const safe = assertPublicReadModelSafe(result.card);
        if (!safe.ok) throw new Error(`Unsafe showcase card: ${safe.leaks.join(', ')}`);
        return json(res, 200, {
          ok: true,
          status: 'ok',
          card: result.card,
          markdown,
          operatorStudioAvailable: showOperatorLink
        }, {}, method);
      }

      // Operator authentication endpoints (`disabled` in `public_showcase` mode)
      if (isRead && requestUrl.pathname === '/api/auth/session') {
        const status = auth.getSessionStatus(req);
        return json(res, status.statusCode, status.payload, {}, method);
      }

      if (method === 'POST' && requestUrl.pathname === '/api/auth/login') {
        const body = await readJsonBody(req);
        const loginRes = auth.handleLogin(req, body);
        if (!loginRes.ok) {
          return json(res, loginRes.statusCode, { error: loginRes.code, message: loginRes.message });
        }
        const extra = loginRes.setCookie ? { 'set-cookie': loginRes.setCookie } : {};
        return json(res, 200, {
          ok: true,
          authenticated: true,
          authRequired: loginRes.authRequired,
          expiresAt: loginRes.expiresAt ?? null
        }, extra);
      }

      if (method === 'POST' && requestUrl.pathname === '/api/auth/logout') {
        const logoutRes = auth.handleLogout(req);
        if (!logoutRes.ok) {
          return json(res, logoutRes.statusCode, { error: logoutRes.code, message: logoutRes.message });
        }
        return json(res, 200, { ok: true, authenticated: false }, { 'set-cookie': logoutRes.setCookie });
      }

      if (isRead && requestUrl.pathname === '/api/preflight') {
        const authCheck = auth.authenticateRequest(req, { requireCsrfForCookieMutation: false });
        if (!authCheck.ok) {
          const extra = authCheck.clearCookie ? { 'set-cookie': authCheck.clearCookie } : {};
          return json(res, authCheck.statusCode, { error: authCheck.code, message: authCheck.message }, extra, method);
        }
        const rawReport = buildLiveActivationPreflightReport({
          environment: process.env,
          clock: clock ? () => clock() : undefined
        });
        const preflight = toPublicWebPreflightSummary(rawReport);
        const safe = assertPublicReadModelSafe(preflight);
        if (!safe.ok) throw new Error(`Unsafe preflight payload: ${safe.leaks.join(', ')}`);
        return json(res, 200, { ok: true, preflight }, {}, method);
      }

      if (isRead && requestUrl.pathname === '/api/today') {
        const authCheck = auth.authenticateRequest(req, { requireCsrfForCookieMutation: false });
        if (!authCheck.ok) {
          const extra = authCheck.clearCookie ? { 'set-cookie': authCheck.clearCookie } : {};
          return json(res, authCheck.statusCode, { error: authCheck.code, message: authCheck.message }, extra, method);
        }
        const today = await store.readToday();
        const safe = assertPublicReadModelSafe(today);
        if (!safe.ok) throw new Error(`Unsafe read model: ${safe.leaks.join(', ')}`);
        return json(res, 200, {
          ...today,
          authRequired: auth.config.authRequired,
          surfaceMode: auth.config.surfaceMode
        }, {}, method);
      }

      if (method === 'POST' && requestUrl.pathname === '/api/commands') {
        const authCheck = auth.authenticateRequest(req, { requireCsrfForCookieMutation: true });
        if (!authCheck.ok) {
          const extra = authCheck.clearCookie ? { 'set-cookie': authCheck.clearCookie } : {};
          return json(res, authCheck.statusCode, { error: authCheck.code, message: authCheck.message }, extra);
        }
        if (isGlobalKillSwitchActive()) {
          return json(res, 503, {
            error: 'global_kill_switch_active',
            message: 'External kill switch is active; command mutations are halted.'
          });
        }
        const body = await readJsonBody(req);
        const response = await orchestrator.execute(body);
        const safe = assertPublicReadModelSafe(response.today);
        if (!safe.ok) throw new Error(`Unsafe command response: ${safe.leaks.join(', ')}`);
        return json(res, 200, {
          ...response,
          today: {
            ...response.today,
            authRequired: auth.config.authRequired,
            surfaceMode: auth.config.surfaceMode
          }
        });
      }

      if (requestUrl.pathname.startsWith('/api/')) {
        return json(res, 404, { error: 'not_found', message: 'API route not found.' }, {}, method);
      }

      if (!isRead) {
        res.writeHead(405, securityHeaders({ 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' }));
        return res.end('Method not allowed');
      }

      // Awaited on purpose: returning the promise would let a rejection escape this
      // try/catch and become an unhandled rejection, which takes the process down.
      return await serveStatic(repoRoot, requestUrl, res, auth.config.surfaceMode, method);
    } catch (error) {
      if (error instanceof ApplicationCommandError) {
        const today = (error.code === 'version_conflict' && store && !isStoreReadOnlyOrDisabled)
          ? await store.readToday()
          : undefined;
        return json(res, error.statusCode ?? 400, {
          error: error.code,
          message: error.message,
          details: error.details,
          orchestrationReceipt: error.orchestrationReceipt ?? null,
          ...(today ? { today } : {})
        }, {}, method);
      }
      const statusCode = error.statusCode ?? (error.code === 'ENOENT' ? 404 : 500);
      if (req.url?.startsWith('/api/')) {
        return json(res, statusCode, { error: statusCode === 404 ? 'not_found' : 'server_error', message: statusCode === 404 ? 'Not found' : 'Server error' }, {}, method);
      }
      res.writeHead(statusCode, securityHeaders({ 'content-type': 'text/plain; charset=utf-8' }));
      res.end(method === 'HEAD' ? undefined : (statusCode === 404 ? 'Not found' : statusCode === 403 ? 'Forbidden' : 'Server error'));
    }
  });

  server.on('close', () => {
    store?.close?.();
  });
  return server;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const cli = parseCliArgs(process.argv.slice(2));
  const port = Number(cli.port || process.env.PORT || 4173);
  const bindHost = cli.bindHost || process.env.THREADSCOUT_BIND_HOST || '127.0.0.1';
  const surfaceMode = cli.surfaceMode || process.env.THREADSCOUT_SURFACE_MODE || '';
  const server = createThreadScoutServer({ bindHost, surfaceMode });
  server.listen(port, bindHost, () => {
    console.log(`ThreadScout AI running at http://${bindHost}:${port} (surface=${surfaceMode || 'auto'})`);
    console.log('Server-authoritative state + operator auth/surface boundary + Orchestrator-only command dispatch enabled; external publishing disabled.');
  });
}
