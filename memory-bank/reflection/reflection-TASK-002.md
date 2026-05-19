# Reflection — TASK-002: Shared Layout + Router

**Task**: TASK-002
**Completed**: 2026-05-16
**Complexity**: Level 2
**Branch**: feat/task-02-shared-layout (merged)

## Outcome

react-router-dom 7 installed. `Icon`, `TopNavBar`, `AlertBar`, `Footer`, `Fab`, `AppLayout` shipped. 4 routes wired in `App.jsx`. NavLink active state lime border-b-2. AlertBar conditional render. 45/45 vitest. Curl 200 on all 4 routes.

## What Went Well

- Using react-router-dom 7's `NavLink` `className` callback (instead of manual route matching) gave the lime underline for free; one source of truth for active state.
- `AlertBar` `message ?? null` short-circuit kept the conditional render JSX trivial — no extra prop drilling.
- `AppLayout` wrapping `<Outlet />` between chrome means subsequent route tasks (03–06) only authored route content, never chrome.

## What Could Have Been Better

- `Fab` `to` prop hardcoded "/run/new" felt premature; should accept a callable handler instead for tasks like task-10's "start GPS recording" that won't be a route. Minor — refactor when task-10 hits.
- Material Symbols `<Icon>` wrapper relies on the font being loaded via `<link>` in `index.html`. No fallback if CDN fails. Acceptable for MVP; flag if going offline-capable in Phase 2.
- Tests for `Footer` were thin (one render assertion); enough for static content but would have caught a typo in link text only by accident.

## Key Learnings

- **React Router 7**: `NavLink className=({isActive}) => ...` is the cleanest active-state pattern; no need for manual `useLocation()`.
- **Layout component owns conditional chrome**: route components shouldn't import `AlertBar` themselves — `AppLayout` reads route or props and decides. Keeps route files clean.
- **Component test pattern**: render → query by role → assert text and class. Avoid querying by class name (brittle to refactor).
- **Vitest co-location**: `Component.test.jsx` next to `Component.jsx` made grep-by-prefix navigation trivial. Locked in for project.

## Process Notes

- Tests written alongside (not after) — caught a typo in `border-b-2` class name immediately.

## Action Items Carried Forward

- Refactor `Fab` to accept `onClick` instead of just `to` when task-10 needs it. (Tracked, not blocking.)
- Add Material Symbols font fallback strategy if offline support is added. (Phase 2.)
