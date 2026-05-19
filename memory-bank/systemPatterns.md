# System Architecture Patterns

## Guiding Principles

| Principle | Description |
|-----------|-------------|
| Free-tier first | Every infra choice must fit Vercel + Render + Supabase + Upstash free tiers. Substitutions require explicit flagging. |
| Per-task feature branches | Every `tasks-NN` implementation MUST occur on `feat/task-NN-<slug>`; `main` is always green. Tiny doc fixes are the only exception. |
| Mockups = visual truth | `stitch_territory_runner/*.html` is the canonical source for visual styling. No design improvisation without flagging. |
| H3 resolution 9 | Game cells = H3 res 9 (~100m across). Other resolutions only for aggregate views or admin tooling. |
| App-side H3 | H3 indexing happens in application code (`h3-js`, `h3-py`), NOT via Postgres extension. Schema only stores `h3_index VARCHAR(20)`. |
| Sparse cell storage | Only claimed cells persist. No pre-populated global grid. |
| Env-driven config | All secrets, URLs, feature flags come from env vars (12-Factor). No hardcoded keys. |
| Realtime + polling fallback | Supabase Realtime is primary push channel; clients poll every 30s when channel unavailable. |
| Resumable task execution | `progress.md` (root + `memory-bank/progress.md`) tracks per-task status (`running`/`paused`/`complete`). Sessions resume by re-reading state. |

## System Architecture

### High-Level Architecture

```
┌──────────────┐     ┌──────────────┐
│ Mobile/Web   │     │ Web Dashboard│
│ React client │     │ (same client)│
└──────┬───────┘     └──────┬───────┘
       │   HTTPS / WSS      │
       └────────┬───────────┘
                │
                ▼
       ┌────────────────────┐
       │  FastAPI server    │
       │  (Render Web)      │
       └────────┬───────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│ Supabase     │  │ Upstash      │
│ Postgres +   │  │ Redis        │
│ PostGIS +    │  │ (leaderboard │
│ Auth +       │  │  + hot cells)│
│ Realtime     │  └──────────────┘
└──────────────┘
```

### Component Responsibilities

- **client/ (React + Vite)** — UI, GPS capture, map rendering (MapLibre + h3-js), Supabase auth client, REST calls to backend, Realtime channel subscription.
- **server/ (FastAPI)** — Auth JWT verification (Supabase), run ingest, H3 claim pipeline (gps_filter → h3_service), territory + leaderboard read endpoints, Redis cache.
- **Supabase Postgres** — Source of truth: `users`, `runs`, `claimed_cells`. PostGIS for GPS LINESTRING storage. Realtime publication on `claimed_cells`.
- **Upstash Redis** — Leaderboard sorted set (`ZINCRBY` on claim), hot territory viewport cache.

### Data Flow Patterns

#### Run Submission → Cell Claim

```
GPS trace [lat,lng,ts][]
       │
       ▼
gps_filter (speed outlier / accuracy >50m drop)
       │
       ▼
h3_service.latlngToCell(res=9)  ← app-side, h3-py
       │
       ▼
Postgres UPSERT claimed_cells  ← user_id, claim_count++
       │
       ▼
Redis ZINCRBY leaderboard:cells user_id +N
       │
       ▼
Supabase Realtime fan-out (CDC on claimed_cells)
       │
       ▼
Clients with viewport subscription patch GeoJSON source
```

- **Trigger**: `POST /runs` with `gps_trace` + timestamps
- **Output**: `{ run_id, cells_claimed, new_total }`; async fan-out via Realtime

#### Territory Viewport Query

```
GET /territory?bounds=sw_lat,sw_lng,ne_lat,ne_lng
       │
       ▼
Redis hit?  ── yes ──▶ return cached GeoJSON
       │ no
       ▼
Postgres SELECT WHERE h3_index IN (h3_polygonToCells(bounds))
       │
       ▼
Cache → Redis (short TTL) → respond
```

## Design Patterns Used

### Per-task Feature Branch + Resumable State
- **Problem**: Long-running multi-task build needs to survive session restarts and keep `main` green.
- **Implementation**: `tasks/tasks-NN-*.md` brief + `progress.md` ledger + `feat/task-NN-<slug>` branch per task. On new session, agent reads `progress.md` first, reconciles with code state, resumes.
- **Trade-offs**: Adds ceremony per task. Pays off when sessions interrupt mid-build.
- **Example**: see `CLAUDE.md` "Workflow: Per-task feat branch" section.

### App-side H3 (no Postgres H3 extension)
- **Problem**: Supabase free tier lacks the `h3-pg` extension; PostGIS is available but H3 isn't.
- **Implementation**: All H3 conversion in `server/app/services/h3_service.py` (planned, h3-py) and `client/src/lib/h3Utils.js`. Schema stores opaque `h3_index VARCHAR(20)` primary key.
- **Trade-offs**: No SQL-side hex aggregation; must batch UPSERTs from app. Buys portability across DB providers.

