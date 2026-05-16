# Task 12 — Redis Cache + Real-time Updates (Supabase Realtime)

## Goal

Cache hot leaderboard + territory bbox queries in Redis. Use **Supabase Realtime** (Postgres logical replication CDC) to push `claimed_cells` INSERT/UPDATE events to FE so dashboard/battlefield reflect new claims without polling. Polling kept only as fallback when Realtime channel unavailable.

> **Why Supabase Realtime instead of Ably/Pusher**: same provider as auth + DB → zero extra accounts, zero extra secrets, no API quota math, free at this scale. Event stream comes straight from Postgres replication slot — no app-code publish step needed.

## Prereqs

- Task 11 done
- Task 08 enabled `claimed_cells` for `supabase_realtime` publication
- Upstash Redis account (or local docker: `docker run -p 6379:6379 redis`)

## Install

### Backend

```bash
cd /home/sahil/runner/server
source .venv/bin/activate
pip install "redis[hiredis]" fakeredis
pip freeze > requirements.txt
```

### Frontend

```bash
cd /home/sahil/runner/client
# @supabase/supabase-js already installed in task 09 — Realtime client is bundled
```

## BE files (Redis cache only — Realtime is FE-side)

| Path | Purpose |
|------|---------|
| `server/app/cache/__init__.py` | empty |
| `server/app/cache/redis_client.py` | Singleton `redis.asyncio.Redis` from `settings.redis_url`. **NullCache** stub when unset — every op returns `None`/`False`/`[]`. Use `redis.asyncio.from_url(...)`. |
| `server/app/cache/leaderboard_cache.py` | Maintains `ZSET leaderboard:global` (member=user_id, score=total_cells). On every `claimed_cells` upsert batch, call `ZADD`. Read: `ZREVRANGE 0 49 WITHSCORES`. Map back to user rows via DB JOIN on small ID set. |
| `server/app/cache/territory_cache.py` | `GET /territory?bounds=...` cached by bbox hash w/ 10s TTL. Cache key: `territory:{floor(sw_lat,3)}:{floor(sw_lng,3)}:{floor(ne_lat,3)}:{floor(ne_lng,3)}`. Value: JSON-serialized cell list. |
| `server/app/services/run_service.py` | After claim batch: `ZADD leaderboard:global {new_total} {user_id}` + `SCAN MATCH territory:*` + `DEL` (simple flush; OK for MVP scale). Supabase Realtime auto-emits the INSERT/UPDATE events from DB — no manual publish call needed. |

## FE files

| Path | Purpose |
|------|---------|
| `client/src/lib/realtime.js` | Wraps `supabase.channel('claimed-cells').on('postgres_changes', {event: '*', schema: 'public', table: 'claimed_cells'}, handler).subscribe()`. Exports `subscribeClaimedCells(handler)` returning unsubscribe fn. |
| `client/src/hooks/useTerritoryRealtime.js` | Subscribes on mount, patches local GeoJSON FeatureCollection on each event (`INSERT` → add feature; `UPDATE` → swap feature; `DELETE` → remove). Falls back to 30s polling via `useInterval` when subscription `status === 'CHANNEL_ERROR'` or `VITE_SUPABASE_URL` missing. |
| `client/src/hooks/useLeaderboardRealtime.js` | Same pattern, subscribes to events for `claimed_cells`, debounces 5s before refetching `/leaderboard` (no need to patch — ranks shift globally). 60s polling fallback. |
| `client/src/hooks/usePageVisibility.js` | Pauses polling when tab hidden (Realtime subscription is paused automatically by Supabase client) |
| `client/src/components/battlefield/MapCanvas.jsx` | Wires `useTerritoryRealtime(bounds)` (replaces `useTerritory` from task 11 — or merge them) |

### Realtime payload shape

`postgres_changes` event delivers:

```js
{
  schema: 'public',
  table: 'claimed_cells',
  commit_timestamp: '2026-05-16T...',
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  new: { h3_index, user_id, resolution, claim_count, claimed_at },
  old: { h3_index, ... }    // only present for UPDATE / DELETE
}
```

FE handler enriches with `color` + `username` via in-memory user cache (loaded once on map mount).

## redis_client.py skeleton

```python
import redis.asyncio as redis
from app.config import get_settings

class NullCache:
    async def get(self, *_a, **_k): return None
    async def set(self, *_a, **_k): return False
    async def delete(self, *_a, **_k): return 0
    async def zadd(self, *_a, **_k): return 0
    async def zrevrange(self, *_a, **_k): return []
    async def scan_iter(self, *_a, **_k):
        if False: yield  # async generator with no items
    async def close(self): pass

_client = None

async def get_cache():
    global _client
    if _client is not None:
        return _client
    settings = get_settings()
    if not settings.redis_url:
        _client = NullCache()
    else:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client
```

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_redis_null.py` | NullCache used when REDIS_URL unset; all ops no-op |
| `server/tests/test_leaderboard_cache.py` | ZADD then ZREVRANGE returns top-N; use `fakeredis` |
| `server/tests/test_territory_cache.py` | Bbox key derivation stable; 10s TTL respected (fake clock) |
| `server/tests/test_cache_invalidation.py` | After claim, leaderboard ZSET reflects new score; territory:* keys flushed |
| `client/src/test/useTerritoryRealtime.test.js` | Mock supabase client; verify subscribe on mount, unsubscribe on unmount, INSERT event patches GeoJSON, fallback to polling when channel errors |

## Acceptance

- `GET /leaderboard` w/ Redis populated returns from cache (timing < 5ms log line)
- Submitting a run → cached leaderboard ZSET updated; next request reflects new score w/o DB hit
- Bbox cache: 2nd identical territory request inside 10s served from cache
- FE Battlefield: another user's claim appears within ~1-2s via Realtime channel (verify by submitting a run as user B in another tab)
- Pulling Realtime subscription (`VITE_SUPABASE_URL` blanked) → FE falls back to 30s polling cleanly, no errors
- When `REDIS_URL` empty: server still works, falls back to DB
- `pytest -v` + `npm test` → green

## Out of scope

- Multi-region cache invalidation
- Conflict resolution for simultaneous claims (last write wins, OK for MVP)
- Presence channels (showing live runner positions) — task 10.5 if added later
- Broadcast channels (chat / taunts) — out of MVP
