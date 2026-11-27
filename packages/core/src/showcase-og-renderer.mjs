// Deterministic Open Graph metadata injector, zero-dependency `1200x630` `image/png` encoder (`node:zlib`),
// and `1080x1350` `image/svg+xml` inspection card renderer for Public Verified Showcase (`/showcase`).
// Strictly consumes closed 9-field `PublicShowcaseCard` objects — zero raw excerpts, PII, or internal scores (`PLATFORM_DECISION.md`, `AT-45`, `AT-46`).

import { deflateSync } from 'node:zlib';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const SLIDE_CARD_WIDTH = 1080;
export const SLIDE_CARD_HEIGHT = 1350;

const NON_RASTER_PATH_EXTENSIONS = /\.(?:svg|svgz|mp4|webm|mov|m4v|avi|mkv|mp3|wav|ogg|pdf)$/i;
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

export function escapeXml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function truncateCodePoints(text = '', max = 240) {
  const chars = [...String(text ?? '')];
  if (chars.length <= max) return chars.join('');
  return `${chars.slice(0, Math.max(1, max - 1)).join('').trim()}…`;
}

function isCleanHttpsUrl(rawUrl) {
  const trimmed = String(rawUrl ?? '').trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.username === '' && parsed.password === '' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function isSafeHttpsRasterAssetUrl(rawUrl) {
  const trimmed = String(rawUrl ?? '').trim();
  if (!isCleanHttpsUrl(trimmed)) return false;
  const parsed = new URL(trimmed);
  return !NON_RASTER_PATH_EXTENSIONS.test(parsed.pathname);
}

/**
 * Fail-closed validator for closed 9-field `PublicShowcaseCard` payloads (`PLATFORM_DECISION.md`, `AT-17`, `AT-45`, `AT-46`).
 */
export function validateClosedPublicShowcaseCard(card) {
  if (!card || typeof card !== 'object') {
    return { ok: false, reason: 'card_missing_or_not_object' };
  }
  const cardNumber = String(card.cardNumber ?? '').trim();
  if (!/^#\d{3,}$/.test(cardNumber)) {
    return { ok: false, reason: 'invalid_card_number' };
  }
  const canonicalProductName = String(card.canonicalProductName ?? '').trim();
  if (!canonicalProductName) {
    return { ok: false, reason: 'missing_canonical_product_name' };
  }
  if (card.matchBadge !== 'exact' && card.matchBadge !== 'alternative') {
    return { ok: false, reason: 'invalid_match_badge' };
  }
  const verifiedPros = Array.isArray(card.verifiedPros)
    ? card.verifiedPros.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
  if (verifiedPros.length < 1 || verifiedPros.length > 3) {
    return { ok: false, reason: 'invalid_verified_pros' };
  }
  const verifiedLimitation = String(card.verifiedLimitation ?? '').trim();
  if (!verifiedLimitation) {
    return { ok: false, reason: 'missing_verified_limitation' };
  }
  const verifiedAt = String(card.verifiedAt ?? '').trim();
  if (!ISO_DATE_PREFIX.test(verifiedAt) || !Number.isFinite(Date.parse(verifiedAt))) {
    return { ok: false, reason: 'invalid_verified_at' };
  }

  const rawDest = card.verifiedDestinationUrl == null ? '' : String(card.verifiedDestinationUrl).trim();
  const rawDisc = card.disclosureText == null ? '' : String(card.disclosureText).trim();
  const hasDest = rawDest.length > 0;
  const hasDisc = rawDisc.length > 0;
  if (hasDest !== hasDisc) {
    return { ok: false, reason: 'asymmetric_monetization_disclosure' };
  }
  if (hasDest && (!isCleanHttpsUrl(rawDest) || [...rawDisc].length > 500)) {
    return { ok: false, reason: 'invalid_monetization_fields' };
  }

  const rawMedia = card.publishableMediaUrl == null ? '' : String(card.publishableMediaUrl).trim();
  if (rawMedia && !isCleanHttpsUrl(rawMedia)) {
    return { ok: false, reason: 'invalid_publishable_media_url' };
  }

  return {
    ok: true,
    normalized: Object.freeze({
      cardNumber,
      canonicalProductName,
      matchBadge: card.matchBadge,
      verifiedPros: Object.freeze(verifiedPros),
      verifiedLimitation,
      verifiedDestinationUrl: hasDest ? rawDest : null,
      disclosureText: hasDisc ? rawDisc : null,
      publishableMediaUrl: rawMedia || null,
      verifiedAt,
      monetized: hasDest && hasDisc
    })
  };
}

/**
 * Build Open Graph & document head metadata for `/showcase` index, active `/showcase/:cardNumber`,
 * or withdrawn/expired/missing/invalid cards (zero product-claim leakage + `noindex` per `PLATFORM_DECISION.md`).
 */
export function buildShowcaseOpenGraphModel({
  card = null,
  isDetailRoute = false,
  origin = 'http://127.0.0.1:4173',
  killSwitchActive = false
} = {}) {
  const safeOrigin = String(origin || 'http://127.0.0.1:4173').replace(/\/+$/, '');

  if (killSwitchActive) {
    return Object.freeze({
      pageTitle: '점검 중인 쇼케이스 · ThreadScout',
      description: '현재 공개 쇼케이스 점검 중입니다.',
      ogType: 'website',
      ogTitle: '점검 중인 쇼케이스 · ThreadScout',
      ogDescription: '현재 공개 쇼케이스 점검 중입니다.',
      ogUrl: `${safeOrigin}/showcase`,
      ogImage: null,
      ogImageAlt: null,
      ogImageIsGeneratedFallback: false,
      robots: 'noindex, nofollow'
    });
  }

  if (!isDetailRoute) {
    return Object.freeze({
      pageTitle: 'ThreadScout · 검증 실용템 쇼케이스',
      description: '광고 미끼 없이 실제 모델·스펙과 사기 전 확인할 한계까지 교차 검증한 실용템 아카이브',
      ogType: 'website',
      ogTitle: 'ThreadScout · 검증 실용템 쇼케이스',
      ogDescription: '광고 미끼 없이 실제 모델·스펙과 사기 전 확인할 한계까지 교차 검증한 실용템 아카이브',
      ogUrl: `${safeOrigin}/showcase`,
      ogImage: `${safeOrigin}/api/showcase-og.png`,
      ogImageAlt: 'ThreadScout 검증 실용템 쇼케이스 요약 배너',
      ogImageIsGeneratedFallback: true,
      robots: 'index, follow'
    });
  }

  const validation = validateClosedPublicShowcaseCard(card);
  if (!validation.ok) {
    return Object.freeze({
      pageTitle: '만료되었거나 철회된 쇼케이스 카드 · ThreadScout',
      description: '근거 보존 기한 경과 또는 재검토로 인해 비공개 처리된 쇼케이스 카드입니다.',
      ogType: 'website',
      ogTitle: '만료되었거나 철회된 쇼케이스 카드 · ThreadScout',
      ogDescription: '근거 보존 기한 경과 또는 재검토로 인해 비공개 처리된 쇼케이스 카드입니다.',
      ogUrl: `${safeOrigin}/showcase`,
      ogImage: null,
      ogImageAlt: null,
      ogImageIsGeneratedFallback: false,
      robots: 'noindex, nofollow'
    });
  }

  const c = validation.normalized;
  const numSlug = encodeURIComponent(c.cardNumber.replace(/^#/, ''));
  const badgeKo = c.matchBadge === 'exact' ? '동일 모델 확인' : '검증 대체품';
  const disclosurePrefix = c.monetized ? `${c.disclosureText} ` : '';
  const summaryTail = `${c.cardNumber} ${c.canonicalProductName} (${badgeKo}) — 사기 전 한계: ${c.verifiedLimitation}`;

  // Preserve verbatim statutory disclosure at Unicode code-point offset 0 on monetized cards (`AT-45`, `AFFILIATE_SPEC.md` §5)
  const fullDesc = `${disclosurePrefix}${summaryTail}`;
  const boundedDesc = c.monetized
    ? `${disclosurePrefix}${truncateCodePoints(summaryTail, Math.max(40, 280 - [...disclosurePrefix].length))}`
    : truncateCodePoints(fullDesc, 260);

  const ogTitle = c.monetized
    ? `[광고] ${c.cardNumber} ${c.canonicalProductName} · ${badgeKo}`
    : `${c.cardNumber} ${c.canonicalProductName} · ${badgeKo}`;

  const useRasterMedia = Boolean(c.publishableMediaUrl && isSafeHttpsRasterAssetUrl(c.publishableMediaUrl));
  const ogImage = useRasterMedia
    ? c.publishableMediaUrl
    : `${safeOrigin}/api/showcase/${numSlug}/og.png`;

  return Object.freeze({
    pageTitle: ogTitle,
    description: boundedDesc,
    ogType: 'article',
    ogTitle,
    ogDescription: boundedDesc,
    ogUrl: `${safeOrigin}/showcase/${numSlug}`,
    ogImage,
    ogImageAlt: `${c.cardNumber} ${c.canonicalProductName} 검증 규격 요약`,
    ogImageIsGeneratedFallback: !useRasterMedia,
    robots: 'index, follow'
  });
}

/**
 * Inject Open Graph & Twitter card meta tags into `showcase.html` using replacer callbacks
 * so `$&`, `` $` ``, `$'`, and `$$` inside product/disclosure strings never trigger ECMA-262 `GetSubstitution`.
 */
export function injectShowcaseOpenGraphHtml(baseHtml = '', model) {
  const m = model ?? buildShowcaseOpenGraphModel();
  const metaLines = [
    `<meta name="robots" content="${escapeXml(m.robots)}" />`,
    `<meta property="og:site_name" content="ThreadScout Verified Showcase" />`,
    `<meta property="og:locale" content="ko_KR" />`,
    `<meta property="og:type" content="${escapeXml(m.ogType)}" />`,
    `<meta property="og:title" content="${escapeXml(m.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeXml(m.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeXml(m.ogUrl)}" />`,
    `<meta name="twitter:card" content="${m.ogImage ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeXml(m.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeXml(m.ogDescription)}" />`
  ];
  if (m.ogImage) {
    metaLines.push(`<meta property="og:image" content="${escapeXml(m.ogImage)}" />`);
    if (m.ogImageIsGeneratedFallback === true) {
      metaLines.push(`<meta property="og:image:type" content="image/png" />`);
      metaLines.push(`<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`);
      metaLines.push(`<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`);
    }
    if (m.ogImageAlt) {
      metaLines.push(`<meta property="og:image:alt" content="${escapeXml(m.ogImageAlt)}" />`);
    }
  }

  const descriptionReplacement = `<meta name="description" content="${escapeXml(m.description)}" />`;
  const titleReplacement = `<title>${escapeXml(m.pageTitle)}</title>\n    ${metaLines.join('\n    ')}`;

  let html = String(baseHtml ?? '');
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => descriptionReplacement);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => titleReplacement);
  return html;
}

// --- Zero-dependency `1200x630` `image/png` encoder (indexed-color palette PNG + 5x7 pixel glyphs for `#NNN` & `AD` badge) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(typeAscii, dataBuf) {
  const typeBuf = Buffer.from(typeAscii, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, crcInput, crcBuf]);
}

