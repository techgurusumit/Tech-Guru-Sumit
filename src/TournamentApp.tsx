import React from 'react';
import { Trophy, Users, Swords, BarChart3, Settings, Plus, ArrowRight, CalendarDays, Gamepad2, Crown, LogIn, LogOut, Moon, Sun, X, Trash2, Pencil, GitBranch, Lock, ChevronDown, Search, Clock3, CheckCircle2, Upload, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import './tournament-formats.css';
import { supabase } from './share-config';

type ResultType='winner'|'loser';
type SourceRef={id:number;result:ResultType};
type Fixture={
  id:number; roundIndex:number; round:string; position:number;
  player1?:string; player2?:string; pending1?:boolean; pending2?:boolean;
  score1?:number; score2?:number; winner?:string; dateTime?:string;
  source1?:SourceRef; source2?:SourceRef; stage?:string; bye?:boolean;
};
type Tournament={id:number;name:string;game:string;format:string;players:number;playerNames:string[];status:'Live'|'Upcoming'|'Completed';date:string;password:string;passwordEnabled:boolean;fixtures:Fixture[]};
type User={name:string;email:string;password:string};

export const FORMAT_OPTIONS=[
  {name:'Round Robin',icon:'▦',description:'Everyone plays everyone, and the winner is determined by total points.'},
  {name:'Single Elimination',icon:'◫',description:'One loss eliminates a participant. Winners advance through the bracket.'},
  {name:'Double Elimination',icon:'◆',description:'Participants get a second chance through the winners and losers brackets.'},
  {name:'3 Game Guarantee',icon:'✦',description:'Every participant is scheduled for at least three games.'},
  {name:'Swiss System',icon:'▤',description:'Several rounds with opponents matched by similar results; nobody is eliminated early.'},
  {name:'League (Season Format)',icon:'♜',description:'A full season with recurring fixtures, automatic standings and tracking.'}
] as const;

const sample:Tournament[]=[
 {id:1,name:'TGS Clash #2',game:'Asphalt Legends',format:'Single Elimination',players:16,playerNames:Array.from({length:16},(_,i)=>`Player ${i+1}`),status:'Completed',date:'13 Sep 2026',password:'',passwordEnabled:false,fixtures:[]},
 {id:2,name:'Death Race: Chapter 4',game:'Asphalt Legends',format:'Single Elimination',players:32,playerNames:Array.from({length:32},(_,i)=>`Player ${i+1}`),status:'Completed',date:'09 Aug 2026',password:'',passwordEnabled:false,fixtures:[]},
 {id:3,name:'TGS Community Cup',game:'Subway Surfers',format:'League (Season Format)',players:12,playerNames:Array.from({length:12},(_,i)=>`Player ${i+1}`),status:'Upcoming',date:'20 Sep 2026',password:'',passwordEnabled:false,fixtures:[]}
];

function nextPowerOfTwo(n:number){let x=2;while(x<n)x*=2;return x}
function roundLabel(size:number,index:number){const left=size/Math.pow(2,index);if(left===2)return 'Final';if(left===4)return 'SF';if(left===8)return 'QF';return `R${left}`}
function idFactory(){let n=Date.now()*1000;return()=>++n}
function cleanNames(names:string[]){return names.map(x=>x.trim()).filter(Boolean)}

function circleRounds(names:string[],rounds?:number){
 const arr=names.slice(); if(arr.length%2)arr.push('');
 const total=arr.length; const all:number[][]=[]; let current=arr.map((_,i)=>i);
 const count=rounds??Math.max(1,total-1);
 for(let r=0;r<count;r++){
  const pairs:number[][]=[];
  for(let i=0;i<total/2;i++){const a=current[i],b=current[total-1-i];if(arr[a]&&arr[b])pairs.push([a,b]);}
  all.push(pairs); current=[current[0],current[total-1],...current.slice(1,total-1)];
 }
 return all.map(pairs=>pairs.map(([a,b])=>[arr[a],arr[b]] as [string,string]));
}

function makeRoundRobin(names:string[],league=false):Fixture[]{
 const clean=cleanNames(names);const rounds=circleRounds(clean);const id=idFactory();const out:Fixture[]=[];
 rounds.forEach((pairs,r)=>pairs.forEach(([a,b],p)=>out.push({id:id(),roundIndex:r,round:league?`Season R${r+1}`:`Round ${r+1}`,position:p,player1:a,player2:b,stage:league?'League':'Round Robin'})));
 if(league){
  const offset=rounds.length;
  rounds.forEach((pairs,r)=>pairs.forEach(([a,b],p)=>out.push({id:id(),roundIndex:offset+r,round:`Season R${offset+r+1}`,position:p,player1:b,player2:a,stage:'League'})));
 }
 return out;
}

function makeSingleElimination(names:string[]):Fixture[]{
 const clean=cleanNames(names);const n=clean.length;const size=nextPowerOfTwo(Math.max(2,n));const matches=size/2;const byes=size-n;const id=idFactory();const rounds:Fixture[][]=[];let cursor=0;
 const first:Fixture[]=[];
 for(let p=0;p<matches;p++){
  let a:string|undefined,b:string|undefined;
  if(p<byes){a=clean[cursor++];b=undefined}else{a=clean[cursor++];b=clean[cursor++];}
  first.push({id:id(),roundIndex:0,round:roundLabel(size,0),position:p,player1:a,player2:b,stage:'Single Elimination',bye:Boolean(a&&!b)});
 }
 rounds.push(first);
 for(let r=1;r<Math.log2(size);r++){
  const count=size/Math.pow(2,r+1);const prev=rounds[r-1];const row:Fixture[]=[];
  for(let p=0;p<count;p++)row.push({id:id(),roundIndex:r,round:roundLabel(size,r),position:p,source1:{id:prev[p*2].id,result:'winner'},source2:{id:prev[p*2+1].id,result:'winner'},stage:'Single Elimination'});
  rounds.push(row);
 }
 const out=rounds.flat();
 return resolveAutoFixtures(out);
}

function makeDoubleElimination(names:string[]):Fixture[]{
 const clean=cleanNames(names);const n=clean.length;if(n<=2)return makeSingleElimination(clean);
 const size=nextPowerOfTwo(Math.max(4,n));const matches=size/2;const byes=size-n;const id=idFactory();const winners:Fixture[][]=[];const first:Fixture[]=[];let cursor=0;
 for(let p=0;p<matches;p++){
  let a:string|undefined,b:string|undefined;
  if(p<byes){a=clean[cursor++]}else{a=clean[cursor++];b=clean[cursor++]}
  first.push({id:id(),roundIndex:0,round:`Winners R1`,position:p,player1:a,player2:b,stage:'Winners Bracket',bye:Boolean(a&&!b)});
 }
 winners.push(first);
 const k=Math.log2(size);
 for(let r=1;r<k;r++){
  const count=size/Math.pow(2,r+1);const prev=winners[r-1];const row:Fixture[]=[];
  for(let p=0;p<count;p++)row.push({id:id(),roundIndex:r,round:`Winners R${r+1}`,position:p,source1:{id:prev[p*2].id,result:'winner'},source2:{id:prev[p*2+1].id,result:'winner'},stage:'Winners Bracket'});
  winners.push(row);
 }
 const losersRounds:Fixture[][]=[];
 const l0:Fixture[]=[];for(let p=0;p<first.length/2;p++)l0.push({id:id(),roundIndex:k,round:'Losers R1',position:p,source1:{id:first[p*2].id,result:'loser'},source2:{id:first[p*2+1].id,result:'loser'},stage:'Losers Bracket'});losersRounds.push(l0);
 let loserRoundIndex=k+1;
 for(let r=1;r<k;r++){
  const previous=losersRounds[losersRounds.length-1];const currentWinners=winners[r];const target=currentWinners.length;let sourceWinners=previous;
  if(sourceWinners.length>target){
   const cross:Fixture[]=[];for(let p=0;p<target;p++)cross.push({id:id(),roundIndex:loserRoundIndex++,round:`Losers R${loserRoundIndex-k}`,position:p,source1:{id:sourceWinners[p*2].id,result:'winner'},source2:{id:sourceWinners[p*2+1].id,result:'winner'},stage:'Losers Bracket'});
   losersRounds.push(cross);sourceWinners=cross;
  }
  const drop:Fixture[]=[];for(let p=0;p<target;p++)drop.push({id:id(),roundIndex:loserRoundIndex++,round:`Losers R${loserRoundIndex-k}`,position:p,source1:{id:sourceWinners[p].id,result:'winner'},source2:{id:currentWinners[p].id,result:'loser'},stage:'Losers Bracket'});
  losersRounds.push(drop);
 }
 const lastLosers=losersRounds[losersRounds.length-1];
 const qualifier:Fixture={id:id(),roundIndex:loserRoundIndex,round:'Losers Final',position:0,source1:{id:lastLosers[0].id,result:'winner'},source2:{id:winners[k-1][0].id,result:'loser'},stage:'Losers Bracket'};
 const grand:Fixture={id:id(),roundIndex:loserRoundIndex+1,round:'Grand Final',position:0,source1:{id:winners[k-1][0].id,result:'winner'},source2:{id:qualifier.id,result:'winner'},stage:'Grand Final'};
 const out=[...winners.flat(),...losersRounds.flat(),qualifier,grand];
 return resolveAutoFixtures(out);
}

function makeGuarantee(names:string[]):Fixture[]{
 const clean=cleanNames(names);if(clean.length<2)return [];
 const rounds=clean.length<4?(clean.length===2?3:5):(clean.length%2===0?3:4);
 const pairs=circleRounds(clean,rounds);const id=idFactory();const out:Fixture[]=[];
 pairs.forEach((round,r)=>round.forEach(([a,b],p)=>out.push({id:id(),roundIndex:r,round:`Guarantee R${r+1}`,position:p,player1:a,player2:b,stage:'3 Game Guarantee'})));
 return out;
}

function makeSwiss(names:string[]):Fixture[]{
 const clean=cleanNames(names);const pairs=circleRounds(clean,1)[0]||[];const id=idFactory();return pairs.map(([a,b],p)=>({id:id(),roundIndex:0,round:'Swiss R1',position:p,player1:a,player2:b,stage:'Swiss System'}));
}

export function generateFixtures(format:string,names:string[]):Fixture[]{
 switch(format){
  case 'Round Robin':return makeRoundRobin(names);
  case 'Double Elimination':return makeDoubleElimination(names);
  case '3 Game Guarantee':return makeGuarantee(names);
  case 'Swiss System':return makeSwiss(names);
  case 'League (Season Format)':return makeRoundRobin(names,true);
  default:return makeSingleElimination(names);
 }
}

function resolveAutoFixtures(fixtures:Fixture[]){
 const out=fixtures.map(f=>({...f}));
 let changed=true;
 while(changed){
  changed=false;
  for(const f of out){
   const set=(source?:SourceRef)=>{
    if(!source)return;
    const sourceFixture=out.find(x=>x.id===source.id);
    if(!sourceFixture||!sourceFixture.winner)return;
    let value:string|undefined;
    if(source.result==='winner'){
      value=sourceFixture.winner;
    }else{
      if(!sourceFixture.player1||!sourceFixture.player2)return;
      if(sourceFixture.score1===undefined||sourceFixture.score2===undefined)return;
      value=sourceFixture.winner===sourceFixture.player1?sourceFixture.player2:sourceFixture.player1;
    }
    if(!value)return;
    if(f.source1?.id===source.id&&f.source1.result===source.result&&f.player1!==value){f.player1=value;f.pending1=false;changed=true}
    if(f.source2?.id===source.id&&f.source2.result===source.result&&f.player2!==value){f.player2=value;f.pending2=false;changed=true}
   };
   set(f.source1);set(f.source2);
   if(f.bye&&!f.winner){
    if(f.player1&&!f.player2){f.winner=f.player1;changed=true}
    else if(f.player2&&!f.player1){f.winner=f.player2;changed=true}
   }
  }
 }
 return out;
}

function normalize(t:any):Tournament{const count=Math.max(2,Number(t.players)||2);const names=Array.isArray(t.playerNames)&&t.playerNames.length?t.playerNames.slice(0,count):Array.from({length:count},(_,i)=>`Player ${i+1}`);while(names.length<count)names.push(`Player ${names.length+1}`);const protectedTournament=t.passwordEnabled===true&&typeof t.password==='string'&&t.password.length>0;return {...t,players:count,playerNames:names,password:protectedTournament?t.password:'',passwordEnabled:protectedTournament,fixtures:Array.isArray(t.fixtures)?t.fixtures:[]}}
function loadTournaments():Tournament[]{try{const raw=localStorage.getItem('tgs_tournaments');if(!raw)return sample;const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed.map(normalize):sample}catch{return sample}}
function uniquePlayers(ts:Tournament[]){return Array.from(new Set(ts.flatMap(t=>t.playerNames.map(p=>p.trim()).filter(Boolean))))}

function standings(t:Tournament){
 const map=new Map<string,{name:string;played:number;wins:number;losses:number;points:number;for:number;against:number}>();
 t.playerNames.forEach(name=>map.set(name,{name,played:0,wins:0,losses:0,points:0,for:0,against:0}));
 t.fixtures.forEach(f=>{if(!f.winner||!f.player1)return;const a=map.get(f.player1),b=f.player2?map.get(f.player2):undefined;if(!a)return;if(!b){a.points+=3;return}a.played++;b.played++;a.for+=f.score1??0;a.against+=f.score2??0;b.for+=f.score2??0;b.against+=f.score1??0;if(f.winner===a.name){a.wins++;a.points+=3;b.losses++}else if(f.winner===b.name){b.wins++;b.points+=3;a.losses++}});
 return Array.from(map.values()).sort((a,b)=>b.points-a.points||b.wins-a.wins||(b.for-b.against)-(a.for-a.against));
}

function App(){
 const [active,setActive]=React.useState('Dashboard');const [tournaments,setTournaments]=React.useState<Tournament[]>(loadTournaments);const [user,setUser]=React.useState<User|null>(()=>{try{const s=localStorage.getItem('tgs_session');return s?JSON.parse(s):null}catch{return null}});const [authMode,setAuthMode]=React.useState<'login'|'register'>('login');const [theme,setTheme]=React.useState<'dark'|'light'>((localStorage.getItem('tgs_theme') as any)||'dark');const [gamingTheme,setGamingTheme]=React.useState<GamingTheme>((localStorage.getItem('tgs_gaming_theme') as GamingTheme)||'cyber');const [create,setCreate]=React.useState(false);const [edit,setEdit]=React.useState<Tournament|null>(null);const [playersEdit,setPlayersEdit]=React.useState<Tournament|null>(null);const [guard,setGuard]=React.useState<{action:'edit'|'delete'|'fixtures';t:Tournament}|null>(null);const [toast,setToast]=React.useState('');
 React.useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('tgs_theme',theme)},[theme]);React.useEffect(()=>{document.documentElement.dataset.gamingTheme=gamingTheme;localStorage.setItem('tgs_gaming_theme',gamingTheme)},[gamingTheme]);React.useEffect(()=>{const bg=localStorage.getItem('tgs_background');document.documentElement.style.setProperty('--tgs-custom-background',bg?`url("${bg}")`:'none')},[]);React.useEffect(()=>{localStorage.setItem('tgs_tournaments',JSON.stringify(tournaments))},[tournaments]);
 const nav=[['Dashboard',BarChart3],['Tournaments',Trophy],['Players',Users],['Matches',Swords],['Reports',BarChart3]] as const;const logout=()=>{localStorage.removeItem('tgs_session');setUser(null);setAuthMode('login')};const updateTournament=(id:number,fn:(t:Tournament)=>Tournament)=>setTournaments(ts=>ts.map(t=>t.id===id?fn(t):t));
 const saveFixture=(id:number,fixture:Fixture)=>setTournaments(ts=>ts.map(t=>{if(t.id!==id)return t;let fixtures=t.fixtures.map(x=>x.id===fixture.id?fixture:{...x});fixtures=resolveAutoFixtures(fixtures);
  const current=fixtures.find(x=>x.id===fixture.id);if(current&&t.format==='Swiss System'&&current.winner){const round=current.roundIndex;const same=fixtures.filter(x=>x.roundIndex===round);if(same.length&&same.every(x=>x.winner)){const totalRounds=Math.max(3,Math.ceil(Math.log2(Math.max(2,t.players))));if(round<totalRounds-1&&!fixtures.some(x=>x.roundIndex===round+1))fixtures=[...fixtures,...buildSwissNextRound(fixtures,t.playerNames,round+1)];}}
  const completed=fixtures.filter(f=>f.player1&&f.player2).every(f=>Boolean(f.winner));const finalDone=fixtures.some(f=>f.round==='Final'||f.round==='Grand Final')&&fixtures.filter(f=>f.round==='Final'||f.round==='Grand Final').every(f=>Boolean(f.winner));const status=finalDone||((t.format==='Round Robin'||t.format==='League (Season Format)'||t.format==='3 Game Guarantee')&&completed)?'Completed':'Live';return {...t,fixtures,status};}));
 const executeAction=(action:'edit'|'delete'|'fixtures',t:Tournament)=>{if(action==='delete'){setTournaments(x=>x.filter(v=>v.id!==t.id));setToast('Tournament deleted.');return}if(action==='edit'){setEdit(t);return}const names=t.playerNames.filter(Boolean);if(names.length<2){setToast('Add at least 2 players before creating fixtures.');return}const fixtures=generateFixtures(t.format,names);updateTournament(t.id,v=>({...v,fixtures,status:'Live'}));setActive('Matches');setToast(`${t.format} fixtures created: ${fixtures.length} matches.`)};
 const handleAction=(a:'edit'|'delete'|'fixtures',t:Tournament)=>{if(!t.passwordEnabled){executeAction(a,t);return}setGuard({action:a,t})};const checkPassword=(p:string)=>{if(!guard)return;if(p!==guard.t.password){setToast('Incorrect tournament password.');return}const g=guard;setGuard(null);executeAction(g.action,g.t)};
 if(!user)return <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={u=>{setUser(u);localStorage.setItem('tgs_session',JSON.stringify(u))}}/>;
 const activePlayers=uniquePlayers(tournaments);const totalMatches=tournaments.reduce((n,t)=>n+t.fixtures.length,0);
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">TGS</div><div><strong>Tournament Manager</strong><span>Tech Guru Sumit</span></div></div><div className="side-section-title">MANAGEMENT</div><nav>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${active===label?'active':''}`} onClick={()=>{setActive(label);setToast('')}}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-spacer"/><button className={`nav-item ${active==='Settings'?'active':''}`} onClick={()=>setActive('Settings')}><Settings size={18}/><span>Settings</span></button><div className="profile-mini"><div className="avatar">{user.name[0]?.toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-btn" onClick={logout} title="Logout"><LogOut size={15}/></button></div></aside>
 <main className="main-content"><header className="topbar"><div><p className="eyebrow">TGS ESPORTS / CONTROL CENTER</p><h1>{active}</h1></div><div className="top-actions"><button className="theme-btn" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}<span>{theme==='dark'?'Light':'Dark'} theme</span></button><button className="primary-btn" onClick={()=>setCreate(true)}><Plus size={18}/> Create Tournament</button></div></header>{toast&&<div className="toast">{toast}</div>}{active==='Dashboard'&&<Dashboard tournaments={tournaments} players={activePlayers.length} matches={totalMatches} onNavigate={setActive}/>} {active==='Tournaments'&&<TournamentList tournaments={tournaments} onCreate={()=>setCreate(true)} onAction={handleAction}/>} {active==='Players'&&<PlayersPage tournaments={tournaments} onEdit={setPlayersEdit}/>} {active==='Matches'&&<MatchesPage tournaments={tournaments} onUpdate={saveFixture}/>} {active==='Reports'&&<Reports tournaments={tournaments}/>} {active==='Settings'&&<SettingsPage theme={theme} setTheme={setTheme} user={user} logout={logout} gamingTheme={gamingTheme} setGamingTheme={setGamingTheme}/>}</main>
 {create&&<CreateModal close={()=>setCreate(false)} save={t=>{setTournaments(x=>[{...t,id:Date.now()},...x]);setCreate(false);setActive('Tournaments');setToast(`${t.format} tournament created.`)}}/>}{edit&&<EditModal tournament={edit} close={()=>setEdit(null)} save={t=>{setTournaments(x=>x.map(v=>v.id===t.id?t:v));setEdit(null);setToast('Tournament updated. Existing fixtures were reset if the format changed.')}}/>}{playersEdit&&<PlayersModal tournament={playersEdit} close={()=>setPlayersEdit(null)} save={t=>{setTournaments(x=>x.map(v=>v.id===t.id?t:v));setPlayersEdit(null);setToast('Player list updated.')}}/>}{guard&&<PasswordModal action={guard.action} tournament={guard.t} close={()=>setGuard(null)} verify={checkPassword}/>}</div>;
}

