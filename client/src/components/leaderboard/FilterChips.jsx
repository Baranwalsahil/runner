function ChipRow({ label, options, value, onChange, testid }) {
  return (
    <div data-testid={testid} className="scifi-panel p-1 rounded-xl flex gap-xs">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            data-testid={`chip-${opt.toLowerCase()}`}
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`font-scifi px-md py-sm rounded-lg transition-all uppercase text-xs tracking-[0.15em] border ${
              active
                ? "border-secondary-fixed-dim/60 bg-secondary-fixed-dim/10 text-secondary-fixed [text-shadow:0_0_10px_rgba(0,219,233,0.5)]"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
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
