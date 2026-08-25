import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { UserRole } from '../types/auth';

vi.mock('../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from '../services/authService';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: UserRole.REGULAR,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function TestConsumer() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button onClick={() => login({ email: 'test@example.com', password: 'secret' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when useAuth is used outside of AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });

  it('starts loading and resolves to unauthenticated when no session exists', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('loads the current user when a session already exists', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
  });

  it('login sets the user on success', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: mockUser,
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
  });

  it('logout clears the user', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));

    await user.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });
});
