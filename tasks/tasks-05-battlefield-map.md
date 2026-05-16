# Task 05 — Battlefield Map (MapLibre + H3)

## Goal

Port `stitch_territory_runner/battlefield_map.html` → `client/src/routes/Battlefield.jsx`. Real interactive map using MapLibre GL JS, hex overlay via h3-js. Mock claimed-cell data hardcoded for now.

## Prereqs

- Tasks 01, 02 done

## Source of truth

- HTML: `stitch_territory_runner/battlefield_map.html`
- Screenshot: `stitch_territory_runner/battlefield_map.png`

## Install

```bash
cd /home/sahil/runner/client
npm install maplibre-gl h3-js
```

## Files to create

| Path | Purpose |
|------|---------|
| `client/src/lib/h3Utils.js` | Helpers: `cellToBoundary(h3Index)` → `[[lng,lat],...]` ring; `cellsToGeoJSON(cellsWithOwners)` → FeatureCollection of polygons w/ owner color prop |
| `client/src/lib/mapStyle.js` | Export MapLibre style JSON pointing at OSM tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) w/ dark filter via CSS `filter: invert(1) hue-rotate(180deg)` or use OSM dark tiles |
| `client/src/components/battlefield/MapCanvas.jsx` | `useRef` for div + `useEffect` for MapLibre init. Props: `cells` (array of `{h3Index, ownerId, color}`), `onCellClick`. Adds GeoJSON source + fill layer + outline layer. Re-add layer on `cells` change. |
| `client/src/components/battlefield/MapHud.jsx` | Overlay HUD: live battles badge, layer toggles, zoom buttons (call `map.zoomIn/zoomOut`), legend |
| `client/src/components/battlefield/CellDetailPanel.jsx` | Side/floating panel for selected cell — owner, claim time, ownership %, "Challenge" button |
| `client/src/components/battlefield/PlayersOnline.jsx` | Sidebar list of nearby live runners (mock data) |
| `client/src/routes/Battlefield.jsx` | Compose MapCanvas + HUD + side panels. Manages `selectedCell` state. |

## Mock data

`client/src/data/mockCells.js`:

```js
import { latLngToCell } from 'h3-js';
// Seattle center: 47.6062, -122.3321
const center = [47.6062, -122.3321];
export const mockCells = [
  // generate ~50 cells around center at resolution 9
  // owners cycle through 3-4 user ids → distinct colors
];
```

Provide a small generator helper: `kRing(centerCell, 4)` → spread cells, assign random owner.

## CSS

Add to `index.css`:

```css
@import "maplibre-gl/dist/maplibre-gl.css";
```

## Acceptance

- `/battlefield` renders OSM-dark map centered on Seattle
- ~50 hex cells overlay map in 3-4 owner colors at H3 res 9
- Click a cell → CellDetailPanel populates w/ that cell's data
- Zoom in/out HUD buttons work
- No MapLibre console warnings about missing tiles

## Out of scope

- Live GPS tracking — task 10
- Real claimed-cell API — task 11
- WebSocket cell updates — task 12
