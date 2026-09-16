import React from 'react';
import ReactDOM from 'react-dom/client';
import { Trophy, Users, Swords, BarChart3, Settings, Plus, ArrowRight, CalendarDays, Gamepad2, Crown } from 'lucide-react';
import './styles.css';

type Tournament = {
  id: number;
  name: string;
  game: string;
  format: string;
  players: number;
  status: 'Live' | 'Upcoming' | 'Completed';
  date: string;
};

const sampleTournaments: Tournament[] = [
  { id: 1, name: 'TGS Clash #2', game: 'Asphalt Legends', format: '1v1 Knockout', players: 16, status: 'Completed', date: '13 Sep 2026' },
  { id: 2, name: 'Death Race: Chapter 4', game: 'Asphalt Legends', format: 'Knockout', players: 32, status: 'Completed', date: '09 Aug 2026' },
  { id: 3, name: 'TGS Community Cup', game: 'Subway Surfers', format: 'Points League', players: 12, status: 'Upcoming', date: '20 Sep 2026' },
];

function App() {
  const [active, setActive] = React.useState('Dashboard');
  const [tournaments] = React.useState(sampleTournaments);

  const nav = [
    { label: 'Dashboard', icon: BarChart3 },
    { label: 'Tournaments', icon: Trophy },
    { label: 'Players', icon: Users },
    { label: 'Matches', icon: Swords },
    { label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TGS</div>
          <div>
            <strong>Tournament Manager</strong>
            <span>Tech Guru Sumit</span>
          </div>
        </div>

        <div className="side-section-title">MANAGEMENT</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
        <div className="profile-mini">
          <div className="avatar">S</div>
          <div><strong>Sumit</strong><span>Administrator</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">TGS ESPORTS / CONTROL CENTER</p>
            <h1>{active}</h1>
          </div>
          <button className="primary-btn"><Plus size={18} /> Create Tournament</button>
        </header>

        <section className="hero-card">
          <div>
            <span className="badge"><Gamepad2 size={14} /> Tournament Control</span>
            <h2>Run every tournament from one place.</h2>
            <p>Create brackets, manage players, record results and keep tournament history ready for reports.</p>
          </div>
          <div className="hero-icon"><Trophy size={54} /></div>
        </section>

        <section className="stats-grid">
          <Stat label="Total Tournaments" value="8" helper="Across all games" icon={<Trophy size={20} />} />
          <Stat label="Active Players" value="124" helper="Registered profiles" icon={<Users size={20} />} />
          <Stat label="Matches Recorded" value="286" helper="All time" icon={<Swords size={20} />} />
          <Stat label="Completed" value="6" helper="Tournament history" icon={<Crown size={20} />} />
        </section>

        <section className="section-block">
          <div className="section-head">
            <div>
              <h3>Recent tournaments</h3>
              <p>Quick access to your latest events</p>
            </div>
            <button className="text-btn">View all <ArrowRight size={16} /></button>
          </div>

          <div className="tournament-grid">
            {tournaments.map((t) => (
              <article className="tournament-card" key={t.id}>
                <div className="card-top">
                  <div className="game-icon"><Gamepad2 size={19} /></div>
                  <span className={`status ${t.status.toLowerCase()}`}>{t.status}</span>
                </div>
                <h4>{t.name}</h4>
                <p className="muted">{t.game} · {t.format}</p>
                <div className="meta-row"><span><Users size={15} /> {t.players} players</span><span><CalendarDays size={15} /> {t.date}</span></div>
                <button className="open-btn">Open Tournament <ArrowRight size={16} /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block two-col">
          <div className="panel">
            <div className="section-head"><div><h3>Quick actions</h3><p>Common tournament tasks</p></div></div>
            <div className="quick-actions">
              <button><Plus size={18} /><span><b>Create tournament</b><small>Start a new competition</small></span></button>
              <button><Users size={18} /><span><b>Add players</b><small>Manage player profiles</small></span></button>
              <button><Swords size={18} /><span><b>Update match</b><small>Enter scores and advance winners</small></span></button>
              <button><BarChart3 size={18} /><span><b>View reports</b><small>Check tournament & player history</small></span></button>
            </div>
          </div>
          <div className="panel accent-panel">
            <div className="accent-copy">
              <span className="badge subtle"><Crown size={14} /> Built for TGS</span>
              <h3>Ready for your next bracket?</h3>
              <p>The first version focuses on knockout tournaments with automatic winner progression. More formats can be added later.</p>
              <button className="primary-btn">Create First Tournament <ArrowRight size={17} /></button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
