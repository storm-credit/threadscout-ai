import {
  CANDIDATE_STATES,
  canApprove,
  createAuditEvent,
  createQueueItem,
  generateDrafts,
  transitionCandidate
} from '/packages/core/src/index.mjs';
import { fixtureCandidates } from '/packages/core/src/fixtures.mjs';

const STORAGE_KEY = 'threadscout-demo-v1';

const els = {
  list: document.querySelector('#candidate-list'),
  queueList: document.querySelector('#queue-list'),
  dialog: document.querySelector('#workspace-dialog'),
  form: document.querySelector('#workspace-form'),
  dialogTitle: document.querySelector('#dialog-title'),
  draftList: document.querySelector('#draft-list'),
  exactMatch: document.querySelector('#exact-match'),
  mediaRights: document.querySelector('#media-rights'),
  personalUse: document.querySelector('#personal-use'),
  affiliate: document.querySelector('#affiliate'),
  disclosure: document.querySelector('#disclosure'),
  validation: document.querySelector('#validation-result'),
  schedulePanel: document.querySelector('#schedule-panel'),
  scheduleTime: document.querySelector('#schedule-time'),
  filter: document.querySelector('#state-filter'),
  toast: document.querySelector('#toast')
};

let state = loadState();
let activeCandidateId = null;

