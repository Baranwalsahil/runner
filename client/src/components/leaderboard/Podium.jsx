const TIERS = {
  1: {
    border: "border-primary-fixed",
    text: "text-primary-fixed",
    bar: "bg-gradient-to-r from-secondary-fixed to-primary-fixed",
    size: "w-32 h-32",
    container: "p-lg md:scale-105 z-10 order-1 md:order-2",
    badge: "bg-primary-fixed text-on-primary-fixed text-headline-lg px-4 py-2 rounded-lg",
    pct: 98,
  },
  2: {
    border: "border-secondary-fixed",
    text: "text-secondary-fixed",
    bar: "bg-secondary-fixed",
    size: "w-24 h-24",
    container: "p-md order-2 md:order-1 border-t-4 border-t-secondary-fixed",
    badge: "bg-secondary-fixed text-on-secondary-fixed text-headline-md px-3 py-1 rounded-lg",
    pct: 85,
  },
  3: {
    border: "border-tertiary-fixed-dim",
    text: "text-tertiary-fixed-dim",
    bar: "bg-tertiary-fixed-dim",
    size: "w-24 h-24",
    container: "p-md order-3 md:order-3 border-t-4 border-t-tertiary-fixed-dim",
    badge: "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant text-headline-md px-3 py-1 rounded-lg",
    pct: 72,
  },
};

function PodiumCard({ player, displayRank }) {
  const tier = TIERS[displayRank];
  if (!tier) return null;
  return (
    <div
      data-testid={`podium-rank-${displayRank}`}
      className={`glass-panel rounded-xl flex flex-col items-center justify-center ${tier.container}`}
    >
      <div className="relative mb-md">
        <img
          alt={`${player.username} avatar`}
          className={`${tier.size} rounded-full object-cover border-2 ${tier.border}`}
          src={player.avatar ?? `https://i.pravatar.cc/128?u=${player.username}`}
        />
        {displayRank === 1 && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-fixed text-on-primary-fixed font-black text-headline-md px-4 py-1 rounded-full shadow-[0_0_20px_#c3f400]">
            CHAMPION
          </div>
        )}
        <div className={`absolute -bottom-2 -right-2 font-black ${tier.badge}`}>
          {displayRank}
        </div>
      </div>
      <h3 className={`font-headline-md text-primary uppercase ${displayRank === 1 ? "font-headline-lg" : ""}`}>
        {player.username}
      </h3>
      <p className={`${tier.text} font-label-bold mb-md`}>{player.region}</p>
      <div className={`w-full ${displayRank === 1 ? "h-2" : "h-1"} bg-surface-variant rounded-full mb-base`}>
        <div className={`h-full ${tier.bar} rounded-full`} style={{ width: `${tier.pct}%` }} />
      </div>
      <p className={`${displayRank === 1 ? "text-primary font-stats-display" : "text-on-surface-variant"} text-label-bold`}>
        {player.cells.toLocaleString()} CELLS
      </p>
    </div>
  );
}

export default function Podium({ players }) {
  const top3 = players.slice(0, 3);
  if (top3.length < 3) return null;
  return (
    <div data-testid="podium" className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
      <PodiumCard player={top3[1]} displayRank={2} />
      <PodiumCard player={top3[0]} displayRank={1} />
      <PodiumCard player={top3[2]} displayRank={3} />
    </div>
  );
}
