// Shared client-side `1080x1350` (`4:5`) Threads Slide-2 Inspection Card PNG renderer.
// Grounded in Korean consumer inspection-tag typography & WCAG AAA contrast:
// - Mineral Paper `#F7F8F6` / White `#FFFFFF` / Carbon Ink `#141816` (`16.8:1`)
// - Statutory Amber `#FFF3D1` + `#3B2600` (`12.96:1`) pinned verbatim at top when monetized (`AT-45`)
// - Crimson Stop `#FCEEEB` + `#7A1F16` (`9.8:1`) for pre-purchase disqualification boundary
// - Pine Spec `#EDF4F0` + `#184E3B` (`9.4:1`) for corroborated strengths
// - Non-commercial cards omit `#NNN` and `/showcase` pointers to stay 100% solicitation-free (`BS-60`, `UT-05`).
// Strictly consumes closed 9-field `PublicShowcaseCard` payloads — zero unbound fallbacks or wall-clock fabrication (`BS-37`, `BS-61`).

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

const FONT_STACK = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}T/;
const CANVAS_DISCLOSURE_TIERS = [
  { fontPx: 22, step: 32 },
  { fontPx: 18, step: 25 },
  { fontPx: 15, step: 20 },
  { fontPx: 13, step: 17 }
];

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

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawClippedLeftAccentBar(ctx, x, y, boxW, boxH, radius, barWidth, fillColor) {
  if (typeof ctx.save === 'function' && typeof ctx.clip === 'function' && typeof ctx.restore === 'function') {
    ctx.save();
    roundedRectPath(ctx, x, y, boxW, boxH, radius);
    ctx.clip();
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, barWidth, boxH);
    ctx.restore();
  } else {
    roundedRectPath(ctx, x, y, barWidth, boxH, Math.min(6, radius));
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
}

export function measureWrappedLines(ctx, text, maxWidth, maxLines = 4, { allowEllipsis = true } = {}) {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const tokens = raw.split(' ');
  const lines = [];
  let current = '';

  const pushTrimmedEllipsis = (str) => {
    let acc = '';
    for (const ch of [...str]) {
      if (ctx.measureText(`${acc}${ch}…`).width > maxWidth) break;
      acc += ch;
    }
    return `${acc.trim()}…`;
  };

  for (let tIdx = 0; tIdx < tokens.length; tIdx += 1) {
    const token = tokens[tIdx];
    const candidate = current ? `${current} ${token}` : token;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      if (allowEllipsis && lines.length === maxLines - 1) {
        const rest = tokens.slice(tIdx).join(' ');
        lines.push(pushTrimmedEllipsis(`${current} ${rest}`));
        return lines;
      }
      lines.push(current);
      current = '';
    }
    if (ctx.measureText(token).width <= maxWidth) {
      current = token;
    } else {
      let chunk = '';
      for (const ch of [...token]) {
        if (ctx.measureText(`${chunk}${ch}`).width > maxWidth) {
          if (allowEllipsis && lines.length === maxLines - 1) {
            lines.push(pushTrimmedEllipsis(`${chunk}${ch}`));
            return lines;
          }
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      current = chunk;
    }
  }
  if (current && (!allowEllipsis || lines.length < maxLines)) {
    lines.push(current);
  }
  return lines;
}

async function waitForFontsBounded(timeoutMs = 700, doc = globalThis.document) {
  if (!doc?.fonts?.ready) return;
  await Promise.race([
    doc.fonts.ready.catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, timeoutMs))
  ]);
}

/**
 * Render a `1080x1350` inspection summary card onto an HTMLCanvasElement and return `{ canvas, dataUrl, fileName }`.
 * Fails closed when any closed 9-field `PublicShowcaseCard` invariant is violated (`AT-17`, `AT-45`, `AT-46`, `BS-37`, `BS-61`).
 */
