import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const html = readFileSync(
  resolve(__dirname, '../../index.html'),
  'utf-8'
);

describe('index.html', () => {
  it('sets <html class="dark">', () => {
    expect(html).toMatch(/<html[^>]*class="dark"/);
  });

  it('links Inter font', () => {
    expect(html).toMatch(/family=Inter/);
  });

  it('links Lexend font', () => {
    expect(html).toMatch(/family=Lexend/i);
  });

  it('links Material Symbols Outlined', () => {
    expect(html).toMatch(/Material\+Symbols\+Outlined/);
  });

  it('has title Territory Run', () => {
    expect(html).toMatch(/<title>Territory Run<\/title>/);
  });
});
