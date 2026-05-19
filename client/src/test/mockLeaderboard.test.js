import { describe, it, expect } from 'vitest';
import { mockLeaderboard, REGION_FILTERS, TIME_FILTERS, CURRENT_USER_ID } from '../data/mockLeaderboard.js';

describe('mockLeaderboard', () => {
  it('has 51 entries (50 + current user)', () => {
    expect(mockLeaderboard).toHaveLength(51);
  });

  it('each entry has required shape', () => {
    mockLeaderboard.forEach((p) => {
      expect(p.id).toBeTypeOf('string');
      expect(p.username).toMatch(/^@/);
      expect(p.cells).toBeTypeOf('number');
      expect(p.areaM2).toBeTypeOf('number');
      expect(p.streak).toBeTypeOf('number');
      expect(p.region).toBeTypeOf('string');
      expect(p.rank).toBeGreaterThan(0);
    });
  });

  it('sorted by cells desc', () => {
    for (let i = 1; i < mockLeaderboard.length; i++) {
      expect(mockLeaderboard[i - 1].cells).toBeGreaterThanOrEqual(mockLeaderboard[i].cells);
    }
  });

  it('ranks 1..N consecutive', () => {
    mockLeaderboard.forEach((p, i) => expect(p.rank).toBe(i + 1));
  });

  it('contains current user marker', () => {
    const me = mockLeaderboard.find((p) => p.id === CURRENT_USER_ID);
    expect(me).toBeDefined();
    expect(me.isCurrentUser).toBe(true);
  });

  it('filter option constants exposed', () => {
    expect(REGION_FILTERS).toContain('Global');
    expect(TIME_FILTERS).toContain('All-time');
  });
});
