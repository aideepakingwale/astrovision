// frontend/src/api/auth.api.js
import { http, tokens } from './client.js';

export const authApi = {
  register : (data)          => http.post('/auth/register', data),
  login    : async (data)    => {
    const res = await http.post('/auth/login', data);
    if (res.tokens) tokens.set(res.tokens.accessToken, res.tokens.refreshToken);
    return res;
  },
  logout   : async (refreshToken) => {
    await http.post('/auth/logout', { refreshToken }).catch(() => {});
    tokens.clear();
  },
  refresh  : ()              => http.post('/auth/refresh', { refreshToken: tokens.refresh }),
  me       : ()              => http.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/api/palm.api.js
import { http as _http } from './client.js';

export const palmApi = {
  /** @param {File|null} imageFile  @param {string|null} profileId */
  analyze(imageFile, profileId = null) {
    if (imageFile) {
      const fd = new FormData();
      fd.append('image', imageFile);
      if (profileId) fd.append('profileId', profileId);
      return _http.upload('/palm/analyze', fd);
    }
    return _http.post('/palm/analyze', { profileId });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/api/kundali.api.js
import { http as _h } from './client.js';

export const kundaliApi = {
  generate: (data) => _h.post('/kundali/generate', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/api/reports.api.js
import { http as _r } from './client.js';

export const reportsApi = {
  list  : (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return _r.get(`/reports${qs ? `?${qs}` : ''}`);
  },
  get    : (uuid)       => _r.get(`/reports/${uuid}`),
  star   : (uuid)       => _r.patch(`/reports/${uuid}/star`),
  remove : (uuid)       => _r.delete(`/reports/${uuid}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/api/cosmic.api.js
import { http as _c } from './client.js';

export const cosmicApi = {
  transit  : (moonSign) => _c.get(`/cosmic/transit?moonSign=${encodeURIComponent(moonSign)}`),
  remedies : (data)     => _c.post('/cosmic/remedies', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/api/profiles.api.js
import { http as _p } from './client.js';

export const profilesApi = {
  list      : ()          => _p.get('/profiles'),
  create    : (data)      => _p.post('/profiles', data),
  update    : (uuid, data)=> _p.patch(`/profiles/${uuid}`, data),
  remove    : (uuid)      => _p.delete(`/profiles/${uuid}`),
  setDefault: (uuid)      => _p.patch(`/profiles/${uuid}/default`),
};
