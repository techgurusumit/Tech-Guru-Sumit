(() => {
  const formats = [
    ['Round Robin','Everyone plays with everyone, and the winner is determined by points.','▦'],
    ['Single Elimination','Participants play one game each, and losers leave the tournament.','◫'],
    ['Double Elimination','Something similar, but there is a second chance through the finals.','◆'],
    ['3 Game Guarantee','Every participant plays at least three games before leaving the tournament.','✦'],
    ['Swiss System','Players compete in several rounds against opponents with similar results.','▦'],
    ['League (Season Format)','Run a full season with recurring matches, automatic standings and tracking.','♜']
  ];
  let pendingFormat = null;
  let previousTournamentData = [];
  try { previousTournamentData = JSON.parse(localStorage.getItem('tgs_tournaments') || '[]'); if (!Array.isArray(previousTournamentData)) previousTournamentData = []; } catch {}
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (key === 'tgs_tournaments' && pendingFormat) {
      try {
        const next = JSON.parse(value);
        if (Array.isArray(next) && next.length > previousTournamentData.length) {
          const newest = next[0];
          if (newest && newest.id && !previousTournamentData.some(t => t && t.id === newest.id)) {
            newest.format = pendingFormat;
            value = JSON.stringify(next);
            pendingFormat = null;
            setTimeout(() => location.reload(), 60);
          }
        }
        previousTournamentData = Array.isArray(next) ? next : previousTournamentData;
      } catch {}
    } else if (key === 'tgs_tournaments') {
      try { const next = JSON.parse(value); if (Array.isArray(next)) previousTournamentData = next; } catch {}
    }
    originalSetItem(key, value);
  };
  const style = document.createElement('style');
  style.textContent = `
    .tgs-format-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(8,12,25,.62);backdrop-filter:blur(8px);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .tgs-format-modal{width:min(680px,96vw);max-height:90vh;overflow:auto;padding:24px;border-radius:20px;background:linear-gradient(145deg,#fff,#f3f6ff);box-shadow:0 28px 80px rgba(0,0,0,.32);border:1px solid rgba(91,105,255,.25)}
    .tgs-format-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.tgs-format-title{font-size:21px;font-weight:900;color:#172044}.tgs-format-sub{margin-top:5px;color:#65708a;font-size:11px}.tgs-format-close{width:34px;height:34px;border:0;border-radius:10px;background:#eef1ff;color:#5367ff;font-size:20px;cursor:pointer}.tgs-format-list{display:grid;gap:10px}.tgs-format-card{display:grid;grid-template-columns:54px 1fr 28px;align-items:center;gap:13px;width:100%;padding:13px 14px;border:1px solid #c9d0ff;border-radius:13px;background:#fff;color:#1d2749;text-align:left;cursor:pointer;transition:.18s}.tgs-format-card:hover{transform:translateY(-1px);border-color:#5266ff;box-shadow:0 9px 22px rgba(71,86,200,.14);background:#fbfbff}.tgs-format-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:11px;background:#eef0ff;color:#3347c9;font-size:25px;font-weight:900}.tgs-format-name{display:block;font-size:13px;font-weight:900}.tgs-format-desc{display:block;margin-top:4px;color:#68738b;font-size:9.5px;line-height:1.4}.tgs-format-arrow{color:#5266ff;font-size:24px;font-weight:700}.tgs-format-hint{margin-top:14px;text-align:center;color:#7a8499;font-size:9px}@media(max-width:600px){.tgs-format-modal{padding:17px;border-radius:16px}.tgs-format-card{grid-template-columns:44px 1fr 20px;padding:10px}.tgs-format-icon{width:40px;height:40px;font-size:20px}.tgs-format-name{font-size:11px}.tgs-format-desc{font-size:8px}.tgs-format-title{font-size:18px}}
    :root[data-theme='dark'] .tgs-format-modal{background:linear-gradient(145deg,#171c2c,#101522);border-color:#3d4774}:root[data-theme='dark'] .tgs-format-title{color:#fff}:root[data-theme='dark'] .tgs-format-sub{color:#aeb7cc}:root[data-theme='dark'] .tgs-format-card{background:#1c2232;border-color:#3d4774;color:#fff}:root[data-theme='dark'] .tgs-format-card:hover{background:#20283d;border-color:#7180ff}:root[data-theme='dark'] .tgs-format-desc{color:#aeb7cc}:root[data-theme='dark'] .tgs-format-icon{background:#292f4b;color:#aeb8ff}:root[data-theme='dark'] .tgs-format-close{background:#272e48;color:#aeb8ff}
  `;
  document.head.appendChild(style);
  function isCreateButton(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (document.querySelector('.modal-backdrop')) return false;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return text === 'Create Tournament' || text === 'New Tournament';
  }
  function openPicker(trigger) {
    if (document.querySelector('.tgs-format-overlay')) return;
    const overlay = document.createElement('div'); overlay.className = 'tgs-format-overlay';
    const modal = document.createElement('div'); modal.className = 'tgs-format-modal';
    modal.innerHTML = `<div class="tgs-format-top"><div><div class="tgs-format-title">Choose tournament type</div><div class="tgs-format-sub">Select the format you want to create for your event.</div></div><button class="tgs-format-close" type="button">×</button></div><div class="tgs-format-list"></div><div class="tgs-format-hint">You can change the selection before entering tournament details.</div>`;
    const list = modal.querySelector('.tgs-format-list');
    formats.forEach(([name, desc, icon]) => {
      const button = document.createElement('button'); button.type='button'; button.className='tgs-format-card';
      button.innerHTML = `<span class="tgs-format-icon">${icon}</span><span><span class="tgs-format-name">${name}</span><span class="tgs-format-desc">${desc}</span></span><span class="tgs-format-arrow">›</span>`;
      button.addEventListener('click', () => { pendingFormat = name; overlay.remove(); trigger.click(); });
      list.appendChild(button);
    });
    modal.querySelector('.tgs-format-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(modal); document.body.appendChild(overlay);
  }
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target.closest('button') : null;
    if (target && isCreateButton(target) && !pendingFormat) { e.preventDefault(); e.stopPropagation(); openPicker(target); }
  }, true);
})();