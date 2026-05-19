# TASK-002: Shared Layout (TopNav, AlertBar, Footer, FAB) + Router

**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: N/A (predates roadmap; would map to FEAT-FE-SHELL retroactively)
**Branch**: feat/task-02-shared-layout (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-02-shared-layout.md](../../tasks/tasks-02-shared-layout.md)

## Task Description

Extract reusable chrome (top nav, alert bar, footer, FAB) into shared layout. Wire React Router 7 with 4 placeholder routes. Active nav link reflects current route via `NavLink` with lime `border-b-2 border-primary-fixed` accent. AlertBar shows only when `message` prop present; visible on Dashboard route per mockup.

## User Journey Definition

**Feature Type**: End-User Feature (navigation shell)
**Creative Phase Required**: No (chrome is pre-designed by Stitch mockups)

### Invocation Method
- **Location**: every route under `<AppLayout>`
- **Element**: TopNavBar links (Battlefield / Dashboard / Leaderboard) + FAB (bottom-right Start Session)
- **Visibility**: TopNav + Footer + FAB always visible; AlertBar conditional
- **Navigation**: NavLink → `to` prop → React Router pushes route

### Success Criteria
- **User sees**: nav bar at top, footer at bottom, FAB bottom-right; current route's nav link has lime underline.
- **User can verify at**: `/`, `/dashboard`, `/battlefield`, `/leaderboard`.
- **Data persisted**: none (UI shell only).
- **Observable within**: instant route change.

### Acceptance Criteria
- AC-ENTRY-1: All 4 routes return 200 and swap inner content.
- AC-HAPPY-1: Active NavLink shows lime underline.
- AC-HAPPY-2: AlertBar hidden when no `message` prop; visible on `/dashboard`.
- AC-HAPPY-3: FAB persistent across all routes.
- AC-ERROR-1: No console errors.

## Test Strategy

### Approach
- **Emphasis**: component tests for each shared chrome piece + router integration test.
- **Target test count**: ~23 tests across components.

### File Organization
- New co-located: `TopNavBar.test.jsx`, `AlertBar.test.jsx`, `Footer.test.jsx`, `Fab.test.jsx`, `AppLayout.test.jsx`, `Icon.test.jsx`.
- Extend: `App.test.jsx` for router smoke test.

### What NOT to Test
- React Router internals — assume framework correctness.
- Pure presentational footer link rendering — single render assertion is enough.

## Implementation Roadmap

- [x] Phase 1: `npm install react-router-dom@7`
- [x] Phase 2: `Icon` component (Material Symbols wrapper)
- [x] Phase 3: `TopNavBar` with `NavLink` active state (lime underline)
- [x] Phase 4: `AlertBar` (conditional render on `message` prop)
- [x] Phase 5: `Footer` + `Fab` (navigates via prop)
- [x] Phase 6: `AppLayout` wraps `<Outlet />` between chrome
- [x] Phase 7: Wire 4 routes in `App.jsx` (BrowserRouter + Routes)
- [x] Phase 8: Vitest run → 45/45 pass; curl 200 on all 4 routes

## Creative Phases

- N/A — chrome design pre-baked in Stitch mockups; layout decisions trivial.

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: shared layout + router + 45/45 tests; HTTP 200 on `/`, `/dashboard`, `/battlefield`, `/leaderboard`
- 2026-05-16: merged feat/task-02-shared-layout → main
