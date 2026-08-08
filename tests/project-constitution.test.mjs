import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CLAUDE.md requires explicit human approval', async () => {
  const content = await read('CLAUDE.md');
  assert.match(content, /No post may be published without explicit human approval/i);
});

test('success criteria include exact product identity', async () => {
  const content = await read('docs/SUCCESS_CRITERIA.md');
  assert.match(content, /exact product identity/i);
});

test('decision log records the approval-first B+C hybrid', async () => {
  const content = await read('docs/DECISION_LOG.md');
  assert.match(content, /Approval-first B\+C hybrid/i);
});
