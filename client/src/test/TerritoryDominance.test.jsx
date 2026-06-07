import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
