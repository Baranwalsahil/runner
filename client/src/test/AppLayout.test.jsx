import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';

function setup(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div data-testid="page">L</div>} />
          <Route path="/dashboard" element={<div data-testid="page">D</div>} />
          <Route path="/battlefield" element={<div data-testid="page">B</div>} />
          <Route path="/leaderboard" element={<div data-testid="page">LB</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  it('renders chrome on /', () => {
    setup('/');
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('fab')).toBeInTheDocument();
  });

  it('hides AlertBar on / route', () => {
    setup('/');
    expect(screen.queryByTestId('alert-bar')).toBeNull();
  });

  it('shows AlertBar on /dashboard', () => {
    setup('/dashboard');
    expect(screen.getByTestId('alert-bar')).toBeInTheDocument();
    expect(screen.getByText(/SECTOR B-4/)).toBeInTheDocument();
  });

  it('renders Outlet child', () => {
    setup('/battlefield');
    expect(screen.getByTestId('page').textContent).toBe('B');
  });
});
