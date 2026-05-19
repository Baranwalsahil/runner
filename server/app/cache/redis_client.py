"""Redis client singleton with NullCache fallback.

When `REDIS_URL` is unset, every cache op becomes a no-op (returns
None/0/empty). Callers can treat the cache as best-effort: a miss simply
falls through to the DB.
"""

from __future__ import annotations

import redis.asyncio as redis

from app.config import get_settings


class NullCache:
    """No-op cache. Mirrors the subset of redis.asyncio.Redis the app uses."""

    async def get(self, *_a, **_k):
        return None

    async def set(self, *_a, **_k):
        return False

    async def setex(self, *_a, **_k):
        return False

    async def delete(self, *_a, **_k):
        return 0

    async def zadd(self, *_a, **_k):
        return 0

    async def zrevrange(self, *_a, **_k):
        return []

    async def zrange(self, *_a, **_k):
        return []

    async def zcard(self, *_a, **_k):
        return 0

    async def scan_iter(self, *_a, **_k):
        # Empty async generator
        if False:
            yield

    async def close(self):
        return None


_client: redis.Redis | NullCache | None = None


async def get_cache() -> redis.Redis | NullCache:
    """Lazy singleton. Reads REDIS_URL via settings at first call."""
    global _client
    if _client is not None:
        return _client
    settings = get_settings()
    if not settings.redis_url:
        _client = NullCache()
    else:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def close_cache() -> None:
    global _client
    if _client is None:
        return
    try:
        await _client.close()
    finally:
        _client = None


def is_null(client) -> bool:
    return isinstance(client, NullCache)
