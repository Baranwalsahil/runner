---
name: territory-debug
description: Inspect Territory Run game state — H3 cell claims, GPS trace filtering, territory viewport queries, leaderboard ranks, and Redis cache. Use when debugging why a run didn't claim cells, a cell owner looks wrong, the leaderboard is stale, or territory doesn't render in a viewport.
---

# Territory Run — Domain Debugging

Game-specific inspection helpers. Game constants (`shared/constants.py` / `.js`):
`H3_RESOLUTION=9`, `MAX_SPEED_MPS=12`, `MAX_RUN_HOURS=4`, `MAX_CELLS_PER_RUN=2000`, `GPS_ACCURACY_THRESHOLD_M=50`, `OWNER_PALETTE` (6 colors).

Steal-on-run model: running through a cell takes ownership. First-pass owns until someone else runs through.

## Run didn't claim cells

Pipeline: GPS trace → `gps_filter.py` (drop accuracy >50m, speed >12 m/s) → `h3_service.py` (latlng → h3 res 9) → `run_service.py` (upsert `claimed_cells`, bump `claim_count`) → leaderboard ZINCRBY.

Check in order:
1. **Filter dropped points** — trace too fast (>12 m/s = teleport) or low accuracy gets discarded. Inspect `services/gps_filter.py`.
2. **Caps** — run >4h or >2000 cells rejected/truncated.
3. **DB state**:
   ```sql
   SELECT h3_index, user_id, claim_count, resolution, claimed_at
   FROM claimed_cells WHERE user_id = '<uuid>' ORDER BY claimed_at DESC LIMIT 20;
   SELECT id, distance_meters, cells_claimed, started_at, ended_at FROM runs
   WHERE user_id = '<uuid>' ORDER BY started_at DESC LIMIT 5;
   ```

## Cell owner wrong

`claimed_cells.h3_index` is PK; owner = last runner through. `claim_count` increments each claim. If owner unexpected, check most recent run covering that hex and `claimed_at`.

## API spot-checks

Backend on `:8000`. Auth = HS256 JWT bearer.

```bash
# territory in viewport: bounds = sw_lat,sw_lng,ne_lat,ne_lng
curl "localhost:8000/territory?bounds=47.5,-122.4,47.7,-122.2"
curl "localhost:8000/territory/stats"
curl "localhost:8000/territory/user/<uuid>"
curl "localhost:8000/leaderboard?limit=50&offset=0"
curl "localhost:8000/leaderboard/nearby" -H "Authorization: Bearer <jwt>"
curl "localhost:8000/runs/feed"
```

Routers: `runs.py`, `territory.py`, `leaderboard.py`, `users.py`, `auth.py`.

## Leaderboard stale

Redis ZSET is source for ranks (`cache/leaderboard_cache.py`), Postgres `users.total_cells` is canonical count. If they diverge, cache is stale.

```bash
redis-cli ZREVRANGE leaderboard 0 9 WITHSCORES   # confirm key name in leaderboard_cache.py
redis-cli KEYS 'territory:*'                       # territory viewport cache
```

Polling cadence (no WebSocket at MVP): territory 15s, leaderboard 30s, paused when tab hidden.

## Territory not rendering

Frontend renders hexes via `client/src/lib/h3Utils.js` + `mapStyle.js` on MapLibre. Confirm `/territory?bounds=` returns cells for the viewport and owner colors map to `OWNER_PALETTE`.
