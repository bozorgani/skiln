import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PurchaseButton from '@/components/course/PurchaseButton';
import { renderWithProviders, mockUser } from '../utils/test-utils';
import { paymentsAPI, enrollmentsAPI } from '@/lib/api';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    refresh: mockRefresh,
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  paymentsAPI: {
    createIntent: jest.fn(),
    verify: jest.fn(),
  },
  enrollmentsAPI: {
    enroll: jest.fn(),
  },
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="loader" className={className}>Loader</span>
  ),
}));

describe('PurchaseButton Component', () => {
  const mockCourse = {
    _id: 'course1',
    title: 'Test Course',
    price: 99,
  };

  const mockFreeCourse = {
    _id: 'course2',
    title: 'Free Course',
    price: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('renders login to enroll button', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: null, authLoading: false }
      );

      const loginLink = screen.getByRole('link', { name: /login to enroll/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('does not show purchase button', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: null, authLoading: false }
      );

      expect(screen.queryByText(/enroll for/i)).not.toBeInTheDocument();
    });
  });

  describe('when user is enrolled', () => {
    it('renders continue learning button', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={true}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const continueLink = screen.getByRole('link', { name: /continue learning/i });
      expect(continueLink).toBeInTheDocument();
      expect(continueLink).toHaveAttribute('href', '/courses/course1/lessons');
    });

    it('does not show purchase button when enrolled', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={true}
        />,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.queryByText(/enroll for/i)).not.toBeInTheDocument();
    });
  });

  describe('free course enrollment', () => {
    it('enrolls directly for free course', async () => {
      const user = userEvent.setup();
      (enrollmentsAPI.enroll as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      renderWithProviders(
        <PurchaseButton
          courseId="course2"
          course={mockFreeCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const enrollButton = screen.getByRole('button', { name: /enroll for \$0/i });
      await user.click(enrollButton);

      await waitFor(() => {
        expect(enrollmentsAPI.enroll).toHaveBeenCalledWith('course2');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Enrolled successfully!',
      });

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('shows loading state during enrollment', async () => {
      const user = userEvent.setup();
      (enrollmentsAPI.enroll as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(
        <PurchaseButton
          courseId="course2"
          course={mockFreeCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const enrollButton = screen.getByRole('button', { name: /enroll for \$0/i });
      await user.click(enrollButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('paid course enrollment', () => {
    it('creates payment intent for paid course', async () => {
      const user = userEvent.setup();
      (paymentsAPI.createIntent as jest.Mock).mockResolvedValue({
        data: {
          data: {
            paymentRequired: true,
            paymentId: 'payment1',
            mockMode: true,
          },
        },
      });
      (paymentsAPI.verify as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const purchaseButton = screen.getByRole('button', { name: /enroll for \$99/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(paymentsAPI.createIntent).toHaveBeenCalledWith('course1');
      });

      await waitFor(() => {
        expect(paymentsAPI.verify).toHaveBeenCalledWith('payment1');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Payment completed and enrolled!',
      });
    });

    it('handles free enrollment from payment intent', async () => {
      const user = userEvent.setup();
      (paymentsAPI.createIntent as jest.Mock).mockResolvedValue({
        data: {
          data: {
            paymentRequired: false,
          },
        },
      });

      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const purchaseButton = screen.getByRole('button', { name: /enroll for \$99/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Enrolled successfully!',
        });
      });

      expect(paymentsAPI.verify).not.toHaveBeenCalled();
    });

    it('handles payment errors', async () => {
      const user = userEvent.setup();
      (paymentsAPI.createIntent as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'Payment failed',
          },
        },
      });

      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const purchaseButton = screen.getByRole('button', { name: /enroll for \$99/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Payment failed',
          variant: 'destructive',
        });
      });
    });

    it('handles generic errors', async () => {
      const user = userEvent.setup();
      (paymentsAPI.createIntent as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const purchaseButton = screen.getByRole('button', { name: /enroll for \$99/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Purchase failed',
          variant: 'destructive',
        });
      });
    });

    it('disables button during processing', async () => {
      const user = userEvent.setup();
      (paymentsAPI.createIntent as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      const purchaseButton = screen.getByRole('button', { name: /enroll for \$99/i });
      await user.click(purchaseButton);

      expect(purchaseButton).toBeDisabled();
    });
  });

  describe('button display', () => {
    it('displays correct price for paid course', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course1"
          course={mockCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Enroll for $99')).toBeInTheDocument();
    });

    it('displays correct price for free course', () => {
      renderWithProviders(
        <PurchaseButton
          courseId="course2"
          course={mockFreeCourse}
          isEnrolled={false}
        />,
        { authUser: mockUser, authLoading: false }
      );

      expect(screen.getByText('Enroll for $0')).toBeInTheDocument();
    });
  });
});














