const STANDARD_DISCLOSURES = {
  naver_shopping_connect: '[광고] 이 게시물은 네이버 쇼핑커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.',
  coupang_partners: '[광고] 이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
};

const els = {
  list: document.querySelector('#candidate-list'),
  candidateDialog: document.querySelector('#candidate-dialog'),
  candidateForm: document.querySelector('#candidate-form'),
  workspace: document.querySelector('#workspace-dialog'),
  studioPlaceholder: document.querySelector('#studio-placeholder'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogSubtitle: document.querySelector('#dialog-subtitle'),
  workspaceAlert: document.querySelector('#workspace-alert'),
  workspaceStatus: document.querySelector('#workspace-status'),
  duplicateReviewSection: document.querySelector('#duplicate-review-section'),
  duplicateSummary: document.querySelector('#duplicate-summary'),
  evidenceForm: document.querySelector('#evidence-form'),
  evidenceBrand: document.querySelector('#evidence-brand'),
  evidenceModel: document.querySelector('#evidence-model'),
  evidenceVariant: document.querySelector('#evidence-variant'),
  evidenceSource: document.querySelector('#evidence-source'),
  evidenceSourceOrigin: document.querySelector('#evidence-source-origin'),
  evidenceCorroboration: document.querySelector('#evidence-corroboration'),
  evidenceCorroborationOrigin: document.querySelector('#evidence-corroboration-origin'),
  evidenceSubstitute: document.querySelector('#evidence-substitute'),
  excludedBlock: document.querySelector('#excluded-block'),
  excludedList: document.querySelector('#excluded-list'),
  mediaRights: document.querySelector('#media-rights'),
  publishableMediaRow: document.querySelector('#publishable-media-row'),
  publishableMediaUrl: document.querySelector('#evidence-publishable-media-url'),
  personalUse: document.querySelector('#personal-use'),
  affiliate: document.querySelector('#affiliate'),
  affiliateFields: document.querySelector('#affiliate-fields'),
  affiliateNetwork: document.querySelector('#evidence-affiliate-network'),
  affiliateState: document.querySelector('#evidence-affiliate-state'),
  destinationUrl: document.querySelector('#evidence-destination-url'),
  verifiedLimitation: document.querySelector('#evidence-limitation'),
  disclosure: document.querySelector('#disclosure'),
  evidenceBasis: document.querySelector('#evidence-basis'),
  strategyList: document.querySelector('#strategy-list'),
  draftList: document.querySelector('#draft-list'),
  guardianResult: document.querySelector('#guardian-result'),
  approvalBinding: document.querySelector('#approval-binding'),
  showcasePreviewBox: document.querySelector('#showcase-preview-box'),
  showcaseCountBadge: document.querySelector('#showcase-count-badge'),
  revisionLabel: document.querySelector('#revision-label'),
  reopenCandidate: document.querySelector('#reopen-candidate'),
  lockNonCommercial: document.querySelector('#lock-non-commercial'),
  capabilityView: document.querySelector('#capability-view'),
  inboxView: document.querySelector('#inbox-view'),
  filter: document.querySelector('#state-filter'),
  viewKicker: document.querySelector('#view-kicker'),
  inboxTitle: document.querySelector('#inbox-title'),
  viewDescription: document.querySelector('#view-description'),
  toast: document.querySelector('#toast'),
  suppressDialog: document.querySelector('#suppress-dialog'),
  suppressForm: document.querySelector('#suppress-form'),
  suppressAxis: document.querySelector('#suppress-axis'),
  suppressReason: document.querySelector('#suppress-reason'),
  suppressTarget: document.querySelector('#suppress-target')
};

let today = null;
let activeCandidateId = null;
let viewMode = 'today';
let activeStep = 1;

const desktopMedia = window.matchMedia('(min-width: 1120px)');

function isDesktopSplitMode() {
  return desktopMedia.matches;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function requestId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => els.toast.classList.remove('show'), 2800);
}

function laneLabel(value) {
  return {
    'practical-novel': '실용 신박템',
    family: '가족·생활',
    desk: '데스크·수납',
    'curiosity-only': '호기심 탐색'
  }[value] ?? value;
}

function statusLabel(value) {
  return {
    duplicate_review: '유사 후보 검토',
    verification_needed: '근거 필요',
    evidence_partial: '근거 일부',
    evidence_ready: '근거 준비',
    strategy_ready: '전략 준비',
    draft_ready: '초안 준비',
    guardian_revise: '수정 필요',
    guardian_pass: 'Guardian 통과',
    approved: '사람 승인',
    held: '보류',
    rejected: '거절',
    blocked: '차단',
    stale: '승인 무효화'
  }[value] ?? value;
}

function evidenceLabel(value) {
  return { ready: '근거 준비됨', partial: '근거 일부', weak: '근거 보완 필요', blocked: '권리 차단' }[value] ?? value;
}

function riskLabel(value) {
  return { low: '낮은 위험', review: '검토 필요', high: '높은 위험', blocked: '위험 차단' }[value] ?? value;
}

function exactLabel(value) {
  return {
    exact: '동일 제품 확인',
    likely: '유력 · 단정 불가',
    substitute: '검증 대체품',
    unresolved: '제품 미확인'
  }[value] ?? value;
}

function mediaLabel(value) {
  return { owned: '직접 소유', licensed: '사용 허가', not_required: '미디어 없음', unknown: '권리 미확인' }[value] ?? value;
}

function angleLabel(angleId) {
  return {
    'problem-result': '문제→판단',
    'mechanism-demo': '모델·옵션 구분',
    'buying-checklist': '구매 체크리스트',
    'honest-fit': '적합·비추천 대상'
  }[angleId] ?? angleId;
}

function duplicateStateLabel(value) {
  return {
    unique: '중복 없음',
    possible_duplicate: '유사 후보',
    confirmed_distinct: '다른 제품 확인',
    confirmed_duplicate: '중복 억제'
  }[value] ?? value;
}

function recommendedStepFor(candidate) {
  if (!candidate) return 1;
  if (['duplicate_review', 'verification_needed', 'evidence_partial'].includes(candidate.workflowState)) return 1;
  if (['evidence_ready', 'strategy_ready', 'draft_ready'].includes(candidate.workflowState)) return 2;
  return 3;
}

