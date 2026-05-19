# Creative — UI/UX — TASK-005 Battlefield Map

**Task**: TASK-005
**Type**: UI/UX
**Date**: 2026-05-16
**Status**: APPROVED + IMPLEMENTED

## Context

Compose HUD overlays (zoom, layer toggles, live-battles count, legend) and the `CellDetailPanel` over a MapLibre canvas. The design question is layering and how cell selection is communicated.

## Options Considered

### Option A — Modal `CellDetailPanel` on click
- Pros: Strong visual hierarchy when a cell is selected.
- Cons: Blocks map interaction; user can't pan/inspect neighbors while panel is open.

### Option B — Floating side panel anchored bottom-left, persistent (CHOSEN)
- Pros: Map remains fully interactive; selected-cell context stays visible; matches Stitch mockup.
- Cons: Smaller panel real estate.

### Option C — Tooltip overlay on hover, click is no-op
- Pros: Lightweight.
- Cons: Mobile (no hover) loses the affordance entirely; can't read details at leisure.

## Decision

**Option B** — `CellDetailPanel` always present in DOM, populated when a cell is selected, empty-state when none.

- Cell selection is a single `selectedCell` state at `Battlefield.jsx`.
- HUD overlays (`MapHud`) sit `absolute inset-0 pointer-events-none` with interactive children `pointer-events-auto` — keeps map fully interactive in the gaps.
- `PlayersOnline` sidebar lives on the right edge with `pointer-events-auto` so its scroll doesn't bleed into the map.

## Rationale

- Mobile-first concession: hover tooltips are dead on touch; persistent panel works on both.
- Single source of truth for selection (`Battlefield.jsx` state) means HUD + CellDetailPanel + PlayersOnline can all react without a context provider.
- `pointer-events-none` on the overlay container + `pointer-events-auto` on the controls is the cleanest way to keep the map drag-pan working through the chrome.

## Trade-offs Accepted

- `CellDetailPanel` empty state takes screen real estate even when no cell is selected. Acceptable: signals to the user "you can click any cell."
- HUD controls (zoom, locate, layers) on the bottom-right edge will eventually conflict with the FAB (TopNav already places `Fab` bottom-right). Resolved: HUD shifted left a bit; revisit in Phase 2 if FAB grows.

## Validation

- Click cell → panel populates; pan/zoom still works while panel is open.
- Zoom buttons in HUD trigger `map.zoomIn()`/`map.zoomOut()` (intercepted by MapLibre instance ref).
