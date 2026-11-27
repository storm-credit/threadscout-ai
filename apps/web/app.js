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
  seller: document.querySelector('#evidence-seller'),
  destinationUrl: document.querySelector('#evidence-destination-url'),
  verifiedLimitation: document.querySelector('#evidence-limitation'),
  disclosure: document.querySelector('#disclosure'),
  evidenceBasis: document.querySelector('#evidence-basis'),
  strategyList: document.querySelector('#strategy-list'),
  draftList: document.querySelector('#draft-list'),
  guardianResult: document.querySelector('#guardian-result'),
  approvalBinding: document.querySelector('#approval-binding'),
  showcasePreviewBox: document.querySelector('#showcase-preview-box'),
  approvedOperatorBox: document.querySelector('#approved-operator-box'),
  copyRootPost: document.querySelector('#copy-root-post'),
  copyShowcaseMd: document.querySelector('#copy-showcase-md'),
  scheduleDatetime: document.querySelector('#schedule-datetime'),
  schedulePostBtn: document.querySelector('#schedule-post-btn'),
  recordManualPublishBtn: document.querySelector('#record-manual-publish-btn'),
  provenanceList: document.querySelector('#provenance-list'),
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

function scheduleStatusLabel(status) {
  return {
    scheduled: '예약됨',
    preflight: '사전점검 중',
    ready: '사전점검 통과',
    dispatching: '발송 중',
    published: '수동 게시 완료',
    held: '보류됨',
    cancelled: '취소됨',
    failed: '실패',
    unknown_remote_state: '원격 확인 필요',
    invalidated: '승인 무효화됨',
    expired: '근거 기한 만료'
  }[status] ?? status;
}

function scheduleStatusClass(status) {
  if (status === 'ready' || status === 'published') return 'ok';
  if (status === 'scheduled' || status === 'held') return 'info';
  if (status === 'unknown_remote_state') return 'warn';
  return 'danger';
}

function confidenceTierLabel(tier) {
  return {
    unknown: '데이터 없음 (unknown)',
    observation: '단순 관찰 (1~2건 · 인과 단정 금지)',
    correlation_hypothesis: '상관 가설 (3~4건 · 추가 검증 필요)',
    sufficient_repeated_signal: '반복 검증 신호 (5건 이상 무위반)'
  }[tier] ?? tier;
}

async function loadPreflightIntoView() {
  try {
    const res = await fetch('/api/preflight', { headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const p = data.preflight;
    const mount = document.querySelector('#preflight-mount');
    if (!p || viewMode !== 'queue' || !mount) return;

    const readyHtml = (p.localReadyNow ?? []).map((item) => `
      <div class="capability-item">
        <strong>✔ ${escapeHtml(item.nameKo)}</strong>
        <span>${escapeHtml(item.summaryKo)}</span>
      </div>`).join('');

    const gatesHtml = (p.liveApiGates ?? []).map((gate) => `
      <div class="capability-item">
        <strong>🔒 ${escapeHtml(gate.nameKo)} · ${gate.readyForLiveExecution ? '실행 가능' : '잠김 (수동 승인 전)'}</strong>
        <span>${(gate.blockers ?? []).map(escapeHtml).join(' · ')}</span>
      </div>`).join('');

    mount.innerHTML = `
      <p class="section-kicker" style="margin-top:22px;">Live Activation Preflight</p>
      <h2>실연동 사전 점검표 및 단일 포스트 게시 안전 게이트</h2>
      <p>현재 바로 상업 운영 가능한 <strong>수동 링크 + <a href="/showcase" target="_blank" rel="noopener">/showcase 공개 쇼케이스</a></strong> 경로와, 키·심사 승인 후 열 수 있는 외부 실시간 API 게이트를 구분해 보여줍니다(시크릿 원문 미노출, <code>reply_to_id</code> 자동 댓글 코드 차단 완료).</p>
      <h3 class="section-heading" style="margin-top:14px;">지금 바로 사용 가능한 상업·검증 경로 (API 키 불필요)</h3>
      <div class="capability-list">${readyHtml}</div>
      <h3 class="section-heading" style="margin-top:16px;">외부 실시간 API 잠금 상태 (프리플라이트 체크리스트)</h3>
      <div class="capability-list">${gatesHtml}</div>`;
  } catch {
    /* keep static fallback */
  }
}

function formatSeoulDatetime(value) {
  if (!value) return '-';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return String(value);
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(parsed));
  } catch {
    return String(value);
  }
}

