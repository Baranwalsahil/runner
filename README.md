# Territory Run

GPS-based territory game. Run through real-world hexagonal cells to claim them. Compete for map dominance. Hex grid via Uber's H3 (resolution 9, ~100m wide). Real-time, persistent, multiplayer.

> Full design doc: [`CLAUDE.md`](./CLAUDE.md)
> Implementation plan: [`tasks/`](./tasks/)
> Live progress: [`progress.md`](./progress.md)

---

## Stack

### Frontend (`client/`)

- Vite 8 + React 19
- Tailwind v3 (locked, `darkMode: "class"`)
- React Router v7
- MapLibre GL JS + h3-js
- Vitest 4 + @testing-library/react + jsdom

### Backend (`server/`)

- Python 3.12+
- FastAPI + uvicorn
- asyncpg (Postgres + PostGIS)
- pydantic v2 + pydantic-settings
- python-jose (Supabase JWT, HS256)
- h3 (h3-py 4.x)
- redis.asyncio (Upstash; null-safe fallback)
- pytest + pytest-asyncio + httpx + fakeredis

### Infra

- DB: Neon (free Postgres + PostGIS)
- Auth: Supabase (email/password)
- Cache: Upstash Redis (optional, graceful degrade)
- API hosting: Render (Python runtime, free tier)
- FE hosting: Vercel

---

## Project structure

```
runner/
├── CLAUDE.md                   # design doc + workflow rules
├── README.md                   # this file
├── progress.md                 # live task status tracker
├── .claude/agents/             # project-local subagents
│   ├── territory-run-frontend.md
│   └── territory-run-backend.md
├── tasks/                      # 13 sequenced task briefs
│   └── tasks-NN-*.md
├── stitch_territory_runner/    # Stitch HTML/PNG design refs (do not edit)
├── client/                     # Vite + React frontend (tasks 01-06 done)
│   ├── src/
│   │   ├── routes/             # Landing, Dashboard, Battlefield, Leaderboard
│   │   ├── components/         # Icon, TopNavBar, AlertBar, Footer, Fab, AppLayout
│   │   ├── components/landing/      # Hero, FeatureGrid, MapPreview, CtaBanner
│   │   ├── components/dashboard/    # TerritoryDominance, QuickRunStats, TerritoryMapPreview, RecentBattlesFeed
│   │   ├── components/battlefield/  # MapCanvas, MapHud, CellDetailPanel, PlayersOnline
│   │   ├── components/leaderboard/  # Podium, RankTable, FilterChips
│   │   ├── lib/                # h3Utils, mapStyle
│   │   ├── data/               # mockCells, mockLeaderboard
│   │   └── test/               # vitest suite (136/136)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── server/                     # FastAPI backend (tasks 07-13 pending)
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── deps.py
    │   ├── routers/            # health, auth, runs, territory, leaderboard
    │   ├── services/           # h3_service, gps_filter, run_service, ...
    │   ├── schemas/            # pydantic models
    │   ├── db/pool.py          # asyncpg singleton
    │   └── cache/              # redis_client + leaderboard_cache + territory_cache
    ├── migrations/001_init.sql
    ├── scripts/migrate.py
    ├── tests/                  # pytest suite
    ├── requirements.txt
    └── runtime.txt             # python-3.12.x for Render
```

---

## Getting started

### Prereqs

- Node 20+
- Python 3.12+
- Postgres 14+ with PostGIS (or `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis`)
- Optional: Redis (`docker run -p 6379:6379 redis`)
- Supabase project (free tier) — copy URL, anon key, JWT secret
- Neon project for cloud Postgres (or local docker)

### Clone

```bash
git clone https://github.com/Baranwalsahil/runner.git
cd runner
cp .env.example .env  # fill in DATABASE_URL, SUPABASE_*, etc.
```

### Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:5173
npm test             # vitest
npm run build        # production bundle to dist/
```

### Backend

```bash
cd server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.migrate          # apply DB schema
uvicorn app.main:app --reload --port 8000
pytest -v
```

### Wire FE → BE

In `client/.env`:

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Task roadmap

Tasks run **strictly in order**. Each is a self-contained brief with goal, install commands, files to create, and acceptance criteria.

| # | Layer | Title | Status |
|---|-------|-------|--------|
| 01 | FE | Frontend scaffold (Vite + Tailwind theme) | ✅ |
| 02 | FE | Shared layout (TopNav, AlertBar, Footer, FAB) + router | ✅ |
| 03 | FE | Landing page | ✅ |
| 04 | FE | Player dashboard | ✅ |
| 05 | FE | Battlefield map (MapLibre + h3-js) | ✅ |
| 06 | FE | Global leaderboard | ✅ |
| 07 | BE | Backend scaffold (FastAPI, env, healthcheck) | ⏳ |
| 08 | DB | Postgres + PostGIS schema + migrations | ⏳ |
| 09 | Auth | Supabase auth (FE + BE JWT verify) | ⏳ |
| 10 | BE | Runs ingest → H3 claim → DB upsert | ⏳ |
| 11 | BE | Territory + Leaderboard GET endpoints | ⏳ |
| 12 | Infra | Redis cache + polling/real-time updates | ⏳ |
| 13 | DevOps | Vercel + Render + Neon + Supabase deploy | ⏳ |

Source: [`tasks/tasks-00-index.md`](./tasks/tasks-00-index.md). Live status: [`progress.md`](./progress.md).

---

## Workflow

When asked **"implement tasks list in folder tasks"** (or "continue tasks", "resume tasks"):

1. Read all task files in `tasks/`
2. Update `progress.md` — status: `running` / `paused` / `complete`
3. On new session: read `progress.md` first, resume incomplete task by checking actual code state
4. Reconcile stale entries before continuing

Full rule: [`CLAUDE.md` § Workflow](./CLAUDE.md#workflow-tasks-folder--progressmd-resumable-execution).

---

## Subagents

Project-local agents at `.claude/agents/`:

- **`territory-run-frontend`** — owns `client/`. Knows Vite + React + Tailwind v3 + react-router + maplibre + h3-js + Vitest. Refuses backend work.
- **`territory-run-backend`** — owns `server/`. Knows FastAPI + asyncpg + pydantic + h3-py + python-jose + redis.asyncio + pytest. Refuses frontend work.

Invoke via the `Agent` tool with `subagent_type: "territory-run-frontend"` or `"territory-run-backend"`. Agents load at session start; restart Claude Code after editing agent files to pick up changes.

---

## Game mechanics

### Territory acquisition

- Run with GPS → trace converted to H3 cells (res 9, ~100m hexes)
- First runner through a cell owns it
- Running through someone else's cell steals it (`claim_count++`)
- Active anti-cheat: max 4h runs, max 12 m/s segment speed, accuracy filter > 50m, 2000-cell cap

### Hex math

- H3 resolution 9 → ~0.11 km² per cell, ~174m edge
- Server uses `h3.polygon_to_cells(bounds_polygon, 9)` for bbox queries
- Client uses `h3-js cellToBoundary` for GeoJSON rendering

### Scoring

- Primary: total cells owned (`users.total_cells`)
- Leaderboard: `ZSET leaderboard:global` (member=user_id, score=cells), updated on every claim
- Tie-break: recency (`claimed_at DESC`)

---

## API contract (tasks 09-11)

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| GET | `/health` | no | — | `{status, uptime, version}` |
| POST | `/auth/sync-profile` | yes | `{username}` | local user row |
| GET | `/auth/me` | yes | — | local user row |
| POST | `/runs` | yes | `{gps_trace, started_at, ended_at}` | `{run_id, cells_claimed, new_total}` |
| GET | `/runs` | yes | — | list of run summaries |
| GET | `/runs/{id}` | yes | — | run detail |
| GET | `/territory` | yes | `?bounds=sw_lat,sw_lng,ne_lat,ne_lng` | `[{h3_index, user_id, username, color}, ...]` |
| GET | `/territory/user/{id}` | yes | — | cells owned by user |
| GET | `/territory/stats` | yes | — | `{total_cells, top_region, contested}` |
| GET | `/leaderboard` | yes | `?limit&offset&period&region` | `[{user_id, username, total_cells, rank}, ...]` |
| GET | `/leaderboard/nearby` | yes | — | ±5 around current user |

---

## Deploy

See [`tasks/tasks-13-deploy.md`](./tasks/tasks-13-deploy.md) for full step-by-step.

TL;DR:

1. Neon → create Postgres, run schema
2. Supabase → already wired (task 09)
3. Render → connect GitHub, `render.yaml` blueprint, set env vars
4. Vercel → import repo, root = `client/`, set `VITE_*` envs
5. Upstash Redis → optional, set `REDIS_URL` in Render
6. Cross-wire `FRONTEND_URL` (Render) and `VITE_API_URL` (Vercel)

Free-tier limits: 100GB Vercel bandwidth, 750h Render, 512MB Neon, 50K Supabase MAU, 10K Upstash cmds/day.

---

## Status

Frontend complete (tasks 01-06): 136/136 Vitest passing, dev server verified on `:5173`. Backend pending (tasks 07-13). No production deploy yet.

---

## License

MIT — see [`CLAUDE.md` § License](./CLAUDE.md#license).
