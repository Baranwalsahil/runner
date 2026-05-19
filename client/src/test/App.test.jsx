import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('maplibre-gl', () => import('./__mocks__/maplibre-gl.js'));

const { default: AppLayout } = await import('../components/AppLayout.jsx');
const { default: Landing } = await import('../routes/Landing.jsx');
const { default: Dashboard } = await import('../routes/Dashboard.jsx');
const { default: Battlefield } = await import('../routes/Battlefield.jsx');
const { default: Leaderboard } = await import('../routes/Leaderboard.jsx');

function appAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/battlefield" element={<Battlefield />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('route / shows Landing hero', () => {
    appAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DOMINATE THE GRID');
  });

  it('route /dashboard shows dashboard panels', () => {
    Element.prototype.scrollIntoView = vi.fn();
    appAt('/dashboard');
    expect(screen.getByTestId('territory-dominance')).toBeInTheDocument();
  });

  it('route /battlefield shows battlefield section', () => {
    appAt('/battlefield');
    expect(screen.getByTestId('battlefield')).toBeInTheDocument();
  });

  it('route /leaderboard shows Territory Lords heading', () => {
    appAt('/leaderboard');
    expect(screen.getByRole('heading', { name: /Territory Lords/ })).toBeInTheDocument();
  });

  it('chrome persists across routes', () => {
    appAt('/leaderboard');
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('fab')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
