import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Hero from '../components/landing/Hero.jsx';

function harness(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/" element={<><Hero /><div data-testid="where">home</div></>} />
        <Route path="/dashboard" element={<div data-testid="where">dash</div>} />
        <Route path="/battlefield" element={<div data-testid="where">battle</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Hero', () => {
  it('renders headline DOMINATE THE GRID', () => {
    harness();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DOMINATE THE GRID');
  });

  it('START RUNNING navigates to /dashboard', () => {
    harness();
    fireEvent.click(screen.getByTestId('cta-start'));
    expect(screen.getByTestId('where').textContent).toBe('dash');
  });

  it('VIEW BATTLEFIELD navigates to /battlefield', () => {
    harness();
    fireEvent.click(screen.getByTestId('cta-battlefield'));
    expect(screen.getByTestId('where').textContent).toBe('battle');
  });

  it('hero img has descriptive alt', () => {
    harness();
    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toMatch(/GPS|neon|city/i);
  });
});
