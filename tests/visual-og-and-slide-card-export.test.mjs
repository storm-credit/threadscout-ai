import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createThreadScoutServer } from '../apps/web/server.mjs';
import { SURFACE_MODES } from '../apps/web/operator-auth.mjs';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SLIDE_CARD_HEIGHT,
  SLIDE_CARD_WIDTH,
  buildShowcaseOpenGraphModel,
  injectShowcaseOpenGraphHtml,
  isSafeHttpsRasterAssetUrl,
  renderShowcaseCardSvg,
  renderShowcaseOgPngBuffer,
  validateClosedPublicShowcaseCard,
  wrapSvgLines
} from '../packages/core/src/showcase-og-renderer.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parsePngDimensions(buf) {
  assert.equal(Buffer.isBuffer(buf) || buf instanceof Uint8Array, true);
  const b = Buffer.from(buf);
  const expectedSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(b.subarray(0, 8), expectedSig, 'Invalid PNG signature');
  assert.equal(b.subarray(12, 16).toString('ascii'), 'IHDR');
  const width = b.readUInt32BE(16);
  const height = b.readUInt32BE(20);
  const iendType = b.subarray(b.length - 8, b.length - 4).toString('ascii');
  assert.equal(iendType, 'IEND');
  return { width, height, byteLength: b.length };
}

