import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Leaderboard from '../routes/Leaderboard.jsx';

function setup() {
  return render(
    <MemoryRouter initialEntries={['/leaderboard']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Leaderboard route', () => {
  it('renders Territory Lords heading', () => {
    setup();
    expect(screen.getByRole('heading', { name: /Territory Lords/ })).toBeInTheDocument();
  });

  it('mounts podium + table + filter chips', () => {
    setup();
    expect(screen.getByTestId('podium')).toBeInTheDocument();
    expect(screen.getByTestId('rank-table')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
  });

  it('Global filter shows all 51 players (5 pages + 1 row)', () => {
    setup();
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 / 6');
  });

  it('Regional filter narrows results', () => {
    setup();
    const before = screen.getByTestId('page-indicator').textContent;
    fireEvent.click(screen.getByTestId('chip-regional'));
    const after = screen.getByTestId('page-indicator').textContent;
    expect(after).not.toBe(before);
  });

  it('does NOT show AlertBar on /leaderboard', () => {
    setup();
    expect(screen.queryByTestId('alert-bar')).toBeNull();
  });
});
