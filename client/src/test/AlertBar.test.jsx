import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertBar from '../components/AlertBar.jsx';

describe('AlertBar', () => {
  it('renders nothing when no message', () => {
    const { container } = render(<AlertBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message + cta when present', () => {
    render(<AlertBar message="SECTOR B-4 CONTESTED" ctaLabel="RECLAIM" />);
    expect(screen.getByText('SECTOR B-4 CONTESTED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RECLAIM' })).toBeInTheDocument();
  });

  it('calls onCta when CTA clicked', () => {
    const onCta = vi.fn();
    render(<AlertBar message="x" ctaLabel="GO" onCta={onCta} />);
    fireEvent.click(screen.getByRole('button', { name: 'GO' }));
    expect(onCta).toHaveBeenCalledOnce();
  });

  it('omits CTA when ctaLabel missing', () => {
    render(<AlertBar message="msg only" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
