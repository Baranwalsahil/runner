from __future__ import annotations

from uuid import UUID, uuid4

import fakeredis.aioredis
import pytest

from app.cache import leaderboard_cache


@pytest.fixture
async def cache():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield client
    await client.flushall()
    await client.aclose()


@pytest.mark.asyncio
async def test_upsert_and_top(cache):
    u1, u2, u3 = uuid4(), uuid4(), uuid4()
    await leaderboard_cache.upsert_user_total(cache, u1, 5)
    await leaderboard_cache.upsert_user_total(cache, u2, 12)
    await leaderboard_cache.upsert_user_total(cache, u3, 3)

    top = await leaderboard_cache.top_ids(cache, limit=10, offset=0)
    assert top[0] == (str(u2), 12)
    assert top[1] == (str(u1), 5)
    assert top[2] == (str(u3), 3)


@pytest.mark.asyncio
async def test_top_pagination(cache):
    for i in range(5):
        await leaderboard_cache.upsert_user_total(cache, uuid4(), i)
    page = await leaderboard_cache.top_ids(cache, limit=2, offset=1)
    assert len(page) == 2
    # Sorted desc: scores 4,3,2,1,0 → offset 1 → 3,2
    assert [score for _, score in page] == [3, 2]


@pytest.mark.asyncio
async def test_upsert_is_idempotent(cache):
    uid = uuid4()
    await leaderboard_cache.upsert_user_total(cache, uid, 7)
    await leaderboard_cache.upsert_user_total(cache, uid, 9)
    page = await leaderboard_cache.top_ids(cache, limit=10, offset=0)
    assert page == [(str(uid), 9)]
    assert await leaderboard_cache.total_users(cache) == 1


@pytest.mark.asyncio
async def test_empty_cache_returns_empty(cache):
    page = await leaderboard_cache.top_ids(cache, limit=10, offset=0)
    assert page == []
    assert await leaderboard_cache.total_users(cache) == 0
