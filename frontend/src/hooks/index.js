// frontend/src/hooks/index.js
// ─── All custom hooks — thin wrappers over API + context ─────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp }      from '../store/AppContext.jsx';
import { authApi }     from '../api/index.js';
import { palmApi }     from '../api/index.js';
import { kundaliApi }  from '../api/index.js';
import { reportsApi }  from '../api/index.js';
import { profilesApi } from '../api/index.js';
import { cosmicApi }   from '../api/index.js';
import { tokens }      from '../api/client.js';

// ══════════════════════════════════════════════════════════════════════════════
// useAuth
// ══════════════════════════════════════════════════════════════════════════════
export function useAuth() {
  const { authStatus, user, subscription, setAuth, logout, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const register = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await authApi.register(data);
      tokens.set(res.tokens.accessToken, res.tokens.refreshToken);
      setAuth(res.user, res.subscription);
      return res;
    } catch (e) { setError(e.data?.message || e.message); throw e; }
    finally { setLoading(false); }
  }, [setAuth]);

  const login = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.subscription);
      return res;
    } catch (e) { setError(e.data?.message || e.message); throw e; }
    finally { setLoading(false); }
  }, [setAuth]);

  const signOut = useCallback(async () => {
    await logout();
    showToast('Signed out successfully');
  }, [logout, showToast]);

  return { authStatus, user, subscription, loading, error, register, login, logout: signOut };
}

// ══════════════════════════════════════════════════════════════════════════════
// useReports
// ══════════════════════════════════════════════════════════════════════════════
export function useReports(autoLoad = false) {
  const { reports, reportsTotal, reportsStatus, setReports, addReport, removeReport, starReport, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const load = useCallback(async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const res = await reportsApi.list(params);
      setReports(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [setReports]);

  useEffect(() => { if (autoLoad) load(); }, [autoLoad]);

  const remove = useCallback(async (uuid) => {
    removeReport(uuid);
    await reportsApi.remove(uuid).catch(() => {});
    showToast('Report deleted');
  }, [removeReport, showToast]);

  const star = useCallback(async (uuid, currentStarred) => {
    starReport(uuid, !currentStarred);
    await reportsApi.star(uuid).catch(() => {});
  }, [starReport]);

  return { reports, reportsTotal, reportsStatus, loading, error, load, remove, star, addReport };
}

// ══════════════════════════════════════════════════════════════════════════════
// useProfiles
// ══════════════════════════════════════════════════════════════════════════════
export function useProfiles(autoLoad = false) {
  const { profiles, activeProfile, setProfiles, addProfile, updateProfile, removeProfile,
          setActiveProfile, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profilesApi.list();
      setProfiles(res.profiles);
      const def = res.profiles.find(p => p.is_default);
      if (def) setActiveProfile(def.id);
    } finally { setLoading(false); }
  }, [setProfiles, setActiveProfile]);

  useEffect(() => { if (autoLoad) load(); }, [autoLoad]);

  const create = useCallback(async (data) => {
    const res = await profilesApi.create(data);
    addProfile(res.profile);
    showToast(`✦ ${res.profile.name} added`);
    return res.profile;
  }, [addProfile, showToast]);

  const update = useCallback(async (uuid, data) => {
    const res = await profilesApi.update(uuid, data);
    updateProfile(res.profile);
    return res.profile;
  }, [updateProfile]);

  const remove = useCallback(async (uuid) => {
    await profilesApi.remove(uuid);
    removeProfile(uuid);
    showToast('Profile removed');
  }, [removeProfile, showToast]);

  const setDefault = useCallback(async (uuid) => {
    const res = await profilesApi.setDefault(uuid);
    setProfiles(res.profiles);
  }, [setProfiles]);

  return { profiles, activeProfile, loading, load, create, update, remove, setDefault, setActiveProfile };
}

// ══════════════════════════════════════════════════════════════════════════════
// usePalm
// ══════════════════════════════════════════════════════════════════════════════
export function usePalm() {
  const { showToast, addReport } = useApp();
  const [status,  setStatus ] = useState('idle');   // idle|loading|done|error
  const [report,  setReport ] = useState(null);
  const [error,   setError  ] = useState(null);
  const [credits, setCredits] = useState(null);

  const analyze = useCallback(async (imageFile = null, profileId = null) => {
    setStatus('loading'); setError(null); setReport(null);
    try {
      const res = await palmApi.analyze(imageFile, profileId);
      setReport(res.report);
      setCredits(res.credits);
      addReport(res.report);
      setStatus('done');
      return res.report;
    } catch (e) {
      setError(e.data?.message || e.message);
      setStatus('error');
      showToast(e.data?.message || 'Analysis failed — please retry', 'error');
      throw e;
    }
  }, [addReport, showToast]);

  const reset = useCallback(() => { setStatus('idle'); setReport(null); setError(null); }, []);

  return { status, report, error, credits, analyze, reset };
}

// ══════════════════════════════════════════════════════════════════════════════
// useKundali
// ══════════════════════════════════════════════════════════════════════════════
export function useKundali() {
  const { showToast, addReport } = useApp();
  const [status,  setStatus ] = useState('idle');
  const [report,  setReport ] = useState(null);
  const [error,   setError  ] = useState(null);
  const [credits, setCredits] = useState(null);

  const generate = useCallback(async (formData) => {
    setStatus('loading'); setError(null); setReport(null);
    try {
      const res = await kundaliApi.generate(formData);
      setReport(res.report);
      setCredits(res.credits);
      addReport(res.report);
      setStatus('done');
      return res.report;
    } catch (e) {
      setError(e.data?.message || e.message);
      setStatus('error');
      showToast(e.data?.message || 'Generation failed — please retry', 'error');
      throw e;
    }
  }, [addReport, showToast]);

  const reset = useCallback(() => { setStatus('idle'); setReport(null); setError(null); }, []);

  return { status, report, error, credits, generate, reset };
}

// ══════════════════════════════════════════════════════════════════════════════
// useTransit
// ══════════════════════════════════════════════════════════════════════════════
export function useTransit(moonSign = 'Taurus') {
  const [transit, setTransit] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`av_transit_${moonSign}`)); } catch { return null; }
  });
  const [loading, setLoading] = useState(!transit);

  useEffect(() => {
    if (transit) return;
    setLoading(true);
    cosmicApi.transit(moonSign)
      .then(res => {
        setTransit(res.transit);
        sessionStorage.setItem(`av_transit_${moonSign}`, JSON.stringify(res.transit));
      })
      .catch(() => setTransit({
        message        : 'The cosmos hums with quiet purpose today. Trust your intuitive compass.',
        moon_phase     : 'Waxing Gibbous',
        ruling_planet  : 'Jupiter',
        power_color    : 'Royal Blue',
        lucky_number   : 7,
        affirmation    : 'I am aligned with cosmic abundance',
        avoid          : 'Impulsive decisions',
        best_time      : 'Morning hours',
      }))
      .finally(() => setLoading(false));
  }, [moonSign]);

  return { transit, loading };
}

// ══════════════════════════════════════════════════════════════════════════════
// useRemedies
// ══════════════════════════════════════════════════════════════════════════════
export function useRemedies() {
  const [data,    setData   ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const fetch = useCallback(async ({ lagna, issues }) => {
    setLoading(true); setError(null);
    try {
      const res = await cosmicApi.remedies({ lagna, issues });
      setData(res.remedies);
      return res.remedies;
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  return { data, loading, error, fetch };
}

// ══════════════════════════════════════════════════════════════════════════════
// useClickOutside  (utility)
// ══════════════════════════════════════════════════════════════════════════════
export function useClickOutside(callback) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
}
