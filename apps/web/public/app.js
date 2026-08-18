// ThreadScout client.
//
// The client renders server state and sends intent. It computes no readiness, no
// risk, no approval validity — those arrive already decided
// (APPLICATION_INTERFACE_SPEC.md "Command rule"), which is what keeps a reload or a
// second tab from producing a different answer.
//
// Every mutating request carries an idempotency key and the version the screen was
// rendered from, so a double tap replays instead of repeating and a stale screen is
// refused instead of silently applied.

const state = {
  view: 'today',
  inbox: null,
  detail: null,
  busy: false
};

const el = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function newKey(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function toast(message) {
  const node = el('toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.hidden = true; }, 4200);
}

function showInfo(title, html) {
  el('info-title').textContent = title;
  el('info-body').innerHTML = html;
  el('info-dialog').showModal();
}

async function api(method, path, body) {
  const options = { method, headers: { 'content-type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? '요청을 처리하지 못했습니다.');
    error.code = payload?.error?.code;
    error.details = payload?.error?.details ?? [];
    error.status = response.status;
    throw error;
  }
  return payload;
}

/** One place where a failed command becomes something the owner can act on. */
async function guarded(work, { onConflict } = {}) {
  if (state.busy) return null;
  state.busy = true;
  document.body.setAttribute('aria-busy', 'true');
  try {
    return await work();
  } catch (error) {
    if (error.status === 409) {
      const changed = error.details?.length ? '<ul><li>' + error.details.map(escapeHtml).join('</li><li>') + '</li></ul>' : '';
      showInfo('다시 확인이 필요합니다', '<p>' + escapeHtml(error.message) + '</p>' + changed);
      if (onConflict) await onConflict();
    } else if (error.details?.length) {
      showInfo('진행할 수 없습니다', '<p>' + escapeHtml(error.message) + '</p><ul><li>' +
        error.details.map(escapeHtml).join('</li><li>') + '</li></ul>');
    } else {
      toast(error.message);
    }
    return null;
  } finally {
    state.busy = false;
    document.body.removeAttribute('aria-busy');
  }
}

/* Rendering ---------------------------------------------------------------- */

const TONE_SYMBOLS = { ok: '✔', warn: '!', stop: '✕', neutral: '·' };

function badge(key, value, tone) {
  return '<span class="state-badge" data-tone="' + tone + '" data-symbol="' + TONE_SYMBOLS[tone] + '">' +
    '<span class="state-key">' + escapeHtml(key) + '</span>' +
    '<span class="state-value">' + escapeHtml(value) + '</span></span>';
}

function readinessTone(value) {
  return { ready: 'ok', partial: 'warn', weak: 'warn', blocked: 'stop' }[value] ?? 'neutral';
}
function riskTone(value) {
  return { low: 'ok', review: 'warn', high: 'warn', blocked: 'stop' }[value] ?? 'neutral';
}
function matchTone(value) {
  return { exact: 'ok', likely: 'warn', substitute: 'warn', unresolved: 'warn', none: 'neutral' }[value] ?? 'neutral';
}
function mediaTone(value) {
  return { owner_supplied: 'ok', licensed: 'ok', link_or_embed_only: 'warn', analysis_only: 'warn', unknown: 'stop', none: 'neutral' }[value] ?? 'neutral';
}
function freshnessTone(value) {
  return { fresh: 'ok', aging: 'warn', stale: 'warn' }[value] ?? 'neutral';
}

const SEVERITY_LABELS = { blocker: '차단', required: '필요', warning: '주의', info: '참고' };

function blockerLine(blocker) {
  if (!blocker) return '';
  return '<p class="blocker-line" data-severity="' + blocker.severity + '">' +
    '<span class="severity-tag">' + SEVERITY_LABELS[blocker.severity] + '</span>' +
    '<span>' + escapeHtml(blocker.text) + '</span></p>';
}

/**
 * The inbox card. UI_SCREEN_SPEC.md section 4 fixes what has to be readable here
 * without opening anything: name, lane, why-now, reader value, score, evidence
 * readiness, risk, product match, media state, dominant blocker, and one CTA.
 */
function candidateCard(view, { exclusion = null } = {}) {
  const approvalNote = view.approvalState === 'approved'
    ? badge('승인', '완료', 'ok')
    : view.approvalState === 'stale'
      ? badge('승인', '재검토 필요', 'warn')
      : '';

  return '<article class="candidate-card" data-candidate="' + escapeHtml(view.candidateId) + '">' +
    '<div class="card-top">' +
      '<div>' +
        '<h3 class="card-name">' + escapeHtml(view.name) + '</h3>' +
        '<span class="lane-badge">' + escapeHtml(view.contentLaneLabel) + '</span>' +
      '</div>' +
      '<p class="card-score"><strong>' + escapeHtml(view.opportunityScore) + '</strong><span>기회 점수</span></p>' +
    '</div>' +
    '<p class="card-line"><strong>왜 지금</strong> ' + escapeHtml(view.whyNow) + '</p>' +
    '<p class="card-line"><strong>독자 가치</strong> ' + escapeHtml(view.readerValue) + '</p>' +
    '<div class="state-grid">' +
      badge('근거', view.evidenceReadinessLabel, readinessTone(view.evidenceReadiness)) +
      badge('위험', view.riskLabel, riskTone(view.riskLevel)) +
      badge('제품', view.matchStateLabel, matchTone(view.matchState)) +
      badge('미디어', view.mediaStateLabel, mediaTone(view.mediaState)) +
      badge('신선도', view.freshnessLabel, freshnessTone(view.freshnessState)) +
      approvalNote +
    '</div>' +
    blockerLine(view.dominantBlocker) +
    (exclusion ? '<p class="exclusion-note">첫 화면 제외: ' + escapeHtml(exclusion.detail) + '</p>' : '') +
    '<div class="card-actions">' +
      '<button class="primary-button" type="button" data-open="' + escapeHtml(view.candidateId) + '">' +
        escapeHtml(view.cta.label) + '</button>' +
    '</div>' +
  '</article>';
}

function renderInbox() {
  const data = state.inbox;
  if (!data) return;

  el('header-date').textContent = new Date(data.generatedAt).toLocaleString('ko-KR');
  el('publish-status').textContent = data.externalPublishingEnabled ? '외부 게시 · 켜짐' : '외부 게시 · 꺼짐';
  el('sum-total').textContent = data.summary.total;
  el('sum-recommended').textContent = data.summary.recommended;
  el('sum-evidence').textContent = data.summary.needsEvidence;
  el('sum-approval').textContent = data.summary.awaitingApproval;

  el('inbox-list').innerHTML = data.candidates.length > 0
    ? data.candidates.map((view) => candidateCard(view)).join('')
    : '<div class="empty-state"><strong>' + escapeHtml(data.emptyReason ?? '오늘 추천 없음') + '</strong>' +
      '<span>기준을 낮춰 자리를 채우지 않습니다. 제품을 직접 입력하거나 근거를 보완해 주세요.</span></div>';

  const excluded = data.excluded ?? [];
  el('excluded-block').hidden = excluded.length === 0;
  el('excluded-list').innerHTML = excluded
    .map((view) => candidateCard(view, { exclusion: view.exclusionReason }))
    .join('');
}

function evidenceWorkbench(detail) {
  const evidence = detail.evidenceInput;
  const rows = evidence.identityEvidence ?? [];
  const dimensions = [
    ['brand', '브랜드'],
    ['product_name', '제품명'],
    ['model', '모델 · SKU'],
    ['variant', '옵션 · 색상'],
    ['package_quantity', '구성 수량'],
    ['markings', '표기 · 각인']
  ];

  const existing = new Map(rows.map((row) => [row.dimension, row]));
  const inputs = dimensions.map(([key, label]) => {
    const row = existing.get(key);
    const status = row?.status ?? 'unknown';
    const origin = row?.originId ?? '';
    return '<div class="proof-group">' +
      '<h4>' + label + '</h4>' +
      '<label class="field"><span class="field-label">확인 상태</span>' +
        '<select data-dim="' + key + '" data-role="status">' +
          '<option value="unknown"' + (status === 'unknown' ? ' selected' : '') + '>확인 못 함</option>' +
          '<option value="match"' + (status === 'match' ? ' selected' : '') + '>일치</option>' +
          '<option value="conflict"' + (status === 'conflict' ? ' selected' : '') + '>충돌</option>' +
        '</select></label>' +
      '<label class="field"><span class="field-label">출처 이름</span>' +
        '<input type="text" data-dim="' + key + '" data-role="origin" maxlength="80" value="' + escapeHtml(origin) + '" ' +
        'placeholder="예: 제조사페이지" /></label>' +
      '</div>';
  }).join('');

  return '<section class="panel">' +
    '<h3>근거 작업대</h3>' +
    '<p>같은 출처에서 나온 항목은 하나로 셉니다. <strong>동일 제품</strong>으로 확정하려면 브랜드 · 제품명 · 모델 · 옵션이 모두 일치하고, 서로 다른 출처가 두 곳 이상 필요합니다.</p>' +
    '<form id="evidence-form">' +
      '<label class="field"><span class="field-label">브랜드</span><input type="text" name="brand" maxlength="120" value="' + escapeHtml(evidence.product?.brand ?? '') + '" /></label>' +
      '<label class="field"><span class="field-label">모델</span><input type="text" name="model" maxlength="120" value="' + escapeHtml(evidence.product?.model ?? '') + '" /></label>' +
      '<label class="field"><span class="field-label">옵션</span><input type="text" name="variant" maxlength="120" value="' + escapeHtml(evidence.product?.variant ?? '') + '" /></label>' +
      inputs +
      '<label class="checkbox-field"><input type="checkbox" name="ownerDeclaredSubstitute"' +
        (evidence.ownerDeclaredSubstitute ? ' checked' : '') + ' /><span>이 제품은 대체품입니다</span></label>' +
      '<label class="checkbox-field"><input type="checkbox" name="usageRecordConfirmed"' +
        (evidence.usageRecordConfirmed ? ' checked' : '') + ' /><span>직접 사용한 기록이 있습니다</span></label>' +
      '<button class="secondary-button full-width" type="submit">근거 저장</button>' +
    '</form>' +
    '<button class="primary-button full-width" type="button" data-action="verify">근거 다시 확인</button>' +
  '</section>';
}

function evidencePanel(detail) {
  const packet = detail.evidencePacket;
  if (!packet) {
    return '<section class="panel"><h3>검증 결과</h3><p>아직 검증하지 않았습니다.</p></section>';
  }

  const claims = packet.verifiedClaims.map((claim) =>
    '<li>' + escapeHtml(claim.text) + ' <span class="field-help">(' + escapeHtml(claim.evidenceClass) + ' · ' +
    escapeHtml(claim.sourceIds.join(', ')) + ')</span></li>').join('') || '<li>검증된 주장이 없습니다.</li>';

  const prohibited = packet.prohibitedClaims.map((claim) =>
    '<li>' + escapeHtml(claim.text) + ' — ' + escapeHtml(claim.reason) + '</li>').join('') || '<li>없음</li>';

  const conflicts = packet.conflicts.map((item) =>
    '<li>' + escapeHtml(item.dimension) + ': ' + escapeHtml(item.detail) + '</li>').join('') || '<li>없음</li>';

  const unresolved = packet.unresolvedQuestions.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') || '<li>없음</li>';

  const media = packet.mediaRights.map((item) =>
    '<li>' + escapeHtml(item.mediaId) + ': ' + escapeHtml(item.publishRightsState) + '</li>').join('') || '<li>등록된 미디어 없음</li>';

  const commerce = packet.commerceSnapshot;

  // The four proof questions stay visually separate: they are independent
  // (UI_SCREEN_SPEC.md section 5).
  return '<section class="panel">' +
    '<h3>검증 결과</h3>' +
    '<dl class="kv">' +
      '<dt>검증 판정</dt><dd>' + escapeHtml(packet.verifierDecision) + '</dd>' +
      '<dt>제품 동일성</dt><dd>' + escapeHtml(detail.candidate.matchStateLabel) + '</dd>' +
    '</dl>' +
    '<div class="proof-group"><h4>관심 근거</h4><ul>' + claims + '</ul></div>' +
    '<div class="proof-group"><h4>제품 동일성 근거</h4><ul>' +
      (packet.matchEvidence.map((item) => '<li>' + escapeHtml(item.dimension) + ': ' + escapeHtml(item.status) +
        (item.note ? ' — ' + escapeHtml(item.note) : '') + '</li>').join('') || '<li>없음</li>') +
      '</ul><p class="field-help">충돌: </p><ul>' + conflicts + '</ul></div>' +
    '<div class="proof-group"><h4>사진 · 영상 사용권</h4><ul>' + media + '</ul></div>' +
    '<div class="proof-group"><h4>판매 링크 근거</h4><dl class="kv">' +
      '<dt>링크</dt><dd>' + (commerce.destinationRef ? escapeHtml(commerce.destinationRef) : '없음') + '</dd>' +
      '<dt>가격</dt><dd>' + (commerce.priceStatus === 'observed' ? escapeHtml(commerce.amount) + ' ' + escapeHtml(commerce.currency) : '확인 안 됨') + '</dd>' +
      '<dt>판매자</dt><dd>' + escapeHtml(commerce.sellerStatus) + '</dd>' +
      '<dt>확인 시각</dt><dd>' + escapeHtml(new Date(commerce.observedAt).toLocaleString('ko-KR')) + '</dd>' +
    '</dl><p class="field-help">링크는 저장만 하며 자동으로 열지 않습니다.</p></div>' +
    '<h4>쓸 수 없는 표현</h4><ul>' + prohibited + '</ul>' +
    '<h4>남은 질문</h4><ul>' + unresolved + '</ul>' +
  '</section>';
}

function strategyPanel(detail) {
  const brief = detail.contentBrief;
  const view = detail.candidate;

  if (!brief) {
    const blocked = !view.strategyEnabled;
    return '<section class="panel"><h3>전략 4개</h3>' +
      '<p>아직 만들지 않았습니다.</p>' +
      '<button class="primary-button full-width" type="button" data-action="strategies"' +
        (blocked ? ' data-blocked="true"' : '') + '>' +
        (blocked ? '전략 4개 만들기 (잠김)' : '전략 4개 만들기') + '</button>' +
      (blocked ? '<p class="field-help">' + escapeHtml(view.strategyDisabledReason ?? '') + '</p>' : '') +
      '</section>';
  }

  const cards = brief.angles.map((angle, index) =>
    '<div class="angle-card">' +
      '<h4>' + (index + 1) + '. ' + escapeHtml(angle.readerJobLabel ?? angle.readerJob) + '</h4>' +
      '<p><strong>핵심 가치</strong> ' + escapeHtml(angle.coreValue) + '</p>' +
      '<p><strong>후킹 논리</strong> ' + escapeHtml(angle.hookLogic) + '</p>' +
      '<p><strong>구분 이유</strong> ' + escapeHtml(angle.differentiationReason) + '</p>' +
      '<p><strong>상업 강도</strong> ' + escapeHtml(angle.commercialIntensity) + '</p>' +
    '</div>').join('');

  return '<section class="panel"><h3>전략 4개</h3>' + cards +
    '<button class="secondary-button full-width" type="button" data-action="strategies">전략 다시 만들기</button>' +
    '<button class="primary-button full-width" type="button" data-action="drafts">' +
      (detail.draftBundle ? '초안 다시 쓰기' : '초안 4개 쓰기') + '</button>' +
    '</section>';
}

function guardianPanel(detail) {
  const report = detail.reviewReport;
  if (!report) {
    return detail.draftBundle
      ? '<section class="panel"><h3>Guardian 검수</h3><p>아직 검수하지 않았습니다.</p>' +
        '<button class="primary-button full-width" type="button" data-action="review">Guardian 검수 실행</button></section>'
      : '';
  }

  const checkNames = {
    productMatchCheck: '제품 동일성',
    publicFigureClaimCheck: '공인 표현',
    rightsCheck: '미디어 권리',
    firstHandCheck: '체험 표현',
    affiliateDisclosureCheck: '제휴 고지',
    duplicationCheck: '중복',
    exaggerationCheck: '과장',
    sensitiveClaimCheck: '민감 주장'
  };
  const symbols = { pass: '✔', warn: '!', block: '✕' };

  const checks = Object.entries(checkNames).map(([key, label]) =>
    '<div class="check-row"><span>' + symbols[report[key].status] + '</span>' +
    '<span class="check-name">' + label + '</span>' +
    '<span>' + escapeHtml(report[key].detail) + '</span></div>').join('');

  const blockers = report.nonOverridableBlockers.map((item) =>
    '<p class="finding" data-severity="blocker">' + escapeHtml(item) + '</p>').join('');

  const revisions = report.revisionRequests.map((item) =>
    '<div class="finding" data-severity="' + item.severity + '">' +
      '<span class="rule-id">' + escapeHtml(item.ruleId) + '</span>' +
      '<strong>' + escapeHtml(item.problem) + '</strong><br />' +
      escapeHtml(item.requiredChange) +
    '</div>').join('');

  const decisionLabel = { pass: '통과', revise: '수정 필요', block: '차단됨' }[report.decision];

  return '<section class="panel"><h3>Guardian 검수 · ' + decisionLabel + '</h3>' +
    blockers +
    (report.decision === 'block'
      ? '<p class="field-help">차단은 승인으로 뒤집을 수 없습니다. 근거나 문구를 바꾼 뒤 다시 검수해 주세요.</p>'
      : '') +
    revisions +
    '<div class="check-list">' + checks + '</div>' +
    '<button class="secondary-button full-width" type="button" data-action="review">다시 검수</button>' +
  '</section>';
}

function draftPanel(detail) {
  const bundle = detail.draftBundle;
  if (!bundle) return '';

  const cards = bundle.drafts.map((draft, index) => {
    const selected = draft.draftId === detail.selectedDraftId;
    return '<div class="draft-card' + (selected ? ' is-selected' : '') + '">' +
      '<label class="draft-select">' +
        '<input type="radio" name="selected-draft" value="' + escapeHtml(draft.draftId) + '"' + (selected ? ' checked' : '') + ' />' +
        '<span>초안 ' + (index + 1) + ' · ' + escapeHtml(draft.angleLabel ?? draft.angleId) + '</span>' +
      '</label>' +
      '<label class="field"><span class="field-label">후킹</span>' +
        '<textarea data-draft="' + escapeHtml(draft.draftId) + '" data-field="hook" rows="2">' + escapeHtml(draft.hook) + '</textarea></label>' +
      '<label class="field"><span class="field-label">본문</span>' +
        '<textarea data-draft="' + escapeHtml(draft.draftId) + '" data-field="body" rows="7">' + escapeHtml(draft.body) + '</textarea></label>' +
      '<p class="field-help">주의: ' + escapeHtml(draft.caution ?? '') + '</p>' +
      '<p class="field-help">CTA: ' + escapeHtml(draft.cta) + '</p>' +
      (draft.disclosure ? '<p class="field-help">고지: ' + escapeHtml(draft.disclosure) + '</p>' : '') +
      '<p class="field-help">근거: ' + escapeHtml(draft.claimRefs.join(', ') || '없음') + '</p>' +
      '<button class="secondary-button" type="button" data-save-draft="' + escapeHtml(draft.draftId) + '">이 초안 저장</button>' +
    '</div>';
  }).join('');

  return '<section class="panel"><h3>초안 4개</h3>' +
    '<p class="field-help">초안을 고치면 Guardian 검수 결과가 무효가 되고 다시 검수해야 합니다.</p>' +
    cards + '</section>';
}

/** Approval sits last and below the Guardian result, never above it (AT-42). */
function approvalPanel(detail) {
  const view = detail.candidate;
  if (!detail.draftBundle) return '';

  const guardianPassed = detail.reviewReport?.decision === 'pass';
  const changed = view.approvalChanged ?? [];

  const staleNotice = view.approvalState === 'stale'
    ? '<p class="finding" data-severity="required"><strong>승인 이후 바뀐 항목</strong><br />' +
      escapeHtml(changed.map((item) => item.label).join(', ')) + '</p>'
    : '';

  const approvedNotice = view.approvalState === 'approved'
    ? '<p class="finding" data-severity="required"><strong>승인 완료</strong><br />' +
      escapeHtml(detail.approval?.approvedAt ?? '') + ' · ' + escapeHtml(detail.approval?.actor ?? '') +
      '<br />외부 게시는 꺼져 있어 이 승인만으로 게시되지 않습니다.</p>'
    : '';

  const bindingRows = detail.binding
    ? Object.entries({
        evidencePacketHash: '검증 근거',
        draftHash: '선택한 초안',
        mediaHash: '미디어 상태',
        affiliateMappingHash: '판매 링크 매핑'
      }).map(([key, label]) =>
        '<div class="check-row"><span>#</span><span class="check-name">' + label + '</span>' +
        '<span>' + escapeHtml(detail.binding[key].slice(0, 12)) + '…</span></div>').join('')
    : '';

  return '<section class="panel"><h3>사람 승인</h3>' +
    staleNotice + approvedNotice +
    (guardianPassed ? '' : '<p class="finding" data-severity="blocker">Guardian 검수를 통과해야 승인할 수 있습니다.</p>') +
    '<h4>이 승인이 묶는 판본</h4><div class="check-list">' + bindingRows + '</div>' +
    '<div class="card-actions">' +
      '<button class="primary-button" type="button" data-decision="approve"' +
        (guardianPassed ? '' : ' data-blocked="true"') + '>승인</button>' +
      '<button class="secondary-button" type="button" data-decision="hold">보류</button>' +
      '<button class="danger-button" type="button" data-decision="reject">거절</button>' +
    '</div>' +
    '<button class="link-button" type="button" data-action="lineage">처리 이력 보기</button>' +
  '</section>';
}

function renderDetail() {
  const detail = state.detail;
  if (!detail) return;
  const view = detail.candidate;

  el('detail-body').innerHTML =
    '<section class="panel">' +
      '<h3>' + escapeHtml(view.name) + '</h3>' +
      '<span class="lane-badge">' + escapeHtml(view.contentLaneLabel) + '</span>' +
      '<p class="card-line"><strong>왜 지금</strong> ' + escapeHtml(view.whyNow) + '</p>' +
      '<p class="card-line"><strong>독자 가치</strong> ' + escapeHtml(view.readerValue) + '</p>' +
      '<div class="state-grid">' +
        badge('근거', view.evidenceReadinessLabel, readinessTone(view.evidenceReadiness)) +
        badge('위험', view.riskLabel, riskTone(view.riskLevel)) +
        badge('제품', view.matchStateLabel, matchTone(view.matchState)) +
        badge('미디어', view.mediaStateLabel, mediaTone(view.mediaState)) +
        badge('신선도', view.freshnessLabel, freshnessTone(view.freshnessState)) +
        badge('점수', String(view.opportunityScore), 'neutral') +
      '</div>' +
      blockerLine(view.dominantBlocker) +
      '<p class="field-help">' + escapeHtml(detail.scoutSkip?.reason ?? '') + '</p>' +
    '</section>' +
    evidencePanel(detail) +
    evidenceWorkbench(detail) +
    strategyPanel(detail) +
    draftPanel(detail) +
    guardianPanel(detail) +
    approvalPanel(detail);
}

function setView(name) {
  state.view = name;
  for (const id of ['today', 'intake', 'detail']) {
    el('view-' + id).hidden = id !== name;
  }
  for (const button of document.querySelectorAll('.nav-button')) {
    button.classList.toggle('is-active', button.dataset.nav === (name === 'detail' ? 'today' : name));
  }
  el('main').focus();
  window.scrollTo(0, 0);
}

/* Data loading -------------------------------------------------------------- */

async function loadInbox() {
  state.inbox = await api('GET', '/api/inbox');
  renderInbox();
}

async function loadDetail(candidateId) {
  state.detail = await api('GET', '/api/candidates/' + candidateId);
  renderDetail();
}

async function runCommand(path, body, successMessage) {
  const detail = state.detail;
  const result = await guarded(
    async () => {
      await api('POST', '/api/candidates/' + detail.candidate.candidateId + path, {
        idempotencyKey: newKey(path.slice(1)),
        expectedVersion: detail.version,
        ...body
      });
      await loadDetail(detail.candidate.candidateId);
      await loadInbox();
      return true;
    },
    { onConflict: () => loadDetail(detail.candidate.candidateId) }
  );
  if (result && successMessage) toast(successMessage);
  return result;
}

/* Events -------------------------------------------------------------------- */

document.addEventListener('click', async (browserEvent) => {
  const target = browserEvent.target;

  const openId = target.closest('[data-open]')?.dataset.open;
  if (openId) {
    await guarded(async () => { await loadDetail(openId); setView('detail'); });
    return;
  }

  const back = target.closest('[data-back]')?.dataset.back;
  if (back) { setView(back); return; }

  const nav = target.closest('.nav-button');
  if (nav) {
    if (nav.dataset.unavailable) { showInfo('아직 없는 화면', '<p>' + escapeHtml(nav.dataset.unavailable) + '</p>'); return; }
    if (nav.dataset.nav === 'today') { setView('today'); return; }
    // 검증 and 초안 are filters over the same server state, not separate stores.
    const filterFor = nav.dataset.nav === 'evidence'
      ? (view) => ['weak', 'partial', 'blocked'].includes(view.evidenceReadiness)
      : (view) => view.guardianDecision !== null || view.cta.action === 'review_drafts';
    setView('today');
    const all = [...(state.inbox?.candidates ?? []), ...(state.inbox?.excluded ?? [])];
    const matching = all.filter(filterFor);
    el('inbox-list').innerHTML = matching.length > 0
      ? matching.map((view) => candidateCard(view)).join('')
      : '<div class="empty-state"><strong>해당하는 후보가 없습니다</strong><span>오늘 탭으로 돌아가면 전체 목록을 볼 수 있습니다.</span></div>';
    el('excluded-block').hidden = true;
    return;
  }

  if (target.id === 'open-intake') { setView('intake'); return; }
  if (target.id === 'info-close') { el('info-dialog').close(); return; }

  if (target.id === 'open-capabilities') {
    await guarded(async () => {
      const data = await api('GET', '/api/capabilities');
      const rows = data.capabilities.map((item) => {
        const states = ['설계', '설정', '활성', '검증'];
        const flags = [item.designed, item.configured, item.enabled, item.verified];
        const summary = states.map((label, index) => (flags[index] ? '✔' : '✕') + label).join(' · ');
        return '<div class="capability-row"><span>' + escapeHtml(item.labelKo) + '</span>' +
          '<span class="capability-states">' + summary + '</span></div>';
      }).join('');
      showInfo('기능 상태', '<p>설계 · 설정 · 활성 · 검증은 서로 다른 상태입니다.</p>' + rows);
    });
    return;
  }

  const action = target.closest('[data-action]')?.dataset.action;
  if (action && state.detail) {
    if (action === 'verify') { await runCommand('/verify', {}, '근거를 다시 확인했습니다.'); return; }
    if (action === 'strategies') {
      if (target.dataset.blocked === 'true') {
        showInfo('아직 전략을 만들 수 없습니다', '<p>' + escapeHtml(state.detail.candidate.strategyDisabledReason ?? '') + '</p>');
        return;
      }
      await runCommand('/strategies', {}, '전략 4개를 만들었습니다.');
      return;
    }
    if (action === 'drafts') { await runCommand('/drafts', {}, '초안 4개를 썼습니다.'); return; }
    if (action === 'review') { await runCommand('/review', {}, 'Guardian 검수를 마쳤습니다.'); return; }
    if (action === 'lineage') {
      await guarded(async () => {
        const data = await api('GET', '/api/candidates/' + state.detail.candidate.candidateId + '/lineage');
        const stages = data.stages.map((item) =>
          '<li>' + escapeHtml(item.agentId) + ' → ' + escapeHtml(item.artifactType) + ' (' + escapeHtml(item.artifactId) + ')</li>').join('');
        const handoffs = data.handoffs.map((item) =>
          '<li>' + escapeHtml(item.from) + ' · ' + escapeHtml(item.requestedNextAction) + ' · ' + escapeHtml(item.status) + '</li>').join('');
        showInfo('처리 이력',
          '<p>발굴 → 검증 → 전략 → 초안 → Guardian → 나</p>' +
          '<p class="field-help">' + escapeHtml(data.scoutSkip?.reason ?? '') + '</p>' +
          '<h4>산출물</h4><ul>' + stages + '</ul>' +
          '<h4>핸드오프</h4><ul>' + handoffs + '</ul>' +
          '<p>이벤트 ' + data.events.length + '건 · 해시 체인 ' + (data.chainValid ? '정상' : '손상') + '</p>');
      });
      return;
    }
  }

  const saveDraftId = target.closest('[data-save-draft]')?.dataset.saveDraft;
  if (saveDraftId && state.detail) {
    const patch = {};
    for (const field of document.querySelectorAll('[data-draft="' + saveDraftId + '"]')) {
      patch[field.dataset.field] = field.value;
    }
    await runCommand('/draft-edit', { draftId: saveDraftId, patch }, '초안을 저장했습니다. 다시 검수해 주세요.');
    return;
  }

  const decision = target.closest('[data-decision]')?.dataset.decision;
  if (decision && state.detail) {
    if (decision === 'approve' && target.dataset.blocked === 'true') {
      showInfo('승인할 수 없습니다', '<p>Guardian 검수를 통과한 뒤에만 승인할 수 있습니다.</p>');
      return;
    }
    if (decision === 'reject' && !window.confirm('이 후보를 거절할까요? 되돌리려면 다시 등록해야 합니다.')) return;
    await runCommand('/decision', { decision, binding: state.detail.binding },
      { approve: '승인했습니다. 외부 게시는 여전히 꺼져 있습니다.', hold: '보류했습니다.', reject: '거절했습니다.' }[decision]);
  }
});

document.addEventListener('change', async (browserEvent) => {
  const target = browserEvent.target;
  if (target.name === 'selected-draft' && state.detail) {
    await runCommand('/select-draft', { draftId: target.value }, '승인 대상 초안을 바꿨습니다.');
  }
});

// Live value readout for the rating sliders.
document.addEventListener('input', (browserEvent) => {
  const target = browserEvent.target;
  if (target.type === 'range') {
    const output = target.parentElement?.querySelector('output');
    if (output) output.textContent = target.value;
  }
});

document.addEventListener('submit', async (browserEvent) => {
  browserEvent.preventDefault();
  const form = browserEvent.target;

  if (form.id === 'intake-form') {
    const data = new FormData(form);
    const errorBox = el('intake-errors');
    errorBox.hidden = true;

    const body = {
      idempotencyKey: newKey('create'),
      name: data.get('name'),
      contentLane: data.get('contentLane'),
      whyNow: data.get('whyNow'),
      readerValue: data.get('readerValue'),
      observation: data.get('observation'),
      destinationUrl: data.get('destinationUrl') || null,
      mediaRightsState: data.get('mediaRightsState'),
      usageRecordConfirmed: data.get('usageRecordConfirmed') === 'on',
      ratings: {
        readerValue: Number(data.get('rating-readerValue')),
        demonstrability: Number(data.get('rating-demonstrability')),
        purchaseIntent: Number(data.get('rating-purchaseIntent')),
        audienceFit: Number(data.get('rating-audienceFit')),
        novelty: Number(data.get('rating-novelty'))
      }
    };

    try {
      state.busy = true;
      const created = await api('POST', '/api/candidates', body);
      form.reset();
      for (const output of form.querySelectorAll('output')) {
        output.textContent = output.previousElementSibling.value;
      }
      await loadInbox();
      await loadDetail(created.candidate.candidateId);
      setView('detail');
      toast('후보로 등록했습니다. 이제 근거를 확인해 주세요.');
    } catch (error) {
      errorBox.hidden = false;
      errorBox.innerHTML = '<strong>' + escapeHtml(error.message) + '</strong>' +
        (error.details?.length ? '<ul><li>' + error.details.map(escapeHtml).join('</li><li>') + '</li></ul>' : '');
      errorBox.scrollIntoView({ block: 'center' });
    } finally {
      state.busy = false;
    }
    return;
  }

  if (form.id === 'evidence-form' && state.detail) {
    const identityEvidence = [];
    for (const select of form.querySelectorAll('[data-role="status"]')) {
      const dimension = select.dataset.dim;
      const origin = form.querySelector('[data-role="origin"][data-dim="' + dimension + '"]');
      if (select.value === 'unknown' && !origin.value.trim()) continue;
      identityEvidence.push({
        dimension,
        status: select.value,
        originId: origin.value.trim(),
        note: ''
      });
    }
    const data = new FormData(form);
    await runCommand('/evidence', {
      product: { brand: data.get('brand'), model: data.get('model'), variant: data.get('variant') },
      identityEvidence,
      ownerDeclaredSubstitute: data.get('ownerDeclaredSubstitute') === 'on',
      usageRecordConfirmed: data.get('usageRecordConfirmed') === 'on'
    }, '근거를 저장했습니다. 이제 다시 확인할 수 있습니다.');
  }
});

/* Start --------------------------------------------------------------------- */

guarded(async () => {
  await loadInbox();
  const capabilities = await api('GET', '/api/capabilities');
  el('publish-status').textContent = capabilities.externalPublishingEnabled ? '외부 게시 · 켜짐' : '외부 게시 · 꺼짐';
});
