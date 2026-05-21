import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../routes/Profile.jsx';
import { withAuth } from './utils/withAuth.jsx';

const ME = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'me@example.com',
  username: 'me_user',
  first_name: 'Sahil',
  last_name: 'Baranwal',
};

function setup({ user = ME, updateProfile = vi.fn().mockResolvedValue(ME), signOut = vi.fn().mockResolvedValue() } = {}) {
  render(
    <MemoryRouter>
      {withAuth(<Profile />, { user, updateProfile, signOut })}
    </MemoryRouter>
  );
  return { updateProfile, signOut };
}

describe('Profile route', () => {
  it('shows email read-only and hydrates form from user', () => {
    setup();
    expect(screen.getByLabelText('email')).toHaveValue('me@example.com');
    expect(screen.getByLabelText('email')).toBeDisabled();
    expect(screen.getByLabelText('first name')).toHaveValue('Sahil');
    expect(screen.getByLabelText('last name')).toHaveValue('Baranwal');
    expect(screen.getByLabelText('username')).toHaveValue('me_user');
  });

  it('submits PATCH with only changed fields', async () => {
    const { updateProfile } = setup();
    fireEvent.change(screen.getByLabelText('first name'), { target: { value: 'Sahil2' } });
    fireEvent.click(screen.getByText('SAVE'));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledOnce());
    expect(updateProfile).toHaveBeenCalledWith({ first_name: 'Sahil2' });
  });

  it('shows error when update rejects', async () => {
    const updateProfile = vi.fn().mockRejectedValue(new Error('Username already taken'));
    setup({ updateProfile });
    fireEvent.change(screen.getByLabelText('username'), { target: { value: 'taken' } });
    fireEvent.click(screen.getByText('SAVE'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Username already taken'));
  });

  it('sign out invokes signOut callback', async () => {
    const { signOut } = setup();
    fireEvent.click(screen.getByText('SIGN OUT'));
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  });

  it('save with no changes does not call updateProfile', async () => {
    const { updateProfile } = setup();
    fireEvent.click(screen.getByText('SAVE'));
    // tick so async submit can fire
    await new Promise((r) => setTimeout(r, 0));
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
