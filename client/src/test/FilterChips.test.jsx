import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterChips from '../components/leaderboard/FilterChips.jsx';

function harness(regionVal = 'Global', timeVal = 'All-time') {
  const onRegion = vi.fn();
  const onTime = vi.fn();
  render(
    <FilterChips
      regionOptions={['Global']}
      region={regionVal}
      onRegionChange={onRegion}
      timeOptions={['All-time', 'Weekly', 'Daily']}
      time={timeVal}
      onTimeChange={onTime}
    />
  );
  return { onRegion, onTime };
}

describe('FilterChips', () => {
  it('renders Global region chip + 3 time chips', () => {
    harness();
    ['Global', 'All-time', 'Weekly', 'Daily'].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });

  it('does not render Regional or Friends chips', () => {
    harness();
    expect(screen.queryByTestId('chip-regional')).toBeNull();
    expect(screen.queryByTestId('chip-friends')).toBeNull();
  });

  it('Global chip is active by default', () => {
    harness();
    expect(screen.getByTestId('chip-global')).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking time chip fires onTimeChange', () => {
    const { onTime } = harness();
    fireEvent.click(screen.getByTestId('chip-weekly'));
    expect(onTime).toHaveBeenCalledWith('Weekly');
  });
});
