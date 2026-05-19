"""Integration tests for /runs router.

Requires TEST_DATABASE_URL pointing at a Postgres with the schema applied.
"""

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
    reason="TEST_DATABASE_URL not set; skipping runs integration tests",
)


@pytest.fixture(autouse=True)
def _override_dsn(_env, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app.config import get_settings

    get_settings.cache_clear()
    pool_mod._pool = None
    from app.cache import redis_client

    redis_client._client = None
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
    await pool.execute("DELETE FROM claimed_cells; DELETE FROM runs; DELETE FROM users;")
    yield
    if pool_mod._pool is not None:
        await pool_mod._pool.execute(
            "DELETE FROM claimed_cells; DELETE FROM runs; DELETE FROM users;"
        )
        await pool_mod.close_pool()


async def _signup(client: AsyncClient, suffix: str | None = None) -> tuple[str, str]:
    """Signup helper. Returns (token, user_id)."""
    suffix = suffix or uuid.uuid4().hex[:8]
    resp = await client.post(
        "/auth/signup",
        json={
            "email": f"u-{suffix}@example.com",
            "username": f"u_{suffix}",
            "password": "secretsecret",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["token"], data["user"]["id"]


def _trace_around(lat: float, lng: float, n: int = 5) -> list[dict]:
    base = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)
    return [
        {
            "lat": lat + i * 0.00005,
            "lng": lng,
            "timestamp": (base + timedelta(seconds=i * 3)).isoformat(),
            "accuracy": 10,
        }
        for i in range(n)
    ]


def _run_body(trace: list[dict]) -> dict:
    return {
        "gps_trace": trace,
        "started_at": trace[0]["timestamp"],
        "ended_at": trace[-1]["timestamp"],
    }


@pytest.mark.asyncio
async def test_post_runs_requires_auth(app_client):
    resp = await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321)),
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_post_runs_valid_trace_201(app_client):
    token, user_id = await _signup(app_client)
    resp = await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=8)),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "run_id" in body
    assert body["cells_claimed"] > 0
    assert body["new_total"] == body["cells_claimed"]


@pytest.mark.asyncio
async def test_run_persists_in_db(app_client):
    token, user_id = await _signup(app_client)
    await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=8)),
        headers={"Authorization": f"Bearer {token}"},
    )
    pool = await pool_mod.get_pool()
    runs = await pool.fetch("SELECT id, user_id, cells_claimed FROM runs")
    assert len(runs) == 1
    assert runs[0]["cells_claimed"] > 0
    cells = await pool.fetch("SELECT h3_index FROM claimed_cells")
    assert len(cells) > 0


@pytest.mark.asyncio
async def test_ownership_transfers_on_second_user_overlap(app_client):
    token_a, user_a = await _signup(app_client, suffix="aaaa")
    trace = _trace_around(47.6062, -122.3321, n=10)
    await app_client.post(
        "/runs",
        json=_run_body(trace),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    pool = await pool_mod.get_pool()
    cells_a = {r["h3_index"] for r in await pool.fetch(
        "SELECT h3_index FROM claimed_cells WHERE user_id = $1", uuid.UUID(user_a)
    )}
    assert len(cells_a) > 0

    token_b, user_b = await _signup(app_client, suffix="bbbb")
    resp = await app_client.post(
        "/runs",
        json=_run_body(trace),
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 201
    cells_a_after = {r["h3_index"] for r in await pool.fetch(
        "SELECT h3_index FROM claimed_cells WHERE user_id = $1", uuid.UUID(user_a)
    )}
    cells_b = {r["h3_index"] for r in await pool.fetch(
        "SELECT h3_index FROM claimed_cells WHERE user_id = $1", uuid.UUID(user_b)
    )}
    # User B now owns every cell A used to own; A owns nothing.
    assert cells_b == cells_a, "user B should now own every cell A used to own"
    assert cells_a_after == set()


@pytest.mark.asyncio
async def test_rejects_run_over_4_hours(app_client):
    token, _ = await _signup(app_client)
    trace = _trace_around(47.6062, -122.3321, n=4)
    body = {
        "gps_trace": trace,
        "started_at": trace[0]["timestamp"],
        "ended_at": (
            datetime.fromisoformat(trace[0]["timestamp"]) + timedelta(hours=5)
        ).isoformat(),
    }
    resp = await app_client.post(
        "/runs", json=body, headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_rejects_single_point_trace(app_client):
    token, _ = await _signup(app_client)
    trace = _trace_around(47.6062, -122.3321, n=1)
    resp = await app_client.post(
        "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 422  # pydantic min_length=2


@pytest.mark.asyncio
async def test_rejects_trace_with_impossible_speed(app_client):
    token, _ = await _signup(app_client)
    base = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)
    # Two points 1 km apart in 1s; one extra point so trace still has length 3.
    trace = [
        {"lat": 47.6, "lng": -122.3, "timestamp": base.isoformat(), "accuracy": 10},
        {"lat": 47.609, "lng": -122.3, "timestamp": (base + timedelta(seconds=1)).isoformat(), "accuracy": 10},
    ]
    # Both ends survive filtering individually, but second is dropped → only 1 point remains
    body = {
        "gps_trace": trace,
        "started_at": trace[0]["timestamp"],
        "ended_at": trace[-1]["timestamp"],
    }
    resp = await app_client.post(
        "/runs", json=body, headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
    assert "noisy" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_get_runs_returns_user_history(app_client):
    token, _ = await _signup(app_client)
    await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=5)),
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = await app_client.get(
        "/runs", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) == 1
    assert "id" in runs[0]
    assert runs[0]["cells_claimed"] > 0


@pytest.mark.asyncio
async def test_get_run_by_id(app_client):
    token, _ = await _signup(app_client)
    submit = await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=5)),
        headers={"Authorization": f"Bearer {token}"},
    )
    run_id = submit.json()["run_id"]
    resp = await app_client.get(
        f"/runs/{run_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == run_id


@pytest.mark.asyncio
async def test_get_run_404_for_other_user(app_client):
    token_a, _ = await _signup(app_client, suffix="aaaa")
    submit = await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=5)),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    run_id = submit.json()["run_id"]

    token_b, _ = await _signup(app_client, suffix="bbbb")
    resp = await app_client.get(
        f"/runs/{run_id}", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert resp.status_code == 404