function renderQueueSectionHtml() {
  const queue = today?.queue ?? [];
  const queueCards = queue.length
    ? queue.map((item) => {
        const active = ['scheduled', 'held', 'ready'].includes(item.status);
        const freshnessText = item.evidenceFreshness === 'fresh' ? '신선함' : item.evidenceFreshness === 'aging' ? '만료 임박' : '기한 초과';
        const reasonLine = item.invalidationReason
          ? `<p class="blocker-line"><strong>사유:</strong> ${escapeHtml(item.invalidationReason)}</p>`
          : '';
        const noteLine = item.publishedNote
          ? `<p class="muted"><strong>게시 메모:</strong> ${escapeHtml(item.publishedNote)}</p>`
          : '';
        return `
          <article class="queue-card" data-schedule-id="${escapeHtml(item.scheduleId)}" data-candidate-id="${escapeHtml(item.candidateId)}">
            <div class="card-meta">
              <span class="card-kicker">${item.cardCode ? `쇼케이스 ${escapeHtml(item.cardCode)} · ` : ''}${escapeHtml(item.draftId)}</span>
              <span class="status-pill ${scheduleStatusClass(item.status)}">${escapeHtml(scheduleStatusLabel(item.status))}</span>
              <span class="status-pill">${item.affiliate ? '제휴 고지 포함' : '비수익 정보성'}</span>
            </div>
            <h3>${escapeHtml(item.candidateName)}</h3>
            <p class="muted">예정 시각: <strong>${escapeHtml(formatSeoulDatetime(item.desiredLocalDatetime))}</strong> (${escapeHtml(item.timezone || 'Asia/Seoul')}) · 근거 상태: ${escapeHtml(freshnessText)} · 외부 자동 게시: 꺼짐(단일 루트 포스트)</p>
            ${reasonLine}
            ${noteLine}
            <div class="copy-actions-row">
              ${active ? `
                <button type="button" class="secondary-button" data-queue-action="preflight">발송 전 사전점검</button>
                <button type="button" class="primary-button" data-queue-action="publish">수동 게시 완료</button>
                <button type="button" class="ghost-button danger-text" data-queue-action="cancel">예약 취소</button>
              ` : ''}
              <button type="button" class="ghost-button" data-queue-action="open">검토 스튜디오 열기</button>
            </div>
          </article>`;
      }).join('')
    : '<div class="empty-state">아직 등록된 로컬 게시 일정이 없습니다.<br />후보를 승인한 뒤 우측(또는 하단) 3단계 스튜디오에서 예약 대기열에 등록하거나 수동 게시 완료를 기록하세요.</div>';

  return `
    <p class="section-kicker">Schedule Queue · S07</p>
    <h2>승인 포스트 로컬 대기열 및 발송 전 무결성 재점검</h2>
    <p>사람 승인 해시(<code>approvalHash</code>)가 묶인 단일 루트 포스트만 대기열에 들어오며, 상위 근거·초안·제휴 도착지가 바뀌면 자동으로 <strong>무효화(invalidated)</strong>됩니다.</p>
    <div class="queue-list">${queueCards}</div>
    <div id="preflight-mount" style="margin-top:18px;">
      <p class="muted">실연동 프리플라이트 점검표를 불러오는 중입니다...</p>
    </div>`;
}

