import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer.jsx';

describe('Footer', () => {
  it('renders 4 nav links', () => {
    render(<Footer />);
    ['Game Rules', 'Privacy Protocol', 'System Status', 'Support'].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });

  it('renders copyright + brand', () => {
    render(<Footer />);
    expect(screen.getByText(/DOMINATE THE GRID/)).toBeInTheDocument();
  });
});
