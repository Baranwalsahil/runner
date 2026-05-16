import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterChips from '../components/leaderboard/FilterChips.jsx';

function harness(regionVal = 'Global', timeVal = 'All-time') {
  const onRegion = vi.fn();
  const onTime = vi.fn();
  render(
    <FilterChips
      regionOptions={['Global', 'Regional', 'Friends']}
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
  it('renders 3 region + 3 time chips', () => {
    harness();
    ['Global', 'Regional', 'Friends', 'All-time', 'Weekly', 'Daily'].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });

  it('active chip has aria-pressed=true', () => {
    harness('Regional');
    expect(screen.getByTestId('chip-regional')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('chip-global')).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking region chip fires onRegionChange', () => {
    const { onRegion } = harness();
    fireEvent.click(screen.getByTestId('chip-friends'));
    expect(onRegion).toHaveBeenCalledWith('Friends');
  });

  it('clicking time chip fires onTimeChange', () => {
    const { onTime } = harness();
    fireEvent.click(screen.getByTestId('chip-weekly'));
    expect(onTime).toHaveBeenCalledWith('Weekly');
  });
});
