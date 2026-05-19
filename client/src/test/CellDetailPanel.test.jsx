import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CellDetailPanel from '../components/battlefield/CellDetailPanel.jsx';

const CELL = {
  h3Index: '8a2a1072b59ffff',
  owner: '@GhostRunner',
  color: '#00dbe9',
  ownership: 75,
  claimedAt: '2026-05-15T12:00:00Z',
};

describe('CellDetailPanel', () => {
  it('renders nothing without cell', () => {
    const { container } = render(<CellDetailPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders cell h3Index + owner + ownership', () => {
    render(<CellDetailPanel cell={CELL} />);
    expect(screen.getByText(CELL.h3Index)).toBeInTheDocument();
    expect(screen.getByText('@GhostRunner')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('close button fires onClose', () => {
    const onClose = vi.fn();
    render(<CellDetailPanel cell={CELL} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('CHALLENGE fires onChallenge with cell', () => {
    const onChallenge = vi.fn();
    render(<CellDetailPanel cell={CELL} onChallenge={onChallenge} />);
    fireEvent.click(screen.getByTestId('challenge-cell'));
    expect(onChallenge).toHaveBeenCalledWith(CELL);
  });
});
