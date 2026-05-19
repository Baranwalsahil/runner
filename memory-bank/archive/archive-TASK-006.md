# Archive — TASK-006: Global Leaderboard

**Task**: TASK-006
**Complexity**: Level 2
**Status**: COMPLETE
**Archived**: 2026-05-19 (retroactive — task closed 2026-05-16)
**Branch**: feat/task-06-global-leaderboard (merged → main, deleted)

## Summary

Leaderboard with deterministic 50-player mock + current user. `Podium` (top-3 asymmetric + CHAMPION badge), `RankTable` (sortable cells/area/streak, 10/page prev-next, current-user highlight), `FilterChips` (region + time-window, `aria-pressed`).

## Acceptance Criteria — Outcome

| AC | Status |
|----|--------|
| AC-ENTRY-1 `/leaderboard` close to mockup | PASS |
| AC-HAPPY-1 FilterChip click updates rows | PASS |
| AC-HAPPY-2 Column header sort cells/area/streak | PASS |
| AC-HAPPY-3 Pagination 10/page prev-next | PASS |
| AC-HAPPY-4 Current user highlighted across pages | PASS |
| AC-ERROR-1 No console errors; `aria-pressed` set on chips | PASS |

## Files Created / Modified

- `client/src/data/mockLeaderboard.js` (+ `*.test.js` for deterministic-output assertions)
- `client/src/components/leaderboard/{Podium,RankTable,FilterChips}.jsx` + `*.test.jsx`
- `client/src/routes/Leaderboard.jsx`

## Test Outcome

- Vitest: 136/136 PASS
- Curl 200 on all leaderboard modules

## Linked Documents

- Source brief: [tasks/tasks-06-global-leaderboard.md](../../tasks/tasks-06-global-leaderboard.md)
- Plan: [tasks/TASK-006.md](../tasks/TASK-006.md)
- Reflection: [reflection/reflection-TASK-006.md](../reflection/reflection-TASK-006.md)

## Carry-forward TODOs

- Replace `username`-based current-user match with `user_id` UUID match after task-09 (Supabase auth).
- Consider extracting `useTableState({data, sortKey, page})` hook if a second sortable table screen appears.
