import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { osmStyle, SEATTLE } from "../../lib/mapStyle.js";
import { cellsToGeoJSON } from "../../lib/h3Utils.js";

const SRC_ID = "claimed-cells";
const FILL_ID = "claimed-cells-fill";
const LINE_ID = "claimed-cells-line";
const TRACE_SRC_ID = "run-trace";
const TRACE_LINE_ID = "run-trace-line";

function traceToGeoJSON(trace) {
  const coords = (trace || [])
    .filter((p) => Number.isFinite(p?.lng) && Number.isFinite(p?.lat))
    .map((p) => [p.lng, p.lat]);
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {},
  };
}

export default function MapCanvas({ cells = [], trace = [], center = SEATTLE, zoom, bounds, onCellClick, onMapReady }) {
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
      map.addSource(TRACE_SRC_ID, { type: "geojson", data: traceToGeoJSON(trace) });
      map.addLayer({
        id: TRACE_LINE_ID,
        type: "line",
        source: TRACE_SRC_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#00e5ff",
          "line-width": 3,
          "line-opacity": 0.9,
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource?.(TRACE_SRC_ID);
    if (src) src.setData(traceToGeoJSON(trace));
  }, [trace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let apply;
    if (bounds && Array.isArray(bounds.sw) && Array.isArray(bounds.ne)) {
      apply = () =>
        map.fitBounds?.([bounds.sw, bounds.ne], { padding: 40, maxZoom: 15, animate: false });
    } else if (center) {
      const lng = Number(center.lng);
      const lat = Number(center.lat);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const targetZoom = zoom ?? center.zoom ?? 13;
      apply = () => map.jumpTo?.({ center: [lng, lat], zoom: targetZoom });
    } else {
      return;
    }
    if (map.isStyleLoaded?.()) apply();
    else map.once?.("load", apply);
  }, [
    bounds?.sw?.[0], bounds?.sw?.[1], bounds?.ne?.[0], bounds?.ne?.[1],
    center?.lat, center?.lng, center?.zoom, zoom,
  ]);

  return <div data-testid="map-canvas" ref={containerRef} className="absolute inset-0 z-0" />;
}
