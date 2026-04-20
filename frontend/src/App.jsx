// frontend/src/App.jsx
// ─── Application Shell & Router ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext.jsx';
import { Toast, Stars }        from './components/ui/index.jsx';
import AuthScreen              from './screens/Auth/index.jsx';
import HomeScreen              from './screens/Home/index.jsx';
import PalmScreen              from './screens/Palm/index.jsx';
import KundaliScreen           from './screens/Kundali/index.jsx';
import VaultScreen             from './screens/Vault/index.jsx';

// Nav item config
const NAV = [
  { id: 'home',    icon: '🏠', label: 'Home'    },
  { id: 'palm',    icon: '✋', label: 'Palm'    },
  { id: 'chart',   icon: '⭕', label: 'Kundali' },
  { id: 'vault',   icon: '📜', label: 'Vault'   },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

function SplashScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ height: '100dvh', background: 'radial-gradient(ellipse at 50% 40%, #1E1038 0%, #0A1128 65%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Stars count={80} />
      <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(212,175,55,.08)', animation: 'orbit 25s linear infinite' }} />
      <div style={{ position: 'absolute', width: 230, height: 230, borderRadius: '50%', border: '1px solid rgba(212,175,55,.06)', animation: 'orbitR 16s linear infinite' }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', animation: 'float 4.5s ease-in-out infinite' }}>
        <div style={{ fontSize: 82, animation: 'pulse 2.5s ease-in-out infinite', marginBottom: -8 }}>☽</div>
        <div className="cinzel" style={{ color: 'rgba(212,175,55,.5)', fontSize: 13, letterSpacing: 14, marginBottom: 10 }}>✦ ✦ ✦</div>
        <h1 className="shimmer cinzel" style={{ fontSize: 36, fontWeight: 900, letterSpacing: 7 }}>ASTROVISION</h1>
        <p className="cinzel" style={{ color: 'rgba(212,175,55,.4)', fontSize: 9.5, letterSpacing: 5, marginTop: 10 }}>YOUR COSMIC GUIDE</p>
      </div>
      <div style={{ position: 'absolute', bottom: 72, display: 'flex', gap: 9, zIndex: 2 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: `twinkle 1.4s ${i * .35}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

function Shell() {
  const { authStatus, user } = useApp();
  const [splash, setSplash]  = useState(true);
  const [screen, setScreen]  = useState('home');   // bottom-nav screen
  const [sub,    setSub   ]  = useState(null);      // overlay screen

  const navigate = (to) => {
    const overlays = ['palm', 'chart', 'vault', 'profile'];
    if (overlays.includes(to)) { setSub(to); return; }
    setScreen(to); setSub(null);
  };

  if (splash)                          return <SplashScreen onDone={() => setSplash(false)} />;
  if (authStatus === 'loading')        return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
      <div style={{ animation: 'orbit 2s linear infinite', fontSize: 40 }}>⭕</div>
    </div>
  );
  if (!user || authStatus === 'unauthenticated') return <AuthScreen />;

  const SCREENS = {
    home   : <HomeScreen onNav={navigate} />,
    palm   : <PalmScreen onBack={() => setSub(null)} />,
    chart  : <KundaliScreen onBack={() => setSub(null)} />,
    vault  : <VaultScreen onBack={() => setSub(null)} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {SCREENS[sub] || SCREENS[screen] || SCREENS.home}
      </div>

      {!sub && (
        <nav className="bnav">
          {NAV.map(({ id, icon, label }) => (
            <button key={id} className={`nbtn ${screen === id ? 'on' : ''}`} onClick={() => navigate(id)}>
              <span className="nbtn-ico">{icon}</span>
              <span className="nbtn-lbl">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100dvh', background: '#050810' }}>
        <div style={{ width: '100%', maxWidth: 430, position: 'relative', background: 'var(--navy)' }}>
          <Stars count={40} style={{ position: 'fixed', width: '100%', maxWidth: 430 }} />
          <Shell />
          <Toast />
        </div>
      </div>
    </AppProvider>
  );
}
