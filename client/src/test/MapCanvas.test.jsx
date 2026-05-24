import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

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

  it('calls flyTo when center prop changes after mount', async () => {
    const center1 = { lat: 47.6, lng: -122.33, zoom: 14 };
    const center2 = { lat: 48.0, lng: -122.0, zoom: 12 };
    let map;
    const { rerender } = render(
      <MapCanvas cells={mockCells} center={center1} zoom={14} onMapReady={(m) => (map = m)} />
    );
    // Wait for map to be ready
    await waitFor(() => expect(map).toBeTruthy());
    const flyToCallsBefore = map.flyTo.mock.calls.length;
    // Update center prop — should trigger flyTo
    await act(async () => {
      rerender(<MapCanvas cells={mockCells} center={center2} zoom={12} onMapReady={(m) => (map = m)} />);
    });
    await waitFor(() => {
      expect(map.flyTo.mock.calls.length).toBeGreaterThan(flyToCallsBefore);
    });
    const lastCall = map.flyTo.mock.calls[map.flyTo.mock.calls.length - 1][0];
    expect(lastCall.center).toEqual([-122.0, 48.0]);
    expect(lastCall.zoom).toBe(12);
  });
});
