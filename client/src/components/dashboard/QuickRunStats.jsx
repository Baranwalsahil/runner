import HudPanelHeader from "./HudPanelHeader.jsx";

const DEFAULT_STATS = [
  { label: "PACE", value: "7'12\"", suffix: "/MI" },
  { label: "MILES", value: "42.8", suffix: "WEEKLY" },
  { label: "CALORIES", value: "3,450", suffix: "KCAL" },
];

export default function QuickRunStats({ stats = DEFAULT_STATS }) {
  return (
    <div
      data-testid="quick-run-stats"
      className="hud-panel hud-corners p-md flex flex-col gap-md"
    >
      <HudPanelHeader label="RUN.METRICS" className="mb-base" />
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
            </span>
            <span className="font-hud-mono text-primary text-2xl">
              <span aria-hidden="true" className="text-on-surface-variant/50 text-sm">
                //{" "}
              </span>
              {s.value}{" "}
              <small className="text-xs text-on-surface-variant">{s.suffix}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