const PIXEL_GLYPHS_5X7 = {
  '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

const PNG_PALETTE_RGB = [
  [0xf7, 0xf8, 0xf6], // 0: Mineral Paper
  [0xff, 0xff, 0xff], // 1: White Card
  [0x14, 0x18, 0x16], // 2: Carbon Ink
  [0x18, 0x4e, 0x3b], // 3: Pine Spec
  [0xed, 0xf4, 0xf0], // 4: Pine Soft
  [0xfc, 0xee, 0xeb], // 5: Crimson Stop Soft
  [0xa1, 0x2a, 0x1e], // 6: Crimson Stop Bar
  [0xff, 0xf3, 0xd1], // 7: Statutory Amber Fill
  [0x3b, 0x26, 0x00], // 8: Statutory Amber Ink
  [0xd4, 0xd9, 0xd4]  // 9: Grid Rule
];

/**
 * Generate a deterministic, valid `1200x630` indexed-color `image/png` buffer for social crawlers (`og:image`).
 */
export function renderShowcaseOgPngBuffer(card = null) {
  let c = null;
  if (card !== null) {
    const check = validateClosedPublicShowcaseCard(card);
    if (!check.ok) {
      throw new Error(`Invalid PublicShowcaseCard for OG PNG: ${check.reason}`);
    }
    c = check.normalized;
  }

  const width = OG_IMAGE_WIDTH;
  const height = OG_IMAGE_HEIGHT;
  const stride = width + 1; // +1 filter byte (`0`) per scanline
  const raw = Buffer.alloc(stride * height, 0);

  const fillRect = (x0, y0, w, h, colorIdx) => {
    const startX = Math.max(0, Math.floor(x0));
    const endX = Math.min(width, Math.floor(x0 + w));
    const startY = Math.max(0, Math.floor(y0));
    const endY = Math.min(height, Math.floor(y0 + h));
    for (let y = startY; y < endY; y += 1) {
      raw.fill(colorIdx, y * stride + 1 + startX, y * stride + 1 + endX);
    }
  };

  const drawPixelText = (text, startX, startY, scale, colorIdx) => {
    let cursorX = startX;
    for (const ch of String(text).toUpperCase()) {
      const glyph = PIXEL_GLYPHS_5X7[ch] ?? PIXEL_GLYPHS_5X7[' '];
      for (let gy = 0; gy < 7; gy += 1) {
        const row = glyph[gy];
        for (let gx = 0; gx < 5; gx += 1) {
          if (row[gx] === '1') {
            fillRect(cursorX + gx * scale, startY + gy * scale, scale, scale, colorIdx);
          }
        }
      }
      cursorX += 6 * scale;
    }
  };

  for (let y = 0; y < height; y += 1) raw[y * stride] = 0;

  fillRect(48, 36, width - 96, height - 72, 9);
  fillRect(50, 38, width - 100, height - 76, 1);

  const monetized = Boolean(c?.monetized);
  let contentTop = 74;
  if (monetized) {
    fillRect(82, 64, width - 164, 54, 7);
    fillRect(82, 64, 10, 54, 8);
    drawPixelText('AD', 110, 77, 4, 8);
    fillRect(172, 82, 460, 8, 8);
    fillRect(172, 96, 320, 6, 8);
    contentTop = 140;
  }

  fillRect(82, contentTop, 116, 76, 2);
  drawPixelText('TS', 105, contentTop + 20, 5, 1);

  const label = c ? c.cardNumber.slice(0, 6) : 'TS V';
  drawPixelText(label, 224, contentTop + 12, 8, 2);

  fillRect(width - 280, contentTop + 10, 198, 56, 4);
  fillRect(width - 280, contentTop + 10, 10, 56, 3);
  drawPixelText('V', width - 246, contentTop + 24, 4, 3);
  fillRect(width - 210, contentTop + 32, 104, 12, 3);

  const blockY = contentTop + 108;
  const blockH = height - blockY - 82;
  const colW = Math.floor((width - 188) / 2);

  fillRect(82, blockY, colW, blockH, 5);
  fillRect(82, blockY, 12, blockH, 6);
  fillRect(118, blockY + 34, Math.floor(colW * 0.52), 18, 6);
  fillRect(118, blockY + 78, Math.floor(colW * 0.78), 14, 2);
  fillRect(118, blockY + 108, Math.floor(colW * 0.66), 14, 2);

  const rightX = 82 + colW + 24;
  fillRect(rightX, blockY, colW, blockH, 4);
  fillRect(rightX, blockY, 12, blockH, 3);
  fillRect(rightX + 36, blockY + 34, Math.floor(colW * 0.48), 18, 3);
  const prosCount = Math.max(1, Math.min(3, c?.verifiedPros?.length ?? 2));
  for (let i = 0; i < prosCount; i += 1) {
    fillRect(rightX + 36, blockY + 78 + i * 34, Math.floor(colW * (0.76 - i * 0.08)), 14, 2);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const plte = Buffer.alloc(PNG_PALETTE_RGB.length * 3);
  PNG_PALETTE_RGB.forEach(([r, g, b], idx) => {
    plte[idx * 3] = r;
    plte[idx * 3 + 1] = g;
    plte[idx * 3 + 2] = b;
  });

  const compressed = deflateSync(raw, { level: 6 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('PLTE', plte),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

export function wrapSvgLines(text = '', maxCharsPerLine = 28, maxLines = 3, { allowEllipsis = true } = {}) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const tokens = normalized.split(' ');
  const rawLines = [];
  let cur = '';

  for (const token of tokens) {
    const tokenChars = [...token];
    if (tokenChars.length > maxCharsPerLine) {
      if (cur) {
        rawLines.push(cur);
        cur = '';
      }
      for (let i = 0; i < tokenChars.length; i += maxCharsPerLine) {
        const chunkChars = tokenChars.slice(i, i + maxCharsPerLine);
        const slice = chunkChars.join('');
        // Compare Unicode code-point indices directly (`tokenChars.length`), NEVER UTF-16 `.length`!
        if (i + maxCharsPerLine < tokenChars.length) {
          rawLines.push(slice);
        } else {
          cur = slice;
        }
      }
      continue;
    }

    const candidate = cur ? `${cur} ${token}` : token;
    if ([...candidate].length <= maxCharsPerLine) {
      cur = candidate;
    } else {
      if (cur) rawLines.push(cur);
      cur = token;
    }
  }
  if (cur) rawLines.push(cur);

  if (!allowEllipsis || rawLines.length <= maxLines) {
    return rawLines;
  }

  const kept = rawLines.slice(0, maxLines);
  const lastChars = [...kept[maxLines - 1]];
  kept[maxLines - 1] = lastChars.length >= maxCharsPerLine
    ? `${lastChars.slice(0, Math.max(1, maxCharsPerLine - 1)).join('').trim()}…`
    : `${lastChars.join('').trim()}…`;
  return kept;
}

const SVG_DISCLOSURE_TIERS = [
  { fontSize: 22, step: 32, charsPerLine: 40 },
  { fontSize: 18, step: 25, charsPerLine: 50 },
  { fontSize: 15, step: 20, charsPerLine: 60 },
  { fontSize: 13, step: 17, charsPerLine: 72 }
];

/**
 * Deterministic `1080x1350` (`4:5`) SVG inspection card for `/api/showcase/:cardNumber/card.svg`.
 */
export function renderShowcaseCardSvg(card) {
  const check = validateClosedPublicShowcaseCard(card);
  if (!check.ok) {
    throw new Error(`Invalid PublicShowcaseCard for SVG export: ${check.reason}`);
  }
  const c = check.normalized;
  const badgeKo = c.matchBadge === 'exact' ? '동일 모델 확인 ✔' : '검증 대체품';
  const badgeFill = c.matchBadge === 'exact' ? '#EDF4F0' : '#E7EEF8';
  const badgeInk = c.matchBadge === 'exact' ? '#184E3B' : '#234B78';
  const dateStr = c.verifiedAt.slice(0, 10);

  let y = 52;
  const blocks = [];
  let discBoxH = 0;

  if (c.monetized) {
    let chosenTier = SVG_DISCLOSURE_TIERS[SVG_DISCLOSURE_TIERS.length - 1];
    let discLines = wrapSvgLines(c.disclosureText, chosenTier.charsPerLine, 30, { allowEllipsis: false });
    for (const tier of SVG_DISCLOSURE_TIERS) {
      const candidateLines = wrapSvgLines(c.disclosureText, tier.charsPerLine, 30, { allowEllipsis: false });
      const candidateH = 28 + candidateLines.length * tier.step;
      if (candidateH <= 260) {
        chosenTier = tier;
        discLines = candidateLines;
        break;
      }
    }
    discBoxH = 28 + discLines.length * chosenTier.step;
    blocks.push(`
      <rect x="64" y="${y}" width="952" height="${discBoxH}" rx="16" fill="#FFF3D1" stroke="#E3C270" stroke-width="2" />
      ${discLines.map((line, i) => `<text x="92" y="${y + 18 + chosenTier.fontSize + i * chosenTier.step}" fill="#3B2600" font-size="${chosenTier.fontSize}" font-weight="700">${escapeXml(line)}</text>`).join('')}
    `);
    y += discBoxH + 20;
  }

  const compactBody = discBoxH > 132;
  const titleLines = wrapSvgLines(c.canonicalProductName, 22, 2);
  const limitLines = wrapSvgLines(c.verifiedLimitation, 31, compactBody ? 2 : 3);
  const proRows = c.verifiedPros.flatMap((pro, idx) => wrapSvgLines(`${idx + 1}. ${pro}`, 32, compactBody ? 1 : 2));

  const footerLineY = 1224;
  const baseLimitH = 84 + limitLines.length * 38;
  const baseProsH = 84 + proRows.length * 38;
  const stripBaseH = 98;
  const baseConsumed =
    82 // stamp + gap
    + (titleLines.length * 50 + 20)
    + baseLimitH + 20
    + baseProsH + 20
    + stripBaseH + 20;
  const rawSlack = Math.max(0, (footerLineY - y) - baseConsumed);
  const sectionExtra = Math.floor(rawSlack / 5);

  // Non-commercial cards omit `#NNN` as well as `쇼케이스` on exported Slide-2 cards (`BS-60`, `UT-05`)
  const stampText = c.monetized ? `${c.cardNumber} 규격 판별표` : '구매 전 규격 판별표';
  const stampW = c.monetized ? 252 : 238;

  blocks.push(`
    <rect x="64" y="${y}" width="${stampW}" height="52" rx="26" fill="#141816" />
    <text x="${64 + stampW / 2}" y="${y + 34}" text-anchor="middle" fill="#FFFFFF" font-size="22" font-weight="800">${escapeXml(stampText)}</text>
    <rect x="776" y="${y}" width="240" height="52" rx="26" fill="${badgeFill}" />
    <text x="896" y="${y + 34}" text-anchor="middle" fill="${badgeInk}" font-size="22" font-weight="800">${escapeXml(badgeKo)}</text>
  `);
  y += 82 + sectionExtra;

  blocks.push(
    titleLines.map((line, i) => `<text x="64" y="${y + i * 50}" fill="#141816" font-size="42" font-weight="800">${escapeXml(line)}</text>`).join('')
  );
  y += titleLines.length * 50 + 20 + sectionExtra;

  blocks.push(`
    <clipPath id="limit-clip"><rect x="64" y="${y}" width="952" height="${baseLimitH}" rx="20" /></clipPath>
    <rect x="64" y="${y}" width="952" height="${baseLimitH}" rx="20" fill="#FCEEEB" stroke="#E2B4AC" stroke-width="2" />
    <rect x="64" y="${y}" width="12" height="${baseLimitH}" fill="#A12A1E" clip-path="url(#limit-clip)" />
    <text x="104" y="${y + 42}" fill="#7A1F16" font-size="24" font-weight="800">✕ 이 조건이면 사지 마세요 · 사기 전 한계</text>
    ${limitLines.map((line, i) => `<text x="104" y="${y + 88 + i * 38}" fill="#141816" font-size="27" font-weight="600">${escapeXml(line)}</text>`).join('')}
  `);
  y += baseLimitH + 20 + sectionExtra;

  blocks.push(`
    <clipPath id="pros-clip"><rect x="64" y="${y}" width="952" height="${baseProsH}" rx="20" /></clipPath>
    <rect x="64" y="${y}" width="952" height="${baseProsH}" rx="20" fill="#EDF4F0" stroke="#BDD6C9" stroke-width="2" />
    <rect x="64" y="${y}" width="12" height="${baseProsH}" fill="#184E3B" clip-path="url(#pros-clip)" />
    <text x="104" y="${y + 42}" fill="#184E3B" font-size="24" font-weight="800">✔ 교차 확인된 핵심 강점</text>
    ${proRows.map((line, i) => `<text x="104" y="${y + 88 + i * 38}" fill="#141816" font-size="26" font-weight="600">${escapeXml(line)}</text>`).join('')}
  `);
  y += baseProsH + 20 + sectionExtra;

  // `stripY` is strictly `>= y` (guaranteed zero overlap with `prosBox`)
  const stripY = y;
  const checkTiles = [
    ['매칭 구분', c.matchBadge === 'exact' ? '동일 모델 확인' : '검증 대체품 안내'],
    ['구매 전 필수', '설치 공간·치수 실측'],
    ['상세 안내', c.monetized ? `쇼케이스 ${c.cardNumber}` : '본문·표기 규격 대조']
  ];
  const tileW = 306;
  const tileGap = 17;
  blocks.push(
    checkTiles.map(([kicker, val], idx) => {
      const tx = 64 + idx * (tileW + tileGap);
      return `
        <rect x="${tx}" y="${stripY}" width="${tileW}" height="${stripBaseH}" rx="16" fill="#F7F8F6" stroke="#D4D9D4" stroke-width="1.5" />
        <text x="${tx + 20}" y="${stripY + 38}" fill="#5A625C" font-size="19" font-weight="700">${escapeXml(kicker)}</text>
        <text x="${tx + 20}" y="${stripY + 74}" fill="#141816" font-size="23" font-weight="800">${escapeXml(val)}</text>
      `;
    }).join('')
  );

  const footerRight = c.monetized
    ? `ThreadScout · 프로필 쇼케이스 ${c.cardNumber}`
    : 'ThreadScout · 실용템 규격 판별표';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_CARD_WIDTH}" height="${SLIDE_CARD_HEIGHT}" viewBox="0 0 ${SLIDE_CARD_WIDTH} ${SLIDE_CARD_HEIGHT}">
  <rect width="100%" height="100%" fill="#F7F8F6" />
  <rect x="32" y="28" width="1016" height="1294" rx="28" fill="#FFFFFF" stroke="#D4D9D4" stroke-width="2" />
  <g font-family="Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif">
    ${blocks.join('\n')}
    <line x1="64" y1="${footerLineY}" x2="1016" y2="${footerLineY}" stroke="#E2E6E2" stroke-width="2" />
    <text x="64" y="1272" fill="#5A625C" font-size="22" font-weight="600">검증 기준일 ${escapeXml(dateStr)}</text>
    <text x="1016" y="1272" text-anchor="end" fill="#141816" font-size="22" font-weight="700">${escapeXml(footerRight)}</text>
  </g>
</svg>`;
}
