# Reflection — TASK-004: Player Dashboard

**Task**: TASK-004
**Completed**: 2026-05-16
**Complexity**: Level 2
**Branch**: feat/task-04-player-dashboard (merged)

## Outcome

`TerritoryDominance` (mock 7-bar chart), `QuickRunStats`, `TerritoryMapPreview` (static), `RecentBattlesFeed` (load-more state machine with `scrollIntoView` on first new item, terminal disabled state). `AlertBar` enabled on `/dashboard` with contested-sector message. 83/83 vitest.

## What Went Well

- `RecentBattlesFeed` state machine was simple and explicit: `useState(false)` for `loaded`, click handler appends `extraBattles` and flips state. Terminal state (`loaded=true`) makes button disabled + relabels — no separate "phase" concept needed.
- `scrollIntoView({behavior: 'smooth', block: 'start'})` on the first newly-rendered item gave a polished feel without any animation library.
- Mock data lives inside the component file (`initialBattles`, `extraBattles` arrays). Single source; trivial to replace with API hook in task-11 (`useRecentBattles()`).
- Internal-scroll panel (`h-[500px]` + `overflow-y-auto`) keeps page height stable.

## What Could Have Been Better

- The mock chart in `TerritoryDominance` is 7 hardcoded `<div>` bars. Functional but ugly under inspection. Will replace with Recharts in Phase 2 (out of scope here).
- `scrollIntoView` on a ref obtained via `useRef` then attached to a dynamic list item works but feels fragile — if the list ever virtualizes, the ref binding breaks. Note for Phase 2.
- AlertBar message ("SECTOR B-4: CONTESTED BY @RUNNER_X") is hardcoded in the route. Should accept a prop or read from a notifications store once task-12 realtime is in.

## Key Learnings

- **State machines from mock JSON**: encode the load-more transition as a boolean (`loaded`) + terminal labeling, not as a phase enum. The boolean form was easier to test and matches the user-facing two-state UX.
- **Internal scroll containers**: always fix height (e.g. `h-[500px]`) AND `overflow-y-auto` — otherwise scroll lives on `<body>` and the page grows.
- **Mock data colocation**: leaving mocks inside the component (vs. `data/`) is fine when they'll get swapped for an API call. Move to `data/` only if shared.
- **`scrollIntoView` ref pattern**: stable when list is non-virtualized; revisit if/when virtualization arrives.

## Process Notes

- Test for "click View Full History → 8 more rows visible + button disabled" caught a regression mid-implementation when the initial state was accidentally reset on re-render.

## Action Items Carried Forward

- Replace mock chart with Recharts when adding real data (task-11+).
- Promote AlertBar message to a notifications-store/realtime consumer in task-12.
- Revisit `scrollIntoView` pattern if virtualization is added.
