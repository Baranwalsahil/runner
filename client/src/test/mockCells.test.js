import { describe, it, expect } from 'vitest';
import { generateMockCells, mockCells, OWNERS } from '../data/mockCells.js';

describe('mockCells', () => {
  it('mockCells has approx 50 cells (gridDisk k=4 => 61)', () => {
    expect(mockCells.length).toBeGreaterThan(40);
    expect(mockCells.length).toBeLessThan(80);
  });

  it('each cell has h3Index, ownerId, color', () => {
    mockCells.forEach((c) => {
      expect(c.h3Index).toMatch(/^[0-9a-f]+$/i);
      expect(c.ownerId).toBeTypeOf('string');
      expect(c.color).toMatch(/^#[0-9a-f]{3,6}$/i);
    });
  });

  it('uses all 4 owner colors', () => {
    const colors = new Set(mockCells.map((c) => c.color));
    OWNERS.forEach((o) => expect(colors.has(o.color)).toBe(true));
  });

  it('generateMockCells respects k param', () => {
    const small = generateMockCells({ k: 1 });
    const big = generateMockCells({ k: 3 });
    expect(big.length).toBeGreaterThan(small.length);
  });
});
