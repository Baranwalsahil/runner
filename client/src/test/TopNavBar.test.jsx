import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopNavBar />
    </MemoryRouter>
  );
}

describe('TopNavBar', () => {
  it('renders TERRITORY RUN brand', () => {
    renderAt('/');
    expect(screen.getByText('TERRITORY RUN')).toBeInTheDocument();
  });

  it('renders 3 nav links', () => {
    renderAt('/');
    expect(screen.getByText('BATTLEFIELD')).toHaveAttribute('href', '/battlefield');
    expect(screen.getByText('DASHBOARD')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('LEADERBOARD')).toHaveAttribute('href', '/leaderboard');
  });

  it('marks active link with lime underline classes', () => {
    renderAt('/dashboard');
    const dash = screen.getByText('DASHBOARD');
    expect(dash.className).toMatch(/border-primary-fixed/);
    expect(dash.className).toMatch(/border-b-2/);
  });

  it('inactive links lack active border', () => {
    renderAt('/dashboard');
    expect(screen.getByText('BATTLEFIELD').className).not.toMatch(/border-b-2/);
  });

  it('renders notifications + account icon buttons', () => {
    renderAt('/');
    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('account')).toBeInTheDocument();
  });
});
