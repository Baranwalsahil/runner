import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');

describe('index.css hex-grid utility', () => {
  it('defines .hex-grid with radial-gradient', () => {
    expect(css).toMatch(/\.hex-grid\s*\{/);
    expect(css).toMatch(/radial-gradient/);
    expect(css).toMatch(/#c3f400/);
  });
});
