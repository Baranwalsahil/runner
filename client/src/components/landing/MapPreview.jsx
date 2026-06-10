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
      <div className="max-w-7xl mx-auto scifi-panel rounded-2xl overflow-hidden relative min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0 opacity-20 hex-grid" />
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full relative z-10 p-xl gap-xl items-center">
          <div>
            <h2 className="font-scifi font-light text-headline-xl text-primary mb-md tracking-tight">
              THE GLOBAL <span className="text-secondary-fixed scifi-glow">HEX-GRID</span>
            </h2>
            <p className="font-scifi font-light text-lg text-on-surface-variant mb-lg leading-relaxed">
              Monitor contested zones in real-time. Our tactical HUD interface displays territory ownership, decay rates, and active challenges in your local area.
            </p>
            <div className="space-y-base">
              <div className="flex items-center gap-md p-md bg-[rgba(11,15,22,0.6)] border border-secondary-fixed-dim/20 rounded-xl">
                <div className="w-12 h-12 bg-secondary-fixed-dim/15 flex items-center justify-center rounded-full">
                  <Icon name="leaderboard" className="text-secondary-fixed-dim" />
                </div>
                <div className="font-scifi">
                  <p className="text-primary uppercase tracking-[0.15em] text-sm">YOUR RANK: #42</p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.2em]">340 HEXES OWNED</p>
                </div>
              </div>
              <div className="flex items-center gap-md p-md bg-[rgba(11,15,22,0.6)] border border-error/30 rounded-xl">
                <div className="w-12 h-12 bg-error/15 flex items-center justify-center rounded-full">
                  <Icon name="notification_important" className="text-error" />
                </div>
                <div className="font-scifi">
                  <p className="text-error uppercase tracking-[0.15em] text-sm">CRITICAL ALERT</p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.2em]">DOWNTOWN HUB UNDER ATTACK</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-secondary-fixed-dim/10 blur-3xl group-hover:bg-secondary-fixed-dim/20 transition-all" />
            <div className="relative scifi-panel rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-auto"
                alt="Stylized digital tactical map of Tokyo with neon green hexagonal grid"
                src={MAP_IMG}
              />
              <div className="absolute bottom-base left-base right-base p-md scifi-panel rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-base">
                  <div className="w-2.5 h-2.5 bg-secondary-fixed rounded-full animate-pulse shadow-[0_0_10px_rgba(0,219,233,0.8)]" />
                  <span className="font-scifi text-sm uppercase tracking-[0.15em] text-primary">LIVE INTEL: SECTOR J-9</span>
                </div>
                <span className="text-xs font-scifi font-light text-secondary-fixed-dim">35.6762° N, 139.6503° E</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
