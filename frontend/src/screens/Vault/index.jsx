// frontend/src/screens/Vault/index.jsx
import { useState, useEffect } from 'react';
import { PageHead, Btn, Badge, EmptyState, SectionHead, Card, ScoreBar, RemedyList, DoshaCard, Tabs } from '../../components/ui/index.jsx';
import { useReports } from '../../hooks/index.js';
import { PLANET_SYMBOLS } from '../../../../shared/constants.js';

export default function VaultScreen({ onBack }) {
  const { reports, load, remove, star, loading } = useReports(true);
  const [filter,   setFilter  ] = useState('all');
  const [selected, setSelected] = useState(null);
  const [tab,      setTab     ] = useState(0);

  const filtered = (reports || []).filter(r => filter === 'all' || r.type === filter);
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (selected) {
    const r  = selected;
    const rd = r.report_data;
    const isPalm = r.type === 'palm';
    const RTABS = isPalm ? ['Summary','Life Line','Heart Line','Head Line','Fate Line','Remedies'] : ['Overview','Predictions','Dashas','Doshas'];
    const lineKeys = ['life_line','heart_line','head_line','fate_line'];

    return (
      <div className="av-page">
        <PageHead title={r.title} sub={fmt(r.created_at)} onBack={() => { setSelected(null); setTab(0); }}
          right={<button className="btn btn-outline btn-sm" onClick={() => { remove(r.uuid); setSelected(null); }} style={{ color: 'var(--red)', borderColor: 'rgba(255,107,107,.3)', padding: '7px 12px', fontSize: 10 }}>Delete</button>} />
        <Tabs items={RTABS} active={tab} onChange={setTab} />

        <div style={{ padding: '18px 22px 40px' }}>
          {isPalm && rd && (
            <>
              {tab === 0 && <>
                {r.image_key && <div style={{ height: 180, background: 'rgba(212,175,55,.08)', borderRadius: 16, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 48, opacity: .3 }}>✋</span></div>}
                <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 16 }}>{rd.overall}</p>
                {rd.overall_score && Object.entries(rd.overall_score).map(([k, v]) => (
                  <ScoreBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={v} color={v>=75?'var(--green)':v>=50?'var(--gold)':'var(--red)'} />
                ))}
              </>}
              {tab >= 1 && tab <= 4 && (() => { const l = rd[lineKeys[tab-1]]; return l ? <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}><div style={{ width: 4, height: 44, background: l.color||'var(--gold)', borderRadius: 2 }} /><div><h3 className="cinzel" style={{ fontSize: 16, color: 'var(--text)', marginBottom: 5 }}>{RTABS[tab]}</h3><span className="badge badge-gold">{l.strength}</span></div></div>
                <p style={{ fontStyle: 'italic', color: 'var(--text)', fontSize: 15, lineHeight: 1.75, marginBottom: 14 }}>{l.summary}</p>
                <Card style={{ marginBottom: 12 }}><p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8 }}>{l.detail}</p></Card>
                {l.prediction && <div style={{ padding: 14, background: 'var(--gold-p)', borderLeft: `3px solid ${l.color||'var(--gold)'}`, borderRadius: '0 10px 10px 0' }}><p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.75 }}>{l.prediction}</p></div>}
              </> : null; })()}
              {tab === 5 && <RemedyList remedies={rd.remedies} />}
            </>
          )}
          {!isPalm && rd && (
            <>
              {tab === 0 && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
                  {[['Lagna',rd.lagna],['Sun',rd.sun_sign],['Moon',rd.moon_sign],['Nakshatra',rd.nakshatra]].map(([k,v]) => (
                    <Card key={k} style={{ padding: '12px 13px' }}><div className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.4)', marginBottom: 4 }}>{k}</div><div style={{ color: 'var(--text)', fontSize: 13 }}>{v}</div></Card>
                  ))}
                </div>
                <div style={{ padding: 14, background: 'var(--gold-p)', border: '1px solid rgba(212,175,55,.16)', borderRadius: 12 }}>
                  <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.42)', letterSpacing: 1, marginBottom: 7 }}>CHART SUMMARY</p>
                  <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>{rd.overall}</p>
                </div>
              </>}
              {tab === 1 && rd.predictions && Object.entries(rd.predictions).map(([k,txt]) => (
                <Card key={k} style={{ marginBottom: 12 }}><h4 className="cinzel gold" style={{ fontSize: 12, marginBottom: 8, textTransform: 'capitalize' }}>{k}</h4><p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8 }}>{txt}</p></Card>
              ))}
              {tab === 2 && <>
                <div style={{ padding: 14, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.32)', borderRadius: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><p className="cinzel" style={{ fontSize: 12, color: 'var(--text)' }}>{rd.current_dasha?.planet} Mahadasha</p><span className="cinzel" style={{ fontSize: 10, color: 'rgba(212,175,55,.45)' }}>{rd.current_dasha?.years}</span></div>
                  <p style={{ color: 'var(--text-d)', fontSize: 13, lineHeight: 1.75 }}>{rd.current_dasha?.interpretation}</p>
                </div>
                {rd.upcoming_dashas?.map((d,i) => (
                  <div key={i} style={{ padding: '11px 14px', marginBottom: 9, background: 'rgba(16,20,44,.6)', border: '1px solid rgba(212,175,55,.11)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span className="cinzel" style={{ fontSize: 12, color: 'var(--text)' }}>{d.planet} Dasha</span><span style={{ fontSize: 10, color: 'rgba(212,175,55,.4)' }}>{d.start}–{d.end}</span></div>
                    <p style={{ color: 'var(--text-dd)', fontSize: 12 }}>{d.brief}</p>
                  </div>
                ))}
              </>}
              {tab === 3 && <><DoshaCard title="Mangal Dosha" dosha={rd.mangal_dosha} /><DoshaCard title="Kaal Sarp Dosha" dosha={rd.kaal_sarp} /><RemedyList remedies={rd.remedies} /></>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="av-page">
      <PageHead title="Report Vault" sub="ALL COSMIC READINGS" onBack={onBack} />
      <div style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['all','All'],['palm','Palm'],['kundali','Kundali']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`btn btn-sm ${filter===v?'btn-primary':'btn-ghost'}`} style={{ flex: 1 }}>{l}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ animation: 'orbit 2s linear infinite', display: 'inline-block', fontSize: 32 }}>⭕</div></div>
          : filtered.length === 0 ? <EmptyState icon="📜" message={"No readings saved yet.\nComplete a Palm or Kundali reading\nto see it here."} />
          : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => (
              <div key={r.uuid || r.id} onClick={() => { setSelected(r); setTab(0); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(12,16,38,.7)', border: '1px solid rgba(212,175,55,.14)', cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.4)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.14)'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--gold-p)', border: '1px solid var(--gold-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{r.type === 'palm' ? '✋' : '⭕'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="cinzel" style={{ fontSize: 13, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dd)' }}>{fmt(r.created_at)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <Badge variant={r.type === 'palm' ? 'gold' : 'blue'}>{r.type === 'palm' ? 'Palm' : 'Kundali'}</Badge>
                  <span style={{ color: 'rgba(212,175,55,.35)', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// frontend/src/screens/Profile/index.jsx
// ═══════════════════════════════════════════════════════
export function ProfileScreen({ onBack }) {
  const [{ useApp }] = [require('../../store/AppContext.jsx')];
  // Use inline component since this file has multiple exports
  return <ProfileScreenInner onBack={onBack} />;
}

import { useApp }     from '../../store/AppContext.jsx';
import { useAuth, useProfiles } from '../../hooks/index.js';
import { Input, Select, Toggle } from '../../components/ui/index.jsx';

export function ProfileScreen({ onBack }) {
  const { user, subscription } = useApp();
  const { logout } = useAuth();
  const { profiles, activeProfile, load, create, remove, setDefault, loading } = useProfiles(true);
  const [adding, setAdding] = useState(false);
  const [np, setNP] = useState({ name: '', relation: 'Spouse', gender: 'Male', date_of_birth: '', time_of_birth: '', place_of_birth: '' });

  const addProfile = async () => {
    if (!np.name.trim()) return;
    await create(np); setAdding(false); setNP({ name: '', relation: 'Spouse', gender: 'Male', date_of_birth: '', time_of_birth: '', place_of_birth: '' });
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const credits = subscription ? (subscription.credits_total === -1 ? '∞' : subscription.credits_total - subscription.credits_used) : 0;

  return (
    <div className="av-page">
      <PageHead title="Profile" sub="MANAGE IDENTITIES" onBack={onBack} />
      <div style={{ padding: '20px 22px 50px' }}>
        {/* User Card */}
        <div className="card-glow" style={{ padding: 20, marginBottom: 22, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#3A2850,#1A1025)', border: '2px solid rgba(212,175,55,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' }}>
            {user?.name?.[0]?.toUpperCase() || '✦'}
          </div>
          <h2 className="cinzel" style={{ fontSize: 18, color: 'var(--text)', marginBottom: 3 }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-d)', fontSize: 13, marginBottom: 14 }}>{user?.email}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Badge>✦ {subscription?.plan?.toUpperCase() || 'FREE'} Plan</Badge>
            <span style={{ fontSize: 12, color: 'var(--text-dd)', alignSelf: 'center' }}>{credits} credits remaining</span>
          </div>
        </div>

        <SectionHead label="Saved Profiles" right={<Btn variant="outline" full={false} style={{ padding: '7px 14px', fontSize: 10 }} onClick={() => setAdding(true)}>+ Add</Btn>} />

        {adding && (
          <Card style={{ marginBottom: 14, animation: 'pop .2s ease' }}>
            <p className="cinzel" style={{ fontSize: 10, color: 'rgba(212,175,55,.45)', letterSpacing: 1, marginBottom: 14 }}>NEW PROFILE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Name" placeholder="Full name" value={np.name} onChange={e => setNP({...np,name:e.target.value})} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Select label="Relation" value={np.relation} onChange={e => setNP({...np,relation:e.target.value})} options={[['Spouse','Spouse'],['Child','Child'],['Parent','Parent'],['Sibling','Sibling'],['Friend','Friend']]} />
                <Select label="Gender" value={np.gender} onChange={e => setNP({...np,gender:e.target.value})} options={[['Male','Male'],['Female','Female'],['Other','Other']]} />
              </div>
              <Input label="Date of Birth" type="date" value={np.date_of_birth} onChange={e => setNP({...np,date_of_birth:e.target.value})} />
              <Input label="Place of Birth" placeholder="City, Country" value={np.place_of_birth} onChange={e => setNP({...np,place_of_birth:e.target.value})} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={addProfile} style={{ flex: 2 }}>Save Profile</Btn>
                <Btn variant="ghost" onClick={() => setAdding(false)} style={{ flex: 1 }}>Cancel</Btn>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28 }}>
          {profiles.map(p => (
            <div key={p.uuid || p.id} onClick={() => setDefault(p.uuid)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 13, background: p.is_default ? 'rgba(212,175,55,.08)' : 'rgba(12,16,38,.7)', border: `1px solid ${p.is_default ? 'rgba(212,175,55,.45)' : 'rgba(212,175,55,.13)'}`, cursor: 'pointer', transition: 'all .2s' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${p.is_default ? '#7A6230,var(--gold)' : '#1A1025,#2A1A35'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {p.gender === 'Female' ? '👩' : p.gender === 'Male' ? '👨' : '🧑'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <p className="cinzel" style={{ fontSize: 13, color: 'var(--text)' }}>{p.name}</p>
                  {p.is_default && <Badge style={{ fontSize: 8 }}>Active</Badge>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-dd)' }}>{p.relation}{p.date_of_birth ? ` · ${fmt(p.date_of_birth)}` : ''}{p.place_of_birth ? ` · ${p.place_of_birth}` : ''}</p>
              </div>
              {!p.is_default && <button onClick={e => { e.stopPropagation(); remove(p.uuid); }} style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,.45)', cursor: 'pointer', fontSize: 18, padding: '4px 6px' }}>×</button>}
            </div>
          ))}
        </div>

        <Btn variant="ghost" onClick={logout} style={{ color: 'rgba(255,107,107,.7)', borderColor: 'rgba(255,107,107,.2)' }}>Sign Out</Btn>
      </div>
    </div>
  );
}
