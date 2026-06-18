import HudPanelHeader from "../HudPanelHeader.jsx";

const DEFAULT_STATS = [
  { label: "PACE", best: "7'12\"", avg: "8'05\"", unit: "/KM" },
  { label: "CELLS", best: "42", avg: "18", unit: "HEX" },
  { label: "DIST", best: "5.20", avg: "3.10", unit: "KM" },
];

export default function QuickRunStats({ stats = DEFAULT_STATS }) {
  return (
    <div
      data-testid="quick-run-stats"
      className="hud-panel hud-corners p-md flex flex-col gap-md"
    >
      <HudPanelHeader label="RUN.METRICS" className="mb-base" />
      <div className="flex justify-end gap-6 font-hud-mono text-[0.625rem] uppercase tracking-widest text-on-surface-variant pr-1">
        <span className="text-primary-fixed">BEST</span>
        <span>AVG</span>
      </div>
      <div className="space-y-md">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex justify-between items-end border-b border-primary-fixed/15 pb-2"
          >
            <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
              <span aria-hidden="true" className="text-primary-fixed">
                ▣{" "}
              </span>
              {s.label}
              {s.unit && (
                <small className="ml-1 text-on-surface-variant/60 normal-case">
                  {s.unit}
                </small>
              )}
            </span>
            <span className="flex items-end gap-6">
              <span
                data-testid="stat-best"
                className="font-hud-mono text-primary text-2xl leading-none"
              >
                {s.best}
              </span>
              <span
                data-testid="stat-avg"
                className="font-hud-mono text-on-surface-variant text-lg leading-none"
              >
                {s.avg}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
