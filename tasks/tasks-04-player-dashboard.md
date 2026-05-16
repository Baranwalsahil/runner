# Task 04 — Player Dashboard

## Goal

Port `stitch_territory_runner/player_dashboard.html` → `client/src/routes/Dashboard.jsx`. Includes scrollable Recent Battles list with "View Full History" load-more behavior already implemented in HTML.

## Prereqs

- Tasks 01, 02 done

## Source of truth

- HTML: `stitch_territory_runner/player_dashboard.html` (already edited — scrollable battles + JS toggle)
- Screenshot: `stitch_territory_runner/player_dashboard.png`

## Files to create

| Path | Purpose |
|------|---------|
| `client/src/routes/Dashboard.jsx` | Compose blocks below + `<AlertBar>` w/ contested-sector message |
| `client/src/components/dashboard/TerritoryDominance.jsx` | Big lime panel: total cells + mock bar chart (7 bars w/ varying heights). Props accept `cells`, `chartData`. |
| `client/src/components/dashboard/QuickRunStats.jsx` | Pace/Miles/Calories panel + "Log Session" button |
| `client/src/components/dashboard/TerritoryMapPreview.jsx` | Map preview tile w/ HUD overlay (live battles count, zoom buttons, floating hex detail). Static image for now — real MapLibre is task 05. |
| `client/src/components/dashboard/RecentBattlesFeed.jsx` | Scrollable list. Internal state: `loaded` bool, hardcoded `initialBattles` + `extraBattles` arrays. Click "View Full History" → append extras, swap label to "End of History", disable button, scrollIntoView first new. Panel fixed `h-[500px]`. |

## Data shape (mock for now)

```js
const battle = {
  id: string,
  type: 'lost' | 'gained' | 'defended',
  label: string,            // "Territory Lost"
  time: string,             // "2m ago"
  title: string,            // "Sector D-9 Overrun"
  subjectLabel: string,     // "by" | "Claimed from" | "3 cells held vs"
  user: string,             // "@GhostRunner"
  accent: boolean,          // green highlight for gains
  challengeable?: boolean
};
```

Hardcode arrays in component. Real API wire-up = task 11.

## Conversion rules

- Mirror task 03 conversion rules
- Replace inline `<script>` JS w/ `useState` + `onClick` handler
- `data-alt` attrs → `alt`
- Map preview image: download to `client/public/img/dashboard/map-preview.jpg`

## Acceptance

- `/dashboard` renders close to `player_dashboard.png`
- Click "View Full History" → 8 more battle items appear, button disables, label becomes "End of History" w/ check icon
- Recent Battles panel scrolls internally; whole page does NOT grow
- AlertBar shows "SECTOR B-4: CONTESTED BY @RUNNER_X" with RECLAIM button

## Out of scope

- Real-time battle feed — task 12
- Real chart lib (Chart.js / Recharts) — keep mock divs
- Backend wiring — task 11
