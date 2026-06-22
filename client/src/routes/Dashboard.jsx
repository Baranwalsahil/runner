import { useCallback, useEffect, useState } from "react";
import TerritoryDominance from "../components/dashboard/TerritoryDominance.jsx";
import QuickRunStats from "../components/dashboard/QuickRunStats.jsx";
import TerritoryMapPreview from "../components/dashboard/TerritoryMapPreview.jsx";
import SelectedRunMetrics from "../components/dashboard/SelectedRunMetrics.jsx";
import { cellToLatLng } from "h3-js";
import useAuth from "../hooks/useAuth.js";
import useCurrentLocation from "../hooks/useCurrentLocation.js";
import { apiJson } from "../lib/auth.js";
import { runs as runsApi, territory } from "../lib/api.js";

const PAGE_SIZE = 4;
const HEX_AREA_M2 = 105_332.353; // H3 resolution 9 average hex area
const NEARBY_RADIUS_KM = 50;
const RUN_CELL_COLOR = "#c3f400"; // lime fill for a selected run's claimed cells

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function filterCellsNearLocation(cells, position, radiusKm) {
  if (!position || !cells?.length) return cells || [];
  return cells.filter((c) => {
    try {
      const [lat, lng] = cellToLatLng(c.h3Index);
      return haversineKm(position, { lat, lng }) <= radiusKm;
    } catch {
      return false;
    }
  });
}

const DAY_MS = 86_400_000;
const CHART_WINDOW_DAYS = 30;