function setStudioStep(stepNumber) {
  activeStep = [1, 2, 3].includes(Number(stepNumber)) ? Number(stepNumber) : 1;
  document.querySelectorAll('.step-tab').forEach((tab) => {
    const selected = Number(tab.dataset.step) === activeStep;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  for (const num of [1, 2, 3]) {
    const panel = document.querySelector(`#step-panel-${num}`);
    if (panel) panel.hidden = num !== activeStep;
  }
}

function syncStudioVisibility() {
  if (els.studioPlaceholder) {
    els.studioPlaceholder.hidden = Boolean(els.workspace.open);
  }
}

function closeWorkspaceDialog() {
  if (els.workspace.open) els.workspace.close();
  els.workspace.removeAttribute('open');
  activeCandidateId = null;
  syncStudioVisibility();
  renderCandidates();
}

function candidateById(id) {
  return today?.candidates.find((candidate) => candidate.id === id)
    ?? today?.excluded?.find((candidate) => candidate.id === id)
    ?? null;
}

function suppressedCandidates() {
  return (today?.excluded ?? []).filter((candidate) => candidate.suppression?.active === true);
}

function statusClass(value, kind = 'status') {
  if (kind === 'risk') return value === 'low' ? 'ok' : value === 'review' ? 'warn' : 'danger';
  if (kind === 'evidence') return value === 'ready' ? 'ok' : 'warn';
  if (kind === 'exact') return value === 'exact' ? 'ok' : value === 'unresolved' ? 'danger' : 'warn';
  if (kind === 'verifier') return value === 'verified' ? 'ok' : value === 'reject' ? 'danger' : 'warn';
  if (kind === 'freshness') return value === 'fresh' ? 'ok' : 'warn';
  if (kind === 'media') return value === 'unknown' ? 'warn' : 'ok';
  if (value === 'approved' || value === 'guardian_pass' || value === 'evidence_ready') return 'ok';
  if (value === 'duplicate_review') return 'warn';
  if (value === 'stale' || value === 'blocked' || value === 'rejected' || value === 'guardian_revise') return 'danger';
  return 'info';
}

function cardTemplate(candidate) {
  const sourceBadge = candidate.synthetic ? '예시 데이터' : '사용자 제공';
  const blocker = candidate.topBlocker
    ? `<p class="blocker-line"><strong>지금 막는 것:</strong> ${escapeHtml(candidate.topBlocker)}</p>`
    : '';
  const primaryAction = candidate.workflowState === 'duplicate_review'
    ? { action: 'open_workspace', label: '유사 후보 확인' }
    : candidate.nextAction;
  const duplicateBadge = candidate.duplicateAssessment?.state === 'possible_duplicate'
    ? '<span class="status-pill warn">유사 후보</span>'
    : '';
  const showcaseBadge = candidate.cardCode && candidate.showcaseProjected
    ? `<span class="status-pill ok">쇼케이스 ${escapeHtml(candidate.cardCode)}</span>`
    : '';
  const canHoldFromCard = !['approved', 'held', 'rejected', 'duplicate_review'].includes(candidate.workflowState);
  const isSelected = activeCandidateId === candidate.id && els.workspace.open;
  return `
    <article class="candidate-card ${isSelected ? 'active-studio-card' : ''} ${candidate.topBlocker ? 'has-blocker' : ''} ${candidate.workflowState === 'stale' ? 'stale-card' : ''}" data-id="${escapeHtml(candidate.id)}">
      <div class="card-top">
        <div class="card-copy">
          <div class="card-meta">
            <span class="card-kicker">${escapeHtml(laneLabel(candidate.lane))} · ${sourceBadge}</span>
            <span class="status-pill ${statusClass(candidate.workflowState)}">${escapeHtml(statusLabel(candidate.workflowState))}</span>
            ${showcaseBadge}
          </div>
          <h3>${escapeHtml(candidate.name)}</h3>
          <p><strong>왜 지금:</strong> ${escapeHtml(candidate.whyNow)}</p>
          <p><strong>독자 가치:</strong> ${escapeHtml(candidate.readerValue)}</p>
        </div>
        <div class="score-box" aria-label="기회 점수 ${escapeHtml(candidate.opportunityScore)}점"><strong>${escapeHtml(candidate.opportunityScore)}</strong><span>기회 점수</span></div>
      </div>
      <div class="status-row" aria-label="근거와 위험 상태">
        <span class="status-pill ${statusClass(candidate.evidenceReadiness, 'evidence')}">${escapeHtml(evidenceLabel(candidate.evidenceReadiness))}</span>
        <span class="status-pill ${statusClass(candidate.riskLevel, 'risk')}">${escapeHtml(riskLabel(candidate.riskLevel))}</span>
        <span class="status-pill ${statusClass(candidate.exactMatchStatus, 'exact')}">${escapeHtml(exactLabel(candidate.exactMatchStatus))}</span>
        <span class="status-pill ${statusClass(candidate.mediaRights, 'media')}">${escapeHtml(mediaLabel(candidate.mediaRights))}</span>
        ${candidate.verifierDecisionLabel ? `<span class="status-pill ${statusClass(candidate.verifierDecision, 'verifier')}">${escapeHtml(candidate.verifierDecisionLabel)}</span>` : ''}
        ${candidate.freshnessState && candidate.freshnessState !== 'fresh' ? `<span class="status-pill ${statusClass(candidate.freshnessState, 'freshness')}">근거 ${candidate.freshnessState === 'aging' ? '만료 임박' : '기한 초과'}</span>` : ''}
        ${duplicateBadge}
      </div>
      ${blocker}
      <div class="card-actions">
        <button class="primary-button card-primary" type="button" data-action="${escapeHtml(primaryAction.action)}">${escapeHtml(primaryAction.label)}</button>
        ${canHoldFromCard ? '<button class="ghost-button card-hold" type="button">보류</button>' : ''}
        <button class="ghost-button card-suppress" type="button">그만 보기</button>
      </div>
    </article>`;
}

function viewPredicate(candidate) {
  if (viewMode === 'verification') return ['duplicate_review', 'verification_needed', 'evidence_partial', 'stale', 'blocked'].includes(candidate.workflowState);
  if (viewMode === 'drafts') return ['strategy_ready', 'draft_ready', 'guardian_revise', 'guardian_pass'].includes(candidate.workflowState);
  return true;
}

function filterPredicate(candidate) {
  const value = els.filter.value;
  if (value === 'verification') return ['duplicate_review', 'verification_needed', 'evidence_partial', 'stale', 'blocked'].includes(candidate.workflowState);
  if (value === 'content') return ['evidence_ready', 'strategy_ready', 'draft_ready'].includes(candidate.workflowState);
  if (value === 'review') return ['guardian_revise', 'guardian_pass', 'approved'].includes(candidate.workflowState);
  return true;
}

function renderCandidates() {
  if (!today) return;
  const candidates = today.candidates.filter(viewPredicate).filter(filterPredicate);
  els.list.innerHTML = candidates.length
    ? candidates.map(cardTemplate).join('')
    : '<div class="empty-state">이 화면에서 지금 처리할 후보가 없습니다.<br />근거 기준을 낮춰 채우지 않습니다.</div>';
  renderSuppressed();
}

function suppressedCardTemplate(candidate) {
  const suppression = candidate.suppression ?? {};
  const driftNote = suppression.needsReDecision
    ? '<p class="blocker-line"><strong>재확인 필요:</strong> 제품 정보가 바뀌어 이 억제 규칙과 더 이상 일치하지 않습니다. 복원할지 결정해 주세요.</p>'
    : '';
  return `
    <article class="candidate-card suppressed-card" data-id="${escapeHtml(candidate.id)}">
      <div class="card-top">
        <div class="card-copy">
          <div class="card-meta"><span class="card-kicker">${escapeHtml(laneLabel(candidate.lane))}</span><span class="status-pill">억제됨</span></div>
          <h3>${escapeHtml(candidate.name)}</h3>
          <p><strong>억제 이유:</strong> ${escapeHtml(suppression.reason ?? '기록 없음')}</p>
          <p><strong>기준:</strong> ${escapeHtml(suppression.axis ?? '')} = ${escapeHtml(suppression.value ?? '')}</p>
        </div>
      </div>
      ${driftNote}
      <div class="card-actions">
        <button class="secondary-button card-restore" type="button">복원</button>
        <button class="ghost-button card-detail" type="button">상세 보기</button>
      </div>
    </article>`;
}

function renderSuppressed() {
  const suppressed = suppressedCandidates();
  els.excludedBlock.hidden = suppressed.length === 0;
  els.excludedList.innerHTML = suppressed.map(suppressedCardTemplate).join('');
}

function renderMetrics() {
  if (!today) return;
  document.querySelector('#metric-total').textContent = today.counters.observed;
  document.querySelector('#metric-ready').textContent = today.counters.recommended;
  document.querySelector('#metric-verification').textContent = today.counters.verificationNeeded + (today.counters.duplicateReview ?? 0);
  document.querySelector('#metric-approved').textContent = today.counters.approved;
  if (els.showcaseCountBadge) {
    els.showcaseCountBadge.textContent = today.showcaseCount ?? today.counters.approved ?? 0;
  }
}

function renderView() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const active = button.dataset.view === viewMode;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });

  if (viewMode === 'queue' || viewMode === 'performance') {
    els.inboxView.hidden = true;
    els.capabilityView.hidden = false;
    els.capabilityView.innerHTML = viewMode === 'queue'
      ? `<p class="section-kicker">Schedule &amp; Showcase</p><h2>자동 외부 게시는 꺼져 있으며, 승인 건은 공개 쇼케이스에 투영됩니다.</h2><p>승인된 후보는 닫힌 9필드 화이트리스트 검증을 통과한 뒤 <a href="/showcase" target="_blank" rel="noopener">/showcase 공개 디렉터리</a>에 #번호 카드로 게시됩니다. 스레드 자동 게시 및 댓글 봇은 비활성화 상태입니다.</p><div class="capability-list"><div class="capability-item"><strong>외부 자동 게시</strong><span>disabled (단일 루트 포스트 수동 운영)</span></div><div class="capability-item"><strong>서버 저장소</strong><span>${escapeHtml(today?.capability.persistence ?? 'loading')}</span></div></div>`
      : `<p class="section-kicker">Performance</p><h2>실제 게시 귀속 전에는 성과를 추정 학습하지 않습니다.</h2><p>클릭·정산 지표가 수집되기 전까지 허위 추천 점수를 만들지 않습니다. 제휴 순기여(ROI)는 검증 사실과 분리된 결정적 계산기로만 산출합니다.</p><div class="capability-list"><div class="capability-item"><strong>학습 상태</strong><span>측정 데이터 없음</span></div><div class="capability-item"><strong>외부 게시</strong><span>disabled</span></div></div>`;
    return;
  }

  els.inboxView.hidden = false;
  els.capabilityView.hidden = true;
  if (viewMode === 'verification') {
    els.viewKicker.textContent = 'Evidence';
    els.inboxTitle.textContent = '근거·유사 후보 확인이 필요한 후보';
    els.viewDescription.textContent = '점수가 높아도 중복 가능성·제품 일치·권리·승인 버전이 해결되지 않으면 여기 남습니다.';
  } else if (viewMode === 'drafts') {
    els.viewKicker.textContent = 'Drafts';
    els.inboxTitle.textContent = '전략·초안·Guardian 작업';
    els.viewDescription.textContent = '검증된 근거를 바탕으로 4개 전략과 4개 초안을 거쳐 사람 승인 전까지 진행합니다.';
  } else {
    els.viewKicker.textContent = 'Today';
    els.inboxTitle.textContent = '오늘의 Opportunity Inbox';
    els.viewDescription.textContent = '최대 5개 후보만 보여주고, 기회 점수와 근거·위험 상태를 분리해 표시합니다.';
  }
  renderCandidates();
}

