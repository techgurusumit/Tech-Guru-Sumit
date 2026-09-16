import React from 'react';
import ReactDOM from 'react-dom/client';
import { Trophy, Users, Swords, BarChart3, Settings, Plus, ArrowRight, CalendarDays, Gamepad2, Crown, LogIn, LogOut, Moon, Sun, X } from 'lucide-react';
import './styles.css';

type Tournament = { id: number; name: string; game: string; format: string; players: number; status: 'Live' | 'Upcoming' | 'Completed'; date: string };
type User = { name: string; email: string; password: string };

const sampleTournaments: Tournament[] = [
  { id: 1, name: 'TGS Clash #2', game: 'Asphalt Legends', format: '1v1 Knockout', players: 16, status: 'Completed', date: '13 Sep 2026' },
  { id: 2, name: 'Death Race: Chapter 4', game: 'Asphalt Legends', format: 'Knockout', players: 32, status: 'Completed', date: '09 Aug 2026' },
  { id: 3, name: 'TGS Community Cup', game: 'Subway Surfers', format: 'Points League', players: 12, status: 'Upcoming', date: '20 Sep 2026' },
];

function App() {
  const [active, setActive] = React.useState('Dashboard');
  const [tournaments, setTournaments] = React.useState<Tournament[]>(() => {
    const saved = localStorage.getItem('tgs_tournaments'); return saved ? JSON.parse(saved) : sampleTournaments;
  });
  const [user, setUser] = React.useState<User | null>(() => { const s = localStorage.getItem('tgs_session'); return s ? JSON.parse(s) : null; });
  const [authMode, setAuthMode] = React.useState<'login' | 'register' | null>(user ? null : 'login');
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => (localStorage.getItem('tgs_theme') as 'dark' | 'light') || 'dark');
  const [showCreate, setShowCreate] = React.useState(false);
  const [toast, setToast] = React.useState('');

  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('tgs_theme', theme); }, [theme]);
  React.useEffect(() => { localStorage.setItem('tgs_tournaments', JSON.stringify(tournaments)); }, [tournaments]);

  const nav = [
    { label: 'Dashboard', icon: BarChart3 }, { label: 'Tournaments', icon: Trophy },
    { label: 'Players', icon: Users }, { label: 'Matches', icon: Swords }, { label: 'Reports', icon: BarChart3 },
  ];
  const go = (label: string) => { setActive(label); setToast(''); };
  const logout = () => { localStorage.removeItem('tgs_session'); setUser(null); setAuthMode('login'); };

  if (!user) return <AuthScreen mode={authMode || 'login'} setMode={setAuthMode} onLogin={(u) => { setUser(u); localStorage.setItem('tgs_session', JSON.stringify(u)); }} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">TGS</div><div><strong>Tournament Manager</strong><span>Tech Guru Sumit</span></div></div>
        <div className="side-section-title">MANAGEMENT</div>
        <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => go(label)}><Icon size={18}/><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer" />
        <button className={`nav-item ${active === 'Settings' ? 'active' : ''}`} onClick={() => go('Settings')}><Settings size={18}/><span>Settings</span></button>
        <div className="profile-mini"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-btn" title="Logout" onClick={logout}><LogOut size={15}/></button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">TGS ESPORTS / CONTROL CENTER</p><h1>{active}</h1></div><div className="top-actions"><button className="theme-btn" title="Change theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === 'dark' ? 'Light' : 'Dark'} theme</span></button><button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={18}/> Create Tournament</button></div></header>

        {toast && <div className="toast">{toast}</div>}
        {active === 'Dashboard' && <Dashboard tournaments={tournaments} onOpen={(t) => { setActive('Matches'); setToast(`Opened ${t.name}`); }} onCreate={() => setShowCreate(true)} onNavigate={go} />}
        {active === 'Tournaments' && <Tournaments tournaments={tournaments} onCreate={() => setShowCreate(true)} onOpen={(t) => { setActive('Matches'); setToast(`Opened ${t.name}`); }} />}
        {active === 'Players' && <EmptyPage icon={<Users size={34}/>} title="Players" text="Player profiles and tournament participation will appear here." action="Add Player" onAction={() => setToast('Player management is ready for the next module.')} />}
        {active === 'Matches' && <EmptyPage icon={<Swords size={34}/>} title="Matches" text="Record scores here and advance winners to the next knockout round." action="Update Match" onAction={() => setToast('Match update panel is ready for the next module.')} />}
        {active === 'Reports' && <EmptyPage icon={<BarChart3 size={34}/>} title="Reports" text="Tournament-wise and player-wise history will be shown here." action="Generate Report" onAction={() => setToast('Report generation is ready for the next module.')} />}
        {active === 'Settings' && <SettingsPage theme={theme} setTheme={setTheme} user={user} onLogout={logout} />}
      </main>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={(t) => { setTournaments((x) => [{ ...t, id: Date.now() }, ...x]); setShowCreate(false); setActive('Tournaments'); setToast('Tournament created successfully.'); }} />}
    </div>
  );
}

