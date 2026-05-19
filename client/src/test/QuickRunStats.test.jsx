import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickRunStats from '../components/dashboard/QuickRunStats.jsx';

describe('QuickRunStats', () => {
  it('renders PACE/MILES/CALORIES rows', () => {
    render(<QuickRunStats />);
    expect(screen.getByText('PACE')).toBeInTheDocument();
    expect(screen.getByText('MILES')).toBeInTheDocument();
    expect(screen.getByText('CALORIES')).toBeInTheDocument();
  });

  it('renders default values', () => {
    render(<QuickRunStats />);
    expect(screen.getByText(/7'12"/)).toBeInTheDocument();
    expect(screen.getByText(/42\.8/)).toBeInTheDocument();
    expect(screen.getByText(/3,450/)).toBeInTheDocument();
  });

  it('LOG SESSION click fires callback', () => {
    const cb = vi.fn();
    render(<QuickRunStats onLogSession={cb} />);
    fireEvent.click(screen.getByTestId('log-session'));
    expect(cb).toHaveBeenCalledOnce();
  });
});
