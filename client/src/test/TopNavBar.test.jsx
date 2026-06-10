import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(dash.className).toMatch(/border-secondary-fixed-dim/);
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

  it('account icon links to /profile', () => {
    renderAt('/');
    expect(screen.getByLabelText('account')).toHaveAttribute('href', '/profile');
  });

  it('mobile menu hidden by default and overlay absent', () => {
    renderAt('/');
    const btn = screen.getByTestId('mobile-menu-btn');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('mobile-menu-overlay')).toBeNull();
  });

  it('clicking burger opens drawer with nav links', () => {
    renderAt('/');
    fireEvent.click(screen.getByTestId('mobile-menu-btn'));
    expect(screen.getByTestId('mobile-menu-overlay')).toBeInTheDocument();
    const drawer = screen.getByTestId('mobile-menu');
    expect(drawer).toHaveTextContent('BATTLEFIELD');
    expect(drawer).toHaveTextContent('DASHBOARD');
    expect(drawer).toHaveTextContent('LEADERBOARD');
  });

  it('clicking overlay closes drawer', () => {
    renderAt('/');
    fireEvent.click(screen.getByTestId('mobile-menu-btn'));
    fireEvent.click(screen.getByTestId('mobile-menu-overlay'));
    expect(screen.queryByTestId('mobile-menu-overlay')).toBeNull();
  });

  it('burger toggles aria-expanded', () => {
    renderAt('/');
    const btn = screen.getByTestId('mobile-menu-btn');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
