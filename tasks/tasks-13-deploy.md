# Task 13 — Deploy (Vercel + Render Python + Managed Postgres)

## Goal

Ship full stack to free-tier infra. Production envs configured. CI builds
pass. Auth is own JWT (task-09); DB host is any managed Postgres with
PostGIS; cache is Upstash Redis (or unset for fall-through).

## Prereqs

- All prior tasks done
- GitHub repo created + pushed
- Postgres host picked (Render Postgres, Neon, self-hosted, etc.) with
  `postgis` + `pgcrypto` extensions enabled

## Steps

### 1. Database

Pick a managed Postgres provider. Requirements:

- PostGIS extension available
- `pgcrypto` extension available (for `gen_random_uuid()`)
- Optional: transaction-mode pooler URL for runtime

Provision steps (vendor-agnostic):

- Create database
- Enable extensions: `CREATE EXTENSION postgis; CREATE EXTENSION pgcrypto;`
- Capture two URLs:
  - `DATABASE_URL` — runtime DSN (pooler if available)
  - `DATABASE_URL_DIRECT` — direct DSN (no proxy; optional, falls back)
- Run `python -m scripts.migrate` against the direct URL once
  (or `psql $DATABASE_URL_DIRECT < server/app/db/schema.sql`)
- Verify: `\dt` shows tables, `\dx` shows postgis + pgcrypto

### 2. Backend (Render)

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
        sync: false              # runtime DSN (pooler if available)
      - key: DATABASE_URL_DIRECT
        sync: false              # direct DSN (migrations); optional, falls back
      - key: JWT_SECRET
        sync: false              # openssl rand -hex 32
      - key: JWT_ALGORITHM
        value: HS256
      - key: JWT_EXPIRES_SECONDS
        value: "604800"
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

### 3. Frontend (Vercel)

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
- Env vars: `VITE_API_URL` only

### 4. Cache (Upstash) — optional

- Create Redis at upstash.com, copy URL → Render env
- App degrades gracefully if unset (NullCache fallback in task-12)

### 5. Wire it up

- After deploy: set Render `FRONTEND_URL` = Vercel prod URL
- Set Vercel `VITE_API_URL` = Render prod URL (e.g., `https://territory-run-api.onrender.com`)
- Hit `<vercel-url>/`, sign up, run a session, verify cell appears in DB

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
- Sign up + login works end-to-end against prod Postgres
- Running a session (phone w/ real GPS) claims cells visible in prod DB
- No CORS errors in browser console
- CI green on PR

## Out of scope

- Custom domain — leave on `*.vercel.app` / `*.onrender.com` for MVP
- Monitoring (Sentry, etc.) — flag as follow-up
- Mobile app — out of MVP per CLAUDE.md roadmap Phase 4
- Render Python cold start (~30s on free tier) — accept; upgrade plan or warm-ping later
