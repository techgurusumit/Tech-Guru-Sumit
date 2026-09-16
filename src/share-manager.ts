import { supabase, shareBackendConfigured } from './share-config';

type ViewType='fixtures'|'scorecard';
type Tournament={id:number;name:string;game:string;format:string;players:number;playerNames:string[];status:string;date:string;password?:string;passwordEnabled?:boolean;fixtures:any[]};
type ShareLink={tournamentId:number;viewType:ViewType;publicToken:string;ownerToken:string;url:string};

const LINKS_KEY='tgs_share_links';
let lastSnapshot=new Map<string,string>();
let syncing=false;
let observer:MutationObserver|undefined;

function sessionEmail(){try{return JSON.parse(localStorage.getItem('tgs_session')||'null')?.email?.trim().toLowerCase()||''}catch{return ''}}
function linksKey(){return `${LINKS_KEY}::${sessionEmail()}`}
function readLinks():ShareLink[]{try{return JSON.parse(localStorage.getItem(linksKey())||'[]')}catch{return []}}
function writeLinks(links:ShareLink[]){localStorage.setItem(linksKey(),JSON.stringify(links))}
function readTournaments():Tournament[]{try{const value=JSON.parse(localStorage.getItem('tgs_tournaments')||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function token(bytes=32){const values=new Uint8Array(bytes);crypto.getRandomValues(values);return Array.from(values).map(v=>v.toString(16).padStart(2,'0')).join('')}
function shareUrl(publicToken:string,viewType:ViewType){return `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(publicToken)}&view=${viewType}`}
function currentTournamentId(){const select=document.querySelector('.select-wrap select') as HTMLSelectElement|null;return select?.value?Number(select.value):0}
function currentTournament():Tournament|undefined{const id=currentTournamentId();return readTournaments().find(t=>t.id===id)}

async function rpcCreate(tournament:Tournament,viewType:ViewType){
  if(!supabase)return null;
  const publicToken=token(24),ownerToken=token(32);
  const {data,error}=await supabase.rpc('tgs_create_share',{p_tournament_id:String(tournament.id),p_view_type:viewType,p_snapshot:tournament,p_public_token:publicToken,p_owner_token:ownerToken});
  if(error)throw error;
  return {tournamentId:tournament.id,viewType,publicToken,ownerToken,url:shareUrl(publicToken,viewType),response:data};
}

async function syncLink(link:ShareLink,tournament:Tournament){
  if(!supabase)return;
  const key=`${link.publicToken}:${tournament.id}`;
  const snapshot=JSON.stringify(tournament);
  if(lastSnapshot.get(key)===snapshot)return;
  const {error}=await supabase.rpc('tgs_update_share',{p_owner_token:link.ownerToken,p_snapshot:tournament});
  if(error){console.error('TGS live share update failed',error);return}
  lastSnapshot.set(key,snapshot);
  const channel=supabase.channel(`tgs-share-${link.publicToken}`);
  await channel.send({type:'broadcast',event:'refresh',payload:{updated_at:new Date().toISOString()}}).catch(()=>{});
  setTimeout(()=>supabase?.removeChannel(channel),500);
}

async function syncAll(){
  if(syncing||!shareBackendConfigured||!sessionEmail())return;
  syncing=true;
  try{
    const tournaments=readTournaments();
    const links=readLinks();
    await Promise.all(links.map(async link=>{const tournament=tournaments.find(t=>t.id===link.tournamentId);if(tournament)await syncLink(link,tournament)}));
  }finally{syncing=false}
}

function copy(text:string){navigator.clipboard?.writeText(text).then(()=>{const el=document.querySelector('.tgs-share-copy-status');if(el)el.textContent='Copied!'})}
function closeModal(){document.querySelector('.tgs-share-overlay')?.remove()}
function openShareModal(tournament:Tournament,links:ShareLink[]){
  closeModal();
  const overlay=document.createElement('div');overlay.className='tgs-share-overlay';
  overlay.innerHTML=`<div class="tgs-share-dialog"><div class="tgs-share-head"><div><div class="tgs-share-kicker">LIVE SHARING</div><h2>${escapeHtml(tournament.name)}</h2><p>These links show only the selected fixture or scorecard area and update live.</p></div><button class="tgs-share-close">×</button></div><div class="tgs-share-grid">${links.map(link=>`<div class="tgs-share-item"><div><b>${link.viewType==='fixtures'?'Fixtures':'Scorecard'}</b><small>${link.viewType==='fixtures'?'Live match bracket / rounds':'Live standings / points table'}</small></div><input readonly value="${escapeHtml(link.url)}"><div class="tgs-share-actions"><button data-copy="${escapeHtml(link.url)}">Copy Link</button><button data-open="${escapeHtml(link.url)}">Open</button></div></div>`).join('')}</div><div class="tgs-share-obs"><b>OBS Browser Source</b><span>Use either link as an OBS Browser Source URL. The page contains only the fixtures or scorecard.</span></div><div class="tgs-share-copy-status"></div><button class="tgs-share-done">Done</button></div>`;
  overlay.querySelector('.tgs-share-close')?.addEventListener('click',closeModal);overlay.querySelector('.tgs-share-done')?.addEventListener('click',closeModal);
  overlay.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',()=>copy((el as HTMLElement).dataset.copy||'')));
  overlay.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>window.open((el as HTMLElement).dataset.open||'','_blank','noopener,noreferrer')));
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal()});document.body.appendChild(overlay);
}
function escapeHtml(value:string){return value.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]||c))}

