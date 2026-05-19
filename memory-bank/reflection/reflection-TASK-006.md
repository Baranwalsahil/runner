# Reflection — TASK-006: Global Leaderboard

**Task**: TASK-006
**Completed**: 2026-05-16
**Complexity**: Level 2
**Branch**: feat/task-06-global-leaderboard (merged)

## Outcome

`data/mockLeaderboard.js` (50 generated + current user, sorted by cells, deterministic). `Podium` (top-3 asymmetric, CHAMPION badge). `RankTable` (sortable cells/area/streak, 10/page prev/next, currentUserId highlight). `FilterChips` (region + time, `aria-pressed`). `Leaderboard.jsx` wires filter + sort state. 136/136 vitest.

## What Went Well

- Deterministic mock generation (`Array.from({length: 50}, (_, i) => ...)` with derived stats) means tests can assert exact ordering without snapshots.
- Single source of state at `Leaderboard.jsx` (filter + sort + page); child components are controlled — no internal sort state spread across pieces.
- `aria-pressed` on FilterChips made keyboard nav and screen-reader behavior correct without bolting on a11y after the fact.

## What Could Have Been Better

- Sort logic in `RankTable` used a `useMemo(() => [...data].sort(...))` that re-runs on every prop change. Fine at 50 rows; would need virtualization + server-side sort beyond ~1000.
- Pagination logic and sort logic are siblings in the same component; could be extracted to a `useTableState({data, sortKey, page})` hook for reuse if another table screen appears. Not done — speculative.
- Current-user highlight uses a `username === currentUsername` comparison; brittle if usernames are renamed. Acceptable since task-09 will introduce `user_id` UUIDs that supersede this.

## Key Learnings

- **Controlled child components**: own state at the route level when state is shared across children (filter + sort + page all affect the same dataset). Avoids prop drilling AND state synchronization bugs.
- **Deterministic mocks for testability**: predictable seed → tests can assert specific orderings without snapshot churn.
- **a11y from the start, not retrofit**: `aria-pressed` on toggle buttons is one prop; postponing it is a guaranteed forgotten task.

## Process Notes

- Test count grew from 108→136 (+28) — chip toggle, sort flip, pagination boundary, podium top-3 all covered.

## Action Items Carried Forward

- Replace `username`-based current-user match with `user_id` UUID match after task-09 (auth).
- Consider extracting `useTableState` hook if a second sortable table screen appears.
