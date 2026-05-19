from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

import fakeredis.aioredis
import pytest

from app.cache import territory_cache
from app.schemas.territory import Bounds, CellOut


@pytest.fixture
async def cache():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield client
    await client.flushall()
    await client.aclose()


def _bounds():
    return Bounds(sw_lat=47.60, sw_lng=-122.34, ne_lat=47.62, ne_lng=-122.32)


def _cell(idx: str = "8928d542c9bffff"):
    return CellOut(
        h3_index=idx,
        user_id=uuid4(),
        username="alpha",
        color="#c3f400",
        resolution=9,
        claim_count=1,
        claimed_at=datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc),
    )


def test_bbox_key_is_quantized_to_3_decimals():
    b = Bounds(sw_lat=47.6001, sw_lng=-122.3401, ne_lat=47.6201, ne_lng=-122.3201)
    key = territory_cache.bbox_key(b)
    assert key == "territory:47.600:-122.340:47.620:-122.320"


@pytest.mark.asyncio
async def test_set_then_get_round_trip(cache):
    bounds = _bounds()
    cells = [_cell("a"), _cell("b")]
    assert await territory_cache.get_bbox(cache, bounds) is None
    await territory_cache.set_bbox(cache, bounds, cells)
    hit = await territory_cache.get_bbox(cache, bounds)
    assert hit is not None
    assert {c.h3_index for c in hit} == {"a", "b"}


@pytest.mark.asyncio
async def test_ttl_is_short(cache):
    bounds = _bounds()
    await territory_cache.set_bbox(cache, bounds, [_cell("x")])
    ttl = await cache.ttl(territory_cache.bbox_key(bounds))
    # Should be at most 10s
    assert 0 < ttl <= territory_cache.TTL_SECONDS


@pytest.mark.asyncio
async def test_flush_all_removes_every_bbox(cache):
    b1 = Bounds(sw_lat=47.6, sw_lng=-122.34, ne_lat=47.62, ne_lng=-122.32)
    b2 = Bounds(sw_lat=40.7, sw_lng=-74.01, ne_lat=40.72, ne_lng=-74.0)
    await territory_cache.set_bbox(cache, b1, [_cell("a")])
    await territory_cache.set_bbox(cache, b2, [_cell("b")])
    # Also seed an unrelated key — should stay
    await cache.set("leaderboard:global", "untouched")
    deleted = await territory_cache.flush_all(cache)
    assert deleted == 2
    assert await territory_cache.get_bbox(cache, b1) is None
    assert await territory_cache.get_bbox(cache, b2) is None
    assert await cache.get("leaderboard:global") == "untouched"
