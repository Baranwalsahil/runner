"""Integration tests for /territory router. Requires TEST_DATABASE_URL."""

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
    reason="TEST_DATABASE_URL not set; skipping territory integration tests",
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


async def _submit_run(client: AsyncClient, token: str, base_lat: float, base_lng: float, n: int = 6):
    base_t = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)
    trace = [
        {
            "lat": base_lat + i * 0.00005,
            "lng": base_lng,
            "timestamp": (base_t + timedelta(seconds=i * 3)).isoformat(),
            "accuracy": 10,
        }
        for i in range(n)
    ]
    body = {
        "gps_trace": trace,
        "started_at": trace[0]["timestamp"],
        "ended_at": trace[-1]["timestamp"],
    }
    return await client.post(
        "/runs", json=body, headers={"Authorization": f"Bearer {token}"}
    )


@pytest.mark.asyncio
async def test_territory_requires_auth(app_client):
    resp = await app_client.get("/territory?bounds=47.6,-122.34,47.62,-122.32")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_territory_missing_bounds_422(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/territory", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_territory_bad_bounds_422(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/territory?bounds=1,2,3",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_territory_empty_returns_array(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/territory?bounds=47.6,-122.34,47.62,-122.32",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_territory_returns_claimed_cells_in_bbox(app_client):
    token, _ = await _signup(app_client)
    await _submit_run(app_client, token, 47.6062, -122.3321, n=8)

    resp = await app_client.get(
        "/territory?bounds=47.6,-122.34,47.62,-122.32",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    cells = resp.json()
    assert len(cells) >= 1
    c = cells[0]
    assert c["h3_index"]
    assert c["user_id"]
    assert c["username"].startswith("u_")
    assert c["color"].startswith("#")
    assert c["resolution"] == 9


@pytest.mark.asyncio
async def test_territory_excludes_out_of_bbox(app_client):
    token, _ = await _signup(app_client)
    await _submit_run(app_client, token, 47.6062, -122.3321, n=6)
    # Query NYC area — nothing should match
    resp = await app_client.get(
        "/territory?bounds=40.7,-74.01,40.72,-74.0",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_territory_user_endpoint(app_client):
    token, user_id = await _signup(app_client)
    await _submit_run(app_client, token, 47.6062, -122.3321, n=6)
    resp = await app_client.get(
        f"/territory/user/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    cells = resp.json()
    assert len(cells) >= 1
    for c in cells:
        assert c["user_id"] == user_id


@pytest.mark.asyncio
async def test_territory_stats(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.get(
        "/territory/stats", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"total_cells": 0, "total_users": 0, "contested_cells": 0}

    await _submit_run(app_client, token, 47.6062, -122.3321, n=6)
    resp = await app_client.get(
        "/territory/stats", headers={"Authorization": f"Bearer {token}"}
    )
    body = resp.json()
    assert body["total_cells"] > 0
    assert body["total_users"] == 1
