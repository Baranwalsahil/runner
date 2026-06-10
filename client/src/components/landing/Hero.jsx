import { useNavigate } from "react-router-dom";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAazTlMuTLNCvqrt-42IX7yiDIpQJXWLVT0Z5mm2CD0oQgdjqtoxh7lIp4tes68DaTyVY859e5-k19agEBydZKZ3KZMLnobnTNzoAsKMLam3x4Mvb-zol_wak9T212cjRaQ1pm6haoh-9QmF8oB6F2HzVSG3Acdgss_KMNra3SCezdAsYiaGEvEQ7Ejpf9UhA8AiIzaTvDwQGTcuyLIbBiz476KiQAdrlaxjQSvjY_v7Mdprh0M-Y5b503nz77HmsPBxCtEfaU72Z62";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section
      data-testid="hero"
      className="relative min-h-[921px] flex items-center justify-center overflow-hidden px-margin-safe"
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        <img
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          alt="Neon GPS trace lines streaking across a nighttime city street"
          src={HERO_IMG}
        />
      </div>
      <div className="relative z-10 text-center max-w-4xl">
        <p className="font-hud-mono text-xs uppercase tracking-[0.3em] text-primary-fixed mb-md">
          <span aria-hidden="true">[ MISSION.BRIEFING ]</span>
        </p>
        <h1 className="font-hud-mono font-bold text-headline-xl text-primary mb-md tracking-tight [text-shadow:0_0_20px_rgba(195,244,0,0.25)]">
          DOMINATE THE <span className="text-primary-fixed">GRID</span>
        </h1>
        <p className="font-hud-mono text-sm text-on-surface-variant mb-xl max-w-2xl mx-auto leading-relaxed">
          The world is your battlefield. Every step is a conquest. Every mile is a claim. Sync your runs, capture territory, and defend your dominion against runners worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-md justify-center">
          <button
            data-testid="cta-start"
            onClick={() => navigate("/dashboard")}
            className="bg-primary-fixed text-on-primary-fixed px-xl py-md font-hud-mono font-bold uppercase tracking-widest text-lg [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(195,244,0,0.4)]"
          >
            START RUNNING
          </button>
          <button
            data-testid="cta-battlefield"
            onClick={() => navigate("/battlefield")}
            className="border border-secondary-fixed-dim text-secondary-fixed-dim px-xl py-md font-hud-mono font-bold uppercase tracking-widest text-lg [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] hover:bg-secondary-fixed-dim/10 transition-all shadow-[0_0_20px_rgba(0,219,233,0.2)]"
          >
            VIEW BATTLEFIELD
          </button>
        </div>
      </div>
    </section>
  );
}
