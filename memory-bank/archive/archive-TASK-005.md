# Archive — TASK-005: Battlefield Map (MapLibre + h3-js)

**Task**: TASK-005
**Complexity**: Level 3
**Status**: COMPLETE
**Archived**: 2026-05-19 (retroactive — task closed 2026-05-16)
**Branch**: feat/task-05-battlefield-map (merged → main, deleted)

## Summary

Interactive MapLibre GL JS 5.24 map with h3-js 4.4 hex overlay. ~50 mock cells around Seattle (gridDisk k=4, H3 res 9, 4 owner colors). Click cell → `CellDetailPanel`. HUD overlays (zoom, layers, legend). `PlayersOnline` sidebar.

## Acceptance Criteria — Outcome

| AC | Status |
|----|--------|
| AC-ENTRY-1 `/battlefield` renders OSM-dark map centered on Seattle | PASS |
| AC-HAPPY-1 ~50 hex cells in 4 owner colors at H3 res 9 | PASS |
| AC-HAPPY-2 Click cell → `CellDetailPanel` populates | PASS |
| AC-HAPPY-3 Zoom buttons trigger `map.zoomIn`/`zoomOut` | PASS |
| AC-ERROR-1 No MapLibre missing-tile warnings | PASS |

## Files Created / Modified

- `client/src/lib/{h3Utils,mapStyle}.js` + `*.test.js`
- `client/src/data/mockCells.js`
- `client/src/components/battlefield/{MapCanvas,MapHud,CellDetailPanel,PlayersOnline}.jsx` + `*.test.jsx`
- `client/src/routes/Battlefield.jsx` (compose + `selectedCell` state)
- `client/src/__mocks__/maplibre-gl.js` (vi mock module)
- `client/src/index.css` (added `@import "maplibre-gl/dist/maplibre-gl.css"`)
- `client/package.json` (added `maplibre-gl`, `h3-js`)

## Test Outcome

- Vitest: 108/108 PASS
- Curl 200 on all battlefield modules

## Linked Documents

- Source brief: [tasks/tasks-05-battlefield-map.md](../../tasks/tasks-05-battlefield-map.md)
- Plan: [tasks/TASK-005.md](../tasks/TASK-005.md)
- Creative (Architecture): [creative/TASK-005-battlefield-architecture.md](../creative/TASK-005-battlefield-architecture.md)
- Creative (UI/UX): [creative/TASK-005-battlefield-uiux.md](../creative/TASK-005-battlefield-uiux.md)
- Reflection: [reflection/reflection-TASK-005.md](../reflection/reflection-TASK-005.md)

## Carry-forward TODOs

- When task-11 `GET /territory` lands: swap `mockCells` import for `useTerritory(bounds)` hook. Component contract (`cells={...}` prop) is stable.
