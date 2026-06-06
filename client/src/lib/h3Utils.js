import { cellToBoundary as h3CellToBoundary } from "h3-js";

export function cellToBoundary(h3Index) {
  return h3CellToBoundary(h3Index, true).map(([lng, lat]) => [lng, lat]);
}

/** Polygon centroid (mean of ring vertices). */
function centroidOf(ring) {
  let x = 0;
  let y = 0;
  for (const [lng, lat] of ring) {
    x += lng;
    y += lat;
  }
  return [x / ring.length, y / ring.length];
}

/**
 * Slice a hex into pie wedges from its centroid, one per share, with each
 * wedge spanning an arc of the perimeter proportional to that share's count.
 * Returns [{ coords, share }]. A single (or zero) share => the whole hex.
 */
export function cellToWedges(h3Index, shares) {
  const ring = cellToBoundary(h3Index); // open ring [lng,lat][]
  const total = (shares || []).reduce((s, sh) => s + sh.count, 0);
  if (!shares || shares.length <= 1 || total <= 0) {
    const closed = [...ring, ring[0]];
    return [{ coords: closed, share: shares && shares[0] }];
  }

  const c = centroidOf(ring);
  const n = ring.length;
  // Cumulative perimeter fraction at each vertex.
  const seg = [];
  let perim = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    perim += d;
  }
  const vertFrac = [0];
  for (let i = 0; i < n; i++) vertFrac.push(vertFrac[i] + seg[i] / perim);
  // vertFrac[i] = perimeter fraction at vertex i (vertFrac[n] === 1).

  // Point at a given perimeter fraction (0..1) along the hex edges.
  const pointAt = (f) => {
    const target = Math.min(Math.max(f, 0), 1);
    for (let i = 0; i < n; i++) {
      if (target <= vertFrac[i + 1] || i === n - 1) {
        const span = vertFrac[i + 1] - vertFrac[i] || 1;
        const t = (target - vertFrac[i]) / span;
        const a = ring[i];
        const b = ring[(i + 1) % n];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
    }
    return ring[0];
  };

  const wedges = [];
  let acc = 0;
  for (const share of shares) {
    const startF = acc;
    acc += share.count / total;
    const endF = acc;
    const coords = [c, pointAt(startF)];
    // Original hex vertices strictly inside (startF, endF), in order.
    for (let i = 0; i <= n; i++) {
      if (vertFrac[i] > startF && vertFrac[i] < endF) coords.push(ring[i % n]);
    }
    coords.push(pointAt(endF), c); // close back to centroid
    wedges.push({ coords, share });
  }
  return wedges;
}

/**
 * Build a FeatureCollection where every cell is split into per-user wedges.
 * Cell-level intel (owner, shares) rides on every wedge's properties so a
 * click anywhere in the hex resolves the same cell.
 */
export function cellsToWedgeGeoJSON(cells) {
  const features = [];
  for (const c of cells) {
    const shares = c.shares ?? [];
    const sharesJson = JSON.stringify(shares);
    const wedges = cellToWedges(c.h3Index, shares);
    wedges.forEach((w, i) => {
      features.push({
        type: "Feature",
        id: `${c.h3Index}:${w.share?.userId ?? i}`,
        properties: {
          h3Index: c.h3Index,
          ownerId: c.ownerId,
          owner: c.owner ?? c.ownerId,
          color: w.share?.color ?? c.color,
          claimedAt: c.claimedAt ?? null,
          ownership: c.ownership ?? 100,
          sharesJson,
        },
        geometry: { type: "Polygon", coordinates: [w.coords] },
      });
    });
  }
  return { type: "FeatureCollection", features };
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
