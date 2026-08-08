import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('mobile dashboard exposes core actions', async () => {
  const html = await read('apps/web/index.html');
  for (const id of ['reset-demo', 'state-filter', 'validate-draft', 'approve-draft', 'hold-candidate', 'reject-candidate', 'block-candidate', 'add-to-queue']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('web app keeps publishing local-only', async () => {
  const [html, core] = await Promise.all([
    read('apps/web/index.html'),
    read('packages/core/src/index.mjs')
  ]);
  assert.match(html, /외부 자동 게시 꺼짐/);
  assert.match(core, /publishingEnabled: false/);
});

test('dashboard labels fixture data as examples', async () => {
  const html = await read('apps/web/index.html');
  assert.match(html, /예시 데이터/);
});
