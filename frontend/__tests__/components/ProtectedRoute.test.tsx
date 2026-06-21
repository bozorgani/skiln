import { screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { renderWithProviders, mockUser, mockAdminUser } from '../utils/test-utils';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    refresh: jest.fn(),
  }),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is loading', () => {
    it('shows loading state', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: true }
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not redirect while loading', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: true }
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    it('redirects to login page', async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: false }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not render protected content', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: false }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to custom redirect path', async () => {
      renderWithProviders(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: false }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login');
      });
    });
  });

  describe('when user is authenticated', () => {
    it('renders protected content for regular users', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('renders protected content for admin users', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { authUser: mockAdminUser, authLoading: false }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('when requireAdmin is true', () => {
    it('allows access for admin users', () => {
      renderWithProviders(
        <ProtectedRoute requireAdmin>
          <div>Admin Only Content</div>
        </ProtectedRoute>,
        { authUser: mockAdminUser, authLoading: false }
      );

      expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('denies access for regular users', async () => {
      renderWithProviders(
        <ProtectedRoute requireAdmin>
          <div>Admin Only Content</div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });

    it('redirects regular users to custom redirect path', async () => {
      renderWithProviders(
        <ProtectedRoute requireAdmin redirectTo="/dashboard">
          <div>Admin Only Content</div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows access denied message for regular users', () => {
      renderWithProviders(
        <ProtectedRoute requireAdmin>
          <div>Admin Only Content</div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });

    it('denies access when user is not authenticated and requireAdmin is true', async () => {
      renderWithProviders(
        <ProtectedRoute requireAdmin>
          <div>Admin Only Content</div>
        </ProtectedRoute>,
        { authUser: null, authLoading: false }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });
  });

  describe('complex scenarios', () => {
    it('handles multiple children', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('handles nested components', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>
            <h1>Title</h1>
            <p>Description</p>
          </div>
        </ProtectedRoute>,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});


