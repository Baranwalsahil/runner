import { useEffect, useState } from "react";
import TerritoryDominance from "../components/dashboard/TerritoryDominance.jsx";
import QuickRunStats from "../components/dashboard/QuickRunStats.jsx";
import TerritoryMapPreview from "../components/dashboard/TerritoryMapPreview.jsx";
import RecentBattlesFeed from "../components/dashboard/RecentBattlesFeed.jsx";
import useAuth from "../hooks/useAuth.js";
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

export default function Dashboard() {
  const { user } = useAuth();
  const [initial, setInitial] = useState([]);
  const [extra, setExtra] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    territory
      .byUser(user.id, { limit: PAGE_SIZE * 3, offset: 0 })
      .then((cells) => {
        if (cancelled) return;
        setInitial(
          cells.slice(0, PAGE_SIZE).map((c, i) => cellToBattle(c, i === 0))
        );
        setExtra(cells.slice(PAGE_SIZE).map((c) => cellToBattle(c)));
      })
      .catch(() => {
        // Server unreachable / no cells — keep defaults
      });
  }, [user?.id]);

  const feedProps =
    initial.length > 0
      ? { initialBattles: initial, extraBattles: extra }
      : {};

  return (
    <div className="px-margin-safe max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        <TerritoryDominance />
        <QuickRunStats />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter h-full">
        <TerritoryMapPreview />
        <RecentBattlesFeed {...feedProps} />
      </div>
    </div>
  );
}
