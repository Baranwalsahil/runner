# Reflection — TASK-001: Frontend Scaffold

**Task**: TASK-001 — Frontend Scaffold (Vite + React + Tailwind theme)
**Completed**: 2026-05-16
**Complexity**: Level 1
**Branch**: feat/task-01-frontend-scaffold (merged)

## Outcome

Vite 8 + React 19 + Tailwind v3.4 scaffold booted on :5173. Sentinel `TERRITORY RUN` renders in lime Lexend bold on dark grid bg. Custom utilities (`glass-panel`, `neon-border-lime`, `neon-border-cyan`, `hex-mesh`) plus `text-primary-fixed` token resolve. 22/22 vitest pass.

## What Went Well

- Stitch HTML `<script id="tailwind-config">` block was a clean source-of-truth — direct port, no re-design.
- Tailwind v3 (not v4) was the correct call: v4 PostCSS plugin contract is still churning; v3 + autoprefixer is stable for Render/Vercel pipelines.
- Co-locating the smoke test next to `App.jsx` (vs. a separate `tests/` dir) matched the React+Vitest convention without ceremony.
- Vitest setup file imported `@testing-library/jest-dom` once globally — every subsequent task inherited the matchers.

## What Could Have Been Better

- Initial `tailwind.config.js` content glob missed `index.html`; that surfaced when a class set only on `<body>` failed to compile until added. Fix took 5 minutes but should have been caught by reading Tailwind v3 docs on `content` once.
- `index.css` custom utilities live inside `@layer utilities` — using a plain `.class { ... }` block worked but bypassed Tailwind's purge/JIT. Should have wrapped in `@layer` from the start; tasks 03/05 later did this for `.hex-grid`.

## Key Learnings

- **Tailwind `content` glob**: include both `index.html` AND `src/**/*.{js,jsx}` for v3. Missing either silently drops classes.
- **Custom utilities → @layer utilities**: keeps them JIT-purged and orderable. Bare CSS blocks work but defeat the bundler.
- **Vitest setup once**: a single `src/test/setup.js` with `@testing-library/jest-dom` import is enough; don't repeat per-test.
- **`html.dark` class**: must be on `<html>` (not `<body>`) for Tailwind `darkMode: 'class'` to cascade everywhere.

## Process Notes (Claude Code Ecosystem)

- Smoke-test-first kept iterations short.
- No agent delegation needed at Level 1; direct Read/Write/Bash sufficed.

## Action Items Carried Forward

- Future Stitch HTML ports: always wrap custom utilities in `@layer utilities`. (Captured to `agent-rules/tailwind-stitch.md`.)
