// frontend/src/screens/Palm/index.jsx
import { useState, useRef } from 'react';
import { PageHead, ProgressDots, ModelTag, ScanOverlay, Tabs, ScoreBar,
         ExpandCard, RemedyList, Btn, Card, Badge, SectionHead, ZodiacLoader } from '../../components/ui/index.jsx';
import { usePalm }  from '../../hooks/index.js';
import { MODELS }   from '../../../../shared/constants.js';

const TABS = ['Life Line', 'Heart Line', 'Head Line', 'Fate Line', 'Mounts', 'Scores', 'Remedies'];
const LINE_KEYS = ['life_line', 'heart_line', 'head_line', 'fate_line'];

export default function PalmScreen({ onBack }) {
  const { status, report, error, analyze, reset } = usePalm();
  const [step,    setStep  ] = useState(1);
  const [imgPrev, setImg   ] = useState(null);
  const [imgFile, setFile  ] = useState(null);
  const [tab,     setTab   ] = useState(0);
  const fileRef = useRef();

  const pickFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onload = ev => { setImg(ev.target.result); setStep(3); };
    r.readAsDataURL(f);
  };

  const runAnalysis = async () => {
    setStep(4);
    await analyze(imgFile || null);
    setStep(5);
  };

  const handleReset = () => { reset(); setStep(1); setImg(null); setFile(null); setTab(0); };

  const lines = report?.report_data ? LINE_KEYS.map((k, i) => ({ ...report.report_data[k], title: TABS[i] })) : [];
  const rd    = report?.report_data;

  return (
    <div className="av-page">
      <PageHead title="AstroPalm" sub={`PALM READING · SONNET 4`} onBack={onBack} right={<ModelTag model={MODELS.SONNET} />} />
      {step < 5 && <ProgressDots total={4} current={step} />}

      {/* ── STEP 1: Intro ── */}
      {step === 1 && (
        <div className="fade-up" style={{ padding: '20px 22px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 72, animation: 'float 4s ease-in-out infinite', marginBottom: 14 }}>✋</div>
            <h2 className="cinzel" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 10 }}>Before We Begin</h2>
            <p style={{ color: 'var(--text-d)', fontSize: 15, lineHeight: 1.65, fontStyle: 'italic' }}>The lines of your palm carry the imprint of your destiny</p>
          </div>
          <Card style={{ marginBottom: 22 }}>
            <SectionHead label="Tips for Best Results" />
            {[['☀️', 'Good Lighting', 'Natural or warm lamp — no harsh shadows'],
              ['✋', 'Flat Open Palm', 'Dominant hand fully extended and flat'],
              ['📸', 'Fill the Frame', 'Your entire palm fills the camera view'],
              ['🔆', 'Clear Lines', 'All major lines clearly visible']].map(([ic, t, d]) => (
              <div key={t} style={{ display: 'flex', gap: 12, marginBottom: 13 }}>
                <span style={{ fontSize: 20 }}>{ic}</span>
                <div><p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t}</p><p style={{ color: 'var(--text-d)', fontSize: 12 }}>{d}</p></div>
              </div>
            ))}
          </Card>
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn onClick={() => setStep(2)} style={{ flex: 2 }}>📷  Capture Palm</Btn>
            <Btn variant="outline" onClick={runAnalysis} style={{ flex: 1, fontSize: 11 }}>Skip →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 2: Camera / Upload ── */}
      {step === 2 && (
        <div className="fade-up" style={{ padding: '20px 22px 40px' }}>
          <div style={{ aspectRatio: '3/4', maxHeight: 300, background: 'rgba(0,0,0,.55)', borderRadius: 20, border: '2px dashed rgba(212,175,55,.35)', marginBottom: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <svg width="52%" height="52%" viewBox="0 0 200 260" fill="none" style={{ opacity: .22 }}>
              <path d="M80 260 L40 160 L35 120 C35 110 45 105 50 115 L55 135 L55 80 C55 70 65 65 70 75 L70 130 L70 50 C70 40 80 35 85 45 L85 130 L90 50 C90 40 100 40 100 50 L100 130 L105 70 C105 60 115 60 115 70 L115 155 L115 160 C115 200 100 230 100 260 Z" stroke="var(--gold)" strokeWidth="1.5" />
            </svg>
            <p className="cinzel" style={{ position: 'absolute', bottom: 16, fontSize: 10, color: 'rgba(212,175,55,.4)', letterSpacing: 2 }}>ALIGN PALM HERE</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={pickFile} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <Btn onClick={() => fileRef.current?.click()} style={{ flex: 2 }}>📷  Take Photo</Btn>
            <Btn variant="outline" onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute('capture'); fileRef.current.click(); } }} style={{ flex: 1 }}>🖼</Btn>
          </div>
          <Btn variant="ghost" onClick={runAnalysis}>✦  General Reading (No Photo)</Btn>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 3 && imgPrev && (
        <div className="fade-up" style={{ padding: '20px 22px 40px' }}>
          <p className="cinzel" style={{ textAlign: 'center', fontSize: 11, color: 'rgba(212,175,55,.55)', letterSpacing: 1, marginBottom: 14 }}>CONFIRM YOUR PALM IMAGE</p>
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 18, border: '1px solid rgba(212,175,55,.3)', position: 'relative' }}>
            <img src={imgPrev} style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }} alt="Palm" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,17,40,.7) 0%,transparent 55%)' }} />
          </div>
          <Card style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🔍</span>
            <p style={{ color: 'var(--text-d)', fontSize: 14 }}>Are all palm lines clearly visible and well-lit?</p>
          </Card>
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn variant="outline" onClick={() => setStep(2)} style={{ flex: 1 }}>↩ Retake</Btn>
            <Btn onClick={runAnalysis} style={{ flex: 2 }}>✦  Analyse My Palm</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 4: Loading ── */}
      {step === 4 && (
        <div className="fade-up" style={{ padding: '30px 22px', textAlign: 'center' }}>
          {imgPrev ? (
            <div style={{ position: 'relative', width: 230, height: 230, margin: '0 auto 28px', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(212,175,55,.28)' }}>
              <img src={imgPrev} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <ScanOverlay />
            </div>
          ) : <div style={{ fontSize: 80, marginBottom: 28, animation: 'float 3s ease-in-out infinite' }}>✋</div>}
          <h3 className="cinzel" style={{ fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>Reading Your Palm</h3>
          <p style={{ color: 'rgba(212,175,55,.6)', fontSize: 14, fontStyle: 'italic', marginBottom: 10 }}>AI vision analysis in progress…</p>
          <ModelTag model={MODELS.SONNET} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {TABS.slice(0, 5).map((l, i) => (
              <span key={l} className="cinzel badge badge-gold" style={{ animation: `twinkle 1.5s ${i * .28}s ease-in-out infinite` }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 5: Report ── */}
      {step === 5 && rd && (
        <div className="fade-up">
          {/* Hero */}
          {imgPrev ? (
            <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
              <img src={imgPrev} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(10,17,40,.2) 0%,rgba(10,17,40,.93) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 22, right: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 className="cinzel" style={{ fontSize: 19, color: 'var(--text)', flex: 1 }}>Your Palm Reading</h2>
                  <Badge>{rd.dominant_hand_type}</Badge>
                </div>
                <p style={{ color: 'rgba(212,175,55,.72)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.55 }}>{rd.overall}</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 22px 16px', background: 'linear-gradient(135deg,rgba(22,14,34,.95),rgba(16,20,44,.95))', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>✋</div>
              <h2 className="cinzel" style={{ fontSize: 19, color: 'var(--text)', marginBottom: 6 }}>Your Palm Reading</h2>
              <p style={{ color: 'rgba(212,175,55,.7)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.55 }}>{rd.overall}</p>
            </div>
          )}

          <Tabs items={TABS} active={tab} onChange={setTab} />

          <div style={{ padding: '18px 22px' }}>
            {/* Lines 0-3 */}
            {tab < 4 && lines[tab] && (() => {
              const l = lines[tab];
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 4, minHeight: 50, background: l.color || 'var(--gold)', borderRadius: 2, flexShrink: 0 }} />
                    <div>
                      <h3 className="cinzel" style={{ fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>{l.title}</h3>
                      <span className="badge" style={{ background: `${l.color || 'var(--gold)'}18`, border: `1px solid ${l.color || 'var(--gold)'}55`, color: l.color || 'var(--gold)' }}>{l.strength}</span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontStyle: 'italic', lineHeight: 1.75, marginBottom: 14 }}>{l.summary}</p>
                  <Card style={{ marginBottom: 14 }}>
                    <p className="cinzel" style={{ fontSize: 9.5, color: 'rgba(212,175,55,.45)', letterSpacing: 1, marginBottom: 8 }}>DETAILED ANALYSIS</p>
                    <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.8 }}>{l.detail}</p>
                  </Card>
                  {l.prediction && (
                    <div style={{ padding: 14, background: 'var(--gold-p)', borderLeft: `3px solid ${l.color || 'var(--gold)'}`, borderRadius: '0 10px 10px 0', marginBottom: 14 }}>
                      <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.4)', letterSpacing: 1, marginBottom: 5 }}>✦ PREDICTION</p>
                      <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.75 }}>{l.prediction}</p>
                    </div>
                  )}
                  {l.age_timeline && (
                    <div style={{ padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
                      <p className="cinzel" style={{ fontSize: 9, color: 'var(--text-dd)', letterSpacing: 1, marginBottom: 4 }}>AGE TIMELINE</p>
                      <p style={{ color: 'var(--text-d)', fontSize: 13 }}>{l.age_timeline}</p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Mounts */}
            {tab === 4 && rd.mounts && (
              <>{Object.entries(rd.mounts).map(([m, d]) => (
                <ExpandCard key={m} title={`Mount of ${m.replace(/_/g, ' ')}`} icon="✦">
                  <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.75, paddingTop: 10 }}>{d}</p>
                </ExpandCard>
              ))}</>
            )}

            {/* Scores */}
            {tab === 5 && rd.overall_score && (
              <>
                <SectionHead label="Life Domain Scores" />
                {Object.entries(rd.overall_score).map(([k, v]) => (
                  <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} color={v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--gold)' : 'var(--red)'} />
                ))}
              </>
            )}

            {/* Remedies */}
            {tab === 6 && <><SectionHead label="Astrological Remedies" /><RemedyList remedies={rd.remedies} /></>}
          </div>

          <div style={{ padding: '0 22px 32px', display: 'flex', gap: 12 }}>
            <Btn style={{ flex: 2 }} onClick={() => alert('Saved to Vault!')}>✦  Saved to Vault</Btn>
            <Btn variant="outline" onClick={handleReset} style={{ flex: 1 }}>↩ New</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
