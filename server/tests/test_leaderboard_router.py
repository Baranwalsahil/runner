"""Integration tests for /leaderboard router. Requires TEST_DATABASE_URL."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db import pool as pool_mod

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping leaderboard integration tests",
)


@pytest.fixture(autouse=True)
def _override_dsn(_env, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app.config import get_settings

    get_settings.cache_clear()
    pool_mod._pool = None
    yield


@pytest_asyncio.fixture
async def app_client(_override_dsn):
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


async def _signup(client: AsyncClient, suffix: str | None = None):
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


async def _submit_run(client: AsyncClient, token: str, lat: float, lng: float, n: int = 6):
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
async def test_leaderboard_requires_auth(app_client):
    resp = await app_client.get("/leaderboard")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_leaderboard_empty_returns_zero_rows(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/leaderboard", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    # only the signed-in viewer exists; total = 1 with 0 cells
    assert body["total"] == 1
    assert body["limit"] == 50
    assert body["offset"] == 0
    assert len(body["rows"]) == 1
    assert body["rows"][0]["total_cells"] == 0
    assert body["rows"][0]["rank"] == 1


@pytest.mark.asyncio
async def test_leaderboard_sort_desc_by_total_cells(app_client):
    token_a, _ = await _signup(app_client, suffix="aaaa")
    await _submit_run(app_client, token_a, 47.6062, -122.3321, n=10)

    token_b, _ = await _signup(app_client, suffix="bbbb")
    await _submit_run(app_client, token_b, 40.7128, -74.0060, n=4)

    resp = await app_client.get(
        "/leaderboard", headers={"Authorization": f"Bearer {token_a}"}
    )
    body = resp.json()
    cells = [r["total_cells"] for r in body["rows"]]
    assert cells == sorted(cells, reverse=True)
    ranks = [r["rank"] for r in body["rows"]]
    assert ranks == sorted(ranks)


@pytest.mark.asyncio
async def test_leaderboard_pagination(app_client):
    # Create 3 users w/ distinct cell counts.
    for i in range(3):
        token, _ = await _signup(app_client, suffix=f"u{i:02d}")
        await _submit_run(
            app_client, token, 47.60 + i * 0.01, -122.30 - i * 0.01, n=4 + i
        )
    # Use last token for auth
    resp = await app_client.get(
        "/leaderboard?limit=1&offset=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    body = resp.json()
    assert body["limit"] == 1
    assert body["offset"] == 1
    assert len(body["rows"]) == 1
    assert body["total"] == 3


@pytest.mark.asyncio
async def test_leaderboard_weekly_filter(app_client):
    token, _ = await _signup(app_client)
    await _submit_run(app_client, token, 47.6062, -122.3321, n=4)
    resp = await app_client.get(
        "/leaderboard?period=weekly",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["rows"]) == 1
    assert body["rows"][0]["total_cells"] >= 1


@pytest.mark.asyncio
async def test_leaderboard_invalid_period_422(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/leaderboard?period=nope",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_leaderboard_nearby(app_client):
    token, user_id = await _signup(app_client)
    resp = await app_client.get(
        "/leaderboard/nearby",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 1
    assert rows[0]["user_id"] == user_id


@pytest.mark.asyncio
async def test_leaderboard_row_shape_has_color(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/leaderboard", headers={"Authorization": f"Bearer {token}"}
    )
    row = resp.json()["rows"][0]
    for k in ("user_id", "username", "total_cells", "rank", "color"):
        assert k in row
    assert row["color"].startswith("#")
