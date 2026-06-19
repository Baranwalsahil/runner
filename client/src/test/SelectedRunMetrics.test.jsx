import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SelectedRunMetrics from '../components/dashboard/SelectedRunMetrics.jsx';

describe('SelectedRunMetrics', () => {
  it('shows placeholder when no run is selected', () => {
    render(<SelectedRunMetrics metrics={null} />);
    expect(screen.getByText(/SELECT A BAR TO INSPECT A RUN/)).toBeInTheDocument();
  });

  it('renders the selected run rows and date', () => {
    render(
      <SelectedRunMetrics
        metrics={{
          date: 'Jun 12',
          isLatest: false,
          rows: [
            { label: 'CELLS', value: '7', unit: 'HEX' },
            { label: 'DIST', value: '2.40', unit: 'KM' },
            { label: 'PACE', value: "6'30\"", unit: '/KM' },
            { label: 'ELEV', value: '152', unit: 'M' },
          ],
        }}
      />
    );
    expect(screen.getByText('CELLS')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2.40')).toBeInTheDocument();
    expect(screen.getByText(/6'30"/)).toBeInTheDocument();
    expect(screen.getByText('ELEV')).toBeInTheDocument();
    expect(screen.getByText('152')).toBeInTheDocument();
    expect(screen.getByText(/Jun 12/)).toBeInTheDocument();
  });

  it('labels the latest run when not an explicit selection', () => {
    render(
      <SelectedRunMetrics
        metrics={{ date: 'Jun 12', isLatest: true, rows: [] }}
      />
    );
    expect(screen.getByText(/LATEST RUN/)).toBeInTheDocument();
  });
});
