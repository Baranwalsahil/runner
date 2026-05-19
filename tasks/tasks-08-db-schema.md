# Task 08 — Database Schema + Migrations (Postgres + PostGIS + asyncpg)

## Goal

Define Postgres + PostGIS schema. Wire `asyncpg` pool to backend. Add
migration runner. Schema based on CLAUDE.md § Database Schema (plus
`password_hash` for own-JWT auth — task-09).

> **DB host**: deferred. MVP runs against any managed or self-hosted
> Postgres with PostGIS available. Local dev uses docker postgis.
> Production host is picked at deploy time (task-13).

## Prereqs

- Task 07 done
- Postgres available with PostGIS + pgcrypto extensions enabled. Local:
  `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:16-3.4`
- Two connection strings:
  - `DATABASE_URL` — used by app runtime. If host fronts Postgres with a
    transaction-mode pooler (e.g. PgBouncer), this is the pooler URL.
  - `DATABASE_URL_DIRECT` — direct Postgres (no proxy). Required for
    migrations because DDL needs prepared statements. Optional; falls
    back to `DATABASE_URL` when no proxy in use.

## Install

```bash
cd /home/sahil/runner/server
source .venv/bin/activate
pip install asyncpg
pip freeze > requirements.txt
```

## Files to create

| Path | Purpose |
|------|---------|
| `server/app/db/__init__.py` | empty |
| `server/app/db/pool.py` | `asyncpg` pool singleton: `get_pool()` lazy-init from `settings.database_url`. **MUST set `statement_cache_size=0`** because a transaction-mode PgBouncer-style proxy forbids prepared statements. Harmless against direct PG. Exposes `fetch`, `fetchrow`, `execute`, `transaction()`. |
| `server/app/db/schema.sql` | Schema block (`users` w/ `password_hash`, `runs`, `claimed_cells`) + `CREATE EXTENSION IF NOT EXISTS postgis;` + `CREATE EXTENSION IF NOT EXISTS pgcrypto;` |
| `server/migrations/001_init.sql` | Same content as `schema.sql`, idempotent (`IF NOT EXISTS` everywhere) |
| `server/scripts/migrate.py` | CLI: scans `migrations/*.sql` sorted, opens **direct** connection (not pooler — DDL needs prepared statements), for each unapplied migration: BEGIN, execute file, INSERT into `schema_migrations(name, applied_at)`, COMMIT. Skips already-applied. Reads `DATABASE_URL_DIRECT` env var, falls back to `DATABASE_URL`. |
| `shared/constants.py` | `H3_RESOLUTION = 9`, `OWNER_PALETTE = ["#c3f400","#00dbe9","#ffb4aa","#7df4ff","#ffdad5","#ff6b6b"]`, `MAX_SPEED_MPS = 12`, `MAX_RUN_HOURS = 4`, `MAX_CELLS_PER_RUN = 2000`, `GPS_ACCURACY_THRESHOLD_M = 50` |
| `shared/constants.js` | Same values for client |

Wire `migrate.py` invocation:

```bash
python -m scripts.migrate          # from server/
# or
python server/scripts/migrate.py
```

Document in `server/Makefile` as `make migrate`.

## Env

`server/.env`:

```
# Runtime URL — app pool. If using a transaction-mode pooler (e.g. PgBouncer),
# this is the pooled DSN. Otherwise same as direct.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/territory_run

# Direct URL (optional) — migrations + admin work, no proxy. Falls back to
# DATABASE_URL when unset.
DATABASE_URL_DIRECT=postgresql://postgres:postgres@localhost:5432/territory_run
```

Local dev (docker postgis): both vars point to
`postgresql://postgres:postgres@localhost:5432/territory_run`.

`app/config.py` has `database_url_direct: str | None`. Falls back to
`database_url` when missing.

## pool.py skeleton

```python
import asyncpg
from app.config import get_settings

_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=10,
            command_timeout=30,
            statement_cache_size=0,   # required for transaction-mode PgBouncer; harmless for direct PG
        )
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
```

Wire to FastAPI lifespan: open on startup, close on shutdown.

## Schema additions beyond CLAUDE.md

- `users.password_hash VARCHAR(255) NOT NULL` — bcrypt hash for own-JWT
  auth (task-09).
- Idempotent guard in `001_init.sql`: `ALTER TABLE users ADD COLUMN IF
  NOT EXISTS password_hash`, then backfill `'!disabled'` on legacy rows,
  then `SET NOT NULL`. Lets the migration rerun cleanly on environments
  that applied an earlier version.

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_migrate.py` | Spin up disposable DB (testcontainers postgis OR rely on local `TEST_DATABASE_URL`), run migrate twice, assert tables exist + 2nd run is no-op |
| `server/tests/test_db_pool.py` | Open pool, `SELECT 1`, close — no leak. `statement_cache_size=0` honored. |

Use `pytest-asyncio`. Skip integration tests gracefully when
`TEST_DATABASE_URL` unset.

## Acceptance

- `python -m scripts.migrate` against a fresh Postgres creates `users`,
  `runs`, `claimed_cells`, `schema_migrations` + indexes + extensions
- Re-running migrate is idempotent (no errors, no duplicate rows in
  `schema_migrations`)
- `psql $DATABASE_URL_DIRECT -c "\dx"` shows `postgis` + `pgcrypto`
- Spatial index on `runs.gps_trace` confirmed: `\d runs` shows GIST index
- `pytest -v` → green when test DB URL set; skipped cleanly otherwise

## Out of scope

- `pg_h3` extension — h3-py handles indexing in app code
- Seed data — manual for now
- ORM (SQLAlchemy/Tortoise) — raw SQL via asyncpg
- Row-Level Security (RLS): off for MVP, auth enforced in FastAPI deps
- Realtime / CDC — task-12 ships poll-based updates only
