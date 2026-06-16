// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Create mock function that can be accessed
const authMock = {
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    checkAuth: jest.fn(),
    logout: jest.fn(),
  })),
}

// Make it available globally for test utilities
global.__authMock = authMock

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
  }),
  ThemeProvider: ({ children }) => children,
}))

// Mock useAuth
jest.mock('@/lib/auth', () => {
  // This will be evaluated when the mock is created
  // We need to return a function that accesses the global mock
  return {
    useAuth: () => {
      if (global.__authMock && global.__authMock.useAuth) {
        return global.__authMock.useAuth()
      }
      return {
        user: null,
        loading: false,
        checkAuth: jest.fn(),
        logout: jest.fn(),
      }
    },
  }
})

jest.mock('@/contexts/AuthContext', () => {
  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => {
      if (global.__authMock && global.__authMock.useAuth) {
        return global.__authMock.useAuth()
      }
      return {
        user: null,
        loading: false,
        checkAuth: jest.fn(),
        logout: jest.fn(),
      }
    },
  }
})
