const els = {
  list: document.querySelector('#candidate-list'),
  candidateDialog: document.querySelector('#candidate-dialog'),
  candidateForm: document.querySelector('#candidate-form'),
  workspace: document.querySelector('#workspace-dialog'),
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
  personalUse: document.querySelector('#personal-use'),
  affiliate: document.querySelector('#affiliate'),
  disclosure: document.querySelector('#disclosure'),
  evidenceBasis: document.querySelector('#evidence-basis'),
  strategyList: document.querySelector('#strategy-list'),
  draftList: document.querySelector('#draft-list'),
  guardianResult: document.querySelector('#guardian-result'),
  approvalBinding: document.querySelector('#approval-binding'),
  revisionLabel: document.querySelector('#revision-label'),
  capabilityView: document.querySelector('#capability-view'),
  inboxView: document.querySelector('#inbox-view'),
  filter: document.querySelector('#state-filter'),
  viewKicker: document.querySelector('#view-kicker'),
  inboxTitle: document.querySelector('#inbox-title'),
  viewDescription: document.querySelector('#view-description'),
  toast: document.querySelector('#toast')
};

let today = null;
let activeCandidateId = null;
let viewMode = 'today';

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
  return { ready: '근거 준비', partial: '근거 일부', weak: '근거 약함' }[value] ?? value;
}

function riskLabel(value) {
  return { low: '낮은 위험', review: '검토 필요', high: '높은 위험', blocked: '차단' }[value] ?? value;
}

function exactLabel(value) {
  return {
    exact: '동일 제품 확인',
    likely: '유력 · 단정 불가',
    substitute: '대체품',
    unresolved: '제품 미확인'
  }[value] ?? value;
}

function mediaLabel(value) {
  return { owned: '직접 소유', licensed: '사용 허가', not_required: '미디어 없음', unknown: '권리 미확인' }[value] ?? value;
}

function duplicateStateLabel(value) {
  return {
    unique: '중복 없음',
    possible_duplicate: '유사 후보',
    confirmed_distinct: '다른 제품 확인',
    confirmed_duplicate: '중복 억제'
  }[value] ?? value;
}