function render() {
  renderMetrics();
  renderView();
  if (activeCandidateId && els.workspace.open) renderWorkspace();
  syncStudioVisibility();
}

async function loadToday() {
  const response = await fetch('/api/today', { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('서버 상태를 불러오지 못했습니다.');
  today = await response.json();
  render();
  if (isDesktopSplitMode() && !activeCandidateId && today?.candidates?.length > 0) {
    openWorkspace(today.candidates[0].id, { autoStep: true });
  }
}

const FIELD_LABELS = {
  name: '제품 이름', whyNow: '지금 다루는 이유', readerValue: '독자에게 주는 가치',
  axis: '억제 기준', reason: '이유', decision: '결정', text: '내용',
  draftId: '초안', ruleId: '억제 규칙', requestId: '요청 번호', command: '명령',
  mediaRights: '미디어 권리', personalUse: '실사용 여부', expiresAt: '만료 시각',
  affiliateNetwork: '제휴 프로그램'
};

const AXIS_LABELS = { product: '이 제품', brand: '이 브랜드', category: '이 카테고리', source: '이 출처' };

function josa(word, withFinal, withoutFinal) {
  const last = String(word ?? '').trim().slice(-1);
  const code = last.charCodeAt(0);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return withFinal;
  return (code - 0xac00) % 28 === 0 ? withoutFinal : withFinal;
}

const ERROR_MESSAGES = {
  invalid_input: (d) => {
    if (d?.allowed && d?.axis !== undefined) {
      return `억제 기준은 ${d.allowed.map((a) => AXIS_LABELS[a] ?? a).join(', ')} 중 하나여야 합니다.`;
    }
    const field = FIELD_LABELS[d?.field] ?? d?.field;
    if (!field) return '입력한 내용을 다시 확인해 주세요.';
    if (d.rule === 'maxCodePoints') return `스레드 단일 게시물 본문은 서두 고지를 포함해 ${d.max ?? 500}자 이내여야 합니다.`;
    if (d.rule === 'required') return `${field}${josa(field, '을', '를')} 입력해 주세요.`;
    if (d.rule === 'oneOf') return `${field}${josa(field, '은', '는')} ${(d.allowed ?? []).join(' 또는 ')} 중 하나여야 합니다.`;
    if (d.rule === 'timestamp') return `${field}${josa(field, '은', '는')} 날짜 형식이어야 합니다.`;
    return `${field}${josa(field, '을', '를')} 다시 확인해 주세요.`;
  },
  not_found: () => '대상을 찾을 수 없습니다. 화면을 새로고침해 주세요.',
  expected_revision_required: () => '화면이 오래되었습니다. 새로고침한 뒤 다시 시도해 주세요.',
  idempotency_key_reused: () => '같은 요청 번호로 다른 내용을 보냈습니다. 새로고침한 뒤 다시 시도해 주세요.',
  suppression_axis_empty: (d) =>
    `이 후보에는 ${AXIS_LABELS[d?.axis] ?? '선택한 기준'}에 해당하는 값이 없어 그 기준으로는 억제할 수 없습니다.`,
  not_suppressed: () => '이 후보는 지금 억제되어 있지 않습니다.',
  duplicate_review_required: () => '유사 후보를 먼저 확인해 주세요. 그 뒤에 진행할 수 있습니다.',
  duplicate_review_not_pending: () => '확인할 유사 후보가 없습니다.',
  evidence_not_ready: () => '근거가 아직 준비되지 않았습니다. 1단계에서 브랜드·모델·옵션과 두 곳의 출처를 확인해 주세요.',
  verifier_authority_missing: () => '제품 신원을 확인한 근거가 없습니다. 근거를 먼저 확인해 주세요.',
  strategy_not_ready: () => '전략 4개가 준비되어야 초안을 만들 수 있습니다.',
  draft_not_ready: () => '초안이 아직 준비되지 않았습니다.',
  guardian_gate: () => '최종 검수를 통과해야 승인할 수 있습니다.',
  stale_guardian: () => '검수 이후 내용이 바뀌었습니다. 검수를 다시 실행해 주세요.',
  stale_rebuild_required: () => '근거가 바뀌어 이후 결과가 오래되었습니다. 다시 만들어 주세요.',
  post_publish_monetization_locked: () => '무고지로 게시된 카드는 사후에 제휴 수익화를 켤 수 없습니다(BS-60). 새 후보로 등록해 주세요.',
  lock_requires_approved_non_commercial: () => '승인된 무고지 비수익화 후보만 BS-60 게시 잠금을 설정할 수 있습니다.',
  budget_exhausted: () => '이 후보의 현재 주기(epoch) 누적 호출·비용 예산 상한에 도달했습니다. 거절 후 새 주기로 재오픈해야 합니다.',
  reopen_requires_rejected_state: () => '거절된 후보만 새 예산 주기로 다시 열 수 있습니다.',
  global_kill_switch_active: () => '긴급 중단 스위치(Kill Switch)가 켜져 있어 변경 명령이 일시 정지되었습니다.',
  storage_lock_timeout: () => '다른 저장이 진행 중입니다. 잠시 후 다시 시도해 주세요.',
  payload_too_large: () => '보낸 내용이 너무 큽니다.',
  invalid_json: () => '요청 형식이 올바르지 않습니다.',
  route_not_allowed: () => '현재 단계에서 바로 실행할 수 없는 작업입니다.',
  route_authority_invalid: () => '이 작업을 수행할 권한 설정이 올바르지 않습니다.',
  specialist_unavailable: () => '담당 에이전트를 사용할 수 없습니다.',
  agent_registry_invalid: () => '에이전트 구성이 올바르지 않습니다.',
  unsupported_command: () => '지원하지 않는 명령입니다.',
  orchestrator_command_unknown: () => '지원하지 않는 명령입니다.'
};

function errorToKorean(result) {
  const build = ERROR_MESSAGES[result?.error];
  if (build) {
    try { return build(result.details ?? {}); } catch { /* fall through */ }
  }
  return '요청을 처리하지 못했습니다.';
}

async function sendCommand(command, { candidateId = null, expectedRevision = null, payload = {}, id = requestId(command) } = {}) {
  const response = await fetch('/api/commands', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ requestId: id, command, candidateId, expectedRevision, payload })
  });
  const result = await response.json();
  if (result.today) today = result.today;
  if (!response.ok) {
    render();
    if (response.status === 409 && result.error === 'version_conflict') {
      showToast('다른 화면에서 상태가 바뀌었습니다. 최신 버전으로 다시 불러왔습니다.');
      return { ok: false, conflict: true, result };
    }
    showToast(errorToKorean(result));
    return { ok: false, result };
  }
  render();
  return { ok: true, result };
}

