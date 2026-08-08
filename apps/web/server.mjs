import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function resolveRequestPath(urlPath) {
  const requested = urlPath === '/' ? '/apps/web/index.html' : decodeURIComponent(urlPath);
  const fullPath = path.resolve(repoRoot, `.${requested}`);
  if (!fullPath.startsWith(repoRoot)) return null;
  return fullPath;
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    let filePath = resolveRequestPath(requestUrl.pathname);
    if (!filePath) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');

    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  } catch (error) {
    const statusCode = error.statusCode ?? (error.code === 'ENOENT' ? 404 : 500);
    res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(statusCode === 404 ? 'Not found' : 'Server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ThreadScout AI running at http://127.0.0.1:${port}`);
});
