export const SEATTLE = { lng: -122.3321, lat: 47.6062, zoom: 13 };

export const osmStyle = {
  version: 8,
  // Public glyph PBFs so symbol (text) layers can render cell strength labels.
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0e0e0e" },
    },
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      paint: {
        "raster-brightness-max": 0.5,
        "raster-brightness-min": 0,
        "raster-contrast": 0.2,
        "raster-saturation": -0.6,
      },
    },
  ],
};
