# Task 11 — Territory + Leaderboard APIs + FE wiring (Python)

## Goal

Implement read APIs. Replace FE mock data on Battlefield + Leaderboard + Dashboard w/ live calls.

## Prereqs

- Tasks 05, 06, 10 done

## BE files

| Path | Purpose |
|------|---------|
| `server/app/routers/territory.py` | `GET /territory?bounds=sw_lat,sw_lng,ne_lat,ne_lng` — returns cells whose H3 boundary intersects bbox. `GET /territory/user/{user_id}`. `GET /territory/stats` (total cells, top region, contested count). |
| `server/app/services/territory_service.py` | `cells_in_bounds(pool, bounds: Bounds) -> list[CellOut]` — uses `h3.polygon_to_cells(bounds_polygon, H3_RESOLUTION)` to derive candidate H3 list, then `WHERE h3_index = ANY($1)` (avoids full table scan). JOIN `users` for username + color. |
| `server/app/routers/leaderboard.py` | `GET /leaderboard?limit=50&offset=0&period=all\|weekly\|daily&region=global\|seattle` — sorted by `total_cells` DESC. `GET /leaderboard/nearby` returns ±5 around current user's rank via window function. |
| `server/app/services/leaderboard_service.py` | SQL: `SELECT id, username, total_cells, ROW_NUMBER() OVER (ORDER BY total_cells DESC) AS rank FROM users LIMIT $1 OFFSET $2`. Weekly variant: join `claimed_cells` filtered by `claimed_at > NOW() - INTERVAL '7 days'`. |
| `server/app/schemas/territory.py` | pydantic `Bounds`, `CellOut`, `TerritoryStats` |
| `server/app/schemas/leaderboard.py` | pydantic `LeaderboardRow`, `LeaderboardPage` |

Register routers in `app/main.py`.

## FE changes

(Unchanged — backend swap invisible to client.)

| File | Change |
|------|--------|
| `client/src/lib/api.js` | Add `territory.list(bounds)`, `territory.byUser(id)`, `leaderboard.top(opts)` methods |
| `client/src/hooks/useTerritory.js` | `useTerritory(bounds)` — fetches on bounds change w/ 500ms debounce |
| `client/src/components/battlefield/MapCanvas.jsx` | Replace `mockCells` import w/ `useTerritory(currentBounds)`. Update GeoJSON source on data change. |
| `client/src/routes/Leaderboard.jsx` | Replace `mockLeaderboard` w/ `useEffect` + `api.leaderboard.top`. Loading skeleton. |
| `client/src/components/dashboard/RecentBattlesFeed.jsx` | Replace hardcoded battles w/ paginated fetch from `/territory/user/{id}?recent=true`. Keep "View Full History" → fetches next page. |

## Color assignment

Deterministic palette per user_id (server-side):

```python
import hashlib
from shared.constants import OWNER_PALETTE

def color_for(user_id: str) -> str:
    digest = hashlib.md5(user_id.encode()).hexdigest()
    idx = int(digest[:8], 16) % len(OWNER_PALETTE)
    return OWNER_PALETTE[idx]
```

Compute server-side once per row; return `color` in API response. Cache via `functools.lru_cache(maxsize=10000)`.

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_territory_service.py` | bounds → candidate h3 list correct; query returns only cells in bbox |
| `server/tests/test_territory_router.py` | `GET /territory?bounds=...` shape + 200; missing bounds → 422 |
| `server/tests/test_leaderboard_service.py` | Sort order, pagination, weekly filter |
| `server/tests/test_leaderboard_router.py` | Auth required, pagination params, empty DB returns `[]` not 500 |
| `server/tests/test_color_for.py` | Same user_id → same color across calls; uniform-ish distribution |

## Acceptance

- Battlefield map shows live cells from DB; pan/zoom refetches via debounced bounds change
- Leaderboard renders real users from DB sorted by `total_cells`
- Pagination works (offset)
- Period filter weekly returns subset
- Empty DB → endpoints return `[]`, not 500
- `pytest -v` → green

## Out of scope

- Caching layer — task 12
- Friend filter — out of MVP
