import { cellToBoundary as h3CellToBoundary } from "h3-js";

export function cellToBoundary(h3Index) {
  return h3CellToBoundary(h3Index, true).map(([lng, lat]) => [lng, lat]);
}

export function cellsToGeoJSON(cells) {
  return {
    type: "FeatureCollection",
    features: cells.map((c) => {
      const ring = cellToBoundary(c.h3Index);
      const closed = ring.length && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring
        : [...ring, ring[0]];
      return {
        type: "Feature",
        id: c.h3Index,
        properties: {
          h3Index: c.h3Index,
          ownerId: c.ownerId,
          color: c.color,
          owner: c.owner ?? c.ownerId,
          claimedAt: c.claimedAt ?? null,
          ownership: c.ownership ?? 100,
        },
        geometry: {
          type: "Polygon",
          coordinates: [closed],
        },
      };
    }),
  };
}