### Sparse cell storage
- **Problem**: H3 res 9 has ~4 trillion possible cells globally; pre-allocating is infeasible.
- **Implementation**: `claimed_cells` only contains touched cells. UPSERT on each claim.
- **Trade-offs**: Cold viewport ranges return empty quickly; hot viewports concentrate writes.

### CORS-narrowed FastAPI
- **Problem**: Browser must call backend from `localhost:5173` (dev) and Vercel domain (prod).
- **Implementation**: `server/app/middleware/cors.py` allowlist driven by env var. Tests assert 403/origin rejection.
- **Example**: `server/app/middleware/` + `server/tests/test_cors.py`

### structlog JSON log pipeline
- **Problem**: 12-Factor + need traceable request logs across Render/Vercel/Supabase boundaries.
- **Implementation**: `server/app/logging.py` configures structlog with JSON renderer; request-id middleware injects per-request fields.
- **Example**: `server/app/logging.py`, `server/app/middleware/`

## Integration Patterns

### Supabase Auth (planned task-09)
- **Type**: OAuth-style JWT
- **Protocol**: HTTPS — frontend uses `@supabase/supabase-js`, backend verifies JWT with `SUPABASE_JWT_SECRET`
- **Direction**: Inbound (FE → BE)
- **Contract**: Supabase issues HS256 JWT; FastAPI dependency parses `Authorization: Bearer <jwt>`, returns user_id

### Supabase Realtime (planned task-12)
- **Type**: WebSocket (Phoenix Channels)
- **Direction**: Inbound to clients
- **Contract**: Postgres CDC on `claimed_cells` publication → subscribed clients receive INSERT/UPDATE rows.
- **Fallback**: 30s polling of `GET /territory` if channel unavailable.

### MapLibre tile providers
- **Type**: HTTP tile fetch
- **Direction**: Outbound from client
- **Contract**: OSM raster default (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`); MapTiler if `VITE_MAPTILER_KEY` set.

## Testing Patterns

### Test Organization
- **Test location**: mixed.
  - FE: co-located `Component.test.jsx` next to `Component.jsx` AND a `src/test/` directory for setup/utilities.
  - BE: separate `server/tests/` directory.
- **File mapping**: one test file per component/module (FE); one test file per concern, named `test_<concern>.py` (BE, e.g. `test_health.py`, `test_cors.py`, `test_config.py`).
- **Naming convention**: FE `*.test.jsx`; BE `test_*.py`.

### Test Grouping
- **Within-file structure**: FE — `describe('<Component>', ...)` blocks grouped by behavior; BE — flat top-level `def test_*()` functions (pytest style).
- **Describe/context nesting**: FE shallow (1 level `describe` per component); BE none (flat).
- **Setup sharing**: FE — per-test render via React Testing Library, no shared fixtures yet. BE — `tests/conftest.py` for shared pytest fixtures (e.g. httpx AsyncClient).

### Test Framework & Style
- **Framework**: Vitest (FE), pytest + pytest-asyncio + httpx (BE).
- **Assertion style**: FE — `expect(...).toBeInTheDocument()` etc. (jest-dom matchers via `@testing-library/jest-dom`). BE — pytest plain `assert`.
- **Mocking approach**: FE — `vi.mock('maplibre-gl', ...)` via `client/src/__mocks__/`. BE — minimal mocking; integration-style with FastAPI TestClient/AsyncClient.

### Test Scope Preferences
- **Emphasis**: balanced — unit tests for pure utilities (e.g. `h3Utils`), component tests for UI behavior, integration for FastAPI routes.
- **Typical test-to-source ratio**: ~1:1 for components; ~1:1 for BE routers (one `test_<router>.py` per router).
- **What is NOT typically tested**: static design tokens, simple data fixtures (`data/mockCells`, `data/mockLeaderboard`), trivial getters.

## Recent Architecture Changes

### 2026-05-17 — Realtime pushed to Supabase (drop Ably)
- **What Changed**: Real-time channel provider changed from Ably to Supabase Realtime.
- **Reason**: Bundled with Supabase free tier (Postgres CDC, 200 concurrent connections).
- **Trade-offs**: One fewer service to manage, but tighter coupling to Supabase.
- **Affected Components**: client realtime subscription (planned task-12), `claimed_cells` Realtime publication.

### 2026-05-17 — `shared/` placeholder, code lives in client/server
- **What Changed**: No code in `shared/` yet despite CLAUDE.md projection of `shared/constants.js`.
- **Reason**: H3 resolution and game rules currently duplicated as needed; will consolidate in task-08+.
- **Trade-offs**: Minor duplication risk until `shared/` is populated.
