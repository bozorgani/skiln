import { screen } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { renderWithProviders, mockUser, mockAdminUser } from '../utils/test-utils';

// Mock next/navigation - already mocked in jest.setup.js, but we override for specific tests
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    refresh: mockRefresh,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: ({ className }: { className?: string }) => <span data-testid="book-icon" className={className}>BookOpen</span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>User</span>,
  LogOut: ({ className }: { className?: string }) => <span data-testid="logout-icon" className={className}>LogOut</span>,
  Settings: ({ className }: { className?: string }) => <span data-testid="settings-icon" className={className}>Settings</span>,
  LayoutDashboard: ({ className }: { className?: string }) => <span data-testid="dashboard-icon" className={className}>LayoutDashboard</span>,
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with logo and LMS text', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('LMS')).toBeInTheDocument();
    expect(screen.getByTestId('book-icon')).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    renderWithProviders(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  describe('when user is not authenticated', () => {
    it('renders login and sign up buttons', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });
      
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('does not render user name or dashboard link', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });
      
      expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });
  });

  describe('when user is loading', () => {
    it('shows loading state', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: true });
      
      // The loading state shows a pulse animation div
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    it('renders user name', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });
      
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    it('renders dashboard link', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders logout button', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });

    it('does not render admin link for regular users', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });
      
      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });
  });

  describe('when user is admin', () => {
    it('renders admin link', () => {
      renderWithProviders(<Header />, { authUser: mockAdminUser, authLoading: false });
      
      const adminLink = screen.getByRole('link', { name: /admin/i });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute('href', '/admin');
    });

    it('renders all navigation items', () => {
      renderWithProviders(<Header />, { authUser: mockAdminUser, authLoading: false });
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByText(mockAdminUser.name)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe('logout functionality', () => {
    it('logout button is present and clickable', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('logo link navigates to home', () => {
      renderWithProviders(<Header />);
      
      const logoLink = screen.getByRole('link', { name: /lms/i }).closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('login link navigates to login page', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });
      
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('sign up link navigates to register page', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });
      
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });
});

