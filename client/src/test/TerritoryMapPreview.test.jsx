import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TerritoryMapPreview from '../components/dashboard/TerritoryMapPreview.jsx';

describe('TerritoryMapPreview', () => {
  it('renders live battles count', () => {
    render(<TerritoryMapPreview liveBattles={14} />);
    expect(screen.getByText(/LIVE BATTLES: 14/)).toBeInTheDocument();
  });

  it('renders district ownership', () => {
    render(<TerritoryMapPreview district="CAPITOL HILL DISTRICT" ownership={92} />);
    expect(screen.getByText('CAPITOL HILL DISTRICT')).toBeInTheDocument();
    expect(screen.getByText('92% OWNERSHIP')).toBeInTheDocument();
  });

  it('zoom buttons fire callbacks', () => {
    const inFn = vi.fn();
    const outFn = vi.fn();
    render(<TerritoryMapPreview onZoomIn={inFn} onZoomOut={outFn} />);
    fireEvent.click(screen.getByLabelText('zoom in'));
    fireEvent.click(screen.getByLabelText('zoom out'));
    expect(inFn).toHaveBeenCalledOnce();
    expect(outFn).toHaveBeenCalledOnce();
  });
});