function Dashboard({ tournaments, onOpen, onCreate, onNavigate }: { tournaments: Tournament[]; onOpen: (t: Tournament) => void; onCreate: () => void; onNavigate: (x: string) => void }) {
  const completed = tournaments.filter(t => t.status === 'Completed').length;
  return <>
    <section className="hero-card"><div><span className="badge"><Gamepad2 size={14}/> Tournament Control</span><h2>Run every tournament from one place.</h2><p>Create brackets, manage players, record results and keep tournament history ready for reports.</p></div><div className="hero-icon"><Trophy size={54}/></div></section>
    <section className="stats-grid"><Stat label="Total Tournaments" value={String(tournaments.length)} helper="Across all games" icon={<Trophy size={20}/>} /><Stat label="Active Players" value="124" helper="Registered profiles" icon={<Users size={20}/>} /><Stat label="Matches Recorded" value="286" helper="All time" icon={<Swords size={20}/>} /><Stat label="Completed" value={String(completed)} helper="Tournament history" icon={<Crown size={20}/>} /></section>
    <section className="section-block"><div className="section-head"><div><h3>Recent tournaments</h3><p>Quick access to your latest events</p></div><button className="text-btn" onClick={() => onNavigate('Tournaments')}>View all <ArrowRight size={16}/></button></div><div className="tournament-grid">{tournaments.slice(0, 6).map(t => <TournamentCard key={t.id} t={t} onOpen={onOpen}/>)}</div></section>
    <section className="section-block two-col"><div className="panel"><div className="section-head"><div><h3>Quick actions</h3><p>Every button is connected</p></div></div><div className="quick-actions"><button onClick={onCreate}><Plus size={18}/><span><b>Create tournament</b><small>Start a new competition</small></span></button><button onClick={() => onNavigate('Players')}><Users size={18}/><span><b>Add players</b><small>Manage player profiles</small></span></button><button onClick={() => onNavigate('Matches')}><Swords size={18}/><span><b>Update match</b><small>Enter scores and advance winners</small></span></button><button onClick={() => onNavigate('Reports')}><BarChart3 size={18}/><span><b>View reports</b><small>Check tournament & player history</small></span></button></div></div><div className="panel accent-panel"><div className="accent-copy"><span className="badge subtle"><Crown size={14}/> Built for TGS</span><h3>Ready for your next bracket?</h3><p>The app now has working navigation, authentication and theme controls.</p><button className="primary-btn" onClick={onCreate}>Create First Tournament <ArrowRight size={17}/></button></div></div></section>
  </>;
}

function Tournaments({ tournaments, onCreate, onOpen }: { tournaments: Tournament[]; onCreate: () => void; onOpen: (t: Tournament) => void }) { return <section className="section-block"><div className="section-head"><div><h3>All tournaments</h3><p>{tournaments.length} tournament records</p></div><button className="primary-btn" onClick={onCreate}><Plus size={17}/> New Tournament</button></div><div className="tournament-grid">{tournaments.map(t => <TournamentCard key={t.id} t={t} onOpen={onOpen}/>)}</div></section>; }