// One bar per run from the last 30 days, oldest→newest, height ∝ cells claimed.
// Feed ids are prefixed "run-", so bar runId matches that for selection parity.
function build30DayRunChart(runs) {
  const now = Date.now();
  const windowRuns = runs
    .filter((r) => {
      const t = new Date(r.started_at).getTime();
      const daysAgo = (now - t) / DAY_MS;
      return daysAgo >= 0 && daysAgo < CHART_WINDOW_DAYS;
    })
    .slice()
    .sort(
      (a, b) =>
        new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
    );
  const max = windowRuns.reduce(
    (m, r) => Math.max(m, Number(r.cells_claimed) || 0),
    1,
  );
  const count = windowRuns.length;
  return windowRuns.map((r, i) => {
    const cells = Number(r.cells_claimed) || 0;
    return {
      runId: `run-${r.id}`,
      cells,
      started_at: r.started_at,
      height: Math.max(8, Math.round((cells / max) * 100)),
      opacity: count > 1 ? 40 + Math.round((i / (count - 1)) * 60) : 100,
      date: new Date(r.started_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    };
  });
}

// Per-run derived metrics used by the bar drill-down + best/avg rollups.
function runMetrics(r) {
  const cells = Number(r.cells_claimed) || 0;
  const distanceM = Number(r.distance_meters) || 0;
  const durationMs =
    r.started_at && r.ended_at
      ? new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()
      : 0;
  const areaM2 = cells * HEX_AREA_M2;
  const paceMinPerKm =
    distanceM > 0 && durationMs > 0
      ? durationMs / 60_000 / (distanceM / 1000)
      : null;
  const elevationGainM =
    r.avg_elevation_m == null ? null : Number(r.avg_elevation_m);
  return { cells, distanceM, durationMs, areaM2, paceMinPerKm, elevationGainM };
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatPace(minPerKm) {
  if (minPerKm == null || !isFinite(minPerKm) || minPerKm <= 0) return "—";
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  // Carry seconds rounding (e.g. 5'60" → 6'00").
  const mm = s === 60 ? m + 1 : m;
  const ss = s === 60 ? 0 : s;
  return `${mm}'${String(ss).padStart(2, "0")}"`;
}

// Elevation gain, rounded to whole metres. Null/unknown → em dash.
function formatElevation(m) {
  if (m == null || !isFinite(m)) return "—";
  return String(Math.round(m));
}

// All-time best + average across every recorded metric (full run history).
function buildAllTimeStats(runs) {
  const all = runs.map(runMetrics);
  const cells = all.map((m) => m.cells);
  const distances = all.map((m) => m.distanceM);
  const areas = all.map((m) => m.areaM2);
  const durations = all.map((m) => m.durationMs);
  const paces = all.map((m) => m.paceMinPerKm).filter((p) => p != null);
  const elevations = all.map((m) => m.elevationGainM).filter((e) => e != null);
  const maxOr0 = (xs) => (xs.length ? Math.max(...xs) : 0);
  return [
    {
      label: "CELLS",
      best: String(maxOr0(cells)),
      avg: String(Math.round(mean(cells))),
      unit: "HEX",
    },
    {
      label: "DIST",
      best: formatKm(maxOr0(distances)),
      avg: formatKm(mean(distances)),
      unit: "KM",
    },
    {
      label: "AREA",
      best: formatAreaKm2(maxOr0(areas)),
      avg: formatAreaKm2(mean(areas)),
      unit: "KM²",
    },
    {
      label: "TIME",
      best: formatDuration(maxOr0(durations)),
      avg: formatDuration(mean(durations)),
      unit: "RUN",
    },
    {
      // Lower pace is better, so "best" = minimum min/km.
      label: "PACE",
      best: formatPace(paces.length ? Math.min(...paces) : null),
      avg: formatPace(paces.length ? mean(paces) : null),
      unit: "/KM",
    },
    {
      label: "ELEV",
      best: formatElevation(elevations.length ? maxOr0(elevations) : null),
      avg: formatElevation(elevations.length ? mean(elevations) : null),
      unit: "M",
    },
  ];
}

function formatKm(meters) {
  if (!meters || meters <= 0) return "0.00";
  return (meters / 1000).toFixed(2);
}

function formatAreaKm2(m2) {
  if (!m2 || m2 <= 0) return "0.00";
  return (m2 / 1_000_000).toFixed(2);
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { position: currentLocation, loading: locLoading } = useCurrentLocation();
  const [me, setMe] = useState(null);
  const [runs, setRuns] = useState([]);
  const [cells, setCells] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiJson("/auth/me").catch(() => null),
      apiJson("/runs").catch(() => []),
      territory.byUser(user.id, { limit: PAGE_SIZE * 3, offset: 0 }).catch(() => []),
    ])
      .then(([meRow, runRows, userCells]) => {
        if (cancelled) return;
        setMe(meRow);
        setRuns(Array.isArray(runRows) ? runRows : []);
        setCells(userCells);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Reset run selection when the signed-in user changes.
  useEffect(() => {
    setSelectedRunId(null);
    setSelectedRun(null);
  }, [user?.id]);

  const handleSelectRun = useCallback((feedId) => {
    setSelectedRunId((prev) => (prev === feedId ? null : feedId));
  }, []);

  // The most recent run (runs are ordered started_at DESC). Feed item ids are
  // prefixed "run-", so match that format for highlight/selection parity.
  const latestRunId = runs[0]?.id ? `run-${runs[0].id}` : null;
  // With no explicit selection, default the map to the latest run's cells.
  const activeRunId = selectedRunId ?? latestRunId;

  // Fetch the active run's claimed cells (selected run, else latest run).
  useEffect(() => {
    if (!activeRunId) {
      setSelectedRun(null);
      return;
    }
    const runId = activeRunId.replace(/^run-/, "");
    let cancelled = false;
    runsApi
      .detail(runId)
      .then((detail) => {
        if (!cancelled) setSelectedRun(detail);
      })
      .catch(() => {
        if (!cancelled) setSelectedRun(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRunId]);

  const totalCells = me?.total_cells ?? 0;
  const totalStrength = me?.total_strength ?? 0;
  // One bar per run over the last 30 days (display window only).
  const chartData = build30DayRunChart(runs);
  // BEST + AVG per metric over the full run history (all-time).
  const stats = buildAllTimeStats(runs);

  const region =
    totalCells === 0
      ? loading
        ? "LOADING…"
        : "NEW RUNNER"
      : `${totalCells} CELL${totalCells === 1 ? "" : "S"} CLAIMED`;

  const viewingRun = Boolean(selectedRun);
  // Current strength the signed-in user holds per owned cell (from territory).
  const myCountByH3 = new Map();
  for (const c of cells) {
    const mine = (c.shares ?? []).find((s) => s.userId === user?.id);
    if (mine) myCountByH3.set(c.h3Index, mine.count);
  }
  const ownerLabel = `@${me?.username ?? user?.username ?? "you"}`;
  const selectedCells = viewingRun
    ? (selectedRun.cells ?? []).map((h3Index) => {
        const count = myCountByH3.get(h3Index) ?? 1;
        return {
          h3Index,
          ownerId: user?.id,
          owner: ownerLabel,
          color: RUN_CELL_COLOR,
          ownership: 100,
          // Single lime wedge + ×N strength badge on the run path.
          shares: [
            { userId: user?.id, owner: ownerLabel, color: RUN_CELL_COLOR, count },
          ],
        };
      })
    : [];
  const mapCells = viewingRun
    ? selectedCells
    : filterCellsNearLocation(cells, currentLocation, NEARBY_RADIUS_KM);
  const mapLiveBattles = viewingRun ? selectedRun.cells_claimed ?? 0 : totalCells;
  const runDate =
    viewingRun && selectedRun.started_at
      ? new Date(selectedRun.started_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
  const isExplicitSelection = Boolean(selectedRunId);
  // Metrics for the run currently shown on the map (selected bar, else latest).
  const selectedRunMetrics = viewingRun
    ? (() => {
        const m = runMetrics(selectedRun);
        return {
          date: runDate,
          isLatest: !isExplicitSelection,
          rows: [
            { label: "CELLS", value: String(m.cells), unit: "HEX" },
            { label: "DIST", value: formatKm(m.distanceM), unit: "KM" },
            { label: "AREA", value: formatAreaKm2(m.areaM2), unit: "KM²" },
            { label: "TIME", value: formatDuration(m.durationMs), unit: "" },
            { label: "PACE", value: formatPace(m.paceMinPerKm), unit: "/KM" },
            { label: "ELEV", value: formatElevation(m.elevationGainM), unit: "M" },
          ],
        };
      })()
    : null;
  const mapDistrict = viewingRun
    ? `${isExplicitSelection ? "RUN" : "LATEST RUN"} · ${runDate ?? ""}`.trim()
    : totalCells > 0
      ? `${(me?.username ?? user?.username ?? "YOUR").toUpperCase()} TERRITORY`
      : "NO TERRITORY YET";

  return (
    <div className="px-margin-safe max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        <TerritoryDominance
          cells={totalCells}
          strength={totalStrength}
          region={region}
          chartData={chartData}
          selectedRunId={activeRunId}
          onSelectBar={handleSelectRun}
        />
        <QuickRunStats stats={stats} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter h-full">
        <TerritoryMapPreview
          liveBattles={mapLiveBattles}
          liveLabel={viewingRun ? "RUN CELLS" : "YOUR CELLS"}
          district={mapDistrict}
          ownership={mapLiveBattles > 0 ? Math.min(100, mapLiveBattles) : 0}
          cells={mapCells}
          currentLocation={currentLocation}
          locationLoading={locLoading}
        />
        <SelectedRunMetrics metrics={selectedRunMetrics} />
      </div>
    </div>
  );
}
