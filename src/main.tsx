import React from 'react';
import ReactDOM from 'react-dom/client';
import { Trophy, Users, Swords, BarChart3, Settings, Plus, ArrowRight, CalendarDays, Gamepad2, Crown, LogIn, LogOut, Moon, Sun, X, Trash2, Pencil, GitBranch, Lock } from 'lucide-react';
import './styles.css';

type Fixture={id:number;round:string;player1:string;player2:string;score1?:number;score2?:number;winner?:string};
type Tournament={id:number;name:string;game:string;format:string;players:number;status:'Live'|'Upcoming'|'Completed';date:string;password:string;fixtures:Fixture[]};
type User={name:string;email:string;password:string};

// Existing tournaments created before password protection are password-free.
const legacyTournamentIds=new Set([1,2,3]);
const sample:Tournament[]=[
{id:1,name:'TGS Clash #2',game:'Asphalt Legends',format:'1v1 Knockout',players:16,status:'Completed',date:'13 Sep 2026',password:'',fixtures:[]},
{id:2,name:'Death Race: Chapter 4',game:'Asphalt Legends',format:'Knockout',players:32,status:'Completed',date:'09 Aug 2026',password:'',fixtures:[]},
{id:3,name:'TGS Community Cup',game:'Subway Surfers',format:'Points League',players:12,status:'Upcoming',date:'20 Sep 2026',password:'',fixtures:[]}
];

function loadTournaments():Tournament[]{
 try{
  const raw=localStorage.getItem('tgs_tournaments');
  if(!raw)return sample;
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))return sample;
  return parsed.map((t:any)=>({
   ...t,
   // Migrate the original password-less events even if an older app version
   // previously assigned them the temporary TGS2026 password.
   password:legacyTournamentIds.has(Number(t.id))?'':(typeof t.password==='string'?t.password:''),
   fixtures:Array.isArray(t.fixtures)?t.fixtures:[]
  }));
 }catch{return sample}
}

