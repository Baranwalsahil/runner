# Task 12 — Redis Cache + Real-time Updates (Python)

## Goal

Cache hot leaderboard + territory bbox queries in Redis. Add simple polling (or Ably) so dashboard/battlefield reflect new claims w/o page reload.

## Prereqs

- Task 11 done
- Upstash Redis account (or local docker: `docker run -p 6379:6379 redis`)

## Install

```bash
cd /home/sahil/runner/server
source .venv/bin/activate
pip install "redis[hiredis]"
pip freeze > requirements.txt
```

(Uses `redis.asyncio` client — async-native, replaces ioredis.)

## BE files

| Path | Purpose |
|------|---------|
| `server/app/cache/__init__.py` | empty |
| `server/app/cache/redis_client.py` | Singleton `redis.asyncio.Redis` from `settings.redis_url`. Null-safe wrapper: if `REDIS_URL` unset, return `NullCache` no-op stub so every call returns `None`/`False`. Use `redis.asyncio.from_url(...)`. |
| `server/app/cache/leaderboard_cache.py` | Maintains `ZSET leaderboard:global` (member=user_id, score=total_cells). On every `claimed_cells` upsert batch, call `ZADD`. Read: `ZREVRANGE 0 49 WITHSCORES`. Map back to user rows via cached hash or DB JOIN on the small ID set. |
| `server/app/cache/territory_cache.py` | `GET /territory?bounds=...` cached by bbox hash w/ 10s TTL. Cache key: `territory:{floor(sw_lat,3)}:{floor(sw_lng,3)}:{floor(ne_lat,3)}:{floor(ne_lng,3)}`. Value: JSON-serialized cell list. |
| `server/app/services/run_service.py` | After claim batch, `ZADD leaderboard:global {new_total} {user_id}` + `SCAN` + `DEL` keys matching `territory:*` (simple flush; OK for MVP scale). |

Wire cache lookups into `territory_service.cells_in_bounds` and `leaderboard_service.top` (cache-first, DB-fallback, populate-on-miss).

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

## FE files

(Unchanged — same polling hooks.)

| Path | Purpose |
|------|---------|
| `client/src/hooks/useTerritory.js` | Add `useInterval` 30s refetch when tab visible |
| `client/src/hooks/useLeaderboard.js` | Same — poll every 60s |
| `client/src/hooks/usePageVisibility.js` | Pause polling when tab hidden |

## Optional: Ably channel

If using Ably free tier:

```bash
pip install ably
pip freeze > requirements.txt
```

- BE: after run claim, `await ably.channels.get("cells").publish("cells-updated", {"cells":[...], "ownerId": user_id})`
- FE: subscribe on Battlefield, patch local GeoJSON in place — no full refetch

Keep polling as fallback when `ABLY_API_KEY` not configured.

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_redis_null.py` | NullCache used when REDIS_URL unset; all ops no-op |
| `server/tests/test_leaderboard_cache.py` | ZADD then ZREVRANGE returns top-N; integration uses local redis or fakeredis |
| `server/tests/test_territory_cache.py` | Bbox key derivation stable; 10s TTL respected (fake clock) |
| `server/tests/test_cache_invalidation.py` | After claim, leaderboard ZSET reflects new score; territory:* keys flushed |

Use `fakeredis` for unit tests:

```bash
pip install fakeredis
```

## Acceptance

- `GET /leaderboard` w/ Redis populated returns from cache (verify via timing < 5ms or log line)
- Submitting a run → cached leaderboard ZSET updated; next request reflects new score w/o DB hit
- Bbox cache: 2nd identical territory request inside 10s served from cache
- FE Battlefield: after another user claims cells, page updates w/in 30s (polling) or instantly (Ably)
- When `REDIS_URL` empty: server still works, falls back to DB
- `pytest -v` → green

## Out of scope

- Multi-region cache invalidation
- Conflict resolution for simultaneous claims (last write wins, OK for MVP)
