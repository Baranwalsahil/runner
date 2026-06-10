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
      className="scifi-panel p-md rounded-2xl flex flex-col gap-md"
    >
      <div className="flex items-center gap-base mb-base">
        <Icon name="sprint" className="text-secondary-fixed-dim" />
        <p className="font-scifi text-[11px] uppercase tracking-[0.25em] text-on-surface-variant">
          TRADITIONAL STATS
        </p>
      </div>
      <div className="space-y-md">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex justify-between items-end border-b border-secondary-fixed-dim/15 pb-2"
          >
            <span className="text-on-surface-variant font-scifi text-[11px] uppercase tracking-[0.2em]">
              {s.label}
            </span>
            <span className="font-scifi font-light text-secondary-fixed text-2xl">
              {s.value} <small className="text-xs text-on-surface-variant">{s.suffix}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
