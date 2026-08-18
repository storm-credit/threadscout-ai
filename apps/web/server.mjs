// ThreadScout local application server.
//
// Single process, single owner. It is the authority for candidate state: the
// browser holds no durable decision, so closing a tab, reloading, or opening a
// second window cannot lose or fork a decision (D-02, BS-06, AT-35).
//
// No external network call is made from any path in this process.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRuntimeIdFactory, systemClock } from '../../packages/core/src/index.mjs';
import { createJsonlStore } from '../../packages/database/src/jsonl-store.mjs';
import { createMemoryStore } from '../../packages/database/src/memory-store.mjs';
import { assertStorePort } from '../../packages/database/src/ports.mjs';
import { createApiHandler } from './src/api.mjs';
import { createService } from './src/service.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(currentDir, 'public');
const port = Number(process.env.PORT || 4173);

const STATIC_FILES = Object.freeze({
  '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/app.js': { file: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/styles.css': { file: 'styles.css', type: 'text/css; charset=utf-8' }
});

const MAX_BODY_BYTES = 256 * 1024;

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (chunks.length === 0) return resolve(null);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }));
      }
    });
    request.on('error', reject);
  });
}

export function createStore({ persist = true, dataDir, clock } = {}) {
  if (!persist) return assertStorePort(createMemoryStore({ clock }));
  const root = dataDir ?? path.resolve(currentDir, '../../.threadscout-data/slice1');
  return assertStorePort(createJsonlStore({ rootDir: root, clock }));
}

export function createServer({ store, clock = systemClock, nextId = createRuntimeIdFactory() } = {}) {
  const service = createService({ store: store ?? createStore({ clock }), clock, nextId });
  const api = createApiHandler(service);

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://' + (request.headers.host ?? 'localhost'));

      if (url.pathname.startsWith('/api/')) {
        const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await readBody(request) : null;
        const result = await api({ method: request.method, path: url.pathname, body });
        response.writeHead(result.status, result.headers);
        response.end(result.body);
        return;
      }

      // Static assets come from an explicit allowlist rather than a path join, so
      // there is no traversal surface to get wrong.
      const asset = STATIC_FILES[url.pathname];
      if (!asset) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }

      const content = await readFile(path.join(publicDir, asset.file));
      response.writeHead(200, { 'content-type': asset.type, 'cache-control': 'no-store' });
      response.end(content);
    } catch (error) {
      const statusCode = error.statusCode ?? 500;
      response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: { code: 'request_failed', message: '요청을 처리하지 못했습니다.' } }));
    }
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const server = createServer();
  server.listen(port, '127.0.0.1', () => {
    console.log('ThreadScout AI (승인 우선 · 외부 게시 비활성) http://127.0.0.1:' + port);
  });
}
