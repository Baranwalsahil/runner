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
        className="absolute top-md left-md z-30 p-sm glass-panel neon-border-cyan rounded-lg"
      >
        <div className="flex items-center gap-base">
          <div className="w-3 h-3 rounded-full bg-secondary-fixed animate-pulse" />
          <span className="font-label-bold text-xs">LIVE BATTLES: {liveBattles}</span>
        </div>
      </div>
      <div className="absolute right-margin-safe top-md z-30 flex flex-col gap-sm">
        <button
          aria-label="locate"
          onClick={onLocate}
          className="glass-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="my_location" className="text-primary-fixed" />
        </button>
        <button
          aria-label="layers"
          onClick={onLayers}
          className="glass-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="layers" className="text-on-surface-variant" />
        </button>
        <button
          aria-label="zoom in"
          onClick={onZoomIn}
          className="glass-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="add" className="text-on-surface-variant" />
        </button>
        <button
          aria-label="zoom out"
          onClick={onZoomOut}
          className="glass-panel p-md hover:bg-primary-fixed/20 group transition-all"
        >
          <Icon name="remove" className="text-on-surface-variant" />
        </button>
      </div>
      <div
        data-testid="hud-legend"
        className="absolute bottom-md left-md z-30 glass-panel p-sm rounded-lg flex flex-wrap gap-md text-[10px] font-label-bold uppercase max-w-[80%]"
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
