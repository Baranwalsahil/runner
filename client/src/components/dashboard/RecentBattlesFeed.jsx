import { useRef, useState } from "react";
import Icon from "../Icon.jsx";

const INITIAL_BATTLES = [
  {
    id: "b1",
    type: "lost",
    label: "Territory Lost",
    time: "2m ago",
    title: "Sector D-9 Overrun",
    subjectLabel: "by",
    user: "@GhostRunner",
    accent: false,
    challengeable: true,
  },
  {
    id: "b2",
    type: "gained",
    label: "Territory Gained",
    time: "1h ago",
    title: "Central Park East",
    subjectLabel: "Claimed from",
    user: "@StreetKing",
    accent: true,
  },
  {
    id: "b3",
    type: "defended",
    label: "Defended",
    time: "3h ago",
    title: "Interbay Hub",
    subjectLabel: "3 cells held vs",
    user: "@Apex",
    accent: false,
  },
  {
    id: "b4",
    type: "lost",
    label: "Territory Lost",
    time: "5h ago",
    title: "Queen Anne Stairway",
    subjectLabel: "by",
    user: "@MountainGoat",
    accent: false,
  },
];

const EXTRA_BATTLES = [
  { id: "x1", type: "lost", label: "Territory Lost", time: "8h ago", title: "Beacon Hill Loop", subjectLabel: "by", user: "@NightOwl", accent: false },
  { id: "x2", type: "gained", label: "Territory Gained", time: "11h ago", title: "Pike Place Market", subjectLabel: "Claimed from", user: "@SunsetDash", accent: true },
  { id: "x3", type: "defended", label: "Defended", time: "14h ago", title: "Fremont Bridge", subjectLabel: "5 cells held vs", user: "@TrailBlaze", accent: false },
  { id: "x4", type: "gained", label: "Territory Gained", time: "1d ago", title: "Gas Works Park", subjectLabel: "Claimed from", user: "@LakeRunner", accent: true },
  { id: "x5", type: "lost", label: "Territory Lost", time: "1d ago", title: "Ballard Locks", subjectLabel: "by", user: "@WaveCrest", accent: false },
  { id: "x6", type: "defended", label: "Defended", time: "2d ago", title: "Discovery Park", subjectLabel: "2 cells held vs", user: "@WindRunner", accent: false },
  { id: "x7", type: "gained", label: "Territory Gained", time: "2d ago", title: "Green Lake Path", subjectLabel: "Claimed from", user: "@PaceMaker", accent: true },
  { id: "x8", type: "lost", label: "Territory Lost", time: "3d ago", title: "Magnolia Bluff", subjectLabel: "by", user: "@CliffHanger", accent: false },
];

function labelClass(type) {
  if (type === "lost") return "text-error";
  if (type === "gained") return "text-primary-fixed";
  return "text-on-surface-variant";
}

function BattleItem({ battle, firstNewRef }) {
  return (
    <div
      ref={firstNewRef}
      data-testid="battle-item"
      data-battle-id={battle.id}
      className={`p-md hover:bg-surface-variant/20 transition-all${
        battle.accent ? " bg-primary-fixed/5 border-l-2 border-primary-fixed" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-base">
        <span className={`${labelClass(battle.type)} font-label-bold text-xs uppercase`}>
          {battle.label}
        </span>
        <span className="text-on-surface-variant text-[10px]">{battle.time}</span>
      </div>
      <p className="text-sm font-medium mb-1">{battle.title}</p>
      <p className="text-xs text-on-surface-variant">
        {battle.subjectLabel} <span className="text-secondary-fixed">{battle.user}</span>
      </p>
      {battle.challengeable && (
        <button className="mt-base text-xs font-label-bold text-primary-fixed border border-primary-fixed/30 px-2 py-1 rounded hover:bg-primary-fixed hover:text-on-primary-fixed transition-all">
          CHALLENGE
        </button>
      )}
    </div>
  );
}

export default function RecentBattlesFeed({
  initialBattles = INITIAL_BATTLES,
  extraBattles = EXTRA_BATTLES,
}) {
  const [loaded, setLoaded] = useState(false);
  const firstNewRef = useRef(null);

  const battles = loaded ? [...initialBattles, ...extraBattles] : initialBattles;

  function handleClick() {
    if (loaded) return;
    setLoaded(true);
    queueMicrotask(() => {
      firstNewRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div
      data-testid="recent-battles"
      className="glass-panel rounded-xl flex flex-col h-[500px]"
    >
      <div className="p-md border-b border-outline-variant/30 flex justify-between items-center flex-shrink-0">
        <h3 className="font-label-bold uppercase tracking-widest text-on-surface-variant">
          Recent Battles
        </h3>
        <Icon name="history" className="text-primary-fixed text-sm" />
      </div>
      <div
        data-testid="battles-list"
        className="flex-grow overflow-y-auto divide-y divide-outline-variant/20 scroll-smooth"
      >
        {battles.length === 0 ? (
          <div
            data-testid="battles-empty"
            className="p-md text-center text-on-surface-variant text-xs font-label-bold uppercase tracking-widest"
          >
            No activity yet.
            <br />
            Start a session to claim territory.
          </div>
        ) : (
          battles.map((b, i) => (
            <BattleItem
              key={b.id}
              battle={b}
              firstNewRef={
                loaded && i === initialBattles.length ? firstNewRef : null
              }
            />
          ))
        )}
      </div>
      <button
        data-testid="load-more"
        onClick={handleClick}
        disabled={loaded || extraBattles.length === 0}
        className={`w-full p-md border-t border-outline-variant/30 flex items-center justify-center gap-base text-xs font-label-bold uppercase tracking-widest text-on-surface-variant hover:text-primary-fixed hover:bg-surface-variant/20 transition-all flex-shrink-0${
          loaded || extraBattles.length === 0
            ? " opacity-60 cursor-not-allowed"
            : ""
        }`}
      >
        <span data-testid="load-more-label">
          {loaded || extraBattles.length === 0
            ? "End of History"
            : "View Full History"}
        </span>
        <Icon
          name={loaded || extraBattles.length === 0 ? "check" : "arrow_downward"}
          className="text-base"
        />
      </button>
    </div>
  );
}
