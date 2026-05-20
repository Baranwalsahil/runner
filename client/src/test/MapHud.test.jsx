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

  it('legend shows empty state when no claims in view', () => {
    render(<MapHud />);
    const legend = screen.getByTestId('hud-legend');
    expect(legend.textContent).toMatch(/No claims in view/i);
  });

  it('legend renders one entry per owner with count', () => {
    render(
      <MapHud
        legend={[
          { ownerId: 'a', owner: '@alpha', color: '#c3f400', count: 3 },
          { ownerId: 'b', owner: '@bravo', color: '#00dbe9', count: 1 },
        ]}
      />
    );
    const entries = screen.getAllByTestId('legend-entry');
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toMatch(/@alpha/);
    expect(entries[0].textContent).toMatch(/×3/);
    expect(entries[1].textContent).toMatch(/@bravo/);
    expect(entries[1].textContent).toMatch(/×1/);
  });
});
