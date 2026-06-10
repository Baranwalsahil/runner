import Icon from "./Icon.jsx";

export default function AlertBar({ message, ctaLabel, onCta }) {
  if (!message) return null;
  return (
    <div
      data-testid="alert-bar"
      className="fixed top-16 left-0 right-0 z-40 bg-error-container/80 backdrop-blur-md border-b border-error/20 flex justify-center items-center w-full px-4 h-10 gap-base"
    >
      <Icon name="warning" className="text-on-error-container" />
      <span className="font-scifi text-on-error-container uppercase tracking-[0.2em] text-[12px]">
        {message}
      </span>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="ml-base bg-on-error-container text-error-container px-sm py-xs font-scifi uppercase tracking-[0.15em] text-xs rounded-full hover:brightness-110 transition-all"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
