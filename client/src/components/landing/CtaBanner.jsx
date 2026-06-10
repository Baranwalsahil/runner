import { useNavigate } from "react-router-dom";

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section
      data-testid="cta-banner"
      className="py-xl text-center px-margin-safe bg-surface-container-lowest border-y border-primary-fixed/20"
    >
      <h2 className="font-hud-mono font-bold text-headline-xl text-primary mb-md tracking-tight [text-shadow:0_0_16px_rgba(195,244,0,0.25)]">
        READY TO DOMINATE?
      </h2>
      <p className="font-hud-mono text-sm text-on-surface-variant mb-xl max-w-xl mx-auto leading-relaxed">
        Join thousands of runners turning their daily exercise into a global strategy game.
      </p>
      <button
        data-testid="cta-banner-start"
        onClick={() => navigate("/dashboard")}
        className="bg-primary-fixed text-on-primary-fixed px-xl py-md font-hud-mono font-bold uppercase tracking-widest text-xl [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] hover:scale-105 transition-all shadow-[0_0_40px_rgba(195,244,0,0.3)]"
      >
        START RUNNING
      </button>
    </section>
  );
}
