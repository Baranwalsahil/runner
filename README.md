# Territory Run

GPS-based territory game. Run through real-world hexagonal cells to claim them. Compete for map dominance. Hex grid via Uber's H3 (resolution 9, ~100m wide).

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

- Python 3.13
- FastAPI + uvicorn
- asyncpg (Postgres + PostGIS)
- pydantic v2 + pydantic-settings
- python-jose (own HS256 JWT) + bcrypt (password hash)
- h3 (h3-py 4.x)
- redis.asyncio (NullCache fallback when `REDIS_URL` unset)
- pytest + pytest-asyncio + httpx + fakeredis

### Infra

- DB: any managed Postgres + PostGIS (host deferred — local dev = docker postgis)
- Cache: Redis (optional; app degrades gracefully)
- Auth: self-hosted JWT, no third-party IdP
- Realtime: poll-based (territory 15s, leaderboard 30s, paused on tab hidden) — no WebSocket / CDC at MVP

---

## Project structure

```
runner/
├── CLAUDE.md                   # design doc + workflow rules
├── README.md                   # this file
├── progress.md                 # live task status tracker
├── compose.yml                 # local dev stack (db + redis + migrate + server + client)
├── .claude/agents/             # project-local subagents
├── tasks/                      # 13 sequenced task briefs
├── stitch_territory_runner/    # Stitch HTML/PNG design refs (do not edit)
├── shared/                     # H3_RESOLUTION, OWNER_PALETTE, GPS thresholds (.py + .js)
├── client/                     # Vite + React frontend
│   ├── Dockerfile
│   ├── src/
│   │   ├── routes/             # Landing, Auth, Dashboard, Battlefield, Leaderboard, Run
│   │   ├── components/         # Icon, TopNavBar, AlertBar, Footer, Fab, AppLayout, auth/, run/
│   │   ├── components/landing/      # Hero, FeatureGrid, MapPreview, CtaBanner
│   │   ├── components/dashboard/    # TerritoryDominance, QuickRunStats, TerritoryMapPreview, RecentBattlesFeed
│   │   ├── components/battlefield/  # MapCanvas, MapHud, CellDetailPanel, PlayersOnline
│   │   ├── components/leaderboard/  # Podium, RankTable, FilterChips
│   │   ├── hooks/              # useAuth, useGeolocation, usePolling, useTerritoryPolling, useLeaderboardPolling
│   │   ├── lib/                # auth.js, api.js, h3Utils, mapStyle
│   │   └── test/               # vitest suite
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── server/                     # FastAPI backend
    ├── Dockerfile
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── constants.py        # mirrors shared/constants.py
    │   ├── deps.py             # get_db_pool, get_cache_client, get_current_user
    │   ├── routers/            # health, auth, runs, territory, leaderboard
    │   ├── services/           # auth_service, user_service, h3_service, gps_filter, run_service, territory_service, leaderboard_service, color
    │   ├── schemas/            # auth, run, territory, leaderboard
    │   ├── db/pool.py          # asyncpg singleton
    │   └── cache/              # redis_client, leaderboard_cache, territory_cache
    ├── migrations/001_init.sql
    ├── scripts/migrate.py
    ├── tests/                  # pytest suite
    └── requirements.txt
```

---

## Quickstart — Docker Compose (recommended)

One command brings up the whole stack: postgis + redis + FastAPI + Vite, wired together.

### Prereqs

- Docker + Docker Compose v2 (`docker compose version`)

### Run

```bash
git clone https://github.com/Baranwalsahil/runner.git
cd runner

docker compose build           # first time only (~3-5 min)
docker compose up              # foreground, all logs
# or
docker compose up -d           # detached
docker compose logs -f         # tail
```

### Services + ports