function renderPerformanceSectionHtml() {
  const analytics = today?.analytics ?? {
    confidence: 'unknown',
    minimumSampleNote: '최소 5건의 무위반 표본이 쌓이기 전까지 인과관계로 단정하지 않습니다.',
    portfolio: { totalSnapshots: 0, affiliateShare: 0, excessiveAffiliateFrequency: false, guardianBlockedCandidates: 0 },
    totals: { views: 0, likes: 0, replies: 0, saves: 0, purchaseQuestionReplies: 0, outboundClicks: 0, conversions: 0, netSettledCommissionKrw: 0, runTokenCostKrw: 0, netContributionKrw: 0, cleanSnapshotCount: 0, quarantinedSnapshotCount: 0 },
    strongRepeatedPatterns: [],
    weakHypotheses: [],
    failedPatterns: [],
    recommendedExperiments: [],
    recentSnapshots: []
  };
  const t = analytics.totals ?? {};
  const p = analytics.portfolio ?? {};
  const eligibleCandidates = [
    ...(today?.candidates ?? []),
    ...(today?.excluded ?? [])
  ].filter((c) => c.workflowState === 'approved' || (c.schedules ?? []).some((s) => s.status === 'published'));

  const candidateOptions = eligibleCandidates.length
    ? eligibleCandidates.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.cardCode ? `${c.cardCode} · ` : '')}${escapeHtml(c.name)} (${c.affiliate ? '제휴' : '비수익'})</option>`).join('')
    : '<option value="">승인 또는 수동 게시된 후보가 필요합니다</option>';

  const renderPatternItems = (items, emptyMsg) => items?.length
    ? items.map((item) => `
        <div class="capability-item">
          <strong>${escapeHtml(item.patternKey)}${item.promotionBlocked ? ' · 승격 차단(AT-12)' : ''}</strong>
          <span>${escapeHtml(item.summaryKo)}</span>
        </div>`).join('')
    : `<div class="empty-state">${escapeHtml(emptyMsg)}</div>`;

  const expHtml = analytics.recommendedExperiments?.length
    ? analytics.recommendedExperiments.map((exp) => `
        <div class="capability-item">
          <strong>단일 변수 실험 · ${escapeHtml(exp.variableChanged)}</strong>
          <span>${escapeHtml(exp.hypothesisKo)}</span>
        </div>`).join('')
    : '<div class="empty-state">표본이 기록되면 왜곡 없는 단일 변수 실험을 제안합니다.</div>';

  return `
    <p class="section-kicker">Performance &amp; Guardrailed Learning · S08</p>
    <h2>성과 · 결정적 순기여(ROI) · 안전 학습 요약</h2>
    <p>허영 조회수 순위표 대신 <strong>관심 · 구매의도 · 순기여(수수료−토큰비용) · 신뢰 안전(AT-12)</strong> 4축을 분리합니다. 루머·셀럽 암시·고지 누락 게시물은 조회수가 아무리 높아도 추천 패턴에서 영구 격리됩니다.</p>

    <div class="analytics-kpi-grid" aria-label="성과 핵심 지표">
      <div class="analytics-kpi"><span>관심 (조회 / 반응)</span><strong>${Number(t.views ?? 0).toLocaleString('ko-KR')} / ${Number((t.likes ?? 0) + (t.replies ?? 0)).toLocaleString('ko-KR')}</strong></div>
      <div class="analytics-kpi"><span>구매 의도 (저장·질문·클릭)</span><strong>${Number((t.saves ?? 0) + (t.purchaseQuestionReplies ?? 0) + (t.outboundClicks ?? 0)).toLocaleString('ko-KR')}건</strong></div>
      <div class="analytics-kpi"><span>순기여 ROI (정산−토큰)</span><strong>₩${Number(t.netContributionKrw ?? 0).toLocaleString('ko-KR')}</strong></div>
      <div class="analytics-kpi"><span>무위반 / 안전격리(AT-12)</span><strong>${Number(t.cleanSnapshotCount ?? 0)}건 / ${Number(t.quarantinedSnapshotCount ?? 0)}건</strong></div>
    </div>

    <div class="analytics-note">
      <strong>현재 학습 신뢰도:</strong> ${escapeHtml(confidenceTierLabel(analytics.confidence))} · 제휴 비중 ${Math.round(Number(p.affiliateShare ?? 0) * 100)}%${p.excessiveAffiliateFrequency ? ' (⚠ 70% 초과 — 정보성 비중 보강 필요)' : ''} · Guardian 차단 ${Number(p.guardianBlockedCandidates ?? 0)}건 · 오너 거절 ${Number(p.ownerRejectedCandidates ?? 0)}건<br />
      ${escapeHtml(analytics.minimumSampleNote)}
    </div>

    <details class="detail-accordion" ${eligibleCandidates.length ? 'open' : ''}>
      <summary>게시 성과 · 정산 순기여(ROI) 스냅샷 수동 기록</summary>
      <form id="outcome-form" class="form-stack accordion-inner">
        <div class="field-grid">
          <label>대상 승인/게시 후보
            <select id="outcome-candidate-id" name="candidateId" required>${candidateOptions}</select>
          </label>
          <label>집계 구간
            <select name="window">
              <option value="24h">게시 후 24시간 스냅샷</option>
              <option value="7d">게시 후 7일 안정화 스냅샷</option>
              <option value="manual">수시 점검 기록</option>
            </select>
          </label>
        </div>
        <div class="field-grid">
          <label>조회수 (views)<input name="views" type="number" min="0" value="1200" /></label>
          <label>저장/북마크 (saves)<input name="saves" type="number" min="0" value="35" /></label>
        </div>
        <div class="field-grid">
          <label>좋아요 (likes)<input name="likes" type="number" min="0" value="48" /></label>
          <label>일반 댓글 (replies)<input name="replies" type="number" min="0" value="11" /></label>
        </div>
        <div class="field-grid">
          <label>구매처·제품 질문 댓글<input name="purchaseQuestionReplies" type="number" min="0" value="8" /></label>
          <label>쇼케이스/링크 클릭<input name="outboundClicks" type="number" min="0" value="42" /></label>
        </div>
        <div class="field-grid">
          <label>제휴 구매 전환수<input name="conversions" type="number" min="0" value="3" /></label>
          <label>상품 단가 (₩)<input name="unitPriceKrw" type="number" min="0" value="29000" /></label>
        </div>
        <div class="field-grid">
          <label>수수료율 (예: 0.08 = 8%)<input name="commissionRate" type="number" step="0.01" min="0" max="1" value="0.08" /></label>
          <label>예상 반품·취소율 (예: 0.08)<input name="returnRate" type="number" step="0.01" min="0" max="1" value="0.08" /></label>
        </div>
        <div class="field-grid">
          <label>게시 후 사실 정정·삭제 횟수<input name="postCorrections" type="number" min="0" value="0" /></label>
          <label>부정 피드백·숨김·신고 수<input name="negativeFeedback" type="number" min="0" value="0" /></label>
        </div>
        <div class="checkbox-grid" aria-label="신뢰·안전 위반 체크 (AT-12 격리 기준)">
          <label class="checkbox-row"><input type="checkbox" name="rumorHook" /><span>루머·사생활 훅 포함</span></label>
          <label class="checkbox-row"><input type="checkbox" name="endorsementImplication" /><span>미검증 셀럽 추천 암시</span></label>
          <label class="checkbox-row"><input type="checkbox" name="hiddenDisclosure" /><span>대가성 고지 누락·은닉</span></label>
          <label class="checkbox-row"><input type="checkbox" name="productMismatch" /><span>실제 상품·옵션 불일치</span></label>
          <label class="checkbox-row"><input type="checkbox" name="policyViolation" /><span>플랫폼·공정위 정책 위반</span></label>
        </div>
        <button type="submit" class="primary-button" ${eligibleCandidates.length ? '' : 'disabled'}>성과 스냅샷 기록 및 순기여 계산</button>
      </form>
    </details>

    <div class="analytics-section-stack">
      <h3 class="section-heading" style="margin-top:16px;">검증된 반복 패턴 (무위반 5건 이상)</h3>
      <div class="capability-list">${renderPatternItems(analytics.strongRepeatedPatterns, '아직 5건 이상 누적된 무위반 반복 패턴이 없습니다.')}</div>

      <h3 class="section-heading" style="margin-top:14px;">관찰 및 초기 상관 가설 (1~4건 또는 제휴 상한 보류)</h3>
      <div class="capability-list">${renderPatternItems(analytics.weakHypotheses, '기록된 초기 가설이 없습니다.')}</div>

      <h3 class="section-heading" style="margin-top:14px;">승격 영구 차단 · 실패 패턴 (AT-12 안전 가드레일)</h3>
      <div class="capability-list">${renderPatternItems(analytics.failedPatterns, '신뢰·정책 위반으로 격리된 패턴이 없습니다.')}</div>

      <h3 class="section-heading" style="margin-top:14px;">추천 단일 변수 실험 (1-Variable Experiments)</h3>
      <div class="capability-list">${expHtml}</div>
    </div>`;
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
    if (viewMode === 'queue') {
      els.capabilityView.innerHTML = renderQueueSectionHtml();
      loadPreflightIntoView();
    } else {
      els.capabilityView.innerHTML = renderPerformanceSectionHtml();
    }
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
  affiliateNetwork: '제휴 프로그램', seller: '판매자', scheduleId: '예약 번호', desiredLocalDatetime: '예약 시각'
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
  candidate_suppressed: () => '사용자가 억제한 후보는 복원하기 전까지 승인·예약·게시할 수 없습니다.',
  unapproved_draft_selection: () => '승인할 때 바인딩된 초안과 다른 초안은 예약하거나 게시할 수 없습니다. 원하는 초안을 선택한 뒤 다시 검수·승인해 주세요.',
  approval_already_consumed: () => '이 승인 버전은 이미 예약되었거나 게시 처리되었습니다. 재예약하려면 기존 예약을 취소하거나 새로 검수·승인하세요.',
  approval_required: () => '유효한 사람 승인이 완료된 후보만 예약하거나 게시 기록할 수 있습니다.',
  guardian_pass_required: () => 'Guardian 검수 통과 상태여야 예약할 수 있습니다.',
  stale_approval_hash: () => '승인 이후 자료 해시가 변경되었습니다. 다시 Guardian 검수 및 승인을 진행해 주세요.',
  media_rights_required: () => '게시 허용 미디어 권리가 확인되어야 예약할 수 있습니다.',
  invalid_image_url: () => '게시 이미지 URL은 올바른 https:// 주소여야 합니다.',
  post_length_exceeded: () => '단일 루트 포스트 본문이 500자를 초과했습니다.',
  evidence_ttl_expired: () => '근거 확인 시점이 신선도 유효기간을 넘겼습니다. 1단계에서 근거를 다시 검증해 주세요.',
  invalid_schedule_time: () => '올바른 게시 예정 시각을 입력해 주세요.',
  invalid_affiliate_mapping: () => '제휴 매핑 정보(판매자·도착 URL·교차 출처·고지문)를 다시 확인해 주세요.',
  guardian_entry_precondition_failed: () => '선택한 초안이 서두 대가성 고지(오프셋 0) 또는 검수 조건을 충족하지 못했습니다.',
  cannot_cancel_non_active_or_dispatching: () => '진행 전 대기 상태(예약됨·사전점검 통과·보류)인 일정만 취소할 수 있습니다.',
  terminal_schedule_requires_new_review: () => '무효화·취소·만료된 일정은 다시 실행할 수 없습니다. 재검수 후 새로 승인해 주세요.',
  approval_invalidated: () => '승인 버전 또는 상위 근거가 변경되어 일정이 무효화되었습니다.',
  media_rights_invalidated: () => '미디어 사용 권리가 변경되어 일정이 무효화되었습니다.',
  destination_drift_invalidated: () => '제휴 도착 페이지 상품·옵션·판매자가 변경되어 일정이 무효화되었습니다(AT-44).',
  content_hash_mismatch: () => '초안 또는 도착 링크 해시가 승인 시점과 달라져 일정이 무효화되었습니다.',
  preflight_solicitation_or_guardian_drift: () => '공개 쇼케이스 수익화 상태 변경 등으로 서두 고지 조건을 다시 충족해야 합니다.',
  already_published: () => '이미 게시 완료로 기록된 일정입니다.',
  reconciliation_required: () => '원격 게시 상태가 불확실하여 중복 발송이 잠겨 있습니다. 원격 존재 여부를 먼저 확인해야 합니다.',
  schedule_not_found: () => '해당 후보의 예약 일정을 찾을 수 없습니다.',
  publication_or_approval_required_for_outcome: () => '승인되었거나 게시 완료된 후보에만 성과 스냅샷을 기록할 수 있습니다.',
  kill_switch_active: () => '긴급 중단 스위치(Kill Switch)가 켜져 있어 예약·게시 작업이 일시 정지되었습니다.',
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

  if (els.approvedOperatorBox) {
    const cleanApproved =
      candidate.workflowState === 'approved'
      && candidate.review?.stale !== true
      && candidate.suppression?.active !== true;
    els.approvedOperatorBox.hidden = !cleanApproved;
    if (els.copyRootPost) els.copyRootPost.disabled = !candidate.exportBundle?.singleRootPostCopyText;
    if (els.copyShowcaseMd) els.copyShowcaseMd.disabled = !candidate.exportBundle?.showcaseMarkdown;
    if (els.scheduleDatetime && !els.scheduleDatetime.value) {
      const nextHour = new Date(Date.now() + 60 * 60 * 1000);
      nextHour.setMinutes(0, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      els.scheduleDatetime.value = `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`;
    }
  }

  if (els.provenanceList) {
    const stages = candidate.provenance ?? [];
    const stageSymbols = { ok: '✔', warn: '!', danger: '✕', pending: '·' };
    els.provenanceList.innerHTML = stages.map((st) => {
      if (!st.present) {
        return `<div class="provenance-row"><strong>· ${escapeHtml(st.labelKo)}</strong><span class="muted">아직 생성되지 않음</span></div>`;
      }
      const sym = stageSymbols[st.status] ?? '✔';
      const metaBits = [];
      if (st.exactMatchStatus) metaBits.push(`등급:${st.exactMatchStatus}`);
      if (st.independentOrigins !== undefined) metaBits.push(`독립출처:${st.independentOrigins}`);
      if (st.angleCount) metaBits.push(`${st.angleCount}관점`);
      if (st.selectedDraftId) metaBits.push(`${st.selectedDraftId} (${st.codePointLength}자)`);
      if (st.approvedDraftId) metaBits.push(`승인초안:${st.approvedDraftId}`);
      if (st.decision) metaBits.push(`결정:${st.decision}`);
      if (st.stale) metaBits.push('무효화(stale)');
      if (st.promptVersion) metaBits.push(`프롬프트:${st.promptVersion.slice(0, 8)}`);
      if (st.inputDigest) metaBits.push(`입력:${st.inputDigest.slice(0, 8)}`);
      if (st.approvalHash) metaBits.push(`승인해시:${st.approvalHash}`);
      return `
        <div class="provenance-row">
          <strong>${sym} ${escapeHtml(st.labelKo)}</strong>
          <span>${escapeHtml(metaBits.join(' · '))}</span>
          <code>sha256: ${escapeHtml(st.digest ?? '')} · cfg: ${escapeHtml(st.configVersion ?? '')}</code>
        </div>`;
    }).join('');
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

  document.querySelector('#approve-draft').disabled =
    duplicatePending
    || candidate.suppression?.active === true
    || candidate.guardian?.decision !== 'pass'
    || candidate.guardian?.boundMaterialRevision !== candidate.materialRevision
    || candidate.review?.stale === true
    || candidate.workflowState === 'approved';
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
  if (els.seller) els.seller.value = candidate.seller ?? '';
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

els.draftList.addEventListener('change', async (event) => {
  if (!event.target.matches('input[name="active-draft"]')) return;
  const draftId = event.target.value;
  const unsavedTexts = new Map(
    [...els.draftList.querySelectorAll('textarea[data-draft-text]')].map((ta) => [ta.dataset.draftText, ta.value])
  );
  els.draftList.querySelectorAll('.draft-card').forEach((card) => card.classList.toggle('selected', card.dataset.draftId === draftId));
  const candidate = candidateById(activeCandidateId);
  if (!candidate || candidate.selectedDraftId === draftId) return;
  const result = await sendCommand('select_draft', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: { draftId }
  });
  if (result.ok) {
    renderWorkspace();
    for (const [id, val] of unsavedTexts.entries()) {
      const ta = els.draftList.querySelector(`textarea[data-draft-text="${CSS.escape(id)}"]`);
      if (ta) ta.value = val;
    }
    showToast('선택 초안을 서버에 반영했습니다. Guardian 검수를 진행해 주세요.');
  }
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
  const payload = decision === 'approved'
    ? { decision, draftId: candidate.selectedDraftId || candidate.drafts?.[0]?.id }
    : { decision };
  const result = await sendCommand('review_decision', { candidateId: candidate.id, expectedRevision: candidate.revision, payload });
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

async function copyTextSafe(text, successMessage) {
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast(successMessage);
  } catch {
    showToast('클립보드 복사에 실패했습니다. 텍스트를 직접 선택해 복사해 주세요.');
  }
}

els.copyRootPost?.addEventListener('click', () => {
  const candidate = candidateById(activeCandidateId);
  copyTextSafe(candidate?.exportBundle?.singleRootPostCopyText, '오프셋 0 검증 완료 단일 루트 포스트 본문을 복사했습니다.');
});

els.copyShowcaseMd?.addEventListener('click', () => {
  const candidate = candidateById(activeCandidateId);
  copyTextSafe(candidate?.exportBundle?.showcaseMarkdown, '공개 쇼케이스 마크다운 카드를 복사했습니다.');
});

els.schedulePostBtn?.addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const rawDt = String(els.scheduleDatetime?.value ?? '').trim();
  const desiredLocalDatetime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDt)
    ? `${rawDt}:00+09:00`
    : new Date(Date.now() + 3600 * 1000).toISOString();
  const result = await sendCommand('schedule_approved_post', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: {
      draftId: candidate.review?.approvedDraftId || candidate.selectedDraftId,
      desiredLocalDatetime,
      timezone: 'Asia/Seoul'
    }
  });
  if (result.ok) {
    showToast('승인 포스트를 로컬 예약 대기열(◷ 예약 탭)에 등록했습니다.');
    renderWorkspace();
  }
});

els.recordManualPublishBtn?.addEventListener('click', async () => {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('record_manual_publication', {
    candidateId: candidate.id,
    expectedRevision: candidate.revision,
    payload: {
      draftId: candidate.review?.approvedDraftId || candidate.selectedDraftId,
      publishedNote: '스튜디오에서 수동 게시 완료 확인'
    }
  });
  if (result.ok) {
    if (result.result.result === 'manual_publication_preflight_blocked') {
      showToast('발송 전 변경사항 또는 기한 만료가 감지되어 기존 승인이 무효화되었습니다.');
    } else {
      showToast(candidate.affiliate
        ? '단일 포스트 수동 게시 완료를 기록했습니다.'
        : '수동 게시 완료를 기록하고 BS-60 무고지 사후 수익화 잠금을 활성화했습니다.');
    }
    renderWorkspace();
  }
});

els.capabilityView?.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-queue-action]');
  if (!btn) return;
  const card = btn.closest('.queue-card');
  if (!card) return;
  const scheduleId = card.dataset.scheduleId;
  const candidateId = card.dataset.candidateId;
  const queueItem = (today?.queue ?? []).find((q) => q.scheduleId === scheduleId) ?? null;
  const candidate = candidateById(candidateId);
  const expectedRevision = candidate?.revision ?? queueItem?.candidateRevision ?? null;
  const action = btn.dataset.queueAction;
  if (action === 'open') {
    if (!candidate) {
      showToast('현재 첫 화면/억제 목록 밖의 후보입니다. 필터를 확인해 주세요.');
      return;
    }
    viewMode = 'today';
    renderView();
    openWorkspace(candidate.id, { autoStep: true });
    return;
  }
  if (!Number.isInteger(expectedRevision)) {
    showToast('후보 리비전 정보를 확인할 수 없습니다. 새로고침해 주세요.');
    return;
  }
  if (action === 'preflight') {
    const res = await sendCommand('run_schedule_preflight', {
      candidateId,
      expectedRevision,
      payload: { scheduleId }
    });
    if (res.ok) {
      showToast(res.result.preflightOk
        ? '발송 전 사전점검을 통과했습니다(ready).'
        : '변경사항 또는 만료가 감지되어 예약이 무효화되었습니다.');
    }
  } else if (action === 'publish') {
    const res = await sendCommand('record_manual_publication', {
      candidateId,
      expectedRevision,
      payload: { scheduleId, publishedNote: '예약 대기열에서 수동 게시 완료 확인' }
    });
    if (res.ok) {
      showToast(res.result.result === 'manual_publication_preflight_blocked'
        ? '변경사항 또는 만료가 감지되어 예약 및 기존 승인이 무효화되었습니다.'
        : '수동 게시 완료를 기록했습니다.');
    }
  } else if (action === 'cancel') {
    const res = await sendCommand('cancel_schedule', {
      candidateId,
      expectedRevision,
      payload: { scheduleId }
    });
    if (res.ok) showToast('예약을 취소하고 단일 사용 승인 해시를 해제했습니다.');
  }
});

els.capabilityView?.addEventListener('submit', async (event) => {
  const form = event.target.closest('#outcome-form');
  if (!form) return;
  event.preventDefault();
  const fd = new FormData(form);
  const candidateId = String(fd.get('candidateId') ?? '').trim();
  const candidate = candidateById(candidateId);
  const queueMatch = (today?.queue ?? []).find((q) => q.candidateId === candidateId);
  const expectedRevision = candidate?.revision ?? queueMatch?.candidateRevision ?? null;
  if (!candidateId || !Number.isInteger(expectedRevision)) {
    showToast('성과를 기록할 승인/게시 후보를 선택해 주세요.');
    return;
  }
  const payload = {
    window: String(fd.get('window') ?? 'manual'),
    views: Number(fd.get('views') ?? 0),
    likes: Number(fd.get('likes') ?? 0),
    replies: Number(fd.get('replies') ?? 0),
    saves: Number(fd.get('saves') ?? 0),
    purchaseQuestionReplies: Number(fd.get('purchaseQuestionReplies') ?? 0),
    outboundClicks: Number(fd.get('outboundClicks') ?? 0),
    conversions: Number(fd.get('conversions') ?? 0),
    unitPriceKrw: Number(fd.get('unitPriceKrw') ?? 0),
    commissionRate: Number(fd.get('commissionRate') ?? 0.08),
    returnRate: Number(fd.get('returnRate') ?? 0.08),
    postCorrections: Number(fd.get('postCorrections') ?? 0),
    negativeFeedback: Number(fd.get('negativeFeedback') ?? 0),
    rumorHook: fd.has('rumorHook'),
    endorsementImplication: fd.has('endorsementImplication'),
    hiddenDisclosure: fd.has('hiddenDisclosure'),
    productMismatch: fd.has('productMismatch'),
    policyViolation: fd.has('policyViolation')
  };
  const res = await sendCommand('record_outcome_snapshot', {
    candidateId,
    expectedRevision,
    payload
  });
  if (res.ok) {
    const snap = res.result.outcomeSnapshot;
    showToast(snap?.quarantined
      ? '성과 스냅샷을 기록했으며, 정책·신뢰 위반 신호로 인해 추천 승격에서 안전 격리했습니다(AT-12).'
      : `성과 스냅샷 및 결정적 순기여(₩${Number(snap?.netYield?.netContributionKrw ?? 0).toLocaleString('ko-KR')})를 기록했습니다.`);
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
