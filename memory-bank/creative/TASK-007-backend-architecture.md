# Creative — Architecture — TASK-007 Backend Scaffold

**Task**: TASK-007
**Type**: Architecture
**Date**: 2026-05-16
**Status**: APPROVED + IMPLEMENTED

## Context

Bootstrap the FastAPI server. Several architectural choices need locking down before route implementations begin (tasks 09–12): config loading, logging, error envelopes, middleware ordering, project layout.

## Decisions

### 1. Config: `pydantic-settings` with fail-fast at startup

```python
class Settings(BaseSettings):
    database_url: str           # required — raises ValidationError if missing
    supabase_url: str
    supabase_anon_key: str
    supabase_jwt_secret: str
    redis_url: str | None = None
    h3_resolution: int = 9
    frontend_url: str | None = None
    node_env: Literal["development","production","test"] = "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- Rejected: `os.getenv(...) or default` per-variable. Silent fallbacks hide misconfiguration until the broken path runs.
- Rationale: fail at import / app construction so deploys surface bad config in <1s, not after the first request.

### 2. Logging: structlog JSON in prod, console in dev

```python
import structlog
def configure_logging(settings: Settings):
    processors = [
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        (structlog.processors.JSONRenderer() if settings.node_env == "production"
         else structlog.dev.ConsoleRenderer()),
    ]
    structlog.configure(processors=processors, ...)
```

- Rejected: stdlib `logging.Logger`. structlog gives structured kwargs natively; aligns with CLAUDE.md Observability Standards (JSON + traceId-ready).
- Rationale: production log aggregators (Render/Vercel/Supabase) prefer JSON line; dev needs human-readable.

### 3. Error envelope: validation → 422, HTTP → passthrough, fallback → 500 (no traceback in prod)

```python
async def generic_exception_handler(request, exc):
    log.error("unhandled_exception", error=str(exc), path=request.url.path)
    body = {"error": "internal_server_error", "message": "Something went wrong"}
    if settings.node_env != "production":
        body["traceback"] = traceback.format_exc()
    return JSONResponse(status_code=500, content=body)
```

- Rejected: returning the traceback always. CWE-209 information disclosure; private paths/secrets can leak through stack frames.
- Rationale: a single consistent envelope shape simplifies frontend error UX; production hides internals.

### 4. Middleware order

```
CORSMiddleware (outermost — must wrap everything to set headers on errors)
↓
RequestLoggerMiddleware (logs method/path/status/duration)
↓
Routers (/health, /auth, /runs, /territory, /leaderboard)
```

- Rejected: RequestLogger outermost. Then CORS headers wouldn't apply to error responses, breaking the frontend's error parsing.

### 5. Project layout: `server/app/` flat with `--app-dir server`

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── logging.py
│   ├── errors.py
│   ├── middleware/__init__.py + request_logger.py
│   └── routers/__init__.py + health.py
├── tests/
│   ├── conftest.py
│   └── test_*.py
├── pytest.ini
├── requirements.txt
└── Makefile
```

- Rejected: `server/src/territory_run/` with `pyproject.toml`. Overkill for MVP; flat is faster to navigate. Revisit if package surface grows.
- Rationale: matches uvicorn's `--app-dir server` and Render's standard FastAPI deploy command.

### 6. Test transport: `httpx.AsyncClient` with `ASGITransport`

```python
@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
```

- Rejected: spinning up a real uvicorn for tests. Slow; flaky on CI port collisions.
- Rationale: in-process, faster, no network. Standard FastAPI test pattern.

### 7. Uptime: `lifespan` context manager populates `app.state.started_at`

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.started_at = time.time()
    yield
```

- Rejected: module-global `STARTED_AT`. `app.state` is lifespan-scoped → test teardown is automatic.

## Trade-offs Accepted

- structlog adds a dependency vs stdlib logging. Worth it for the JSON-by-default behavior.
- Flat `server/app/` layout means absolute imports require `--app-dir server`. Acceptable; documented in `techContext.md`.

## Validation

- 6/6 pytest pass.
- Missing required env var → pydantic ValidationError listing the missing field.
- CORS preflight from `http://localhost:5173` → matching `Access-Control-Allow-Origin`; unknown origin rejected.
- 404 returns clean JSON envelope.
