# Technology Context

## Component Structure

### Frontend (client/)
- **Path**: `client/`
- **Language**: JavaScript (JSX, ESM, `"type": "module"`)
- **Framework**: React 19.2 + react-router-dom 7 + Vite 8
- **Styling**: Tailwind CSS v3.4 (PostCSS + autoprefixer)
- **Maps**: maplibre-gl 5.24, h3-js 4.4
- **Test Directory**: `client/src/test/` and co-located `*.test.jsx` files
- **Test Framework**: Vitest 4 + @testing-library/react 16 + jsdom 29

### Backend (server/)
- **Path**: `server/`
- **Language**: Python 3.13
- **Framework**: FastAPI 0.136 on Starlette 1.0 + uvicorn 0.47 (uvloop + httptools)
- **Config**: pydantic-settings 2.14 (env-driven)
- **Logging**: structlog 25.5 (JSON)
- **Test Directory**: `server/tests/`
- **Test Framework**: pytest 9 + pytest-asyncio + httpx AsyncClient
- **Venv**: `server/.venv` (created via `make install`)

### Shared (planned)
- **Path**: `shared/` — not yet created. CLAUDE.md projects `shared/constants.js` for H3 resolution and game rules.

## Development Commands

### Frontend (`client/`)

```bash
# Install
npm install --prefix client

# Dev server (Vite, default :5173)
npm run dev --prefix client

# Build
npm run build --prefix client

# Lint
npm run lint --prefix client

# Test (single run)
npm test --prefix client

# Test (watch)
npm run test:watch --prefix client
```

### Backend (`server/`)

```bash
# First-time install (creates venv + installs deps)
make -C server install

# Dev server (:8000, --reload)
make -C server dev

# Test
make -C server test

# Freeze deps
make -C server freeze

# Direct pytest (after venv active)
server/.venv/bin/pytest -v
```

## Test Execution Strategy

- Run frontend tests from `client/` (vitest picks up `*.test.jsx` co-located + `src/test/`).
- Run backend tests from `server/` (pytest discovers `tests/` per `pytest.ini`).
- Integration tests with real DB (planned task-08+) will need `DATABASE_URL_DIRECT` against Supabase or local Postgres+PostGIS.
- No CI configured yet (no `.github/workflows/`).

## Environment Variables

### Backend (`server/.env`, loaded via pydantic-settings)
- `DATABASE_URL` — Supabase pooled (port 6543, transaction mode) — required at runtime
- `DATABASE_URL_DIRECT` — Supabase direct (port 5432) — migrations only
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
- `REDIS_URL` — Upstash (optional)
- `H3_RESOLUTION` — default 9
- `LOG_LEVEL`, `LOG_FORMAT`, `LOG_OUTPUT`
- CORS origins (allow `http://localhost:5173` in dev)

### Frontend (`client/.env`, Vite-prefixed)
- `VITE_API_URL`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPTILER_KEY` (optional; defaults to OSM raster tiles)

See `.env.example` at repo root for canonical reference.

## Technology Stack

### Runtime Environment
- **Node.js**: 18+ (frontend)
- **Python**: 3.13 (backend; venv-pinned in `server/Makefile`)
- **Container**: none (free-tier deploy uses managed PaaS)

### Languages & Frameworks
- React 19.2.6, react-dom 19.2.6, react-router-dom 7.15
- FastAPI 0.136.1, Starlette 1.0, pydantic 2.13, pydantic-settings 2.14
- structlog 25.5 (JSON log pipeline)

### Data Layer (planned — task-08 onward)
- **Primary DB**: Supabase Postgres (free tier 500MB) + PostGIS + pgcrypto extensions
- **H3 indexing**: app-side via `h3-py` (Python) and `h3-js` (browser)
- **Cache**: Upstash Redis (free tier 10K cmd/day) — leaderboard + hot territory
- **Driver**: `asyncpg` (planned) against PgBouncer-pooled URL

### API & Communication
- REST over HTTPS (FastAPI). Route prefixes per CLAUDE.md: `/auth`, `/runs`, `/territory`, `/leaderboard`, `/health`.
- Realtime: Supabase Realtime (Postgres CDC on `claimed_cells`) with 30s polling fallback.

### Infrastructure & Deployment
- **Frontend**: Vercel (free, Vite preset)
- **Backend**: Render Web Service (free, 750 hrs/mo; Python 3 runtime; `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir server`)
- **DB/Auth/Realtime**: Supabase (free tier)
- **CI/CD**: none configured yet

### Development Tools
- **FE build**: Vite 8 + `@vitejs/plugin-react` 6
- **FE lint**: ESLint 10 + `eslint-plugin-react-hooks` 7 + `eslint-plugin-react-refresh` 0.5
- **BE deps**: pinned in `server/requirements.txt` (freeze via `make freeze`)
- **No type checker** on FE (JSX, not TS); pydantic provides runtime validation on BE.

### External Services
- Supabase (DB + Auth + Realtime) — credentials via env vars
- Upstash Redis — `REDIS_URL`
- MapTiler — optional `VITE_MAPTILER_KEY`; default tiles from OpenStreetMap raster

## Recent Technology Changes

### 2026-05-17 — DB swap to Supabase, drop Neon + Ably
- **What**: Replaced Neon Postgres + Ably realtime with Supabase Postgres + Supabase Realtime.
- **Reason**: Single-vendor consolidation (DB + Auth + Realtime in one free-tier project).
- **Impact**: New env vars (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `SUPABASE_*`). Polling fallback retained.

### 2026-05-17 — Backend bootstrapped on FastAPI + Python 3.13
- **What**: `server/` scaffolded (task-07). FastAPI + structlog + pydantic-settings, healthcheck router, CORS middleware, 6/6 pytest pass.
- **Reason**: Pin Python 3.13 to match Render runtime; `make install` ensures reproducible venv.
