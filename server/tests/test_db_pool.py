"""Pool open/close + statement_cache_size=0 honored.

Integration-only: skipped unless TEST_DATABASE_URL is set.
"""

import os

import pytest

from app.db import pool as pool_mod

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping DB integration tests",
)


@pytest.fixture(autouse=True)
def _override_dsn(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app.config import get_settings

    get_settings.cache_clear()
    # Ensure clean pool per test.
    pool_mod._pool = None
    yield


@pytest.mark.asyncio
async def test_pool_select_one():
    pool = await pool_mod.get_pool()
    try:
        row = await pool.fetchrow("SELECT 1 AS n")
        assert row["n"] == 1
    finally:
        await pool_mod.close_pool()
    assert pool_mod._pool is None


@pytest.mark.asyncio
async def test_pool_statement_cache_disabled():
    pool = await pool_mod.get_pool()
    try:
        # asyncpg.Pool exposes _statement_cache_size on internal config; check via acquire
        async with pool.acquire() as conn:
            # asyncpg.Connection._stmt_cache exists; statement_cache_size=0 means cache is empty after queries
            await conn.fetch("SELECT 1")
            await conn.fetch("SELECT 1")
            cache = getattr(conn, "_stmt_cache", None)
            if cache is not None:
                # Length should remain 0 when caching disabled
                assert len(cache) == 0
    finally:
        await pool_mod.close_pool()
