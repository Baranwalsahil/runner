"""Integration tests for auth routes.

Requires TEST_DATABASE_URL pointing at a Postgres with the schema applied.
Skipped cleanly when unset (same pattern as task-08).
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.db import pool as pool_mod

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping auth integration tests",
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


def _unique_creds():
    suffix = uuid.uuid4().hex[:8]
    return {
        "email": f"user-{suffix}@example.com",
        "username": f"user_{suffix}",
        "password": "correct horse battery staple",
    }


@pytest.mark.asyncio
async def test_signup_creates_user_and_returns_token(app_client):
    creds = _unique_creds()
    resp = await app_client.post("/auth/signup", json=creds)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["user"]["email"] == creds["email"]
    assert data["user"]["username"] == creds["username"]
    assert "id" in data["user"]
    assert isinstance(data["token"], str) and data["token"].count(".") == 2


@pytest.mark.asyncio
async def test_signup_duplicate_email_409(app_client):
    creds = _unique_creds()
    await app_client.post("/auth/signup", json=creds)
    dup = {**creds, "username": creds["username"] + "x"}
    resp = await app_client.post("/auth/signup", json=dup)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_signup_validates_short_password(app_client):
    creds = _unique_creds()
    creds["password"] = "short"
    resp = await app_client.post("/auth/signup", json=creds)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_valid_returns_token(app_client):
    creds = _unique_creds()
    await app_client.post("/auth/signup", json=creds)
    resp = await app_client.post(
        "/auth/login",
        json={"email": creds["email"], "password": creds["password"]},
    )
    assert resp.status_code == 200, resp.text
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password_401_generic(app_client):
    creds = _unique_creds()
    await app_client.post("/auth/signup", json=creds)
    resp = await app_client.post(
        "/auth/login",
        json={"email": creds["email"], "password": "wrong-password-here"},
    )
    assert resp.status_code == 401
    assert resp.json()["message"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_unknown_email_401_generic(app_client):
    resp = await app_client.post(
        "/auth/login",
        json={"email": "no-such@example.com", "password": "anythinghere"},
    )
    assert resp.status_code == 401
    assert resp.json()["message"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_me_without_token_401(app_client):
    resp = await app_client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_token_returns_user(app_client):
    creds = _unique_creds()
    signup = await app_client.post("/auth/signup", json=creds)
    token = signup.json()["token"]
    resp = await app_client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == creds["email"]


@pytest.mark.asyncio
async def test_me_with_expired_token_401(app_client):
    from app.config import get_settings

    settings = get_settings()
    expired = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "x@example.com",
            "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
            "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    resp = await app_client.get(
        "/auth/me", headers={"Authorization": f"Bearer {expired}"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout_204(app_client):
    resp = await app_client.post("/auth/logout")
    assert resp.status_code == 204
