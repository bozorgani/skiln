import { screen } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { renderWithProviders, mockUser, mockAdminUser } from '../utils/test-utils';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header logo', () => {
    renderWithProviders(<Header />);
    expect(screen.getAllByText('Skiln').length).toBeGreaterThan(0);
  });

  it('renders theme toggle', () => {
    renderWithProviders(<Header />);
    expect(screen.getAllByRole('button', { name: /toggle theme/i }).length).toBeGreaterThan(0);
  });

  describe('when user is not authenticated', () => {
    it('renders login and register links', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });

      expect(screen.getAllByRole('link', { name: /ورود/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /ثبت نام/i }).length).toBeGreaterThan(0);
    });

    it('does not render user name', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });
      expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
    });
  });

  describe('when user is loading', () => {
    it('shows loading placeholder', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: true });
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('when regular user is authenticated', () => {
    it('renders user name and dashboard link', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /داشبورد/i }).length).toBeGreaterThan(0);
    });

    it('renders checkout and logout actions', () => {
      renderWithProviders(<Header />, { authUser: mockUser, authLoading: false });

      expect(screen.getAllByRole('link', { name: /سبد خرید/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /خروج/i }).length).toBeGreaterThan(0);
    });
  });

  describe('when user is admin', () => {
    it('renders admin user name and hides student dashboard link', () => {
      renderWithProviders(<Header />, { authUser: mockAdminUser, authLoading: false });

      expect(screen.getByText(mockAdminUser.name)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /داشبورد/i })).not.toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('logo link navigates to home', () => {
      renderWithProviders(<Header />);

      const logoLink = screen.getAllByRole('link', { name: /skiln/i })[0];
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('login and register links navigate correctly', () => {
      renderWithProviders(<Header />, { authUser: null, authLoading: false });

      expect(screen.getAllByRole('link', { name: /ورود/i })[0]).toHaveAttribute('href', '/login');
      expect(screen.getAllByRole('link', { name: /ثبت نام/i })[0]).toHaveAttribute('href', '/register');
    });
  });
});
