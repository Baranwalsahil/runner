import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentBattlesFeed from '../components/dashboard/RecentBattlesFeed.jsx';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const MOCK_INITIAL = [
  { id: "r1", type: "gained", label: "Territory Gained", time: "2m ago", title: "3 cells claimed", subject_label: "by", user: "@Alice", accent: true, challengeable: false },
  { id: "r2", type: "gained", label: "Territory Gained", time: "5m ago", title: "1 cell claimed", subject_label: "by", user: "@Bob", accent: false, challengeable: false },
  { id: "r3", type: "gained", label: "Territory Gained", time: "1h ago", title: "2 cells claimed", subject_label: "by", user: "@Carol", accent: false, challengeable: false },
  { id: "r4", type: "gained", label: "Territory Gained", time: "3h ago", title: "5 cells claimed", subject_label: "by", user: "@Dave", accent: false, challengeable: false },
];

const MOCK_EXTRA = [
  { id: "r5", type: "gained", label: "Territory Gained", time: "6h ago", title: "7 cells claimed", subject_label: "by", user: "@Eve", accent: false, challengeable: false },
  { id: "r6", type: "gained", label: "Territory Gained", time: "12h ago", title: "4 cells claimed", subject_label: "by", user: "@Frank", accent: false, challengeable: false },
  { id: "r7", type: "gained", label: "Territory Gained", time: "1d ago", title: "2 cells claimed", subject_label: "by", user: "@Grace", accent: false, challengeable: false },
  { id: "r8", type: "gained", label: "Territory Gained", time: "2d ago", title: "9 cells claimed", subject_label: "by", user: "@Hank", accent: false, challengeable: false },
];

describe('RecentBattlesFeed', () => {
  it('renders loading state when loading=true', () => {
    render(<RecentBattlesFeed loading={true} />);
    expect(screen.getByTestId('battles-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('battle-item')).toBeNull();
  });

  it('renders empty state when no battles and not loading', () => {
    render(<RecentBattlesFeed loading={false} initialBattles={[]} extraBattles={[]} />);
    expect(screen.getByTestId('battles-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('battle-item')).toBeNull();
  });

  it('renders 4 initial battles from DB data', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    expect(screen.getAllByTestId('battle-item')).toHaveLength(4);
  });

  it('renders battle user and title from DB data', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={[]} />);
    expect(screen.getByText('@Alice')).toBeInTheDocument();
    expect(screen.getByText('3 cells claimed')).toBeInTheDocument();
  });

  it('uses subject_label field from feed items', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={[]} />);
    const byLabels = screen.getAllByText('by');
    expect(byLabels.length).toBeGreaterThan(0);
  });

  it('label starts as "View Full History" when extras exist', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    expect(screen.getByTestId('load-more-label')).toHaveTextContent('View Full History');
  });

  it('clicking load-more appends extra items', async () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getAllByTestId('battle-item')).toHaveLength(8);
  });

  it('label becomes "End of History" after load', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getByTestId('load-more-label')).toHaveTextContent('End of History');
  });

  it('button disabled after load', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    const btn = screen.getByTestId('load-more');
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });

  it('button disabled when no extras', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={[]} />);
    expect(screen.getByTestId('load-more')).toBeDisabled();
  });

  it('icon swaps to check after load', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    fireEvent.click(screen.getByTestId('load-more'));
    const btn = screen.getByTestId('load-more');
    expect(btn.querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('second click is a no-op (still 8 items)', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} extraBattles={MOCK_EXTRA} />);
    fireEvent.click(screen.getByTestId('load-more'));
    fireEvent.click(screen.getByTestId('load-more'));
    expect(screen.getAllByTestId('battle-item')).toHaveLength(8);
  });

  it('panel uses fixed h-[500px]', () => {
    render(<RecentBattlesFeed />);
    expect(screen.getByTestId('recent-battles').className).toMatch(/h-\[500px\]/);
  });

  it('default render (no props) shows empty state, not hardcoded data', () => {
    render(<RecentBattlesFeed />);
    expect(screen.queryByTestId('battle-item')).toBeNull();
    expect(screen.getByTestId('battles-empty')).toBeInTheDocument();
  });

  it('clicking an item calls onSelectRun with the run id', () => {
    const onSelectRun = vi.fn();
    render(
      <RecentBattlesFeed initialBattles={MOCK_INITIAL} onSelectRun={onSelectRun} />,
    );
    fireEvent.click(screen.getAllByTestId('battle-item')[1]);
    expect(onSelectRun).toHaveBeenCalledWith('r2');
  });

  it('marks the selected item via data-selected', () => {
    render(
      <RecentBattlesFeed
        initialBattles={MOCK_INITIAL}
        onSelectRun={vi.fn()}
        selectedRunId="r3"
      />,
    );
    const items = screen.getAllByTestId('battle-item');
    expect(items[2].getAttribute('data-selected')).toBe('true');
    expect(items[0].getAttribute('data-selected')).toBeNull();
  });

  it('items are not clickable without onSelectRun', () => {
    render(<RecentBattlesFeed initialBattles={MOCK_INITIAL} />);
    const item = screen.getAllByTestId('battle-item')[0];
    expect(item.getAttribute('role')).toBeNull();
  });
});
