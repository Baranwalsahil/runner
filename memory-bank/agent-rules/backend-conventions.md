---
name: Backend Conventions
globs: ["server/**/*.py"]
paths: ["server/"]
topics: ["backend", "fastapi", "python", "pytest", "structlog"]
priority: high
---

# Backend Conventions (server/)

Distilled from TASK-007. These are project-locked.

## Python + FastAPI

- Python 3.13 pinned via `server/Makefile` `python3.13 -m venv .venv`. Matches Render runtime; do not relax to `python3`.
- FastAPI app constructed in `app/main.py` via `create_app()`; uvicorn entrypoint is `app.main:app` with `--app-dir server`.
- `app.state` for app-wide singletons (e.g. `started_at`); never module globals. `lifespan` async context manager handles init/teardown.

## Config

- All env vars loaded via `pydantic_settings.BaseSettings` in `app/config.py`.
- Required fields have no default → missing env raises `ValidationError` at startup. Fail fast.
- Don't use `os.getenv("X") or default` per-variable.
- `@lru_cache` on `get_settings()` so the parse runs once.

## Logging

- structlog, not stdlib `logging.Logger`.
- JSON renderer in production (`node_env == 'production'`); ConsoleRenderer otherwise.
- Standard processors: `add_log_level`, `TimeStamper(fmt="iso")`, `StackInfoRenderer`, renderer.

## Request Middleware

- `RequestLoggerMiddleware` logs `method`, `path`, `status`, `duration`. NOTHING ELSE BY DEFAULT.
- NEVER log request body in middleware. GPS traces, auth credentials, file uploads all leak. Per-route opt-in only.
- Middleware order: `CORSMiddleware` outermost (must wrap everything to set headers on error responses), then `RequestLoggerMiddleware`, then routers.

## Error Envelopes

- Three handlers: `RequestValidationError` → 422 JSON, `HTTPException` → passthrough, generic `Exception` → 500 `{error, message}`.
- Traceback in response body ONLY when `node_env != 'production'`. Returning traceback in prod is CWE-209 (info exposure). No exceptions.

## CORS

- Allowlist driven by env (`frontend_url`) + hardcoded dev origin (`http://localhost:5173`).
- Don't use `allow_origins=["*"]` with `allow_credentials=True` — combination is invalid + insecure.

## Tests

- pytest + pytest-asyncio + httpx.
- `httpx.AsyncClient(transport=ASGITransport(app=app))` — in-process, no real network. Standard pattern.
- Fixture in `server/tests/conftest.py`; one fixture per concern.
- File-per-router convention: `test_health.py`, `test_cors.py`, `test_config.py`, etc.
- Flat `def test_*()` functions; pytest discovers by name. No nested `describe`-style grouping.

## Project Layout

- `server/app/` flat (`config.py`, `main.py`, `errors.py`, `logging.py`, `middleware/`, `routers/`, `services/`, `schemas/`, `db/`, `cache/`).
- Tests in `server/tests/`, separate from app code.
- Don't migrate to `server/src/territory_run/` package layout unless the surface grows substantially. Flat is faster to navigate.

## Observability (per CLAUDE.md Standards)

- structlog is the foundation; OpenTelemetry instrumentation is required before task-13 deploy.
- Trace context (W3C Trace Context) propagation in HTTP clients when added.
- No `print()` in production code.
