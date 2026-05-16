import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Fab from '../components/Fab.jsx';

function harness(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Fab to="/dashboard" />
              <div data-testid="here">home</div>
            </>
          }
        />
        <Route path="/dashboard" element={<div data-testid="here">dash</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Fab', () => {
  it('renders Start Session label', () => {
    harness();
    expect(screen.getByText('Start Session')).toBeInTheDocument();
  });

  it('navigates to "to" prop on click', () => {
    harness();
    expect(screen.getByTestId('here').textContent).toBe('home');
    fireEvent.click(screen.getByTestId('fab'));
    expect(screen.getByTestId('here').textContent).toBe('dash');
  });
});
