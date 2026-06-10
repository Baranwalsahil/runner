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
}) {
  return (
    <div
      data-testid="territory-dominance"
      className="md:col-span-2 scifi-panel p-md rounded-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 hex-mesh opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-md">
          <div>
            <p className="font-scifi text-[11px] uppercase tracking-[0.25em] text-on-surface-variant mb-1">
              TOTAL CELLS OWNED
            </p>
            <h1 className="font-scifi font-light text-headline-xl text-secondary-fixed scifi-glow">
              {cells.toLocaleString()}{" "}
              <span className="text-headline-md font-light text-on-surface-variant">HEX</span>
            </h1>
            {strength != null && (
              <p
                data-testid="total-strength"
                className="font-scifi text-xs uppercase tracking-[0.2em] text-secondary-fixed mt-1"
              >
                {strength.toLocaleString()}{" "}
                <span className="text-on-surface-variant font-light">STRENGTH</span>
              </p>
            )}
          </div>
          <div className="font-scifi text-xs uppercase tracking-[0.15em] text-secondary-fixed border border-secondary-fixed-dim/40 bg-secondary-fixed-dim/10 px-3 py-1 rounded-full">
            {region}
          </div>
        </div>
        <div className="h-48 w-full flex items-end gap-2 px-1" data-testid="growth-chart">
          {chartData.map((bar, i) => {
            const isLast = i === chartData.length - 1;
            return (
              <div
                key={i}
                data-testid="chart-bar"
                className={`flex-1 ${
                  isLast
                    ? "bg-secondary-container shadow-[0_0_20px_rgba(0,219,233,0.35)]"
                    : "bg-surface-container-high"
                } rounded-t-sm relative group`}
                style={{ height: `${bar.height}%` }}
              >
                {!isLast && (
                  <div
                    className="absolute bottom-0 w-full h-full"
                    style={{
                      backgroundColor: `rgba(0, 219, 233, ${bar.opacity / 200})`,
                    }}
                  />
                )}
                {bar.label && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-secondary-fixed font-scifi text-xs">
                    {bar.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="font-scifi text-[11px] uppercase tracking-[0.25em] text-on-surface-variant text-center mt-4">
          TERRITORY GROWTH (LAST 7 DAYS)
        </p>
      </div>
    </div>
  );
}