| Service  | Image / build            | Port  | Notes |
|----------|--------------------------|-------|-------|
| `db`     | `postgis/postgis:16-3.4` | 5432  | user/pw=postgres, db=territory_run; persisted in volume `db_data` |
| `redis`  | `redis:7-alpine`         | 6379  | ephemeral |
| `migrate`| builds `./server`        | —     | runs `python -m scripts.migrate` once, then exits |
| `server` | builds `./server`        | 8000  | uvicorn `--reload`; `./server` mounted for live reload |
| `client` | builds `./client`        | 5173  | vite dev `--host 0.0.0.0`; `./client` mounted; HMR |

Startup order (via healthchecks + `depends_on`):
`db` + `redis` healthy → `migrate` runs + exits 0 → `server` starts → `client` starts.

### Open

- App: <http://localhost:5173>
- API: <http://localhost:8000/health>
- Docs: <http://localhost:8000/docs>
- DB (psql): `psql postgresql://postgres:postgres@localhost:5432/territory_run`
- Redis: `redis-cli -p 6379`

### Smoke test

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"u@example.com","username":"runner","password":"secretsecret"}'
```

### Stop / wipe

```bash
docker compose down            # stop, keep DB volume
docker compose down -v         # also drop DB volume (fresh schema next run)
```

### Re-run migrations (e.g. after editing `001_init.sql`)

```bash
docker compose run --rm migrate
```

### Run tests inside containers

```bash
docker compose exec server pytest -v
docker compose exec client npm test -- --run
```

### Shell

```bash
docker compose exec server bash
docker compose exec client sh
```

### Env vars (compose defaults)

The compose file injects dev-only defaults. Override via shell env or by editing `compose.yml`. Notable:

- `JWT_SECRET=dev-only-not-a-secret` — replace for any non-local use
- `DATABASE_URL` / `DATABASE_URL_DIRECT` → `postgres:postgres@db:5432/territory_run`
- `REDIS_URL` → `redis://redis:6379`
- `FRONTEND_URL` → `http://localhost:5173`
- `VITE_API_URL` → `http://localhost:8000` (client-side; browser reaches via host port)

---

## Quickstart — Local (without Docker)

### Prereqs

- Node 20+
- Python 3.13+
- Postgres 14+ with PostGIS (or `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:16-3.4`)
- Optional: Redis (`docker run -p 6379:6379 redis:7-alpine`)

### Setup

```bash
git clone https://github.com/Baranwalsahil/runner.git
cd runner
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, ...
```

### Backend

```bash
cd server
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.migrate          # apply DB schema
uvicorn app.main:app --reload --port 8000
pytest -v                          # unit pass everywhere; integration skip without TEST_DATABASE_URL
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/territory_run" pytest -v
```

### Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:5173
npm test -- --run    # vitest one-shot
npm run build        # production bundle to dist/
```

### Wire FE → BE

`client/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## Task roadmap

Tasks run **strictly in order**. Each is a self-contained brief in [`tasks/`](./tasks/).

| #  | Layer  | Title                                                | Status |
|----|--------|------------------------------------------------------|--------|
| 01 | FE     | Frontend scaffold (Vite + Tailwind theme)            | ✅ |
| 02 | FE     | Shared layout + router                               | ✅ |
| 03 | FE     | Landing page                                         | ✅ |
| 04 | FE     | Player dashboard                                     | ✅ |
| 05 | FE     | Battlefield map (MapLibre + h3-js)                   | ✅ |
| 06 | FE     | Global leaderboard                                   | ✅ |
| 07 | BE     | Backend scaffold (FastAPI, env, healthcheck)         | ✅ |
| 08 | DB     | Postgres + PostGIS schema + migrations               | ✅ |
| 09 | Auth   | Own JWT auth (bcrypt + python-jose, no IdP)          | ✅ |
| 10 | BE     | Runs ingest → H3 claim → DB upsert                   | ✅ |
| 11 | BE     | Territory + Leaderboard GET endpoints                | ✅ |
| 12 | Infra  | Redis cache + poll-based updates                     | ✅ |
| 13 | DevOps | Local docker-compose stack (cloud deploy deferred)   | ✅ |

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

