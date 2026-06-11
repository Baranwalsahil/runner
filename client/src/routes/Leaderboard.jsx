import { useState } from "react";
import RankTable from "../components/leaderboard/RankTable.jsx";
import FilterChips from "../components/leaderboard/FilterChips.jsx";
import useAuth from "../hooks/useAuth.js";
import useLeaderboardPolling from "../hooks/useLeaderboardPolling.js";

const REGION_FILTERS = ["Global"];
const TIME_FILTERS = ["All-time", "Weekly", "Daily"];

const TIME_TO_PERIOD = {
  "All-time": "all",
  Weekly: "weekly",
  Daily: "daily",
};

function adapt(row) {
  return {
    id: row.user_id,
    rank: row.rank,
    username: `@${row.username}`,
    avatar: null,
    color: row.color,
    cells: row.total_cells,
    areaM2: row.total_cells * 110_000,
    streak: 0,
    region: "Global",
  };
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [region, setRegion] = useState("Global");
  const [time, setTime] = useState("All-time");
  const { rows: rawRows, loading, error } = useLeaderboardPolling({
    limit: 50,
    offset: 0,
    period: TIME_TO_PERIOD[time],
  });
  const rows = (rawRows ?? []).map(adapt);

  return (
    <div className="px-margin-safe max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-md">
        <div>
          <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed mb-2">
            <span aria-hidden="true">[ GLOBAL.RANKING ]</span>
          </p>
          <h1 className="font-hud-mono font-bold text-headline-xl text-primary tracking-tight uppercase [text-shadow:0_0_16px_rgba(195,244,0,0.25)]">
            Territory Lords
          </h1>
          <p className="text-on-surface-variant font-hud-mono text-sm max-w-2xl mt-2">
            The elite grid-runners commanding the most significant real estate in the physical world. Dominate the terrain to climb the ranks.
          </p>
        </div>
        <FilterChips
          regionOptions={REGION_FILTERS}
          region={region}
          onRegionChange={setRegion}
          timeOptions={TIME_FILTERS}
          time={time}
          onTimeChange={setTime}
        />
      </div>
      {loading && (
        <p data-testid="lb-loading" className="text-on-surface-variant font-hud-mono uppercase tracking-widest">
          Loading leaderboard…
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-400 font-hud-mono">
          {error}
        </p>
      )}
      {!loading && !error && rows.length === 0 && (
        <p className="text-on-surface-variant font-hud-mono uppercase tracking-widest">
          No runners yet. Be the first to claim territory.
        </p>
      )}
      {!loading && !error && rows.length > 0 && (
        <RankTable players={rows} currentUserId={user?.id} />
      )}
    </div>
  );
}
