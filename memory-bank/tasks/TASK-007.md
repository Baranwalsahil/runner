# TASK-007: Backend Scaffold (FastAPI + Python 3.13)

**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: N/A
**Branch**: feat/task-07-backend-scaffold (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-07-backend-scaffold.md](../../tasks/tasks-07-backend-scaffold.md)

## Task Description

Bootstrap `server/` FastAPI app. Health endpoint + pydantic-settings env loader + structlog JSON logger + global exception handlers + CORS. Python 3.13 venv pinned via `server/Makefile`. No business routes yet — foundation for tasks 08-13.

## User Journey Definition

**Feature Type**: NFR/Infrastructure
**Creative Phase Required**: Yes (Architecture — FastAPI layout + logging pipeline)

### NFR Verification
- **Test method**: `make -C server install && make -C server dev` boots uvicorn :8000; `curl http://localhost:8000/health` returns `{"status":"ok","uptime":...,"version":"0.1.0"}`.
- **Success metrics**: pytest 6/6 green; CORS preflight from `http://localhost:5173` returns matching `Access-Control-Allow-Origin`; CORS rejects unknown origin; missing required env → pydantic ValidationError on startup; 404 fallback returns JSON.
- **Observable at**: `http://localhost:8000/health`, stdout structlog JSON lines, pytest output.

### Acceptance Criteria
- AC-NFR-1: `GET /health` → 200 with `status`, `uptime`, `version`.
- AC-NFR-2: Missing required env var → pydantic ValidationError listing missing field on startup.
- AC-NFR-3: CORS allows `http://localhost:5173` and the configured `frontend_url`; rejects others.
- AC-NFR-4: 404 fallback returns clean JSON envelope (no HTML).
- AC-NFR-5: `pytest -v` → 6/6 pass.

## Test Strategy

### Approach
- **Emphasis**: integration-style with FastAPI TestClient/AsyncClient.
- **Target test count**: 6 tests covering health, CORS, config validation.

### File Organization
- New: `server/tests/__init__.py`, `server/tests/conftest.py` (AsyncClient fixture), `server/tests/test_health.py`, `server/tests/test_cors.py`, `server/tests/test_config.py`.

### What NOT to Test
- Uvicorn server lifecycle — covered by `make dev` smoke check.
- structlog renderer output format — visual stdout inspection during dev.

## Implementation Roadmap

- [x] Phase 1: `python3.13 -m venv .venv`; install fastapi + uvicorn[standard] + pydantic + pydantic-settings + python-dotenv + structlog + pytest + pytest-asyncio + httpx; `pip freeze > requirements.txt`
- [x] Phase 2: `app/config.py` (pydantic-settings BaseSettings; required fields raise on missing)
- [x] Phase 3: `app/logging.py` (structlog JSON in prod, pretty in dev)
- [x] Phase 4: `app/errors.py` (RequestValidationError → 422; HTTPException passthrough; generic 500)
- [x] Phase 5: `app/middleware/request_logger.py` (ASGI middleware → method/path/status/duration)
- [x] Phase 6: `app/routers/health.py` (uptime via `app.state.started_at`)
- [x] Phase 7: `app/main.py` (lifespan, CORS, middleware stack, exception handlers, mount health)
- [x] Phase 8: `Makefile` (install/dev/test/freeze targets)
- [x] Phase 9: Tests: `test_health.py`, `test_cors.py`, `test_config.py` → 6/6 pytest pass

## Creative Phases

- [x] Architecture design → [creative/TASK-007-backend-architecture.md](../creative/TASK-007-backend-architecture.md)

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: FastAPI scaffold + structlog + pydantic-settings + CORS + health + 6/6 pytest
- 2026-05-16: merged feat/task-07-backend-scaffold → main
