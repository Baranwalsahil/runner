import TerritoryDominance from "../components/dashboard/TerritoryDominance.jsx";
import QuickRunStats from "../components/dashboard/QuickRunStats.jsx";
import TerritoryMapPreview from "../components/dashboard/TerritoryMapPreview.jsx";
import RecentBattlesFeed from "../components/dashboard/RecentBattlesFeed.jsx";

export default function Dashboard() {
  return (
    <div className="px-margin-safe max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        <TerritoryDominance />
        <QuickRunStats />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter h-full">
        <TerritoryMapPreview />
        <RecentBattlesFeed />
      </div>
    </div>
  );
}
