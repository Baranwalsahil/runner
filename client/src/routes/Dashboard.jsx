import { useEffect, useState } from "react";
import TerritoryDominance from "../components/dashboard/TerritoryDominance.jsx";
import QuickRunStats from "../components/dashboard/QuickRunStats.jsx";
import TerritoryMapPreview from "../components/dashboard/TerritoryMapPreview.jsx";
import RecentBattlesFeed from "../components/dashboard/RecentBattlesFeed.jsx";
import useAuth from "../hooks/useAuth.js";
import { apiJson } from "../lib/auth.js";
import { territory } from "../lib/api.js";

const PAGE_SIZE = 4;

function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function cellToBattle(c, accent = false) {
  return {
    id: `cell-${c.h3Index}`,
    type: "gained",
    label: "Territory Held",
    time: timeAgo(c.claimedAt),
    title: `Cell ${c.h3Index.slice(0, 8)}`,
    subjectLabel: "Claim count",
    user: String(c.ownership ?? 1),
    accent,
  };
}

function build7DayChart(runs) {
  const buckets = new Array(7).fill(0);
  const now = Date.now();
  for (const r of runs) {
    const t = new Date(r.started_at).getTime();
    const daysAgo = Math.floor((now - t) / 86_400_000);
    if (daysAgo >= 0 && daysAgo < 7) {
      buckets[6 - daysAgo] += r.cells_claimed ?? 0;
    }
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((v, i) => ({
    height: Math.max(8, Math.round((v / max) * 100)),
    opacity: 40 + Math.round((i / 6) * 60),
    label: i === 6 && v > 0 ? `+${v}` : undefined,
  }));
}

function formatKm(meters) {
  if (!meters || meters <= 0) return "0.00";
  return (meters / 1000).toFixed(2);
}

function formatAreaKm2(m2) {
  if (!m2 || m2 <= 0) return "0.00";
  return (m2 / 1_000_000).toFixed(2);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [runs, setRuns] = useState([]);
  const [cells, setCells] = useState([]);
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

  const totalCells = me?.total_cells ?? 0;
  const totalAreaM2 = me?.total_area_m2 ?? 0;
  const chartData = build7DayChart(runs);

  const weeklyDistanceM = runs
    .filter(
      (r) =>
        Date.now() - new Date(r.started_at).getTime() < 7 * 86_400_000
    )
    .reduce((acc, r) => acc + (Number(r.distance_meters) || 0), 0);

  const stats = [
    { label: "RUNS", value: String(runs.length), suffix: "TOTAL" },
    { label: "DIST", value: formatKm(weeklyDistanceM), suffix: "KM/WK" },
    { label: "AREA", value: formatAreaKm2(totalAreaM2), suffix: "KM²" },
  ];

  const battles =
    cells.length > 0
      ? {
          initialBattles: cells
            .slice(0, PAGE_SIZE)
            .map((c, i) => cellToBattle(c, i === 0)),
          extraBattles: cells.slice(PAGE_SIZE).map((c) => cellToBattle(c)),
        }
      : { initialBattles: [], extraBattles: [] };

  const region =
    totalCells === 0
      ? loading
        ? "LOADING…"
        : "NEW RUNNER"
      : `${totalCells} CELL${totalCells === 1 ? "" : "S"} CLAIMED`;

  return (
    <div className="px-margin-safe max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        <TerritoryDominance
          cells={totalCells}
          region={region}
          chartData={chartData}
        />
        <QuickRunStats stats={stats} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter h-full">
        <TerritoryMapPreview
          liveBattles={totalCells}
          district={
            totalCells > 0
              ? `${(me?.username ?? user?.username ?? "YOUR").toUpperCase()} TERRITORY`
              : "NO TERRITORY YET"
          }
          ownership={totalCells > 0 ? Math.min(100, totalCells) : 0}
        />
        <RecentBattlesFeed {...battles} />
      </div>
    </div>
  );
}
