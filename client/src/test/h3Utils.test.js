import { describe, it, expect } from 'vitest';
import { latLngToCell } from 'h3-js';
import { cellToBoundary, cellsToGeoJSON } from '../lib/h3Utils.js';

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
});
