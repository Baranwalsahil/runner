# Task 08 — Database Schema + Migrations (Supabase Postgres + asyncpg)

## Goal

Define Postgres + PostGIS schema on Supabase. Wire `asyncpg` pool to backend. Add migration runner. Schema verbatim from CLAUDE.md § Database Schema.

> **DB provider**: Supabase Postgres (same project already used for auth in task 09). No separate Neon project. Local dev uses docker postgis or local PG.

## Prereqs

- Task 07 done
- Supabase project created (per CLAUDE.md § Step 2) — copy:
  - **Direct connection string** (port `5432`) for migrations
  - **Pooled / Transaction connection string** (port `6543`) for runtime
  - Both available in Supabase dashboard → Settings → Database → Connection string
- Enable PostGIS in Supabase: dashboard → Database → Extensions → search "postgis" → enable
- Local alternative: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis`

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
| `server/app/db/pool.py` | `asyncpg` pool singleton: `get_pool()` lazy-init from `settings.database_url`. **MUST set `statement_cache_size=0`** because Supabase pooled URL runs PgBouncer transaction mode (no prepared statements). SSL handled by URL `sslmode=require` when prod. Exposes `fetch`, `fetchrow`, `execute`, `transaction()`. |
| `server/app/db/schema.sql` | Copy schema block from CLAUDE.md verbatim + `CREATE EXTENSION IF NOT EXISTS postgis;` + `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (for `gen_random_uuid()`) |
| `server/migrations/001_init.sql` | Same content as `schema.sql`, idempotent (`IF NOT EXISTS` everywhere) |
| `server/scripts/migrate.py` | CLI: scans `migrations/*.sql` sorted, opens **direct** connection (not pooler — DDL needs prepared statements), for each unapplied migration: BEGIN, execute file, INSERT into `schema_migrations(name, applied_at)`, COMMIT. Skips already-applied. Reads `DATABASE_URL_DIRECT` env var, falls back to `DATABASE_URL` for local dev. |
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
# Pooled / transaction-mode URL (app runtime — use this for the FastAPI pool)
DATABASE_URL=postgresql://postgres.PROJECT:[PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres

# Direct URL (migrations + admin work — port 5432, full SQL features)
DATABASE_URL_DIRECT=postgresql://postgres:[PASSWORD]@db.PROJECT.supabase.co:5432/postgres
```

Local dev (docker postgis): both vars point to `postgresql://postgres:postgres@localhost:5432/territory_run`.

Update `app/config.py` to add `database_url_direct: str | None = Field(default=None)`. Falls back to `database_url` when missing.

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
            statement_cache_size=0,   # required for Supabase PgBouncer transaction mode
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

None for MVP. Strict copy.

## Realtime prep (for task 12)

After applying schema, enable Realtime on the `claimed_cells` table in Supabase dashboard:

```
Database → Replication → enable `claimed_cells` for `supabase_realtime` publication
```

Or via SQL (idempotent, can live in `001_init.sql` end):

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE claimed_cells;
```

This is harmless on local PG (publication doesn't exist → wrap in DO block to ignore).

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_migrate.py` | Spin up disposable DB (testcontainers postgis OR rely on local `TEST_DATABASE_URL`), run migrate twice, assert tables exist + 2nd run is no-op |
| `server/tests/test_db_pool.py` | Open pool, `SELECT 1`, close — no leak. `statement_cache_size=0` honored. |

Use `pytest-asyncio`. Skip integration tests gracefully when `TEST_DATABASE_URL` unset.

## Acceptance

- `python -m scripts.migrate` against fresh Supabase (or local) creates `users`, `runs`, `claimed_cells`, `schema_migrations` + indexes + extensions
- Re-running migrate is idempotent (no errors, no duplicate rows in `schema_migrations`)
- `psql $DATABASE_URL_DIRECT -c "\dx"` shows `postgis` + `pgcrypto`
- Spatial index on `runs.gps_trace` confirmed: `\d runs` shows GIST index
- `claimed_cells` table appears in Supabase Realtime publication (verify dashboard)
- `pytest -v` → green when test DB URL set; skipped cleanly otherwise

## Out of scope

- `pg_h3` extension: **not available on Supabase**, and h3-py handles indexing in app code. Document in README.
- Seed data — manual for now
- ORM (SQLAlchemy/Tortoise) — raw SQL via asyncpg
- Row-Level Security (RLS): off for MVP, auth enforced in FastAPI deps. Revisit if multi-tenant exposure grows.
