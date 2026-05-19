# Archive — TASK-002: Shared Layout + Router

**Task**: TASK-002
**Complexity**: Level 2
**Status**: COMPLETE
**Archived**: 2026-05-19 (retroactive — task closed 2026-05-16)
**Branch**: feat/task-02-shared-layout (merged → main, deleted)

## Summary

react-router-dom 7. 6 components: `Icon`, `TopNavBar` (NavLink active = lime border-b-2), `AlertBar` (conditional render), `Footer`, `Fab` (navigates via prop), `AppLayout` (Outlet + chrome). 4 routes wired in `App.jsx`.

## Acceptance Criteria — Outcome

| AC | Status |
|----|--------|
| AC-ENTRY-1 4 routes return 200 + swap content | PASS |
| AC-HAPPY-1 Active NavLink lime underline | PASS |
| AC-HAPPY-2 AlertBar visible on `/dashboard` only | PASS |
| AC-HAPPY-3 FAB persistent across routes | PASS |
| AC-ERROR-1 No console errors | PASS |

## Files Created / Modified

- `client/src/components/{Icon,TopNavBar,AlertBar,Footer,Fab,AppLayout}.jsx`
- `client/src/components/*.test.jsx` (6 component tests)
- `client/src/routes/{Landing,Dashboard,Battlefield,Leaderboard}.jsx` (stubs)
- `client/src/App.jsx` (BrowserRouter + Routes)
- `client/package.json` (added `react-router-dom@7`)

## Test Outcome

- Vitest: 45/45 PASS
- Curl HTTP 200 on `/`, `/dashboard`, `/battlefield`, `/leaderboard`

## Linked Documents

- Source brief: [tasks/tasks-02-shared-layout.md](../../tasks/tasks-02-shared-layout.md)
- Plan: [tasks/TASK-002.md](../tasks/TASK-002.md)
- Reflection: [reflection/reflection-TASK-002.md](../reflection/reflection-TASK-002.md)

## Git History

- Merged via `git merge --no-ff feat/task-02-shared-layout -m "Merge task-02: shared layout"`. Branch deleted.

## Carry-forward TODOs

- Refactor `Fab` to accept `onClick` (in addition to `to`) before task-10 GPS recording.
