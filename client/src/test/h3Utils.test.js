import { describe, it, expect } from 'vitest';
import { latLngToCell } from 'h3-js';
import {
  cellToBoundary,
  cellsToGeoJSON,
  cellToWedges,
  cellsToWedgeGeoJSON,
} from '../lib/h3Utils.js';

const SEATTLE = latLngToCell(47.6062, -122.3321, 9);

describe('h3Utils', () => {
  it('cellToBoundary returns [lng,lat] ring with >= 6 vertices', () => {
    const ring = cellToBoundary(SEATTLE);
    expect(ring.length).toBeGreaterThanOrEqual(6);
    ring.forEach(([lng, lat]) => {
      expect(typeof lng).toBe('number');
      expect(typeof lat).toBe('number');
      expect(Math.abs(lng)).toBeLessThan(180);
      expect(Math.abs(lat)).toBeLessThan(90);
    });
  });

  it('cellsToGeoJSON returns FeatureCollection of polygons', () => {
    const gj = cellsToGeoJSON([
      { h3Index: SEATTLE, ownerId: 'self', color: '#c3f400', owner: '@YOU', ownership: 80 },
    ]);
    expect(gj.type).toBe('FeatureCollection');
    expect(gj.features).toHaveLength(1);
    const f = gj.features[0];
    expect(f.geometry.type).toBe('Polygon');
    expect(f.properties.color).toBe('#c3f400');
    expect(f.properties.owner).toBe('@YOU');
    expect(f.properties.ownership).toBe(80);
  });

  it('polygon ring is closed (first == last)', () => {
    const gj = cellsToGeoJSON([{ h3Index: SEATTLE, ownerId: 'x', color: '#fff' }]);
    const ring = gj.features[0].geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('cellToWedges: single share => one whole-hex wedge', () => {
    const wedges = cellToWedges(SEATTLE, [{ userId: 'a', color: '#fff', count: 3 }]);
    expect(wedges).toHaveLength(1);
  });

  it('cellToWedges: N shares => N wedges, each anchored at centroid', () => {
    const shares = [
      { userId: 'a', color: '#aaa', count: 2 },
      { userId: 'b', color: '#bbb', count: 1 },
    ];
    const wedges = cellToWedges(SEATTLE, shares);
    expect(wedges).toHaveLength(2);
    // First and last point of each wedge is the shared centroid.
    wedges.forEach((w) => {
      expect(w.coords[0]).toEqual(w.coords[w.coords.length - 1]);
      expect(w.coords.length).toBeGreaterThanOrEqual(3);
    });
    // Wedges map to their shares in order (strongest first).
    expect(wedges[0].share.count).toBe(2);
    expect(wedges[1].share.count).toBe(1);
  });

  it('cellsToWedgeGeoJSON: contested cell emits one feature per holder', () => {
    const gj = cellsToWedgeGeoJSON([
      {
        h3Index: SEATTLE,
        ownerId: 'a',
        owner: '@A',
        color: '#aaa',
        ownership: 67,
        shares: [
          { userId: 'a', owner: '@A', color: '#aaa', count: 2 },
          { userId: 'b', owner: '@B', color: '#bbb', count: 1 },
        ],
      },
    ]);
    expect(gj.features).toHaveLength(2);
    // Each wedge carries its holder's fill color + cell-level shares JSON.
    expect(gj.features[0].properties.color).toBe('#aaa');
    expect(gj.features[1].properties.color).toBe('#bbb');
    const parsed = JSON.parse(gj.features[0].properties.sharesJson);
    expect(parsed).toHaveLength(2);
    // Each wedge carries a ×N strength badge label.
    expect(gj.features[0].properties.strengthLabel).toBe("×2");
    expect(gj.features[1].properties.strengthLabel).toBe("×1");
  });
});
