import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { User } from '@/types/user';
import { CartProvider } from '@/contexts/CartContext';

// Mock user data
export const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

export const mockAdminUser: User = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authUser?: User | null;
  authLoading?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authUser = null,
    authLoading = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Configure the global auth mock
  if (global.__authMock && global.__authMock.useAuth) {
    global.__authMock.useAuth.mockReturnValue({
      user: authUser,
      loading: authLoading,
      checkAuth: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
