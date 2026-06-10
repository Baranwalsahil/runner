import { useRef, useState } from "react";
import Icon from "../Icon.jsx";
import HudPanelHeader from "./HudPanelHeader.jsx";

const PAGE_SIZE = 4;

function labelClass(type) {
  if (type === "lost") return "text-error";
  if (type === "gained") return "text-primary-fixed";
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
          ? " bg-primary-fixed/10 border-l-2 border-primary-fixed"
          : battle.accent
            ? " bg-primary-fixed/5 border-l-2 border-primary-fixed"
            : ""
      } hover:bg-surface-variant/20`}
    >
      <div className="flex justify-between items-start mb-base">
        <span className={`${labelClass(battle.type)} font-hud-mono text-xs uppercase tracking-widest`}>
          <span aria-hidden="true">▣ </span>
          {battle.label}
        </span>
        <span className="text-on-surface-variant font-hud-mono text-[10px]">{battle.time}</span>
      </div>
      <p className="text-sm font-hud-mono font-medium mb-1">
        <span aria-hidden="true" className="text-on-surface-variant/50">
          //{" "}
        </span>
        {battle.title}
      </p>
      <p className="text-xs font-hud-mono text-on-surface-variant">
        {battle.subject_label ?? battle.subjectLabel}{" "}
        <span className="text-secondary-fixed">{battle.user}</span>
      </p>
      {battle.challengeable && (
        <button className="mt-base text-xs font-hud-mono uppercase tracking-widest text-primary-fixed border border-primary-fixed/30 px-2 py-1 hover:bg-primary-fixed hover:text-on-primary-fixed transition-all">
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
      className="hud-panel hud-corners flex flex-col h-[500px]"
    >
      <div className="p-md border-b border-primary-fixed/20 flex-shrink-0">
        <HudPanelHeader label="COMBAT.LOG" status="LIVE" blink />
      </div>
      <div
        data-testid="battles-list"
        className="flex-grow overflow-y-auto divide-y divide-primary-fixed/10 scroll-smooth"
      >
        {loading ? (
          <div
            data-testid="battles-loading"
            className="p-md text-center text-on-surface-variant text-xs font-hud-mono uppercase tracking-widest"
          >
            Loading activity...
          </div>
        ) : battles.length === 0 ? (
          <div
            data-testid="battles-empty"
            className="p-md text-center text-on-surface-variant text-xs font-hud-mono uppercase tracking-widest"
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
        className={`w-full p-md border-t border-primary-fixed/20 flex items-center justify-center gap-base text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant hover:text-primary-fixed hover:bg-surface-variant/20 transition-all flex-shrink-0${
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
