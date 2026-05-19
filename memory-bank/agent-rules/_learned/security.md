---
name: Security Patterns (Learned)
globs: ["server/**/*.py", "server/app/errors.py", "server/app/middleware/**"]
topics: ["security", "cwe", "logging"]
priority: medium
evidence_count: 2
---

# Security Patterns (Auto-extracted)

Promoted to `medium` priority because these are CWE-related — strict to override.

- **CWE-209 (Information Exposure via Error Messages)**: NEVER include tracebacks in production HTTP error response bodies. Gate full traceback on `node_env != 'production'`. — TASK-007 (1×)
- **Request body in middleware logs**: NEVER default-on. GPS traces, auth credentials, file uploads, PII all leak. Opt-in per route only. — TASK-007 (1×)
- **CORS + credentials**: `allow_origins=["*"]` combined with `allow_credentials=True` is invalid + insecure. Use an explicit allowlist driven by env var. — TASK-007 (1×)
- **pydantic-settings fail-fast**: required fields have no default → missing env raises `ValidationError` at startup. Don't use `os.getenv("X") or default` patterns that hide misconfiguration. — TASK-007 (1×)
