import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('mobile Opportunity Inbox exposes the manual-product decision path', async () => {
  const html = await read('apps/web/index.html');
  for (const id of [
    'open-add-candidate', 'candidate-form', 'state-filter', 'duplicate-review-section',
    'duplicate-distinct', 'duplicate-suppress', 'verify-evidence',
    'create-strategies', 'create-drafts', 'save-draft', 'run-guardian',
    'approve-draft', 'hold-candidate', 'reject-candidate'
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Opportunity Inbox/);
});

test('possible duplicate UI requires explicit owner resolution before evidence work', async () => {
  const app = await read('apps/web/app.js');
  assert.match(app, /workflowState === 'duplicate_review'/);
  assert.match(app, /sendCommand\('resolve_duplicate'/);
  assert.match(app, /decision: 'distinct'|resolveDuplicate\('distinct'\)/);
  assert.match(app, /resolveDuplicate\('duplicate'\)/);
  assert.match(app, /verify-evidence'\)\.disabled = duplicatePending/);
  assert.match(app, /같은 제품인지 먼저 확인하세요/);
});

test('web client does not use localStorage as application authority', async () => {
  const app = await read('apps/web/app.js');
  assert.doesNotMatch(app, /localStorage|sessionStorage/);
  assert.match(app, /fetch\('\/api\/today'/);
  assert.match(app, /fetch\('\/api\/commands'/);
  assert.match(app, /expectedRevision/);
});

test('web app keeps external publishing disabled and labels truth boundary', async () => {
  const [html, server] = await Promise.all([
    read('apps/web/index.html'),
    read('apps/web/server.mjs')
  ]);
  assert.match(html, /외부 자동 게시 꺼짐/);
  assert.match(html, /사용자 제공 근거 또는 예시 데이터/);
  assert.match(server, /externalPublishingEnabled: false/);
  assert.match(server, /duplicateGuardrail: 'deterministic_exact_plus_human_reviewed_possible_duplicate'/);
});

test('rendered candidate, duplicate summary, and draft values are escaped before HTML insertion', async () => {
  const app = await read('apps/web/app.js');
  assert.match(app, /function escapeHtml/);
  assert.match(app, /escapeHtml\(candidate\.name\)/);
  assert.match(app, /escapeHtml\(match\.name/);
  assert.match(app, /escapeHtml\(draft\.text\)/);
});

test('local server restricts static reads to the web root while API stays server-owned', async () => {
  const server = await read('apps/web/server.mjs');
  assert.match(server, /webRoot.*apps\/web/);
  assert.match(server, /fullPath\.startsWith\(`\$\{webRoot\}\$\{path\.sep\}`\)/);
  assert.match(server, /GET.*\/api\/today/s);
  assert.match(server, /POST.*\/api\/commands/s);
});

test('360px structural rules keep the first-card decision UI touch oriented', async () => {
  const [html, css, app] = await Promise.all([
    read('apps/web/index.html'),
    read('apps/web/styles.css'),
    read('apps/web/app.js')
  ]);
  assert.match(css, /@media \(max-width: 380px\)/);
  assert.match(css, /\.card-actions \{ flex-direction: column; \}/);
  assert.match(css, /\.nav-item \{ min-height: 48px/);
  for (const text of ['기회 점수', '근거와 위험 상태', '왜 지금', '독자 가치', '유사 후보 확인']) {
    assert.match(`${html}\n${app}`, new RegExp(text));
  }
});

test('mobile bottom navigation exposes all five designed destinations', async () => {
  const html = await read('apps/web/index.html');
  for (const view of ['today', 'verification', 'drafts', 'queue', 'performance']) {
    assert.match(html, new RegExp(`data-view="${view}"`));
  }
});