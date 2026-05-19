# Reflection — TASK-007: Backend Scaffold (FastAPI)

**Task**: TASK-007
**Completed**: 2026-05-16
**Complexity**: Level 2
**Branch**: feat/task-07-backend-scaffold (merged)

## Outcome

FastAPI 0.136 + Starlette 1.0 + uvicorn 0.47 on Python 3.13. `app/config.py` (pydantic-settings env loader), `app/logging.py` (structlog JSON + dev pretty), `app/errors.py` (validation/HTTP/fallback handlers), `app/middleware/request_logger.py`, `app/routers/health.py`. `server/Makefile` for install/dev/test/freeze. 6/6 pytest pass. `curl /health` returns `{"status":"ok","uptime":...,"version":"0.1.0"}`. CORS allows `localhost:5173`, rejects others. 404 fallback returns clean JSON envelope.

## What Went Well

- pydantic-settings raised a clear validation error when an env var was missing — fail-fast at startup instead of mysterious None at runtime.
- structlog JSON renderer in production + pretty console renderer in development (gated on `NODE_ENV`) gave the right tradeoff between machine-parseable and human-readable.
- `lifespan` async context manager stored `app.state.started_at = time.time()` cleanly; `/health` reads from there. Avoids a global mutable.
- `Makefile` pinning `python3.13 -m venv .venv` matches Render's runtime; no version drift between local and prod.
- Tests use `httpx.AsyncClient(transport=ASGITransport(app=app))` — in-process, no real network, fast.

## What Could Have Been Better

- `errors.py` generic 500 handler initially included tracebacks in the response body even in production. Caught it during review; gated traceback on `NODE_ENV != 'production'`. Should have been the default from the first commit — sensitive info in error responses is a CWE.
- Module path: `app/` at the top of `server/` and `--app-dir server` on the uvicorn command. Worked but added cognitive overhead for anyone running the server manually. Documented in `techContext.md`. Could have used `server/src/app/` with `pyproject.toml` setup to flatten imports — overkill for MVP.
- `RequestLoggerMiddleware` initially logged the request body. Removed when realizing GPS traces will be huge and contain PII. Lesson: middleware logs should default to "method + path + status + duration" and only add body on opt-in.

## Key Learnings

- **Fail-fast env validation**: pydantic-settings on a `get_settings()` function called at app construction surfaces missing config immediately. No `os.getenv(...) or default` patterns.
- **Production tracebacks are CWE-209 (info exposure)**: always gate full traceback on dev env. Production should expose only `{error: "internal_server_error", message: "..."}`.
- **Request body in middleware logs**: never default-on. GPS traces, auth credentials, file uploads all leak. Opt-in per route at most.
- **`app.state` for app-wide singletons**: cleaner than module globals; lifespan-scoped so test teardown is automatic.
- **`httpx.AsyncClient + ASGITransport`**: standard FastAPI test pattern; no real TCP socket needed.
- **Pin Python version in Makefile**: `python3.13 -m venv` not `python3 -m venv`. Render runtime is exact; local must match.

## Process Notes

- Pre-task creative doc captured the "structlog vs. stdlib logging" decision — referenced when reviewing the logging config.

## Action Items Carried Forward

- Add OpenTelemetry instrumentation when task-13 deploy is ready (per CLAUDE.md Observability Standards). Currently structlog-only.
- Consider `pyproject.toml` flat layout (`server/app/...` → `server/src/territory_run/...`) if package surface grows.
- Document the "no body in middleware logs" rule in `agent-rules/backend-conventions.md`.