function freshState() {
  return {
    candidates: structuredClone(fixtureCandidates),
    queue: [],
    audit: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : freshState();
  } catch {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function activeCandidate() {
  return state.candidates.find((candidate) => candidate.id === activeCandidateId);
}

function replaceCandidate(updated) {
  state.candidates = state.candidates.map((candidate) => candidate.id === updated.id ? updated : candidate);
}

function statusLabel(status) {
  return {
    discovered: '추천됨', drafted: '초안 작성', held: '보류', rejected: '거절',
    blocked: '차단', approved: '승인', queued: '대기열'
  }[status] ?? status;
}

function evidenceLabel(candidate) {
  const exact = candidate.exactMatchStatus === 'exact' ? '제품 일치' : '제품 확인 필요';
  const rights = ['owned', 'licensed', 'not_required'].includes(candidate.mediaRights) ? '권리 확인' : '권리 미확인';
  return { exact, rights };
}

function candidateCard(candidate) {
  const evidence = evidenceLabel(candidate);
  const blocked = candidate.riskLevel === 'blocked' || candidate.exactMatchStatus !== 'exact' || candidate.mediaRights === 'unknown';
  return `
    <article class="candidate-card ${blocked ? 'needs-evidence' : ''}" data-id="${candidate.id}">
      <div class="candidate-main">
        <div class="score-ring" aria-label="추천 점수 ${candidate.score}점"><strong>${candidate.score}</strong><span>점</span></div>
        <div class="candidate-copy">
          <div class="card-meta"><span>${candidate.category} · 예시 데이터</span><span class="state-badge state-${candidate.state}">${statusLabel(candidate.state)}</span></div>
          <h3>${candidate.name}</h3>
          <p>${candidate.reasons[0]}</p>
          <div class="evidence-row">
            <span class="evidence ${candidate.exactMatchStatus === 'exact' ? 'ok' : 'warn'}">${evidence.exact}</span>
            <span class="evidence ${candidate.mediaRights === 'unknown' ? 'warn' : 'ok'}">${evidence.rights}</span>
            <span class="evidence ${candidate.personalUse === 'confirmed' ? 'ok' : ''}">${candidate.personalUse === 'confirmed' ? '직접 사용' : '발견형 문구만'}</span>
          </div>
          <p class="risk-line"><strong>주의:</strong> ${candidate.risks[0]}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="secondary-button open-workspace" type="button">${candidate.drafts?.length ? '초안 검토' : '초안 4개 만들기'}</button>
        ${(candidate.state === CANDIDATE_STATES.DISCOVERED || candidate.state === CANDIDATE_STATES.DRAFTED) ? '<button class="ghost-button quick-hold" type="button">보류</button>' : ''}
      </div>
    </article>`;
}

function renderCandidates() {
  const filter = els.filter.value;
  const candidates = state.candidates
    .filter((candidate) => filter === 'all' || candidate.state === filter)
    .sort((a, b) => b.score - a.score);

  els.list.innerHTML = candidates.length
    ? candidates.map(candidateCard).join('')
    : '<div class="empty-state">이 상태의 제품이 없습니다.</div>';
}

function renderMetrics() {
  document.querySelector('#metric-total').textContent = state.candidates.length;
  document.querySelector('#metric-ready').textContent = state.candidates.filter((c) => c.exactMatchStatus === 'exact' && c.mediaRights !== 'unknown' && c.riskLevel !== 'blocked').length;
  document.querySelector('#metric-blocked').textContent = state.candidates.filter((c) => c.exactMatchStatus !== 'exact' || c.mediaRights === 'unknown' || c.riskLevel === 'blocked').length;
  document.querySelector('#metric-queued').textContent = state.queue.length;
}

function renderQueue() {
  els.queueList.innerHTML = state.queue.length
    ? state.queue.map((item) => `
        <article class="queue-card">
          <div><strong>${item.productName}</strong><span>${new Date(item.scheduledFor).toLocaleString('ko-KR')}</span></div>
          <span class="queue-status">로컬 저장 · 게시 안 됨</span>
        </article>`).join('')
    : '<div class="empty-state">승인 후 예약한 글이 아직 없습니다.</div>';
}

function render() {
  renderMetrics();
  renderCandidates();
  renderQueue();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function renderDrafts(candidate) {
  els.draftList.innerHTML = candidate.drafts.map((draft, index) => `
    <label class="draft-card">
      <div class="draft-card-head">
        <span class="draft-number">${index + 1}</span>
        <strong>${draft.angle}</strong>
        <input type="radio" name="selected-draft" value="${draft.id}" ${candidate.selectedDraftId === draft.id || (!candidate.selectedDraftId && index === 0) ? 'checked' : ''} />
      </div>
      <textarea data-draft-id="${draft.id}" rows="7">${draft.text}</textarea>
    </label>`).join('');
}

function openWorkspace(candidateId) {
  activeCandidateId = candidateId;
  let candidate = activeCandidate();
  if (!candidate.drafts?.length) {
    candidate = transitionCandidate({ ...candidate, drafts: generateDrafts(candidate) }, CANDIDATE_STATES.DRAFTED);
    candidate.selectedDraftId = candidate.drafts[0].id;
    replaceCandidate(candidate);
    state.audit.push(createAuditEvent('drafts_generated', candidate.id, { count: 4 }));
    saveState();
  }

  els.dialogTitle.textContent = candidate.name;
  els.exactMatch.value = candidate.exactMatchStatus;
  els.mediaRights.value = candidate.mediaRights;
  els.personalUse.value = candidate.personalUse;
  els.affiliate.checked = candidate.affiliate;
  els.disclosure.value = candidate.disclosure ?? '';
  els.validation.textContent = '';
  els.validation.className = 'validation-result';
  els.schedulePanel.hidden = candidate.state !== CANDIDATE_STATES.APPROVED;
  const isTerminal = candidate.state === CANDIDATE_STATES.BLOCKED;
  document.querySelector('#approve-draft').disabled = isTerminal || candidate.state === CANDIDATE_STATES.QUEUED;
  document.querySelector('#hold-candidate').disabled = isTerminal || candidate.state === CANDIDATE_STATES.HELD;
  document.querySelector('#reject-candidate').disabled = isTerminal || candidate.state === CANDIDATE_STATES.REJECTED;
  document.querySelector('#block-candidate').disabled = isTerminal;
  renderDrafts(candidate);
  els.dialog.showModal();
}

function syncWorkspace() {
  const candidate = activeCandidate();
  if (!candidate) return null;

  const selected = els.form.querySelector('input[name="selected-draft"]:checked');
  const drafts = candidate.drafts.map((draft) => {
    const textarea = els.form.querySelector(`textarea[data-draft-id="${draft.id}"]`);
    return { ...draft, text: textarea.value.trim() };
  });

  const updated = {
    ...candidate,
    exactMatchStatus: els.exactMatch.value,
    mediaRights: els.mediaRights.value,
    personalUse: els.personalUse.value,
    affiliate: els.affiliate.checked,
    disclosure: els.disclosure.value.trim(),
    drafts,
    selectedDraftId: selected?.value ?? drafts[0]?.id
  };
  replaceCandidate(updated);
  return updated;
}

function selectedDraft(candidate) {
  return candidate.drafts.find((draft) => draft.id === candidate.selectedDraftId) ?? candidate.drafts[0];
}

function validateWorkspace() {
  const candidate = syncWorkspace();
  const draft = selectedDraft(candidate);
  const result = canApprove(candidate, draft?.text ?? '');
  els.validation.className = `validation-result ${result.ok ? 'success' : 'error'}`;
  els.validation.innerHTML = result.ok
    ? '<strong>승인 가능</strong><span>제품·권리·고지·표현 검사를 통과했습니다.</span>'
    : `<strong>승인 불가</strong><ul>${result.blockers.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  return { candidate, draft, result };
}

function moveCandidate(nextState, action) {
  const candidate = syncWorkspace();
  try {
    if (candidate.state === CANDIDATE_STATES.QUEUED) {
      state.queue = state.queue.filter((item) => item.candidateId !== candidate.id);
    }
    const updated = transitionCandidate(candidate, nextState);
    replaceCandidate(updated);
    state.audit.push(createAuditEvent(action, candidate.id));
    saveState();
    els.dialog.close();
    showToast(`${candidate.name}: ${statusLabel(nextState)} 처리했습니다.`);
  } catch (error) {
    showToast(error.message);
  }
}

els.list.addEventListener('click', (event) => {
  const card = event.target.closest('.candidate-card');
  if (!card) return;
  if (event.target.closest('.open-workspace')) openWorkspace(card.dataset.id);
  if (event.target.closest('.quick-hold')) {
    const candidate = state.candidates.find((item) => item.id === card.dataset.id);
    if (candidate.state === CANDIDATE_STATES.DISCOVERED || candidate.state === CANDIDATE_STATES.DRAFTED) {
      replaceCandidate(transitionCandidate(candidate, CANDIDATE_STATES.HELD));
      state.audit.push(createAuditEvent('held', candidate.id));
      saveState();
      showToast(`${candidate.name}: 보류했습니다.`);
    }
  }
});

els.filter.addEventListener('change', renderCandidates);
document.querySelector('#reset-demo').addEventListener('click', () => {
  if (!confirm('저장된 데모 상태를 모두 초기화할까요?')) return;
  state = freshState();
  localStorage.removeItem(STORAGE_KEY);
  render();
  showToast('데모 데이터를 초기화했습니다.');
});

document.querySelector('#validate-draft').addEventListener('click', validateWorkspace);
document.querySelector('#approve-draft').addEventListener('click', () => {
  const { candidate, draft, result } = validateWorkspace();
  if (!result.ok) return;
  try {
    if (candidate.state === CANDIDATE_STATES.APPROVED) {
      showToast('이미 승인된 초안입니다. 예약 시각을 선택해 주세요.');
      els.schedulePanel.hidden = false;
      return;
    }
    const approved = transitionCandidate(candidate, CANDIDATE_STATES.APPROVED);
    replaceCandidate(approved);
    state.audit.push(createAuditEvent('approved', candidate.id, { draftId: draft.id }));
    els.schedulePanel.hidden = false;
    saveState();
    showToast('초안을 승인했습니다. 이제 로컬 대기열에 예약할 수 있습니다.');
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector('#hold-candidate').addEventListener('click', () => moveCandidate(CANDIDATE_STATES.HELD, 'held'));
document.querySelector('#reject-candidate').addEventListener('click', () => moveCandidate(CANDIDATE_STATES.REJECTED, 'rejected'));
document.querySelector('#block-candidate').addEventListener('click', () => moveCandidate(CANDIDATE_STATES.BLOCKED, 'blocked'));

document.querySelector('#add-to-queue').addEventListener('click', () => {
  const candidate = syncWorkspace();
  const draft = selectedDraft(candidate);
  try {
    const item = createQueueItem(candidate, draft.text, els.scheduleTime.value);
    state.queue.push(item);
    replaceCandidate(transitionCandidate(candidate, CANDIDATE_STATES.QUEUED));
    state.audit.push(createAuditEvent('queued_locally', candidate.id, { scheduledFor: item.scheduledFor }));
    saveState();
    els.dialog.close();
    showToast('로컬 대기열에 추가했습니다. 외부 게시 기능은 꺼져 있습니다.');
  } catch (error) {
    showToast(error.message);
  }
});

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  els.dialog.close();
});

render();
