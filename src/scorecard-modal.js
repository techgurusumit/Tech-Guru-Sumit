(() => {
  const STYLE_ID = 'tgs-scorecard-modal-style';
  const MODAL_ID = 'tgs-scorecard-modal';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bracket-match .inline-score-input,
      .bracket-match .inline-save-btn { display:none !important; }
      .tgs-scorecard-btn {
        width:100%; margin-top:8px; padding:8px 10px; border:1px solid rgba(90,105,255,.28);
        border-radius:9px; background:rgba(90,105,255,.08); color:#5367ff; font-size:10px;
        font-weight:800; letter-spacing:.03em; cursor:pointer; transition:.18s;
      }
      .tgs-scorecard-btn:hover { background:rgba(90,105,255,.15); transform:translateY(-1px); }
      [data-theme='dark'] .tgs-scorecard-btn { background:rgba(113,128,255,.10); border-color:rgba(113,128,255,.3); color:#aeb8ff; }
      .tgs-scorecard-overlay { position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(4,8,18,.66); backdrop-filter:blur(9px); }
      .tgs-scorecard-dialog { width:min(430px,96vw); border:1px solid rgba(92,105,255,.22); border-radius:20px; padding:22px; background:#fff; box-shadow:0 30px 90px rgba(0,0,0,.35); }
      [data-theme='dark'] .tgs-scorecard-dialog { background:#151b2b; border-color:#39446e; color:#fff; }
      .tgs-scorecard-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:20px; }
      .tgs-scorecard-kicker { font-size:9px; text-transform:uppercase; letter-spacing:.14em; font-weight:900; color:#6674d8; }
      .tgs-scorecard-title { margin:4px 0 0; font-size:19px; font-weight:900; }
      .tgs-scorecard-close { width:32px; height:32px; border:0; border-radius:9px; background:#eef1ff; color:#5266ff; cursor:pointer; font-size:19px; }
      [data-theme='dark'] .tgs-scorecard-close { background:#252d47; color:#aeb8ff; }
      .tgs-score-row { display:grid; grid-template-columns:1fr 86px; gap:10px; align-items:center; padding:12px; border:1px solid #e1e5ef; border-radius:12px; margin-top:9px; background:#fafbfe; }
      [data-theme='dark'] .tgs-score-row { border-color:#303a5a; background:#1b2234; }
      .tgs-score-player { font-size:13px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tgs-score-input { width:100%; box-sizing:border-box; text-align:center; font-size:18px; font-weight:900; border:1px solid #cfd5e5; border-radius:9px; padding:8px; outline:none; background:#fff; color:#172044; }
      [data-theme='dark'] .tgs-score-input { background:#111726; color:#fff; border-color:#414d73; }
      .tgs-score-status { margin-top:12px; padding:10px 12px; border-radius:10px; background:#f3f5fa; color:#69738a; font-size:10px; font-weight:700; }
      [data-theme='dark'] .tgs-score-status { background:#20283d; color:#aeb7cc; }
      .tgs-score-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:18px; }
      .tgs-score-action { border:0; border-radius:10px; padding:10px 15px; font-weight:800; cursor:pointer; }
      .tgs-score-cancel { background:#edf0f6; color:#4f596f; }
      .tgs-score-save { background:#5fce2b; color:#102008; }
      [data-theme='dark'] .tgs-score-cancel { background:#293149; color:#d4d9e8; }
    `;
    document.head.appendChild(style);
  }

  function setReactInput(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function closeModal() {
    document.getElementById(MODAL_ID)?.remove();
  }

  function openScorecard(match) {
    closeModal();
    const pRows = [...match.querySelectorAll('.player-line')];
    const players = pRows.map(row => row.querySelector('b')?.textContent?.trim() || 'TBD');
    const scoreInputs = [...match.querySelectorAll('.inline-score-input')];
    const scores = pRows.map((row, i) => scoreInputs[i]?.value ?? row.querySelector('span')?.textContent?.trim() ?? '');
    const completed = match.classList.contains('won');
    const title = match.querySelector('.match-head span')?.textContent?.trim() || 'Match Scorecard';

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'tgs-scorecard-overlay';
    overlay.innerHTML = `
      <div class="tgs-scorecard-dialog" role="dialog" aria-modal="true">
        <div class="tgs-scorecard-head">
          <div><div class="tgs-scorecard-kicker">MATCH SCORECARD</div><div class="tgs-scorecard-title">${escapeHtml(title)}</div></div>
          <button class="tgs-scorecard-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="tgs-score-rows">
          ${players.map((player, i) => `<div class="tgs-score-row"><div class="tgs-score-player">${escapeHtml(player)}</div><input class="tgs-score-input" data-score-index="${i}" type="number" min="0" value="${escapeAttr(scores[i] || '')}" ${completed || scoreInputs.length !== 2 ? 'readonly' : ''}></div>`).join('')}
        </div>
        <div class="tgs-score-status">${completed ? 'Result recorded. Scorecard is view-only.' : 'Enter the final score for both players. The winner will advance automatically.'}</div>
        <div class="tgs-score-actions">
          <button class="tgs-score-action tgs-score-cancel" type="button">Close</button>
          ${completed ? '' : '<button class="tgs-score-action tgs-score-save" type="button">Save Result</button>'}
        </div>
      </div>`;

    overlay.querySelector('.tgs-scorecard-close').addEventListener('click', closeModal);
    overlay.querySelector('.tgs-score-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    const saveButton = overlay.querySelector('.tgs-score-save');
    saveButton?.addEventListener('click', () => {
      const values = [...overlay.querySelectorAll('.tgs-score-input')].map(x => x.value.trim());
      if (values.length !== 2 || values.some(x => x === '') || values[0] === values[1]) {
        const status = overlay.querySelector('.tgs-score-status');
        if (status) status.textContent = 'Enter two different scores before saving.';
        return;
      }
      if (scoreInputs.length !== 2) return;
      setReactInput(scoreInputs[0], values[0]);
      setReactInput(scoreInputs[1], values[1]);
      match.querySelector('.inline-save-btn')?.click();
      closeModal();
    });

    document.body.appendChild(overlay);
    overlay.querySelector('.tgs-score-input')?.focus();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function escapeAttr(value) { return escapeHtml(value); }

  function enhance() {
    injectStyles();
    document.querySelectorAll('.bracket-match').forEach(match => {
      if (match.querySelector('.tgs-scorecard-btn')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tgs-scorecard-btn';
      button.textContent = 'View Scorecard';
      button.addEventListener('click', () => openScorecard(match));
      match.appendChild(button);
    });
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance); else enhance();
})();