export async function renderSlideCardCanvas(cardInput = {}, { documentRef = globalThis.document } = {}) {
  if (!cardInput || typeof cardInput !== 'object') {
    throw new Error('유효한 쇼케이스 카드 데이터가 필요합니다.');
  }

  const cardNumber = String(cardInput.cardNumber ?? '').trim();
  if (!/^#\d{3,}$/.test(cardNumber)) {
    throw new Error('유효한 쇼케이스 카드 번호(#NNN)가 필요합니다.');
  }
  const canonicalProductName = String(cardInput.canonicalProductName ?? '').trim();
  if (cardInput.matchBadge !== 'exact' && cardInput.matchBadge !== 'alternative') {
    throw new Error('검증된 매칭 구분(exact 또는 alternative)이 필요합니다.');
  }
  const matchBadge = cardInput.matchBadge;
  const verifiedPros = Array.isArray(cardInput.verifiedPros)
    ? cardInput.verifiedPros.map((p) => String(p ?? '').trim()).filter(Boolean)
    : [];
  const verifiedLimitation = String(cardInput.verifiedLimitation ?? '').trim();
  if (!canonicalProductName || verifiedPros.length < 1 || verifiedPros.length > 3 || !verifiedLimitation) {
    throw new Error('검증된 제품명·핵심 강점(1~3개)·사기 전 한계가 모두 바인딩된 쇼케이스 카드만 요약 이미지를 생성할 수 있습니다.');
  }

  const rawMedia = cardInput.publishableMediaUrl == null ? '' : String(cardInput.publishableMediaUrl).trim();
  if (rawMedia && !isCleanHttpsUrl(rawMedia)) {
    throw new Error('게시 허용 미디어 URL(publishableMediaUrl)은 유효한 https 주소여야 합니다.');
  }

  const rawVerifiedAt = String(cardInput.verifiedAt ?? '').trim();
  if (!ISO_DATE_PREFIX.test(rawVerifiedAt) || !Number.isFinite(Date.parse(rawVerifiedAt))) {
    throw new Error('바인딩된 검증 시각(verifiedAt)이 없는 카드는 요약 이미지를 생성할 수 없습니다.');
  }
  const verifiedDate = rawVerifiedAt.slice(0, 10);

  const rawDest = cardInput.verifiedDestinationUrl == null ? '' : String(cardInput.verifiedDestinationUrl).trim();
  const rawDisclosure = cardInput.disclosureText == null ? '' : String(cardInput.disclosureText).trim();
  const hasDestination = rawDest.length > 0;
  const hasDisclosure = rawDisclosure.length > 0;
  if (hasDestination !== hasDisclosure) {
    throw new Error('수익화 도착 URL과 법정 대가성 고지 원문은 반드시 함께 존재하거나 함께 비어 있어야 합니다.');
  }
  if (hasDestination && (!isCleanHttpsUrl(rawDest) || [...rawDisclosure].length > 500)) {
    throw new Error('유효한 https 도착 URL 및 500자 이내 법정 대가성 고지 원문이 필요합니다.');
  }

  const monetized = hasDestination && hasDisclosure;

  await waitForFontsBounded(700, documentRef);
  if (!documentRef?.createElement) {
    throw new Error('브라우저 캔버스 환경을 찾을 수 없습니다.');
  }

  const canvas = documentRef.createElement('canvas');
  canvas.width = SLIDE_WIDTH;
  canvas.height = SLIDE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D 캔버스 컨텍스트를 초기화할 수 없습니다.');
  }

  // 1. Mineral paper background + framed inspection sheet
  ctx.fillStyle = '#F7F8F6';
  ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);

  roundedRectPath(ctx, 32, 28, SLIDE_WIDTH - 64, SLIDE_HEIGHT - 56, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D4D9D4';
  ctx.stroke();

  const innerX = 72;
  const innerW = SLIDE_WIDTH - 144;
  let y = 56;
  let discH = 0;

  // 2. Top-pinned Verbatim Statutory Disclosure Banner when monetized (`AT-45`, `12.96:1` contrast, NEVER truncated)
  if (monetized) {
    let chosenTier = CANVAS_DISCLOSURE_TIERS[CANVAS_DISCLOSURE_TIERS.length - 1];
    ctx.font = `700 ${chosenTier.fontPx}px ${FONT_STACK}`;
    let discLines = measureWrappedLines(ctx, rawDisclosure, innerW - 56, 30, { allowEllipsis: false });
    for (const tier of CANVAS_DISCLOSURE_TIERS) {
      ctx.font = `700 ${tier.fontPx}px ${FONT_STACK}`;
      const candidateLines = measureWrappedLines(ctx, rawDisclosure, innerW - 56, 30, { allowEllipsis: false });
      const candidateH = 28 + candidateLines.length * tier.step;
      if (candidateH <= 260) {
        chosenTier = tier;
        discLines = candidateLines;
        break;
      }
    }
    discH = 28 + discLines.length * chosenTier.step;

    roundedRectPath(ctx, innerX, y, innerW, discH, 16);
    ctx.fillStyle = '#FFF3D1';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E3C270';
    ctx.stroke();

    ctx.font = `700 ${chosenTier.fontPx}px ${FONT_STACK}`;
    ctx.fillStyle = '#3B2600';
    ctx.textBaseline = 'top';
    discLines.forEach((line, idx) => {
      ctx.fillText(line, innerX + 28, y + 14 + idx * chosenTier.step);
    });
    y += discH + 20;
  }

  const compactBody = discH > 132;

  // Pre-measure Headline, Limitation, and Strengths so vertical slack distributes smoothly with ZERO overlap and ZERO dead-space chasm
  ctx.font = `800 42px ${FONT_STACK}`;
  const titleLines = measureWrappedLines(ctx, canonicalProductName, innerW, 2);

  ctx.font = `600 28px ${FONT_STACK}`;
  const limitLines = measureWrappedLines(ctx, verifiedLimitation, innerW - 84, compactBody ? 2 : 3);

  ctx.font = `600 27px ${FONT_STACK}`;
  const proRowBlocks = verifiedPros.map((pro, idx) =>
    measureWrappedLines(ctx, `${idx + 1}. ${pro}`, innerW - 84, compactBody ? 1 : 2)
  );
  const totalProLines = proRowBlocks.reduce((acc, rows) => acc + rows.length, 0);

  const footerLineY = SLIDE_HEIGHT - 110; // 1240
  const baseLimitH = 84 + limitLines.length * 40;
  const baseProsH = 84 + totalProLines * 39 + Math.max(0, proRowBlocks.length - 1) * 10;
  const baseStripH = 104;
  const baseConsumedAfterTop =
    72 // stamp row + base gap
    + (titleLines.length * 52 + 18)
    + 20 // divider + base gap
    + baseLimitH + 20
    + baseProsH + 20
    + baseStripH
    + 20; // gap above footer

  const rawSlack = Math.max(0, (footerLineY - y) - baseConsumedAfterTop);
  const boxExtraPad = Math.min(36, Math.floor(rawSlack * 0.18));
  const stripExtraH = Math.min(26, Math.floor(rawSlack * 0.1));
  const remainingSlack = Math.max(0, rawSlack - boxExtraPad * 2 - stripExtraH);
  const gapExtra = Math.floor(remainingSlack / 5);

  // 3. Inspection Stamp & Match Badge Row (`UT-05`: non-commercial PNG omits `#NNN` as well as `쇼케이스`)
  const stampLabel = monetized ? `${cardNumber} · 구매 전 규격 판별표` : '구매 전 규격 판별표';
  ctx.font = `800 22px ${FONT_STACK}`;
  const stampW = Math.min(440, Math.ceil(ctx.measureText(stampLabel).width) + 46);
  roundedRectPath(ctx, innerX, y, stampW, 52, 26);
  ctx.fillStyle = '#141816';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(stampLabel, innerX + 23, y + 26);

  const badgeText = matchBadge === 'exact' ? '동일 모델 확인 ✔' : '검증 대체품';
  const badgeW = Math.ceil(ctx.measureText(badgeText).width) + 46;
  const badgeX = innerX + innerW - badgeW;
  roundedRectPath(ctx, badgeX, y, badgeW, 52, 26);
  ctx.fillStyle = matchBadge === 'exact' ? '#EDF4F0' : '#E7EEF8';
  ctx.fill();
  ctx.fillStyle = matchBadge === 'exact' ? '#184E3B' : '#234B78';
  ctx.fillText(badgeText, badgeX + 23, y + 26);
  y += 72 + gapExtra;

  // 4. Canonical Product Headline
  ctx.font = `800 42px ${FONT_STACK}`;
  ctx.fillStyle = '#141816';
  ctx.textBaseline = 'top';
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, innerX, y + idx * 52);
  });
  y += titleLines.length * 52 + 18 + Math.floor(gapExtra * 0.5);

  // Architectural divider
  ctx.fillStyle = '#E3E7E3';
  ctx.fillRect(innerX, y, innerW, 2);
  y += 20 + Math.ceil(gapExtra * 0.5);

  // 5. Primary Focal Zone 1 — Crimson Disqualification / Stop Box
  const limitBoxH = baseLimitH + boxExtraPad;
  roundedRectPath(ctx, innerX, y, innerW, limitBoxH, 22);
  ctx.fillStyle = '#FCEEEB';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E2B4AC';
  ctx.stroke();

  drawClippedLeftAccentBar(ctx, innerX, y, innerW, limitBoxH, 22, 12, '#A12A1E');

  const innerTopPad = Math.floor(boxExtraPad / 2);
  ctx.font = `800 24px ${FONT_STACK}`;
  ctx.fillStyle = '#7A1F16';
  ctx.textBaseline = 'top';
  ctx.fillText('✕ 이 조건이면 사지 마세요 · 사기 전 한계', innerX + 38, y + 24 + innerTopPad);

  ctx.font = `600 28px ${FONT_STACK}`;
  ctx.fillStyle = '#141816';
  limitLines.forEach((line, idx) => {
    ctx.fillText(line, innerX + 38, y + 68 + innerTopPad + idx * 40);
  });
  y += limitBoxH + 20 + gapExtra;

  // 6. Primary Focal Zone 2 — Pine Verified Strengths Box
  const prosBoxH = baseProsH + boxExtraPad;
  roundedRectPath(ctx, innerX, y, innerW, prosBoxH, 22);
  ctx.fillStyle = '#EDF4F0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#BDD6C9';
  ctx.stroke();

  drawClippedLeftAccentBar(ctx, innerX, y, innerW, prosBoxH, 22, 12, '#184E3B');

  ctx.font = `800 24px ${FONT_STACK}`;
  ctx.fillStyle = '#184E3B';
  ctx.textBaseline = 'top';
  ctx.fillText('✔ 교차 확인된 핵심 강점', innerX + 38, y + 24 + innerTopPad);

  ctx.font = `600 27px ${FONT_STACK}`;
  ctx.fillStyle = '#141816';
  let proCursorY = y + 68 + innerTopPad;
  proRowBlocks.forEach((rows) => {
    rows.forEach((line) => {
      ctx.fillText(line, innerX + 38, proCursorY);
      proCursorY += 39;
    });
    proCursorY += 10;
  });
  y += prosBoxH + 20 + gapExtra;

  // 7. Bottom 3-Column Buyer Pre-Check Strip (`stripY === y`, mathematically `>= prosBottom + 20` and `< footerLineY - 18`)
  const stripH = baseStripH + stripExtraH;
  const stripY = y;
  const gap = 16;
  const tileW = Math.floor((innerW - gap * 2) / 3);
  const checkTiles = [
    ['매칭 구분', matchBadge === 'exact' ? '동일 모델 확인' : '검증 대체품 안내'],
    ['구매 전 필수', '설치 공간·치수 실측'],
    ['상세 안내', monetized ? `쇼케이스 ${cardNumber}` : '본문·표기 규격 대조']
  ];
  checkTiles.forEach(([kicker, val], idx) => {
    const tx = innerX + idx * (tileW + gap);
    roundedRectPath(ctx, tx, stripY, tileW, stripH, 16);
    ctx.fillStyle = '#F7F8F6';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#D4D9D4';
    ctx.stroke();

    const tilePadY = Math.floor(stripExtraH / 2);
    ctx.font = `700 19px ${FONT_STACK}`;
    ctx.fillStyle = '#5A625C';
    ctx.textBaseline = 'top';
    ctx.fillText(kicker, tx + 20, stripY + 20 + tilePadY);

    ctx.font = `800 23px ${FONT_STACK}`;
    ctx.fillStyle = '#141816';
    const clippedVal = measureWrappedLines(ctx, val, tileW - 36, 1)[0] || val;
    ctx.fillText(clippedVal, tx + 20, stripY + 54 + tilePadY);
  });

  // 8. Provenance Footer (`BS-60`: non-commercial cards omit `/showcase` pointer)
  ctx.fillStyle = '#E3E7E3';
  ctx.fillRect(innerX, footerLineY, innerW, 2);

  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillStyle = '#5A625C';
  ctx.textBaseline = 'middle';
  ctx.fillText(`검증 기준일 ${verifiedDate}`, innerX, footerLineY + 38);

  const rightFooter = monetized
    ? `ThreadScout · 프로필 쇼케이스 ${cardNumber}`
    : 'ThreadScout · 실용템 규격 판별표';
  ctx.font = `800 22px ${FONT_STACK}`;
  ctx.fillStyle = '#141816';
  const rw = ctx.measureText(rightFooter).width;
  ctx.fillText(rightFooter, innerX + innerW - rw, footerLineY + 38);

  const slug = cardNumber.replace(/[^0-9A-Za-z가-힣_-]/g, '') || 'card';
  const fileName = `threadscout-slide2-${slug}.png`;
  const dataUrl = canvas.toDataURL('image/png');
  return { canvas, dataUrl, fileName };
}

export async function downloadSlideCardPng(cardInput = {}, options = {}) {
  const doc = options.documentRef ?? globalThis.document;
  const { canvas, dataUrl, fileName } = await renderSlideCardCanvas(cardInput, { documentRef: doc });
  const blob = await new Promise((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(resolve, 'image/png');
    } else {
      resolve(null);
    }
  });
  const href = blob && typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(blob) : dataUrl;
  const anchor = doc.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  doc.body?.appendChild(anchor);
  anchor.click();
  anchor.remove?.();
  if (blob && typeof URL?.revokeObjectURL === 'function') {
    setTimeout(() => URL.revokeObjectURL(href), 2500);
  }
  return { fileName, width: canvas.width, height: canvas.height, dataUrl };
}
