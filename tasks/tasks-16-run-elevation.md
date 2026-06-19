# Task 16 — Average elevation per run

**Layer:** FE + BE · **Effort:** M · **Prereqs:** tasks 10 (runs API), 11 (run detail), 15 (dashboard RUN.DETAIL card)

## Goal

Detect the **average elevation** of a run and surface it in the dashboard
RUN.DETAIL card (`SelectedRunMetrics`). Elevation comes from the device GPS
altitude already exposed by the browser Geolocation API — no external elevation
service, no new dependency.

## Approach

Browser `Position.coords.altitude` (metres above WGS84 ellipsoid) is captured
per GPS point alongside lat/lng. On run ingest the backend averages the
non-null altitudes and stores it on the `runs` row as `avg_elevation_m`. The
value flows back through the existing run-detail API and renders as a new
`ELEV` metric row in the RUN.DETAIL card, plus a BEST/AVG column in
`QuickRunStats`.

Altitude can be `null` (desktop, no GPS fix, some devices). Treat it as
**optional end-to-end**: skip nulls when averaging; if a run has zero altitude
samples store `NULL`; the UI shows `—`.

## Files touched

### Backend (`server/`)
- `migrations/005_run_avg_elevation.sql` — **new**. Idempotent
  `ALTER TABLE runs ADD COLUMN IF NOT EXISTS avg_elevation_m DECIMAL(8,2)`.
- `app/db/schema.sql` — add the column to the `runs` definition (keep in sync).
- `app/schemas/run.py`
  - `Point` gains `alt: float | None = None`.
  - `RunSummary` + `RunDetail` gain `avg_elevation_m: float | None`.
- `app/services/run_service.py`
  - `ingest_run`: compute `avg_elevation_m` from non-null `p.alt` over the
    **filtered** trace (mean, rounded to 2dp; `None` if no samples). Persist it
    in the `INSERT INTO runs (...)`.
  - `list_runs` / `get_run` / `get_run_detail`: select + return the new column
    (cast `float()` when not None).

### Frontend (`client/`)
- `src/hooks/useGeolocation.js` — include `alt: pos.coords.altitude ?? null`
  on each captured point.
- `src/lib/runSession.js` — ensure `alt` survives the localStorage round-trip
  (no change expected if it serialises the whole point object; verify).
- `src/lib/api.js` — `runs.detail` / `runs.list` adapters pass through
  `avg_elevation_m` (verify; likely already pass full object).
- `src/routes/Dashboard.jsx`
  - `runMetrics(r)`: derive `avgElevationM = r.avg_elevation_m` (Number or null).
  - `selectedRunMetrics.rows`: add `{ label: "ELEV", value: formatElevation(m.avgElevationM), unit: "M" }`.
  - `buildAllTimeStats`: add an `ELEV` row (best = max, avg = mean over runs
    that have a value; `—` when none).
  - add `formatElevation(m)` helper → integer metres or `—`.
- `src/components/dashboard/SelectedRunMetrics.jsx` — no change (data-driven by
  `rows`).
- `src/components/dashboard/QuickRunStats.jsx` — no change (data-driven by
  `stats`), but confirm it renders a 6th row cleanly.

## Acceptance criteria

- [ ] POST `/runs` with a trace carrying `alt` values stores a non-null
      `avg_elevation_m` ≈ mean of supplied altitudes.
- [ ] POST `/runs` with no `alt` values stores `NULL`; no error.
- [ ] GET `/runs` and GET `/runs/{id}` return `avg_elevation_m`.
- [ ] Dashboard RUN.DETAIL card shows an `ELEV … M` row for the selected run
      (or `—` when unknown).
- [ ] `QuickRunStats` shows BEST/AVG elevation across all runs.
- [ ] Migration `005` is idempotent (re-run prints skip).
- [ ] Existing pytest + vitest suites stay green; new tests cover the average
      (non-null mix, all-null → None) and the `formatElevation` helper.
- [ ] Chrome verify: seed/record a run, open dashboard, confirm ELEV renders.

## Out of scope

- External elevation lookup API (Open-Elevation, SRTM) — device altitude only.
- Elevation gain/loss (cumulative ascent) — average only this task.
- Elevation-based scoring / hill-bonus game mechanics.
- Smoothing/Kalman of the altitude channel.
