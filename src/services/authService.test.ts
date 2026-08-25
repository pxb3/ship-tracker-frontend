import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '../types/auth';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: UserRole.REGULAR,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('authService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts unauthenticated with no stored tokens', async () => {
    const { authService } = await import('./authService');
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getAccessToken()).toBeNull();
  });

  it('restores tokens from localStorage on construction', async () => {
    localStorage.setItem('accessToken', 'stored-access');
    localStorage.setItem('refreshToken', 'stored-refresh');
    const { authService } = await import('./authService');
    expect(authService.getAccessToken()).toBe('stored-access');
    expect(authService.getRefreshToken()).toBe('stored-refresh');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('login stores tokens and returns the auth response', async () => {
    const authResponse = { accessToken: 'a1', refreshToken: 'r1', user: mockUser };
    fetchMock.mockResolvedValueOnce(jsonResponse(authResponse));

    const { authService } = await import('./authService');
    const result = await authService.login({ email: 'test@example.com', password: 'secret' });

    expect(result).toEqual(authResponse);
    expect(authService.getAccessToken()).toBe('a1');
    expect(localStorage.getItem('accessToken')).toBe('a1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('login throws with server-provided message on failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid credentials' }, false, 401));

    const { authService } = await import('./authService');
    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('signup stores tokens and returns the auth response', async () => {
    const authResponse = { accessToken: 'a2', refreshToken: 'r2', user: mockUser };
    fetchMock.mockResolvedValueOnce(jsonResponse(authResponse));

    const { authService } = await import('./authService');
    const result = await authService.signup({ email: 'new@example.com', password: 'secret' });

    expect(result).toEqual(authResponse);
    expect(authService.getAccessToken()).toBe('a2');
  });

  it('logout clears tokens even if the request fails', async () => {
    localStorage.setItem('accessToken', 'a1');
    localStorage.setItem('refreshToken', 'r1');
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    const { authService } = await import('./authService');
    await authService.logout();

    expect(authService.getAccessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('getCurrentUser returns null when there is no access token', async () => {
    const { authService } = await import('./authService');
    const user = await authService.getCurrentUser();
    expect(user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('getCurrentUser refreshes the token on a 401 and retries', async () => {
    localStorage.setItem('accessToken', 'expired');
    localStorage.setItem('refreshToken', 'r1');

    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, false, 401)) // initial /auth/me fails
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'a-new', refreshToken: 'r-new' })) // refresh
      .mockResolvedValueOnce(jsonResponse(mockUser)); // retried /auth/me

    const { authService } = await import('./authService');
    const user = await authService.getCurrentUser();

    expect(user).toEqual(mockUser);
    expect(authService.getAccessToken()).toBe('a-new');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('refreshAccessToken returns false and clears tokens when there is no refresh token', async () => {
    const { authService } = await import('./authService');
    const refreshed = await authService.refreshAccessToken();
    expect(refreshed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