function renderWorkspaceStatus(candidate) {
  const duplicateState = candidate.duplicateAssessment?.state;
  const rows = [
    ['기회 점수', `${candidate.opportunityScore}점`],
    ['근거', evidenceLabel(candidate.evidenceReadiness)],
    ['위험', riskLabel(candidate.riskLevel)],
    ['제품', exactLabel(candidate.exactMatchStatus)]
  ];
  if (duplicateState && duplicateState !== 'unique') rows.push(['중복', duplicateStateLabel(duplicateState)]);
  els.workspaceStatus.innerHTML = rows.map(([label, value]) => `<div class="status-tile"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}

function renderDuplicateReview(candidate) {
  const assessment = candidate.duplicateAssessment;
  const pending = candidate.workflowState === 'duplicate_review' && assessment?.state === 'possible_duplicate';
  els.duplicateReviewSection.hidden = !pending;
  document.querySelector('#duplicate-distinct').disabled = !pending;
  document.querySelector('#duplicate-suppress').disabled = !pending;
  if (!pending) {
    els.duplicateSummary.textContent = '';
    return;
  }

  const match = assessment.matchedCandidate ?? {};
  const identity = [match.brand, match.model, match.variant].filter(Boolean).join(' · ') || '세부 식별값 일부 없음';
  const score = Math.round(Number(assessment.similarity ?? 0) * 100);
  els.duplicateSummary.innerHTML = `
    <strong>${escapeHtml(match.name || '기존 후보')}</strong><br />
    ${escapeHtml(identity)}<br />
    <small>이름 유사도 ${escapeHtml(score)}% · 이 신호는 제품 동일성 검증이 아니라 반복 후보 방지용입니다. 같은 제품인지 애매하면 자동 병합하지 말고 서로 다른 제품으로 남긴 뒤 Verifier에서 모델·옵션을 확인하세요.</small>`;
}

function renderStrategies(candidate) {
  const angles = candidate.strategies?.angles ?? [];
  els.strategyList.innerHTML = angles.length
    ? angles.map((angle, index) => `<article class="strategy-card"><strong>${index + 1}. ${escapeHtml(angle.title)}</strong><p><b>훅:</b> ${escapeHtml(angle.hook)}</p><p><b>독자 약속:</b> ${escapeHtml(angle.readerPromise)}</p><p><b>한계:</b> ${escapeHtml(angle.limitation)}</p></article>`).join('')
    : '<div class="empty-state">1단계 근거 확인이 끝나면 서로 다른 전략 4개를 만들 수 있습니다.</div>';
}

function renderDrafts(candidate) {
  const drafts = candidate.drafts ?? [];
  els.draftList.innerHTML = drafts.length
    ? drafts.map((draft, index) => {
        const hasOffsetZeroDisclosure = draft.disclosure && String(draft.text ?? '').startsWith(draft.disclosure);
        return `
        <article class="draft-card ${candidate.selectedDraftId === draft.id ? 'selected' : ''}" data-draft-id="${escapeHtml(draft.id)}">
          <div class="draft-head">
            <label><input type="radio" name="active-draft" value="${escapeHtml(draft.id)}" ${candidate.selectedDraftId === draft.id || (!candidate.selectedDraftId && index === 0) ? 'checked' : ''} />${index + 1}. ${escapeHtml(draft.title)}</label>
            <span class="status-pill">${escapeHtml(angleLabel(draft.angleId))} · ${escapeHtml(String(draft.text ?? '').length)}자</span>
          </div>
          <textarea rows="5" data-draft-text="${escapeHtml(draft.id)}">${escapeHtml(draft.text)}</textarea>
          ${draft.disclosure ? `<p class="muted"><strong>${hasOffsetZeroDisclosure ? '✔ 오프셋 0 서두 고지 확인됨:' : '! 서두 고지 확인 필요:'}</strong> ${escapeHtml(draft.disclosure)}</p>` : ''}
        </article>`;
      }).join('')
    : '<div class="empty-state">전략 4개가 준비되면 바로 한국어 초안 4개를 생성해 비교할 수 있습니다.</div>';
}

function renderGuardian(candidate) {
  const guardian = candidate.guardian;
  if (!guardian) {
    els.guardianResult.className = 'review-result';
    els.guardianResult.textContent = '초안이 준비된 뒤 Guardian이 근거·체험 표현·서두 대가성 고지(오프셋 0)·한국어 번역투를 독립 검수합니다.';
    return;
  }
  els.guardianResult.className = `review-result ${guardian.decision}`;

  const checkLabels = {
    productMatchCheck: '제품 동일성',
    publicFigureClaimCheck: '공인 표현',
    rightsCheck: '미디어 권리',
    firstHandCheck: '체험 표현',
    affiliateDisclosureCheck: '제휴·대가성 고지',
    duplicationCheck: '중복',
    exaggerationCheck: '과장·문체',
    sensitiveClaimCheck: '민감 주장'
  };
  const symbols = { pass: '✔', warn: '!', block: '✕' };

  const nonOverridable = guardian.nonOverridableBlockers?.length
    ? `<p class="blocker-line"><strong>승인으로 넘길 수 없는 차단</strong></p><ul>${
        guardian.nonOverridableBlockers.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  const revisions = guardian.revisionRequests?.length
    ? `<ul>${guardian.revisionRequests.map((item) =>
        `<li><small>${escapeHtml(item.ruleId)}</small><br /><strong>${escapeHtml(item.problem)}</strong><br />${escapeHtml(item.requiredChange)}</li>`
      ).join('')}</ul>`
    : (guardian.blockers?.length ? `<ul>${guardian.blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '');

  const checks = guardian.checks
    ? `<div class="check-list">${Object.entries(checkLabels).map(([key, label]) => {
        const check = guardian.checks[key];
        if (!check) return '';
        return `<div class="check-row"><span>${symbols[check.status] ?? '·'}</span><span class="check-name">${label}</span><span>${escapeHtml(check.detail)}</span></div>`;
      }).join('')}</div>`
    : '';

  const warnings = guardian.warnings?.length ? `<p>${guardian.warnings.map(escapeHtml).join(' · ')}</p>` : '';
  const heading = guardian.decision === 'pass' ? 'Guardian 통과' : guardian.decision === 'block' ? 'Guardian 차단' : '수정 필요';
  els.guardianResult.innerHTML = `<strong>${heading}</strong>${nonOverridable}${revisions}${checks}${warnings}`;
}

function renderApproval(candidate) {
  const review = candidate.review;
  const duplicatePending = candidate.workflowState === 'duplicate_review';
  els.revisionLabel.textContent = `rev ${candidate.revision} · epoch ${candidate.lifecycleEpoch ?? 1}`;
  if (duplicatePending) {
    els.approvalBinding.textContent = '유사 후보 확인이 끝나기 전에는 보류·거절·승인을 포함한 다른 사람 결정을 적용하지 않습니다.';
  } else if (review) {
    els.approvalBinding.innerHTML = review.stale
      ? `<strong>기존 ${escapeHtml(review.decision)} 결정은 무효화됨</strong><br />${escapeHtml(review.staleReason || '상위 자료가 변경되었습니다.')}<br /><small>바인딩 해시: ${escapeHtml(review.boundMaterialRevision)}</small>`
      : `<strong>${escapeHtml(statusLabel(review.decision))} · ${escapeHtml(review.actor)}</strong><br />이 결정은 현재 자료 해시에 묶여 있습니다.<br /><small>${escapeHtml(review.boundMaterialRevision)}</small>`;
  } else {
    els.approvalBinding.textContent = candidate.guardian?.decision === 'pass'
      ? 'Guardian 통과 버전과 현재 자료 버전이 일치합니다. 승인하면 이 버전 해시에 결정이 묶이고 공개 쇼케이스(#번호)에 반영됩니다.'
      : 'Guardian 통과 전에는 승인할 수 없습니다. 보류·거절은 언제든 가능합니다.';
  }

  if (els.showcasePreviewBox) {
    if (candidate.workflowState === 'approved' && candidate.cardCode && candidate.showcaseProjected) {
      const numOnly = String(candidate.cardNumber ?? '');
      els.showcasePreviewBox.hidden = false;
      els.showcasePreviewBox.innerHTML = `
        <strong>공개 쇼케이스 게시됨 · ${escapeHtml(candidate.cardCode)}</strong><br />
        스레드 단일 본문에서 <code>프로필 쇼케이스 ${escapeHtml(candidate.cardCode)}</code>로 안내할 수 있습니다.<br />
        <a href="/showcase/${escapeHtml(numOnly)}" target="_blank" rel="noopener">소비자 쇼케이스 카드(${escapeHtml(candidate.cardCode)}) 열기 ↗</a>`;
    } else if (candidate.workflowState === 'approved' && !candidate.showcaseProjected) {
      els.showcasePreviewBox.hidden = false;
      els.showcasePreviewBox.innerHTML = `<strong>로컬 승인 완료 (쇼케이스 미투영)</strong><br />제휴를 켠 경우 https:// 도착 URL과 대가성 고지 원문이 모두 있어야 공개 쇼케이스에 노출됩니다.`;
    } else {
      els.showcasePreviewBox.hidden = true;
      els.showcasePreviewBox.textContent = '';
    }
  }

  if (els.reopenCandidate) {
    els.reopenCandidate.hidden = candidate.workflowState !== 'rejected';
    els.reopenCandidate.disabled = duplicatePending || candidate.workflowState !== 'rejected';
  }
  if (els.lockNonCommercial) {
    const showLock = candidate.workflowState === 'approved' && !candidate.affiliate && !candidate.lockedNonCommercialAfterPublish;
    els.lockNonCommercial.hidden = !showLock;
    els.lockNonCommercial.disabled = duplicatePending || !showLock;
  }

  document.querySelector('#approve-draft').disabled = duplicatePending || candidate.guardian?.decision !== 'pass' || candidate.guardian?.boundMaterialRevision !== candidate.materialRevision || candidate.review?.stale === true || candidate.workflowState === 'approved';
  document.querySelector('#hold-candidate').disabled = duplicatePending || candidate.workflowState === 'held';
  document.querySelector('#reject-candidate').disabled = duplicatePending || candidate.workflowState === 'rejected';
}

function renderWorkspace() {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) {
    closeWorkspaceDialog();
    return;
  }
  els.dialogTitle.textContent = `${candidate.cardCode ? `${candidate.cardCode} · ` : ''}${candidate.name}`;
  els.dialogSubtitle.textContent = `${candidate.synthetic ? '예시 데이터' : '사용자 제공'} · ${statusLabel(candidate.workflowState)} · 서버 rev ${candidate.revision}`;
  els.workspaceAlert.hidden = !candidate.topBlocker;
  els.workspaceAlert.textContent = candidate.topBlocker ?? '';
  renderWorkspaceStatus(candidate);
  renderDuplicateReview(candidate);

  els.evidenceBrand.value = candidate.brand;
  els.evidenceModel.value = candidate.model;
  els.evidenceVariant.value = candidate.variant;
  els.evidenceSource.value = candidate.sourceRef;
  els.evidenceSourceOrigin.value = candidate.sourceOrigin ?? '';
  els.evidenceCorroboration.value = candidate.corroborationRef ?? '';
  els.evidenceCorroborationOrigin.value = candidate.corroborationOrigin ?? '';
  els.evidenceSubstitute.checked = candidate.ownerDeclaredSubstitute === true;
  els.mediaRights.value = candidate.mediaRights;
  if (els.publishableMediaRow) {
    els.publishableMediaRow.hidden = !['owned', 'licensed'].includes(candidate.mediaRights);
  }
  if (els.publishableMediaUrl) els.publishableMediaUrl.value = candidate.publishableMediaUrl ?? '';
  els.personalUse.value = candidate.personalUse;
  els.affiliate.checked = candidate.affiliate;
  if (els.affiliateFields) els.affiliateFields.hidden = !candidate.affiliate;
  if (els.affiliateNetwork) els.affiliateNetwork.value = candidate.affiliateNetwork ?? '';
  if (els.affiliateState) els.affiliateState.value = candidate.affiliateMappingState ?? '';
  if (els.destinationUrl) els.destinationUrl.value = candidate.destinationUrl ?? '';
  if (els.verifiedLimitation) els.verifiedLimitation.value = candidate.verifiedLimitation ?? '';
  els.disclosure.value = candidate.disclosure;
  els.evidenceBasis.textContent = candidate.sourceMode === 'synthetic_fixture' ? '예시 근거' : '사용자 제공 · 네트워크 미검증';
  els.evidenceBasis.className = `status-pill ${candidate.evidenceReadiness === 'ready' ? 'ok' : 'warn'}`;

  renderStrategies(candidate);
  renderDrafts(candidate);
  renderGuardian(candidate);
  renderApproval(candidate);

  const duplicatePending = candidate.workflowState === 'duplicate_review';
  document.querySelector('#verify-evidence').disabled = duplicatePending;
  document.querySelector('#create-strategies').disabled = duplicatePending || !['verified', 'limited'].includes(candidate.verifierDecision);
  document.querySelector('#create-drafts').disabled = duplicatePending || candidate.strategies?.angles?.length !== 4;
  document.querySelector('#save-draft').disabled = duplicatePending || !candidate.drafts?.length;
  document.querySelector('#run-guardian').disabled = duplicatePending || candidate.drafts?.length !== 4;
}

