import Icon from "../Icon.jsx";

const DEFAULT_STATS = [
  { label: "PACE", value: "7'12\"", suffix: "/MI" },
  { label: "MILES", value: "42.8", suffix: "WEEKLY" },
  { label: "CALORIES", value: "3,450", suffix: "KCAL" },
];

export default function QuickRunStats({ stats = DEFAULT_STATS }) {
  return (
    <div
      data-testid="quick-run-stats"
      className="glass-panel p-md rounded-xl flex flex-col justify-between"
    >
      <div className="flex items-center gap-base mb-base">
        <Icon name="sprint" className="text-secondary-fixed-dim" />
        <p className="font-label-bold text-on-surface-variant">TRADITIONAL STATS</p>
      </div>
      <div className="space-y-md">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex justify-between items-end border-b border-outline-variant/30 pb-2"
          >
            <span className="text-on-surface-variant font-label-bold">{s.label}</span>
            <span className="font-stats-display text-primary text-2xl">
              {s.value} <small className="text-xs text-on-surface-variant">{s.suffix}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
