import { describe, it, expect } from 'vitest';
import config from '../../tailwind.config.js';

describe('tailwind.config.js', () => {
  it('uses darkMode: class', () => {
    expect(config.darkMode).toBe('class');
  });

  it('content globs include index.html and src jsx', () => {
    expect(config.content).toEqual(
      expect.arrayContaining(['./index.html', './src/**/*.{js,jsx}'])
    );
  });

  it('primary-fixed color resolves to lime #c3f400', () => {
    expect(config.theme.extend.colors['primary-fixed']).toBe('#c3f400');
  });

  it('background color is dark #131313', () => {
    expect(config.theme.extend.colors.background).toBe('#131313');
  });

  it('secondary-fixed-dim is cyan #00dbe9', () => {
    expect(config.theme.extend.colors['secondary-fixed-dim']).toBe('#00dbe9');
  });

  it('headline-xl font family is Lexend', () => {
    expect(config.theme.extend.fontFamily['headline-xl']).toEqual(['Lexend']);
  });

  it('headline-xl font size is 48px with weight 800', () => {
    const [size, opts] = config.theme.extend.fontSize['headline-xl'];
    expect(size).toBe('48px');
    expect(opts.fontWeight).toBe('800');
  });

  it('spacing tokens include margin-safe, gutter, base', () => {
    expect(config.theme.extend.spacing['margin-safe']).toBe('24px');
    expect(config.theme.extend.spacing.gutter).toBe('16px');
    expect(config.theme.extend.spacing.base).toBe('8px');
  });

  it('borderRadius xl is 0.5rem', () => {
    expect(config.theme.extend.borderRadius.xl).toBe('0.5rem');
  });
});
