import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('does not render LOG SESSION button', () => {
    render(<QuickRunStats />);
    expect(screen.queryByTestId('log-session')).toBeNull();
  });

  it('renders custom stats with BEST suffix', () => {
    const stats = [
      { label: 'CELLS', value: '6', suffix: 'BEST' },
      { label: 'DIST', value: '1.23', suffix: 'KM BEST' },
      { label: 'AREA', value: '0.63', suffix: 'KM² BEST' },
    ];
    render(<QuickRunStats stats={stats} />);
    expect(screen.getByText('CELLS')).toBeInTheDocument();
    expect(screen.getByText(/1\.23/)).toBeInTheDocument();
    expect(screen.getByText(/0\.63/)).toBeInTheDocument();
    expect(screen.getAllByText(/BEST/).length).toBeGreaterThanOrEqual(3);
  });
});