- **`territory-run-frontend`** — owns `client/`. Vite + React + Tailwind v3 + React Router + MapLibre + h3-js + Vitest. Refuses backend work.
- **`territory-run-backend`** — owns `server/`. FastAPI + asyncpg + pydantic + h3-py + python-jose + redis.asyncio + pytest. Refuses frontend work.

Invoke via the `Agent` tool with `subagent_type: "territory-run-frontend"` or `"territory-run-backend"`.

---

## Game mechanics

### Territory acquisition

- Run with GPS → trace converted to H3 cells (res 9, ~100m hexes)
- First runner through a cell owns it
- Running through someone else's cell steals it via `INSERT ... ON CONFLICT DO UPDATE WHERE user_id IS DISTINCT FROM EXCLUDED`; `claim_count++`
- Anti-cheat: max 4h runs, max 12 m/s segment speed, accuracy filter > 50m, 2000-cell cap

### Hex math

- H3 resolution 9 → ~0.11 km² per cell, ~174m edge
- Server uses `h3.h3shape_to_cells(LatLngPoly(...), 9)` for bbox queries → `WHERE h3_index = ANY($1::text[])`
- Client uses `h3-js cellToBoundary` for GeoJSON rendering

### Scoring

- Primary: total cells owned (`users.total_cells`)
- Cache: `ZSET leaderboard:global` (member=user_id, score=total_cells), updated on every claim batch
- Tie-break: username ASC (deterministic)

---

## API

| Method | Path                       | Auth | Body / Query                                  | Returns |
|--------|----------------------------|------|-----------------------------------------------|---------|
| GET    | `/health`                  | no   | —                                             | `{status, uptime, version}` |
| POST   | `/auth/signup`             | no   | `{email, username, password}`                 | 201 `{user, token}` |
| POST   | `/auth/login`              | no   | `{email, password}`                           | 200 `{user, token}` or 401 generic |
| GET    | `/auth/me`                 | yes  | —                                             | current user |
| POST   | `/auth/logout`             | yes  | —                                             | 204 (stateless; client discards token) |
| POST   | `/runs`                    | yes  | `{gps_trace, started_at, ended_at}`           | `{run_id, cells_claimed, new_total}` |
| GET    | `/runs`                    | yes  | —                                             | list of run summaries |
| GET    | `/runs/{id}`               | yes  | —                                             | run detail |
| GET    | `/territory`               | yes  | `?bounds=sw_lat,sw_lng,ne_lat,ne_lng`         | `[{h3_index, user_id, username, color, claim_count, ...}]` |
| GET    | `/territory/user/{id}`     | yes  | `?limit&offset`                               | cells owned by user |
| GET    | `/territory/stats`         | yes  | —                                             | `{total_cells, total_users, contested_cells}` |
| GET    | `/leaderboard`             | yes  | `?limit&offset&period={all,weekly,daily}`     | `{rows, total, limit, offset}` |
| GET    | `/leaderboard/nearby`      | yes  | `?window=5`                                   | ±N rows around current user |

Auth: HS256 JWT (`Authorization: Bearer <token>`) signed with server-held `JWT_SECRET`. Default lifetime 7 days.

---

## Cloud deploy

Out of scope for now. The compose stack covers local dev end-to-end. When ready, see [`tasks/tasks-13-deploy.md`](./tasks/tasks-13-deploy.md) for a host-agnostic deploy sketch (Render web service + Vercel + managed Postgres + Upstash Redis).

---

## Status

All 13 tasks complete. End-to-end stack runs via `docker compose up`. Backend tests: 88/88 pytest. Frontend tests: 185/185 vitest. Live E2E (signup → run → territory → leaderboard) verified.

---

## License

MIT — see [`CLAUDE.md` § License](./CLAUDE.md#license).
