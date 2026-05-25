---
name: project-stack-snapshot
description: Territory Run tech stack + key constants + pipeline flow. High-density refresher to skip re-grepping CLAUDE.md/code on every session.
metadata: 
  node_type: memory
  type: project
  originSessionId: b2264f4f-9059-478a-a23d-9284f44ef563
---

# Territory Run — compressed snapshot (verify before quoting numbers)

GPS hex-territory game. SPA + REST API + Postgres/PostGIS + Redis.

## Stack

- **FE**: `client/` — Vite+React+Tailwind v3, react-router-dom 7, MapLibre GL JS, h3-js. Tests: Vitest. Dev `:5173`.
- **BE**: `server/` — FastAPI + uvicorn + asyncpg + python-jose (JWT HS256) + bcrypt + h3==4.4.2 + redis + structlog. Tests: pytest. Dev `:8000`.
- **DB**: Postgres + PostGIS + pgcrypto. Tables `users`, `runs`, `claimed_cells`, `schema_migrations`. PK on `claimed_cells.h3_index`.
- **Cache**: Redis. ZSET `leaderboard:global`. Key prefix `territory:{bbox-quantized}` TTL 10s.
- **Auth**: own JWT (HS256, `JWT_SECRET`), bcrypt password_hash on `users`. localStorage Bearer token; 401 → clearToken + redirect `/auth`.
- **Deploy**: local docker-compose (`compose.yml`: db+redis+migrate+server+client). Vercel for FE prod, Render-class for BE.

## Routes (FE)

`/` landing, `/auth` (public). Protected via `ProtectedRoute`: `/dashboard`, `/battlefield`, `/leaderboard`, `/run`, `/profile`.

## Endpoints (BE)

- `/auth/signup` `/auth/login` `/auth/me` `/auth/logout`
- `POST /runs` (ingest trace) · `GET /runs` `/runs/{id}`
- `GET /territory?bounds=sw_lat,sw_lng,ne_lat,ne_lng` · `/territory/stats` · `/territory/user/{id}`
- `GET /leaderboard?period=all|weekly|daily` · `/leaderboard/nearby`
- `GET /health`

## Constants (shared/constants.py mirrored in server/app/constants.py)

```
H3_RESOLUTION             = 9     # ~0.11 km², edge ~174 m, city block
MAX_SPEED_MPS             = 12    # ~43 km/h speed filter
MAX_RUN_HOURS             = 4
MAX_CELLS_PER_RUN         = 2000
GPS_ACCURACY_THRESHOLD_M  = 50
```

## Run ingest pipeline

`POST /runs` → `run_service.ingest_run`:

1. `filter_trace` — drop accuracy>50m + segments speed>12 m/s.
2. `trace_to_cells` — `{ h3.latlng_to_cell(lat,lng,9) for p in cleaned }`. Set dedupes.
3. cap MAX_CELLS_PER_RUN=2000.
4. `CLAIM_SQL` INSERT...ON CONFLICT DO UPDATE WHERE user_id IS DISTINCT FROM EXCLUDED (steal-on-run; bumps claim_count).
5. recompute `users.total_cells` for `[me, ...displaced_owners]` via single UPDATE.
6. ZADD leaderboard:global for each affected user; SCAN+DEL `territory:*`.

## Polling (no WebSocket)

- territory: 15s, paused on `visibilitychange` hidden, refire on focus.
- leaderboard: 30s same gating.
- hooks: `hooks/usePolling.js`, `useTerritoryPolling`, `useLeaderboardPolling`.

## Test counts (last verified)

- vitest: 207/207 (after burger menu + tests added 2026-05-25)
- pytest: 88/88 (with postgis+redis docker)

## Key files

- `client/src/lib/h3Utils.js` — cellToBoundary + cellsToGeoJSON.
- `client/src/lib/auth.js` — apiFetch + apiJson + token mgmt.
- `client/src/components/auth/AuthProvider.jsx` — hydrate via /auth/me.
- `server/app/services/run_service.py` — ingest_run, CLAIM_SQL.
- `server/app/services/gps_filter.py` — accuracy + speed filter, haversine.
- `server/app/services/h3_service.py` — trace_to_cells.
- `server/app/db/schema.sql` + `server/migrations/001_init.sql`.

## Related

[[reference-demo-credentials]] · [[reference-local-infra]] · [[feedback-branch-pr-flow]]
