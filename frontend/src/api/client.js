// frontend/src/api/client.js
// ─── Base HTTP client with auth injection & token refresh ────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Token store (in-memory; persisted to localStorage)
const tokens = {
  get access()  { return localStorage.getItem('av_access_token'); },
  get refresh() { return localStorage.getItem('av_refresh_token'); },
  set(access, refresh) {
    if (access)  localStorage.setItem('av_access_token',  access);
    if (refresh) localStorage.setItem('av_refresh_token', refresh);
  },
  clear() {
    localStorage.removeItem('av_access_token');
    localStorage.removeItem('av_refresh_token');
  },
};

let isRefreshing   = false;
let refreshQueue   = [];   // pending requests while refreshing

async function attemptTokenRefresh() {
  const rt = tokens.refresh;
  if (!rt) throw new Error('No refresh token');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) { tokens.clear(); throw new Error('Session expired'); }
  const data = await res.json();
  tokens.set(data.tokens.accessToken, data.tokens.refreshToken);
  return data.tokens.accessToken;
}

/**
 * Core request function.
 * @param {string} path  - e.g. '/auth/login'
 * @param {object} opts  - fetch options + { body } (auto JSON-stringified)
 */
async function request(path, opts = {}) {
  const { body, headers: extraHeaders = {}, ...rest } = opts;

  const buildHeaders = (accessToken) => ({
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extraHeaders,
  });

  const buildBody = () =>
    body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  // ── First attempt ───────────────────────────────────────────────────────────
  let res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers : buildHeaders(tokens.access),
    body    : buildBody(),
  });

  // ── 401 → try token refresh ─────────────────────────────────────────────────
  if (res.status === 401 && tokens.refresh) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newAccess = await attemptTokenRefresh();
        isRefreshing = false;
        refreshQueue.forEach(fn => fn(newAccess));
        refreshQueue = [];

        // Retry original request with new token
        res = await fetch(`${BASE_URL}${path}`, {
          ...rest,
          headers : buildHeaders(newAccess),
          body    : buildBody(),
        });
      } catch (err) {
        isRefreshing = false;
        refreshQueue.forEach(fn => fn(null));
        refreshQueue = [];
        tokens.clear();
        window.dispatchEvent(new CustomEvent('av:session-expired'));
        throw err;
      }
    } else {
      // Queue requests that arrive while refresh is in progress
      await new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(new Error('Session expired'));
          resolve(newToken);
        });
      }).then(async (newToken) => {
        res = await fetch(`${BASE_URL}${path}`, {
          ...rest,
          headers : buildHeaders(newToken),
          body    : buildBody(),
        });
      });
    }
  }

  // ── Parse response ──────────────────────────────────────────────────────────
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.code   = data?.code;
    err.data   = data;
    throw err;
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────────────────────
export const http = {
  get   : (path, opts)    => request(path, { method: 'GET',    ...opts }),
  post  : (path, body, o) => request(path, { method: 'POST',   body, ...o }),
  patch : (path, body, o) => request(path, { method: 'PATCH',  body, ...o }),
  delete: (path, opts)    => request(path, { method: 'DELETE', ...opts }),
  upload: (path, formData)=> request(path, { method: 'POST',   body: formData }),
};

export { tokens };
