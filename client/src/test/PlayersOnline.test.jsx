import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayersOnline from '../components/battlefield/PlayersOnline.jsx';

describe('PlayersOnline', () => {
  it('renders 3 default players', () => {
    render(<PlayersOnline />);
    expect(screen.getAllByTestId('player-row')).toHaveLength(3);
    expect(screen.getByText('@CYPHER_K')).toBeInTheDocument();
  });

  it('accepts custom players prop', () => {
    render(
      <PlayersOnline players={[{ id: 'a', handle: '@A', cells: 1 }]} />
    );
    expect(screen.getAllByTestId('player-row')).toHaveLength(1);
  });
});
