# Task 10 — Runs API + GPS → H3 Claim Pipeline (Python)

## Goal

Implement run ingest. FE captures GPS via `useGeolocation`. POST to `/runs` w/ trace. BE filters noise, converts to H3 cells via h3-py, upserts ownership in `claimed_cells`, updates `users.total_cells`.

## Prereqs

- Tasks 07, 08, 09 done

## Install

```bash
cd /home/sahil/runner/server
source .venv/bin/activate
pip install h3
pip freeze > requirements.txt
```

(zod equivalent = pydantic — already installed in task 07.)

## BE files

| Path | Purpose |
|------|---------|
| `server/app/routers/runs.py` | `POST /runs` (auth required), `GET /runs`, `GET /runs/{run_id}` |
| `server/app/services/h3_service.py` | `trace_to_cells(points: list[tuple[float, float]], resolution: int) -> set[str]`: `h3.latlng_to_cell` per point; dedupe set; optional `h3.grid_disk(cell, 1)` for buffer |
| `server/app/services/gps_filter.py` | `filter_trace(points: list[Point]) -> list[Point]`: speed-based (drop segment > 12 m/s using haversine); accuracy filter (drop pts with `accuracy_m > 50`) |
| `server/app/services/run_service.py` | `ingest_run(pool, user_id, payload) -> RunResult`. Wraps in `async with pool.transaction()`: insert `runs` row (build LINESTRING via `ST_MakeLine(ST_MakePoint($lng,$lat),...)`), upsert into `claimed_cells`, recompute `users.total_cells` via `UPDATE users SET total_cells = (SELECT COUNT(*) FROM claimed_cells WHERE user_id = $1) WHERE id = $1`. Returns `{run_id, cells_claimed, new_total}`. |
| `server/app/schemas/run.py` | pydantic models: `Point(lat, lng, timestamp: datetime \| None, accuracy: float \| None)`, `RunCreate(gps_trace: list[Point], started_at, ended_at)`, `RunResult(run_id, cells_claimed, new_total)`. Validators reject runs > 4h, empty traces, > 2000 cells. |

Register `runs` router in `app/main.py`.

## FE files

(Unchanged — same React hooks regardless of backend language.)

| Path | Purpose |
|------|---------|
| `client/src/hooks/useGeolocation.js` | `watchPosition` wrapper. State: `points[]`, `isRecording`, `error`. Methods: `start()`, `stop()`, `clear()`. Batch points in memory. |
| `client/src/components/run/RunTracker.jsx` | Big start/stop UI. Live timer + distance + cells claimed estimate. Submit on stop. |
| `client/src/routes/Run.jsx` | `/run` route hosting RunTracker. Add to TopNavBar / FAB. |

Wire FAB "Start Session" → `/run`.

## Claim algorithm (DB, asyncpg parameterized)

```python
CLAIM_SQL = """
INSERT INTO claimed_cells (h3_index, user_id, resolution, claim_count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (h3_index) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      claimed_at = NOW(),
      claim_count = claimed_cells.claim_count + 1
WHERE claimed_cells.user_id IS DISTINCT FROM EXCLUDED.user_id;
"""
```

Use `await conn.executemany(CLAIM_SQL, rows)` inside `async with pool.acquire() as conn, conn.transaction():` block. Recompute `users.total_cells = COUNT(*)` for claiming user after batch.

## Anti-cheat (MVP)

Constants from `shared/constants.py`:
- Reject runs > 4 hours duration (`MAX_RUN_HOURS`)
- Reject segment speed > 12 m/s (`MAX_SPEED_MPS`)
- Cap cells per run at 2000 (`MAX_CELLS_PER_RUN`)
- Drop GPS points with accuracy > 50m (`GPS_ACCURACY_THRESHOLD_M`)

Raise `HTTPException(400, detail="...")` with reason.

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_h3_service.py` | `trace_to_cells` returns unique set; resolution honored; empty input → empty set |
| `server/tests/test_gps_filter.py` | Speed filter drops impossible segments; accuracy filter drops noisy points |
| `server/tests/test_run_service.py` | Run ingest end-to-end (against test DB): inserts run, claims cells, updates total_cells, ownership transfer test, anti-cheat rejection |
| `server/tests/test_runs_router.py` | POST /runs 401 w/o auth, 400 on bad trace, 200 on valid; returns correct shape |

## Acceptance

- `POST /runs` w/ valid trace returns `{run_id, cells_claimed, new_total}`
- DB shows new run row + corresponding `claimed_cells` updates
- Submitting trace overlapping another user's cells → ownership transfers, claim_count++
- Bad trace (speed > 12 m/s) → 400 w/ reason in detail
- FE: pressing Start on `/run` triggers permission prompt; recording captures points; Stop submits
- `pytest -v` → green

## Out of scope

- Live Kalman filter — simple speed filter only
- Buffer zone claiming — simple trace-through only (MVP per CLAUDE.md)
- WebSocket broadcast — task 12
