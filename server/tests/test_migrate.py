"""Migration runner: applies once, idempotent on rerun.

Integration-only: skipped unless TEST_DATABASE_URL is set. Uses a DIRECT
Postgres URL — the migrator needs DDL + prepared statements.
"""

import os

import asyncpg
import pytest

from scripts import migrate

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping migration integration tests",
)


@pytest.fixture
def dsn() -> str:
    return os.environ["TEST_DATABASE_URL"]


async def _drop_all(dsn: str) -> None:
    conn = await asyncpg.connect(dsn=dsn)
    try:
        await conn.execute(
            """
            DROP TABLE IF EXISTS claimed_cells CASCADE;
            DROP TABLE IF EXISTS runs CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS schema_migrations CASCADE;
            """
        )
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_migrate_applies_and_is_idempotent(dsn):
    await _drop_all(dsn)

    applied_first = await migrate.run(dsn=dsn)
    assert "001_init.sql" in applied_first

    # Second run: nothing new applied.
    applied_second = await migrate.run(dsn=dsn)
    assert applied_second == []

    conn = await asyncpg.connect(dsn=dsn)
    try:
        tables = {
            r["tablename"]
            for r in await conn.fetch(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
            )
        }
        for t in ("users", "runs", "claimed_cells", "schema_migrations"):
            assert t in tables, f"missing table {t}"

        # GIST spatial index on runs.gps_trace
        idx = await conn.fetch(
            """
            SELECT i.relname AS name, am.amname AS method
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_am am ON am.oid = i.relam
            WHERE t.relname = 'runs'
            """
        )
        assert any(r["method"] == "gist" for r in idx), "expected GIST index on runs"

        # Extensions present
        exts = {
            r["extname"]
            for r in await conn.fetch("SELECT extname FROM pg_extension")
        }
        assert "postgis" in exts
        assert "pgcrypto" in exts

        # schema_migrations has exactly one row for 001_init.sql
        rows = await conn.fetch(
            "SELECT name FROM schema_migrations WHERE name = '001_init.sql'"
        )
        assert len(rows) == 1
    finally:
        await conn.close()
