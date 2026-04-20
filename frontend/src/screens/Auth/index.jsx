// frontend/src/screens/Auth/index.jsx
import { useState } from 'react';
import { Stars, Btn, Input, Field } from '../../components/ui/index.jsx';
import { useAuth } from '../../hooks/index.js';

export default function AuthScreen() {
  const { login, register, loading, error } = useAuth();
  const [tab,   setTab ] = useState('login');
  const [form,  setForm] = useState({ name: '', email: '', password: '' });
  const [fErr,  setFErr] = useState({});

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (tab === 'register' && !form.name.trim())       e.name     = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email  = 'Valid email required';
    if (form.password.length < 6)                        e.password = 'Min 6 characters';
    setFErr(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (tab === 'login')    await login({ email: form.email, password: form.password });
      else                    await register({ name: form.name, email: form.email, password: form.password });
    } catch {}
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'radial-gradient(ellipse at top, #1A1025 0%, #0A1128 60%)', padding: '50px 26px 48px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Stars count={55} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 54, animation: 'pulse 3s ease-in-out infinite' }}>☽✦</div>
          <h1 className="shimmer cinzel" style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, marginTop: 8 }}>ASTROVISION</h1>
          <p style={{ color: 'var(--text-d)', fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>
            Where celestial wisdom meets modern clarity
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="fade-up d1" style={{ display: 'flex', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid rgba(212,175,55,.13)' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setFErr({}); }} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === t ? 'linear-gradient(135deg,#7A6230,var(--gold))' : 'transparent',
              color: tab === t ? 'var(--navy)' : 'var(--text-d)',
              fontFamily: 'Cinzel,serif', fontSize: 11, fontWeight: 700, letterSpacing: .8, transition: 'all .3s',
            }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div className="fade-up d2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <Input label="Your Name" placeholder="Enter your name" value={form.name}
              onChange={e => setF('name', e.target.value)} error={fErr.name} required />
          )}
          <Input label="Email Address" type="email" placeholder="you@cosmos.com"
            value={form.email} onChange={e => setF('email', e.target.value)} error={fErr.email} required />
          <Input label="Password" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setF('password', e.target.value)} error={fErr.password} required />

          {error && <p style={{ textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>{error}</p>}

          <Btn loading={loading} onClick={submit} style={{ marginTop: 2 }}>
            {tab === 'login' ? '✦  Enter the Cosmos' : '✦  Begin Your Journey'}
          </Btn>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,.14)' }} />
            <span className="cinzel" style={{ color: 'rgba(212,175,55,.3)', fontSize: 10 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,.14)' }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {[['G', 'Google'], ['🍎', 'Apple']].map(([ic, lbl]) => (
              <Btn key={lbl} variant="outline" onClick={submit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 11 }}>
                <span>{ic}</span>{lbl}
              </Btn>
            ))}
          </div>
        </div>

        <p className="fade-up d3" style={{ textAlign: 'center', color: 'var(--text-dd)', fontSize: 11, marginTop: 22 }}>
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
