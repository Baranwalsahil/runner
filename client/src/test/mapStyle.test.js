import { describe, it, expect } from 'vitest';
import { osmStyle, SEATTLE } from '../lib/mapStyle.js';

describe('mapStyle', () => {
  it('SEATTLE center constants present', () => {
    expect(SEATTLE.lat).toBeCloseTo(47.6062, 2);
    expect(SEATTLE.lng).toBeCloseTo(-122.3321, 2);
  });

  it('osmStyle is valid MapLibre style v8', () => {
    expect(osmStyle.version).toBe(8);
    expect(osmStyle.sources.osm.tiles[0]).toMatch(/openstreetmap/);
  });

  it('has dark background layer below osm raster', () => {
    expect(osmStyle.layers[0].type).toBe('background');
    expect(osmStyle.layers[1].source).toBe('osm');
  });
});
