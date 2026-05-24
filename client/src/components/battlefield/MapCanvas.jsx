import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { osmStyle, SEATTLE } from "../../lib/mapStyle.js";
import { cellsToGeoJSON } from "../../lib/h3Utils.js";

const SRC_ID = "claimed-cells";
const FILL_ID = "claimed-cells-fill";
const LINE_ID = "claimed-cells-line";

export default function MapCanvas({ cells = [], center = SEATTLE, zoom, onCellClick, onMapReady }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

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
      map.addSource(SRC_ID, { type: "geojson", data: cellsToGeoJSON(cells) });
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
    if (src) src.setData(cellsToGeoJSON(cells));
  }, [cells]);

  // Fly to new center/zoom when props change after the map is already mounted.
  // This handles the case where MapCanvas mounts before the correct center is
  // known (e.g. StrictMode double-invoke, or parent re-render after data loads).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.flyTo({ center: [center.lng, center.lat], zoom: zoom ?? center.zoom ?? 13 });
  }, [center, zoom]);

  return <div data-testid="map-canvas" ref={containerRef} className="absolute inset-0 z-0" />;
}
