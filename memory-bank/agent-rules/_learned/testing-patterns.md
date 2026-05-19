---
name: Testing Patterns (Learned)
globs: ["client/src/**/*.test.{js,jsx}", "server/tests/**/*.py"]
topics: ["testing", "vitest", "pytest"]
priority: low
evidence_count: 7
---

# Testing Patterns (Auto-extracted from TASK-001..TASK-007 reflections)

> Low-priority auto-extracted rules. Promoted to `medium` if reinforced in ≥3 future tasks.

- Co-locate FE component tests (`Component.test.jsx`) next to the component. Grep-by-prefix navigation depends on this. — TASK-002, TASK-003, TASK-004, TASK-005, TASK-006 (5×)
- BE tests in `server/tests/` flat directory, one `test_<concern>.py` per router/middleware/utility. — TASK-007 (1×)
- Mock canvas/WebGL/third-party libs at the module boundary (`client/src/__mocks__/<lib>.js`); Vitest auto-resolves. Don't try to test rendered output. — TASK-005 (1×)
- Use `httpx.AsyncClient(transport=ASGITransport(app=app))` for FastAPI tests. In-process, no port collisions. — TASK-007 (1×)
- Deterministic mock data (`Array.from({length}, (_, i) => derived)`) enables exact-ordering assertions without snapshot churn. — TASK-006 (1×)
- Smoke test per route via `curl -s -o /dev/null -w "%{http_code}\n"` is a fast Vite module-resolution check before booting the page. — TASK-003, TASK-004, TASK-005, TASK-006 (4×)
- Write tests alongside (not after) — catches typos and class-name mismatches immediately. — TASK-002 (1×)
