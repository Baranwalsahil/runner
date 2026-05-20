import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('maplibre-gl', () => import('./__mocks__/maplibre-gl.js'));

const { default: TerritoryMapPreview } = await import('../components/dashboard/TerritoryMapPreview.jsx');

describe('TerritoryMapPreview', () => {
  it('renders live count with default label', () => {
    render(<TerritoryMapPreview liveBattles={14} />);
    expect(screen.getByText(/YOUR CELLS: 14/)).toBeInTheDocument();
  });

  it('honors custom liveLabel prop', () => {
    render(<TerritoryMapPreview liveBattles={5} liveLabel="LIVE BATTLES" />);
    expect(screen.getByText(/LIVE BATTLES: 5/)).toBeInTheDocument();
  });

  it('does not render the ownership overlay box', () => {
    render(<TerritoryMapPreview district="CAPITOL HILL DISTRICT" ownership={92} />);
    expect(screen.queryByText('CAPITOL HILL DISTRICT')).not.toBeInTheDocument();
    expect(screen.queryByText('92% OWNERSHIP')).not.toBeInTheDocument();
  });

  it('falls back to placeholder image when no cells passed', () => {
    render(<TerritoryMapPreview />);
    expect(screen.getByAltText(/placeholder/i)).toBeInTheDocument();
    expect(screen.queryByTestId('map-canvas')).not.toBeInTheDocument();
  });

  it('renders the real map canvas when cells prop is non-empty', async () => {
    const cells = [
      { h3Index: '89283082803ffff', color: '#c3f400' },
      { h3Index: '89283082807ffff', color: '#c3f400' },
    ];
    render(<TerritoryMapPreview cells={cells} liveBattles={2} />);
    await waitFor(() => {
      expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
    });
    expect(screen.queryByAltText(/placeholder/i)).not.toBeInTheDocument();
  });

  it('zoom buttons fall back to callbacks when no cells', () => {
    const inFn = vi.fn();
    const outFn = vi.fn();
    render(<TerritoryMapPreview onZoomIn={inFn} onZoomOut={outFn} />);
    fireEvent.click(screen.getByLabelText('zoom in'));
    fireEvent.click(screen.getByLabelText('zoom out'));
    expect(inFn).toHaveBeenCalledOnce();
    expect(outFn).toHaveBeenCalledOnce();
  });
});
