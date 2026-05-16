# Task 11 — Territory + Leaderboard APIs + FE wiring

## Goal

Implement read APIs. Replace FE mock data on Battlefield + Leaderboard + Dashboard w/ live calls.

## Prereqs

- Tasks 05, 06, 10 done

## BE files

| Path | Purpose |
|------|---------|
| `server/routes/territory.js` | `GET /territory?bounds=sw_lat,sw_lng,ne_lat,ne_lng` — returns cells whose H3 boundary intersects bbox. `GET /territory/user/:id`. `GET /territory/stats` (total cells, top region, contested count). |
| `server/services/territoryService.js` | `cellsInBounds(bounds)` — query `claimed_cells` joined w/ `users`. Use `h3-js` `polygonToCells` to derive candidate H3 list for bounds, then `WHERE h3_index = ANY($1)` (avoids full table scan). |
| `server/routes/leaderboard.js` | `GET /leaderboard?limit=50&offset=0&period=all\|weekly\|daily&region=global\|seattle` — sorted by `total_cells` DESC. `GET /leaderboard/nearby` returns ±5 around current user's rank using window fn. |
| `server/services/leaderboardService.js` | SQL: `SELECT id, username, total_cells, ROW_NUMBER() OVER (ORDER BY total_cells DESC) AS rank FROM users LIMIT $1 OFFSET $2`. Weekly = filter `claimed_cells.claimed_at > NOW() - INTERVAL '7 days'`. |

## FE changes

| File | Change |
|------|--------|
| `client/src/lib/api.js` | Add `territory.list(bounds)`, `territory.byUser(id)`, `leaderboard.top(opts)` methods |
| `client/src/hooks/useTerritory.js` | `useTerritory(bounds)` — fetches on bounds change w/ 500ms debounce |
| `client/src/components/battlefield/MapCanvas.jsx` | Replace `mockCells` import w/ `useTerritory(currentBounds)`. Update GeoJSON source on data change. |
| `client/src/routes/Leaderboard.jsx` | Replace `mockLeaderboard` w/ `useEffect` + `api.leaderboard.top`. Loading skeleton. |
| `client/src/components/dashboard/RecentBattlesFeed.jsx` | Replace hardcoded battles w/ paginated fetch from `/territory/user/:id?recent=true`. Keep "View Full History" → fetches next page. |

## Color assignment

Deterministic palette per user_id:

```js
const palette = ['#c3f400','#00dbe9','#ffb4aa','#7df4ff','#ffdad5','#ff6b6b'];
const colorFor = (userId) => palette[hash(userId) % palette.length];
```

Compute server-side once + cache; return color in API response.

## Acceptance

- Battlefield map shows live cells from DB; pan/zoom refetches via debounced bounds change
- Leaderboard renders real users from DB sorted by `total_cells`
- Pagination works (offset)
- Period filter weekly returns subset
- Empty DB → endpoints return `[]`, not 500

## Out of scope

- Caching layer — task 12
- Friend filter — out of MVP