async function createOrShow(viewType:ViewType){
  if(!shareBackendConfigured){alert('Live sharing is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployed app first.');return}
  const tournament=currentTournament();
  if(!tournament){alert('Open Matches and select a tournament first.');return}
  const links=readLinks();
  let link=links.find(x=>x.tournamentId===tournament.id&&x.viewType===viewType);
  try{
    if(!link){const created=await rpcCreate(tournament,viewType);if(!created)throw new Error('Supabase is not configured');link={tournamentId:tournament.id,viewType,publicToken:created.publicToken,ownerToken:created.ownerToken,url:created.url};links.push(link);writeLinks(links)}
    await syncLink(link,tournament);
    openShareModal(tournament,links.filter(x=>x.tournamentId===tournament.id));
  }catch(error){console.error(error);alert(`Could not create live share link. ${error instanceof Error?error.message:''}`)}
}

function injectStyles(){
  if(document.getElementById('tgs-share-manager-style'))return;
  const style=document.createElement('style');style.id='tgs-share-manager-style';style.textContent=`
  .tgs-share-toolbar-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 12px;border:1px solid rgba(34,211,238,.22);border-radius:10px;background:rgba(34,211,238,.06);color:#72e4f2;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.tgs-share-toolbar-btn:hover{background:rgba(34,211,238,.12);transform:translateY(-1px)}
  .tgs-share-overlay{position:fixed;inset:0;z-index:100001;background:rgba(3,7,16,.72);backdrop-filter:blur(9px);display:grid;place-items:center;padding:20px}.tgs-share-dialog{width:min(720px,96vw);max-height:90vh;overflow:auto;background:#101728;border:1px solid rgba(109,124,255,.25);border-radius:20px;padding:21px;box-shadow:0 30px 90px rgba(0,0,0,.45);color:#eef2ff}.tgs-share-head{display:flex;justify-content:space-between;gap:15px}.tgs-share-kicker{font-size:9px;color:#7e8cff;font-weight:900;letter-spacing:.15em}.tgs-share-head h2{margin:5px 0 5px;font-size:19px}.tgs-share-head p{margin:0;color:#8996b1;font-size:10px;line-height:1.5}.tgs-share-close{width:32px;height:32px;border:0;border-radius:9px;background:#202a42;color:#aeb8ff;font-size:19px}.tgs-share-grid{display:grid;gap:10px;margin-top:18px}.tgs-share-item{padding:13px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:#0c1322}.tgs-share-item>div:first-child{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.tgs-share-item b{font-size:11px}.tgs-share-item small{color:#75819b;font-size:9px}.tgs-share-item input{width:100%;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#070d1a;color:#aeb8ff;padding:9px;font-size:9px;outline:none}.tgs-share-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:8px}.tgs-share-actions button,.tgs-share-done{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#1c263c;color:#d9def0;padding:8px 11px;font-size:9px;font-weight:800}.tgs-share-obs{margin-top:14px;padding:11px;border-radius:11px;background:rgba(109,124,255,.07);border:1px solid rgba(109,124,255,.14);display:grid;gap:4px}.tgs-share-obs b{font-size:10px;color:#b5bdff}.tgs-share-obs span{font-size:9px;color:#7f8ba5;line-height:1.5}.tgs-share-copy-status{height:15px;margin-top:5px;text-align:right;color:#71e69a;font-size:9px;font-weight:900}.tgs-share-done{display:block;margin:3px 0 0 auto;background:#6978ff;color:#08101c;border:0}
  `;document.head.appendChild(style)
}

function addToolbarButtons(){
  const toolbar=document.querySelector('.bracket-toolbar');
  if(!toolbar||toolbar.querySelector('.tgs-share-fixtures'))return;
  const fixtures=document.createElement('button');fixtures.type='button';fixtures.className='tgs-share-toolbar-btn tgs-share-fixtures';fixtures.textContent='Share Fixtures';fixtures.onclick=()=>createOrShow('fixtures');
  const scorecard=document.createElement('button');scorecard.type='button';scorecard.className='tgs-share-toolbar-btn tgs-share-scorecard';scorecard.textContent='Share Scorecard';scorecard.onclick=()=>createOrShow('scorecard');
  toolbar.append(fixtures,scorecard);
}

export function initShareManager(){
  if(window.location.search.includes('share='))return;
  injectStyles();
  const enhance=()=>{addToolbarButtons();syncAll()};
  observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});
  enhance();
  window.setInterval(syncAll,1200);
}
