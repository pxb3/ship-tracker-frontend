import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '../types/auth';
import { Navbar } from './Navbar';

const logoutMock = vi.fn();
const loginMock = vi.fn();
const signupMock = vi.fn();

const mockUser = {
  id: 'user-1',
  email: 'sailor@example.com',
  role: UserRole.REGULAR,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

let authState: {
  user: typeof mockUser | null;
  isAuthenticated: boolean;
  loading: boolean;
} = { user: null, isAuthenticated: false, loading: false };

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    ...authState,
    login: loginMock,
    signup: signupMock,
    logout: logoutMock,
  }),
}));

function renderNavbar(overrides: Partial<React.ComponentProps<typeof Navbar>> = {}) {
  const props = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    onClear: vi.fn(),
    onKeyDown: vi.fn(),
    onFocus: vi.fn(),
    showTypingSpinner: false,
    ...overrides,
  };
  return { ...render(<Navbar {...props} />), props };
}

describe('Navbar', () => {
  beforeEach(() => {
    authState = { user: null, isAuthenticated: false, loading: false };
    logoutMock.mockReset();
    loginMock.mockReset();
    signupMock.mockReset();
  });

  it('renders the search input and forwards change/focus/keydown events', async () => {
    const onSearchChange = vi.fn();
    const onFocus = vi.fn();
    const user = userEvent.setup();

    renderNavbar({ onSearchChange, onFocus });

    const input = screen.getByLabelText('Search ships by name or MMSI');
    await user.click(input);
    await user.type(input, 'a');

    expect(onFocus).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('shows the Clear button only when there is a search term and calls onClear', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderNavbar({ searchTerm: '', onClear });
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    rerender(
      <Navbar
        searchTerm="abc"
        onSearchChange={vi.fn()}
        onClear={onClear}
        onKeyDown={vi.fn()}
        onFocus={vi.fn()}
        showTypingSpinner={false}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  it('shows the typing spinner and optional label when searching', () => {
    renderNavbar({ showTypingSpinner: true, showSpinnerLabel: true });
    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('shows a loading indicator while auth state is resolving', () => {
    authState = { user: null, isAuthenticated: false, loading: true };
    renderNavbar();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('opens the LoginModal and can switch to the SignupModal', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

    await user.click(screen.getByText(/Sign up/));
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('opens the SignupModal directly and can switch back to Login', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /Sign Up/ }));
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();

    // Both the navbar and the modal's switch-link render a "Login" button; the modal's is last in the DOM.
    const loginButtons = screen.getAllByRole('button', { name: 'Login' });
    await user.click(loginButtons[loginButtons.length - 1]);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows the user menu when authenticated and opens the profile modal', async () => {
    authState = { user: mockUser, isAuthenticated: true, loading: false };
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /Menu/ }));
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('logs out and closes the dropdown when Logout is clicked', async () => {
    authState = { user: mockUser, isAuthenticated: true, loading: false };
    logoutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /Menu/ }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('closes the dropdown when clicking outside of it', async () => {
    authState = { user: mockUser, isAuthenticated: true, loading: false };
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /Menu/ }));
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
  });
});
