---
name: territory-dev
description: Run, migrate, seed, and test the Territory Run stack locally. Use when asked to start the app, bring up the dev environment, run migrations, seed demo data, or run the FE/BE test suites for this repo.
---

# Territory Run — Dev Workflow

Common local-dev commands for this repo. Ports: backend `8000`, frontend `5173`, Postgres `5432`, Redis `6379`.

## Full stack (preferred)

`compose.yml` brings up db (postgis/postgis:16-3.4) + redis + migrate + server + client wired together:

```bash
docker compose up           # all services, migrate runs once before server
docker compose up db redis  # infra only (run server/client on host)
docker compose down         # stop; add -v to wipe db volume
```

Demo creds + local infra details live in `.claude/memory/` — read those files when needed.

## Backend on host

Run from `server/`. Makefile targets (uses `server/.venv`; repo also has a root `venv/` — confirm which is active):

```bash
make install   # python3.13 venv + pip install -r requirements.txt
make dev       # uvicorn app.main:app --reload --port 8000
make migrate   # python -m scripts.migrate
make test      # pytest -v
make freeze    # pip freeze > requirements.txt
```

Requires env: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `JWT_SECRET` (see `.env.example`). Migrations run against `DATABASE_URL_DIRECT`, fall back to `DATABASE_URL`.

## Frontend on host

Run from `client/`:

```bash
npm install
npm run dev        # vite, port 5173
npm run build
npm test           # vitest run
npm run test:watch
npm run lint       # eslint
```

`VITE_API_URL` must point at backend (default `http://localhost:8000`).

## Migrations

```bash
python -m scripts.migrate   # from server/, applies migrations/*.sql, tracks in schema_migrations
```

New migration = add `server/migrations/NNN_name.sql`. Verify: `\dt` shows `users`, `runs`, `claimed_cells`, `schema_migrations`; `\dx` shows `postgis` + `pgcrypto`.

## Seed demo data

Stack must be running first. From repo root:

```bash
python server/scripts/seed_demo.py
python server/scripts/seed_demo.py --users 4 --center 21.9974,79.0011
python server/scripts/seed_demo.py --base http://localhost:8000 --users 6
```

Signs up demo users, submits synthetic traces under `MAX_SPEED_MPS=12` so the GPS filter accepts them.

## Before pushing

Run both suites: `cd server && make test` and `cd client && npm test`. All changes go through a branch + PR — never commit to `main`, never merge locally (see CLAUDE.md).
