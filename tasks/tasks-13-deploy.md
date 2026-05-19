# Task 13 — Deploy (Vercel + Render Python + Supabase)

## Goal

Ship full stack to free-tier infra per CLAUDE.md § Free Deployment Guide. Production envs configured. CI builds pass.

## Prereqs

- All prior tasks done
- GitHub repo created + pushed

## Steps

### 1. Database + Auth + Realtime (Supabase)

- Project already created in task 09 (used for auth)
- Enable PostGIS: dashboard → Database → Extensions → enable `postgis` and `pgcrypto`
- Copy connection strings from dashboard → Settings → Database:
  - **Pooled / transaction-mode** (port `6543`) → `DATABASE_URL` (app runtime)
  - **Direct** (port `5432`) → `DATABASE_URL_DIRECT` (migrations only)
- Copy prod project URL + anon key + JWT secret (Settings → API)
- Run `python -m scripts.migrate` against prod direct URL once (or `psql $DATABASE_URL_DIRECT < server/app/db/schema.sql`)
- Verify: `\dt` shows tables, `\dx` shows postgis + pgcrypto
- Verify Realtime publication includes `claimed_cells`: dashboard → Database → Replication

### 3. Backend (Render)

`render.yaml` in repo root:

```yaml
services:
  - type: web
    name: territory-run-api
    runtime: python
    rootDir: server
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    pythonVersion: "3.13"
    envVars:
      - key: DATABASE_URL
        sync: false              # Supabase pooled URL (port 6543)
      - key: DATABASE_URL_DIRECT
        sync: false              # Supabase direct URL (port 5432, for migrations)
      - key: JWT_SECRET
        sync: false              # openssl rand -hex 32
      - key: JWT_ALGORITHM
        value: HS256
      - key: JWT_EXPIRES_SECONDS
        value: "604800"
      - key: SUPABASE_URL
        sync: false              # optional, Realtime only
      - key: SUPABASE_ANON_KEY
        sync: false              # optional, Realtime only
      - key: REDIS_URL
        sync: false
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        sync: false
      - key: H3_RESOLUTION
        value: "9"
```

- Connect GitHub repo → Render auto-deploys on push to `main`
- Set `sync: false` env vars manually in Render dashboard

### 4. Frontend (Vercel)

`client/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- Import repo at vercel.com, root dir = `client`
- Env vars: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 5. Cache (Upstash) — optional

- Create Redis at upstash.com, copy URL → Render env
- App degrades gracefully if unset

### 6. Wire it up

- After deploy: set Render `FRONTEND_URL` = Vercel prod URL
- Set Vercel `VITE_API_URL` = Render prod URL (e.g., `https://territory-run-api.onrender.com`)
- Hit `<vercel-url>/`, sign up, run a session, verify cell appears in prod Supabase DB

## Files to create

| Path | Purpose |
|------|---------|
| `render.yaml` | Render blueprint (python runtime) |
| `client/vercel.json` | Vercel config |
| `server/runtime.txt` | `python-3.13.x` pin (Render auto-detects, but pin explicitly) |
| `.github/workflows/ci.yml` | (Optional) GH Actions: client `npm test` + server `pytest` on PR |
| `README.md` (repo root) | Quickstart (Python venv + npm) + architecture summary + links to tasks/ |

## ci.yml skeleton

```yaml
name: CI
on: [pull_request, push]
jobs:
  client:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: client } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run build
  server:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: server } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.13' }
      - run: pip install -r requirements.txt
      - run: pytest -v
```

## Acceptance

- Production Vercel URL serves landing + dashboard + battlefield + leaderboard
- Production API on Render returns 200 on `/health`
- Sign up + login works end-to-end against prod Supabase
- Running a session (phone w/ real GPS) claims cells visible in prod Supabase DB
- No CORS errors in browser console
- CI green on PR

## Out of scope

- Custom domain — leave on `*.vercel.app` / `*.onrender.com` for MVP
- Monitoring (Sentry, etc.) — flag as follow-up
- Mobile app — out of MVP per CLAUDE.md roadmap Phase 4
- Render Python cold start (~30s on free tier) — accept; upgrade plan or warm-ping later
