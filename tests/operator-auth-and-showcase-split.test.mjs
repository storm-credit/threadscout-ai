import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  SURFACE_MODES,
  isLoopbackAddress,
  normalizeHostname,
  resolveSurfaceAuthConfig,
  verifySecretConstantTime
} from '../apps/web/operator-auth.mjs';
import { assertPublicReadModelSafe } from '../apps/web/application-state.mjs';
import { createThreadScoutServer, parseCliArgs } from '../apps/web/server.mjs';
import { scrubSubprocessEnv } from '../packages/orchestra/src/scrub-env.mjs';
import { isNodeSqliteAvailable } from '../packages/database/src/sqlite-store.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VALID_TEST_OPERATOR_TOKEN = 'ts-op-token-unit-test-9876543210';

async function startTestServer(options = {}) {
  const server = createThreadScoutServer({ repoRoot, ...options });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    server,
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

function rawHttpRequest({ port, method = 'GET', path: reqPath = '/', headers = {}, body = '' }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: reqPath, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          bodyText: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('Calibrated auth & secret-boundary helpers: RFC-3986 hostname, constant-time verifier, closure-private secrets, and fail-closed postures (AT-17, AT-20)', () => {
  assert.equal(normalizeHostname('127.0.0.1:4173'), '127.0.0.1');
  assert.equal(normalizeHostname('[::1]:4173'), '::1');
  assert.equal(normalizeHostname('LOCALHOST:8080'), 'localhost');
  // Malformed bracketed suffix (`[::1].evil.example`) or non-numeric port MUST reject!
  assert.equal(normalizeHostname('[::1].evil.example'), '');
  assert.equal(normalizeHostname('127.0.0.1:evil'), '');
  assert.equal(isLoopbackAddress('127.0.0.1:4173'), true);
  assert.equal(isLoopbackAddress('[::1]:4173'), true);
  assert.equal(isLoopbackAddress('[::1].evil.example'), false);
  assert.equal(isLoopbackAddress('0.0.0.0'), false);
  assert.equal(isLoopbackAddress('showcase.example.com'), false);

  assert.equal(verifySecretConstantTime('alpha-secret-token-1234', 'alpha-secret-token-1234'), true);
  assert.equal(verifySecretConstantTime('short', 'alpha-secret-token-1234'), false);
  assert.equal(verifySecretConstantTime('', 'alpha-secret-token-1234'), false);

  assert.deepEqual(parseCliArgs(['--surface=public_showcase', '--host=0.0.0.0', '--port=4174']), {
    surfaceMode: 'public_showcase',
    bindHost: '0.0.0.0',
    port: 4174
  });

  // 1. Unknown surfaceMode string -> invalid_surface_mode, without echoing raw input string
  const invalidCfg = resolveSurfaceAuthConfig({ surfaceMode: 'accidentally_pasted_secret_token' });
  assert.equal(invalidCfg.authPosture, 'invalid_surface_mode');
  assert.equal(JSON.stringify(invalidCfg).includes('accidentally_pasted_secret_token'), false);

  // 2. Non-loopback bind (`0.0.0.0`) or `production` WITHOUT operatorToken -> misconfigured_fail_closed
  assert.equal(resolveSurfaceAuthConfig({ bindHost: '0.0.0.0', operatorToken: '' }).authPosture, 'misconfigured_fail_closed');
  assert.equal(resolveSurfaceAuthConfig({ bindHost: '127.0.0.1', nodeEnv: 'production', operatorToken: '' }).authPosture, 'misconfigured_fail_closed');
  assert.equal(
    resolveSurfaceAuthConfig({ surfaceMode: 'local_dev', bindHost: '0.0.0.0', operatorToken: '' }).authPosture,
    'misconfigured_fail_closed'
  );

  // 3. Short `< 16`-code-point operatorToken OR short non-empty sessionSecret -> misconfigured_fail_closed
  assert.equal(
    resolveSurfaceAuthConfig({ surfaceMode: 'combined', operatorToken: 'too-short-123' }).authPosture,
    'misconfigured_fail_closed'
  );
  assert.equal(
    resolveSurfaceAuthConfig({
      surfaceMode: 'combined',
      operatorToken: VALID_TEST_OPERATOR_TOKEN,
      sessionSecret: 'short-sess-12'
    }).authPosture,
    'misconfigured_fail_closed'
  );

  // 4. Valid `>= 16`-char operatorToken -> token_and_session_enforced, with ZERO enumerable secret properties!
  const validCombined = resolveSurfaceAuthConfig({ operatorToken: VALID_TEST_OPERATOR_TOKEN });
  assert.equal(validCombined.surfaceMode, SURFACE_MODES.COMBINED);
  assert.equal(validCombined.authPosture, 'token_and_session_enforced');
  assert.equal(JSON.stringify(validCombined).includes(VALID_TEST_OPERATOR_TOKEN), false);
  assert.equal('_operatorToken' in validCombined, false);
  assert.equal('_signingKey' in validCombined, false);

  // 5. Secret redaction (`AT-20` & `SCRUB_ENV`)
  assert.equal(assertPublicReadModelSafe({ leaked: 'THREADSCOUT_OPERATOR_TOKEN' }).ok, false);
  assert.equal(assertPublicReadModelSafe({ leaked: 'THREADSCOUT_SESSION_SECRET' }).ok, false);
  const scrubbed = scrubSubprocessEnv({
    PATH: '/usr/bin',
    THREADSCOUT_OPERATOR_TOKEN: VALID_TEST_OPERATOR_TOKEN,
    THREADSCOUT_SESSION_SECRET: 'another-long-secret-value'
  });
  assert.equal('THREADSCOUT_OPERATOR_TOKEN' in scrubbed, false);
  assert.equal('THREADSCOUT_SESSION_SECRET' in scrubbed, false);
});

test('Closed static allowlist, real HTTP Host DNS-rebinding block, cross-origin/proxied CSRF, and zero-write 503 misconfig guards', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ts-auth-guards-'));
  const typoDir = await mkdtemp(path.join(os.tmpdir(), 'ts-typo-mode-'));
  const misconfigDir = await mkdtemp(path.join(os.tmpdir(), 'ts-misconfig-'));

  try {
    // A. Local dev loopback mode blocks server `.mjs` reads, real Host-header DNS rebinding, and cross-origin CSRF
    const localSrv = await startTestServer({ dataDir: tempDir });
    try {
      for (const forbiddenStatic of [
        '/apps/web/server.mjs',
        '/apps/web/application-state.mjs',
        '/apps/web/operator-auth.mjs',
        '/apps/web/manual-orchestrator.mjs'
      ]) {
        const res = await fetch(`${localSrv.baseUrl}${forbiddenStatic}`);
        assert.equal(res.status, 403, `Expected 403 for server module ${forbiddenStatic}`);
      }

      // Real HTTP DNS-rebinding check (`Host: evil.rebind.example:4173` & `[::1].evil.example`) -> 403 dns_rebinding_blocked
      for (const hostileHost of ['evil.rebind.example:4173', '[::1].evil.example']) {
        const rebindApi = await rawHttpRequest({
          port: localSrv.port,
          method: 'GET',
          path: '/api/today',
          headers: { host: hostileHost }
        });
        assert.equal(rebindApi.status, 403);
        assert.equal(JSON.parse(rebindApi.bodyText).error, 'dns_rebinding_blocked');

        const rebindShowcase = await rawHttpRequest({
          port: localSrv.port,
          method: 'GET',
          path: '/api/showcase',
          headers: { host: hostileHost }
        });
        assert.equal(rebindShowcase.status, 403);

        const rebindHtml = await rawHttpRequest({
          port: localSrv.port,
          method: 'GET',
          path: '/',
          headers: { host: hostileHost }
        });
        assert.equal(rebindHtml.status, 403);
      }

      // Cross-origin POST in local_dev -> 403 csrf_origin_mismatch
      const crossOriginCmd = await fetch(`${localSrv.baseUrl}/api/commands`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://malicious.example'
        },
        body: JSON.stringify({ requestId: 'csrf-1', command: 'reset_demo' })
      });
      assert.equal(crossOriginCmd.status, 403);
      assert.equal((await crossOriginCmd.json()).error, 'csrf_origin_mismatch');

      // W3C Fetch Metadata (`BF-R2-1`): use `rawHttpRequest` (`node:http`) because Undici `fetch()` rewrites
      // `Sec-Fetch-Mode` to `cors` and `Sec-Fetch-Dest` to `empty` per WHATWG Fetch!
      // External social/Threads link click (`GET /showcase`, `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: navigate`,
      // `Sec-Fetch-Dest: document`) succeeds with 200, while `/api/*`, `iframe`, subresource, and `POST` fail 403!
      const socialClickShowcase = await rawHttpRequest({
        port: localSrv.port,
        method: 'GET',
        path: '/showcase',
        headers: {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-dest': 'document'
        }
      });
      assert.equal(socialClickShowcase.status, 200);

      const crossSiteIframeShowcase = await rawHttpRequest({
        port: localSrv.port,
        method: 'GET',
        path: '/showcase',
        headers: {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-dest': 'iframe'
        }
      });
      assert.equal(crossSiteIframeShowcase.status, 403);

      const crossSiteScriptSubresource = await rawHttpRequest({
        port: localSrv.port,
        method: 'GET',
        path: '/apps/web/showcase.js',
        headers: {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-dest': 'script'
        }
      });
      assert.equal(crossSiteScriptSubresource.status, 403);

      const crossSitePopupApi = await rawHttpRequest({
        port: localSrv.port,
        method: 'GET',
        path: '/api/today',
        headers: {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-dest': 'document'
        }
      });
      assert.equal(crossSitePopupApi.status, 403);
      assert.equal(JSON.parse(crossSitePopupApi.bodyText).error, 'csrf_cross_site_blocked');

      // Cross-site POST -> 403
      const crossSiteCmd = await rawHttpRequest({
        port: localSrv.port,
        method: 'POST',
        path: '/api/commands',
        headers: {
          'content-type': 'application/json',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty'
        },
        body: JSON.stringify({ requestId: 'csrf-2', command: 'reset_demo' })
      });
      assert.equal(crossSiteCmd.status, 403);
      assert.equal(JSON.parse(crossSiteCmd.bodyText).error, 'csrf_cross_site_blocked');
    } finally {
      await localSrv.close();
    }

    // B. Invalid surfaceMode (`--surface=public-showcase` typo) returns 503 on `/api/health` and `/api/showcase` with ZERO disk writes!
    const typoSrv = await startTestServer({
      dataDir: typoDir,
      surfaceMode: 'public-showcase'
    });
    try {
      assert.equal((await fetch(`${typoSrv.baseUrl}/api/health`)).status, 503);
      assert.equal((await fetch(`${typoSrv.baseUrl}/api/showcase`)).status, 503);
      assert.equal((await readdir(typoDir)).length, 0, 'Invalid surfaceMode must perform zero disk writes');
    } finally {
      await typoSrv.close();
    }

    // C. Misconfigured network/production server returns 503 on `/api/health`, `/api/today`, `/api/commands`, AND `/api/auth/logout` with ZERO disk writes!
    const misconfigSrv = await startTestServer({
      dataDir: misconfigDir,
      bindHost: '0.0.0.0',
      operatorToken: ''
    });
    try {
      assert.equal((await fetch(`${misconfigSrv.baseUrl}/api/health`)).status, 503);
      assert.equal((await fetch(`${misconfigSrv.baseUrl}/api/today`)).status, 503);
      const logoutMisconfig = await fetch(`${misconfigSrv.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'x-threadscout-csrf': '1' }
      });
      assert.equal(logoutMisconfig.status, 503);
      assert.equal((await readdir(misconfigDir)).length, 0, 'Misconfigured server must perform zero disk writes');
    } finally {
      await misconfigSrv.close();
    }

    // D. Reverse-proxy `trustProxy: true` accepts matching `Origin` + `X-Forwarded-Host` and sets `Secure` cookie on `X-Forwarded-Proto: https`
    const proxySrv = await startTestServer({
      dataDir: tempDir,
      surfaceMode: 'combined',
      operatorToken: VALID_TEST_OPERATOR_TOKEN,
      trustProxy: true
    });
    try {
      const proxiedLogin = await rawHttpRequest({
        port: proxySrv.port,
        method: 'POST',
        path: '/api/auth/login',
        headers: {
          host: `127.0.0.1:${proxySrv.port}`,
          'x-forwarded-host': 'scout.example.com',
          'x-forwarded-proto': 'https',
          origin: 'https://scout.example.com',
          'content-type': 'application/json',
          'x-threadscout-csrf': '1'
        },
        body: JSON.stringify({ token: VALID_TEST_OPERATOR_TOKEN })
      });
      assert.equal(proxiedLogin.status, 200);
      assert.match(String(proxiedLogin.headers['set-cookie'] ?? ''), /Secure/);
    } finally {
      await proxySrv.close();
    }
  } finally {
    try { await rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { await rm(typoDir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { await rm(misconfigDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

const storageModes = isNodeSqliteAvailable() ? ['sqlite', 'json'] : ['json'];

for (const mode of storageModes) {
  test(`E2E (${mode}): HEAD parity, unified login+Bearer brute-force lock, cryptographic logout revocation, corrupt-store 500 fail-closed, & zero-write public_showcase`, async () => {
    const sharedDir = await mkdtemp(path.join(os.tmpdir(), `ts-split-${mode}-`));
    const emptyReadOnlyDir = await mkdtemp(path.join(os.tmpdir(), `ts-empty-ro-${mode}-`));
    const corruptDir = await mkdtemp(path.join(os.tmpdir(), `ts-corrupt-ro-${mode}-`));

    try {
      // 1. `public_showcase` on empty dir performs ZERO disk writes and supports both GET and HEAD!
      const emptyRoSrv = await startTestServer({
        dataDir: emptyReadOnlyDir,
        storageMode: mode,
        surfaceMode: 'public_showcase'
      });
      try {
        const rootRedirect = await fetch(`${emptyRoSrv.baseUrl}/`, { redirect: 'manual' });
        assert.equal(rootRedirect.status, 302);
        assert.equal(rootRedirect.headers.get('location'), '/showcase');

        const headHealth = await fetch(`${emptyRoSrv.baseUrl}/api/health`, { method: 'HEAD' });
        assert.equal(headHealth.status, 200);
        assert.equal(await headHealth.text(), '');

        const headShowcase = await fetch(`${emptyRoSrv.baseUrl}/api/showcase`, { method: 'HEAD' });
        assert.equal(headShowcase.status, 200);
        assert.equal(await headShowcase.text(), '');

        const showcaseRes = await fetch(`${emptyRoSrv.baseUrl}/api/showcase`);
        assert.equal(showcaseRes.status, 200);
        const showcaseJson = await showcaseRes.json();
        assert.deepEqual(showcaseJson.cards, []);
        assert.equal(showcaseJson.operatorStudioAvailable, false);

        assert.equal((await fetch(`${emptyRoSrv.baseUrl}/api/today`)).status, 404);
        assert.equal((await fetch(`${emptyRoSrv.baseUrl}/api/preflight`)).status, 404);
        assert.equal((await fetch(`${emptyRoSrv.baseUrl}/apps/web/index.html`)).status, 403);
        assert.equal((await fetch(`${emptyRoSrv.baseUrl}/apps/web/app.js`)).status, 403);
        const postBlocked = await fetch(`${emptyRoSrv.baseUrl}/api/commands`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ requestId: 'ro-1', command: 'reset_demo' })
        });
        assert.equal(postBlocked.status, 405);

        const filesCreatedInRoDir = await readdir(emptyReadOnlyDir);
        assert.equal(filesCreatedInRoDir.length, 0, 'public_showcase must perform zero disk writes on empty dir');
      } finally {
        await emptyRoSrv.close();
      }

      // 2. Corrupt store file (`SQLITE_CORRUPT` / `SyntaxError`) fails closed with HTTP 500 instead of silently returning `200 { cards: [] }` (`UT-05`)
      const targetCorruptFile = mode === 'sqlite'
        ? path.join(corruptDir, 'threadscout.sqlite')
        : path.join(corruptDir, 'application-state.json');
      await writeFile(targetCorruptFile, 'NOT_A_VALID_SQLITE_OR_JSON_PAYLOAD!!!', 'utf8');
      const corruptSrv = await startTestServer({
        dataDir: corruptDir,
        storageMode: mode,
        surfaceMode: 'public_showcase'
      });
      try {
        const corruptRes = await fetch(`${corruptSrv.baseUrl}/api/showcase`);
        assert.equal(corruptRes.status, 500);
      } finally {
        await corruptSrv.close();
      }

      // 3. `combined` server + companion `public_showcase` server sharing `sharedDir`
      let nowMs = Date.parse('2026-11-27T10:00:00.000Z');
      const clock = () => new Date(nowMs);
      const combinedSrv = await startTestServer({
        dataDir: sharedDir,
        storageMode: mode,
        surfaceMode: 'combined',
        operatorToken: VALID_TEST_OPERATOR_TOKEN,
        trustProxy: false,
        clock
      });
      const publicSrv = await startTestServer({
        dataDir: sharedDir,
        storageMode: mode,
        surfaceMode: 'public_showcase',
        clock
      });

      try {
        // Unauthenticated GET /api/today (no Bearer header!) does NOT count toward rate-limit lockout (`UT-SELF-02`)
        for (let i = 0; i < 8; i += 1) {
          assert.equal((await fetch(`${combinedSrv.baseUrl}/api/today`)).status, 401);
        }

        // Unauthenticated consumer OR Bearer caller on `combined` `/api/showcase` sees `operatorStudioAvailable: false` (`BF-R2-2`: zero Bearer oracle!)
        const pubUnauth = await (await fetch(`${combinedSrv.baseUrl}/api/showcase`)).json();
        assert.equal(pubUnauth.ok, true);
        assert.equal(pubUnauth.operatorStudioAvailable, false);
        const pubBearerIgnored = await (await fetch(`${combinedSrv.baseUrl}/api/showcase`, {
          headers: { authorization: `Bearer ${VALID_TEST_OPERATOR_TOKEN}` }
        })).json();
        assert.equal(pubBearerIgnored.operatorStudioAvailable, false);

        // Unified brute-force limiter (`BF-1` + `BF-R2-2`): 2 bad POST /api/auth/login + 1 bad Bearer + 2 tampered cookies = 5 failures -> 429!
        for (let i = 0; i < 2; i += 1) {
          const badLogin = await fetch(`${combinedSrv.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-threadscout-csrf': '1',
              'x-forwarded-for': `203.0.113.${i + 1}`
            },
            body: JSON.stringify({ token: 'wrong-login-token-guess' })
          });
          assert.equal(badLogin.status, 401);
        }
        const badBearer = await fetch(`${combinedSrv.baseUrl}/api/today`, {
          headers: { authorization: 'Bearer wrong-bearer-guess-0' }
        });
        assert.equal(badBearer.status, 401);

        const fakeIssued = nowMs;
        const fakeExpires = nowMs + 3600_000;
        const tamperedSigCookie = `ts_operator_session=${fakeIssued}.${fakeExpires}.${'a'.repeat(32)}.${'b'.repeat(64)}`;
        assert.equal((await fetch(`${combinedSrv.baseUrl}/api/today`, { headers: { cookie: tamperedSigCookie } })).status, 401);
        assert.equal((await fetch(`${combinedSrv.baseUrl}/api/today`, { headers: { cookie: 'ts_operator_session=malformed-token' } })).status, 401);

        const lockedBearer = await fetch(`${combinedSrv.baseUrl}/api/today`, {
          headers: { authorization: `Bearer ${VALID_TEST_OPERATOR_TOKEN}` }
        });
        assert.equal(lockedBearer.status, 429);
        assert.equal((await lockedBearer.json()).error, 'auth_rate_limited');
        const lockedCookieAttempt = await fetch(`${combinedSrv.baseUrl}/api/today`, {
          headers: { cookie: tamperedSigCookie }
        });
        assert.equal(lockedCookieAttempt.status, 429);

        // Advance clock 16m -> valid login issues HttpOnly; SameSite=Strict cookie
        nowMs += 16 * 60 * 1000;
        const loginOk = await fetch(`${combinedSrv.baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-threadscout-csrf': '1' },
          body: JSON.stringify({ token: VALID_TEST_OPERATOR_TOKEN })
        });
        assert.equal(loginOk.status, 200);
        const setCookie = loginOk.headers.get('set-cookie') ?? '';
        assert.match(setCookie, /ts_operator_session=/);
        assert.match(setCookie, /HttpOnly/);
        assert.match(setCookie, /SameSite=Strict/);
        const sessionCookie = setCookie.split(';')[0];

        // Authenticated operator visiting `/api/showcase` sees `operatorStudioAvailable: true`
        const pubAuth = await (await fetch(`${combinedSrv.baseUrl}/api/showcase`, {
          headers: { cookie: sessionCookie }
        })).json();
        assert.equal(pubAuth.operatorStudioAvailable, true);

        const todayAuth = await fetch(`${combinedSrv.baseUrl}/api/today`, {
          headers: { cookie: sessionCookie }
        });
        assert.equal(todayAuth.status, 200);
        const todayBody = await todayAuth.json();
        const readyCand = todayBody.candidates.find((c) => c.id === 'demo-ready-sink-guard');
        assert.ok(readyCand);

        // Cookie POST without `x-threadscout-csrf: 1` fails 403 `csrf_header_missing`
        const missingCsrf = await fetch(`${combinedSrv.baseUrl}/api/commands`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: sessionCookie },
          body: JSON.stringify({
            requestId: 'c-no-csrf',
            command: 'request_strategies',
            candidateId: readyCand.id,
            expectedRevision: readyCand.revision
          })
        });
        assert.equal(missingCsrf.status, 403);
        assert.equal((await missingCsrf.json()).error, 'csrf_header_missing');

        let rev = readyCand.revision;
        for (const [idx, cmdName] of ['request_strategies', 'request_drafts', 'run_guardian'].entries()) {
          const r = await fetch(`${combinedSrv.baseUrl}/api/commands`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie: sessionCookie,
              'x-threadscout-csrf': '1'
            },
            body: JSON.stringify({
              requestId: `auth-flow-${idx}`,
              command: cmdName,
              candidateId: readyCand.id,
              expectedRevision: rev
            })
          });
          assert.equal(r.status, 200);
          rev = (await r.json()).today.candidates.find((c) => c.id === readyCand.id).revision;
        }

        const approveRes = await fetch(`${combinedSrv.baseUrl}/api/commands`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${VALID_TEST_OPERATOR_TOKEN}`
          },
          body: JSON.stringify({
            requestId: 'auth-approve-1',
            command: 'review_decision',
            candidateId: readyCand.id,
            expectedRevision: rev,
            payload: { decision: 'approved', draftId: 'draft-1' }
          })
        });
        assert.equal(approveRes.status, 200);

        const splitShowcase = await fetch(`${publicSrv.baseUrl}/api/showcase`);
        assert.equal(splitShowcase.status, 200);
        const splitBody = await splitShowcase.json();
        assert.equal(splitBody.operatorStudioAvailable, false);
        assert.equal(splitBody.cards.length, 1);
        assert.equal(splitBody.cards[0].cardNumber, '#001');

        const headCard = await fetch(`${publicSrv.baseUrl}/api/showcase/1`, { method: 'HEAD' });
        assert.equal(headCard.status, 200);
        assert.equal(await headCard.text(), '');

        // Logout revokes nonce server-side so replaying the old `sessionCookie` immediately fails `401` (`NBR-2`)!
        const logoutRes = await fetch(`${combinedSrv.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { cookie: sessionCookie, 'x-threadscout-csrf': '1' }
        });
        assert.equal(logoutRes.status, 200);
        assert.match(logoutRes.headers.get('set-cookie') ?? '', /Max-Age=0/);

        const replayOldCookie = await fetch(`${combinedSrv.baseUrl}/api/today`, {
          headers: { cookie: sessionCookie }
        });
        assert.equal(replayOldCookie.status, 401);

        // Revoked and expired cookies NEVER count as `tampered` (`UT-R2-SELF-02`: 8+ replays stay 401, never 429!)
        for (let i = 0; i < 7; i += 1) {
          const r = await fetch(`${combinedSrv.baseUrl}/api/today`, {
            headers: { cookie: sessionCookie }
          });
          assert.equal(r.status, 401);
        }
        nowMs += 13 * 60 * 60 * 1000; // past 12h TTL -> expired
        for (let i = 0; i < 7; i += 1) {
          const r = await fetch(`${combinedSrv.baseUrl}/api/today`, {
            headers: { cookie: sessionCookie }
          });
          assert.equal(r.status, 401);
        }
      } finally {
        await publicSrv.close();
        await combinedSrv.close();
      }
    } finally {
      try { await rm(emptyReadOnlyDir, { recursive: true, force: true }); } catch { /* ignore */ }
      try { await rm(corruptDir, { recursive: true, force: true }); } catch { /* ignore */ }
      try { await rm(sharedDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });
}
