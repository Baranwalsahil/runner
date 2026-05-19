import Icon from "../Icon.jsx";

const MAP_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHR4w0XSEUpj8b0rma3P3j6NmQrzEBnlWRrgbw_AQ-AsSTeoZ4nrMOQYfjUM5YNP1P9sqPvC6nfriR_fckIFsxnzHarQ_k6RSegCfifSvz8gGMKcnlbNRNKsaQBkOjLdkHodGFVG2ye7hDTyNUmu1vy87v5Q5Z7HqbkT76eLm8BQ2RzItMYyuIgJeTTgUb0WnOCc5MneuDWs7dbvqyYw1xozmuIoQXI6u-mFeZ8plQt_aXQK04-NYd9rZhT46RaJDWY6m2MavhU3fD";

export default function TerritoryMapPreview({
  liveBattles = 0,
  district = "NO TERRITORY YET",
  ownership = 0,
  liveLabel = "YOUR CELLS",
  onZoomIn,
  onZoomOut,
}) {
  return (
    <div
      data-testid="territory-map-preview"
      className="lg:col-span-3 glass-panel rounded-xl overflow-hidden relative group h-[500px]"
    >
      <div className="absolute inset-0 bg-surface-container-low">
        <img
          className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay"
          alt="Tactical HUD map of Seattle with neon territory highlights"
          src={MAP_IMG}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      <div className="absolute top-md left-md p-sm glass-panel neon-border-cyan rounded-lg">
        <div className="flex items-center gap-base">
          <div className="w-3 h-3 rounded-full bg-secondary-fixed animate-pulse" />
          <span className="font-label-bold text-xs">{liveLabel}: {liveBattles}</span>
        </div>
      </div>
      <div className="absolute bottom-md right-md flex flex-col gap-base">
        <button
          aria-label="zoom in"
          onClick={onZoomIn}
          className="bg-surface-container-highest/80 backdrop-blur-md p-base rounded-full border border-outline-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-all"
        >
          <Icon name="zoom_in" />
        </button>
        <button
          aria-label="zoom out"
          onClick={onZoomOut}
          className="bg-surface-container-highest/80 backdrop-blur-md p-base rounded-full border border-outline-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-all"
        >
          <Icon name="zoom_out" />
        </button>
      </div>
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 glass-panel p-md rounded-xl neon-border-lime max-w-[200px]">
        <p className="font-label-bold text-[10px] text-primary-fixed mb-1">{district}</p>
        <p className="font-body-md font-bold mb-2 text-white">
          {ownership > 0 ? `${ownership}% OWNERSHIP` : "0 CELLS"}
        </p>
        <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
          <div
            className="bg-primary-fixed h-full shadow-[0_0_8px_#c3f400]"
            style={{ width: `${ownership}%` }}
          />
        </div>
      </div>
    </div>
  );
}
