from __future__ import annotations

import asyncpg

from app.config import get_settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Lazy singleton asyncpg pool.

    `statement_cache_size=0` is required when the DSN points at a
    transaction-mode PgBouncer pool (or any session-state-less proxy):
    those modes forbid prepared statements that span connections.
    Harmless against a direct Postgres connection.
    """
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=10,
            command_timeout=30,
            statement_cache_size=0,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def fetch(query: str, *args):
    pool = await get_pool()
    return await pool.fetch(query, *args)


async def fetchrow(query: str, *args):
    pool = await get_pool()
    return await pool.fetchrow(query, *args)


async def execute(query: str, *args) -> str:
    pool = await get_pool()
    return await pool.execute(query, *args)


async def transaction():
    """Returns a connection acquisition context manager.

    Usage:
        async with await transaction() as conn:
            async with conn.transaction():
                await conn.execute(...)
    """
    pool = await get_pool()
    return pool.acquire()
