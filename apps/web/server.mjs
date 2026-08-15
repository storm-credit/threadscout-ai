import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApplicationCommandError, assertPublicReadModelSafe } from './application-state.mjs';
import { LockedAtomicJsonApplicationStore } from './locked-application-store.mjs';
import { ManualProductOrchestratorService } from './manual-orchestrator.mjs';

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
    'x-content-type-options': 'nosniff'
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
  const normalized = urlPath === '/' ? '/apps/web/index.html' : decodeURIComponent(urlPath);
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
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

export function createThreadScoutServer({
  repoRoot = defaultRepoRoot,
  dataDir = process.env.THREADSCOUT_DATA_DIR || path.resolve(repoRoot, '.threadscout-data'),
  stateFile = 'application-state.json',
  clock,
  storeOptions = {}
} = {}) {
  const store = new LockedAtomicJsonApplicationStore({
    filePath: path.resolve(dataDir, stateFile),
    clock,
    ...storeOptions
  });
  const orchestrator = new ManualProductOrchestratorService({ store });
  let initialized = null;
  const ensureInitialized = () => {
    initialized ??= store.initialize();
    return initialized;
  };

  return http.createServer(async (req, res) => {
    try {
      await ensureInitialized();
      const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

      if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
        return json(res, 200, {
          ok: true,
          fixedAgentCount: 6,
          orchestratorOnlyDispatch: true,
          persistence: 'server_atomic_json_local_interprocess_locked',
          persistenceScope: 'single_host_local_filesystem',
          externalPublishingEnabled: false
        });
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/today') {
        const today = await store.readToday();
        const safe = assertPublicReadModelSafe(today);
        if (!safe.ok) throw new Error(`Unsafe read model: ${safe.leaks.join(', ')}`);
        return json(res, 200, today);
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/commands') {
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

      return serveStatic(repoRoot, requestUrl, res);
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
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const port = Number(process.env.PORT || 4173);
  const server = createThreadScoutServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`ThreadScout AI running at http://127.0.0.1:${port}`);
    console.log('Server-authoritative state + local interprocess write lock + Orchestrator-only command dispatch enabled; external publishing disabled.');
  });
}
