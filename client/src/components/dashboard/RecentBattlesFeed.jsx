import { useRef, useState } from "react";
import Icon from "../Icon.jsx";

const PAGE_SIZE = 4;

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
        {battle.subject_label ?? battle.subjectLabel}{" "}
        <span className="text-secondary-fixed">{battle.user}</span>
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
  initialBattles = [],
  extraBattles = [],
  loading = false,
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
        {loading ? (
          <div
            data-testid="battles-loading"
            className="p-md text-center text-on-surface-variant text-xs font-label-bold uppercase tracking-widest"
          >
            Loading activity...
          </div>
        ) : battles.length === 0 ? (
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
