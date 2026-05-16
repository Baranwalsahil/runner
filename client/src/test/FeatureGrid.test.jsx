import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeatureGrid from '../components/landing/FeatureGrid.jsx';

describe('FeatureGrid', () => {
  it('renders 3 feature headings', () => {
    render(<FeatureGrid />);
    expect(screen.getByRole('heading', { name: 'RUN' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLAIM' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DEFEND' })).toBeInTheDocument();
  });

  it('renders icon spans with correct data-icon', () => {
    const { container } = render(<FeatureGrid />);
    const icons = Array.from(container.querySelectorAll('[data-icon]')).map((e) =>
      e.getAttribute('data-icon')
    );
    expect(icons).toEqual(expect.arrayContaining(['directions_run', 'pentagon', 'shield']));
  });

  it('icons use FILL variation', () => {
    const { container } = render(<FeatureGrid />);
    container.querySelectorAll('[data-icon]').forEach((el) => {
      expect(el.style.fontVariationSettings).toMatch(/FILL/);
    });
  });
});
