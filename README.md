# AstroVision — Full-Stack Multi-Layer Multi-Model AI Platform

> Vedic astrology platform: AI-powered palm reading & Kundali generation  
> Stack: **Node.js/Express · SQLite · React · Vite · Anthropic AI (Sonnet 4 + Haiku 4.5)**

---

## Architecture Overview

```
astrovision/
├── backend/                        ← Express REST API
│   ├── server.js                   ← Entry: Helmet, CORS, rate-limit, routes
│   ├── .env.example                ← Environment template
│   ├── config/
│   │   └── database.js             ← SQLite singleton (better-sqlite3, WAL mode)
│   ├── schema/
│   │   └── schema.sql              ← Full DDL: 8 tables, indexes, triggers
│   ├── models/
│   │   └── index.js                ← DAOs: User, Profile, Report, Subscription, Session
│   ├── services/
│   │   ├── AIService.js            ← Base AI layer: model routing + usage logging
│   │   ├── PalmService.js          ← Palm analysis (Sonnet 4, vision)
│   │   ├── KundaliService.js       ← Kundali generation (Sonnet 4, deep reasoning)
│   │   └── TransitService.js       ← Daily transit + remedies (Haiku 4.5, cached)
│   ├── controllers/
│   │   └── index.js                ← palm, kundali, transit, profiles, reports
│   ├── routes/
│   │   └── index.js                ← All API routes with validation
│   └── middleware/
│       ├── auth.middleware.js       ← requireAuth / optionalAuth / requireAdmin
│       └── validate.middleware.js   ← Request validation, credit check, error handler
│
├── shared/
│   └── constants.js                ← Models, zodiac, planets, HTTP codes (CJS + ESM)
│
└── frontend/                       ← React + Vite SPA
    ├── vite.config.js              ← Dev proxy → localhost:4000
    ├── index.html
    └── src/
        ├── main.jsx                ← createRoot entry
        ├── index.css               ← Global tokens, animations, utilities
        ├── App.jsx                 ← Shell + Router (splash → auth → nav)
        ├── api/
        │   ├── client.js           ← Fetch wrapper: auth injection, token refresh, queue
        │   └── index.js            ← authApi, palmApi, kundaliApi, reportsApi, cosmicApi
        ├── store/
        │   └── AppContext.jsx      ← useReducer context: auth, reports, profiles, UI
        ├── hooks/
        │   └── index.js            ← useAuth, useReports, useProfiles, usePalm,
        │                              useKundali, useTransit, useRemedies
        ├── components/
        │   └── ui/index.jsx        ← 20+ atoms: Btn, Input, Card, Badge, Toast,
        │                              Stars, ZodiacLoader, ScanOverlay, ScoreBar…
        └── screens/
            ├── Auth/               ← Register / Login / SSO
            ├── Home/               ← Dashboard + live transit card
            ├── Palm/               ← 5-step flow: intro → capture → preview → AI → report
            ├── Kundali/            ← 4-step flow: method → form → loader → report
            └── Vault/              ← Report library + profile manager
```

---

## Database Schema  (8 tables)

| Table              | Purpose                                  |
|--------------------|------------------------------------------|
| `users`            | Auth, SSO provider, role                 |
| `user_sessions`    | Refresh token store (rotation)           |
| `profiles`         | Multi-profile per user (self, family)    |
| `reports`          | Palm & Kundali report storage            |
| `daily_transits`   | Haiku transit cache (date × moon_sign)   |
| `remedies`         | Haiku remedy cache (lagna × issues hash) |
| `ai_usage_logs`    | Per-call audit: tokens, duration, errors |
| `subscriptions`    | Plan, credits, billing (Stripe-ready)    |

---

## AI Model Strategy

| Feature              | Model                    | Why                          |
|----------------------|--------------------------|------------------------------|
| Palm reading (vision)| `claude-sonnet-4`        | Image understanding required |
| Kundali generation   | `claude-sonnet-4`        | Complex multi-field JSON     |
| Daily transit        | `claude-haiku-4.5`       | Fast, cached by date+sign    |
| Remedy advisor       | `claude-haiku-4.5`       | Quick, cached by issues hash |

---

## API Endpoints

```
POST   /api/auth/register          Register with email/password
POST   /api/auth/login             Login → accessToken + refreshToken
POST   /api/auth/refresh           Rotate tokens
POST   /api/auth/logout            Revoke refresh token
GET    /api/auth/me                Current user + subscription

GET    /api/profiles               List user profiles
POST   /api/profiles               Create profile
PATCH  /api/profiles/:uuid         Update profile
DELETE /api/profiles/:uuid         Delete profile
PATCH  /api/profiles/:uuid/default Set as default

POST   /api/palm/analyze           Analyse palm (multipart or base64)
POST   /api/kundali/generate       Generate birth chart

GET    /api/cosmic/transit         Daily transit (cached, optional auth)
POST   /api/cosmic/remedies        Personalised remedies (cached)

GET    /api/reports                List reports (filter by type, paginate)
GET    /api/reports/:uuid          Get single report
PATCH  /api/reports/:uuid/star     Toggle star
DELETE /api/reports/:uuid          Delete report

GET    /api/health                 Health check
```

---

## Quick Start

```bash
# 1. Clone & install
git clone <repo>
cd astrovision
npm install

# 2. Configure backend
cd backend
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Initialise database
npm run db:init

# 4. Start dev servers (both concurrently)
cd ..
npm run dev

# Backend → http://localhost:4000
# Frontend → http://localhost:5173
```

---

## Security Features

- **Helmet** — sets secure HTTP headers
- **CORS** — locked to `FRONTEND_URL`
- **Rate limiting** — global (100/15min) + AI-specific (20/15min)
- **JWT** — short-lived access tokens (15min) + rotating refresh tokens (30d)
- **bcrypt** — password hashing (cost factor 12)
- **SQLite WAL** — safe concurrent reads
- **Credit system** — prevents AI abuse per user plan

---

## Layer Summary

```
L0  Schema    · SQL DDL — 8 tables, triggers, indexes
L1  Config    · DB singleton, shared constants (CJS + ESM)
L2  Models    · DAO layer — all SQL queries
L3  Services  · AI orchestration — PalmService, KundaliService, TransitService
L4  Middleware · Auth, validation, credits, errors
L5  Controllers· Business logic per feature domain
L6  Routes    · Express router — all endpoints with validation
L7  API Client · Frontend fetch wrapper — auth injection, token refresh
L8  State     · useReducer context — auth, reports, profiles, UI
L9  Hooks     · Domain hooks — usePalm, useKundali, useTransit, useRemedies
L10 Components · Atoms/molecules — 20+ reusable UI components
L11 Screens   · Feature modules — Auth, Home, Palm, Kundali, Vault
L12 Shell     · App router, splash, nav, toast
```