function App(){
 const [active,setActive]=React.useState('Dashboard');
 const [tournaments,setTournaments]=React.useState<Tournament[]>(loadTournaments);
 const [user,setUser]=React.useState<User|null>(()=>{try{const s=localStorage.getItem('tgs_session');return s?JSON.parse(s):null}catch{return null}});
 const [authMode,setAuthMode]=React.useState<'login'|'register'>('login');
 const [theme,setTheme]=React.useState<'dark'|'light'>(()=>(localStorage.getItem('tgs_theme') as 'dark'|'light')||'dark');
 const [create,setCreate]=React.useState(false);
 const [edit,setEdit]=React.useState<Tournament|null>(null);
 const [guard,setGuard]=React.useState<{action:'edit'|'delete'|'fixtures';t:Tournament}|null>(null);
 const [toast,setToast]=React.useState('');
 React.useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('tgs_theme',theme)},[theme]);
 React.useEffect(()=>{localStorage.setItem('tgs_tournaments',JSON.stringify(tournaments))},[tournaments]);
 const nav=[['Dashboard',BarChart3],['Tournaments',Trophy],['Players',Users],['Matches',Swords],['Reports',BarChart3]] as const;
 const logout=()=>{localStorage.removeItem('tgs_session');setUser(null);setAuthMode('login')};

 const executeAction=(action:'edit'|'delete'|'fixtures',t:Tournament)=>{
  if(action==='delete'){
   setTournaments(x=>x.filter(v=>v.id!==t.id));
   setToast('✅ Tournament deleted.');
  }else if(action==='edit'){
   setEdit(t);
  }else{
   const fixtures=makeFixtures(t.players);
   setTournaments(x=>x.map(v=>v.id===t.id?{...v,fixtures}:v));
   setToast('✅ Fixtures created.');
  }
 };

 const handleTournamentAction=(action:'edit'|'delete'|'fixtures',t:Tournament)=>{
  // Password-less legacy events can be managed directly.
  if(!t.password){executeAction(action,t);return;}
  setGuard({action,t});
 };

 const checkPassword=(value:string)=>{
  if(!guard)return;
  const g=guard;
  if(value!==g.t.password){setToast('❌ Incorrect tournament password.');return}
  setGuard(null);
  executeAction(g.action,g.t);
 };

 if(!user)return <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={u=>{setUser(u);localStorage.setItem('tgs_session',JSON.stringify(u))}}/>;
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">TGS</div><div><strong>Tournament Manager</strong><span>Tech Guru Sumit</span></div></div><div className="side-section-title">MANAGEMENT</div><nav>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${active===label?'active':''}`} onClick={()=>{setActive(label);setToast('')}}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-spacer"/><button className={`nav-item ${active==='Settings'?'active':''}`} onClick={()=>setActive('Settings')}><Settings size={18}/><span>Settings</span></button><div className="profile-mini"><div className="avatar">{user.name[0]?.toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-btn" onClick={logout} title="Logout"><LogOut size={15}/></button></div></aside>
 <main className="main-content"><header className="topbar"><div><p className="eyebrow">TGS ESPORTS / CONTROL CENTER</p><h1>{active}</h1></div><div className="top-actions"><button className="theme-btn" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}<span>{theme==='dark'?'Light':'Dark'} theme</span></button><button className="primary-btn" onClick={()=>setCreate(true)}><Plus size={18}/> Create Tournament</button></div></header>{toast&&<div className="toast">{toast}</div>}
 {active==='Dashboard'&&<Dashboard tournaments={tournaments} onCreate={()=>setCreate(true)} onNavigate={setActive}/>} 
 {active==='Tournaments'&&<TournamentList tournaments={tournaments} onCreate={()=>setCreate(true)} onAction={handleTournamentAction}/>} 
 {active==='Players'&&<Empty title="Players" text="Player profiles and tournament participation will appear here." icon={<Users size={34}/>}/>} 
 {active==='Matches'&&<Empty title="Matches" text="Create fixtures from a tournament. Match score management will be added to the fixture board." icon={<Swords size={34}/>}/>} 
 {active==='Reports'&&<Empty title="Reports" text="Tournament-wise and player-wise reports will appear here." icon={<BarChart3 size={34}/>}/>} 
 {active==='Settings'&&<SettingsPage theme={theme} setTheme={setTheme} user={user} logout={logout}/>}</main>
 {create&&<CreateModal close={()=>setCreate(false)} save={t=>{setTournaments(x=>[{...t,id:Date.now()},...x]);setCreate(false);setActive('Tournaments');setToast('✅ Tournament created. Password protection enabled.')}}/>}
 {edit&&<EditModal tournament={edit} close={()=>setEdit(null)} save={t=>{setTournaments(x=>x.map(v=>v.id===t.id?t:v));setEdit(null);setToast('✅ Tournament updated successfully.')}}/>}
 {guard&&<PasswordModal action={guard.action} tournament={guard.t} close={()=>setGuard(null)} verify={checkPassword}/>}</div>;
}

function makeFixtures(players:number):Fixture[]{const out:Fixture[]=[];for(let i=0;i<players;i+=2)out.push({id:Date.now()+i,round:'Round 1',player1:`Player ${i+1}`,player2:i+2<=players?`Player ${i+2}`:'BYE'});return out}

function Dashboard({tournaments,onCreate,onNavigate}:{tournaments:Tournament[];onCreate:()=>void;onNavigate:(x:string)=>void}){return <><section className="hero-card"><div><span className="badge"><Gamepad2 size={14}/> Tournament Control</span><h2>Run every tournament from one place.</h2><p>Create tournaments, protect them with passwords, generate fixtures and manage your event history.</p></div><div className="hero-icon"><Trophy size={54}/></div></section><section className="stats-grid"><Stat label="Total Tournaments" value={String(tournaments.length)} helper="Across all games" icon={<Trophy size={20}/>} /><Stat label="Active Players" value="124" helper="Registered profiles" icon={<Users size={20}/>} /><Stat label="Matches Recorded" value="286" helper="All time" icon={<Swords size={20}/>} /><Stat label="Completed" value={String(tournaments.filter(t=>t.status==='Completed').length)} helper="Tournament history" icon={<Crown size={20}/>} /></section><section className="section-block"><div className="section-head"><div><h3>Recent tournaments</h3><p>Open Tournaments to update, delete or create fixtures.</p></div><button className="text-btn" onClick={()=>onNavigate('Tournaments')}>View all <ArrowRight size={16}/></button></div><div className="tournament-grid">{tournaments.slice(0,6).map(t=><TournamentCard key={t.id} t={t}/>)}</div></section><section className="section-block two-col"><div className="panel"><div className="section-head"><div><h3>Quick actions</h3><p>All actions are connected.</p></div></div><div className="quick-actions"><button onClick={onCreate}><Plus size={18}/><span><b>Create tournament</b><small>Set a tournament password</small></span></button><button onClick={()=>onNavigate('Players')}><Users size={18}/><span><b>Add players</b><small>Manage player profiles</small></span></button><button onClick={()=>onNavigate('Matches')}><Swords size={18}/><span><b>Update match</b><small>Open fixture management</small></span></button><button onClick={()=>onNavigate('Reports')}><BarChart3 size={18}/><span><b>View reports</b><small>Tournament and player history</small></span></button></div></div></section></>}