async function startServer(options = {}) {
  const server = createThreadScoutServer({ repoRoot, ...options });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function postCommand(baseUrl, body) {
  const res = await fetch(`${baseUrl}/api/commands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return { status: res.status, json };
}

function rawHttpGet(baseUrl, reqPath, headers = {}) {
  const u = new URL(reqPath, baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: u.hostname, port: Number(u.port), method: 'GET', path: `${u.pathname}${u.search}`, headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, buffer: buf, text: buf.toString('utf8') });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('Showcase OG & Slide-2 SVG unit contracts: 1200x630 PNG binary, $&/$`/$$ replacement safety, non-BMP emoji wrapping, raster-only og:image, fail-closed validation, and 500-char non-overlap', () => {
  const indexPng = renderShowcaseOgPngBuffer(null);
  const indexDims = parsePngDimensions(indexPng);
  assert.equal(indexDims.width, OG_IMAGE_WIDTH);
  assert.equal(indexDims.height, OG_IMAGE_HEIGHT);
  assert.equal(indexDims.byteLength > 400, true);

  // BLOCKER-3 regression: unbroken token containing non-BMP emoji (`🔥` UTF-16 length 2) must NEVER overwrite leading `[광고]`
  const emojiUnbroken = '[광고]🔥본게시물은네이버쇼핑커넥트활동의일환으로판매발생시수수료를제공받습니다확인필수문구입니다';
  const wrappedEmoji = wrapSvgLines(emojiUnbroken, 40, 12, { allowEllipsis: false });
  assert.equal(wrappedEmoji.join(''), emojiUnbroken);
  assert.equal(wrappedEmoji[0].startsWith('[광고]🔥'), true);

  // MAJOR-1 regression: raster vs non-raster HTTPS URL classification
  assert.equal(isSafeHttpsRasterAssetUrl('https://cdn.example.com/photo.jpg?sig=abc$&w=1200'), true);
  assert.equal(isSafeHttpsRasterAssetUrl('https://cdn.example.com/images/product-123'), true);
  assert.equal(isSafeHttpsRasterAssetUrl('https://cdn.example.com/spec.svg'), false);
  assert.equal(isSafeHttpsRasterAssetUrl('https://cdn.example.com/clip.MP4?token=1'), false);
  assert.equal(isSafeHttpsRasterAssetUrl('http://cdn.example.com/photo.jpg'), false);
  assert.equal(isSafeHttpsRasterAssetUrl('https://user:pass@cdn.example.com/photo.jpg'), false);

  // BLOCKER-1 regression: `$&`, `` $` ``, `$$` inside disclosureText, canonicalProductName, and publishableMediaUrl
  const specialDollarDisclosure = '[광고] $$100% 정품 안내 ($& 및 $` 특수기호 원문 보존 검증) — 판매 발생 시 수수료를 제공받습니다.';
  const monetizedCard = {
    cardNumber: '#007',
    canonicalProductName: '무아스 물막이 $& $` $$ <script>alert(1)</script> 50cm',
    matchBadge: 'exact',
    verifiedPros: ['타공 없이 싱크대 상판에 밀착 고정', '미사용 시 접어서 수납 가능'],
    verifiedLimitation: '상판 두께 3.5cm 초과 시 고정 클립 장착 불가',
    verifiedDestinationUrl: 'https://brand.naver.com/mooas/products/100?nt_source=shoppingconnect',
    publishableMediaUrl: 'https://cdn.example.com/owned/photo.jpg?sig=abc$&w=1080',
    disclosureText: specialDollarDisclosure,
    verifiedAt: '2026-11-28T00:00:00.000Z'
  };

  const cardPng = renderShowcaseOgPngBuffer(monetizedCard);
  assert.deepEqual(parsePngDimensions(cardPng), { width: 1200, height: 630, byteLength: cardPng.length });
  assert.notDeepEqual(cardPng, indexPng);

  const licensedModel = buildShowcaseOpenGraphModel({
    card: monetizedCard,
    isDetailRoute: true,
    origin: 'https://showcase.example.com'
  });
  assert.equal(licensedModel.ogDescription.startsWith(specialDollarDisclosure), true);
  assert.equal(licensedModel.ogImage, 'https://cdn.example.com/owned/photo.jpg?sig=abc$&w=1080');
  assert.equal(licensedModel.ogImageIsGeneratedFallback, false);

  const baseHtml = '<!doctype html>\n<html><head><meta name="description" content="OLD_DESC_SENTINEL" /><title>OLD_TITLE_SENTINEL</title></head><body></body></html>';
  const injected = injectShowcaseOpenGraphHtml(baseHtml, licensedModel);
  // Neither `OLD_DESC_SENTINEL` nor `OLD_TITLE_SENTINEL` nor `<!doctype` may be re-injected via `$&` / `` $` ``!
  assert.equal(injected.includes('OLD_DESC_SENTINEL'), false);
  assert.equal(injected.includes('OLD_TITLE_SENTINEL'), false);
  assert.equal(injected.split('<!doctype html>').length - 1, 1);
  assert.equal(injected.includes('$$100% 정품 안내 ($&amp; 및 $` 특수기호 원문 보존 검증)'), true);
  assert.equal(injected.includes('sig=abc$&amp;w=1080'), true);
  assert.equal(injected.includes('og:image:width'), false, 'External raster URL must not emit generated 1200x630 dimensions');

  // External URL ending in `/og.png` must still have `ogImageIsGeneratedFallback === false`, while `.svg`/`.mp4` falls back to `/api/showcase/007/og.png`
  const externalOgPngModel = buildShowcaseOpenGraphModel({
    card: { ...monetizedCard, publishableMediaUrl: 'https://cdn.example.com/custom/og.png' },
    isDetailRoute: true,
    origin: 'https://showcase.example.com'
  });
  assert.equal(externalOgPngModel.ogImage, 'https://cdn.example.com/custom/og.png');
  assert.equal(externalOgPngModel.ogImageIsGeneratedFallback, false);

  for (const nonRaster of ['https://cdn.example.com/diagram.svg', 'https://cdn.example.com/reel.mp4']) {
    const fallbackModel = buildShowcaseOpenGraphModel({
      card: { ...monetizedCard, publishableMediaUrl: nonRaster },
      isDetailRoute: true,
      origin: 'https://showcase.example.com'
    });
    assert.equal(fallbackModel.ogImage, 'https://showcase.example.com/api/showcase/007/og.png');
    assert.equal(fallbackModel.ogImageIsGeneratedFallback, true);
  }

  // MAJOR-3 / UT-04: 494-char disclosure of nineteen 26-char tokens renders verbatim with zero box overlap in SVG
  const maxDisclosure = `[광고] ${Array.from({ length: 18 }, (_, i) => `제휴수수료법정고지필수확인문구항목번호${String(i + 1).padStart(2, '0')}번안내입니다`).join(' ')}`.slice(0, 495);
  const denseSvg = renderShowcaseCardSvg({ ...monetizedCard, disclosureText: maxDisclosure });
  const plainDenseSvg = denseSvg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.equal(plainDenseSvg.includes(maxDisclosure), true);
  // Extract `<rect x="64" y="..." width="952" height="..."` (prosBox is the last 952-wide rect) and `<rect x="64" y="..." width="306" height="98"` (first check tile)
  const wideRects = [...denseSvg.matchAll(/<rect x="64" y="(\d+)" width="952" height="(\d+)"/g)];
  const prosRect = wideRects[wideRects.length - 1];
  const checkTileMatch = denseSvg.match(/<rect x="64" y="(\d+)" width="306" height="(\d+)"/);
  assert.equal(Boolean(prosRect && checkTileMatch), true);
  const prosBottom = Number(prosRect[1]) + Number(prosRect[2]);
  const stripTop = Number(checkTileMatch[1]);
  const stripBottom = stripTop + Number(checkTileMatch[2]);
  assert.equal(stripTop >= prosBottom + 20, true, `Expected stripTop (${stripTop}) >= prosBottom + 20 (${prosBottom + 20})`);
  assert.equal(stripBottom <= 1224 - 18, true, `Expected stripBottom (${stripBottom}) <= footerLineY - 18`);

  // BLOCKER-4: Malformed cards fail closed across validator, OG model, PNG, and SVG
  for (const badCard of [
    null,
    { ...monetizedCard, matchBadge: 'likely' },
    { ...monetizedCard, verifiedDestinationUrl: 'https://coupa.ng/bZ1', disclosureText: null },
    { ...monetizedCard, verifiedDestinationUrl: 'https://coupa.ng/bZ1', disclosureText: '   ' },
    { ...monetizedCard, verifiedDestinationUrl: null, disclosureText: '[광고] 비대칭 고지' },
    { ...monetizedCard, verifiedAt: '' },
    { ...monetizedCard, verifiedPros: ['   '] }
  ]) {
    assert.equal(validateClosedPublicShowcaseCard(badCard).ok, false);
    const badOg = buildShowcaseOpenGraphModel({ card: badCard, isDetailRoute: true, origin: 'https://showcase.example.com' });
    assert.equal(badOg.robots, 'noindex, nofollow');
    assert.equal(badOg.ogImage, null);
    assert.equal(badOg.ogTitle.includes('무아스'), false);
    if (badCard !== null) {
      assert.throws(() => renderShowcaseOgPngBuffer(badCard));
      assert.throws(() => renderShowcaseCardSvg(badCard));
    }
  }

  // Non-commercial card (`BS-60` & `UT-05` stays-quiet): zero `[광고]`, zero `#008`, and zero `쇼케이스` on exported SVG
  const nonCommercialCard = {
    cardNumber: '#008',
    canonicalProductName: '스텐 배수구 거름망 대형',
    matchBadge: 'alternative',
    verifiedPros: ['기존 플라스틱 바스켓 대비 물때 세척 용이'],
    verifiedLimitation: '배수구 내경 14cm 미만 소형 싱크대 호환 불가',
    verifiedDestinationUrl: null,
    publishableMediaUrl: null,
    disclosureText: null,
    verifiedAt: '2026-11-28T00:00:00.000Z'
  };
  const nonCommSvg = renderShowcaseCardSvg(nonCommercialCard);
  assert.equal(nonCommSvg.includes('[광고]'), false);
  assert.equal(nonCommSvg.includes('#008'), false);
  assert.equal(nonCommSvg.includes('쇼케이스'), false);
  assert.equal(nonCommSvg.includes('검증 대체품'), true);
});

test('Client Slide-2 1080x1350 canvas module & showcase.js: syntax, storage ban, fail-closed validation, 500-char non-overlap, and UT-05 non-commercial stamp', async () => {
  const cardVisualsPath = path.resolve(repoRoot, 'apps/web/card-visuals.js');
  const showcaseJsPath = path.resolve(repoRoot, 'apps/web/showcase.js');
  const ogRendererPath = path.resolve(repoRoot, 'packages/core/src/showcase-og-renderer.mjs');
  execFileSync(process.execPath, ['--check', `${cardVisualsPath}`]);
  execFileSync(process.execPath, ['--check', `${showcaseJsPath}`]);
  execFileSync(process.execPath, ['--check', ogRendererPath]);

  const [rawSource, rawShowcaseJs] = await Promise.all([
    readFile(cardVisualsPath, 'utf8'),
    readFile(showcaseJsPath, 'utf8')
  ]);
  for (const banned of [`local${'Storage'}`, `session${'Storage'}`]) {
    assert.equal(rawSource.includes(banned), false, `Forbidden browser storage token in card-visuals.js: ${banned}`);
    assert.equal(rawShowcaseJs.includes(banned), false, `Forbidden browser storage token in showcase.js: ${banned}`);
  }
  // MAJOR-2: showcase.js wraps decodeURIComponent in try/catch and normalizes trailing slashes
  assert.match(rawShowcaseJs, /try\s*\{\s*cardSlug\s*=\s*decodeURIComponent/);

  const { SLIDE_HEIGHT, SLIDE_WIDTH, renderSlideCardCanvas } = await import(
    `data:text/javascript;base64,${Buffer.from(rawSource, 'utf8').toString('base64')}`
  );

  const validBase = {
    cardNumber: '#001',
    canonicalProductName: '무아스 실리콘 접이식 물막이 50cm',
    matchBadge: 'exact',
    verifiedPros: ['타공 없이 상판 밀착 설치', '접이식 보관으로 조리 공간 확보', '열탕 소독 가능한 실리콘 소재'],
    verifiedLimitation: '상판 앞턱 폭이 4cm 미만인 라운드 싱크대에는 흡착력이 떨어집니다.',
    verifiedDestinationUrl: 'https://coupa.ng/bZ9999',
    publishableMediaUrl: null,
    disclosureText: '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.',
    verifiedAt: '2026-11-28T01:00:00.000Z'
  };

  // BLOCKER-4 + MINOR-R2-1 fail-closed checks on canvas renderer (strict 9-field parity)
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, matchBadge: 'substitute' }), /매칭 구분/);
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, verifiedAt: '' }), /검증 시각/);
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, verifiedDestinationUrl: null, disclosureText: '[광고] 비대칭' }), /함께 존재/);
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, verifiedPros: [] }), /핵심 강점/);
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, verifiedPros: ['1', '2', '3', '4'] }), /핵심 강점/);
  await assert.rejects(() => renderSlideCardCanvas({ ...validBase, publishableMediaUrl: 'http://insecure.example/a.jpg' }), /publishableMediaUrl/);

  const makeMockDoc = (drawnTexts) => ({
    fonts: { ready: Promise.resolve() },
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext(kind) {
          assert.equal(kind, '2d');
          let currentFontPx = 22;
          return {
            set font(val) {
              const m = String(val).match(/(\d+)px/);
              if (m) currentFontPx = Number(m[1]);
            },
            get font() { return `${currentFontPx}px sans-serif`; },
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            textBaseline: 'alphabetic',
            save() {},
            restore() {},
            clip() {},
            beginPath() {},
            moveTo() {},
            arcTo() {},
            closePath() {},
            fill() {},
            stroke() {},
            fillRect() {},
            measureText(str) {
              return { width: [...String(str)].length * (currentFontPx * 0.92) };
            },
            fillText(str, x, y) {
              drawnTexts.push({ str: String(str), x, y, fontPx: currentFontPx });
            }
          };
        },
        toDataURL(mime) {
          assert.equal(mime, 'image/png');
          return 'data:image/png;base64,iVBORw0KGgo=';
        }
      };
    }
  });

  // Test 494-char disclosure non-overlap in Canvas (`MAJOR-3` / `UT-04`)
  const denseTexts = [];
  const maxDisclosure = `[광고] ${Array.from({ length: 18 }, (_, i) => `제휴수수료법정고지필수확인문구항목번호${String(i + 1).padStart(2, '0')}번안내입니다`).join(' ')}`.slice(0, 495);
  const rendered = await renderSlideCardCanvas({ ...validBase, disclosureText: maxDisclosure }, { documentRef: makeMockDoc(denseTexts) });
  assert.equal(rendered.canvas.width, SLIDE_WIDTH);
  assert.equal(rendered.canvas.height, SLIDE_HEIGHT);
  assert.equal(denseTexts[0].str.startsWith('[광고]'), true);
  const lastProLine = denseTexts.filter((t) => /^[123]\.\s/.test(t.str)).at(-1);
  const stripHeader = denseTexts.find((t) => t.str === '구매 전 필수');
  const footerDate = denseTexts.find((t) => t.str.startsWith('검증 기준일'));
  assert.equal(Boolean(lastProLine && stripHeader && footerDate), true);
  assert.equal(stripHeader.y > lastProLine.y + 40, true, 'Check strip must never overlap Pine pros box on 500-char disclosures');
  assert.equal(stripHeader.y + 84 < footerDate.y - 20, true, 'Check strip must stay above provenance footer');

  // Non-commercial PNG (`UT-05`): zero `[광고]`, zero `#001`, zero `쇼케이스`
  const nonCommTexts = [];
  await renderSlideCardCanvas(
    { ...validBase, cardNumber: '#009', verifiedDestinationUrl: null, disclosureText: null },
    { documentRef: makeMockDoc(nonCommTexts) }
  );
  const joinedCanvasText = nonCommTexts.map((t) => t.str).join(' | ');
  assert.equal(joinedCanvasText.includes('[광고]'), false);
  assert.equal(joinedCanvasText.includes('#009'), false);
  assert.equal(joinedCanvasText.includes('쇼케이스'), false);
});