function buildSwissNextRound(fixtures:Fixture[],names:string[],roundIndex:number):Fixture[]{
 const scores=new Map<string,{points:number;wins:number;diff:number}>();names.forEach(n=>scores.set(n,{points:0,wins:0,diff:0}));const played=new Set<string>();const byes=new Set<string>();
 fixtures.filter(f=>f.roundIndex<roundIndex&&f.winner).forEach(f=>{if(!f.player1)return;const a=scores.get(f.player1);const b=f.player2?scores.get(f.player2):undefined;if(!a)return;if(!b){a.points+=3;byes.add(f.player1);return}played.add([f.player1,f.player2].sort().join('|'));if(f.winner===f.player1){a.points+=3;a.wins++;}else{b!.points+=3;b!.wins++;}a.diff+=(f.score1??0)-(f.score2??0);b!.diff+=(f.score2??0)-(f.score1??0)});
 const sorted=Array.from(scores.keys()).sort((a,b)=>{const A=scores.get(a)!,B=scores.get(b)!;return B.points-A.points||B.wins-A.wins||B.diff-A.diff});const pairs:[string,string][]=[];const used=new Set<string>();
 for(let i=0;i<sorted.length;i++){const a=sorted[i];if(used.has(a))continue;let found=-1;for(let j=i+1;j<sorted.length;j++){const b=sorted[j];if(used.has(b))continue;if(!played.has([a,b].sort().join('|'))&&!byes.has(b)){found=j;break}}if(found<0){for(let j=i+1;j<sorted.length;j++)if(!used.has(sorted[j])){found=j;break}}if(found>=0){const b=sorted[found];pairs.push([a,b]);used.add(a);used.add(b)}}
 const id=idFactory();return pairs.map(([a,b],p)=>({id:id(),roundIndex,round:`Swiss R${roundIndex+1}`,position:p,player1:a,player2:b,stage:'Swiss System'}));
}