function TournamentList({tournaments,onCreate,onAction}:{tournaments:Tournament[];onCreate:()=>void;onAction:(a:'edit'|'delete'|'fixtures',t:Tournament)=>void}){return <section className="section-block"><div className="section-head"><div><h3>All tournaments</h3><p>{tournaments.length} tournament records</p></div><button className="primary-btn" onClick={onCreate}><Plus size={17}/> New Tournament</button></div><div className="tournament-grid">{tournaments.map(t=><TournamentCard key={t.id} t={t} action={onAction}/>)}</div></section>}

function TournamentCard({t,action}:{t:Tournament;action?:((a:'edit'|'delete'|'fixtures',t:Tournament)=>void)}){return <article className="tournament-card"><div className="card-top"><div className="game-icon"><Gamepad2 size={19}/></div><span className={`status ${t.status.toLowerCase()}`}>{t.status}</span></div><h4>{t.name}</h4><p className="muted">{t.game} · {t.format}</p><div className="meta-row"><span><Users size={15}/> {t.players} players</span><span><CalendarDays size={15}/> {t.date}</span></div>{action?<div className="card-actions"><button onClick={()=>action('fixtures',t)}><GitBranch size={15}/> Create Fixtures</button><button onClick={()=>action('edit',t)}><Pencil size={15}/> Update Tournament</button><button className="delete-action" onClick={()=>action('delete',t)}><Trash2 size={15}/> Delete</button></div>:<span className="muted">Open Tournaments for management actions</span>}</article>}

function Stat({label,value,helper,icon}:{label:string;value:string;helper:string;icon:React.ReactNode}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></div>}
function Empty({title,text,icon}:{title:string;text:string;icon:React.ReactNode}){return <section className="empty-page"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{text}</p></section>}
function SettingsPage({theme,setTheme,user,logout}:{theme:'dark'|'light';setTheme:(x:'dark'|'light')=>void;user:User;logout:()=>void}){return <section className="settings-grid"><div className="panel"><h3>Appearance</h3><p className="muted">Change the dashboard theme instantly.</p><div className="theme-options"><button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><Moon size={18}/> Dark</button><button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><Sun size={18}/> Light</button></div></div><div className="panel"><h3>Account</h3><p className="muted">Signed in as <b>{user.name}</b></p><p className="muted">{user.email}</p><button className="danger-btn" onClick={logout}><LogOut size={16}/> Logout</button></div></section>}

function AuthScreen({mode,setMode,onLogin}:{mode:'login'|'register';setMode:(m:'login'|'register')=>void;onLogin:(u:User)=>void}){const[name,setName]=React.useState('');const[email,setEmail]=React.useState('');const[password,setPassword]=React.useState('');const[error,setError]=React.useState('');const submit=(e:React.FormEvent)=>{e.preventDefault();const users:User[]=JSON.parse(localStorage.getItem('tgs_users')||'[]');if(!email||!password||(mode==='register'&&!name))return setError('Please fill all required fields.');if(mode==='register'){if(users.some(u=>u.email.toLowerCase()===email.toLowerCase()))return setError('Account already exists.');const u={name,email,password};localStorage.setItem('tgs_users',JSON.stringify([...users,u]));onLogin(u)}else{const u=users.find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===password);if(!u)return setError('Invalid email or password.');onLogin(u)}};return <div className="auth-shell"><div className="auth-card"><div className="auth-brand"><div className="brand-mark">TGS</div><div><strong>TGS Tournament Manager</strong><span>Tech Guru Sumit</span></div></div><div className="auth-title"><h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{mode==='login'?'Sign in to manage your tournaments.':'Register to start managing tournaments.'}</p></div><form onSubmit={submit}>{mode==='register'&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label>{error&&<div className="form-error">{error}</div>}<button className="primary-btn auth-submit" type="submit">{mode==='login'?<><LogIn size={17}/> Login</>:'Register'}</button></form><button className="switch-auth" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?"Don't have an account? Register":'Already have an account? Login'}</button></div></div>}

