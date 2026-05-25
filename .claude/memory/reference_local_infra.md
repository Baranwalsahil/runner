---
name: reference-local-infra
description: "Local dev ports, docker services, common cmds. Avoids re-reading compose.yml + Makefile each session."
metadata: 
  node_type: memory
  type: reference
  originSessionId: b2264f4f-9059-478a-a23d-9284f44ef563
---

# Local dev infra

## Ports

| Service       | Port  | Notes                                   |
|---------------|-------|-----------------------------------------|
| FE Vite dev   | 5173  | `cd client && npm run dev`              |
| BE FastAPI    | 8000  | `uvicorn app.main:app --app-dir server` |
| Postgres      | 5432  | postgis/postgis:16-3.4 docker           |
| Redis         | 6379  | redis docker, fakeredis in unit tests   |

## Docker compose

`compose.yml` defines: `db` (postgis), `redis`, `migrate` (one-shot), `server`, `client`. `make migrate` runs the migrations entrypoint.

## Env vars (server/.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/territory_run
DATABASE_URL_DIRECT=postgresql://user:pass@localhost:5432/territory_run   # migrations
JWT_SECRET=<openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRES_SECONDS=604800
REDIS_URL=redis://localhost:6379       # optional; NullCache when unset
H3_RESOLUTION=9
```

## Common cmds

- FE tests: `cd client && npm test -- --run`
- BE tests: `cd server && pytest -v` (needs TEST_DATABASE_URL for integration tests; 3 skip cleanly otherwise)
- Migrate: `python -m scripts.migrate` (server/, against DATABASE_URL_DIRECT)
- Seed demo users + runs: `python server/scripts/seed_demo.py`

## Vercel deploy

FE deployed from `client/` dir (Vite preset). SPA rewrite added in `client/vercel.json` — required for hard-refresh on `/leaderboard` etc. (fix: PR #14, 2026-05-25).

Related: [[reference-demo-credentials]] · [[project-stack-snapshot]]