function openWorkspace(candidateId, { autoStep = true } = {}) {
  activeCandidateId = candidateId;
  const candidate = candidateById(candidateId);
  if (autoStep && candidate) {
    setStudioStep(recommendedStepFor(candidate));
  }
  if (isDesktopSplitMode()) {
    if (!els.workspace.open) els.workspace.setAttribute('open', '');
  } else if (!els.workspace.open) {
    els.workspace.showModal();
  }
  renderWorkspace();
  renderCandidates();
  syncStudioVisibility();
}

async function runCandidateAction(candidate, action) {
  if (action === 'open_workspace') return openWorkspace(candidate.id, { autoStep: true });
  const command = action;
  const result = await sendCommand(command, { candidateId: candidate.id, expectedRevision: candidate.revision });
  if (result.ok) {
    showToast({ request_strategies: '전략 4개를 만들었습니다.', request_drafts: '초안 4개를 만들었습니다.', run_guardian: 'Guardian 검수를 완료했습니다.' }[command] ?? '처리했습니다.');
    openWorkspace(candidate.id, { autoStep: true });
  }
}

document.querySelectorAll('.step-tab').forEach((tab) => {
  tab.addEventListener('click', () => setStudioStep(Number(tab.dataset.step)));
});

document.querySelector('#jump-to-guardian')?.addEventListener('click', () => setStudioStep(3));

