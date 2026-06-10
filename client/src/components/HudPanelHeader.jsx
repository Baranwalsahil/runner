export default function HudPanelHeader({ label, status, blink = false, className = "" }) {
  return (
    <div
      data-testid="hud-panel-header"
      className={`flex items-center gap-base font-hud-mono text-xs uppercase tracking-widest ${className}`}
    >
      <span aria-hidden="true" className="text-primary-fixed/50">
        ┌─
      </span>
      <span className="text-primary-fixed whitespace-nowrap">
        <span aria-hidden="true">[ </span>
        {label}
        <span aria-hidden="true"> ]</span>
      </span>
      <span aria-hidden="true" className="flex-1 border-t border-dashed border-primary-fixed/25" />
      {status && (
        <span className="text-primary-fixed whitespace-nowrap">
          <span aria-hidden="true">[</span>
          <span aria-hidden="true" className={blink ? "hud-blink" : undefined}>
            ●{" "}
          </span>
          {status}
          <span aria-hidden="true">]</span>
        </span>
      )}
    </div>
  );
}
