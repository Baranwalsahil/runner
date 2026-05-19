# TASK-005: Battlefield Map (MapLibre + h3-js)

**Complexity**: Level 3
**Status**: COMPLETE
**Roadmap**: N/A
**Branch**: feat/task-05-battlefield-map (merged → main)
**Worktree**: N/A
**Source brief**: [tasks/tasks-05-battlefield-map.md](../../tasks/tasks-05-battlefield-map.md)

## Task Description

Port `stitch_territory_runner/battlefield_map.html` → `client/src/routes/Battlefield.jsx`. Real interactive MapLibre GL JS map with hex overlay via `h3-js`. Mock claimed-cell data hardcoded for now. ~50 cells around Seattle (`gridDisk` k=4 at H3 res 9, 4 owner colors). Click cell → `CellDetailPanel` (h3Index, owner, ownership %, CHALLENGE CTA). MapHud overlays: live battles count, zoom buttons, layer toggles, legend. PlayersOnline sidebar with mock runners.

## User Journey Definition

**Feature Type**: End-User Feature (core gameplay surface)
**Creative Phase Required**: Yes (Architecture — MapLibre/h3-js integration; UI/UX — HUD overlays)

### Invocation Method
- **Location**: `/battlefield` route
- **Element**: tap a hex cell on the map; HUD zoom/locate/layers buttons
- **Visibility**: always (auth-gated in Phase 2 task-09)
- **Navigation**: cell click → in-place `CellDetailPanel` populates with selected cell's data

### Success Criteria
- **User sees**: OSM-dark map centered on Seattle with ~50 hex overlays in 3-4 owner colors.
- **User can verify at**: `http://localhost:5173/battlefield`.
- **Data persisted**: none yet (mock data).
- **Observable within**: instant (single render after MapLibre init).

### Acceptance Criteria
- AC-ENTRY-1: `/battlefield` renders MapLibre canvas centered on Seattle (47.6062, -122.3321).
- AC-HAPPY-1: ~50 hex cells overlay map in 4 owner colors at H3 res 9.
- AC-HAPPY-2: Click hex cell → `CellDetailPanel` populates with that cell's data.
- AC-HAPPY-3: Zoom buttons trigger `map.zoomIn()` / `map.zoomOut()`.
- AC-ERROR-1: No MapLibre console warnings about missing tiles.

## Test Strategy

### Approach
- **Emphasis**: unit tests for `h3Utils`; component tests with MapLibre mocked.
- **Target test count**: ~25 tests across utilities, components.

### File Organization
- New: `client/src/__mocks__/maplibre-gl.js` (vi auto-mock for `Map`, `addSource`, etc.).
- New co-located: `h3Utils.test.js`, `mapStyle.test.js`, `MapCanvas.test.jsx`, `MapHud.test.jsx`, `CellDetailPanel.test.jsx`, `PlayersOnline.test.jsx`, `Battlefield.test.jsx`.

### What NOT to Test
- MapLibre tile fetch — mocked.
- Visual rendering of polygons — human gate.
- h3-js internal correctness — assume library.

## Implementation Roadmap

- [x] Phase 1: `npm install maplibre-gl h3-js`
- [x] Phase 2: `lib/h3Utils.js` (`cellToBoundary`, `cellsToGeoJSON`)
- [x] Phase 3: `lib/mapStyle.js` (OSM raster source + dark paint)
- [x] Phase 4: `data/mockCells.js` (gridDisk k=4 around Seattle, 4 owners, deterministic colors)
- [x] Phase 5: `MapCanvas.jsx` (useRef + MapLibre init in useEffect; GeoJSON source + fill + line layers; click handler; setData on cells change)
- [x] Phase 6: `MapHud.jsx` (live battles, zoom/locate/layers, legend)
- [x] Phase 7: `CellDetailPanel.jsx` (h3Index/owner/ownership/CHALLENGE)
- [x] Phase 8: `PlayersOnline.jsx`
- [x] Phase 9: `Battlefield.jsx` composes all + `selectedCell` state
- [x] Phase 10: MapLibre mock in `__mocks__/`; Vitest run → 108/108 pass; import `maplibre-gl/dist/maplibre-gl.css` into `index.css`

## Creative Phases

- [x] Architecture design → [creative/TASK-005-battlefield-architecture.md](../creative/TASK-005-battlefield-architecture.md)
- [x] UI/UX design → [creative/TASK-005-battlefield-uiux.md](../creative/TASK-005-battlefield-uiux.md)

---

## Execution State

**Build Status**: IDLE
**Last Completed**: 2026-05-16
**Can Resume**: NO (COMPLETE)

### Completed Steps
- 2026-05-16: MapLibre + h3-js wired; mockCells via gridDisk; all panels live; 108/108 tests
- 2026-05-16: merged feat/task-05-battlefield-map → main
