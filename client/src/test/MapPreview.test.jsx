import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapPreview from '../components/landing/MapPreview.jsx';

describe('MapPreview', () => {
  it('renders THE GLOBAL HEX-GRID headline', () => {
    render(<MapPreview />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('THE GLOBAL HEX-GRID');
  });

  it('renders rank and alert content', () => {
    render(<MapPreview />);
    expect(screen.getByText('YOUR RANK: #42')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL ALERT')).toBeInTheDocument();
  });

  it('has id="how-it-works" for anchor link', () => {
    const { container } = render(<MapPreview />);
    expect(container.querySelector('#how-it-works')).not.toBeNull();
  });

  it('renders live coords', () => {
    render(<MapPreview />);
    expect(screen.getByText(/35\.6762° N/)).toBeInTheDocument();
  });
});
