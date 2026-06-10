import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RankTable from '../components/leaderboard/RankTable.jsx';

function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `u${i + 1}`,
    rank: i + 1,
    username: `@USER_${i + 1}`,
    avatar: null,
    cells: 10000 - i * 100,
    areaM2: (10000 - i * 100) * 110000,
    streak: 50 - i,
    region: `Region ${i % 3}`,
  }));
}

describe('RankTable', () => {
  it('renders 10 rows by default (page 1 of 25)', () => {
    render(<RankTable players={makePlayers(25)} />);
    expect(screen.getAllByTestId('rank-row')).toHaveLength(10);
  });

  it('shows Page 1 / 3 for 25 rows', () => {
    render(<RankTable players={makePlayers(25)} />);
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 / 3');
  });

  it('prev disabled on first page', () => {
    render(<RankTable players={makePlayers(25)} />);
    expect(screen.getByTestId('prev-page')).toBeDisabled();
  });

  it('next advances page', () => {
    render(<RankTable players={makePlayers(25)} />);
    fireEvent.click(screen.getByTestId('next-page'));
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 2 / 3');
  });

  it('sort by streak swaps order', () => {
    render(<RankTable players={makePlayers(12)} />);
    fireEvent.click(screen.getByTestId('sort-streak'));
    const rows = screen.getAllByTestId('rank-row');
    const firstStreak = within(rows[0]).getByText(/^50$/);
    expect(firstStreak).toBeInTheDocument();
  });

  it('clicking same sort header toggles direction', () => {
    const players = makePlayers(12);
    render(<RankTable players={players} />);
    fireEvent.click(screen.getByTestId('sort-cells'));
    const rows = screen.getAllByTestId('rank-row');
    expect(rows[0].dataset.userId).toBe('u12');
  });

  it('highlights currentUserId row', () => {
    const players = makePlayers(5);
    render(<RankTable players={players} currentUserId="u3" />);
    const me = screen.getAllByTestId('rank-row').find((r) => r.dataset.userId === 'u3');
    expect(me.className).toMatch(/border-secondary-fixed-dim/);
  });

  it('respects isCurrentUser flag too', () => {
    const players = makePlayers(3);
    players[1].isCurrentUser = true;
    render(<RankTable players={players} />);
    const me = screen.getAllByTestId('rank-row')[1];
    expect(me.className).toMatch(/border-secondary-fixed-dim/);
  });
});
