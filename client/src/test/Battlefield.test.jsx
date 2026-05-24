import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('maplibre-gl', () => import('./__mocks__/maplibre-gl.js'));
vi.mock('../hooks/useCurrentLocation.js', () => ({
  default: () => ({ position: { lat: 47.6062, lng: -122.3321 }, error: null, loading: false }),
}));

const { default: AppLayout } = await import('../components/AppLayout.jsx');
const { default: Battlefield } = await import('../routes/Battlefield.jsx');

function setup() {
  return render(
    <MemoryRouter initialEntries={['/battlefield']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/battlefield" element={<Battlefield />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Battlefield route', () => {
  it('mounts map, hud, players, no detail panel yet', () => {
    setup();
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('hud-live-battles')).toBeInTheDocument();
    expect(screen.getByTestId('players-online')).toBeInTheDocument();
    expect(screen.queryByTestId('cell-detail-panel')).toBeNull();
  });

  it('hides AlertBar (battlefield is not dashboard)', () => {
    setup();
    expect(screen.queryByTestId('alert-bar')).toBeNull();
  });

  it('zoom HUD buttons present', () => {
    setup();
    fireEvent.click(screen.getByLabelText('zoom in'));
    fireEvent.click(screen.getByLabelText('zoom out'));
  });
});