els.mediaRights?.addEventListener('change', () => {
  if (els.publishableMediaRow) {
    els.publishableMediaRow.hidden = !['owned', 'licensed'].includes(els.mediaRights.value);
  }
});

els.affiliate?.addEventListener('change', () => {
  if (els.affiliateFields) els.affiliateFields.hidden = !els.affiliate.checked;
  if (els.affiliate.checked && !els.disclosure.value.trim() && els.affiliateNetwork?.value) {
    els.disclosure.value = STANDARD_DISCLOSURES[els.affiliateNetwork.value] ?? '';
  }
});

els.affiliateNetwork?.addEventListener('change', () => {
  const net = els.affiliateNetwork.value;
  if (net && (!els.disclosure.value.trim() || Object.values(STANDARD_DISCLOSURES).includes(els.disclosure.value.trim()))) {
    els.disclosure.value = STANDARD_DISCLOSURES[net] ?? '';
  }
});

document.querySelectorAll('.preset-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const whyEl = document.querySelector('#quick-why-now');
    const valEl = document.querySelector('#quick-reader-value');
    if (whyEl && chip.dataset.why) whyEl.value = chip.dataset.why;
    if (valEl && chip.dataset.value) valEl.value = chip.dataset.value;
  });
});

els.list.addEventListener('click', async (event) => {
  const card = event.target.closest('.candidate-card');
  if (!card) return;
  const candidate = candidateById(card.dataset.id);
  if (!candidate) return;
  if (event.target.closest('.card-primary')) {
    await runCandidateAction(candidate, event.target.closest('.card-primary').dataset.action);
  } else if (event.target.closest('.card-hold')) {
    const result = await sendCommand('review_decision', { candidateId: candidate.id, expectedRevision: candidate.revision, payload: { decision: 'held' } });
    if (result.ok) showToast('후보를 보류했습니다.');
  } else if (event.target.closest('.card-suppress')) {
    openSuppressDialog(candidate);
  } else if (isDesktopSplitMode() && !event.target.closest('button')) {
    openWorkspace(candidate.id, { autoStep: true });
  }
});

