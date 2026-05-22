"""Unit tests for run_service.feed_runs helpers and the /runs/feed router.

These tests do not require a real database. DB-integration tests are in
test_runs_router.py (guarded by TEST_DATABASE_URL).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.run_service import _time_ago, feed_runs
from app.schemas.run import RunFeedItem


# ---------------------------------------------------------------------------
# _time_ago unit tests
# ---------------------------------------------------------------------------

class TestTimeAgo:
    def _ago(self, **kwargs):
        """Return a UTC datetime that is `kwargs` in the past."""
        return datetime.now(timezone.utc) - timedelta(**kwargs)

    def test_just_now(self):
        assert _time_ago(self._ago(seconds=30)) == "just now"

    def test_minutes(self):
        assert _time_ago(self._ago(minutes=5)) == "5m ago"

    def test_hours(self):
        assert _time_ago(self._ago(hours=3)) == "3h ago"

    def test_days(self):
        assert _time_ago(self._ago(days=2)) == "2d ago"

    def test_exactly_one_minute(self):
        assert _time_ago(self._ago(minutes=1)) == "1m ago"

    def test_naive_datetime_treated_as_utc(self):
        naive = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10)
        result = _time_ago(naive)
        assert result == "10m ago"


# ---------------------------------------------------------------------------
# feed_runs service unit tests with a mocked asyncpg pool
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_feed_runs_empty_when_no_rows():
    """feed_runs returns [] when the DB has no runs."""
    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[])

    result = await feed_runs(mock_pool, limit=12)

    assert result == []


@pytest.mark.asyncio
async def test_feed_runs_returns_feed_items():
    """feed_runs maps DB rows to RunFeedItem objects correctly."""
    started_at = datetime.now(timezone.utc) - timedelta(minutes=15)
    fake_row = {
        "id": uuid4(),
        "cells_claimed": 5,
        "started_at": started_at,
        "username": "testrunner",
    }

    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[fake_row])

    result = await feed_runs(mock_pool, limit=12)

    assert len(result) == 1
    item = result[0]
    assert isinstance(item, RunFeedItem)
    assert item.type == "gained"
    assert item.label == "Territory Gained"
    assert item.user == "@testrunner"
    assert item.title == "5 cells claimed"
    assert item.accent is True       # first item is always accented
    assert item.challengeable is False
    assert item.subject_label == "by"
    assert item.time == "15m ago"


@pytest.mark.asyncio
async def test_feed_runs_only_first_item_accented():
    """Only the first feed item gets accent=True."""
    started_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    fake_rows = [
        {"id": uuid4(), "cells_claimed": 3, "started_at": started_at, "username": "a"},
        {"id": uuid4(), "cells_claimed": 2, "started_at": started_at, "username": "b"},
        {"id": uuid4(), "cells_claimed": 1, "started_at": started_at, "username": "c"},
    ]

    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=fake_rows)

    result = await feed_runs(mock_pool, limit=12)

    assert result[0].accent is True
    assert result[1].accent is False
    assert result[2].accent is False


@pytest.mark.asyncio
async def test_feed_runs_singular_cell_title():
    """When cells_claimed==1 the title uses singular 'cell', not 'cells'."""
    started_at = datetime.now(timezone.utc) - timedelta(hours=1)
    fake_row = {
        "id": uuid4(),
        "cells_claimed": 1,
        "started_at": started_at,
        "username": "solo",
    }

    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[fake_row])

    result = await feed_runs(mock_pool, limit=12)

    assert result[0].title == "1 cell claimed"


@pytest.mark.asyncio
async def test_feed_runs_passes_limit_to_query():
    """feed_runs passes the limit arg to the DB query."""
    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[])

    await feed_runs(mock_pool, limit=7)

    call_args = mock_pool.fetch.call_args
    # Second positional arg (after SQL) is the limit
    actual_limit = call_args[0][1]
    assert actual_limit == 7


# ---------------------------------------------------------------------------
# /runs/feed router — uses FastAPI dependency_overrides (no real DB)
# ---------------------------------------------------------------------------

def _make_user(user_id=None, username="runner42"):
    """Build a minimal User object for dependency overrides."""
    from app.schemas.auth import User

    return User(
        id=user_id or uuid4(),
        username=username,
        email=f"{username}@example.com",
        created_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_feed_route_requires_auth(app):
    """GET /runs/feed without a bearer token must return 401.

    We override get_db_pool to prevent a real DB connection attempt, but
    do NOT override get_current_user so auth is still enforced.
    """
    from httpx import ASGITransport, AsyncClient
    from app.deps import get_db_pool

    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[])

    async def override_pool():
        return mock_pool

    app.dependency_overrides[get_db_pool] = override_pool
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/runs/feed")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_feed_route_returns_list_via_override(app):
    """GET /runs/feed with dependency overrides returns feed item list."""
    from httpx import ASGITransport, AsyncClient
    from app.deps import get_current_user, get_db_pool

    fake_user_id = uuid4()
    started_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    fake_row = {
        "id": uuid4(),
        "cells_claimed": 4,
        "started_at": started_at,
        "username": "runner42",
    }

    mock_pool = AsyncMock()
    mock_pool.fetch = AsyncMock(return_value=[fake_row])

    async def override_pool():
        return mock_pool

    async def override_user():
        return _make_user(user_id=fake_user_id, username="runner42")

    app.dependency_overrides[get_db_pool] = override_pool
    app.dependency_overrides[get_current_user] = override_user

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/runs/feed", headers={"Authorization": "Bearer tok"})
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["user"] == "@runner42"
    assert items[0]["title"] == "4 cells claimed"
    assert items[0]["type"] == "gained"
    assert items[0]["accent"] is True
