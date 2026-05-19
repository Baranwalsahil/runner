# TASK-006: Global Leaderboard

**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: N/A
**Branch**: feat/task-06-global-leaderboard (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-06-global-leaderboard.md](../../tasks/tasks-06-global-leaderboard.md)

## Task Description

Port `stitch_territory_runner/global_leaderboard.html` → `client/src/routes/Leaderboard.jsx`. Mock data table (50 generated players + current user, sorted by cells, deterministic). Components: `Podium` (top-3 asymmetric layout with CHAMPION badge), `RankTable` (sortable by cells/area/streak, 10/page prev-next pagination, highlights `currentUserId`), `FilterChips` (region + time-window, `aria-pressed` for accessibility).

## User Journey Definition

**Feature Type**: End-User Feature
**Creative Phase Required**: No (Stitch mockup is the design source)

### Invocation Method
- **Location**: `/leaderboard` route
- **Element**: FilterChips (region/time) + column header click to sort
- **Visibility**: always
- **Navigation**: in-place state update; row click reserved for future profile view

### Success Criteria
- **User sees**: podium + rank table + filter chips matching mockup.
- **User can verify at**: `http://localhost:5173/leaderboard`.
- **Data persisted**: none (deterministic mock).
- **Observable within**: instant filter/sort re-render.

### Acceptance Criteria
- AC-ENTRY-1: `/leaderboard` renders close to `global_leaderboard.png`.
- AC-HAPPY-1: FilterChip click updates visible rows.
- AC-HAPPY-2: Column header click sorts cells/area/streak ascending/descending.
- AC-HAPPY-3: Pagination shows 10 per page, prev/next.
- AC-HAPPY-4: Current user row highlighted regardless of page.
- AC-ERROR-1: No console errors; FilterChips set `aria-pressed`.

## Test Strategy

### Approach
- **Emphasis**: state tests (sort, filter, paginate) + a11y attribute assertions.
- **Target test count**: ~28 tests leaderboard-wide.

### File Organization
- New co-located: `Podium.test.jsx`, `RankTable.test.jsx`, `FilterChips.test.jsx`, `Leaderboard.test.jsx`.
- New: `data/mockLeaderboard.test.js` deterministic-output assertion.

### What NOT to Test
- Avatar image fetch (placeholder pravatar URLs).
- Sort stability across primary+secondary keys (single-key sort sufficient).

## Implementation Roadmap

- [x] Phase 1: `data/mockLeaderboard.js` (50 generated + current user, deterministic seed)
- [x] Phase 2: `Podium.jsx` (top-3 asymmetric layout, CHAMPION badge)
- [x] Phase 3: `RankTable.jsx` (sortable headers, pagination, currentUser highlight)
- [x] Phase 4: `FilterChips.jsx` (region + time, `aria-pressed`)
- [x] Phase 5: `Leaderboard.jsx` wires filter + sort state
- [x] Phase 6: Vitest run → 136/136 pass; curl 200 on `/leaderboard` modules

## Creative Phases

- N/A — direct Stitch port.

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: podium + table + chips + 136/136 tests
- 2026-05-16: merged feat/task-06-global-leaderboard → main