els.excludedList.addEventListener('click', async (event) => {
  const card = event.target.closest('.candidate-card');
  if (!card) return;
  const candidate = candidateById(card.dataset.id);
  if (!candidate) return;
  if (event.target.closest('.card-restore')) {
    const result = await sendCommand('restore_candidate', {
      candidateId: candidate.id,
      expectedRevision: candidate.revision,
      payload: {}
    });
    if (result.ok) showToast('후보를 복원했습니다. 억제 규칙은 그대로 남아 있습니다.');
  } else if (event.target.closest('.card-detail')) {
    openWorkspace(candidate.id, { autoStep: true });
  }
});

let suppressTargetId = null;

function openSuppressDialog(candidate) {
  suppressTargetId = candidate.id;
  els.suppressTarget.textContent = `${candidate.name} — 이 후보를 첫 화면에서 내립니다. 삭제가 아니라 되돌릴 수 있는 억제입니다.`;
  els.suppressReason.value = '';
  els.suppressAxis.value = 'product';
  els.suppressDialog.showModal();
}

els.suppressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const candidate = candidateById(suppressTargetId);
  if (!candidate) return;
  const reason = els.suppressReason.value.trim();
  if (!reason) {
    showToast('억제 이유는 반드시 입력해야 합니다.');
    return;
  }
  const result = await sendCommand('suppress_candidate', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: { axis: els.suppressAxis.value, reason }
  });
  if (result.ok) {
    els.suppressDialog.close();
    showToast('이런 후보는 앞으로 첫 화면에 올리지 않습니다.');
  }
});

