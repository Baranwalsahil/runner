function ChipRow({ label, options, value, onChange, testid }) {
  return (
    <div data-testid={testid} className="hud-panel p-1 flex gap-xs">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            data-testid={`chip-${opt.toLowerCase()}`}
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`font-hud-mono px-md py-sm transition-all uppercase tracking-widest text-xs ${
              active
                ? "bg-primary-fixed text-on-primary-fixed font-bold"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary-fixed"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterChips({
  regionOptions,
  region,
  onRegionChange,
  timeOptions,
  time,
  onTimeChange,
}) {
  return (
    <div data-testid="filter-chips" className="flex flex-col md:flex-row gap-md">
      <ChipRow
        testid="region-chips"
        label="region"
        options={regionOptions}
        value={region}
        onChange={onRegionChange}
      />
      <ChipRow
        testid="time-chips"
        label="time"
        options={timeOptions}
        value={time}
        onChange={onTimeChange}
      />
    </div>
  );
}
