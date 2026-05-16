export default function Icon({ name, className = "", filled = false, style }) {
  const variation = filled ? { fontVariationSettings: "'FILL' 1" } : undefined;
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      data-icon={name}
      style={{ ...variation, ...style }}
    >
      {name}
    </span>
  );
}
