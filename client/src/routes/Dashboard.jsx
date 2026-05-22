import { useCallback, useEffect, useRef, useState } from "react";
import TerritoryDominance from "../components/dashboard/TerritoryDominance.jsx";
import QuickRunStats from "../components/dashboard/QuickRunStats.jsx";
import TerritoryMapPreview from "../components/dashboard/TerritoryMapPreview.jsx";
import RecentBattlesFeed from "../components/dashboard/RecentBattlesFeed.jsx";
import useAuth from "../hooks/useAuth.js";
import usePolling from "../hooks/usePolling.js";
import { apiJson } from "../lib/auth.js";
import { runs as runsApi, territory } from "../lib/api.js";

const PAGE_SIZE = 4;
const FEED_POLL_MS = 15_000;
const HEX_AREA_M2 = 105_332.353; // H3 resolution 9 average hex area

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
  const [me, setMe] = useState(null);
  const [runs, setRuns] = useState([]);
  const [cells, setCells] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const feedLoadedOnceRef = useRef(false);

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

  useEffect(() => {
    feedLoadedOnceRef.current = false;
    setFeedLoading(true);
  }, [user?.id]);

  const fetchFeed = useCallback(async () => {
    try {
      const items = await runsApi.feed({ limit: 12 });
      setFeedItems(Array.isArray(items) ? items : []);
    } catch {
      if (!feedLoadedOnceRef.current) setFeedItems([]);
    } finally {
      feedLoadedOnceRef.current = true;
      setFeedLoading(false);
    }
  }, []);

  usePolling(user?.id ? fetchFeed : null, user?.id ? FEED_POLL_MS : 0);

  const totalCells = me?.total_cells ?? 0;
  const chartData = build7DayChart(runs);

  const bestCells = runs.reduce(
    (acc, r) => Math.max(acc, Number(r.cells_claimed) || 0),
    0,
  );
  const bestDistanceRun = runs.reduce(
    (best, r) =>
      (Number(r.distance_meters) || 0) > (Number(best?.distance_meters) || 0)
        ? r
        : best,
    null,
  );
  const bestDistanceM = Number(bestDistanceRun?.distance_meters) || 0;
  const bestAreaM2 = bestCells * HEX_AREA_M2;
  const bestDistanceDurationMs =
    bestDistanceRun?.started_at && bestDistanceRun?.ended_at
      ? new Date(bestDistanceRun.ended_at).getTime() -
        new Date(bestDistanceRun.started_at).getTime()
      : 0;

  const stats = [
    { label: "CELLS", value: String(bestCells), suffix: "BEST" },
    { label: "DIST", value: formatKm(bestDistanceM), suffix: "KM BEST" },
    { label: "AREA", value: formatAreaKm2(bestAreaM2), suffix: "KM² BEST" },
    { label: "TIME", value: formatDuration(bestDistanceDurationMs), suffix: "BEST RUN" },
  ];

  const battles = {
    initialBattles: feedItems.slice(0, PAGE_SIZE),
    extraBattles: feedItems.slice(PAGE_SIZE),
  };

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
          cells={cells}
        />
        <RecentBattlesFeed {...battles} loading={feedLoading} />
      </div>
    </div>
  );
}
