import Icon from "../Icon.jsx";

const MAP_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBm8bB5FO4K5Y0a9j9cBlba3jdX-HKKb5kUF8SP9l3lflXogQKeUHDBBWMCMVP8m3IlXzPzGi84ReLldQNOp4Bla_Jwex_RjHt-9-L2Frbc5QAbZcs24GhoeOePdLFBU4kffVihT26yRlgK8pTN19L3O0OUTaTGQ_yz1WfzV5lOiW4ko9pSPhf_o445WPV9043QMrWgUicLwjtNu7km86PIHglEafA0nc9-YYRCd_Wd8juv_9LBPQr9r1Z38Hz0dFIS_8OiZ_Msxh8S";

export default function MapPreview() {
  return (
    <section
      data-testid="map-preview"
      className="py-xl px-margin-safe"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto hud-panel hud-corners overflow-hidden relative min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0 opacity-20 hex-grid" />
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full relative z-10 p-xl gap-xl items-center">
          <div>
            <h2 className="font-hud-mono font-bold text-headline-xl text-primary mb-md tracking-tight">
              THE GLOBAL <span className="text-secondary-fixed">HEX-GRID</span>
            </h2>
            <p className="font-hud-mono text-sm text-on-surface-variant mb-lg leading-relaxed">
              Monitor contested zones in real-time. Our tactical HUD interface displays territory ownership, decay rates, and active challenges in your local area.
            </p>
            <div className="space-y-base">
              <div className="flex items-center gap-md p-md bg-surface-container/50 border-l-4 border-primary-fixed">
                <div className="w-12 h-12 bg-primary-fixed/20 flex items-center justify-center">
                  <Icon name="leaderboard" className="text-primary-fixed" />
                </div>
                <div className="font-hud-mono">
                  <p className="text-primary uppercase tracking-widest text-sm">
                    <span aria-hidden="true" className="text-primary-fixed">▣ </span>
                    YOUR RANK: #42
                  </p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                    <span aria-hidden="true" className="opacity-40">// </span>
                    340 HEXES OWNED
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-md p-md bg-surface-container/50 border-l-4 border-error">
                <div className="w-12 h-12 bg-error/20 flex items-center justify-center">
                  <Icon name="notification_important" className="text-error hud-blink" />
                </div>
                <div className="font-hud-mono">
                  <p className="text-error uppercase tracking-widest text-sm">
                    <span aria-hidden="true">▣ </span>
                    CRITICAL ALERT
                  </p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                    <span aria-hidden="true" className="opacity-40">// </span>
                    DOWNTOWN HUB UNDER ATTACK
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary-fixed/10 blur-3xl group-hover:bg-primary-fixed/20 transition-all" />
            <div className="relative hud-panel overflow-hidden shadow-2xl">
              <img
                className="w-full h-auto"
                alt="Stylized digital tactical map of Tokyo with neon green hexagonal grid"
                src={MAP_IMG}
              />
              <div className="absolute inset-0 hud-scanlines" />
              <div className="absolute bottom-base left-base right-base p-md hud-panel flex justify-between items-center">
                <div className="flex items-center gap-base">
                  <div className="w-3 h-3 bg-primary-fixed hud-blink" />
                  <span className="font-hud-mono uppercase tracking-widest text-sm text-primary">LIVE INTEL: SECTOR J-9</span>
                </div>
                <span className="text-xs font-hud-mono text-primary-fixed">35.6762° N, 139.6503° E</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
