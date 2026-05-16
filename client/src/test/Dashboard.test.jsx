import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Dashboard from '../routes/Dashboard.jsx';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function setup() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Dashboard route', () => {
  it('mounts all 4 dashboard blocks', () => {
    setup();
    expect(screen.getByTestId('territory-dominance')).toBeInTheDocument();
    expect(screen.getByTestId('quick-run-stats')).toBeInTheDocument();
    expect(screen.getByTestId('territory-map-preview')).toBeInTheDocument();
    expect(screen.getByTestId('recent-battles')).toBeInTheDocument();
  });

  it('shows AlertBar with contested message on /dashboard', () => {
    setup();
    expect(screen.getByTestId('alert-bar')).toBeInTheDocument();
    expect(screen.getByText(/SECTOR B-4: CONTESTED BY @RUNNER_X/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RECLAIM' })).toBeInTheDocument();
  });
});
