const grid = document.querySelector('#showcase-grid');
const form = document.querySelector('#showcase-search-form');
const queryInput = document.querySelector('#showcase-query');
const studioReturnLink = document.querySelector('#studio-return-link');

function syncStudioLink(data) {
  if (studioReturnLink) {
    studioReturnLink.hidden = data?.operatorStudioAvailable !== true;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resolveDestinationLabel(rawUrl = '', disclosureText = '') {
  try {
    const host = new URL(String(rawUrl)).hostname.toLowerCase();
    const disc = String(disclosureText ?? '');
    if ((host === 'coupa.ng' || host === 'coupang.com' || host.endsWith('.coupang.com')) && (!disc || /쿠팡/.test(disc))) {
      return '쿠팡에서 확인 ↗';
    }
    if ((host === 'naver.me' || host === 'naver.com' || host.endsWith('.naver.com')) && (!disc || /네이버/.test(disc))) {
      return '네이버에서 확인 ↗';
    }
  } catch { /* neutral fallback */ }
  return '공식 판매처에서 확인 ↗';
}

function resolveDestinationReferrerPolicy() {
  const host = String(window.location.hostname ?? '').toLowerCase().replace(/\.+$/, '');
  const isLoopback =
    host === 'localhost'
    || host.endsWith('.localhost')
    || /^127(?:\.\d{1,3}){3}$/.test(host)
    || host === '::1'
    || host === '[::1]'
    || /^\[::ffff:127(?:\.\d{1,3}){3}\]$/.test(host)
    || /^\[::ffff:7f[0-9a-f]{0,2}:[0-9a-f]{1,4}\]$/.test(host);
  return window.location.protocol === 'https:' && !isLoopback ? 'origin' : 'no-referrer';
}

function toCardShareUrl(cardNumber = '') {
  const slug = String(cardNumber ?? '').trim().replace(/^#/, '');
  return `${window.location.origin}/showcase/${encodeURIComponent(slug)}`;
}

function cardHtml(card) {
  const badgeText = card.matchBadge === 'exact' ? '동일 모델 확인' : '검증 대체품';
  const disclosureBlock = card.disclosureText
    ? `<p class="disclosure-banner">${escapeHtml(card.disclosureText)}</p>`
    : '';
  const mediaBlock = card.publishableMediaUrl
    ? `<img class="card-media" src="${escapeHtml(card.publishableMediaUrl)}" alt="${escapeHtml(card.canonicalProductName)}" referrerpolicy="no-referrer" loading="lazy" />`
    : '';
  const prosItems = (card.verifiedPros ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const destLabel = resolveDestinationLabel(card.verifiedDestinationUrl, card.disclosureText);
  const destRefPolicy = resolveDestinationReferrerPolicy();
  const destinationBtn = card.verifiedDestinationUrl
    ? `<a class="dest-btn" href="${escapeHtml(card.verifiedDestinationUrl)}" target="_blank" rel="noopener sponsored nofollow" referrerpolicy="${escapeHtml(destRefPolicy)}">${escapeHtml(destLabel)}</a>`
    : '';
  return `
    <article class="showcase-card" data-card-number="${escapeHtml(card.cardNumber)}">
      ${disclosureBlock}
      <div class="card-meta-row">
        <span class="card-num">${escapeHtml(card.cardNumber)}</span>
        <span class="match-badge ${card.matchBadge === 'alternative' ? 'alternative' : ''}">${escapeHtml(badgeText)}</span>
      </div>
      ${mediaBlock}
      <h2>${escapeHtml(card.canonicalProductName)}</h2>
      <ul class="pros-list">${prosItems}</ul>
      <div class="limit-box">
        <strong>사기 전 꼭 확인할 한계</strong>
        <span>${escapeHtml(card.verifiedLimitation)}</span>
      </div>
      <div class="card-footer">
        <span class="verified-date">검증 기준일 ${escapeHtml(String(card.verifiedAt ?? '').slice(0, 10))}</span>
        <div class="cta-row">
          ${destinationBtn}
          <button type="button" class="copy-md-btn" data-copy-link="${escapeHtml(card.cardNumber)}">${escapeHtml(card.cardNumber)} 링크 복사</button>
        </div>
      </div>
    </article>`;
}

let renderedCards = [];

async function loadCardDetail(cardNumber) {
  const res = await fetch(`/api/showcase/${encodeURIComponent(cardNumber)}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store'
  });
  const data = await res.json();
  syncStudioLink(data);
  if (!res.ok || !data.card) {
    renderedCards = [];
    grid.innerHTML = `
      <div class="empty-showcase" data-status="${escapeHtml(data.status ?? 'withdrawn_or_not_found')}">
        <strong>요청하신 카드(#${escapeHtml(String(cardNumber).replace(/^#/, ''))})는 유효기간이 만료되었거나 철회되었습니다.</strong>
        <p>근거 보존 기한(7일 / 이슈형 12시간)이 경과했거나 재검토 중일 때는 부분 노출하지 않고 카드 전체를 비공개 처리합니다.</p>
      </div>`;
    return;
  }
  renderedCards = [data.card];
  grid.innerHTML = cardHtml(data.card);
}

async function loadShowcase(query = '') {
  const url = `/api/showcase${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const res = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  const data = await res.json();
  syncStudioLink(data);
  renderedCards = data.cards ?? [];

  if (!renderedCards.length) {
    grid.innerHTML = `
      <div class="empty-showcase">
        <strong>${query ? `'${escapeHtml(query)}' 검색 결과가 없습니다.` : '현재 공개된 검증 쇼케이스 카드가 없습니다.'}</strong>
        <p>운영 스튜디오에서 Guardian 검수와 사람 최종 승인을 통과한 정품·대체품 카드만 이곳에 게시되며, 근거 유효기간이 지나거나 수정 중인 카드는 즉시 철회됩니다.</p>
      </div>`;
    return;
  }

  grid.innerHTML = renderedCards.map(cardHtml).join('');
}

grid.addEventListener('click', async (event) => {
  const copyBtn = event.target.closest('[data-copy-link]');
  if (!copyBtn) return;
  const cardNum = copyBtn.dataset.copyLink;
  const shareUrl = toCardShareUrl(cardNum);
  const resetLabel = `${cardNum} 링크 복사`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const temp = document.createElement('textarea');
      temp.value = shareUrl;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    copyBtn.textContent = '링크 복사됨 ✔';
    setTimeout(() => { copyBtn.textContent = resetLabel; }, 1800);
  } catch {
    copyBtn.textContent = '복사 실패';
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loadShowcase(queryInput.value.trim());
});

queryInput.addEventListener('input', () => {
  clearTimeout(queryInput.debounce);
  queryInput.debounce = setTimeout(() => loadShowcase(queryInput.value.trim()), 160);
});

const pathMatch = window.location.pathname.match(/^\/showcase\/([^/]+)$/);
if (pathMatch) {
  const cardSlug = decodeURIComponent(pathMatch[1]);
  queryInput.value = cardSlug.startsWith('#') ? cardSlug : `#${cardSlug.padStart(3, '0')}`;
  loadCardDetail(cardSlug);
} else {
  const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';
  if (initialQuery) queryInput.value = initialQuery;
  loadShowcase(initialQuery);
}
