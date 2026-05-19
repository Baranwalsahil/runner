"""End-to-end cache behavior. Requires TEST_DATABASE_URL."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.cache import leaderboard_cache, redis_client, territory_cache
from app.db import pool as pool_mod

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping cache integration tests",
)


@pytest.fixture(autouse=True)
def _override_dsn(_env, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app.config import get_settings

    get_settings.cache_clear()
    pool_mod._pool = None
    redis_client._client = None
    yield


@pytest_asyncio.fixture
async def fake_cache(monkeypatch):
    """Install a fakeredis instance as the cache singleton."""
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    redis_client._client = client
    yield client
    await client.flushall()
    await client.aclose()
    redis_client._client = None


@pytest_asyncio.fixture
async def app_client(_override_dsn, fake_cache):
    from app.config import get_settings
    from app.main import create_app

    get_settings.cache_clear()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(autouse=True)
async def _clean_db(_override_dsn):
    pool = await pool_mod.get_pool()
    await pool.execute(
        "DELETE FROM claimed_cells; DELETE FROM runs; DELETE FROM users;"
    )
    yield
    if pool_mod._pool is not None:
        await pool_mod._pool.execute(
            "DELETE FROM claimed_cells; DELETE FROM runs; DELETE FROM users;"
        )
        await pool_mod.close_pool()


async def _signup(client, suffix=None):
    suffix = suffix or uuid.uuid4().hex[:8]
    resp = await client.post(
        "/auth/signup",
        json={
            "email": f"u-{suffix}@example.com",
            "username": f"u_{suffix}",
            "password": "secretsecret",
        },
    )
    data = resp.json()
    return data["token"], data["user"]["id"]


async def _submit_run(client, token, lat=47.6062, lng=-122.3321, n=6):
    base_t = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)
    trace = [
        {
            "lat": lat + i * 0.00005,
            "lng": lng,
            "timestamp": (base_t + timedelta(seconds=i * 3)).isoformat(),
            "accuracy": 10,
        }
        for i in range(n)
    ]
    return await client.post(
        "/runs",
        json={
            "gps_trace": trace,
            "started_at": trace[0]["timestamp"],
            "ended_at": trace[-1]["timestamp"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )


@pytest.mark.asyncio
async def test_claim_populates_leaderboard_zset(app_client, fake_cache):
    token, user_id = await _signup(app_client)
    resp = await _submit_run(app_client, token)
    assert resp.status_code == 201

    top = await leaderboard_cache.top_ids(fake_cache, limit=10, offset=0)
    assert len(top) == 1
    assert top[0][0] == user_id
    assert top[0][1] >= 1


@pytest.mark.asyncio
async def test_ownership_transfer_updates_both_zset_scores(app_client, fake_cache):
    token_a, user_a = await _signup(app_client, suffix="aaaa")
    await _submit_run(app_client, token_a)

    top_after_a = dict(
        await leaderboard_cache.top_ids(fake_cache, limit=10, offset=0)
    )
    a_score_initial = top_after_a[user_a]
    assert a_score_initial >= 1

    token_b, user_b = await _signup(app_client, suffix="bbbb")
    await _submit_run(app_client, token_b)

    top_after_b = dict(
        await leaderboard_cache.top_ids(fake_cache, limit=10, offset=0)
    )
    # A should drop to 0, B should hold the cells.
    assert top_after_b[user_a] == 0
    assert top_after_b[user_b] == a_score_initial


@pytest.mark.asyncio
async def test_territory_request_populates_bbox_cache(app_client, fake_cache):
    token, _ = await _signup(app_client)
    await _submit_run(app_client, token)

    bounds_qs = "47.59,-122.36,47.63,-122.30"
    resp = await app_client.get(
        f"/territory?bounds={bounds_qs}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    keys = []
    async for k in fake_cache.scan_iter(match="territory:*"):
        keys.append(k if isinstance(k, str) else k.decode())
    assert len(keys) == 1


@pytest.mark.asyncio
async def test_subsequent_claim_flushes_territory_cache(app_client, fake_cache):
    token, _ = await _signup(app_client)
    await _submit_run(app_client, token)
    bounds_qs = "47.59,-122.36,47.63,-122.30"
    await app_client.get(
        f"/territory?bounds={bounds_qs}",
        headers={"Authorization": f"Bearer {token}"},
    )
    keys_before = [
        k async for k in fake_cache.scan_iter(match="territory:*")
    ]
    assert len(keys_before) == 1

    # Second run → flush_all
    await _submit_run(app_client, token, lat=47.6500, lng=-122.31, n=4)
    keys_after = [
        k async for k in fake_cache.scan_iter(match="territory:*")
    ]
    assert keys_after == []


@pytest.mark.asyncio
async def test_leaderboard_endpoint_reads_from_cache(app_client, fake_cache):
    token, user_id = await _signup(app_client)
    await _submit_run(app_client, token)

    # Wipe DB users rank-relevant state but leave ZSET intact to prove cache hit.
    # Specifically: zero out users.total_cells in DB so a DB-fallback would return 0,
    # then call /leaderboard and assert it reflects ZSET score.
    pool = await pool_mod.get_pool()
    expected_score = (
        await leaderboard_cache.top_ids(fake_cache, limit=10, offset=0)
    )[0][1]
    await pool.execute("UPDATE users SET total_cells = 0")

    resp = await app_client.get(
        "/leaderboard", headers={"Authorization": f"Bearer {token}"}
    )
    body = resp.json()
    assert body["rows"][0]["user_id"] == user_id
    assert body["rows"][0]["total_cells"] == expected_score
