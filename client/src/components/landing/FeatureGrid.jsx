import Icon from "../Icon.jsx";

const FEATURES = [
  {
    icon: "directions_run",
    accent: "text-primary-fixed",
    hover: "hover:border-primary-fixed",
    title: "RUN",
    body: "Log your miles through GPS. Speed and elevation gain technical bonuses that increase your capture radius.",
  },
  {
    icon: "pentagon",
    accent: "text-secondary-fixed",
    hover: "hover:border-secondary-fixed",
    title: "CLAIM",
    body: "Turn distance into territory. Convert GPS traces into hexagonal claims. The more you run, the larger your empire.",
  },
  {
    icon: "shield",
    accent: "text-error",
    hover: "hover:border-error",
    title: "DEFEND",
    body: "Territories decay over time. Re-run your routes to fortify your borders and repel rival runners attempting a takeover.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      data-testid="feature-grid"
      className="py-xl px-margin-safe max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`scifi-panel p-xl rounded-2xl group transition-all ${f.hover}`}
          >
            <div className={`mb-md ${f.accent}`}>
              <Icon name={f.icon} filled className="text-[48px]" />
            </div>
            <h3 className="font-scifi font-medium text-2xl tracking-[0.2em] text-primary mb-sm">
              {f.title}
            </h3>
            <p className="text-on-surface-variant font-scifi font-light leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
