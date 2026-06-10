import Icon from "./Icon.jsx";

const LINKS = [
  { href: "#", label: "Game Rules" },
  { href: "#", label: "Privacy Protocol" },
  { href: "#", label: "System Status" },
  { href: "#", label: "Support" },
];

export default function Footer() {
  return (
    <footer
      data-testid="footer"
      className="bg-[#0b0f16] border-t border-secondary-fixed-dim/15 mt-xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-safe py-md max-w-7xl mx-auto gap-md">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="font-scifi font-medium tracking-[0.25em] text-secondary-fixed-dim/60">
            TERRITORY RUN
          </span>
          <p className="text-on-surface-variant font-scifi font-light text-xs tracking-wider">
            © 2024 TERRITORY RUN. DOMINATE THE GRID.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          {LINKS.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              className="text-on-surface-variant font-scifi text-xs uppercase tracking-[0.15em] hover:text-secondary-fixed transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex gap-base">
          <button
            aria-label="language"
            className="text-on-surface-variant hover:text-secondary-fixed transition-colors"
          >
            <Icon name="language" />
          </button>
          <button
            aria-label="terminal"
            className="text-on-surface-variant hover:text-secondary-fixed transition-colors"
          >
            <Icon name="terminal" />
          </button>
        </div>
      </div>
    </footer>
  );
}
