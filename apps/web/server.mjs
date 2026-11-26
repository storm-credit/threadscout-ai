import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApplicationCommandError, assertPublicReadModelSafe } from './application-state.mjs';
import { SuppressionApplicationStore } from './candidate-suppression-store.mjs';
import { ManualProductOrchestratorService } from './manual-orchestrator.mjs';
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

function json(res, statusCode, value) {
  const body = `${JSON.stringify(value)}\n`;
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  });
  res.end(body);
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

function resolveStaticRequestPath(repoRoot, urlPath) {
  let mapped = urlPath;
  if (urlPath === '/') mapped = '/apps/web/index.html';
  else if (urlPath === '/showcase' || urlPath.startsWith('/showcase/')) mapped = '/apps/web/showcase.html';
  const normalized = decodeURIComponent(mapped);
  if (!normalized.startsWith('/apps/web/')) return null;
  const webRoot = path.resolve(repoRoot, 'apps/web');
  const fullPath = path.resolve(repoRoot, `.${normalized}`);
  if (fullPath !== webRoot && !fullPath.startsWith(`${webRoot}${path.sep}`)) return null;
  return fullPath;
}

async function serveStatic(repoRoot, requestUrl, res) {
  let filePath = resolveStaticRequestPath(repoRoot, requestUrl.pathname);
  if (!filePath) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');
  const body = await readFile(filePath);
  res.writeHead(200, {
    'content-type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  });
  res.end(body);
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

function isGlobalKillSwitchActive() {
  const raw = String(process.env.THREADSCOUT_GLOBAL_KILL_SWITCH ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

export function createThreadScoutServer({
  repoRoot = defaultRepoRoot,
  dataDir = process.env.THREADSCOUT_DATA_DIR || path.resolve(repoRoot, '.threadscout-data'),
  stateFile = 'application-state.json',
  dbFile = 'threadscout.sqlite',
  storageMode = process.env.THREADSCOUT_STORAGE_MODE || 'sqlite',
  clock,
  storeOptions = {}
} = {}) {
  const usesLegacyFileLockOptions = 'lockTimeoutMs' in storeOptions || 'lockStaleMs' in storeOptions || 'lockRetryMs' in storeOptions;
  const useJsonStore = storageMode === 'json' || usesLegacyFileLockOptions || !isNodeSqliteAvailable();
  const legacyJsonPath = path.resolve(dataDir, stateFile);
  const store = useJsonStore
    ? new SuppressionApplicationStore({
        filePath: legacyJsonPath,
        clock,
        ...storeOptions
      })
    : new SqliteApplicationStore({
        dbPath: path.resolve(dataDir, dbFile),
        legacyJsonPath,
        clock
      });
  const orchestrator = new ManualProductOrchestratorService({ store });
  let initialized = null;
  const ensureInitialized = () => {
    initialized ??= store.initialize();
    return initialized;
  };

  const server = http.createServer(async (req, res) => {
    try {
      await ensureInitialized();
      const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

      if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
        return json(res, 200, {
          ok: true,
          fixedAgentCount: 6,
          orchestratorOnlyDispatch: true,
          persistence: useJsonStore ? 'server_atomic_json_local_interprocess_locked' : 'server_sqlite_wal_acid_fts5',
          persistenceScope: useJsonStore ? 'single_host_local_filesystem' : 'single_host_sqlite_wal',
          duplicateGuardrail: 'deterministic_exact_plus_human_reviewed_possible_duplicate',
          ownerSuppression: 'deterministic_faceted_rules_unordered_any_match',
          publicShowcase: 'closed_9_field_default_deny_projection',
          killSwitchActive: isGlobalKillSwitchActive(),
          externalPublishingEnabled: false
        });
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/showcase') {
        if (isGlobalKillSwitchActive()) {
          return json(res, 200, { ok: true, query: '', cards: [], killSwitchActive: true });
        }
        const query = requestUrl.searchParams.get('q') ?? '';
        const now = (clock?.() ?? new Date()).toISOString();
        const payload = typeof store.readShowcase === 'function'
          ? await store.readShowcase({ query })
          : queryShowcaseFallback((await store.readState()).candidates, { query, now });
        const safe = assertPublicReadModelSafe(payload);
        if (!safe.ok) throw new Error(`Unsafe showcase payload: ${safe.leaks.join(', ')}`);
        return json(res, 200, { ok: true, ...payload, killSwitchActive: false });
      }

      if (req.method === 'GET' && requestUrl.pathname.startsWith('/api/showcase/')) {
        if (isGlobalKillSwitchActive()) {
          return json(res, 503, { ok: false, status: 'kill_switch_active', card: null });
        }
        const rawNumber = decodeURIComponent(requestUrl.pathname.slice('/api/showcase/'.length));
        const now = (clock?.() ?? new Date()).toISOString();
        const result = typeof store.readShowcase === 'function'
          ? await store.readShowcase({ cardNumber: rawNumber })
          : queryShowcaseFallback((await store.readState()).candidates, { cardNumber: rawNumber, now });
        if (!result.card) {
          return json(res, 404, { ok: false, status: result.status, card: null });
        }
        const markdown = exportDeterministicMarkdownCard(result.card);
        const safe = assertPublicReadModelSafe(result.card);
        if (!safe.ok) throw new Error(`Unsafe showcase card: ${safe.leaks.join(', ')}`);
        return json(res, 200, { ok: true, status: 'ok', card: result.card, markdown });
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/preflight') {
        const rawReport = buildLiveActivationPreflightReport({
          environment: process.env,
          clock: clock ? () => clock() : undefined
        });
        const preflight = toPublicWebPreflightSummary(rawReport);
        const safe = assertPublicReadModelSafe(preflight);
        if (!safe.ok) throw new Error(`Unsafe preflight payload: ${safe.leaks.join(', ')}`);
        return json(res, 200, { ok: true, preflight });
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/today') {
        const today = await store.readToday();
        const safe = assertPublicReadModelSafe(today);
        if (!safe.ok) throw new Error(`Unsafe read model: ${safe.leaks.join(', ')}`);
        return json(res, 200, today);
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/commands') {
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
        return json(res, 200, response);
      }

      if (requestUrl.pathname.startsWith('/api/')) {
        return json(res, 404, { error: 'not_found', message: 'API route not found.' });
      }

      if (!['GET', 'HEAD'].includes(req.method ?? 'GET')) {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
        return res.end('Method not allowed');
      }

      // Awaited on purpose: returning the promise would let a rejection escape this
      // try/catch and become an unhandled rejection, which takes the process down.
      // A browser asking for /favicon.ico was enough to kill the server.
      return await serveStatic(repoRoot, requestUrl, res);
    } catch (error) {
      if (error instanceof ApplicationCommandError) {
        const today = error.code === 'version_conflict' ? await store.readToday() : undefined;
        return json(res, error.statusCode ?? 400, {
          error: error.code,
          message: error.message,
          details: error.details,
          orchestrationReceipt: error.orchestrationReceipt ?? null,
          ...(today ? { today } : {})
        });
      }
      const statusCode = error.statusCode ?? (error.code === 'ENOENT' ? 404 : 500);
      if (req.url?.startsWith('/api/')) {
        return json(res, statusCode, { error: statusCode === 404 ? 'not_found' : 'server_error', message: statusCode === 404 ? 'Not found' : 'Server error' });
      }
      res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(statusCode === 404 ? 'Not found' : statusCode === 403 ? 'Forbidden' : 'Server error');
    }
  });

  server.on('close', () => {
    store.close?.();
  });
  return server;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const port = Number(process.env.PORT || 4173);
  const server = createThreadScoutServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`ThreadScout AI running at http://127.0.0.1:${port}`);
    console.log('Server-authoritative state + local interprocess write lock + candidate dedupe guardrail + owner suppression (AT-14) + Orchestrator-only command dispatch enabled; external publishing disabled.');
  });
}
