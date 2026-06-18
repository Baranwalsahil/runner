import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickRunStats from '../components/dashboard/QuickRunStats.jsx';

describe('QuickRunStats', () => {
  it('renders BEST and AVG column headers', () => {
    render(<QuickRunStats />);
    expect(screen.getByText('BEST')).toBeInTheDocument();
    expect(screen.getByText('AVG')).toBeInTheDocument();
  });

  it('renders default metric rows', () => {
    render(<QuickRunStats />);
    expect(screen.getByText('PACE')).toBeInTheDocument();
    expect(screen.getByText('CELLS')).toBeInTheDocument();
    expect(screen.getByText('DIST')).toBeInTheDocument();
  });

  it('renders both best and avg values per metric', () => {
    const stats = [
      { label: 'CELLS', best: '42', avg: '18', unit: 'HEX' },
      { label: 'DIST', best: '5.20', avg: '3.10', unit: 'KM' },
    ];
    render(<QuickRunStats stats={stats} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('5.20')).toBeInTheDocument();
    expect(screen.getByText('3.10')).toBeInTheDocument();
    expect(screen.getAllByTestId('stat-best')).toHaveLength(2);
    expect(screen.getAllByTestId('stat-avg')).toHaveLength(2);
  });

  it('does not render LOG SESSION button', () => {
    render(<QuickRunStats />);
    expect(screen.queryByTestId('log-session')).toBeNull();
  });
});
