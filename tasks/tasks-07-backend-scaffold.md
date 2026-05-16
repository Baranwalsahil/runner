# Task 07 — Backend Scaffold (Python + FastAPI)

## Goal

Bootstrap `server/` FastAPI app. Health endpoint + env loader + structured logger + global exception handler + CORS. No business routes yet.

## Prereqs

- Python 3.13+ installed
- None code-wise (parallel to FE tasks but sequenced after 06)

## Install

```bash
cd /home/sahil/runner
mkdir -p server/app
cd server
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings python-dotenv structlog
pip freeze > requirements.txt
```

Optional: use `uv` or `poetry` instead. Keep `requirements.txt` authoritative for Render deploy.

## Files to create

| Path | Purpose |
|------|---------|
| `server/app/__init__.py` | empty |
| `server/app/main.py` | FastAPI app: load settings, register middleware (CORS + logging), mount `/health` router, register exception handlers |
| `server/app/config.py` | `pydantic_settings.BaseSettings` reading `.env`: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `REDIS_URL` (optional), `PORT=8000`, `H3_RESOLUTION=9`, `FRONTEND_URL`, `NODE_ENV=development`. Required fields raise on missing. |
| `server/app/logging.py` | structlog config: JSON in production, pretty in dev |
| `server/app/middleware/request_logger.py` | ASGI middleware that logs method, path, status, duration |
| `server/app/errors.py` | Exception handlers: `RequestValidationError` → 422 JSON, `HTTPException` passthrough, generic `Exception` → 500 `{error, message}` w/ traceback only in dev |
| `server/app/routers/health.py` | `GET /health` → `{status:"ok", uptime, version}` (uptime from app startup time stored in `app.state.started_at`) |
| `server/Makefile` (optional) | `dev`, `test`, `migrate` targets |
| `server/.env.example` | Template w/ all vars (no secrets) |
| `.env.example` (repo root) | Same template |
| `.gitignore` (repo root) | `.venv/`, `__pycache__/`, `*.pyc`, `.env`, `node_modules/`, `dist/`, `.DS_Store` |

## main.py skeleton

```python
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import health
from app.errors import register_exception_handlers
from app.middleware.request_logger import RequestLoggerMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.started_at = time.time()
    yield

def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Territory Run API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", settings.frontend_url] if settings.frontend_url else ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggerMiddleware)
    register_exception_handlers(app)
    app.include_router(health.router)
    return app

app = create_app()
```

## Dev script

Add to `server/Makefile` or document in README:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir .
```

Or:

```bash
fastapi dev app/main.py
```

## Tests

```bash
pip install pytest pytest-asyncio httpx
pip freeze > requirements.txt
```

| Path | Purpose |
|------|---------|
| `server/tests/__init__.py` | empty |
| `server/tests/conftest.py` | `@pytest.fixture` async `client` using `httpx.AsyncClient(transport=ASGITransport(app=app))` |
| `server/tests/test_health.py` | `GET /health` returns 200 + `status="ok"` + `uptime > 0` |
| `server/tests/test_cors.py` | OPTIONS preflight from `http://localhost:5173` returns `Access-Control-Allow-Origin` header |
| `server/tests/test_config.py` | Missing required env var raises `ValidationError` |

Run: `cd server && pytest -v`

## Acceptance

- `cd server && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000` starts on :8000
- `curl http://localhost:8000/health` → `{"status":"ok","uptime":<float>,"version":"0.1.0"}`
- Missing required env var → server exits w/ pydantic ValidationError listing missing field
- `curl -I -H "Origin: http://localhost:5173" http://localhost:8000/health` → `access-control-allow-origin: http://localhost:5173`
- `pytest -v` → all green

## Out of scope

- DB connection — task 08
- Routes (auth/runs/territory/leaderboard) — tasks 09-11
