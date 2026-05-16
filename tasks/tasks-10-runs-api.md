# Task 10 — Runs API + GPS → H3 Claim Pipeline

## Goal

Implement run ingest. FE captures GPS via `useGeolocation`. POST to `/runs` w/ trace. BE filters noise, converts to H3 cells, upserts ownership in `claimed_cells`, updates `users.total_cells`.

## Prereqs

- Tasks 07, 08, 09 done

## Install

```bash
cd /home/sahil/runner/server
npm install h3-js zod
```

## BE files

| Path | Purpose |
|------|---------|
| `server/routes/runs.js` | `POST /runs` (auth required), `GET /runs`, `GET /runs/:id` |
| `server/services/h3Service.js` | `traceToCells(points, resolution)` → unique H3 indices via `latLngToCell` per point; dedupe; optional `gridDisk(1)` for buffer |
| `server/services/gpsFilter.js` | Speed-based filter from claude.md § Key Challenges § 1; accuracy filter (drop pts > 50m) |
| `server/services/runService.js` | Orchestrates: filter → encode → DB transaction: insert into `runs`, upsert into `claimed_cells` (set new owner, increment `claim_count`), recompute `users.total_cells` via aggregate or trigger-style update |
| `server/validators/runSchema.js` | zod: `{ gps_trace: [[lat,lng,timestamp?]], started_at, ended_at }` |

## FE files

| Path | Purpose |
|------|---------|
| `client/src/hooks/useGeolocation.js` | `watchPosition` wrapper. State: `points[]`, `isRecording`, `error`. Methods: `start()`, `stop()`, `clear()`. Batch points in memory. |
| `client/src/components/run/RunTracker.jsx` | Big start/stop UI. Live timer + distance + cells claimed estimate. Submit on stop. |
| `client/src/routes/Run.jsx` | `/run` route hosting RunTracker. Add to TopNavBar / FAB. |

Wire FAB "Start Session" → `/run`.

## Claim algorithm (DB)

```sql
INSERT INTO claimed_cells (h3_index, user_id, resolution, claim_count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (h3_index) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      claimed_at = NOW(),
      claim_count = claimed_cells.claim_count + 1
WHERE claimed_cells.user_id IS DISTINCT FROM EXCLUDED.user_id;
```

Wrap full run in `BEGIN ... COMMIT`. Recompute `users.total_cells = COUNT(*)` for claiming user after batch.

## Anti-cheat (minimal MVP)

- Reject runs > 4 hours duration
- Reject if any segment speed > 12 m/s
- Cap cells per run at 2000 (sane upper bound)

## Acceptance

- POST `/runs` w/ valid trace returns `{run_id, cells_claimed, new_total}`
- DB shows new run row + corresponding `claimed_cells` updates
- Submitting trace that overlaps another user's cells → ownership transfers
- Bad trace (speed > 12 m/s) → 400 w/ reason
- FE: pressing Start on `/run` triggers permission prompt; recording captures points; Stop submits

## Out of scope

- Live Kalman filter — simple speed filter only
- Buffer zone claiming — simple trace-through only (MVP per claude.md)
- WebSocket broadcast — task 12
