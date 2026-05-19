"""Migration runner.

Scans `server/migrations/*.sql` in lexical order. For each file not yet
recorded in `schema_migrations`, opens a transaction, executes the SQL,
records the migration. Idempotent.

Uses a DIRECT (port 5432) Postgres connection — DDL requires session-level
prepared statements that PgBouncer transaction-mode pooling does not support.

Reads `DATABASE_URL_DIRECT`, falls back to `DATABASE_URL`.

Run:
    python -m scripts.migrate          # from server/
    python server/scripts/migrate.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = SERVER_DIR / "migrations"


def _dsn() -> str:
    load_dotenv(SERVER_DIR / ".env")
    dsn = os.getenv("DATABASE_URL_DIRECT") or os.getenv("DATABASE_URL")
    if not dsn:
        print("ERROR: DATABASE_URL_DIRECT or DATABASE_URL must be set", file=sys.stderr)
        sys.exit(1)
    return dsn


async def _ensure_schema_migrations(conn: asyncpg.Connection) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        """
    )


async def _applied(conn: asyncpg.Connection) -> set[str]:
    rows = await conn.fetch("SELECT name FROM schema_migrations")
    return {r["name"] for r in rows}


async def run(dsn: str | None = None) -> list[str]:
    """Apply pending migrations. Returns names applied this run."""
    dsn = dsn or _dsn()
    if not MIGRATIONS_DIR.exists():
        print(f"No migrations dir at {MIGRATIONS_DIR}", file=sys.stderr)
        return []

    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not files:
        print("No migration files found.")
        return []

    conn = await asyncpg.connect(dsn=dsn)
    applied_now: list[str] = []
    try:
        await _ensure_schema_migrations(conn)
        already = await _applied(conn)
        for path in files:
            name = path.name
            if name in already:
                print(f"skip   {name}")
                continue
            sql = path.read_text()
            print(f"apply  {name}")
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations(name) VALUES($1)", name
                )
            applied_now.append(name)
    finally:
        await conn.close()
    return applied_now


def main() -> None:
    applied = asyncio.run(run())
    print(f"\nApplied {len(applied)} migration(s).")


if __name__ == "__main__":
    main()
