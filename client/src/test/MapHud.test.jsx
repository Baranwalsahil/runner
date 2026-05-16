import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapHud from '../components/battlefield/MapHud.jsx';

describe('MapHud', () => {
  it('renders live battles badge', () => {
    render(<MapHud liveBattles={14} />);
    expect(screen.getByText(/LIVE BATTLES: 14/)).toBeInTheDocument();
  });

  it('zoom + locate + layers buttons call callbacks', () => {
    const zin = vi.fn();
    const zout = vi.fn();
    const loc = vi.fn();
    const lay = vi.fn();
    render(<MapHud onZoomIn={zin} onZoomOut={zout} onLocate={loc} onLayers={lay} />);
    fireEvent.click(screen.getByLabelText('zoom in'));
    fireEvent.click(screen.getByLabelText('zoom out'));
    fireEvent.click(screen.getByLabelText('locate'));
    fireEvent.click(screen.getByLabelText('layers'));
    expect(zin).toHaveBeenCalledOnce();
    expect(zout).toHaveBeenCalledOnce();
    expect(loc).toHaveBeenCalledOnce();
    expect(lay).toHaveBeenCalledOnce();
  });

  it('legend has 3 swatches', () => {
    render(<MapHud />);
    const legend = screen.getByTestId('hud-legend');
    expect(legend.textContent).toMatch(/You/);
    expect(legend.textContent).toMatch(/Rival/);
    expect(legend.textContent).toMatch(/Contested/);
  });
});
