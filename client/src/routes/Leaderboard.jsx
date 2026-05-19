import { useMemo, useState } from "react";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import FilterChips from "../components/leaderboard/FilterChips.jsx";
import {
  mockLeaderboard,
  REGION_FILTERS,
  TIME_FILTERS,
  CURRENT_USER_ID,
} from "../data/mockLeaderboard.js";

const CURRENT_USER_REGION = "New York North";

export default function Leaderboard() {
  const [region, setRegion] = useState("Global");
  const [time, setTime] = useState("All-time");

  const filtered = useMemo(() => {
    let arr = mockLeaderboard;
    if (region === "Regional") {
      arr = arr.filter((p) => p.region === CURRENT_USER_REGION);
    } else if (region === "Friends") {
      arr = arr.filter((p, i) => i < 8 || p.id === CURRENT_USER_ID);
    }
    if (time === "Weekly") {
      arr = arr.filter((p) => p.streak >= 7);
    } else if (time === "Daily") {
      arr = arr.filter((p) => p.streak >= 14);
    }
    return arr.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [region, time]);

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
      <Podium players={filtered} />
      <RankTable players={filtered} currentUserId={CURRENT_USER_ID} />
    </div>
  );
}
