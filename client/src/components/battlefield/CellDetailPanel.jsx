import Icon from "../Icon.jsx";

export default function CellDetailPanel({ cell, onClose, onChallenge }) {
  if (!cell) return null;
  return (
    <div
      data-testid="cell-detail-panel"
      className="absolute right-margin-safe bottom-margin-safe z-30 w-72 glass-panel neon-border-lime p-md rounded-xl"
    >
      <div className="flex justify-between items-start mb-base">
        <h3 className="font-label-bold text-primary-fixed uppercase tracking-widest text-xs">
          Cell Intel
        </h3>
        <button aria-label="close" onClick={onClose} className="text-on-surface-variant hover:text-primary">
          <Icon name="close" className="text-sm" />
        </button>
      </div>
      <p className="text-xs text-on-surface-variant uppercase font-label-bold">H3 Index</p>
      <p className="font-mono text-xs text-primary mb-base break-all">{cell.h3Index}</p>
      <p className="text-xs text-on-surface-variant uppercase font-label-bold">Owner</p>
      <p className="font-label-bold text-secondary-fixed mb-base">{cell.owner}</p>
      {cell.claimedAt && (
        <>
          <p className="text-xs text-on-surface-variant uppercase font-label-bold">Claimed</p>
          <p className="text-xs text-primary mb-base">{new Date(cell.claimedAt).toLocaleString()}</p>
        </>
      )}
      <p className="text-xs text-on-surface-variant uppercase font-label-bold">Ownership</p>
      <div className="flex items-center gap-base mb-md">
        <div className="flex-1 h-1.5 bg-surface-container overflow-hidden rounded-full">
          <div
            className="h-full"
            style={{ width: `${cell.ownership}%`, background: cell.color }}
          />
        </div>
        <span className="text-xs text-primary font-label-bold">{cell.ownership}%</span>
      </div>
      <button
        data-testid="challenge-cell"
        onClick={() => onChallenge?.(cell)}
        className="w-full bg-primary-fixed text-on-primary-fixed font-label-bold py-2 rounded text-xs hover:scale-[1.02] transition-transform"
      >
        CHALLENGE
      </button>
    </div>
  );
}
