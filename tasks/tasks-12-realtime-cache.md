# Task 12 — Redis Cache + Poll-based Updates

## Goal

Cache hot leaderboard + territory bbox queries in Redis. Client polls
`/territory` + `/leaderboard` on a fixed interval (paused when tab
hidden). No realtime channel, no CDC, no third-party event service.

> **Why polling instead of WebSocket / CDC**: at MVP scale (low concurrent
> users, ~30s update tolerance) polling is the simplest viable path.
> Redis cache absorbs the read load; expected request rate stays well
> below free-tier limits. WebSocket / CDC can be revisited post-launch
> when concurrency justifies the operational cost.

## Prereqs

- Task 11 done
- Upstash Redis account, Render Redis, or local docker:
  `docker run -p 6379:6379 redis`

## Install

### Backend

```bash
cd /home/sahil/runner/server
source .venv/bin/activate
pip install "redis[hiredis]" fakeredis
pip freeze > requirements.txt
```

### Frontend

No new packages — `fetch` + `useEffect` polling only.

## BE files

| Path | Purpose |
|------|---------|
| `server/app/cache/__init__.py` | empty |
| `server/app/cache/redis_client.py` | Singleton `redis.asyncio.Redis` from `settings.redis_url`. **NullCache** stub when unset — every op returns `None`/`False`/`[]`. Use `redis.asyncio.from_url(...)`. |
| `server/app/cache/leaderboard_cache.py` | Maintains `ZSET leaderboard:global` (member=user_id, score=total_cells). On every `claimed_cells` upsert batch, call `ZADD`. Read: `ZREVRANGE 0 49 WITHSCORES`. Map back to user rows via DB JOIN on small ID set. |
| `server/app/cache/territory_cache.py` | `GET /territory?bounds=...` cached by bbox hash w/ 10s TTL. Cache key: `territory:{floor(sw_lat,3)}:{floor(sw_lng,3)}:{floor(ne_lat,3)}:{floor(ne_lng,3)}`. Value: JSON-serialized cell list. |
| `server/app/services/run_service.py` | After claim batch: `ZADD leaderboard:global {new_total} {user_id}` + `SCAN MATCH territory:*` + `DEL` (simple flush; OK for MVP scale). |

## FE files

| Path | Purpose |
|------|---------|
| `client/src/hooks/usePolling.js` | Generic `usePolling(fn, intervalMs)` hook. Pauses when document hidden (visibilitychange listener), resumes on focus. Calls `fn()` immediately then every `intervalMs`. |
| `client/src/hooks/useTerritoryPolling.js` | Wraps `usePolling(() => fetchTerritory(bounds), 15000)`. Re-fetches when `bounds` change. Returns `{cells, loading, error}`. |
| `client/src/hooks/useLeaderboardPolling.js` | `usePolling(fetchLeaderboard, 30000)`. Returns `{rows, loading}`. |
| `client/src/components/battlefield/MapCanvas.jsx` | Wires `useTerritoryPolling(bounds)` (replaces direct fetch). Cells diff cheap; replace whole GeoJSON FeatureCollection on each tick. |

### Polling intervals

| Surface | Interval | Reason |
|---------|----------|--------|
| Territory (bbox) | 15s | Players expect claim feedback within seconds |
| Leaderboard | 30s | Rankings shift slowly |
| Player dashboard (own stats) | 60s | Self-stats lag-tolerant |

All paused when `document.hidden`. Resume fires an immediate fetch on
visibility change.

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
| `client/src/test/usePolling.test.js` | Fires on interval; pauses on `document.hidden=true`; resumes + immediate fetch on visibility change; cleans up timer on unmount |
| `client/src/test/useTerritoryPolling.test.js` | Re-fetches when bounds change; returns cells; handles fetch error gracefully |

## Acceptance

- `GET /leaderboard` w/ Redis populated returns from cache (timing < 5ms log line)
- Submitting a run → cached leaderboard ZSET updated; next request reflects new score w/o DB hit
- Bbox cache: 2nd identical territory request inside 10s served from cache
- FE Battlefield: another user's claim appears within poll interval (≤15s) — verify by submitting run as user B in second tab
- Tab hidden → polling pauses (verify via Network panel: no requests fire when tab inactive)
- Tab reactivates → immediate refetch
- When `REDIS_URL` empty: server still works, falls back to DB
- `pytest -v` + `npm test` → green

## Out of scope

- WebSocket / SSE — revisit if poll load becomes an issue
- Postgres CDC / logical replication consumers
- Multi-region cache invalidation
- Conflict resolution for simultaneous claims (last write wins, OK for MVP)
- Presence (live runner positions)
- Broadcast channels (chat / taunts)
