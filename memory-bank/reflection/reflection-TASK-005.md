# Reflection — TASK-005: Battlefield Map (MapLibre + h3-js)

**Task**: TASK-005
**Completed**: 2026-05-16
**Complexity**: Level 3
**Branch**: feat/task-05-battlefield-map (merged)

## Outcome

MapLibre GL JS 5.24 + h3-js 4.4 wired. `lib/h3Utils` (`cellToBoundary`, `cellsToGeoJSON`). `lib/mapStyle` (OSM raster source + dark paint). `data/mockCells` (gridDisk k=4 around Seattle res 9, 4 owner colors). Components: `MapCanvas` (GeoJSON source/fill/line, click handler, `setData` on cells change), `MapHud`, `CellDetailPanel`, `PlayersOnline`. `Battlefield.jsx` composes + manages `selectedCell`. MapLibre mocked in tests via `__mocks__/maplibre-gl.js`. 108/108 vitest. CSS import for `maplibre-gl.css` placed in `index.css`.

## What Went Well

- Mocking MapLibre at the module boundary (`client/src/__mocks__/maplibre-gl.js`) was the right call — testing rendering of polygons through a real map is not what unit tests should cover.
- `setData()` on existing GeoJSON source (rather than removing and re-adding the source + layer on every `cells` change) avoided MapLibre style-loading flicker.
- Click handler used `map.on('click', layerId, ...)` (not a global `click` listener) so non-hex clicks pass through cleanly.
- `h3-js` `gridDisk` (was `kRing` in older docs) is the current API — caught the rename early thanks to a `Context7` doc fetch.

## What Could Have Been Better

- Initially put `import 'maplibre-gl/dist/maplibre-gl.css'` at the top of `MapCanvas.jsx`. That works in dev but Vite tree-shook the CSS in build. Moved to `index.css` `@import`. Lesson: third-party CSS belongs in the global stylesheet, not in component files.
- `MapCanvas` `useEffect` cleanup did not remove the map instance — left a warning in dev when the route unmounted. Added `map.remove()` in cleanup; should have been there from the start.
- Color assignment to owners was index-based on a fixed array — would re-color if owner order changed. Switched to deterministic hash of `ownerId` mid-task; should be the default approach for any "color by id" feature.

## Key Learnings

- **Third-party CSS**: import in `index.css`, not in component files. Vite tree-shakes component-imported CSS in some build paths.
- **MapLibre source vs. layer rebuild**: prefer `source.setData()` over `removeLayer` + `removeSource` + `addSource` + `addLayer`. Faster and avoids flicker.
- **Cleanup matters**: `useEffect` returning a cleanup that calls `map.remove()` prevents stale instances during route navigation.
- **Color-by-id**: hash → lookup palette, not array-index. Deterministic across data ordering.
- **Mock at module boundary**: for canvas/WebGL libs, `__mocks__/<lib>.js` with `vi.mock(<lib>)` is cleaner than per-test mocks.
- **h3-js API**: `gridDisk` (not `kRing`); `latLngToCell` (not `geoToH3`); names updated in h3-js v4+.

## Process Notes

- Stopped to fetch h3-js docs via Context7 when an old code sample used `kRing` — saved a confusing build error.
- Test count jumped from 83→108 (+25); roughly 5 per new component which matched the test-per-component-behavior pattern.

## Action Items Carried Forward

- When task-11 hits (real `GET /territory` API): swap `mockCells` import for a `useTerritory(bounds)` hook. The component contract (`cells={...}` prop) is stable.
- Confirm `map.remove()` cleanup pattern is documented in `agent-rules/frontend-conventions.md`.
