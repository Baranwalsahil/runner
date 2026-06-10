import Icon from "../Icon.jsx";

export default function MapHud({
  liveBattles = 0,
  legend = [],
  onZoomIn,
  onZoomOut,
  onLocate,
  onLayers,
}) {
  return (
    <>
      <div
        data-testid="hud-live-battles"
        className="absolute top-md left-md z-30 px-sm py-1 hud-panel"
      >
        <div className="flex items-center gap-base font-hud-mono text-xs uppercase tracking-widest">
          <span aria-hidden="true" className="text-primary-fixed">
            [ COMBAT.ZONE ]
          </span>
          <span aria-hidden="true" className="text-primary-fixed hud-blink">
            ●
          </span>
          <span className="text-on-surface">LIVE BATTLES: {liveBattles}</span>
        </div>
      </div>
      <div className="absolute right-margin-safe top-md z-30 flex flex-col gap-sm">
        <button
          aria-label="locate"
          onClick={onLocate}
          className="hud-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="my_location" className="text-primary-fixed" />
        </button>
        <button
          aria-label="layers"
          onClick={onLayers}
          className="hud-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="layers" className="text-on-surface-variant" />
        </button>
        <button
          aria-label="zoom in"
          onClick={onZoomIn}
          className="hud-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="add" className="text-on-surface-variant" />
        </button>
        <button
          aria-label="zoom out"
          onClick={onZoomOut}
          className="hud-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="remove" className="text-on-surface-variant" />
        </button>
      </div>
      <div
        data-testid="hud-legend"
        className="absolute bottom-md left-md z-30 hud-panel p-sm flex flex-wrap gap-md text-[10px] font-hud-mono uppercase tracking-widest max-w-[80%]"
      >
        {legend.length === 0 ? (
          <span className="text-on-surface-variant italic">No claims in view</span>
        ) : (
          legend.map((entry) => (
            <span
              key={entry.ownerId ?? entry.owner}
              data-testid="legend-entry"
              className="flex items-center gap-base"
            >
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: entry.color }}
              />
              {entry.owner}
              <span className="text-on-surface-variant">
                ×{entry.count}
              </span>
            </span>
          ))
        )}
      </div>
    </>
  );
}
