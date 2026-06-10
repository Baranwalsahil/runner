import { useNavigate } from "react-router-dom";

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section
      data-testid="cta-banner"
      className="py-xl text-center px-margin-safe bg-[#0b0f16] border-y border-secondary-fixed-dim/15"
    >
      <h2 className="font-scifi font-light text-headline-xl text-primary mb-md tracking-tight">
        READY TO DOMINATE?
      </h2>
      <p className="font-scifi font-light text-lg text-on-surface-variant mb-xl max-w-xl mx-auto leading-relaxed">
        Join thousands of runners turning their daily exercise into a global strategy game.
      </p>
      <button
        data-testid="cta-banner-start"
        onClick={() => navigate("/dashboard")}
        className="bg-secondary-container text-on-secondary px-xl py-md font-scifi font-medium uppercase tracking-[0.15em] text-xl rounded-[999px] hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,219,233,0.35)]"
      >
        START RUNNING
      </button>
    </section>
  );
}
