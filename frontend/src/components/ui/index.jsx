// frontend/src/components/ui/index.jsx
// ─── Atomic / Molecule UI components ─────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext.jsx';

// ── Stars background ──────────────────────────────────────────────────────────
export function Stars({ count = 60, style }) {
  const pts = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    r: Math.random() * 1.3 + 0.3,
    delay: Math.random() * 5, dur: Math.random() * 3 + 2, gold: i % 6 === 0,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}>
      {pts.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          background: s.gold ? 'var(--gold)' : '#fff',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', full = true,
  disabled, loading, onClick, style, icon }) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''}`;
  return (
    <button className={cls} onClick={onClick} disabled={disabled || loading}
      style={{ ...(full ? { width: '100%' } : { width: 'auto' }), ...style }}>
      {loading ? <span className="spin-ico">◌</span> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Field({ label, error, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label className="inp-label">
          {label}{required && <span style={{ color: 'var(--gold)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{error}</p>}
    </div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <Field label={label} error={error} required={props.required}>
      <input className="inp" {...props} />
    </Field>
  );
}

export function Textarea({ label, error, rows = 3, ...props }) {
  return (
    <Field label={label} error={error}>
      <textarea className="inp" rows={rows} style={{ resize: 'none' }} {...props} />
    </Field>
  );
}

export function Select({ label, error, options = [], ...props }) {
  return (
    <Field label={label} error={error}>
      <select className="inp" {...props}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange, label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
      <div style={{ flex: 1 }}>
        {label && <p style={{ color: 'var(--text)', fontSize: 14 }}>{label}</p>}
        {sub   && <p style={{ color: 'var(--text-dd)', fontSize: 12, marginTop: 2 }}>{sub}</p>}
      </div>
      <div onClick={onChange} style={{
        width: 46, height: 26, borderRadius: 13,
        background: value ? 'var(--gold)' : 'rgba(255,255,255,.12)',
        position: 'relative', cursor: 'pointer', transition: 'background .3s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 22 : 3, width: 20, height: 20,
          borderRadius: '50%', background: '#fff', transition: 'left .3s',
          boxShadow: '0 2px 6px rgba(0,0,0,.3)',
        }} />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, glow, style, onClick }) {
  return (
    <div className={glow ? 'card-glow' : 'card'} style={{ padding: 16, cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gold' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ── Model Tag ─────────────────────────────────────────────────────────────────
const SONNET_ID = 'claude-sonnet-4-20250514';
export function ModelTag({ model }) {
  const isSonnet = model?.includes('sonnet');
  return (
    <span className={`model-tag ${isSonnet ? 'model-sonnet' : 'model-haiku'}`}>
      {isSonnet ? '◈ Sonnet 4' : '◇ Haiku 4.5'}
    </span>
  );
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
export function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span className="cinzel" style={{ fontSize: 10, color: 'var(--text-d)', letterSpacing: .5 }}>{label}</span>
        <span className="cinzel" style={{ fontSize: 10, color }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 2, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHead({ label, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
      <p className="cinzel" style={{ fontSize: 9.5, color: 'rgba(212,175,55,.48)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</p>
      {right}
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHead({ title, sub, onBack, right }) {
  return (
    <div style={{
      padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px solid rgba(212,175,55,.09)',
      position: 'sticky', top: 0,
      background: 'rgba(10,17,40,.97)', backdropFilter: 'blur(20px)', zIndex: 50,
    }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 28, lineHeight: 1, padding: 0, flexShrink: 0 }}>‹</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
        {sub && <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.45)', letterSpacing: 1.5, marginTop: 1 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// ── Progress Dots ─────────────────────────────────────────────────────────────
export function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '14px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 6, borderRadius: 3,
          width: i < current ? 22 : 6,
          background: i < current ? 'var(--gold)' : 'rgba(212,175,55,.18)',
          transition: 'all .3s',
        }} />
      ))}
    </div>
  );
}

// ── Zodiac Loader ─────────────────────────────────────────────────────────────
export function ZodiacLoader({ label = 'Calculating…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 28 }}>
      <div className="zloader">
        <div className="zring zr1" /><div className="zring zr2" /><div className="zring zr3" />
        <div className="zctr" style={{ animation: 'pulse 2s ease-in-out infinite' }}>☽</div>
      </div>
      <p className="cinzel" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: 1 }}>{label}</p>
    </div>
  );
}

// ── Scan Overlay ──────────────────────────────────────────────────────────────
export function ScanOverlay() {
  return (
    <div className="scan-wrap">
      <div className="scan-beam" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '✦', message }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 32px' }}>
      <div style={{ fontSize: 46, marginBottom: 14, opacity: .22 }}>{icon}</div>
      <p style={{ color: 'var(--text-dd)', fontSize: 14, fontStyle: 'italic', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{message}</p>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const colors = { gold: 'var(--gold)', error: 'var(--red)', success: 'var(--green)' };
  return (
    <div className="toast" style={{ color: colors[toast.variant] || 'var(--gold)' }}>
      {toast.message}
    </div>
  );
}

// ── Expand Card ───────────────────────────────────────────────────────────────
export function ExpandCard({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span className="cinzel" style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{title}</span>
        <span style={{ color: 'var(--gold-d)', fontSize: 16, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : '' }}>▼</span>
      </div>
      {open && <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(212,175,55,.1)' }}>{children}</div>}
    </div>
  );
}

// ── Dosha Card ────────────────────────────────────────────────────────────────
export function DoshaCard({ title, dosha }) {
  if (!dosha) return null;
  return (
    <div className="card" style={{ padding: 15, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 className="cinzel" style={{ fontSize: 13, color: 'var(--text)' }}>{title}</h4>
        <Badge variant={dosha.present ? 'red' : 'green'}>
          {dosha.present ? `Present${dosha.severity ? ` · ${dosha.severity}` : ''}` : 'Not Present'}
        </Badge>
      </div>
      <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.75 }}>{dosha.description}</p>
      {dosha.remedy && (
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid rgba(212,175,55,.1)' }}>
          <p className="cinzel" style={{ fontSize: 9, color: 'rgba(212,175,55,.4)', letterSpacing: 1, marginBottom: 5 }}>REMEDY</p>
          <p style={{ color: 'var(--text-d)', fontSize: 13, lineHeight: 1.65 }}>{dosha.remedy}</p>
        </div>
      )}
    </div>
  );
}

// ── Remedy List ───────────────────────────────────────────────────────────────
export function RemedyList({ remedies = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {remedies.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 14px', background: 'var(--gold-p)', border: '1px solid rgba(212,175,55,.12)', borderRadius: 11 }}>
          <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'linear-gradient(135deg,#7A6230,var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--navy)', fontFamily: 'Cinzel,serif', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
          <p style={{ color: 'var(--text-d)', fontSize: 14, lineHeight: 1.7 }}>{r}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ items, active, onChange, style }) {
  return (
    <div className="tabs" style={{ padding: '0 22px', ...style }}>
      {items.map((t, i) => (
        <div key={t} className={`tab ${active === i ? 'on' : ''}`} onClick={() => onChange(i)}>{t}</div>
      ))}
    </div>
  );
}
