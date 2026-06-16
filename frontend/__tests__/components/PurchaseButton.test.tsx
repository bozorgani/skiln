import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PurchaseButton from '@/components/course/PurchaseButton';
import { renderWithProviders, mockUser, mockAdminUser } from '../utils/test-utils';
import { paymentsAPI } from '@/lib/api';

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
}));

jest.mock('@/lib/api', () => ({
  paymentsAPI: {
    adminPurchase: jest.fn(),
  },
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('PurchaseButton Component', () => {
  const mockCourse = {
    _id: 'course1',
    title: 'Test Course',
    price: 99000,
    thumbnail: '/test.jpg',
    description: 'Test description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders add-to-cart and checkout buttons for guests', () => {
    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={false} />,
      { authUser: null, authLoading: false }
    );

    expect(screen.getByRole('button', { name: /افزودن به سبد خرید/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /مشاهده سبد خرید/i })).toBeInTheDocument();
  });

  it('redirects guest to login when checkout is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={false} />,
      { authUser: null, authLoading: false }
    );

    await user.click(screen.getByRole('button', { name: /مشاهده سبد خرید/i }));
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/checkout');
  });

  it('adds course to cart for authenticated users', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={false} />,
      { authUser: mockUser, authLoading: false }
    );

    await user.click(screen.getByRole('button', { name: /افزودن به سبد خرید/i }));

    expect(await screen.findByRole('button', { name: /در سبد خرید/i })).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'افزوده شد',
      variant: 'success',
    }));
  });

  it('removes course from cart when already in cart', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={false} />,
      { authUser: mockUser, authLoading: false }
    );

    await user.click(screen.getByRole('button', { name: /افزودن به سبد خرید/i }));
    await user.click(await screen.findByRole('button', { name: /در سبد خرید/i }));

    expect(await screen.findByRole('button', { name: /افزودن به سبد خرید/i })).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'حذف شد',
      variant: 'success',
    }));
  });

  it('renders continue learning link when user is enrolled', () => {
    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={true} />,
      { authUser: mockUser, authLoading: false }
    );

    const continueLink = screen.getByRole('link', { name: /ادامه یادگیری/i });
    expect(continueLink).toBeInTheDocument();
    expect(continueLink).toHaveAttribute('href', '/courses/course1/lessons');
  });

  it('allows admin purchase', async () => {
    const user = userEvent.setup();
    (paymentsAPI.adminPurchase as jest.Mock).mockResolvedValue({ data: { success: true } });

    renderWithProviders(
      <PurchaseButton courseId="course1" course={mockCourse} isEnrolled={false} />,
      { authUser: mockAdminUser, authLoading: false }
    );

    await user.click(screen.getByRole('button', { name: /پرداخت مدیر/i }));

    await waitFor(() => {
      expect(paymentsAPI.adminPurchase).toHaveBeenCalledWith('course1');
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'موفق',
      variant: 'success',
    }));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
