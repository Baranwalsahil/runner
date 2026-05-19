import Icon from "../Icon.jsx";

export default function PlayersOnline({ players = [] }) {
  return (
    <aside
      data-testid="players-online"
      className="absolute left-margin-safe top-md z-30 w-64 glass-panel p-md flex flex-col gap-sm max-h-[400px]"
    >
      <h3 className="font-label-bold text-[10px] text-on-surface-variant uppercase mb-xs">
        Group Intel
      </h3>
      <div className="flex flex-col gap-base overflow-y-auto pr-xs">
        {players.length === 0 && (
          <div className="text-[10px] text-on-surface-variant italic">
            No runners yet.
          </div>
        )}
        {players.map((p) => (
          <div
            key={p.id}
            data-testid="player-row"
            className="flex items-center gap-sm p-base bg-surface-container-low/40 rounded border border-outline-variant/10"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary-fixed/30">
              <Icon name="person" className="text-primary-fixed text-lg" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-label-bold text-xs text-primary">{p.handle}</span>
              <div className="flex items-center gap-xs">
                <Icon name="hexagon" className="text-[10px] text-primary-fixed" />
                <span className="text-[10px] text-on-surface-variant">{p.cells} CELLS</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
