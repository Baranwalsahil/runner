# TASK-004: Player Dashboard

**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: N/A
**Branch**: feat/task-04-player-dashboard (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-04-player-dashboard.md](../../tasks/tasks-04-player-dashboard.md)

## Task Description

Port `stitch_territory_runner/player_dashboard.html` → `client/src/routes/Dashboard.jsx`. Compose `TerritoryDominance` (7-bar mock chart), `QuickRunStats`, `TerritoryMapPreview` (static img + HUD overlays + zoom), `RecentBattlesFeed` (4 initial + 8 extra; load-more swaps to "End of History" + check icon + disabled state + scrollIntoView first new item). `AlertBar` enabled on `/dashboard` showing "SECTOR B-4: CONTESTED BY @RUNNER_X" with RECLAIM button.

## User Journey Definition

**Feature Type**: End-User Feature (authenticated home)
**Creative Phase Required**: Yes (UI/UX — scrollable battles + load-more state machine)

### Invocation Method
- **Location**: `/dashboard` route
- **Element**: "View Full History" button in `RecentBattlesFeed`
- **Visibility**: button visible when `loaded=false`; disabled + relabeled when `loaded=true`
- **Navigation**: in-place state change (no route change)

### Success Criteria
- **User sees**: dashboard chrome + scrollable battles list; click "View Full History" reveals 8 more rows, label flips to "End of History" with check icon, button disabled.
- **User can verify at**: `http://localhost:5173/dashboard`.
- **Data persisted**: none yet (mock arrays in component).
- **Observable within**: same render cycle as click.

### Acceptance Criteria
- AC-ENTRY-1: `/dashboard` renders close to `player_dashboard.png`.
- AC-HAPPY-1: Click "View Full History" → 8 extra battle items appear.
- AC-HAPPY-2: Button label → "End of History" with check icon; button disabled.
- AC-HAPPY-3: RecentBattles scrolls internally; whole page does NOT grow.
- AC-HAPPY-4: AlertBar shows "SECTOR B-4: CONTESTED BY @RUNNER_X" with RECLAIM CTA.
- AC-ERROR-1: No console errors.

## Test Strategy

### Approach
- **Emphasis**: state-machine tests for `RecentBattlesFeed` (load-more flow); render tests for other panels.
- **Target test count**: ~22 tests dashboard-wide.

### File Organization
- New co-located: `TerritoryDominance.test.jsx`, `QuickRunStats.test.jsx`, `TerritoryMapPreview.test.jsx`, `RecentBattlesFeed.test.jsx`, `Dashboard.test.jsx`.

### What NOT to Test
- Real chart library (using mock divs intentionally — task scope).
- Image fetch network.

## Implementation Roadmap

- [x] Phase 1: `TerritoryDominance` (lime panel + 7-bar mock chart)
- [x] Phase 2: `QuickRunStats` (pace/miles/calories + Log Session)
- [x] Phase 3: `TerritoryMapPreview` (static image + HUD overlays + zoom buttons)
- [x] Phase 4: `RecentBattlesFeed` (load-more state, scrollIntoView, disabled terminal state)
- [x] Phase 5: `Dashboard.jsx` composes panels + `AlertBar` with contested-sector message
- [x] Phase 6: Vitest run → 83/83 pass

## Creative Phases

- [x] UI/UX design → [creative/TASK-004-dashboard-uiux.md](../creative/TASK-004-dashboard-uiux.md)

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: 4 panels + dashboard route + 83/83 tests
- 2026-05-16: merged feat/task-04-player-dashboard → main
