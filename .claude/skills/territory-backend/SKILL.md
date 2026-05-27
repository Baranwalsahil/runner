---
name: territory-backend
description: Conventions for the Territory Run backend (server/ — Python 3.13 + FastAPI + asyncpg + PostGIS + Redis). Use when adding API routes, DB migrations, auth deps, services, schemas, or cache code under server/. Do not touch client/ (frontend domain).
---

# Territory Run — Backend Conventions

Stack: Python 3.13, FastAPI + uvicorn, asyncpg (raw SQL, no ORM), Postgres + PostGIS, Redis cache, own HS256 JWT auth. Layout under `server/app/`.

## Layout

```
app/
  main.py        # FastAPI entry, router includes, middleware
  config.py      # pydantic-settings env loader
  deps.py        # DI: db pool, current-user auth, cache
  constants.py   # backend-local constants
  errors.py      # error types / handlers
  logging.py middleware/
  routers/       auth, health, runs, territory, leaderboard, users
  services/      auth, color, gps_filter, h3, leaderboard, run, territory, user
  schemas/       pydantic request/response models
  db/            pool.py (asyncpg singleton), schema.sql
  cache/         redis.py, leaderboard_cache.py, territory_cache.py
migrations/      NNN_name.sql
scripts/         migrate.py, seed_demo.py
tests/           pytest + httpx AsyncClient
```

`shared/constants.py` mirrors `shared/constants.js` — keep both in sync. `H3_RESOLUTION=9`.

## Adding a route

1. Handler in the matching `routers/<area>.py`, typed `response_model` from `schemas/`.
2. Business logic in `services/` — routers stay thin (parse/validate → call service → return).
3. DB access via the asyncpg pool from `deps.py` (`Depends`), never a module-global connection.
4. Protected routes depend on the current-user dep in `deps.py` (decodes HS256 JWT bearer).
5. Register router in `main.py` if new.
6. Test with httpx `AsyncClient` in `tests/`. Run `make test` (`pytest -v`).

Existing route patterns (mount path + method): see `@router` decorators — e.g. `territory.py` `GET ""`, `GET /stats`, `GET /user/{user_id}`; `runs.py` `POST ""`, `GET /feed`, `GET /{run_id}`.

## DB & migrations

- Raw SQL via asyncpg. New schema change = new `migrations/NNN_name.sql`; apply with `python -m scripts.migrate` (runs vs `DATABASE_URL_DIRECT`, tracked in `schema_migrations`). Never edit an applied migration — add a new one.
- Core tables: `users`, `runs` (PostGIS `gps_trace GEOMETRY(LINESTRING,4326)`, GIST index), `claimed_cells` (PK `h3_index`).
- Extensions: `postgis`, `pgcrypto`.

## H3 / GPS pipeline

`gps_filter.py` (drop accuracy >50m, speed >12 m/s, enforce `MAX_RUN_HOURS`/`MAX_CELLS_PER_RUN`) → `h3_service.py` (latlng→h3 res 9 via h3-py) → `run_service.py` (upsert `claimed_cells`, steal-on-run, bump `claim_count`) → leaderboard ZINCRBY.

## Cache

Redis optional (degrade gracefully if `REDIS_URL` unset). Leaderboard ranks in a ZSET (`leaderboard_cache.py`); territory viewport cache in `territory_cache.py`. Postgres stays canonical; Redis is the hot path.

## Auth

bcrypt `password_hash` on `users`, HS256 JWT signed with `JWT_SECRET` (`auth_service.py` + `routers/auth.py`). No third-party auth provider.

## Rules

- Stay in `server/` + `shared/`. Refuse `client/` edits — that's frontend domain.
- Every change → branch + PR. Never commit to `main`, never merge locally (CLAUDE.md).
- Run `make test` before pushing.
