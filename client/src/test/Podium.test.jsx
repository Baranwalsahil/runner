import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Podium from '../components/leaderboard/Podium.jsx';

const PLAYERS = [
  { id: '1', rank: 1, username: '@HEX_STALKER', avatar: null, cells: 21884, region: 'Berlin Grid' },
  { id: '2', rank: 2, username: '@VELOCITY_KID', avatar: null, cells: 14202, region: 'Neo Tokyo' },
  { id: '3', rank: 3, username: '@GRID_WALKER', avatar: null, cells: 9441, region: 'London Sector' },
];

describe('Podium', () => {
  it('renders 3 ranked cards', () => {
    render(<Podium players={PLAYERS} />);
    expect(screen.getByTestId('podium-rank-1')).toBeInTheDocument();
    expect(screen.getByTestId('podium-rank-2')).toBeInTheDocument();
    expect(screen.getByTestId('podium-rank-3')).toBeInTheDocument();
  });

  it('renders CHAMPION badge on rank 1', () => {
    render(<Podium players={PLAYERS} />);
    expect(screen.getByText('CHAMPION')).toBeInTheDocument();
  });

  it('formats cell counts with commas', () => {
    render(<Podium players={PLAYERS} />);
    expect(screen.getByText(/21,884 CELLS/)).toBeInTheDocument();
    expect(screen.getByText(/14,202 CELLS/)).toBeInTheDocument();
    expect(screen.getByText(/9,441 CELLS/)).toBeInTheDocument();
  });

  it('rank 1 visually centered (order-2 class)', () => {
    render(<Podium players={PLAYERS} />);
    expect(screen.getByTestId('podium-rank-1').className).toMatch(/md:order-2/);
  });

  it('renders nothing when fewer than 3 players', () => {
    const { container } = render(<Podium players={PLAYERS.slice(0, 2)} />);
    expect(container.firstChild).toBeNull();
  });
});
