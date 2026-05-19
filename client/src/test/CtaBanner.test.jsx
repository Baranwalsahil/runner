import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CtaBanner from '../components/landing/CtaBanner.jsx';

function harness() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<><CtaBanner /><div data-testid="where">home</div></>} />
        <Route path="/dashboard" element={<div data-testid="where">dash</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CtaBanner', () => {
  it('renders READY TO DOMINATE? heading', () => {
    harness();
    expect(screen.getByRole('heading')).toHaveTextContent('READY TO DOMINATE');
  });

  it('CTA navigates to /dashboard', () => {
    harness();
    fireEvent.click(screen.getByTestId('cta-banner-start'));
    expect(screen.getByTestId('where').textContent).toBe('dash');
  });
});
