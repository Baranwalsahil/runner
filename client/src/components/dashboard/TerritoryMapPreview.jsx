import { useRef } from "react";
import { cellToLatLng } from "h3-js";
import Icon from "../Icon.jsx";
import MapCanvas from "../battlefield/MapCanvas.jsx";

const MAP_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHR4w0XSEUpj8b0rma3P3j6NmQrzEBnlWRrgbw_AQ-AsSTeoZ4nrMOQYfjUM5YNP1P9sqPvC6nfriR_fckIFsxnzHarQ_k6RSegCfifSvz8gGMKcnlbNRNKsaQBkOjLdkHodGFVG2ye7hDTyNUmu1vy87v5Q5Z7HqbkT76eLm8BQ2RzItMYyuIgJeTTgUb0WnOCc5MneuDWs7dbvqyYw1xozmuIoQXI6u-mFeZ8plQt_aXQK04-NYd9rZhT46RaJDWY6m2MavhU3fD";

function centerFromCells(cells) {
  if (!cells || cells.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  for (const c of cells) {
    try {
      const [lat, lng] = cellToLatLng(c.h3Index);
      sumLat += lat;
      sumLng += lng;
      count += 1;
    } catch {
      // skip invalid h3 indexes
    }
  }
  if (count === 0) return null;
  return { lat: sumLat / count, lng: sumLng / count, zoom: 14 };
}

export default function TerritoryMapPreview({
  liveBattles = 0,
  district = "NO TERRITORY YET",
  ownership = 0,
  liveLabel = "YOUR CELLS",
  cells = [],
  onZoomIn,
  onZoomOut,
}) {
  const mapRef = useRef(null);
  const hasCells = cells.length > 0;
  const center = hasCells ? centerFromCells(cells) : null;

  function handleZoomIn() {
    if (mapRef.current?.zoomIn) mapRef.current.zoomIn();
    else onZoomIn?.();
  }
  function handleZoomOut() {
    if (mapRef.current?.zoomOut) mapRef.current.zoomOut();
    else onZoomOut?.();
  }

  return (
    <div
      data-testid="territory-map-preview"
      className="lg:col-span-3 glass-panel rounded-xl overflow-hidden relative group h-[500px]"
    >
      {hasCells && center ? (
        <MapCanvas
          cells={cells}
          center={center}
          zoom={center.zoom}
          onMapReady={(map) => { mapRef.current = map; }}
        />
      ) : (
        <div className="absolute inset-0 bg-surface-container-low">
          <img
            className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay"
            alt="Tactical HUD map placeholder"
            src={MAP_IMG}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-md left-md p-sm glass-panel neon-border-cyan rounded-lg z-10">
        <div className="flex items-center gap-base">
          <div className="w-3 h-3 rounded-full bg-secondary-fixed animate-pulse" />
          <span className="font-label-bold text-xs">{liveLabel}: {liveBattles}</span>
        </div>
      </div>
      <div className="absolute bottom-md right-md flex flex-col gap-base z-10">
        <button
          aria-label="zoom in"
          onClick={handleZoomIn}
          className="bg-surface-container-highest/80 backdrop-blur-md p-base rounded-full border border-outline-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-all"
        >
          <Icon name="zoom_in" />
        </button>
        <button
          aria-label="zoom out"
          onClick={handleZoomOut}
          className="bg-surface-container-highest/80 backdrop-blur-md p-base rounded-full border border-outline-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-all"
        >
          <Icon name="zoom_out" />
        </button>
      </div>
    </div>
  );
}
