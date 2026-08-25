import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from './LoginModal';

const loginMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('LoginModal', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <LoginModal isOpen={false} onClose={vi.fn()} onSwitchToSignup={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('submits credentials and closes the modal on success', async () => {
    loginMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={onClose} onSwitchToSignup={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(loginMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret123' });
  });

  it('shows an error message when login fails', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'));
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={onClose} onSwitchToSignup={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onSwitchToSignup when the sign up link is clicked', async () => {
    const onSwitchToSignup = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={vi.fn()} onSwitchToSignup={onSwitchToSignup} />);
    await user.click(screen.getByText('Sign up'));

    expect(onSwitchToSignup).toHaveBeenCalled();
  });

  it('calls onClose when the overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <LoginModal isOpen={true} onClose={onClose} onSwitchToSignup={vi.fn()} />
    );
    await user.click(container.firstChild as HTMLElement);

    expect(onClose).toHaveBeenCalled();
  });
});
