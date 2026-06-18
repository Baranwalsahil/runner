import HudPanelHeader from "../HudPanelHeader.jsx";

// Metrics for the run currently shown on the mini hex map (the selected bar,
// or the latest run when nothing is explicitly selected). `metrics` is null
// when there is no run to show.
export default function SelectedRunMetrics({ metrics = null }) {
  return (
    <div
      data-testid="selected-run-metrics"
      className="lg:col-span-1 hud-panel hud-corners p-md flex flex-col gap-md"
    >
      <HudPanelHeader label="RUN.DETAIL" className="mb-base" />
      {metrics == null ? (
        <div className="flex-1 flex items-center justify-center text-center font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
          SELECT A BAR TO INSPECT A RUN
        </div>
      ) : (
        <>
          <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
            <span aria-hidden="true" className="text-primary-fixed">
              ▣{" "}
            </span>
            {metrics.isLatest ? "LATEST RUN" : "RUN"}
            {metrics.date && (
              <span className="text-primary-fixed"> · {metrics.date}</span>
            )}
          </p>
          <div className="space-y-base">
            {metrics.rows.map((r) => (
              <div
                key={r.label}
                className="flex justify-between items-end border-b border-primary-fixed/15 pb-1.5"
              >
                <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
                  {r.label}
                </span>
                <span className="font-hud-mono text-primary text-xl leading-none">
                  {r.value}
                  {r.unit && (
                    <small className="ml-1 text-xs text-on-surface-variant">
                      {r.unit}
                    </small>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
