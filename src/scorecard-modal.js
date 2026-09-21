(() => {
  const STYLE_ID = 'tgs-scorecard-modal-style';
  const MODAL_ID = 'tgs-scorecard-modal';
  const TOOLBAR_BUTTON = 'tgs-scorecard-toolbar-btn';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Scores are always available directly on every fixture. */
      .bracket-match .inline-score-input { display:block !important; }
      /* React owns score saving. Do not create a second save button here. */
      .bracket-match .inline-save-btn { display:none !important; }
      .tgs-inline-save { display:none !important; }
      .tgs-inline-save:hover { filter:brightness(1.05); transform:translateY(-1px); }
      .tgs-inline-save:disabled { opacity:.45; cursor:not-allowed; transform:none; }
      .tgs-scorecard-toolbar-btn {
        display:inline-flex; align-items:center; gap:7px; padding:9px 13px; border:1px solid rgba(90,105,255,.28);
        border-radius:10px; background:rgba(90,105,255,.08); color:#5367ff; font-size:11px;
        font-weight:900; letter-spacing:.02em; cursor:pointer; transition:.18s; white-space:nowrap;
      }
      .tgs-scorecard-toolbar-btn:hover { background:rgba(90,105,255,.15); transform:translateY(-1px); }
      [data-theme='dark'] .tgs-scorecard-toolbar-btn { background:rgba(113,128,255,.10); border-color:rgba(113,128,255,.3); color:#aeb8ff; }
      .tgs-scorecard-overlay { position:absolute; inset:0; z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(4,8,18,.66); backdrop-filter:blur(9px); }
      :fullscreen .tgs-scorecard-overlay { position:absolute !important; z-index:2147483647 !important; }\n      .tgs-scorecard-dialog { width:min(760px,96vw); max-height:88vh; overflow:auto; border:1px solid rgba(92,105,255,.22); border-radius:20px; padding:22px; background:#fff; box-shadow:0 30px 90px rgba(0,0,0,.35); }
      [data-theme='dark'] .tgs-scorecard-dialog { background:#151b2b; border-color:#39446e; color:#fff; }
      .tgs-scorecard-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:18px; }
      .tgs-scorecard-kicker { font-size:9px; text-transform:uppercase; letter-spacing:.14em; font-weight:900; color:#6674d8; }
      .tgs-scorecard-title { margin:4px 0 0; font-size:20px; font-weight:900; }
      .tgs-scorecard-subtitle { margin:5px 0 0; font-size:11px; color:#737d92; }
      [data-theme='dark'] .tgs-scorecard-subtitle { color:#9aa5bd; }
      .tgs-scorecard-close { width:32px; height:32px; border:0; border-radius:9px; background:#eef1ff; color:#5266ff; cursor:pointer; font-size:19px; }
      [data-theme='dark'] .tgs-scorecard-close { background:#252d47; color:#aeb8ff; }
      .tgs-standings-table { width:100%; border-collapse:separate; border-spacing:0; overflow:hidden; border:1px solid #e1e5ef; border-radius:14px; }
      [data-theme='dark'] .tgs-standings-table { border-color:#303a5a; }
      .tgs-standings-table th, .tgs-standings-table td { padding:11px 10px; text-align:left; border-bottom:1px solid #e7eaf1; font-size:12px; }
      [data-theme='dark'] .tgs-standings-table th, [data-theme='dark'] .tgs-standings-table td { border-bottom-color:#303a5a; }
      .tgs-standings-table th { background:#f4f6fb; color:#68738a; font-size:9px; text-transform:uppercase; letter-spacing:.08em; font-weight:900; }
      [data-theme='dark'] .tgs-standings-table th { background:#20283d; color:#aeb7cc; }
      .tgs-standings-table tr:last-child td { border-bottom:0; }
      .tgs-rank { width:42px; font-weight:900; color:#6874d8; }
      .tgs-player-name { font-weight:850; }
      .tgs-number { font-weight:800; text-align:center !important; }
      .tgs-points { font-weight:950; color:#5266ff; }
      .tgs-scorecard-empty { padding:28px 12px; text-align:center; color:#7b8498; font-size:12px; }
      .tgs-scorecard-footer { margin-top:14px; display:flex; justify-content:flex-end; }
      .tgs-scorecard-footer button { border:0; border-radius:10px; padding:10px 15px; background:#edf0f6; color:#4f596f; font-weight:800; cursor:pointer; }
      [data-theme='dark'] .tgs-scorecard-footer button { background:#293149; color:#d4d9e8; }
      @media (max-width:600px) {
        .tgs-scorecard-dialog { padding:16px; }
        .tgs-standings-table th, .tgs-standings-table td { padding:9px 6px; font-size:10px; }
        .tgs-standings-table th { font-size:8px; }
      }
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    document.getElementById(MODAL_ID)?.remove();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function getScore(match, index) {
    const input = match.querySelectorAll('.inline-score-input')[index];
    if (input && input.value !== '') return Number(input.value);
    const span = match.querySelectorAll('.player-line span')[index];
    const value = span?.textContent?.trim() ?? '';
    return value === '' ? null : Number(value);
  }

  function buildStandings() {
    const rows = new Map();
    document.querySelectorAll('.bracket-match').forEach(match => {
      const playerLines = [...match.querySelectorAll('.player-line')];
      if (playerLines.length < 2) return;
      const names = playerLines.map(line => line.querySelector('b')?.textContent?.trim() || '');
      if (!names[0] || !names[1] || names.includes('TBD')) return;
      names.forEach(name => {
        if (!rows.has(name)) rows.set(name, { name, played:0, wins:0, losses:0, points:0, diff:0 });
      });
      const a = getScore(match, 0);
      const b = getScore(match, 1);
      const winnerLine = playerLines.findIndex(line => line.classList.contains('winner'));
      if (winnerLine < 0 || a === null || b === null || Number.isNaN(a) || Number.isNaN(b)) return;
      const ra = rows.get(names[0]);
      const rb = rows.get(names[1]);
      ra.played += 1; rb.played += 1;
      ra.diff += a - b; rb.diff += b - a;
      if (winnerLine === 0) { ra.wins += 1; ra.points += 3; rb.losses += 1; }
      else { rb.wins += 1; rb.points += 3; ra.losses += 1; }
    });
    return [...rows.values()].sort((a,b) => b.points-a.points || b.wins-a.wins || b.diff-a.diff || a.name.localeCompare(b.name));
  }

  function openScorecard() {
    closeModal();
    const toolbar = document.querySelector('.bracket-toolbar');
    const tournamentName = toolbar?.querySelector('strong')?.textContent?.trim() || 'Tournament';
    const gameInfo = toolbar?.querySelector('span:not(.bracket-note)')?.textContent?.trim() || '';
    const rows = buildStandings();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'tgs-scorecard-overlay';
    overlay.innerHTML = `
      <div class="tgs-scorecard-dialog" role="dialog" aria-modal="true">
        <div class="tgs-scorecard-head">
          <div>
            <div class="tgs-scorecard-kicker">TOURNAMENT SCORECARD</div>
            <div class="tgs-scorecard-title">${escapeHtml(tournamentName)}</div>
            <div class="tgs-scorecard-subtitle">${escapeHtml(gameInfo)} · Live standings from saved fixture results</div>
          </div>
          <button class="tgs-scorecard-close" type="button" aria-label="Close">×</button>
        </div>
        ${rows.length ? `<table class="tgs-standings-table"><thead><tr><th>#</th><th>Player</th><th>GP</th><th>W</th><th>L</th><th>PTS</th><th>DIFF</th></tr></thead><tbody>${rows.map((r,i) => `<tr><td class="tgs-rank">${i+1}</td><td class="tgs-player-name">${escapeHtml(r.name)}</td><td class="tgs-number">${r.played}</td><td class="tgs-number">${r.wins}</td><td class="tgs-number">${r.losses}</td><td class="tgs-number tgs-points">${r.points}</td><td class="tgs-number">${r.diff>0?'+':''}${r.diff}</td></tr>`).join('')}</tbody></table>` : '<div class="tgs-scorecard-empty">No saved match results yet. Enter scores in the fixtures below and click Save.</div>'}
        <div class="tgs-scorecard-footer"><button type="button">Close</button></div>
      </div>`;
    overlay.querySelector('.tgs-scorecard-close').addEventListener('click', closeModal);
    overlay.querySelector('.tgs-scorecard-footer button').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    const fullscreenHost = document.fullscreenElement;
    (fullscreenHost || document.body).appendChild(overlay);
  }

  function addInlineSave(match) {
    // Score saving is handled by the React BracketMatch component.
    // This legacy DOM enhancer must never add a second Save Score button.
    match.querySelectorAll('.tgs-inline-save').forEach(button => button.remove());
  }

  function addToolbarScorecard() {
    // Scorecard toolbar button is already added by the share manager.
    // Do not create a duplicate button here.
  }

  function enhance() {
    injectStyles();
    document.querySelectorAll('.tgs-scorecard-btn').forEach(button => button.remove());
    addToolbarScorecard();
    document.querySelectorAll('.bracket-match').forEach(addInlineSave);
  }

  document.addEventListener('input', event => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.classList.contains('inline-score-input')) {
      const match = target.closest('.bracket-match');
      if (match) addInlineSave(match);
    }
  });

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance); else enhance();
})();
