import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TerritoryDominance from '../components/dashboard/TerritoryDominance.jsx';

describe('TerritoryDominance', () => {
  it('renders formatted cell count', () => {
    render(<TerritoryDominance cells={1284} />);
    expect(screen.getByText('1,284')).toBeInTheDocument();
  });

  it('renders strength when provided', () => {
    render(<TerritoryDominance cells={3} strength={6} />);
    const el = screen.getByTestId('total-strength');
    expect(el).toHaveTextContent('6');
    expect(el).toHaveTextContent('STRENGTH');
  });

  it('omits strength block when not provided', () => {
    render(<TerritoryDominance cells={3} />);
    expect(screen.queryByTestId('total-strength')).toBeNull();
  });

  it('renders region pill', () => {
    render(<TerritoryDominance region="TOP 5% IN SEATTLE" />);
    expect(screen.getByText('TOP 5% IN SEATTLE')).toBeInTheDocument();
  });

  it('renders 7 chart bars by default', () => {
    const { getAllByTestId } = render(<TerritoryDominance />);
    expect(getAllByTestId('chart-bar')).toHaveLength(7);
  });

  it('renders growth label', () => {
    render(<TerritoryDominance />);
    expect(screen.getByText(/TERRITORY GROWTH/)).toBeInTheDocument();
  });

  it('respects chartData prop length', () => {
    const { getAllByTestId } = render(
      <TerritoryDominance chartData={[{ height: 10 }, { height: 20 }]} />
    );
    expect(getAllByTestId('chart-bar')).toHaveLength(2);
  });

  it('shows empty state when chartData is empty', () => {
    render(<TerritoryDominance chartData={[]} />);
    expect(screen.getByText(/NO RUNS IN LAST 30 DAYS/)).toBeInTheDocument();
  });

  it('calls onSelectBar with the runId when a bar is clicked', () => {
    const onSelectBar = vi.fn();
    render(
      <TerritoryDominance
        chartData={[{ runId: 'run-abc', height: 50, cells: 5, date: 'Jun 1' }]}
        onSelectBar={onSelectBar}
      />
    );
    fireEvent.click(screen.getByTestId('chart-bar'));
    expect(onSelectBar).toHaveBeenCalledWith('run-abc');
  });

  it('marks the selected bar', () => {
    render(
      <TerritoryDominance
        chartData={[
          { runId: 'run-a', height: 50, cells: 5, date: 'Jun 1' },
          { runId: 'run-b', height: 80, cells: 9, date: 'Jun 2' },
        ]}
        selectedRunId="run-b"
        onSelectBar={() => {}}
      />
    );
    const bars = screen.getAllByTestId('chart-bar');
    expect(bars[0]).not.toHaveAttribute('data-selected');
    expect(bars[1]).toHaveAttribute('data-selected', 'true');
  });

  it('renders bars as buttons (keyboard accessible)', () => {
    render(
      <TerritoryDominance
        chartData={[{ runId: 'run-a', height: 50, cells: 5, date: 'Jun 1' }]}
        onSelectBar={() => {}}
      />
    );
    expect(screen.getByTestId('chart-bar').tagName).toBe('BUTTON');
  });
});