function Dashboard({tournaments,players,matches,onNavigate}:{tournaments:Tournament[];players:number;matches:number;onNavigate:(x:string)=>void}){return <><section className="hero-card"><div><span className="badge"><Gamepad2 size={14}/> Tournament Control</span><h2>Run every tournament from one place.</h2><p>Create tournaments, add players, generate format-specific fixtures and record results.</p></div><div className="hero-icon"><Trophy size={54}/></div></section><section className="stats-grid"><Stat label="Total Tournaments" value={String(tournaments.length)} helper="Across all games" icon={<Trophy size={20}/>} onClick={()=>onNavigate('Tournaments')}/><Stat label="Active Players" value={String(players)} helper="Unique registered players" icon={<Users size={20}/>} onClick={()=>onNavigate('Players')}/><Stat label="Matches Recorded" value={String(matches)} helper="All generated fixtures" icon={<Swords size={20}/>} onClick={()=>onNavigate('Matches')}/><Stat label="Completed" value={String(tournaments.filter(t=>t.status==='Completed').length)} helper="Tournament history" icon={<Crown size={20}/>} onClick={()=>onNavigate('Reports')}/></section><section className="section-block"><div className="section-head"><div><h3>Recent tournaments</h3><p>Each tournament now uses its selected format engine.</p></div><button className="text-btn" onClick={()=>onNavigate('Tournaments')}>View all <ArrowRight size={16}/></button></div><div className="tournament-grid">{tournaments.slice(0,6).map(t=><TournamentCard key={t.id} t={t}/>)}</div></section></>}
function TournamentList({tournaments,onCreate,onAction}:{tournaments:Tournament[];onCreate:()=>void;onAction:(a:'edit'|'delete'|'fixtures',t:Tournament)=>void}){return <section className="section-block"><div className="section-head"><div><h3>All tournaments</h3><p>{tournaments.length} tournament records</p></div><button className="primary-btn" onClick={onCreate}><Plus size={17}/> New Tournament</button></div><div className="tournament-grid">{tournaments.map(t=><TournamentCard key={t.id} t={t} action={onAction}/>)}</div></section>}
function TournamentCard({t,action}:{t:Tournament;action?:((a:'edit'|'delete'|'fixtures',t:Tournament)=>void)}){return <article className="tournament-card"><div className="card-top"><div className="game-icon"><Gamepad2 size={19}/></div><span className={`status ${t.status.toLowerCase()}`}>{t.status}</span></div><h4>{t.name}</h4><p className="muted">{t.game} · {t.format}</p><div className="meta-row"><span><Users size={15}/> {t.playerNames.length} players</span><span><Swords size={15}/> {t.fixtures.length} matches</span><span><CalendarDays size={15}/> {t.date}</span></div>{action?<div className="card-actions"><button onClick={()=>action('fixtures',t)}><GitBranch size={15}/> Create Fixtures</button><button onClick={()=>action('edit',t)}><Pencil size={15}/> Update</button><button className="delete-action" onClick={()=>action('delete',t)}><Trash2 size={15}/> Delete</button></div>:<span className="muted">Open Tournaments for management actions</span>}</article>}
function Stat({label,value,helper,icon,onClick}:{label:string;value:string;helper:string;icon:React.ReactNode;onClick:()=>void}){return <button className="stat-card stat-clickable" onClick={onClick}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></button>}
function PlayersPage({tournaments,onEdit}:{tournaments:Tournament[];onEdit:(t:Tournament)=>void}){const[q,setQ]=React.useState('');return <section className="section-block"><div className="section-head"><div><h3>Active Players</h3><p>Manage player names for each tournament before creating fixtures.</p></div><div className="search-box"><Search size={15}/><input placeholder="Search player" value={q} onChange={e=>setQ(e.target.value)}/></div></div>{tournaments.length===0?<Empty title="No players yet" text="Create a tournament first." icon={<Users size={34}/>}/>:<div className="players-groups">{tournaments.map(t=>{const names=t.playerNames.map((p,i)=>({p,i})).filter(x=>x.p.toLowerCase().includes(q.toLowerCase()));return <div className="panel" key={t.id}><div className="section-head"><div><h3>{t.name}</h3><p>{t.game} · {t.format} · {t.playerNames.length} players</p></div><button className="secondary-btn" onClick={()=>onEdit(t)}><Pencil size={15}/> Edit Players</button></div><div className="list-grid">{names.map(x=><div className="list-row" key={`${t.id}-${x.i}`}><span><b>#{x.i+1}</b> {x.p}</span><small className="muted">{t.status}</small></div>)}</div></div>})}</div>}</section>}
function PlayersModal({tournament,close,save}:{tournament:Tournament;close:()=>void;save:(t:Tournament)=>void}){const[names,setNames]=React.useState(tournament.playerNames);const[error,setError]=React.useState('');const submit=(e:React.FormEvent)=>{e.preventDefault();const clean=names.map(x=>x.trim());if(clean.some(x=>!x))return setError('Every player name is required.');save({...tournament,playerNames:clean,players:clean.length,fixtures:[]})};return <Modal title="Edit Players" subtitle={`Enter players for ${tournament.name}. Fixtures reset when names change.`} close={close}><form onSubmit={submit}><div className="player-editor">{names.map((n,i)=><label key={i}>Player {i+1}<input value={n} onChange={e=>setNames(a=>a.map((x,j)=>j===i?e.target.value:x))}/></label>)}</div>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn">Save Players</button></div></form></Modal>}
function MatchesPage({tournaments,onUpdate}:{tournaments:Tournament[];onUpdate:(id:number,f:Fixture)=>void}){const[selected,setSelected]=React.useState(tournaments.find(t=>t.fixtures.length)?.id||tournaments[0]?.id||0);const current=tournaments.find(t=>t.id===selected);return <section className="section-block"><div className="section-head"><div><h3>{current?.format||'Tournament Fixtures'}</h3><p>Fixtures are generated from the tournament format and participant count.</p></div><div className="select-wrap"><ChevronDown size={15}/><select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{tournaments.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div>{!current||!current.fixtures.length?<Empty title="No fixtures yet" text="Go to Tournaments → Create Fixtures after entering player names." icon={<Swords size={34}/>}/>:<><Bracket fixtures={current.fixtures} tournament={current} onUpdate={onUpdate}/>{current.format!=='Single Elimination'&&current.format!=='Double Elimination'&&<Standings tournament={current}/>}</>}</section>}
function Bracket({fixtures,tournament,onUpdate}:{fixtures:Fixture[];tournament:Tournament;onUpdate:(id:number,f:Fixture)=>void}){
 const shellRef=React.useRef<HTMLDivElement>(null);
 const[fullscreen,setFullscreen]=React.useState(false);
 const[logos,setLogos]=React.useState<{organizer:string;sponsor:string;coSponsor:string}>(()=>{try{return JSON.parse(localStorage.getItem(`tgs_branding_${tournament.id}`)||'{"organizer":"","sponsor":"","coSponsor":""}')}catch{return {organizer:'',sponsor:'',coSponsor:''}}});
 React.useEffect(()=>{try{localStorage.setItem(`tgs_branding_${tournament.id}`,JSON.stringify(logos))}catch{}},[logos,tournament.id]);
 React.useEffect(()=>{const onChange=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',onChange);return()=>document.removeEventListener('fullscreenchange',onChange)},[]);
 const toggleFullscreen=async()=>{if(!shellRef.current)return;if(document.fullscreenElement){await document.exitFullscreen()}else{await shellRef.current.requestFullscreen()}};
 const uploadLogo=(key:'organizer'|'sponsor'|'coSponsor')=>(e:React.ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];if(!file||!file.type.startsWith('image/'))return;
  const reader=new FileReader();reader.onload=()=>setLogos(x=>({...x,[key]:String(reader.result)}));reader.readAsDataURL(file);
 };
 const rounds=Array.from(new Set(fixtures.map(f=>f.roundIndex))).sort((a,b)=>a-b);
 return <div ref={shellRef} className={`bracket-shell ${fullscreen?'is-fullscreen':''}`}>
  <div className="bracket-toolbar">
   <div className="bracket-branding">
    <div className="logo-brand-group"><label className="logo-slot organizer-slot" title="Upload Organizer Logo">{logos.organizer?<img src={logos.organizer} alt="Organizer"/>:<span>ORG</span>}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo('organizer')} hidden/></label><small>ORGANIZER</small></div>
    <div><strong>{tournament.name}</strong><span>{tournament.game} · {tournament.playerNames.length} players · {fixtures.length} total matches</span></div>
   </div>
   <div className="bracket-toolbar-right">
    <div className="sponsor-slots">
     <div className="logo-brand-group"><label className="logo-slot sponsor-slot" title="Upload Sponsor Logo">{logos.sponsor?<img src={logos.sponsor} alt="Sponsor"/>:<span>SP</span>}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo('sponsor')} hidden/></label><small>SPONSOR</small></div>
     <div className="logo-brand-group"><label className="logo-slot sponsor-slot" title="Upload Co-Sponsor Logo">{logos.coSponsor?<img src={logos.coSponsor} alt="Co-Sponsor"/>:<span>CO</span>}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo('coSponsor')} hidden/></label><small>CO-SPONSOR</small></div>
    </div>
    <span className="bracket-note"><CheckCircle2 size={14}/> {tournament.format==='Swiss System'?'Next round unlocks after the current round':'Winner tracking enabled'}</span>
    <button type="button" className="fullscreen-btn" onClick={toggleFullscreen}>{fullscreen?<Minimize2 size={15}/>:<Maximize2 size={15}/>}<span>{fullscreen?'Exit Fullscreen':'Full Screen'}</span></button>
   </div>
  </div>
  <div className="bracket-scroll"><div className="bracket">{rounds.map(r=><div className="bracket-round" key={r}><div className="round-title">{fixtures.find(f=>f.roundIndex===r)?.round||''}<span>{fixtures.filter(f=>f.roundIndex===r).length} matches</span></div><div className="round-matches">{fixtures.filter(f=>f.roundIndex===r).map(f=><BracketMatch key={f.id} fixture={f} onSave={nf=>onUpdate(tournament.id,nf)}/>)}</div></div>)}</div></div>
 </div>
}
function BracketMatch({fixture,onSave}:{fixture:Fixture;onSave:(f:Fixture)=>void}){
 const[p1,setP1]=React.useState(String(fixture.score1??''));
 const[p2,setP2]=React.useState(String(fixture.score2??''));
 React.useEffect(()=>{setP1(String(fixture.score1??''));setP2(String(fixture.score2??''))},[fixture.score1,fixture.score2,fixture.id]);
 const scoresEntered=p1!==''&&p2!==''&&Boolean(fixture.player1)&&Boolean(fixture.player2); const canSave=scoresEntered&&Number(p1)!==Number(p2);
 const save=()=>{if(!canSave)return;const a=Number(p1),b=Number(p2);const winner=a>b?fixture.player1:fixture.player2;if(!winner)return;onSave({...fixture,score1:a,score2:b,winner});};
 const waiting=Boolean(fixture.pending1||fixture.pending2||!fixture.player1||!fixture.player2);
 const p1Winner=Boolean(fixture.winner&&fixture.player1&&fixture.winner===fixture.player1);
 const p2Winner=Boolean(fixture.winner&&fixture.player2&&fixture.winner===fixture.player2);
 return <div className={'bracket-match '+(fixture.winner?'won ':'')+(waiting?'bye':'')}>
  <div className="match-head"><span>{fixture.round} · Game {fixture.position+1}</span><span>{fixture.dateTime?<><Clock3 size={11}/> {fixture.dateTime}</>:''}</span></div>
  <div className="score-match-body">
   <div className={'player-line '+(p1Winner?'winner':'')}><b>{fixture.player1||'TBD'}</b>{!fixture.winner&&fixture.player1&&fixture.player2?<input className="inline-score-input" type="number" min="0" value={p1} onChange={e=>setP1(e.target.value)} placeholder="0"/>:<span>{fixture.score1??''}</span>}</div>
   <div className={'player-line '+(p2Winner?'winner':'')}><b>{fixture.player2||'TBD'}</b>{!fixture.winner&&fixture.player1&&fixture.player2?<input className="inline-score-input" type="number" min="0" value={p2} onChange={e=>setP2(e.target.value)} placeholder="0"/>:<span>{fixture.score2??''}</span>}</div>
  </div>
  {fixture.winner?<div className="winner-line"><CheckCircle2 size={12}/> {fixture.bye?'BYE — ':''}{fixture.winner} advances</div>:waiting?<div className="winner-line">WAITING FOR OPPONENT</div>:scoresEntered?<button className={'tgs-inline-save '+(!canSave?'disabled':'')} onClick={save} disabled={!canSave}>SAVE</button>:null}
 </div>
}function Standings({tournament}:{tournament:Tournament}){const rows=standings(tournament);return <div className="standings-panel"><div className="standings-head"><div><h3>Standings</h3><p>Points, wins and score difference update from recorded results.</p></div><span>{tournament.format}</span></div><div className="standings-table"><div className="standings-row standings-header"><b>#</b><b>Player</b><b>GP</b><b>W</b><b>L</b><b>Pts</b><b>Diff</b></div>{rows.map((r,i)=><div className="standings-row" key={r.name}><span>{i+1}</span><strong>{r.name}</strong><span>{r.played}</span><span>{r.wins}</span><span>{r.losses}</span><span>{r.points}</span><span>{r.for-r.against>0?'+':''}{r.for-r.against}</span></div>)}</div></div>}
function Reports({tournaments}:{tournaments:Tournament[]}){return <section className="section-block"><div className="section-head"><div><h3>Tournament Reports</h3><p>Overview of players, format, fixtures and results.</p></div></div><div className="reports-grid">{tournaments.map(t=><div className="panel" key={t.id}><div className="section-head"><div><h3>{t.name}</h3><p>{t.game} · {t.format}</p></div></div><div className="report-stats"><div><b>{t.playerNames.length}</b><span>Players</span></div><div><b>{t.fixtures.length}</b><span>Fixtures</span></div><div><b>{t.fixtures.filter(f=>f.winner).length}</b><span>Results</span></div></div></div>)}</div></section>}
const GAMING_THEMES=[
 {id:'cyber',name:'Cyber Neon',desc:'Electric blue + violet esports',icon:'◈'},
 {id:'crimson',name:'Crimson Arena',desc:'Red + black competitive',icon:'◆'},
 {id:'toxic',name:'Toxic Rush',desc:'Green + dark racing',icon:'⚡'},
 {id:'purple',name:'Purple Strike',desc:'Violet + magenta gaming',icon:'✦'},
 {id:'ice',name:'Ice Circuit',desc:'Cyan + steel futuristic',icon:'❄'},
 {id:'championship',name:'Championship Gold',desc:'Gold + black premium',icon:'♛'}
] as const;
type GamingTheme=typeof GAMING_THEMES[number]['id'];

function SettingsPage({theme,setTheme,user,logout,gamingTheme,setGamingTheme}:{theme:'dark'|'light';setTheme:(x:'dark'|'light')=>void;user:User;logout:()=>void;gamingTheme:GamingTheme;setGamingTheme:(x:GamingTheme)=>void}){
 const[bg,setBg]=React.useState(()=>localStorage.getItem('tgs_background')||'');
 const[fileName,setFileName]=React.useState(()=>localStorage.getItem('tgs_background_name')||'');
 const upload=async(e:React.ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];if(!file||!file.type.startsWith('image/'))return;
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)});
  const img=new Image();
  img.onload=()=>{
   const max=1920,scale=Math.min(1,max/Math.max(img.width,img.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
   const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const optimized=canvas.toDataURL('image/jpeg',.78);
   try{localStorage.setItem('tgs_background',optimized);localStorage.setItem('tgs_background_name',file.name);setBg(optimized);setFileName(file.name);document.documentElement.style.setProperty('--tgs-custom-background',`url("${optimized}")`)}catch{alert('This image is too large. Please choose a smaller image.')}
  };
  img.src=data;
 };
 const clearBg=()=>{localStorage.removeItem('tgs_background');localStorage.removeItem('tgs_background_name');setBg('');setFileName('');document.documentElement.style.setProperty('--tgs-custom-background','none')};
 return <section className="settings-grid settings-appearance-grid">
  <div className="panel appearance-panel">
   <div className="settings-title-row"><div><h3>Gaming Theme Studio</h3><p className="muted">Change the visual style only. Tournament logic and data stay unchanged.</p></div><span className="settings-chip">6 THEMES</span></div>
   <div className="gaming-theme-grid">
    {GAMING_THEMES.map(t=><button type="button" key={t.id} className={`gaming-theme-card ${gamingTheme===t.id?'selected':''} theme-${t.id}`} onClick={()=>setGamingTheme(t.id)}><span className="theme-preview"><i></i><b>{t.icon}</b></span><span className="theme-card-copy"><strong>{t.name}</strong><small>{t.desc}</small></span></button>)}
   </div>
   <div className="mode-row"><div><strong>Interface mode</strong><small>Keep the existing light/dark option.</small></div><div className="theme-options"><button type="button" className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><Moon size={16}/> Dark</button><button type="button" className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><Sun size={16}/> Light</button></div></div>
  </div>
  <div className="panel background-panel">
   <div className="settings-title-row"><div><h3>Custom Background</h3><p className="muted">Upload a gaming image for the application background.</p></div><Upload size={18}/></div>
   {bg?<div className="background-preview" style={{backgroundImage:`url("${bg}")`}}><div><strong>{fileName||'Custom background'}</strong><small>Stored locally on this browser</small></div></div>:<div className="background-empty"><Upload size={26}/><strong>No custom background</strong><small>JPG, PNG or WEBP recommended · 16:9 works best</small></div>}
   <div className="background-actions"><label className="primary-btn upload-btn"><Upload size={15}/>{bg?'Change Background':'Upload Background'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} hidden/></label>{bg&&<button type="button" className="secondary-btn" onClick={clearBg}><RotateCcw size={15}/> Reset Background</button>}</div>
  </div>
  <div className="panel account-panel"><h3>Account</h3><p className="muted">Signed in as <b>{user.name}</b></p><p className="muted">{user.email}</p><button type="button" className="danger-btn" onClick={logout}><LogOut size={16}/> Logout</button></div>
 </section>
}
function AuthScreen({mode,setMode,onLogin}:{mode:'login'|'register';setMode:(m:'login'|'register')=>void;onLogin:(u:User)=>void}){
 const[name,setName]=React.useState('');
 const[email,setEmail]=React.useState('');
 const[password,setPassword]=React.useState('');
 const[error,setError]=React.useState('');
 const[loading,setLoading]=React.useState(false);
 const[forgot,setForgot]=React.useState(false);
 const[resetSent,setResetSent]=React.useState(false);

 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();
  setError('');
  setLoading(true);
  try{
   const normalizedEmail=email.trim().toLowerCase();
   if(!normalizedEmail||!password||(mode==='register'&&!name.trim())){
    setError('Please fill all required fields.');
    return;
   }

   if(supabase){
    if(mode==='register'){
     const {data,error:signUpError}=await supabase.auth.signUp({
      email:normalizedEmail,
      password,
      options:{data:{name:name.trim()}}
     });
     if(signUpError)throw signUpError;
     if(data.session&&data.user){
      const u={name:name.trim(),email:normalizedEmail,password:''};
      onLogin(u);
     }else{
      setResetSent(true);
      setError('Registration successful. Check your email to confirm your account, then login.');
     }
    }else{
     const {data,error:loginError}=await supabase.auth.signInWithPassword({email:normalizedEmail,password});
     if(loginError)throw loginError;
     const displayName=String(data.user?.user_metadata?.name||normalizedEmail.split('@')[0]);
     const u={name:displayName,email:normalizedEmail,password:''};
     onLogin(u);
    }
   }else{
    const users:User[]=JSON.parse(localStorage.getItem('tgs_users')||'[]');
    if(mode==='register'){
     if(users.some(u=>u.email.toLowerCase()===normalizedEmail))return setError('Account already exists.');
     const u={name:name.trim(),email:normalizedEmail,password};
     localStorage.setItem('tgs_users',JSON.stringify([...users,u]));
     onLogin(u);
    }else{
     const u=users.find(x=>x.email.toLowerCase()===normalizedEmail&&x.password===password);
     if(!u)return setError('Invalid email or password.');
     onLogin(u);
    }
   }
  }catch(err){
   setError(err instanceof Error?err.message:'Authentication failed. Please try again.');
  }finally{
   setLoading(false);
  }
 };

 const sendReset=async(e:React.FormEvent)=>{
  e.preventDefault();
  setError('');
  setResetSent(false);
  const normalizedEmail=email.trim().toLowerCase();
  if(!normalizedEmail)return setError('Enter your account email first.');
  if(!supabase)return setError('Password reset email is not configured yet. Add the Supabase environment variables to the deployed app.');
  setLoading(true);
  try{
   const redirectTo=window.location.origin+window.location.pathname;
   const {error:resetError}=await supabase.auth.resetPasswordForEmail(normalizedEmail,{redirectTo});
   if(resetError)throw resetError;
   setResetSent(true);
  }catch(err){
   setError(err instanceof Error?err.message:'Could not send the password reset email.');
  }finally{
   setLoading(false);
  }
 };

 if(forgot)return <div className="auth-shell"><div className="auth-card">
  <div className="auth-brand"><div className="brand-mark">TGS</div><div><strong>TGS Tournament Manager</strong><span>Tech Guru Sumit</span></div></div>
  <div className="auth-title"><h1>Forgot password?</h1><p>Enter your account email and we will send you a secure password reset link.</p></div>
  <form onSubmit={sendReset}>
   <label>Email<input type="email" value={email} onChange={e=>{setEmail(e.target.value);setResetSent(false)}} placeholder="you@example.com" autoFocus/></label>
   {error&&<div className="form-error">{error}</div>}
   {resetSent&&<div className="auth-success">Reset email sent. Check your inbox and follow the link to create a new password.</div>}
   <button className="primary-btn auth-submit" type="submit" disabled={loading}>{loading?'Sending…':'Send Reset Link'}</button>
  </form>
  <button className="switch-auth" onClick={()=>{setForgot(false);setError('');setResetSent(false)}}>← Back to Login</button>
 </div></div>;

 return <div className="auth-shell"><div className="auth-card">
  <div className="auth-brand"><div className="brand-mark">TGS</div><div><strong>TGS Tournament Manager</strong><span>Tech Guru Sumit</span></div></div>
  <div className="auth-title"><h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{mode==='login'?'Sign in to manage your tournaments.':'Register to start managing tournaments.'}</p></div>
  <form onSubmit={submit}>
   {mode==='register'&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
   <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
   <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label>
   {error&&<div className="form-error">{error}</div>}
   {resetSent&&<div className="auth-success">{error||'Please check your email.'}</div>}
   <button className="primary-btn auth-submit" type="submit" disabled={loading}>{loading?'Please wait…':mode==='login'?<><LogIn size={17}/> Login</>:'Register'}</button>
  </form>
  {mode==='login'&&<button className="switch-auth" onClick={()=>{setForgot(true);setError('');setResetSent(false)}}>Forgot password?</button>}
  <button className="switch-auth" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setResetSent(false)}}>{mode==='login'?"Don't have an account? Register":'Already have an account? Login'}</button>
 </div></div>;
}
function FormatCards({value,onChange}:{value:string;onChange:(v:string)=>void}){return <div className="format-picker">{FORMAT_OPTIONS.map(f=><button type="button" key={f.name} className={`format-option ${value===f.name?'selected':''}`} onClick={()=>onChange(f.name)}><span className="format-icon">{f.icon}</span><span><strong>{f.name}</strong><small>{f.description}</small></span><span className="format-radio">{value===f.name?'✓':'›'}</span></button>)}</div>}
function CreateModal({close,save}:{close:()=>void;save:(t:Omit<Tournament,'id'>)=>void}){
 const[name,setName]=React.useState('');
 const[game,setGame]=React.useState('Asphalt Legends');
 const[format,setFormat]=React.useState('Single Elimination');
 const[players,setPlayers]=React.useState(16);
 const[playerNames,setPlayerNames]=React.useState<string[]>(Array.from({length:16},(_,i)=>'Player '+(i+1)));
 const[bulk,setBulk]=React.useState('');
 const[password,setPassword]=React.useState('');
 const[confirm,setConfirm]=React.useState('');
 const[error,setError]=React.useState('');

 React.useEffect(()=>{
  setPlayerNames(prev=>{
   const next=prev.slice(0,players);
   while(next.length<players)next.push('Player '+(next.length+1));
   return next;
  });
 },[players]);

 const applyBulk=()=>{
  const parsed=bulk.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);
  if(!parsed.length){setError('Paste at least 2 player names.');return}
  const next=parsed.slice(0,players);
  while(next.length<players)next.push('Player '+(next.length+1));
  setPlayerNames(next);
  setBulk('');
  setError('');
 };

 const submit=(e:React.FormEvent)=>{
  e.preventDefault();
  if(!name.trim())return setError('Tournament name is required.');
  if(players<2)return setError('At least 2 players are required.');
  const clean=playerNames.map(x=>x.trim());
  if(clean.some(x=>!x))return setError('Every player name is required.');
  if(new Set(clean.map(x=>x.toLowerCase())).size!==clean.length)return setError('Player names must be unique.');
  if(password.length<4)return setError('Tournament password must be at least 4 characters.');
  if(password!==confirm)return setError('Passwords do not match.');
  save({
   name:name.trim(),game,format,players,playerNames:clean,status:'Upcoming',
   date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
   password,passwordEnabled:true,fixtures:[]
  });
 };

 return <Modal title="Create New Tournament" subtitle="Set the format, enter participants and protect tournament management with a password." close={close}>
  <form onSubmit={submit}>
   <label>Tournament Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. TGS Clash #3" autoFocus/></label>
   <label>Game<select value={game} onChange={e=>setGame(e.target.value)}>
    <option>Asphalt Legends</option><option>Subway Surfers</option><option>Hill Climb Racing</option><option>Roblox</option><option>Minecraft</option><option>Other</option>
   </select></label>

   <div className="format-label"><strong>Tournament type</strong><span>{format}</span></div>
   <FormatCards value={format} onChange={setFormat}/>

   <div className="entry-section">
    <div className="entry-section-head">
     <div><strong>Participants</strong><small>Enter player names now. These names are used to generate fixtures.</small></div>
     <label className="player-count-label">Players
      <input type="number" min="2" max="128" value={players} onChange={e=>setPlayers(Math.min(128,Math.max(2,Number(e.target.value)||2)))}/>
     </label>
    </div>
    <div className="bulk-entry">
     <textarea value={bulk} onChange={e=>setBulk(e.target.value)} placeholder="Optional bulk entry: paste one player per line (or comma separated)"/>
     <button type="button" className="secondary-btn" onClick={applyBulk}>Apply Names</button>
    </div>
    <div className="player-entry-grid">
     {playerNames.map((player,i)=><label key={i}><span>#{i+1}</span><input value={player} onChange={e=>setPlayerNames(a=>a.map((x,j)=>j===i?e.target.value:x))} placeholder={"Player "+(i+1)}/></label>)}
    </div>
   </div>

   <label><span className="password-label"><Lock size={13}/> Tournament Password *</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter tournament password"/></label>
   <label><span className="password-label"><Lock size={13}/> Confirm Password *</span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password"/></label>
   {error&&<div className="form-error">{error}</div>}
   <div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className="primary-btn"><Trophy size={15}/> Create Tournament</button></div>
  </form>
 </Modal>
}function EditModal({tournament,close,save}:{tournament:Tournament;close:()=>void;save:(t:Tournament)=>void}){const[name,setName]=React.useState(tournament.name);const[game,setGame]=React.useState(tournament.game);const[format,setFormat]=React.useState(tournament.format);const[error,setError]=React.useState('');const submit=(e:React.FormEvent)=>{e.preventDefault();if(!name.trim())return setError('Tournament name is required.');const changed=format!==tournament.format;save({...tournament,name:name.trim(),game,format,fixtures:changed?[]:tournament.fixtures,status:changed?'Upcoming':tournament.status})};return <Modal title="Update Tournament" subtitle="Changing the format resets existing fixtures so the new format can generate a fresh schedule." close={close}><form onSubmit={submit}><label>Tournament Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Game<select value={game} onChange={e=>setGame(e.target.value)}><option>Asphalt Legends</option><option>Subway Surfers</option><option>Hill Climb Racing</option><option>Roblox</option><option>Minecraft</option><option>Other</option></select></label><div className="format-label"><strong>Tournament type</strong><span>{format}</span></div><FormatCards value={format} onChange={setFormat}/>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn"><Pencil size={15}/> Save Changes</button></div></form></Modal>}
function PasswordModal({action,tournament,close,verify}:{action:'edit'|'delete'|'fixtures';tournament:Tournament;close:()=>void;verify:(p:string)=>void}){const[p,setP]=React.useState('');const title=action==='edit'?'Update Tournament':action==='delete'?'Delete Tournament':'Create Fixtures';return <Modal title={title} subtitle={`Password required for: ${tournament.name}`} close={close}><form onSubmit={e=>{e.preventDefault();verify(p)}}><label><span className="password-label"><Lock size={13}/> Tournament Password</span><input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Enter tournament password" autoFocus/></label><div className="password-warning"><Lock size={15}/> Enter the password set for this tournament.</div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className={action==='delete'?'danger-btn':'primary-btn'}>{action==='delete'?<><Trash2 size={15}/> Confirm Delete</>:action==='edit'?<><Pencil size={15}/> Verify & Update</>:<><GitBranch size={15}/> Verify & Create</>}</button></div></form></Modal>}
function Modal({title,subtitle,close,children}:{title:string;subtitle:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={close}><X size={18}/></button></div>{children}</div></div>}
function Empty({title,text,icon}:{title:string;text:string;icon:React.ReactNode}){return <section className="empty-page"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{text}</p></section>}
export default App;
