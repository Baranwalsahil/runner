import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentBattlesFeed from '../components/dashboard/RecentBattlesFeed.jsx';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('RecentBattlesFeed', () => {
  it('renders 4 initial battles', () => {
    render(<RecentBattlesFeed />);
    expect(screen.getAllByTestId('battle-item')).toHaveLength(4);
  });

  it('label starts as "View Full History"', () => {
    render(<RecentBattlesFeed />);
    expect(screen.getByTestId('load-more-label')).toHaveTextContent('View Full History');
  });

  it('renders CHALLENGE button on challengeable item', () => {
    render(<RecentBattlesFeed />);
    expect(screen.getByText('CHALLENGE')).toBeInTheDocument();
  });

  it('clicking load-more appends 8 extras', async () => {
    render(<RecentBattlesFeed />);
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getAllByTestId('battle-item')).toHaveLength(12);
  });

  it('label becomes "End of History" after load', () => {
    render(<RecentBattlesFeed />);
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getByTestId('load-more-label')).toHaveTextContent('End of History');
  });

  it('button disabled after load', () => {
    render(<RecentBattlesFeed />);
    const btn = screen.getByTestId('load-more');
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });

  it('icon swaps to check after load', () => {
    render(<RecentBattlesFeed />);
    fireEvent.click(screen.getByTestId('load-more'));
    const btn = screen.getByTestId('load-more');
    expect(btn.querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('second click is a no-op (still 12 items)', () => {
    render(<RecentBattlesFeed />);
    fireEvent.click(screen.getByTestId('load-more'));
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getAllByTestId('battle-item')).toHaveLength(12);
  });

  it('panel uses fixed h-[500px]', () => {
    render(<RecentBattlesFeed />);
    expect(screen.getByTestId('recent-battles').className).toMatch(/h-\[500px\]/);
  });
});
