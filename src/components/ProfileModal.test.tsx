import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserRole } from '../types/auth';
import { ProfileModal } from './ProfileModal';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: UserRole.ADMIN,
  createdAt: '2024-03-15T00:00:00Z',
  updatedAt: '2024-03-16T00:00:00Z',
};

let authState: { user: typeof mockUser | null } = { user: mockUser };

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

describe('ProfileModal', () => {
  beforeEach(() => {
    authState = { user: mockUser };
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ProfileModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no authenticated user', () => {
    authState = { user: null };
    const { container } = render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays the user email, role, id, and creation date', () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('user-123')).toBeInTheDocument();
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<ProfileModal isOpen={true} onClose={onClose} />);

    screen.getByLabelText('Close').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the overlay is clicked but not the dialog content', () => {
    const onClose = vi.fn();
    const { container } = render(<ProfileModal isOpen={true} onClose={onClose} />);

    (container.firstChild as HTMLElement).click();
    expect(onClose).toHaveBeenCalled();
  });
});