els.candidateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(els.candidateForm);
  const payload = Object.fromEntries(formData.entries());
  payload.affiliate = formData.has('affiliate');
  const result = await sendCommand('add_manual_candidate', { payload });
  if (result.ok) {
    els.candidateForm.reset();
    els.candidateDialog.close();
    viewMode = 'today';
    render();

    if (result.result.result === 'candidate_duplicate_suppressed') {
      showToast('같은 브랜드·모델·옵션 후보가 이미 있어 새 후보를 만들지 않았습니다.');
    } else if (result.result.result === 'candidate_added_possible_duplicate') {
      showToast('비슷한 기존 후보가 있습니다. 같은 제품인지 먼저 확인하세요.');
      if (candidateById(result.result.candidateId)) openWorkspace(result.result.candidateId, { autoStep: true });
    } else {
      showToast('제품 후보를 추가했습니다. 다음 단계는 근거 확인입니다.');
      if (result.result.candidateId && candidateById(result.result.candidateId)) {
        openWorkspace(result.result.candidateId, { autoStep: true });
      }
    }
    document.querySelector('#inbox-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

async function resolveDuplicate(decision) {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('resolve_duplicate', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: { decision }
  });
  if (!result.ok) return;
  if (decision === 'duplicate') {
    showToast('중복 후보로 억제했습니다. 기록은 서버 감사 상태에 남습니다.');
  } else {
    showToast('서로 다른 제품으로 확인했습니다. 이제 근거 확인을 진행할 수 있습니다.');
    renderWorkspace();
  }
}

document.querySelector('#duplicate-distinct').addEventListener('click', () => resolveDuplicate('distinct'));
document.querySelector('#duplicate-suppress').addEventListener('click', () => resolveDuplicate('duplicate'));

els.evidenceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const formData = new FormData(els.evidenceForm);
  const payload = Object.fromEntries(formData.entries());
  payload.affiliate = els.affiliate.checked;
  payload.ownerDeclaredSubstitute = els.evidenceSubstitute.checked;
  const result = await sendCommand('request_verification', { candidateId: candidate.id, expectedRevision: candidate.revision, payload });
  if (!result.ok) return;

  if (result.result.result === 'candidate_duplicate_suppressed') {
    showToast('근거 수정으로 기존 후보와 브랜드·모델·옵션이 같아져 중복 후보로 억제했습니다.');
    return;
  }

  const updated = candidateById(candidate.id);
  if (!updated) return;
  if (updated.workflowState === 'duplicate_review') {
    showToast('제품 식별값이 바뀌어 유사 후보 확인이 다시 필요합니다.');
    setStudioStep(1);
  } else if (updated.evidenceReadiness === 'ready') {
    showToast('근거 확인 완료. 2단계 전략·초안 탭으로 이동합니다.');
    setStudioStep(2);
  } else {
    showToast('근거가 아직 부족합니다. 막힌 이유를 확인하세요.');
  }
  renderWorkspace();
});

document.querySelector('#create-strategies').addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('request_strategies', { candidateId: candidate.id, expectedRevision: candidate.revision });
  if (result.ok) { showToast('서로 다른 전략 4개를 만들었습니다.'); renderWorkspace(); }
});

document.querySelector('#create-drafts').addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('request_drafts', { candidateId: candidate.id, expectedRevision: candidate.revision });
  if (result.ok) { showToast('전략과 1:1로 연결된 초안 4개를 만들었습니다.'); renderWorkspace(); }
});

document.querySelector('#save-draft').addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate?.drafts?.length) return;
  const selected = els.draftList.querySelector('input[name="active-draft"]:checked');
  const draftId = selected?.value ?? candidate.selectedDraftId ?? candidate.drafts[0].id;
  const textarea = els.draftList.querySelector(`textarea[data-draft-text="${CSS.escape(draftId)}"]`);
  const result = await sendCommand('edit_draft', { candidateId: candidate.id, expectedRevision: candidate.revision, payload: { draftId, text: textarea?.value ?? '' } });
  if (result.ok) { showToast('초안 변경을 서버에 저장했습니다. Guardian 검수는 다시 필요합니다.'); renderWorkspace(); }
});

els.draftList.addEventListener('change', (event) => {
  if (!event.target.matches('input[name="active-draft"]')) return;
  els.draftList.querySelectorAll('.draft-card').forEach((card) => card.classList.toggle('selected', card.dataset.draftId === event.target.value));
});

document.querySelector('#run-guardian').addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('run_guardian', { candidateId: candidate.id, expectedRevision: candidate.revision });
  if (result.ok) {
    const updated = candidateById(candidate.id);
    showToast(updated.guardian?.decision === 'pass' ? 'Guardian 검수를 통과했습니다. 이제 승인할 수 있습니다.' : '수정 또는 차단 사유가 있습니다.');
    setStudioStep(3);
    renderWorkspace();
  }
});

async function decide(decision) {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('review_decision', { candidateId: candidate.id, expectedRevision: candidate.revision, payload: { decision } });
  if (result.ok) {
    const updated = candidateById(candidate.id);
    const cardNotice = decision === 'approved' && updated?.cardCode ? ` 공개 쇼케이스 ${updated.cardCode}번으로 반영되었습니다.` : '';
    showToast({
      approved: `이 버전을 승인했습니다.${cardNotice} 외부 자동 게시는 꺼져 있습니다.`,
      held: '보류했습니다.',
      rejected: '거절했습니다.'
    }[decision]);
    renderWorkspace();
  }
}

document.querySelector('#approve-draft').addEventListener('click', () => decide('approved'));
document.querySelector('#hold-candidate').addEventListener('click', () => decide('held'));
document.querySelector('#reject-candidate').addEventListener('click', () => decide('rejected'));

els.reopenCandidate?.addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('reopen_rejected_candidate', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: {}
  });
  if (result.ok) {
    showToast('거절 후보를 새 예산 주기(epoch)로 다시 열었습니다.');
    setStudioStep(1);
    renderWorkspace();
  }
});

els.lockNonCommercial?.addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('lock_non_commercial_showcase', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: {}
  });
  if (result.ok) {
    showToast('무고지 비수익화 게시물로 영구 잠갔습니다(BS-60). 사후 제휴 링크 추가가 차단됩니다.');
    renderWorkspace();
  }
});

document.querySelector('#open-add-candidate').addEventListener('click', () => els.candidateDialog.showModal());
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.closeDialog === 'workspace-dialog') {
    closeWorkspaceDialog();
  } else {
    document.querySelector(`#${button.dataset.closeDialog}`)?.close();
  }
}));

els.filter.addEventListener('change', renderCandidates);
document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => {
  viewMode = button.dataset.view;
  if (viewMode === 'verification') els.filter.value = 'all';
  if (viewMode === 'drafts') els.filter.value = 'all';
  renderView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

document.querySelector('#reset-demo').addEventListener('click', async () => {
  if (!confirm('서버에 저장된 로컬 상태를 예시 초기값으로 되돌릴까요?')) return;
  const result = await sendCommand('reset_demo');
  if (result.ok) {
    closeWorkspaceDialog();
    showToast('서버 예시 상태를 초기화했습니다.');
  }
});

loadToday().catch((error) => {
  els.list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br />서버가 실행 중인지 확인해 주세요.</div>`;
});
