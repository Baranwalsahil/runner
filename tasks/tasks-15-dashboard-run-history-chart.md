# Task 15 — Dashboard run-history bar chart (30-day slider + per-run drill-down)

**Layer:** FE · **Effort:** M · **Prereqs:** task-04 (Player Dashboard), task-10 (runs API), task-11 (territory API)

## Goal

Turn the dashboard's static 7-day "territory growth" bar chart into an
interactive **per-run history chart** covering the **last 30 days**, where:

- Each **bar = one run**, bar height ∝ that run's **cells claimed**.
- The chart **scrolls horizontally** (slide left→right) so all last-30-day runs
  are reachable even when they exceed the panel width.
- **Selecting a bar** drives the rest of the dashboard as if that run's day were
  chosen: the mini hex map renders that run's claimed cells (existing behaviour),
  and a panel beside the map shows that **selected run's metrics**.
- The right-upper stats block shows **all-time best + all-time average** for
  every recorded metric (not only cells + distance).

Keep all current dashboard functionality intact — this is additive/refit, not a
rewrite. No cron, no deletion, no retention job: the 30-day window is a **display
filter only**; runs older than 30 days stay in the DB and still count toward
all-time best/average.

## Why no backend change

`GET /runs` already returns **all** of the signed-in user's runs (no limit, see
`server/app/routers/runs.py::list_runs`). So:
- 30-day chart = client-side filter of that list by `started_at`.
- All-time best/avg = client-side reduce over the full list.
- Per-run cells for the map = existing `GET /runs/{id}/detail` (already wired).

If run volume ever makes the full-list pull heavy, add a stats endpoint later —
out of scope here.

## Recorded metrics (per run)

From `RunSummary` (`distance_meters`, `cells_claimed`, `started_at`, `ended_at`):

| Metric | Source / derivation |
|--------|---------------------|
| Cells claimed | `cells_claimed` |
| Distance (km) | `distance_meters / 1000` |
| Area (km²) | `cells_claimed × HEX_AREA_M2 / 1e6` |
| Duration | `ended_at − started_at` |
| Pace (min/km) | `duration_min / distance_km` (guard distance 0) |

**Best** = best single-run value across **all** runs, per metric (max for
cells/dist/area; for pace, *lowest* min/km is best — flag this in the label).
**Average** = mean across **all** runs, per metric.

## Files touched

- `client/src/routes/Dashboard.jsx`
  - Replace `build7DayChart` with `build30DayRunChart(runs)` → one entry per run
    in the last 30 days, ordered oldest→newest, `{ runId, height, cells, date }`.
  - Compute `allTimeBest` + `allTimeAverage` over the full `runs` list.
  - Build `selectedRunMetrics` for the active run (cells/dist/area/duration/pace).
  - Pass bar-select handler + `selectedRunId` down so a bar click reuses the
    existing `handleSelectRun` path (feed item ids are `run-<uuid>`; keep parity).
- `client/src/components/dashboard/TerritoryDominance.jsx`
  - Make the bar row a **horizontally scrollable** track (overflow-x, fixed bar
    width, snap optional) instead of `flex-1` equal-width bars.
  - Each bar is a **button** (keyboard-focusable) that calls `onSelectBar(runId)`;
    highlight the active bar. Footer label → "LAST 30 DAYS · PER RUN".
  - Empty state when no runs in window.
- `client/src/components/dashboard/QuickRunStats.jsx`
  - Render two columns/rows per metric: **BEST** and **AVG** (extend the `stats`
    item shape, e.g. `{ label, best, avg, unit }`), keep HUD styling.
- **NEW** `client/src/components/dashboard/SelectedRunMetrics.jsx`
  - Panel placed beside the mini hex map showing the selected run's
    cells/distance/area/duration/pace/date. Reuse HUD panel styling.
- Tests:
  - `client/src/test/Dashboard.test.jsx` — update for new chart + best/avg.
  - New tests for bar selection → map update and `SelectedRunMetrics` render.

## Layout (target)

```
┌──────────────────────────────┬──────────────────┐
│ TerritoryDominance            │ QuickRunStats    │
│  30-day per-run bar chart     │  BEST + AVG      │
│  (scroll →, bars clickable)   │  (all metrics)   │
├───────────────┬──────────────┼──────────────────┤
│ TerritoryMap  │ SelectedRun  │ RecentBattlesFeed │
│ Preview       │ Metrics      │ (unchanged)       │
│ (run cells)   │ (sel. run)   │                   │
└───────────────┴──────────────┴──────────────────┘
```

(Exact grid spans tuned during impl; current `md:grid-cols-3` top row and
`lg:grid-cols-4` bottom row are the starting point.)

## Acceptance criteria

- [ ] Chart shows one bar per run from the last 30 days, height ∝ cells claimed,
      ordered oldest→newest, and scrolls horizontally when bars overflow.
- [ ] Clicking a bar selects that run: mini hex map renders that run's claimed
      cells (existing behaviour) and `SelectedRunMetrics` shows that run's
      metrics. Clicking the active bar again deselects (falls back to latest run).
- [ ] Bars are keyboard-accessible (focusable buttons, Enter/Space select).
- [ ] Right-upper block shows BEST and AVG for cells, distance, area, duration,
      and pace, computed over **all** runs (all-time), not just the 30-day window.
- [ ] No backend changes; no cron; no run deletion. Older runs remain in DB.
- [ ] All existing dashboard behaviour (feed, polling, default-to-latest-run map)
      still works. `npm test` green.

## Out of scope

- Any backend endpoint, migration, cron, or retention/deletion job.
- Weekly/monthly aggregation, multi-run-per-day bucketing (1 bar = 1 run).
- New metrics not already derivable from `RunSummary`.
