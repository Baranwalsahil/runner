# TASK-001: Frontend Scaffold (Vite + React + Tailwind theme)

**Complexity**: Level 1
**Status**: COMPLETE
**Roadmap**: N/A
**Branch**: feat/task-01-frontend-scaffold (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-01-frontend-scaffold.md](../../tasks/tasks-01-frontend-scaffold.md)

## Task Description

Bootstrap `client/` Vite+React app with Tailwind v3 preconfigured to match Stitch design tokens (colors, fonts, spacing, radii). No screens yet — only empty app shell that boots. All design tokens (lime `#c3f400` primary, dark grid bg, Lexend/Inter, hex-mesh utility) ported from Stitch HTML mockups.

## User Journey Definition

**Feature Type**: NFR/Infrastructure (foundation only — no end-user surface)
**Creative Phase Required**: No

### NFR Verification
- **Test method**: `cd client && npm run dev` boots on :5173; root page renders sentinel string in Lexend bold on dark grid bg.
- **Success metrics**: Vitest passes (22/22); Tailwind utilities `text-primary-fixed`, `glass-panel`, `neon-border-lime`, `neon-border-cyan`, `hex-mesh` resolve.
- **Observable at**: `http://localhost:5173` (dev). `client/dist/` (build output).

### Acceptance Criteria
- AC-1: `npm run dev --prefix client` starts Vite on :5173.
- AC-2: Page renders `TERRITORY RUN` in lime (`#c3f400`) Lexend bold on dark grid bg.
- AC-3: Tailwind utility `text-primary-fixed` resolves to `#c3f400`.
- AC-4: Utility classes `glass-panel`, `neon-border-lime`, `neon-border-cyan`, `hex-mesh` available as classNames.

## Test Strategy

### Approach
- **Emphasis**: balanced — smoke render test only at scaffold stage.
- **Target test count**: ~3 sanity tests; later tasks layer behavior tests.

### File Organization
- New: `client/src/App.test.jsx` smoke test verifying sentinel text + Tailwind class application.
- New: `client/src/test/setup.js` (Vitest setup importing `@testing-library/jest-dom`).

### What NOT to Test
- Tailwind compilation output — covered by `vite build` succeeding.
- Token values in CSS — visual diff against Stitch mockup is the human gate.

## Implementation Roadmap

- [x] Phase 1: Vite scaffold (`npm create vite@latest client -- --template react`)
- [x] Phase 2: Tailwind v3 + PostCSS + autoprefixer install + `npx tailwindcss init -p`
- [x] Phase 3: Port `tailwind.config.js` theme from Stitch HTML `<script id="tailwind-config">`
- [x] Phase 4: Write `index.css` (@tailwind + body bg + custom utilities: hex-mesh, glass-panel, neon-border-*)
- [x] Phase 5: Wire `index.html` (Inter + Lexend + Material Symbols `<link>`, `<html class="dark">`)
- [x] Phase 6: Placeholder `App.jsx` with `text-primary-fixed font-headline-xl` sentinel
- [x] Phase 7: Vitest setup + smoke test (22/22 pass)

## Creative Phases

- N/A — mechanical port of Stitch tokens; no design exploration needed.

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16 — all phases + tests
**Can Resume**: NO (COMPLETE)

### Active Sub-Agents
(none)

### Completed Steps
- 2026-05-16: scaffold + tailwind + tokens + smoke test → 22/22 vitest pass
- 2026-05-16: merged feat/task-01-frontend-scaffold → main