test('E2E HTTP routes across sqlite, json, and public_showcase: cross-site Sec-Fetch-Site image vs JSON stays-quiet, trailing slash, HEAD parity, stale & exact-TTL withdrawal, and kill-switch', async () => {
  for (const storageMode of ['sqlite', 'json']) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `ts-og-${storageMode}-`));
    const startMs = Date.parse('2026-11-28T01:00:00.000Z');
    let nowMs = startMs;
    const clock = () => new Date(nowMs);
    const srv = await startServer({ dataDir: tempDir, storageMode, clock });
    let pubSrv = null;

    try {
      // 1. Index `/showcase` (`Vary: Host`), `/api/showcase-og.png`, and cross-site `Sec-Fetch-Dest: image` (`BLOCKER-2`)
      const idxHtmlRes = await fetch(`${srv.baseUrl}/showcase`);
      assert.equal(idxHtmlRes.status, 200);
      assert.equal(idxHtmlRes.headers.get('vary'), 'Host');
      const idxHtml = await idxHtmlRes.text();
      assert.equal(idxHtml.includes('/api/showcase-og.png'), true);

      const crossSiteBannerImg = await rawHttpGet(srv.baseUrl, '/api/showcase-og.png', {
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-dest': 'image'
      });
      assert.equal(crossSiteBannerImg.status, 200, 'Cross-site <img> load of /api/showcase-og.png must succeed');
      const idxPngBuf = crossSiteBannerImg.buffer;
      assert.deepEqual(parsePngDimensions(idxPngBuf), { width: 1200, height: 630, byteLength: idxPngBuf.length });

      // Negative `stays-quiet` check (`UT-08`): cross-site `fetch('/api/showcase')` JSON MUST remain blocked (`403 csrf_cross_site_blocked`)!
      const crossSiteShowcaseJson = await rawHttpGet(srv.baseUrl, '/api/showcase', {
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty'
      });
      assert.equal(crossSiteShowcaseJson.status, 403);

      // 2. Create, verify, draft, guardian-pass, and approve a monetized candidate with licensed raster image (`#001`)
      const added = await postCommand(srv.baseUrl, {
        requestId: `add-monetized-${storageMode}`,
        command: 'add_manual_candidate',
        payload: {
          name: '무아스 접이식 물막이 프로 50cm',
          whyNow: '설거지 물튐 해결 수요',
          readerValue: '타공 없는 싱크대 물막이'
        }
      });
      const candId = added.json.candidateId;
      let rev = added.json.today.candidates.find((c) => c.id === candId).revision;

      const verified = await postCommand(srv.baseUrl, {
        requestId: `ver-monetized-${storageMode}`,
        command: 'request_verification',
        candidateId: candId,
        expectedRevision: rev,
        payload: {
          brand: '무아스',
          model: 'MWG-50P',
          variant: '웜그레이 50cm',
          sourceRef: 'https://mooas.com/products/mwg-50p',
          sourceOrigin: '무아스 공식몰',
          corroborationRef: 'https://search.shopping.naver.com/catalog/998877',
          corroborationOrigin: '네이버 쇼핑 카탈로그',
          mediaRights: 'explicitly_licensed',
          publishableMediaUrl: 'https://images.mooas.example/mwg-50p-official.jpg',
          personalUse: 'not_confirmed',
          verifiedPros: '타공 없이 상판 밀착 고정\n접이식 경첩으로 수납 용이',
          verifiedLimitation: '상판 앞턱 3.5cm 미만 싱크대 설치 불가',
          affiliate: true,
          affiliateNetwork: 'naver_shopping_connect',
          affiliateMappingState: 'exact',
          seller: '무아스 공식 브랜드스토어',
          destinationUrl: 'https://brand.naver.com/mooas/products/500?nt_source=shoppingconnect',
          disclosure: '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.'
        }
      });
      rev = verified.json.today.candidates.find((c) => c.id === candId).revision;

      // Pre-approval `HEAD` & `GET` 404 parity (`MINOR-2`)
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/og.png`, { method: 'HEAD' })).status, 404);
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/card.svg`, { method: 'HEAD' })).status, 404);

      const strat = await postCommand(srv.baseUrl, {
        requestId: `strat-${storageMode}`,
        command: 'request_strategies',
        candidateId: candId,
        expectedRevision: rev
      });
      rev = strat.json.today.candidates.find((c) => c.id === candId).revision;

      const drafts = await postCommand(srv.baseUrl, {
        requestId: `drafts-${storageMode}`,
        command: 'request_drafts',
        candidateId: candId,
        expectedRevision: rev,
        payload: { tone: 'polite' }
      });
      rev = drafts.json.today.candidates.find((c) => c.id === candId).revision;

      const guard = await postCommand(srv.baseUrl, {
        requestId: `guard-${storageMode}`,
        command: 'run_guardian',
        candidateId: candId,
        expectedRevision: rev
      });
      const guardCand = guard.json.today.candidates.find((c) => c.id === candId);
      rev = guardCand.revision;

      const approved = await postCommand(srv.baseUrl, {
        requestId: `approve-${storageMode}`,
        command: 'review_decision',
        candidateId: candId,
        expectedRevision: rev,
        payload: { decision: 'approved', draftId: guardCand.selectedDraftId }
      });
      const appCand = approved.json.today.candidates.find((c) => c.id === candId);
      assert.equal(appCand.showcaseProjected, true);
      rev = appCand.revision;

      // 3. Approved `/showcase/001` & trailing-slash `/showcase/001/` (`MAJOR-2`) + cross-site image/navigate (`BLOCKER-2`) + `HEAD` parity (`MINOR-2`)
      pubSrv = await startServer({
        dataDir: tempDir,
        storageMode,
        surfaceMode: SURFACE_MODES.PUBLIC_SHOWCASE,
        clock
      });

      for (const targetBase of [srv.baseUrl, pubSrv.baseUrl]) {
        for (const routeSuffix of ['/showcase/001', '/showcase/001/']) {
          const detailRes = await fetch(`${targetBase}${routeSuffix}`);
          assert.equal(detailRes.status, 200);
          const detailHtml = await detailRes.text();
          assert.equal(detailHtml.includes('content="index, follow"'), true);
          assert.equal(
            detailHtml.includes('property="og:description" content="[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다. #001'),
            true
          );
          assert.equal(
            detailHtml.includes('property="og:image" content="https://images.mooas.example/mwg-50p-official.jpg"'),
            true
          );
          const headHtmlRes = await fetch(`${targetBase}${routeSuffix}`, { method: 'HEAD' });
          assert.equal(headHtmlRes.status, 200);
          assert.equal(Number(headHtmlRes.headers.get('content-length')), Buffer.byteLength(detailHtml, 'utf8'));
          assert.equal((await headHtmlRes.text()).length, 0);
        }

        // Cross-site `<img src>` on `/og.png` and cross-site top-level `navigate` on `/card.svg` (via raw HTTP so undici does not overwrite sec-fetch-mode)
        const pngRes = await rawHttpGet(targetBase, '/api/showcase/001/og.png', {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-dest': 'image'
        });
        assert.equal(pngRes.status, 200);
        const pngBuf = pngRes.buffer;
        assert.deepEqual(parsePngDimensions(pngBuf), { width: 1200, height: 630, byteLength: pngBuf.length });

        const pngHead = await fetch(`${targetBase}/api/showcase/001/og.png`, { method: 'HEAD' });
        assert.equal(pngHead.status, 200);
        assert.equal(Number(pngHead.headers.get('content-length')), pngBuf.length);

        const svgRes = await rawHttpGet(targetBase, '/api/showcase/001/card.svg', {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-dest': 'document'
        });
        assert.equal(svgRes.status, 200);
        const svgText = svgRes.text;
        assert.equal(svgText.includes('MWG-50P'), true);

        // Cross-site `cors` XHR/fetch on `/card.svg` stays blocked (`403`)
        const svgCorsBlocked = await rawHttpGet(targetBase, '/api/showcase/001/card.svg', {
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty'
        });
        assert.equal(svgCorsBlocked.status, 403);

        const svgHead = await fetch(`${targetBase}/api/showcase/001/card.svg`, { method: 'HEAD' });
        assert.equal(svgHead.status, 200);
        assert.equal(Number(svgHead.headers.get('content-length')), Buffer.byteLength(svgText, 'utf8'));
      }

      // 4. Exact millisecond TTL boundary (`remainingMs === 0`, `MINOR-1`): `verifiedMs + 7d` withdraws immediately
      nowMs = startMs + 7 * 24 * 60 * 60 * 1000;
      for (const targetBase of [srv.baseUrl, pubSrv.baseUrl]) {
        const exactTtlHtml = await (await fetch(`${targetBase}/showcase/001`)).text();
        assert.equal(exactTtlHtml.includes('noindex, nofollow'), true);
        assert.equal(exactTtlHtml.includes('MWG-50P'), false);
        assert.equal((await fetch(`${targetBase}/api/showcase/001/og.png`)).status, 404);
        assert.equal((await fetch(`${targetBase}/api/showcase/001/card.svg`)).status, 404);
      }

      // Rewind clock within valid TTL (`+1h`), then mutate draft (`edit_draft` -> `stale`, `MINOR-2`) and confirm immediate withdrawal
      nowMs = startMs + 60 * 60 * 1000;
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/og.png`)).status, 200);
      const edited = await postCommand(srv.baseUrl, {
        requestId: `edit-stale-${storageMode}`,
        command: 'edit_draft',
        candidateId: candId,
        expectedRevision: rev,
        payload: { draftId: appCand.selectedDraftId, text: `${appCand.drafts[0].text} 추가확인` }
      });
      assert.equal(edited.status, 200);
      const staleHtml = await (await fetch(`${srv.baseUrl}/showcase/001`)).text();
      assert.equal(staleHtml.includes('noindex, nofollow'), true);
      assert.equal(staleHtml.includes('MWG-50P'), false);
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/og.png`)).status, 404);
      assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/card.svg`)).status, 404);

      // 5. Global kill switch -> `503` on GET & HEAD visual API endpoints
      const prevKill = process.env.THREADSCOUT_GLOBAL_KILL_SWITCH;
      process.env.THREADSCOUT_GLOBAL_KILL_SWITCH = '1';
      try {
        assert.equal((await fetch(`${srv.baseUrl}/api/showcase-og.png`, { method: 'HEAD' })).status, 503);
        assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/og.png`, { method: 'HEAD' })).status, 503);
        assert.equal((await fetch(`${srv.baseUrl}/api/showcase/001/card.svg`, { method: 'HEAD' })).status, 503);
      } finally {
        if (prevKill === undefined) delete process.env.THREADSCOUT_GLOBAL_KILL_SWITCH;
        else process.env.THREADSCOUT_GLOBAL_KILL_SWITCH = prevKill;
      }
    } finally {
      if (pubSrv) await pubSrv.close();
      await srv.close();
      await rm(tempDir, { recursive: true, force: true });
    }
  }
});
