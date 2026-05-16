# Task 12 — Redis Cache + Real-time Updates

## Goal

Cache hot leaderboard + territory bbox queries in Redis. Add simple polling (or Pusher/Ably) so dashboard/battlefield reflect new claims w/o page reload.

## Prereqs

- Task 11 done
- Upstash Redis account (or local docker: `docker run -p 6379:6379 redis`)

## Install

```bash
cd /home/sahil/runner/server
npm install ioredis
```

## BE files

| Path | Purpose |
|------|---------|
| `server/cache/redis.js` | `ioredis` client; null-safe wrapper for when `REDIS_URL` not set (degrade gracefully) |
| `server/cache/leaderboardCache.js` | Maintains `ZSET leaderboard:global` (member=user_id, score=total_cells). On every `claimed_cells` upsert, call `ZADD`. Read: `ZREVRANGE 0 49 WITHSCORES`. |
| `server/cache/territoryCache.js` | `GET /territory?bounds=...` cached by bbox hash w/ 10s TTL. Cache key: `territory:{floor(sw_lat,3)}:{floor(sw_lng,3)}:{floor(ne_lat,3)}:{floor(ne_lng,3)}` |
| `server/services/runService.js` | After claim batch, `ZADD` updated user score + `DEL territory:*` matching invalidated bboxes (simple: flush prefix) |

## FE files

| Path | Purpose |
|------|---------|
| `client/src/hooks/useTerritory.js` | Add `useInterval` 30s refetch when tab visible |
| `client/src/hooks/useLeaderboard.js` | Same — poll every 60s |
| `client/src/hooks/usePageVisibility.js` | Pause polling when tab hidden |

## Optional: Pusher/Ably channel

If using Ably free tier:

```bash
npm install ably
```

- BE: after run claim, `channel.publish('cells-updated', {cells, ownerId})`
- FE: subscribe on Battlefield, patch local GeoJSON in place — no full refetch

Keep polling as fallback when real-time provider not configured (env-driven).

## Acceptance

- `GET /leaderboard` w/ Redis populated returns from cache (verify via log line / timing < 5ms)
- Submitting a run → cached leaderboard ZSET updated; next request reflects new score w/o DB hit
- Bbox cache: 2nd identical territory request inside 10s served from cache
- FE Battlefield: after another user claims cells, page updates w/in 30s (polling) or instantly (Ably)
- When `REDIS_URL` empty: server still works, falls back to DB

## Out of scope

- Multi-region cache invalidation
- Conflict resolution for simultaneous claims (last write wins, OK for MVP)
