import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../routes/Landing.jsx';

describe('Landing', () => {
  it('mounts all 4 sections', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('feature-grid')).toBeInTheDocument();
    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
    expect(screen.getByTestId('cta-banner')).toBeInTheDocument();
  });

  it('headings: h1 (hero), h2 (map), h2 (banner), h3 x3 (features)', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });
});
