import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('maplibre-gl', () => import('./__mocks__/maplibre-gl.js'));

const { default: MapCanvas } = await import('../components/battlefield/MapCanvas.jsx');
const { mockCells } = await import('../data/mockCells.js');

describe('MapCanvas', () => {
  it('renders container div', () => {
    render(<MapCanvas cells={mockCells} />);
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
  });

  it('passes map instance to onMapReady', async () => {
    const ready = vi.fn();
    render(<MapCanvas cells={mockCells} onMapReady={ready} />);
    await waitFor(() => expect(ready).toHaveBeenCalled());
    expect(ready.mock.calls[0][0]).toBeTruthy();
  });

  it('adds claimed-cells source on load', async () => {
    let map;
    render(<MapCanvas cells={mockCells} onMapReady={(m) => (map = m)} />);
    await waitFor(() => expect(map.getSource('claimed-cells')).toBeTruthy());
  });
});
