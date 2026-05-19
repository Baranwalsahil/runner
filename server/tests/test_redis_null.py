"""NullCache fallback when REDIS_URL is unset."""

from __future__ import annotations

import pytest

from app.cache import redis_client


@pytest.fixture(autouse=True)
def _clear_singleton():
    redis_client._client = None
    yield
    redis_client._client = None


@pytest.mark.asyncio
async def test_null_cache_returned_when_redis_url_missing(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    from app.config import get_settings

    get_settings.cache_clear()

    client = await redis_client.get_cache()
    assert isinstance(client, redis_client.NullCache)
    assert redis_client.is_null(client)


@pytest.mark.asyncio
async def test_null_cache_get_returns_none():
    cache = redis_client.NullCache()
    assert await cache.get("anything") is None
    assert await cache.set("k", "v") is False
    assert await cache.delete("k") == 0
    assert await cache.zadd("z", {"u": 1.0}) == 0
    assert await cache.zrevrange("z", 0, -1) == []
    assert await cache.zcard("z") == 0


@pytest.mark.asyncio
async def test_null_cache_scan_iter_is_empty():
    cache = redis_client.NullCache()
    items = [k async for k in cache.scan_iter(match="*")]
    assert items == []
