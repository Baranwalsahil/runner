import { useRef, useState } from "react";
import Icon from "../Icon.jsx";

const PAGE_SIZE = 4;

function labelClass(type) {
  if (type === "lost") return "text-error";
  if (type === "gained") return "text-secondary-fixed";
  return "text-on-surface-variant";
}

function BattleItem({ battle, firstNewRef, onSelect, selected }) {
  const clickable = typeof onSelect === "function";
  return (
    <div
      ref={firstNewRef}
      data-testid="battle-item"
      data-battle-id={battle.id}
      data-selected={selected ? "true" : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onSelect(battle.id) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(battle.id);
              }
            }
          : undefined
      }
      className={`p-md transition-all${clickable ? " cursor-pointer" : ""}${
        selected
          ? " bg-secondary-fixed-dim/10 border-l-2 border-secondary-fixed-dim"
          : battle.accent
            ? " bg-secondary-fixed-dim/5 border-l-2 border-secondary-fixed-dim"
            : ""
      } hover:bg-surface-variant/20`}
    >
      <div className="flex justify-between items-start mb-base">
        <span className={`${labelClass(battle.type)} font-scifi text-xs uppercase tracking-[0.15em]`}>
          {battle.label}
        </span>
        <span className="text-on-surface-variant font-scifi font-light text-[10px]">{battle.time}</span>
      </div>
      <p className="text-sm font-scifi font-medium mb-1">{battle.title}</p>
      <p className="text-xs font-scifi font-light text-on-surface-variant">
        {battle.subject_label ?? battle.subjectLabel}{" "}
        <span className="text-secondary-fixed">{battle.user}</span>
      </p>
      {battle.challengeable && (
        <button className="mt-base text-xs font-scifi uppercase tracking-[0.15em] text-secondary-fixed border border-secondary-fixed-dim/40 px-2 py-1 rounded-full hover:bg-secondary-fixed-dim/15 transition-all">
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
  onSelectRun,
  selectedRunId = null,
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
      className="scifi-panel rounded-2xl flex flex-col h-[500px]"
    >
      <div className="p-md border-b border-secondary-fixed-dim/15 flex justify-between items-center flex-shrink-0">
        <h3 className="font-scifi text-[11px] uppercase tracking-[0.25em] text-on-surface-variant">
          Recent Battles
        </h3>
        <Icon name="history" className="text-secondary-fixed-dim text-sm" />
      </div>
      <div
        data-testid="battles-list"
        className="flex-grow overflow-y-auto divide-y divide-secondary-fixed-dim/10 scroll-smooth"
      >
        {loading ? (
          <div
            data-testid="battles-loading"
            className="p-md text-center text-on-surface-variant text-xs font-scifi uppercase tracking-[0.2em]"
          >
            Loading activity...
          </div>
        ) : battles.length === 0 ? (
          <div
            data-testid="battles-empty"
            className="p-md text-center text-on-surface-variant text-xs font-scifi uppercase tracking-[0.2em]"
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
              onSelect={onSelectRun}
              selected={selectedRunId === b.id}
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
        className={`w-full p-md border-t border-secondary-fixed-dim/15 flex items-center justify-center gap-base text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant hover:text-secondary-fixed hover:bg-surface-variant/20 transition-all flex-shrink-0${
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
