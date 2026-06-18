import HudPanelHeader from "../HudPanelHeader.jsx";

const DEFAULT_CHART = [
  { height: 30, opacity: 40 },
  { height: 45, opacity: 50 },
  { height: 40, opacity: 60 },
  { height: 65, opacity: 70 },
  { height: 85, opacity: 80, label: "+12.4%" },
  { height: 75, opacity: 90 },
  { height: 100, opacity: 100 },
];

export default function TerritoryDominance({
  cells = 1284,
  strength = null,
  region = "TOP 5% IN SEATTLE",
  chartData = DEFAULT_CHART,
  selectedRunId = null,
  onSelectBar = null,
}) {
  return (
    <div
      data-testid="territory-dominance"
      className="md:col-span-2 hud-panel hud-corners p-md relative overflow-hidden"
    >
      <div className="absolute inset-0 hex-mesh opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <HudPanelHeader label="SECTOR.STATUS" className="mb-md" />
        <div className="flex justify-between items-start mb-md">
          <div>
            <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant mb-1">
              <span aria-hidden="true" className="text-primary-fixed">
                ▣{" "}
              </span>
              CELLS.OWNED
            </p>
            <h1 className="font-hud-mono text-headline-xl text-primary-fixed [text-shadow:0_0_16px_rgba(195,244,0,0.35)]">
              {cells.toLocaleString()}{" "}
              <span className="text-headline-md font-normal text-on-surface-variant">HEX</span>
            </h1>
            {strength != null && (
              <p
                data-testid="total-strength"
                className="font-hud-mono text-xs uppercase tracking-widest text-secondary-fixed mt-1"
              >
                <span aria-hidden="true" className="opacity-40">
                  //{" "}
                </span>
                {strength.toLocaleString()}{" "}
                <span className="text-on-surface-variant font-normal">STRENGTH</span>
              </p>
            )}
          </div>
          <div className="font-hud-mono text-xs text-primary-fixed border border-primary-fixed/40 bg-primary-fixed/10 px-3 py-1">
            <span aria-hidden="true">[ </span>
            {region}
            <span aria-hidden="true"> ]</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div
            data-testid="growth-chart"
            className="h-48 w-full flex items-center justify-center font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant"
          >
            NO RUNS IN LAST 30 DAYS
          </div>
        ) : (
          // Horizontally scrollable track — one bar per run, slide left→right.
          <div
            data-testid="growth-chart"
            className="h-48 w-full overflow-x-auto overflow-y-hidden"
          >
            <div className="h-full flex items-end gap-1.5 px-1 w-max min-w-full">
              {chartData.map((bar, i) => {
                const selected = bar.runId != null && bar.runId === selectedRunId;
                const clickable = Boolean(bar.runId && onSelectBar);
                const title = bar.date
                  ? `${bar.date} · ${bar.cells ?? 0} cells`
                  : undefined;
                return (
                  <button
                    key={bar.runId ?? i}
                    type="button"
                    data-testid="chart-bar"
                    data-selected={selected ? "true" : undefined}
                    aria-pressed={clickable ? selected : undefined}
                    aria-label={
                      title ? `Run ${bar.date}, ${bar.cells ?? 0} cells` : undefined
                    }
                    title={title}
                    disabled={!clickable}
                    onClick={clickable ? () => onSelectBar(bar.runId) : undefined}
                    className={`relative group w-6 shrink-0 ${
                      selected
                        ? "bg-primary-fixed shadow-[0_0_20px_rgba(195,244,0,0.4)]"
                        : "bg-surface-container-high"
                    } ${
                      clickable
                        ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                        : ""
                    }`}
                    style={{ height: `${bar.height}%` }}
                  >
                    {!selected && (
                      <div
                        className="absolute bottom-0 w-full h-full"
                        style={{
                          backgroundColor: `rgba(195, 244, 0, ${bar.opacity / 100})`,
                        }}
                      />
                    )}
                    {bar.label && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary-fixed font-hud-mono text-xs">
                        {bar.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant text-center mt-4">
          <span aria-hidden="true" className="text-primary-fixed">
            ▣{" "}
          </span>
          TERRITORY GROWTH <span aria-hidden="true" className="opacity-40">//</span> LAST 30 DAYS · PER RUN
        </p>
      </div>
    </div>
  );
}
