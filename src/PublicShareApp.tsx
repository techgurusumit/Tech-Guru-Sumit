import React from 'react';
import { createRoot } from 'react-dom/client';
import { supabase, shareBackendConfigured } from './share-config';
import './public-share.css';

type ViewType = 'fixtures' | 'scorecard';
type Fixture = {id:number;roundIndex:number;round:string;position:number;player1?:string;player2?:string;score1?:number;score2?:number;winner?:string;bye?:boolean;dateTime?:string;stage?:string};
type Tournament = {name:string;game:string;format:string;players:number;playerNames:string[];status:string;date:string;fixtures:Fixture[]};
type ShareRow = {view_type:ViewType;snapshot:Tournament;updated_at:string};

function standings(t:Tournament){
  const map=new Map<string,{name:string;played:number;wins:number;losses:number;points:number;for:number;against:number}>();
  (t.playerNames||[]).forEach(name=>{if(name)map.set(name,{name,played:0,wins:0,losses:0,points:0,for:0,against:0})});
  (t.fixtures||[]).forEach(f=>{
    if(!f.winner||!f.player1||!f.player2||f.score1===undefined||f.score2===undefined)return;
    const a=map.get(f.player1),b=map.get(f.player2);if(!a||!b)return;
    a.played++;b.played++;a.for+=f.score1;a.against+=f.score2;b.for+=f.score2;b.against+=f.score1;
    if(f.winner===a.name){a.wins++;a.points+=3;b.losses++}else if(f.winner===b.name){b.wins++;b.points+=3;a.losses++}
  });
  return [...map.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||(b.for-b.against)-(a.for-a.against)||a.name.localeCompare(b.name));
}

function PublicShareApp(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('share')||'';
  const requested=(params.get('view')||'fixtures') as ViewType;
  const [row,setRow]=React.useState<ShareRow|null>(null);
  const [error,setError]=React.useState('');
  const [live,setLive]=React.useState(false);
  const [lastUpdate,setLastUpdate]=React.useState('');

  const load=React.useCallback(async()=>{
    if(!shareBackendConfigured||!supabase||!token){setError('This live share link is not configured correctly.');return}
    const {data,error:rpcError}=await supabase.rpc('tgs_get_share',{p_public_token:token});
    if(rpcError){setError(rpcError.message||'Live share could not be loaded.');return}
    const item=Array.isArray(data)?data[0]:data;
    if(!item){setError('This live share link is invalid or has expired.');return}
    setRow(item as ShareRow);setLastUpdate(item.updated_at||new Date().toISOString());setError('');
  },[token]);

  React.useEffect(()=>{load()},[load]);
  React.useEffect(()=>{const id=window.setInterval(load,3000);return()=>window.clearInterval(id)},[load]);

  React.useEffect(()=>{
    if(!supabase||!token)return;
    const channel=supabase.channel(`tgs-share-${token}`)
      .on('broadcast',{event:'refresh'},()=>{load()})
      .subscribe(status=>{setLive(status==='SUBSCRIBED')});
    return()=>{supabase.removeChannel(channel)};
  },[token,load]);

  if(!shareBackendConfigured)return <div className="public-share-shell"><div className="public-share-error"><b>Live sharing is not configured.</b><span>Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployed app.</span></div></div>;
  if(error)return <div className="public-share-shell"><div className="public-share-error"><b>Unable to load live view</b><span>{error}</span><button onClick={load}>Retry</button></div></div>;
  if(!row)return <div className="public-share-shell"><div className="public-share-loading"><span className="live-dot"/> Connecting to live tournament…</div></div>;

  const t=row.snapshot;
  const view=row.view_type||requested;
  const rounds=[...new Set((t.fixtures||[]).map(f=>f.roundIndex))].sort((a,b)=>a-b);
  const rows=standings(t);
  const updated=new Date(lastUpdate||row.updated_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});

  return <div className="public-share-shell">
    <header className="public-share-header"><div><div className="public-kicker">TGS LIVE</div><h1>{t.name}</h1><p>{t.game} · {t.format} · {t.playerNames?.length||t.players||0} Players</p></div><div className="public-live"><span className="live-dot"/> LIVE <small>Updated {updated}</small></div></header>
    {view==='scorecard'?<section className="public-card scorecard-view"><div className="public-card-title"><div><span>LIVE SCORECARD</span><h2>Standings</h2></div><span>{rows.length} Players</span></div><div className="public-table-wrap"><table className="public-table"><thead><tr><th>#</th><th>PLAYER</th><th>GP</th><th>W</th><th>L</th><th>PTS</th><th>DIFF</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.name}><td className="rank">{i+1}</td><td className="player">{r.name}</td><td>{r.played}</td><td>{r.wins}</td><td>{r.losses}</td><td className="points">{r.points}</td><td>{r.for-r.against>0?'+':''}{r.for-r.against}</td></tr>)}</tbody></table></div></section>:<section className="public-card fixtures-view"><div className="public-card-title"><div><span>LIVE FIXTURES</span><h2>Match Bracket</h2></div><span>{t.fixtures?.length||0} Matches</span></div>{!rounds.length?<div className="public-empty">No fixtures have been created yet.</div>:<div className="public-bracket">{rounds.map(r=><div className="public-round" key={r}><div className="public-round-title">{t.fixtures.find(f=>f.roundIndex===r)?.round||`Round ${r+1}`}<small>{t.fixtures.filter(f=>f.roundIndex===r).length} matches</small></div><div className="public-round-matches">{t.fixtures.filter(f=>f.roundIndex===r).map(f=><div className={`public-match ${f.winner?'completed':''}`} key={f.id}><div><b className={f.winner===f.player1?'winner':''}>{f.player1||'TBD'}</b><strong>{f.score1??'—'}</strong></div><div><b className={f.winner===f.player2?'winner':''}>{f.player2||'TBD'}</b><strong>{f.score2??'—'}</strong></div>{f.winner&&<small>{f.bye?'BYE · ':''}{f.winner} advances</small>}</div>)}</div></div>)}</div>}</section>}
    <footer className="public-footer"><span>Tech Guru Sumit · TGS Tournament Manager</span><span>{live?'● LIVE SYNC':'Polling for updates…'}</span></footer>
  </div>;
}

export function mountPublicShare(){createRoot(document.getElementById('root')!).render(<React.StrictMode><PublicShareApp/></React.StrictMode>)}