function CreateModal({close,save}:{close:()=>void;save:(t:Omit<Tournament,'id'>)=>void}){const[name,setName]=React.useState('');const[game,setGame]=React.useState('Asphalt Legends');const[players,setPlayers]=React.useState(2);const[password,setPassword]=React.useState('');const[confirm,setConfirm]=React.useState('');const[error,setError]=React.useState('');const submit=(e:React.FormEvent)=>{e.preventDefault();if(!name.trim())return setError('Tournament name is required.');if(password.length<4)return setError('Tournament password must be at least 4 characters.');if(password!==confirm)return setError('Passwords do not match.');save({name:name.trim(),game,format:'1v1 Knockout',players,status:'Upcoming',date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),password,fixtures:[]})};return <Modal title="Create New Tournament" subtitle="Set a password now. It will be required for Update, Delete and Create Fixtures." close={close}><form onSubmit={submit}><label>Tournament Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. TGS Clash #3" autoFocus/></label><label>Game<select value={game} onChange={e=>setGame(e.target.value)}><option>Asphalt Legends</option><option>Subway Surfers</option><option>Hill Climb Racing</option><option>Roblox</option><option>Minecraft</option><option>Other</option></select></label><label>Number of Players<input type="number" min="2" value={players} onChange={e=>setPlayers(Math.max(2,Number(e.target.value)||2))}/></label><label><span className="password-label"><Lock size={13}/> Tournament Password <b>*</b></span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter tournament password"/></label><label><span className="password-label"><Lock size={13}/> Confirm Tournament Password <b>*</b></span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter tournament password"/></label>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className="primary-btn"><Lock size={15}/> Create Tournament</button></div></form></Modal>}

function EditModal({tournament,close,save}:{tournament:Tournament;close:()=>void;save:(t:Tournament)=>void}){const[name,setName]=React.useState(tournament.name);const[game,setGame]=React.useState(tournament.game);const[players,setPlayers]=React.useState(tournament.players);const[password,setPassword]=React.useState(tournament.password);const[error,setError]=React.useState('');const submit=(e:React.FormEvent)=>{e.preventDefault();if(!name.trim())return setError('Tournament name is required.');if(password&&password.length<4)return setError('Tournament password must be at least 4 characters.');save({...tournament,name:name.trim(),game,players,password})};return <Modal title="Update Tournament" subtitle={tournament.password?'Tournament password has already been verified.':'This is a legacy tournament without a password.'} close={close}><form onSubmit={submit}><label>Tournament Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Game<select value={game} onChange={e=>setGame(e.target.value)}><option>Asphalt Legends</option><option>Subway Surfers</option><option>Hill Climb Racing</option><option>Roblox</option><option>Minecraft</option><option>Other</option></select></label><label>Number of Players<input type="number" min="2" value={players} onChange={e=>setPlayers(Math.max(2,Number(e.target.value)||2))}/></label><label><span className="password-label"><Lock size={13}/> Tournament Password {tournament.password?'':'(Optional)'}</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={tournament.password?'Change tournament password':'Leave blank to keep this event password-free'}/></label>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className="primary-btn"><Pencil size={15}/> Save Changes</button></div></form></Modal>}

function PasswordModal({action,tournament,close,verify}:{action:'edit'|'delete'|'fixtures';tournament:Tournament;close:()=>void;verify:(p:string)=>void}){const[p,setP]=React.useState('');const title=action==='edit'?'Update Tournament':action==='delete'?'Delete Tournament':'Create Fixtures';return <Modal title={title} subtitle={`Password required for: ${tournament.name}`} close={close}><form onSubmit={e=>{e.preventDefault();verify(p)}}><label><span className="password-label"><Lock size={13}/> Tournament Password</span><input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Enter tournament password" autoFocus/></label><div className="password-warning"><Lock size={15}/> Enter the password set when this tournament was created.</div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className={action==='delete'?'danger-btn':'primary-btn'}>{action==='delete'?<><Trash2 size={15}/> Confirm Delete</>:action==='edit'?<><Pencil size={15}/> Verify & Update</>:<><GitBranch size={15}/> Verify & Create</>}</button></div></form></Modal>}

function Modal({title,subtitle,close,children}:{title:string;subtitle:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={close}><X size={18}/></button></div>{children}</div></div>}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
