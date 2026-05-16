import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Icon from '../components/Icon.jsx';

describe('Icon', () => {
  it('renders material-symbols-outlined span with name as text + data-icon', () => {
    const { container } = render(<Icon name="notifications" />);
    const el = container.querySelector('span');
    expect(el).not.toBeNull();
    expect(el.className).toMatch(/material-symbols-outlined/);
    expect(el.getAttribute('data-icon')).toBe('notifications');
    expect(el.textContent).toBe('notifications');
  });

  it('applies extra className prop', () => {
    const { container } = render(<Icon name="add" className="text-3xl" />);
    expect(container.querySelector('span').className).toMatch(/text-3xl/);
  });

  it('sets FILL variation when filled', () => {
    const { container } = render(<Icon name="shield" filled />);
    const el = container.querySelector('span');
    expect(el.style.fontVariationSettings).toMatch(/FILL/);
  });
});
