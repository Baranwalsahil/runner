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
  region = "TOP 5% IN SEATTLE",
  chartData = DEFAULT_CHART,
}) {
  return (
    <div
      data-testid="territory-dominance"
      className="md:col-span-2 glass-panel neon-border-lime p-md rounded-xl relative overflow-hidden"
    >
      <div className="absolute inset-0 hex-mesh opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-md">
          <div>
            <p className="font-label-bold text-on-surface-variant mb-1">TOTAL CELLS OWNED</p>
            <h1 className="font-headline-xl text-primary-fixed">
              {cells.toLocaleString()}{" "}
              <span className="text-headline-md font-normal text-on-surface-variant">HEX</span>
            </h1>
          </div>
          <div className="bg-primary-container text-on-primary-container font-label-bold px-3 py-1 rounded-full text-xs">
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
                    ? "bg-primary-fixed shadow-[0_0_20px_rgba(195,244,0,0.3)]"
                    : "bg-surface-container-high"
                } rounded-t-sm relative group`}
                style={{ height: `${bar.height}%` }}
              >
                {!isLast && (
                  <div
                    className="absolute bottom-0 w-full h-full"
                    style={{
                      backgroundColor: `rgba(195, 244, 0, ${bar.opacity / 100})`,
                    }}
                  />
                )}
                {bar.label && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary-fixed font-stats-display text-xs">
                    {bar.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="font-label-bold text-on-surface-variant text-center mt-4">
          TERRITORY GROWTH (LAST 7 DAYS)
        </p>
      </div>
    </div>
  );
}
