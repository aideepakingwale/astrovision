// frontend/src/store/AppContext.jsx
// ─── Single source of truth for all app state ────────────────────────────────

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { authApi }     from '../api/index.js';
import { tokens }      from '../api/client.js';

// ── Initial State ─────────────────────────────────────────────────────────────
const INITIAL = {
  // Auth
  user         : null,
  subscription : null,
  authStatus   : 'idle',   // idle | loading | authenticated | unauthenticated

  // Reports (client-side cache)
  reports      : [],
  reportsTotal : 0,
  reportsStatus: 'idle',   // idle | loading | loaded | error

  // Profiles
  profiles     : [],
  activeProfileId: null,

  // Settings (persisted to localStorage)
  settings: {
    chartStyle   : 'south',
    darkMode     : true,
    notifications: true,
    haptics      : true,
  },

  // UI
  toast  : null,
  screen : 'home',         // nav screen
  modal  : null,           // open modal name
};

// ── Action Types ──────────────────────────────────────────────────────────────
const A = {
  SET_AUTH         : 'SET_AUTH',
  SET_SUBSCRIPTION : 'SET_SUBSCRIPTION',
  AUTH_STATUS      : 'AUTH_STATUS',
  SET_REPORTS      : 'SET_REPORTS',
  ADD_REPORT       : 'ADD_REPORT',
  REMOVE_REPORT    : 'REMOVE_REPORT',
  STAR_REPORT      : 'STAR_REPORT',
  SET_PROFILES     : 'SET_PROFILES',
  SET_ACTIVE_PROFILE:'SET_ACTIVE_PROFILE',
  ADD_PROFILE      : 'ADD_PROFILE',
  UPDATE_PROFILE   : 'UPDATE_PROFILE',
  REMOVE_PROFILE   : 'REMOVE_PROFILE',
  SET_SETTING      : 'SET_SETTING',
  SHOW_TOAST       : 'SHOW_TOAST',
  HIDE_TOAST       : 'HIDE_TOAST',
  SET_SCREEN       : 'SET_SCREEN',
  SET_MODAL        : 'SET_MODAL',
  LOGOUT           : 'LOGOUT',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    case A.SET_AUTH:
      return { ...state, user: payload, authStatus: payload ? 'authenticated' : 'unauthenticated' };
    case A.SET_SUBSCRIPTION:
      return { ...state, subscription: payload };
    case A.AUTH_STATUS:
      return { ...state, authStatus: payload };
    case A.SET_REPORTS:
      return { ...state, reports: payload.reports, reportsTotal: payload.total, reportsStatus: 'loaded' };
    case A.ADD_REPORT:
      return { ...state, reports: [payload, ...state.reports], reportsTotal: state.reportsTotal + 1 };
    case A.REMOVE_REPORT:
      return { ...state, reports: state.reports.filter(r => r.uuid !== payload), reportsTotal: state.reportsTotal - 1 };
    case A.STAR_REPORT:
      return { ...state, reports: state.reports.map(r => r.uuid === payload.uuid ? { ...r, is_starred: payload.starred } : r) };
    case A.SET_PROFILES:
      return { ...state, profiles: payload };
    case A.SET_ACTIVE_PROFILE:
      return { ...state, activeProfileId: payload };
    case A.ADD_PROFILE:
      return { ...state, profiles: [...state.profiles, payload] };
    case A.UPDATE_PROFILE:
      return { ...state, profiles: state.profiles.map(p => p.uuid === payload.uuid ? payload : p) };
    case A.REMOVE_PROFILE:
      return { ...state, profiles: state.profiles.filter(p => p.uuid !== payload) };
    case A.SET_SETTING:
      return { ...state, settings: { ...state.settings, [payload.key]: payload.value } };
    case A.SHOW_TOAST:
      return { ...state, toast: { message: payload.message, variant: payload.variant || 'gold' } };
    case A.HIDE_TOAST:
      return { ...state, toast: null };
    case A.SET_SCREEN:
      return { ...state, screen: payload };
    case A.SET_MODAL:
      return { ...state, modal: payload };
    case A.LOGOUT:
      return { ...INITIAL, authStatus: 'unauthenticated', settings: state.settings };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL, init => {
    // Rehydrate settings from localStorage
    try {
      const saved = localStorage.getItem('av_settings_v3');
      return saved ? { ...init, settings: { ...init.settings, ...JSON.parse(saved) } } : init;
    } catch { return init; }
  });

  // ── Bootstrap: restore session ─────────────────────────────────────────────
  useEffect(() => {
    if (!tokens.access && !tokens.refresh) {
      dispatch({ type: A.AUTH_STATUS, payload: 'unauthenticated' });
      return;
    }
    dispatch({ type: A.AUTH_STATUS, payload: 'loading' });
    authApi.me()
      .then(data => {
        dispatch({ type: A.SET_AUTH,         payload: data.user });
        dispatch({ type: A.SET_SUBSCRIPTION, payload: data.subscription });
      })
      .catch(() => {
        tokens.clear();
        dispatch({ type: A.AUTH_STATUS, payload: 'unauthenticated' });
      });
  }, []);

  // ── Session expired event ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => dispatch({ type: A.LOGOUT });
    window.addEventListener('av:session-expired', handler);
    return () => window.removeEventListener('av:session-expired', handler);
  }, []);

  // ── Persist settings ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('av_settings_v3', JSON.stringify(state.settings));
  }, [state.settings]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const actions = {
    // Auth
    setAuth        : useCallback((user, sub) => {
      dispatch({ type: A.SET_AUTH,         payload: user });
      dispatch({ type: A.SET_SUBSCRIPTION, payload: sub  });
    }, []),
    logout         : useCallback(async () => {
      await authApi.logout(tokens.refresh);
      dispatch({ type: A.LOGOUT });
    }, []),

    // Reports
    setReports     : useCallback((data) => dispatch({ type: A.SET_REPORTS,   payload: data }), []),
    addReport      : useCallback((r)    => dispatch({ type: A.ADD_REPORT,    payload: r    }), []),
    removeReport   : useCallback((uuid) => dispatch({ type: A.REMOVE_REPORT, payload: uuid }), []),
    starReport     : useCallback((uuid, starred) => dispatch({ type: A.STAR_REPORT, payload: { uuid, starred } }), []),

    // Profiles
    setProfiles    : useCallback((ps)   => dispatch({ type: A.SET_PROFILES,    payload: ps   }), []),
    setActiveProfile:(id)               => dispatch({ type: A.SET_ACTIVE_PROFILE, payload: id }),
    addProfile     : useCallback((p)    => dispatch({ type: A.ADD_PROFILE,     payload: p    }), []),
    updateProfile  : useCallback((p)    => dispatch({ type: A.UPDATE_PROFILE,  payload: p    }), []),
    removeProfile  : useCallback((uuid) => dispatch({ type: A.REMOVE_PROFILE,  payload: uuid }), []),

    // Settings
    setSetting     : useCallback((key, value) => dispatch({ type: A.SET_SETTING, payload: { key, value } }), []),

    // UI
    showToast      : useCallback((message, variant = 'gold') => {
      dispatch({ type: A.SHOW_TOAST, payload: { message, variant } });
      setTimeout(() => dispatch({ type: A.HIDE_TOAST }), 3000);
    }, []),
    setScreen      : useCallback((s) => dispatch({ type: A.SET_SCREEN, payload: s }), []),
    openModal      : useCallback((m) => dispatch({ type: A.SET_MODAL,  payload: m }), []),
    closeModal     : useCallback(()  => dispatch({ type: A.SET_MODAL,  payload: null }), []),
  };

  // Derived helpers
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId) || state.profiles.find(p => p.is_default) || state.profiles[0];

  return (
    <Ctx.Provider value={{ ...state, ...actions, activeProfile }}>
      {children}
    </Ctx.Provider>
  );
}