function candidateById(id) {
  return today?.candidates.find((candidate) => candidate.id === id) ?? null;
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
  const canHoldFromCard = !['approved', 'held', 'rejected', 'duplicate_review'].includes(candidate.workflowState);
  return `
    <article class="candidate-card ${candidate.topBlocker ? 'has-blocker' : ''} ${candidate.workflowState === 'stale' ? 'stale-card' : ''}" data-id="${escapeHtml(candidate.id)}">
      <div class="card-top">
        <div class="card-copy">
          <div class="card-meta"><span class="card-kicker">${escapeHtml(candidate.lane)} · ${sourceBadge}</span><span class="status-pill ${statusClass(candidate.workflowState)}">${escapeHtml(statusLabel(candidate.workflowState))}</span></div>
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
        ${candidate.verifierDecisionLabel ? `<span class="status-pill ${statusClass(candidate.verifierDecision, 'verifier')}">검증 ${escapeHtml(candidate.verifierDecisionLabel)}</span>` : ''}
        ${candidate.freshnessState && candidate.freshnessState !== 'fresh' ? `<span class="status-pill ${statusClass(candidate.freshnessState, 'freshness')}">근거 ${candidate.freshnessState === 'aging' ? '만료 임박' : '기한 초과'}</span>` : ''}
        ${duplicateBadge}
      </div>
      ${blocker}
      <div class="card-actions">
        <button class="secondary-button card-primary" type="button" data-action="${escapeHtml(primaryAction.action)}">${escapeHtml(primaryAction.label)}</button>
        ${canHoldFromCard ? '<button class="ghost-button card-hold" type="button">보류</button>' : ''}
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
}

function renderMetrics() {
  if (!today) return;
  document.querySelector('#metric-total').textContent = today.counters.observed;
  document.querySelector('#metric-ready').textContent = today.counters.recommended;
  document.querySelector('#metric-verification').textContent = today.counters.verificationNeeded + (today.counters.duplicateReview ?? 0);
  document.querySelector('#metric-approved').textContent = today.counters.approved;
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
      ? `<p class="section-kicker">Schedule</p><h2>예약은 아직 외부 실행하지 않습니다.</h2><p>현재 C 슬라이스는 사람 승인까지 증명합니다. 브라우저나 서비스 워커가 예약·게시 권한을 갖지 않으며, 다음 게시 슬라이스 전까지 외부 게시 기능은 OFF입니다.</p><div class="capability-list"><div class="capability-item"><strong>외부 게시</strong><span>disabled</span></div><div class="capability-item"><strong>서버 상태</strong><span>${escapeHtml(today?.capability.persistence ?? 'loading')}</span></div></div>`
      : `<p class="section-kicker">Performance</p><h2>게시 전에는 성과를 학습하지 않습니다.</h2><p>실제 게시와 귀속 가능한 지표가 없으므로 성과 점수나 학습 추천을 만들어내지 않습니다. 안전하지 않은 고성과 패턴을 학습하는 기능도 현재 비활성화 상태입니다.</p><div class="capability-list"><div class="capability-item"><strong>학습 상태</strong><span>측정 데이터 없음</span></div><div class="capability-item"><strong>외부 게시</strong><span>disabled</span></div></div>`;
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
    els.viewDescription.textContent = '최대 5개 후보만 보여주고, 점수와 근거 준비도·중복 가능성을 따로 표시합니다.';
  }
  renderCandidates();
}

function render() {
  renderMetrics();
  renderView();
  if (activeCandidateId && els.workspace.open) renderWorkspace();
}

async function loadToday() {
  const response = await fetch('/api/today', { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('서버 상태를 불러오지 못했습니다.');
  today = await response.json();
  render();
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
    showToast(result.message || '요청을 처리하지 못했습니다.');
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
    : '<div class="empty-state">근거가 준비되면 서로 다른 전략 4개를 만들 수 있습니다.</div>';
}

function renderDrafts(candidate) {
  const drafts = candidate.drafts ?? [];
  els.draftList.innerHTML = drafts.length
    ? drafts.map((draft, index) => `
        <article class="draft-card ${candidate.selectedDraftId === draft.id ? 'selected' : ''}" data-draft-id="${escapeHtml(draft.id)}">
          <div class="draft-head"><label><input type="radio" name="active-draft" value="${escapeHtml(draft.id)}" ${candidate.selectedDraftId === draft.id || (!candidate.selectedDraftId && index === 0) ? 'checked' : ''} />${index + 1}. ${escapeHtml(draft.title)}</label><span class="status-pill">${escapeHtml(draft.angleId)}</span></div>
          <textarea rows="6" data-draft-text="${escapeHtml(draft.id)}">${escapeHtml(draft.text)}</textarea>
          ${draft.disclosure ? `<p class="muted"><strong>고지:</strong> ${escapeHtml(draft.disclosure)}</p>` : ''}
        </article>`).join('')
    : '<div class="empty-state">전략 4개가 준비되면 초안 4개를 만들 수 있습니다.</div>';
}

function renderGuardian(candidate) {
  const guardian = candidate.guardian;
  if (!guardian) {
    els.guardianResult.className = 'review-result';
    els.guardianResult.textContent = '초안이 준비된 뒤 Guardian이 근거·체험 표현·과장·고지를 독립 검수합니다.';
    return;
  }
  els.guardianResult.className = `review-result ${guardian.decision}`;

  const checkLabels = {
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

  // A blocking finding is shown separately from a fixable one, because approval can
  // never pass the first and can pass the second once fixed (AT-08, AT-42).
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
  els.revisionLabel.textContent = `rev ${candidate.revision}`;
  if (duplicatePending) {
    els.approvalBinding.textContent = '유사 후보 확인이 끝나기 전에는 보류·거절·승인을 포함한 다른 사람 결정을 적용하지 않습니다.';
  } else if (review) {
    els.approvalBinding.innerHTML = review.stale
      ? `<strong>기존 ${escapeHtml(review.decision)} 결정은 무효화됨</strong><br />${escapeHtml(review.staleReason || '상위 자료가 변경되었습니다.')}<br /><small>바인딩: ${escapeHtml(review.boundMaterialRevision)}</small>`
      : `<strong>${escapeHtml(review.decision)} · ${escapeHtml(review.actor)}</strong><br />이 결정은 아래 자료 해시에 묶여 있습니다.<br /><small>${escapeHtml(review.boundMaterialRevision)}</small>`;
  } else {
    els.approvalBinding.textContent = candidate.guardian?.decision === 'pass'
      ? 'Guardian 통과 버전과 현재 자료 버전이 일치합니다. 승인하면 이 material revision에 결정이 묶입니다.'
      : 'Guardian pass 전에는 승인할 수 없습니다. 보류·거절은 언제든 가능합니다.';
  }

  document.querySelector('#approve-draft').disabled = duplicatePending || candidate.guardian?.decision !== 'pass' || candidate.guardian?.boundMaterialRevision !== candidate.materialRevision || candidate.review?.stale === true || candidate.workflowState === 'approved';
  document.querySelector('#hold-candidate').disabled = duplicatePending || candidate.workflowState === 'held';
  document.querySelector('#reject-candidate').disabled = duplicatePending || candidate.workflowState === 'rejected';
}

function renderWorkspace() {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) {
    els.workspace.close();
    activeCandidateId = null;
    return;
  }
  els.dialogTitle.textContent = candidate.name;
  els.dialogSubtitle.textContent = `${candidate.synthetic ? '예시 데이터' : '사용자 제공'} · ${statusLabel(candidate.workflowState)} · 서버 revision ${candidate.revision}`;
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
  els.personalUse.value = candidate.personalUse;
  els.affiliate.checked = candidate.affiliate;
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

function openWorkspace(candidateId) {
  activeCandidateId = candidateId;
  renderWorkspace();
  if (!els.workspace.open) els.workspace.showModal();
}

async function runCandidateAction(candidate, action) {
  if (action === 'open_workspace') return openWorkspace(candidate.id);
  const command = action;
  const result = await sendCommand(command, { candidateId: candidate.id, expectedRevision: candidate.revision });
  if (result.ok) {
    showToast({ request_strategies: '전략 4개를 만들었습니다.', request_drafts: '초안 4개를 만들었습니다.', run_guardian: 'Guardian 검수를 완료했습니다.' }[command] ?? '처리했습니다.');
    openWorkspace(candidate.id);
  }
}

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
      if (candidateById(result.result.candidateId)) openWorkspace(result.result.candidateId);
    } else {
      showToast('제품 후보를 추가했습니다. 다음 단계는 근거 확인입니다.');
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
  } else {
    showToast(updated.evidenceReadiness === 'ready' ? '사용자 제공 근거 기준으로 다음 단계가 열렸습니다.' : '근거가 아직 부족합니다. 막힌 이유를 확인하세요.');
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
    showToast(updated.guardian?.decision === 'pass' ? 'Guardian 검수를 통과했습니다.' : '수정 또는 차단 사유가 있습니다.');
    renderWorkspace();
  }
});

async function decide(decision) {
  const candidate = candidateById(activeCandidateId);
  if (!candidate) return;
  const result = await sendCommand('review_decision', { candidateId: candidate.id, expectedRevision: candidate.revision, payload: { decision } });
  if (result.ok) {
    showToast({ approved: '이 버전을 승인했습니다. 외부 게시 기능은 여전히 꺼져 있습니다.', held: '보류했습니다.', rejected: '거절했습니다.' }[decision]);
    renderWorkspace();
  }
}

document.querySelector('#approve-draft').addEventListener('click', () => decide('approved'));
document.querySelector('#hold-candidate').addEventListener('click', () => decide('held'));
document.querySelector('#reject-candidate').addEventListener('click', () => decide('rejected'));

document.querySelector('#open-add-candidate').addEventListener('click', () => els.candidateDialog.showModal());
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close()));

els.filter.addEventListener('change', renderCandidates);
document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => {
  viewMode = button.dataset.view;
  if (viewMode === 'verification') els.filter.value = 'all';
  if (viewMode === 'drafts') els.filter.value = 'all';
  renderView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

document.querySelector('#reset-demo').addEventListener('click', async () => {
  if (!confirm('서버에 저장된 로컬 C 슬라이스 상태를 예시 초기값으로 되돌릴까요?')) return;
  const result = await sendCommand('reset_demo');
  if (result.ok) {
    activeCandidateId = null;
    if (els.workspace.open) els.workspace.close();
    showToast('서버 예시 상태를 초기화했습니다.');
  }
});

loadToday().catch((error) => {
  els.list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br />서버가 실행 중인지 확인해 주세요.</div>`;
});