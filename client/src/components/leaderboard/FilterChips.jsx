function ChipRow({ label, options, value, onChange, testid }) {
  return (
    <div data-testid={testid} className="glass-panel p-1 rounded-full flex gap-xs">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            data-testid={`chip-${opt.toLowerCase()}`}
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`font-label-bold px-md py-sm rounded-full transition-all uppercase text-xs ${
              active
                ? "bg-primary-fixed text-on-primary-fixed"
                : "text-on-surface-variant hover:bg-surface-variant/50"
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
