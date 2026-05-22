"""Integration tests for /users/me PATCH route.

Requires TEST_DATABASE_URL.
"""

from __future__ import annotations

import os
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db import pool as pool_mod

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping users integration tests",
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
async def _clean_users(_override_dsn):
    pool = await pool_mod.get_pool()
    await pool.execute("DELETE FROM users")
    yield
    if pool_mod._pool is not None:
        await pool_mod._pool.execute("DELETE FROM users")
        await pool_mod.close_pool()


async def _signup(client: AsyncClient) -> tuple[str, dict]:
    suffix = uuid.uuid4().hex[:8]
    creds = {
        "email": f"user-{suffix}@example.com",
        "username": f"user_{suffix}",
        "password": "correct horse battery staple",
    }
    resp = await client.post("/auth/signup", json=creds)
    assert resp.status_code == 201, resp.text
    return resp.json()["token"], creds


@pytest.mark.asyncio
async def test_patch_me_updates_first_last_name(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.patch(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": "Sahil", "last_name": "Baranwal"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["first_name"] == "Sahil"
    assert body["last_name"] == "Baranwal"


@pytest.mark.asyncio
async def test_patch_me_updates_username(app_client):
    token, _ = await _signup(app_client)
    new_username = f"renamed_{uuid.uuid4().hex[:6]}"
    resp = await app_client.patch(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": new_username},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["username"] == new_username


@pytest.mark.asyncio
async def test_patch_me_duplicate_username_409(app_client):
    # Create two users
    token_a, _ = await _signup(app_client)
    _, creds_b = await _signup(app_client)
    resp = await app_client.patch(
        "/users/me",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"username": creds_b["username"]},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_patch_me_without_token_401(app_client):
    resp = await app_client.patch("/users/me", json={"first_name": "X"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_patch_me_invalid_username_chars_422(app_client):
    token, _ = await _signup(app_client)
    resp = await app_client.patch(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"username": "has space!"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_me_includes_first_last_name_after_update(app_client):
    token, _ = await _signup(app_client)
    await app_client.patch(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": "Alice", "last_name": "Wonder"},
    )
    resp = await app_client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["first_name"] == "Alice"
    assert body["last_name"] == "Wonder"