function TournamentCard({ t, onOpen }: { t: Tournament; onOpen: (t: Tournament) => void }) { return <article className="tournament-card"><div className="card-top"><div className="game-icon"><Gamepad2 size={19}/></div><span className={`status ${t.status.toLowerCase()}`}>{t.status}</span></div><h4>{t.name}</h4><p className="muted">{t.game} · {t.format}</p><div className="meta-row"><span><Users size={15}/> {t.players} players</span><span><CalendarDays size={15}/> {t.date}</span></div><button className="open-btn" onClick={() => onOpen(t)}>Open Tournament <ArrowRight size={16}/></button></article>; }
function Stat({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></div>; }
function EmptyPage({ icon, title, text, action, onAction }: { icon: React.ReactNode; title: string; text: string; action: string; onAction: () => void }) { return <section className="empty-page"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{text}</p><button className="primary-btn" onClick={onAction}>{action} <ArrowRight size={16}/></button></section>; }
function SettingsPage({ theme, setTheme, user, onLogout }: { theme: 'dark' | 'light'; setTheme: (x: 'dark' | 'light') => void; user: User; onLogout: () => void }) { return <section className="settings-grid"><div className="panel"><h3>Appearance</h3><p className="muted">Change the dashboard theme instantly.</p><div className="theme-options"><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={18}/> Dark</button><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={18}/> Light</button></div></div><div className="panel"><h3>Account</h3><p className="muted">Signed in as <b>{user.name}</b></p><p className="muted">{user.email}</p><button className="danger-btn" onClick={onLogout}><LogOut size={16}/> Logout</button></div></section>; }

function AuthScreen({ mode, setMode, onLogin }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; onLogin: (u: User) => void }) {
  const [name, setName] = React.useState(''); const [email, setEmail] = React.useState(''); const [password, setPassword] = React.useState(''); const [error, setError] = React.useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); setError(''); const users: User[] = JSON.parse(localStorage.getItem('tgs_users') || '[]');
    if (!email || !password || (mode === 'register' && !name)) return setError('Please fill all required fields.');
    if (mode === 'register') { if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return setError('An account with this email already exists.'); const u = { name, email, password }; localStorage.setItem('tgs_users', JSON.stringify([...users, u])); onLogin(u); }
    else { const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password); if (!u) return setError('Invalid email or password. Please register first.'); onLogin(u); }
  };
  return <div className="auth-shell"><div className="auth-card"><div className="auth-brand"><div className="brand-mark">TGS</div><div><strong>TGS Tournament Manager</strong><span>Tech Guru Sumit</span></div></div><div className="auth-title"><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Sign in to manage your tournaments.' : 'Register once and start managing your tournaments.'}</p></div><form onSubmit={submit}>{mode === 'register' && <label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/></label>{error && <div className="form-error">{error}</div>}<button className="primary-btn auth-submit" type="submit">{mode === 'login' ? <><LogIn size={17}/> Login</> : 'Register'}</button></form><button className="switch-auth" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}</button><p className="demo-note">Authentication is currently stored in this browser. Cloud database/auth can be connected next for multi-device access.</p></div></div>;
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Tournament) => void }) { const [name, setName] = React.useState(''); const [game, setGame] = React.useState('Asphalt Legends'); const [players, setPlayers] = React.useState(2); const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; onCreate({ id: 0, name: name.trim(), game, format: '1v1 Knockout', players, status: 'Upcoming', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }); }; return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-head"><div><h2>Create Tournament</h2><p>Start a new knockout event.</p></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><form onSubmit={submit}><label>Tournament name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TGS Clash #3" autoFocus/></label><label>Game<select value={game} onChange={e => setGame(e.target.value)}><option>Asphalt Legends</option><option>Subway Surfers</option><option>Hill Climb Racing</option><option>Roblox</option><option>Minecraft</option><option>Other</option></select></label><label>Players<input type="number" min="2" value={players} onChange={e => setPlayers(Math.max(2, Number(e.target.value)))}/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn">Create Tournament</button></div></form></div></div>; }

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
