import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupModal } from './SignupModal';

const signupMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signup: signupMock }),
}));

describe('SignupModal', () => {
  beforeEach(() => {
    signupMock.mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SignupModal isOpen={false} onClose={vi.fn()} onSwitchToLogin={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('submits credentials and closes the modal on success', async () => {
    signupMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={onClose} onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(signupMock).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret123' });
  });

  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={vi.fn()} onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('shows a validation error when the password is too short', async () => {
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={vi.fn()} onSwitchToLogin={vi.fn()} />);

    // Bypass the input's own minLength by typing a matching short password in both fields.
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.type(screen.getByLabelText('Confirm Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('shows a server error message when signup fails', async () => {
    signupMock.mockRejectedValue(new Error('Email already in use'));
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={vi.fn()} onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });

  it('calls onSwitchToLogin when the login link is clicked', async () => {
    const onSwitchToLogin = vi.fn();
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={vi.fn()} onSwitchToLogin={onSwitchToLogin} />);
    await user.click(screen.getByText('Login'));

    expect(onSwitchToLogin).toHaveBeenCalled();
  });
});
