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
            "DELETE FROM claimed_cell_users; DELETE FROM claimed_cells; DELETE FROM runs; DELETE FROM users;"
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
async def test_own_rerun_stacks_strength(app_client):
    """Re-running your own path raises your per-cell count and total strength."""
    token, user_id = await _signup(app_client)
    trace = _trace_around(47.6062, -122.3321, n=10)
    r1 = await app_client.post(
        "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token}"}
    )
    total1 = r1.json()["new_total"]
    cells = r1.json()["cells_claimed"]
    assert total1 == cells  # first pass: every cell at x1

    r2 = await app_client.post(
        "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token}"}
    )
    total2 = r2.json()["new_total"]
    assert total2 == 2 * cells  # second pass: every cell now x2

    pool = await pool_mod.get_pool()
    counts = await pool.fetch(
        "SELECT count FROM claimed_cell_users WHERE user_id = $1", uuid.UUID(user_id)
    )
    assert counts and all(c["count"] == 2 for c in counts)


@pytest.mark.asyncio
async def test_chip_reduces_prior_owner_strength(app_client):
    """A runs x3, B runs once: A drops to x2 and keeps ownership; B holds x1."""
    token_a, user_a = await _signup(app_client, suffix="aaaa")
    trace = _trace_around(47.6062, -122.3321, n=10)
    for _ in range(3):
        await app_client.post(
            "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token_a}"}
        )
    pool = await pool_mod.get_pool()
    a_cells = [r["h3_index"] for r in await pool.fetch(
        "SELECT h3_index FROM claimed_cell_users WHERE user_id = $1", uuid.UUID(user_a)
    )]
    assert a_cells and all(
        r["count"] == 3 for r in await pool.fetch(
            "SELECT count FROM claimed_cell_users WHERE user_id = $1", uuid.UUID(user_a)
        )
    )

    token_b, user_b = await _signup(app_client, suffix="bbbb")
    await app_client.post(
        "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token_b}"}
    )

    # A chipped 3 -> 2 on each shared cell, still owner (2 > 1).
    a_after = await pool.fetch(
        "SELECT count FROM claimed_cell_users WHERE user_id = $1", uuid.UUID(user_a)
    )
    assert a_after and all(r["count"] == 2 for r in a_after)
    b_after = await pool.fetch(
        "SELECT count FROM claimed_cell_users WHERE user_id = $1", uuid.UUID(user_b)
    )
    assert b_after and all(r["count"] == 1 for r in b_after)

    # Owner pointer still A (max count) on a shared cell.
    owner = await pool.fetchrow(
        "SELECT user_id, claim_count FROM claimed_cells WHERE h3_index = $1", a_cells[0]
    )
    assert owner["user_id"] == uuid.UUID(user_a)
    assert owner["claim_count"] == 2

    # total_cells = cells owned; total_strength = SUM(count).
    # A still owns every shared cell (x2 > x1); B owns none (loses ties).
    ta = await pool.fetchrow(
        "SELECT total_cells, total_strength FROM users WHERE id = $1", uuid.UUID(user_a)
    )
    tb = await pool.fetchrow(
        "SELECT total_cells, total_strength FROM users WHERE id = $1", uuid.UUID(user_b)
    )
    assert ta["total_cells"] == len(a_cells)
    assert ta["total_strength"] == 2 * len(a_cells)
    assert tb["total_cells"] == 0
    assert tb["total_strength"] == len(a_cells)


@pytest.mark.asyncio
async def test_territory_returns_shares(app_client):
    """Territory API exposes per-user shares for a contested cell."""
    token_a, user_a = await _signup(app_client, suffix="aaaa")
    trace = _trace_around(47.6062, -122.3321, n=10)
    for _ in range(2):
        await app_client.post(
            "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token_a}"}
        )
    token_b, _ = await _signup(app_client, suffix="bbbb")
    await app_client.post(
        "/runs", json=_run_body(trace), headers={"Authorization": f"Bearer {token_b}"}
    )
    bounds = "47.60,-122.34,47.62,-122.32"
    resp = await app_client.get(
        f"/territory?bounds={bounds}", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert resp.status_code == 200
    cells = resp.json()
    contested = [c for c in cells if len(c["shares"]) > 1]
    assert contested, "expected at least one contested cell with 2 shares"
    sh = contested[0]["shares"]
    # Sorted strongest-first; counts present.
    assert sh[0]["count"] >= sh[-1]["count"]
    assert all("color" in s and "count" in s for s in sh)


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


def _trace_with_alt(lat: float, lng: float, alts: list[float]) -> list[dict]:
    base = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)
    return [
        {
            "lat": lat + i * 0.00005,
            "lng": lng,
            "alt": alt,
            "timestamp": (base + timedelta(seconds=i * 3)).isoformat(),
            "accuracy": 10,
        }
        for i, alt in enumerate(alts)
    ]


@pytest.mark.asyncio
async def test_run_stores_elevation_gain(app_client):
    """avg_elevation_m column now stores cumulative elevation GAIN.

    [100, 150, 200]: two rises of 50 m each → gain = 100 m (well above 3 m
    threshold), so stored value should be 100.0.
    """
    token, _ = await _signup(app_client)
    submit = await app_client.post(
        "/runs",
        json=_run_body(_trace_with_alt(47.6062, -122.3321, [100.0, 150.0, 200.0])),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 201, submit.text
    run_id = submit.json()["run_id"]
    resp = await app_client.get(
        f"/runs/{run_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    # Gain = 50 + 50 = 100.0 m (not the old mean of 150.0)
    assert resp.json()["avg_elevation_m"] == 100.0


@pytest.mark.asyncio
async def test_run_without_altitude_stores_null(app_client):
    token, _ = await _signup(app_client)
    submit = await app_client.post(
        "/runs",
        json=_run_body(_trace_around(47.6062, -122.3321, n=5)),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 201, submit.text
    run_id = submit.json()["run_id"]
    resp = await app_client.get(
        f"/runs/{run_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["avg_elevation_m"] is None
