# Creative — Architecture — TASK-005 Battlefield Map

**Task**: TASK-005
**Type**: Architecture
**Date**: 2026-05-16
**Status**: APPROVED + IMPLEMENTED

## Context

Wire MapLibre GL JS + h3-js into a React component that can re-render claimed cells as data changes. The architectural decision is *how* React's render loop and MapLibre's imperative map API coexist without leaking memory or flickering.

## Options Considered

### Option A — Tear down + re-init MapLibre on every `cells` change
- Pros: Simple "treat MapLibre as a pure function of props" mental model.
- Cons: Map flickers on every change; tile fetches re-trigger; pan/zoom state lost.

### Option B — `useEffect` for map init (once); `useEffect` for source update (on `cells`) — CHOSEN
- Pros: Map persists across data changes; pan/zoom preserved; updates flow via `source.setData()`.
- Cons: Two effects to keep in sync; cleanup must be careful.

### Option C — Treat MapLibre instance as global app singleton
- Pros: No init cost on route change.
- Cons: Global state in React is a code smell; complicates testing; route-level cleanup hard.

## Decision

**Option B** — instance + source live for the component lifetime; data flows through `source.setData()`.

```jsx
useEffect(() => {
  const map = new maplibregl.Map({ container: ref.current, style: mapStyle, center, zoom });
  map.on('load', () => {
    map.addSource('cells', { type: 'geojson', data: cellsToGeoJSON([]) });
    map.addLayer({ id: 'cells-fill', type: 'fill', source: 'cells', paint: { ... } });
    map.addLayer({ id: 'cells-line', type: 'line', source: 'cells', paint: { ... } });
    map.on('click', 'cells-fill', (e) => onCellClick(e.features[0].properties.h3Index));
  });
  mapRef.current = map;
  return () => map.remove();   // ← CRITICAL: prevents stale instances on route unmount
}, []);

useEffect(() => {
  const map = mapRef.current;
  if (!map || !map.getSource('cells')) return;
  map.getSource('cells').setData(cellsToGeoJSON(cells));
}, [cells]);
```

## Rationale

- `source.setData()` is the documented MapLibre pattern for incremental updates — far cheaper than removing layers/sources.
- `map.remove()` in cleanup is non-negotiable: without it, route-unmount leaks the canvas + WebGL context.
- Mocking MapLibre at the module boundary (`client/src/__mocks__/maplibre-gl.js`) means tests assert React behavior (click → state change) without a real map.

## Testing Strategy

- `client/src/__mocks__/maplibre-gl.js` exports a vi-stubbed `Map` class with `on`, `addSource`, `addLayer`, `getSource(...).setData`, `remove` as `vi.fn()`s.
- Vitest auto-resolves the mock because the file name matches the import name.

## Trade-offs Accepted

- Two `useEffect` blocks (init + update) must stay in sync. Acceptable because the contract (one map, one source, props flow through `setData`) is explicit and small.
- Cell color is computed app-side per feature in `cellsToGeoJSON()` rather than via MapLibre's `match` expression. Means re-coloring requires re-running `setData`. Acceptable: cell counts stay small (<10K viewport).

## Validation

- 108/108 vitest pass with MapLibre mocked.
- Manual smoke: map renders, 50 cells visible, click cell → panel populates, pan/zoom preserved.
