// frontend/src/screens/Home/index.jsx
import { Stars, Card, ModelTag, Badge, Btn, SectionHead } from '../../components/ui/index.jsx';
import { useApp }     from '../../store/AppContext.jsx';
import { useTransit } from '../../hooks/index.js';
import { MODELS }     from '../../../../shared/constants.js';

export default function HomeScreen({ onNav }) {
  const { user, reports, activeProfile } = useApp();
  const { transit, loading: tLoading } = useTransit(activeProfile?.moon_sign || 'Taurus');
  const recent = (reports || []).slice(0, 4);

  return (
    <div className="av-page" style={{ paddingBottom: 20 }}>
      {/* Hero */}
      <div style={{ padding: '60px 24px 20px', background: 'linear-gradient(180deg,rgba(26,16,37,.7) 0%,transparent 100%)', position: 'relative' }}>
        <Stars count={30} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p className="cinzel fade-up" style={{ fontSize: 9.5, color: 'rgba(212,175,55,.5)', letterSpacing: 2, marginBottom: 5 }}>WELCOME BACK</p>
          <h1 className="cinzel fade-up d1" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{user?.name || 'Stargazer'}</h1>
          <p className="fade-up d2" style={{ color: 'rgba(212,175,55,.65)', fontSize: 15, fontStyle: 'italic', marginTop: 3 }}>The stars align for you today</p>
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        {/* Daily Transit */}
        <div className="fade-up d2" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionHead label="Today's Cosmic Reading" />
            <ModelTag model={MODELS.HAIKU} />
          </div>
          {tLoading ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', animation: 'twinkle 1s ease-in-out infinite' }} />
              <span className="cinzel" style={{ fontSize: 11, color: 'var(--text-d)' }}>Reading cosmic energies…</span>
            </Card>
          ) : transit && (
            <div className="card-glow" style={{ padding: 18 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>🌙</span>
                <p style={{ color: 'rgba(212,175,55,.8)', fontSize: 14, fontStyle: 'italic', lineHeight: 1.65 }}>{transit.message}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {[['🌕', transit.moon_phase], ['⭐', `Ruling: ${transit.ruling_planet}`], ['🎨', transit.power_color], ['🔢', `Lucky: ${transit.lucky_number}`]]
                  .map(([ic, txt]) => (
                    <span key={txt} style={{ padding: '4px 10px', background: 'var(--gold-p)', border: '1px solid var(--gold-d)', borderRadius: 20, fontSize: 11, color: 'var(--text-d)' }}>{ic} {txt}</span>
                  ))}
              </div>
              {transit.affirmation && (
                <div style={{ padding: '10px 14px', background: 'rgba(212,175,55,.04)', borderLeft: '2px solid var(--gold)', borderRadius: '0 8px 8px 0' }}>
                  <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.4)', letterSpacing: 1, marginBottom: 3 }}>TODAY'S AFFIRMATION</p>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontStyle: 'italic' }}>"{transit.affirmation}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA Cards */}
        <div className="fade-up d3" style={{ marginBottom: 22 }}>
          <SectionHead label="Choose Your Reading" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { id: 'palm',  icon: '✋', label: 'Read My Palm',     sub: 'Lines of life & destiny',    grad: '135deg,#1A0A28,#2A1040', border: 'rgba(180,100,220,.35)' },
              { id: 'chart', icon: '⭕', label: 'Generate Kundali', sub: 'Your celestial birth chart', grad: '135deg,#0A1A28,#102040', border: 'rgba(100,150,220,.35)' },
            ].map(({ id, icon, label, sub, grad, border }) => (
              <div key={id} onClick={() => onNav(id)} style={{ background: `linear-gradient(${grad})`, border: `1px solid ${border}`, borderRadius: 20, padding: '24px 14px', cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all .3s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(212,175,55,.12)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'radial-gradient(circle,rgba(212,175,55,.1) 0%,transparent 70%)', borderRadius: '0 20px 0 60px' }} />
                <div style={{ fontSize: 46, marginBottom: 10 }}>{icon}</div>
                <h3 className="cinzel gold" style={{ fontSize: 12, fontWeight: 700, letterSpacing: .4, marginBottom: 5 }}>{label}</h3>
                <p style={{ color: 'var(--text-dd)', fontSize: 12, lineHeight: 1.4 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="fade-up d4" style={{ marginBottom: 22 }}>
          <SectionHead label="Quick Actions" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['📜', 'Vault', 'vault'], ['👤', 'Profiles', 'profile'], ['⚙️', 'Settings', 'settings']].map(([ic, lbl, id]) => (
              <button key={id} className="btn btn-ghost" onClick={() => onNav(id)} style={{ flexDirection: 'column', gap: 6, padding: '14px 8px', fontSize: 9.5 }}>
                <span style={{ fontSize: 22 }}>{ic}</span>{lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="fade-up d5">
          <SectionHead label="Recent Readings" right={recent.length > 0 && <Btn variant="outline" full={false} style={{ padding: '7px 14px', fontSize: 10 }} onClick={() => onNav('vault')}>View All</Btn>} />
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: .2 }}>✦</div>
              <p style={{ color: 'var(--text-dd)', fontSize: 14, fontStyle: 'italic' }}>Your cosmic journey begins with your first reading</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {recent.map(r => (
                <div key={r.uuid || r.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderRadius: 13, background: 'rgba(12,16,38,.7)', border: '1px solid rgba(212,175,55,.14)', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.14)'; }}>
                  <span style={{ fontSize: 26 }}>{r.type === 'palm' ? '✋' : '⭕'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cinzel" style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-dd)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                  </div>
                  <Badge variant={r.type === 'palm' ? 'gold' : 'blue'}>{r.type === 'palm' ? 'Palm' : 'Kundali'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
