import { useNavigate } from "react-router-dom";

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section
      data-testid="cta-banner"
      className="py-xl text-center px-margin-safe bg-surface-container-lowest border-y border-outline-variant/20"
    >
      <h2 className="font-headline-xl text-primary mb-md">READY TO DOMINATE?</h2>
      <p className="font-body-lg text-on-surface-variant mb-xl max-w-xl mx-auto">
        Join thousands of runners turning their daily exercise into a global strategy game.
      </p>
      <button
        data-testid="cta-banner-start"
        onClick={() => navigate("/dashboard")}
        className="bg-primary-fixed text-on-primary-fixed px-xl py-md font-label-bold text-xl rounded-none hover:scale-105 transition-all shadow-[0_0_40px_rgba(195,244,0,0.3)]"
      >
        START RUNNING
      </button>
    </section>
  );
}
