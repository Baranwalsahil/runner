import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const css = readFileSync(
  resolve(__dirname, '../index.css'),
  'utf-8'
);

describe('index.css', () => {
  it('declares @tailwind base/components/utilities', () => {
    expect(css).toMatch(/@tailwind base;/);
    expect(css).toMatch(/@tailwind components;/);
    expect(css).toMatch(/@tailwind utilities;/);
  });

  it('defines .glass-panel utility', () => {
    expect(css).toMatch(/\.glass-panel\s*\{/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(12px\)/);
  });

  it('defines .neon-border-lime utility with lime border', () => {
    expect(css).toMatch(/\.neon-border-lime\s*\{/);
    expect(css).toMatch(/rgba\(195,\s*244,\s*0/);
  });

  it('defines .neon-border-cyan utility with cyan border', () => {
    expect(css).toMatch(/\.neon-border-cyan\s*\{/);
    expect(css).toMatch(/rgba\(0,\s*219,\s*233/);
  });

  it('defines .hex-mesh utility with SVG bg', () => {
    expect(css).toMatch(/\.hex-mesh\s*\{/);
    expect(css).toMatch(/data:image\/svg\+xml/);
  });

  it('sets body background-color #131313', () => {
    expect(css).toMatch(/background-color:\s*#131313/);
  });
});
