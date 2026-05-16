# Task 13 — Deploy (Vercel + Render + Neon + Supabase)

## Goal

Ship full stack to free-tier infra per claude.md § Free Deployment Guide. Production envs configured. CI builds pass.

## Prereqs

- All prior tasks done
- GitHub repo created + pushed

## Steps

### 1. Database (Neon)

- Create project at [neon.tech](https://neon.tech)
- Run `psql $DATABASE_URL < server/db/schema.sql`
- Verify: `\dt` shows tables

### 2. Auth (Supabase)

- Already created in task 09
- Copy prod URL + anon key

### 3. Backend (Render)

`render.yaml` in repo root:

```yaml
services:
  - type: web
    name: territory-run-api
    runtime: node
    rootDir: server
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: REDIS_URL
        sync: false
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        sync: false
```

- Connect GitHub repo → Render auto-deploys on push to `main`

### 4. Frontend (Vercel)

`vercel.json` in `client/`:

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

### 6. Wire it up

- After deploy, set Render `FRONTEND_URL` = Vercel prod URL
- Set Vercel `VITE_API_URL` = Render prod URL
- Hit `<vercel-url>/`, sign up, run a session, verify cell appears

## Files to create

| Path | Purpose |
|------|---------|
| `render.yaml` | Render blueprint |
| `client/vercel.json` | Vercel config |
| `.github/workflows/ci.yml` | (Optional) GH Actions: lint + build on PR |
| `README.md` (repo root) | Quickstart + architecture summary + links to tasks/ |

## Acceptance

- Production Vercel URL serves landing + dashboard + battlefield + leaderboard
- Production API on Render returns 200 on `/health`
- Sign up + login works end-to-end against prod Supabase
- Running a session (use phone w/ real GPS) claims cells visible in prod Neon DB
- No CORS errors in browser console

## Out of scope

- Custom domain — leave on `*.vercel.app` / `*.onrender.com` for MVP
- Monitoring (Sentry, etc.) — flag as follow-up
- Mobile app — out of MVP per claude.md roadmap Phase 4
