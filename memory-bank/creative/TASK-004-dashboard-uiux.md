# Creative — UI/UX — TASK-004 Player Dashboard

**Task**: TASK-004
**Type**: UI/UX
**Date**: 2026-05-16
**Status**: APPROVED + IMPLEMENTED

## Context

Port `player_dashboard.html` to React. The interesting design question is how to model the "View Full History" load-more interaction in `RecentBattlesFeed`. The Stitch HTML already had JS that toggles the list, but it's a vanilla DOM pattern; React needs a clean state model.

## Options Considered

### Option A — Phase enum (`'initial' | 'expanded' | 'end'`)
- Pros: Explicit; extensible to additional phases.
- Cons: Over-engineered for two UI states; encourages adding fake intermediate phases.

### Option B — Boolean `loaded` (CHOSEN)
- Pros: Matches the two-state user mental model: "list initial" vs "list full + terminal CTA". Minimal state surface.
- Cons: Doesn't generalize if a real paged API appears.

### Option C — Hide the button entirely when `loaded`
- Pros: Cleaner DOM.
- Cons: Loses the "End of History" affordance the mockup specifies — users want a positive completion signal, not silent disappearance.

## Decision

**Option B** with disabled terminal button.

- `useState(false)` → `loaded`.
- Click handler: `setLoaded(true)` + append `extraBattles` to the rendered list + call `scrollIntoView({behavior:'smooth', block:'start'})` on the first newly-rendered item ref.
- Terminal state: button label "End of History" + check icon + `disabled` attribute.

## Rationale

- Two visible UX states ⇔ one boolean. KISS.
- Disabled button (not removed) preserves the mockup's positive-feedback "End of History" line — important for closure-seeking users.
- `scrollIntoView` on the first new item gives a polished feel without animation libs.

## Implementation Notes

- Mock data colocated in `RecentBattlesFeed.jsx` (`initialBattles`, `extraBattles` arrays). Swap point for task-11 API: `useRecentBattles()` hook returning `{initial, more, fetchMore}`.
- Fixed `h-[500px]` + `overflow-y-auto` on the panel keeps page height stable when content grows.
- AlertBar contested-sector message hardcoded in route — promote to notifications-store at task-12.

## Trade-offs Accepted

- `scrollIntoView` ref pattern is fragile under list virtualization. Acceptable: list size is small (4+8). Revisit if virtualizing.
- Mock chart in `TerritoryDominance` is 7 hardcoded `<div>` bars. No Recharts yet. Replace at task-11.

## Validation

- 83/83 vitest pass.
- Click "View Full History" → 8 rows append; button disabled with "End of History"; first new item scrolls into view.
