import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { osmStyle, SEATTLE } from "../../lib/mapStyle.js";
import { cellsToWedgeGeoJSON } from "../../lib/h3Utils.js";

const SRC_ID = "claimed-cells";
const FILL_ID = "claimed-cells-fill";
const LINE_ID = "claimed-cells-line";
const LABEL_ID = "claimed-cells-label";

export default function MapCanvas({ cells = [], center = SEATTLE, zoom, bounds, onCellClick, onMapReady, showStrengthLabels = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  // Keep the latest cells in a ref so the (once-only) "load" handler seeds the
  // source with current data even if cells arrived before the style loaded.
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  // Ref so the once-only "load" handler reads the current prop value.
  const showLabelsRef = useRef(showStrengthLabels);
  showLabelsRef.current = showStrengthLabels;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmStyle,
      center: [center.lng, center.lat],
      zoom: zoom ?? center.zoom ?? 13,
      attributionControl: false,
    });
    mapRef.current = map;
    onMapReady?.(map);

    map.on("load", () => {
      map.addSource(SRC_ID, { type: "geojson", data: cellsToWedgeGeoJSON(cellsRef.current) });
      map.addLayer({
        id: FILL_ID,
        type: "fill",
        source: SRC_ID,
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#c3f400"],
          "fill-opacity": 0.35,
        },
      });
      map.addLayer({
        id: LINE_ID,
        type: "line",
        source: SRC_ID,
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#c3f400"],
          "line-width": 1.5,
        },
      });
      // Strength badge (×N) centered on each wedge. Opt-out per map.
      if (showLabelsRef.current) {
        map.addLayer({
          id: LABEL_ID,
          type: "symbol",
          source: SRC_ID,
          layout: {
            "text-field": ["get", "strengthLabel"],
            "text-font": ["Open Sans Bold", "Noto Sans Bold"],
            "text-size": 14,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#0a0a0a",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.4,
          },
        });
      }
      map.on("click", FILL_ID, (e) => {
        const f = e.features?.[0];
        if (f) onCellClick?.(f.properties);
      });
      map.on("mouseenter", FILL_ID, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", FILL_ID, () => (map.getCanvas().style.cursor = ""));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource?.(SRC_ID);
    if (src) src.setData(cellsToWedgeGeoJSON(cells));
  }, [cells]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Camera methods are safe as soon as the map exists (they don't need the
    // style/tiles loaded), so apply directly. The previous isStyleLoaded()
    // gate could defer to a "load" event that had already fired, leaving the
    // camera stuck — so a freshly selected run's cells rendered off-screen.
    if (bounds && Array.isArray(bounds.sw) && Array.isArray(bounds.ne)) {
      map.fitBounds?.([bounds.sw, bounds.ne], { padding: 40, maxZoom: 15, animate: false });
    } else if (center) {
      const lng = Number(center.lng);
      const lat = Number(center.lat);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      map.jumpTo?.({ center: [lng, lat], zoom: zoom ?? center.zoom ?? 13 });
    }
  }, [
    bounds?.sw?.[0], bounds?.sw?.[1], bounds?.ne?.[0], bounds?.ne?.[1],
    center?.lat, center?.lng, center?.zoom, zoom,
  ]);

  return <div data-testid="map-canvas" ref={containerRef} className="absolute inset-0 z-0" />;
}
