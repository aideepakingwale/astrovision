// frontend/src/screens/Kundali/index.jsx
import { useState } from 'react';
import { PageHead, ProgressDots, ModelTag, ZodiacLoader, Tabs, DoshaCard,
         RemedyList, Btn, Card, Badge, SectionHead, ExpandCard } from '../../components/ui/index.jsx';
import { useKundali } from '../../hooks/index.js';
import { MODELS, PLANET_SYMBOLS } from '../../../../shared/constants.js';

const TABS = ['Overview', 'Birth Chart', 'Predictions', 'Dashas', 'Doshas & Remedies'];
const S_LAYOUT = [[12,1,2,3],[11,-1,-1,4],[10,-1,-1,5],[9,8,7,6]];

export default function KundaliScreen({ onBack }) {
  const { status, report, error, generate, reset } = useKundali();
  const [step,   setStep ] = useState(1);
  const [method, setMeth ] = useState('manual');
  const [form,   setForm ] = useState({ name:'', dob:'', tob:'', pob:'', noTime:false });
  const [tab,    setTab  ] = useState(0);
  const [litH,   setLitH ] = useState(null);
  const [cStyle, setCS   ] = useState('south');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const rd = report?.report_data;

  const runGenerate = async () => {
    setStep(3);
    await generate({ name: form.name, dob: form.dob, tob: form.noTime ? null : form.tob, pob: form.pob });
    setStep(4);
  };

  const handleReset = () => { reset(); setStep(1); setTab(0); setLitH(null); };

  return (
    <div className="av-page">
      <PageHead title="AstroChart" sub="KUNDALI ENGINE · SONNET 4" onBack={onBack} right={<ModelTag model={MODELS.SONNET} />} />
      {step < 4 && <ProgressDots total={3} current={step} />}

      {step === 1 && (
        <div className="fade-up" style={{ padding: '20px 22px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 64, display: 'inline-block', animation: 'orbit 14s linear infinite', marginBottom: 10 }}>⭕</div>
            <h2 className="cinzel" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Generate Kundali</h2>
            <p style={{ color: 'var(--text-d)', fontSize: 14, fontStyle: 'italic' }}>Celestial blueprint calculated with Vedic precision</p>
          </div>
          {[['📝','Enter Birth Details','Date, time & place of birth','manual'],
            ['📷','Upload Existing Chart','Scan your physical Kundali chart','upload']].map(([ic,t,d,m]) => (
            <div key={m} onClick={() => { setMeth(m); setStep(2); }} style={{ padding: 20, cursor: 'pointer', textAlign: 'center', background: 'var(--gold-p)', borderRadius: 16, border: '1px solid rgba(212,175,55,.22)', transition: 'all .3s', marginBottom: 14 }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(212,175,55,.1)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.22)'; e.currentTarget.style.background = 'var(--gold-p)'; }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{ic}</div>
              <h3 className="cinzel gold" style={{ fontSize: 15, marginBottom: 5 }}>{t}</h3>
              <p style={{ color: 'var(--text-dd)', fontSize: 13 }}>{d}</p>
            </div>
          ))}
        </div>
      )}

      {step === 2 && method === 'manual' && (
        <div className="fade-up" style={{ padding: '20px 22px 40px' }}>
          <SectionHead label="Birth Details" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['Full Name','text','name','Enter full name'],['Date of Birth','date','dob',''],['Place of Birth','text','pob','City, Country']].map(([lbl,type,key,ph]) => (
              <div key={key}>
                <label className="inp-label">{lbl}</label>
                <input className="inp" type={type} placeholder={ph} value={form[key]} onChange={e => setF(key, e.target.value)} />
              </div>
            ))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="inp-label" style={{ marginBottom: 0 }}>Time of Birth</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.noTime} onChange={e => setF('noTime', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                  <span className="cinzel" style={{ fontSize: 9.5, color: 'var(--text-dd)' }}>Unknown</span>
                </label>
              </div>
              <input className="inp" type="time" value={form.tob} disabled={form.noTime} onChange={e => setF('tob', e.target.value)} style={{ opacity: form.noTime ? .4 : 1 }} />
            </div>
            <Btn onClick={runGenerate} disabled={!form.dob || !form.pob} style={{ opacity: (!form.dob || !form.pob) ? .38 : 1 }}>✦  Generate My Kundali</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-up" style={{ padding: '20px 22px' }}>
          <ZodiacLoader label="Mapping celestial positions…" />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dd)', fontSize: 13, marginBottom: 12 }}>{form.dob && `${form.dob} · `}{form.pob}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {Object.entries(PLANET_SYMBOLS).map(([p, s], i) => (
                <span key={p} className="cinzel badge badge-gold" style={{ animation: `twinkle 1.5s ${i * .18}s ease-in-out infinite` }}>{s} {p}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && rd && (
        <div className="fade-up">
          <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg,rgba(20,12,32,.96),rgba(14,18,44,.96))', borderBottom: '1px solid rgba(212,175,55,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h2 className="cinzel" style={{ fontSize: 19, color: 'var(--text)', marginBottom: 3 }}>{form.name || 'Kundali'}</h2>
                <p className="cinzel" style={{ fontSize: 9.5, color: 'rgba(212,175,55,.42)' }}>{form.dob}{form.pob ? ` · ${form.pob}` : ''}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="cinzel" style={{ fontSize: 8.5, color: 'rgba(212,175,55,.4)', letterSpacing: 1 }}>LAGNA</p>
                <p className="cinzel gold" style={{ fontSize: 16, fontWeight: 700 }}>{rd.lagna}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {[['☉','Sun',rd.sun_sign],['☽','Moon',rd.moon_sign],['✦','Nakshatra',rd.nakshatra],['📅','Ayanamsa',rd.ayanamsa]].map(([ic,lbl,val]) => (
                <div key={lbl} style={{ flex: '1 1 72px', padding: '9px 11px', background: 'var(--gold-p)', border: '1px solid rgba(212,175,55,.16)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 13 }}>{ic}</div>
                  <div className="cinzel" style={{ fontSize: 8.5, color: 'rgba(212,175,55,.38)', marginTop: 2 }}>{lbl}</div>
                  <div className="cinzel" style={{ fontSize: 11, color: 'var(--text)', marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <Tabs items={TABS} active={tab} onChange={setTab} />

          <div style={{ padding: '18px 22px' }}>
            {tab === 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
                  {[['Ascendant',`${rd.lagna} ${rd.lagna_deg}`],['Sun Sign',rd.sun_sign],['Moon Sign',rd.moon_sign],['Nakshatra',`${rd.nakshatra} (P${rd.nakshatra_pada})`]].map(([k,v]) => (
                    <Card key={k} style={{ padding: '12px 13px' }}>
                      <div className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.4)', marginBottom: 4 }}>{k}</div>
                      <div style={{ color: 'var(--text)', fontSize: 13 }}>{v}</div>
                    </Card>
                  ))}
                </div>
                {rd.yogas?.filter(y => y.present).map((y, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '12px 14px', background: 'rgba(107,255,142,.05)', border: '1px solid rgba(107,255,142,.18)', borderRadius: 12 }}>
                    <span style={{ color: 'var(--green)' }}>✦</span>
                    <div><p className="cinzel" style={{ fontSize: 12, color: 'var(--green)', marginBottom: 3 }}>{y.name}</p><p style={{ color: 'var(--text-d)', fontSize: 13 }}>{y.description}</p></div>
                  </div>
                ))}
                <SectionHead label="Planetary Positions" />
                {Object.entries(rd.planets || {}).map(([pl, d]) => (
                  <div key={pl} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width: 28, textAlign: 'center', fontSize: 15, color: 'var(--gold)', paddingTop: 2 }}>{PLANET_SYMBOLS[pl] || '✦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                        <span className="cinzel" style={{ fontSize: 12, color: 'var(--text)' }}>{pl}</span>
                        <span style={{ fontSize: 11, color: 'rgba(212,175,55,.4)' }}>{d.sign} · H{d.house} · {d.degree}</span>
                        {d.retrograde && <Badge variant="red" style={{ fontSize: 8 }}>℞</Badge>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-dd)' }}>{d.effect}</p>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18, padding: 15, background: 'var(--gold-p)', border: '1px solid rgba(212,175,55,.16)', borderRadius: 12 }}>
                  <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.42)', letterSpacing: 1, marginBottom: 7 }}>✦ CHART SUMMARY</p>
                  <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>{rd.overall}</p>
                </div>
              </>
            )}

            {tab === 1 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.45)', letterSpacing: 1 }}>LAGNA CHART (D1)</p>
                  <button onClick={() => setCS(s => s === 'south' ? 'north' : 'south')} className="btn btn-outline btn-sm">{cStyle === 'south' ? 'South' : 'North'} Indian ↔</button>
                </div>
                {cStyle === 'south' && (
                  <div className="kgrid" style={{ maxWidth: 310, margin: '0 auto 14px' }}>
                    {S_LAYOUT.flat().map((h, idx) => {
                      if (h === -1) return <div key={`c${idx}`} className="kcel center"><div className="cinzel gold" style={{ fontSize: 12, fontWeight: 700 }}>{rd.lagna}</div><div className="cinzel" style={{ fontSize: 8, color: 'rgba(212,175,55,.38)' }}>Lagna</div></div>;
                      const hd = rd.houses?.[String(h)] || {};
                      return (
                        <div key={h} className={`kcel ${litH === h ? 'lit' : ''}`} onClick={() => setLitH(l => l === h ? null : h)}>
                          <div className="knum">{h}</div>
                          <div className="kpla">{(hd.planets || []).map(p => PLANET_SYMBOLS[p] || p).join(' ')}</div>
                          <div className="ksig">{(hd.sign || '').slice(0, 3)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {cStyle === 'north' && (
                  <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 310, margin: '0 auto 14px', display: 'block', border: '1px solid rgba(212,175,55,.32)', borderRadius: 6 }}>
                    <rect width="300" height="300" fill="#0A1030" />
                    <rect x="3" y="3" width="294" height="294" fill="none" stroke="rgba(212,175,55,.38)" strokeWidth="1" />
                    <polygon points="150,3 297,150 150,297 3,150" fill="none" stroke="rgba(212,175,55,.38)" strokeWidth="1" />
                    <line x1="3" y1="3" x2="297" y2="297" stroke="rgba(212,175,55,.15)" strokeWidth=".5" />
                    <line x1="297" y1="3" x2="3" y2="297" stroke="rgba(212,175,55,.15)" strokeWidth=".5" />
                    {[[150,26,1],[228,74,2],[272,150,3],[228,226,4],[150,273,5],[73,226,6],[28,150,7],[73,74,8],[150,88,9],[212,150,10],[150,212,11],[88,150,12]].map(([x,y,h]) => {
                      const hd = rd.houses?.[String(h)] || {};
                      const pls = (hd.planets || []).map(p => PLANET_SYMBOLS[p] || p).join('');
                      return <g key={h} onClick={() => setLitH(l => l === h ? null : h)} style={{ cursor: 'pointer' }}>
                        <text x={x} y={y - 12} textAnchor="middle" fontSize="8" fill="rgba(212,175,55,.35)" fontFamily="Cinzel,serif">{h}</text>
                        <text x={x} y={y + 3}  textAnchor="middle" fontSize="10" fill="#D4AF37">{pls}</text>
                      </g>;
                    })}
                    <text x="150" y="145" textAnchor="middle" fontSize="11" fill="#D4AF37" fontFamily="Cinzel,serif" fontWeight="700">{rd.lagna}</text>
                    <text x="150" y="160" textAnchor="middle" fontSize="8"  fill="rgba(212,175,55,.42)" fontFamily="Cinzel,serif">Lagna</text>
                  </svg>
                )}
                {litH && rd.houses?.[String(litH)] && (
                  <Card style={{ padding: 14, animation: 'pop .2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p className="cinzel gold" style={{ fontSize: 13 }}>House {litH} — {rd.houses[String(litH)].sign}</p>
                      <Badge>{rd.houses[String(litH)].nature}</Badge>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-d)', marginBottom: 4 }}>Lord: <span style={{ color: 'var(--text)' }}>{rd.houses[String(litH)].lord}</span></p>
                    <p style={{ fontSize: 13, color: 'var(--text-d)' }}>Planets: <span style={{ color: 'var(--text)' }}>{rd.houses[String(litH)].planets?.join(', ') || 'None'}</span></p>
                  </Card>
                )}
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dd)', marginTop: 10, fontStyle: 'italic' }}>Tap any house for details</p>
              </>
            )}

            {tab === 2 && rd.predictions && (
              <>{[['💼','Career & Profession',rd.predictions.career,'var(--blue)'],['💰','Finance & Wealth',rd.predictions.finance,'var(--green)'],['💑','Marriage & Relationships',rd.predictions.marriage,'#FF90B0'],['🏥','Health & Vitality',rd.predictions.health,'#90E0FF']].map(([ic,t,txt,c]) => (
                <Card key={t} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 20 }}>{ic}</span><h4 className="cinzel" style={{ fontSize: 13, color: c }}>{t}</h4></div>
                  <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8 }}>{txt}</p>
                </Card>
              ))}</>
            )}

            {tab === 3 && (
              <>
                <div style={{ padding: 16, marginBottom: 16, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.36)', borderRadius: 14, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, left: 14 }}><span style={{ background: 'var(--gold)', color: 'var(--navy)', padding: '2px 10px', borderRadius: 20, fontSize: 8.5, fontFamily: 'Cinzel,serif', fontWeight: 700 }}>CURRENT DASHA</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, marginTop: 4 }}>
                    <h3 className="cinzel" style={{ fontSize: 16, color: 'var(--text)' }}>{rd.current_dasha?.planet} Mahadasha</h3>
                    <span className="cinzel" style={{ fontSize: 10, color: 'rgba(212,175,55,.5)' }}>{rd.current_dasha?.years}</span>
                  </div>
                  <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>{rd.current_dasha?.interpretation}</p>
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(212,175,55,.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p className="cinzel" style={{ fontSize: 12, color: 'var(--text)' }}>{rd.antardasha?.planet} Antardasha</p>
                      <span className="cinzel" style={{ fontSize: 10, color: 'rgba(212,175,55,.4)' }}>{rd.antardasha?.period}</span>
                    </div>
                    <p style={{ color: 'var(--text-d)', fontSize: 13, lineHeight: 1.7 }}>{rd.antardasha?.interpretation}</p>
                  </div>
                </div>
                <SectionHead label="Upcoming Periods" />
                {rd.upcoming_dashas?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 13, padding: '13px 15px', marginBottom: 10, background: 'rgba(16,20,44,.6)', border: '1px solid rgba(212,175,55,.12)', borderRadius: 11 }}>
                    <div style={{ minWidth: 30, height: 30, borderRadius: '50%', background: 'var(--gold-p)', border: '1px solid var(--gold-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--gold)', fontFamily: 'Cinzel,serif' }}>{i + 1}</div>
                    <div><div style={{ display: 'flex', gap: 8, marginBottom: 3 }}><span className="cinzel" style={{ fontSize: 13, color: 'var(--text)' }}>{d.planet} Dasha</span><span style={{ fontSize: 10, color: 'rgba(212,175,55,.4)' }}>{d.start}–{d.end}</span></div><p style={{ color: 'var(--text-dd)', fontSize: 12 }}>{d.brief}</p></div>
                  </div>
                ))}
              </>
            )}

            {tab === 4 && (
              <><SectionHead label="Dosha Analysis" />
                <DoshaCard title="Mangal Dosha (Mars Affliction)" dosha={rd.mangal_dosha} />
                <DoshaCard title="Kaal Sarp Dosha" dosha={rd.kaal_sarp} />
                <SectionHead label="Prescribed Remedies" />
                <RemedyList remedies={rd.remedies} />
              </>
            )}
          </div>

          <div style={{ padding: '0 22px 32px', display: 'flex', gap: 12 }}>
            <Btn style={{ flex: 2 }}>✦  Saved to Vault</Btn>
            <Btn variant="outline" onClick={handleReset} style={{ flex: 1 }}>↩ New</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
