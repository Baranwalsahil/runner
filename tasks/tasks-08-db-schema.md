# Task 08 — Database Schema + Migrations (asyncpg)

## Goal

Define Postgres + PostGIS schema. Wire `asyncpg` pool to backend. Add migration runner. Schema verbatim from CLAUDE.md § Database Schema.

## Prereqs

- Task 07 done
- Neon account OR local docker postgis: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis`

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
| `server/app/db/pool.py` | `asyncpg` pool singleton: `get_pool()` lazy-init from `settings.database_url`, SSL enabled when `node_env=production`. Exposes `fetch(query, *args)`, `fetchrow(...)`, `execute(...)`, `transaction()` context manager. |
| `server/app/db/schema.sql` | Copy schema block from CLAUDE.md verbatim + `CREATE EXTENSION IF NOT EXISTS postgis;` + `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (for `gen_random_uuid()`) |
| `server/migrations/001_init.sql` | Same content as `schema.sql`, idempotent (`IF NOT EXISTS` everywhere) |
| `server/scripts/migrate.py` | CLI: scans `migrations/*.sql` sorted, opens pool, for each unapplied migration: BEGIN, execute file, INSERT into `schema_migrations(name, applied_at)`, COMMIT. Skips already-applied. |
| `shared/constants.py` | `H3_RESOLUTION = 9`, `OWNER_PALETTE = ["#c3f400","#00dbe9","#ffb4aa","#7df4ff","#ffdad5","#ff6b6b"]`, `MAX_SPEED_MPS = 12`, `MAX_RUN_HOURS = 4`, `MAX_CELLS_PER_RUN = 2000`, `GPS_ACCURACY_THRESHOLD_M = 50` |
| `shared/constants.js` | Same values for client (already needed if not yet present) |

Wire `migrate.py` invocation:

```bash
python -m scripts.migrate          # from server/
# or
python server/scripts/migrate.py
```

Document in `server/Makefile` as `make migrate`.

## pool.py skeleton

```python
import asyncpg
from app.config import get_settings

_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        ssl = "require" if settings.node_env == "production" else None
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=10,
            command_timeout=30,
            ssl=ssl,
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

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_migrate.py` | Spin up disposable DB (testcontainers postgis OR rely on local `TEST_DATABASE_URL`), run migrate twice, assert tables exist + 2nd run is no-op |
| `server/tests/test_db_pool.py` | Open pool, `SELECT 1`, close — no leak |

Use `pytest-asyncio` (already installed in 07). Skip integration tests gracefully when `TEST_DATABASE_URL` unset.

## Acceptance

- `python -m scripts.migrate` against fresh DB creates `users`, `runs`, `claimed_cells`, `schema_migrations` + indexes
- Re-running migrate is idempotent (no errors, no duplicate rows in `schema_migrations`)
- `psql $DATABASE_URL -c "\dx"` shows `postgis` extension
- Spatial index on `runs.gps_trace` confirmed: `\d runs` shows GIST index
- `pytest -v` → green when `TEST_DATABASE_URL` set; skipped cleanly otherwise

## Out of scope

- `pg_h3` extension: skip — h3-py handles indexing in app code. Reduces infra surface. Document in README.
- Seed data — manual for now
- ORM (SQLAlchemy/Tortoise) — raw SQL via asyncpg is simpler for this scope
