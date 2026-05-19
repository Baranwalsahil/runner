import { useState } from "react";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import FilterChips from "../components/leaderboard/FilterChips.jsx";
import useAuth from "../hooks/useAuth.js";
import useLeaderboardPolling from "../hooks/useLeaderboardPolling.js";

const REGION_FILTERS = ["Global", "Regional", "Friends"];
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
          <h1 className="font-headline-xl text-primary tracking-tighter uppercase">
            Territory Lords
          </h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl">
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
        <p data-testid="lb-loading" className="text-on-surface-variant font-mono uppercase">
          Loading leaderboard…
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
      {!loading && !error && rows.length === 0 && (
        <p className="text-on-surface-variant font-mono uppercase">
          No runners yet. Be the first to claim territory.
        </p>
      )}
      {!loading && !error && rows.length > 0 && (
        <>
          <Podium players={rows} />
          <RankTable players={rows} currentUserId={user?.id} />
        </>
      )}
    </div>
  );
}
