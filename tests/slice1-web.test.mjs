// Web surface constraints.
//
// These are static checks on the shipped client. They cannot replace looking at the
// running app — a rendered screenshot proves nothing about whether the interactions
// work, and these checks prove nothing about whether the layout reads well. They
// exist to stop a regression that a person would only notice by chance.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFixedClock, createRuntimeIdFactory } from '../packages/core/src/index.mjs';
import { createMemoryStore } from '../packages/database/src/memory-store.mjs';
import { createServer } from '../apps/web/server.mjs';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web/public');
const read = (file) => readFile(path.join(publicDir, file), 'utf8');

test('AT-34: the client declares a mobile viewport and Korean as the document language', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /name="viewport"[^>]*width=device-width/);
});

test('AT-22: state badges carry a symbol and a text label, never colour alone', async () => {
  const js = await read('app.js');
  const css = await read('styles.css');

  assert.match(js, /TONE_SYMBOLS\s*=\s*\{[^}]*ok:\s*'✔'/, 'each tone maps to a visible symbol');
  assert.match(js, /state-value/, 'each badge renders a text value');
  assert.match(css, /\.state-badge::before\s*\{\s*content:\s*attr\(data-symbol\)/, 'the symbol is rendered');
  assert.match(js, /SEVERITY_LABELS\s*=\s*\{\s*blocker:\s*'차단'/, 'severity is spelled out, not implied by colour');
});

test('the 360 px review width is respected and no interaction depends on hover', async () => {
  const css = await read('styles.css');
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /--tap:\s*44px/);
  assert.doesNotMatch(css, /:hover\s*\{[^}]*display:\s*(block|flex|grid)/, 'nothing may be revealed only on hover');
  assert.match(css, /@media \(min-width: 700px\)/, 'wider screens are an enhancement, not the base');
});

test('the draft screen offers no direct publish action', async () => {
  const html = await read('index.html');
  const js = await read('app.js');
  assert.doesNotMatch(html + js, /바로 게시|즉시 게시/);
  assert.match(js, /외부 게시 · 꺼짐/, 'the external publishing state stays visible');
});

test('client-rendered text is escaped before insertion', async () => {
  const js = await read('app.js');
  assert.match(js, /function escapeHtml/);
  // Any interpolation into innerHTML must go through escapeHtml.
  const rawInterpolations = js.match(/innerHTML\s*=\s*[^;]*\$\{(?!escapeHtml)/g) ?? [];
  assert.deepEqual(rawInterpolations, [], 'no unescaped template interpolation into innerHTML');
});

test('the client stores no durable decision of its own', async () => {
  const js = await read('app.js');
  assert.doesNotMatch(js, /localStorage|sessionStorage|indexedDB/,
    'the browser must not be the authority for any decision (D-02, AT-35)');
});

/* Server behaviour ---------------------------------------------------------- */

async function withServer(work) {
  const clock = createFixedClock('2026-08-14T00:00:00.000Z', 1000);
  const server = createServer({
    store: createMemoryStore({ clock }),
    clock,
    nextId: createRuntimeIdFactory(() => 0.5)
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    return await work(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('static assets are served from an allowlist, so there is no traversal surface', async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await fetch(base + '/app.js')).status, 200);
    assert.equal((await fetch(base + '/styles.css')).status, 200);

    for (const attempt of ['/../package.json', '/apps/web/server.mjs', '/.env', '/packages/core/src/index.mjs']) {
      const response = await fetch(base + attempt);
      assert.equal(response.status, 404, attempt + ' must not be served');
    }
  });
});

test('the API rejects an oversized or malformed body without leaking internals', async () => {
  await withServer(async (base) => {
    const malformed = await fetch(base + '/api/candidates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json'
    });
    assert.equal(malformed.status, 400);
    const payload = await malformed.json();
    assert.doesNotMatch(JSON.stringify(payload), /at Object|node:internal|C:\\/);

    const oversized = await fetch(base + '/api/candidates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x'.repeat(300_000) })
    });
    assert.ok([413, 400].includes(oversized.status), 'an oversized body is refused');
  });
});

test('an unknown API route returns a structured 404', async () => {
  await withServer(async (base) => {
    const response = await fetch(base + '/api/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'not_found');
  });
});

test('the running server exposes external publishing as disabled', async () => {
  await withServer(async (base) => {
    const capabilities = await (await fetch(base + '/api/capabilities')).json();
    assert.equal(capabilities.externalPublishingEnabled, false);
    for (const capability of capabilities.capabilities) {
      if (['threads_publishing', 'coupang_affiliate_publishing', 'third_party_media_republication'].includes(capability.id)) {
        assert.equal(capability.enabled, false, capability.id + ' must stay disabled');
      }
    }
  });
});
