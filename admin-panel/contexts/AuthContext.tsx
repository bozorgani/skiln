'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, removeToken } from '@/lib/token-manager';
import { authAPI } from '@/lib/api';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check if token exists using js-cookie method
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      // Get token using centralized token manager
      const token = getToken();
      
      console.log('[checkAuth] Starting auth check...');
      console.log('[checkAuth] Token:', token ? 'exists (' + token.substring(0, 20) + '...)' : 'not found');
      
      if (!token) {
        console.log('[checkAuth] No token found, setting user to null');
        setUser(null);
        // Clear localStorage as well
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
        setLoading(false);
        return;
      }

      console.log('[checkAuth] Token found, calling getMe API...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 10000) // Increased timeout
      );
      
      const response = await Promise.race([
        authAPI.getMe(),
        timeoutPromise
      ]) as any;
      
      console.log('[checkAuth] getMe response status:', response?.status);
      console.log('[checkAuth] getMe response data:', response?.data);
      
      const userData = response.data?.data?.user || response.data?.user;
      
      if (!userData) {
        console.log('[checkAuth] No user data found in response');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('[checkAuth] User data received:', {
        id: userData.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role
      });
      
      // Check if user is admin
      if (userData.role !== 'admin') {
        console.log('[checkAuth] User is not admin, role =', userData.role);
        setUser(null);
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            window.location.href = '/login?error=unauthorized';
          }
        }
        setLoading(false);
        return;
      }
      
      console.log('[checkAuth] ✅ User authenticated as admin:', userData.email || userData.phoneNumber);
      setUser(userData);
      
      // Also save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[checkAuth] User saved to localStorage');
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('[checkAuth] Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // 401 is expected when user is not logged in - don't show error
      if (error.response?.status === 401 || error.message === 'Auth check timeout') {
        console.log('[checkAuth] 401 or timeout, setting user to null');
        setUser(null);
        // Only redirect if not on login page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
            // Don't redirect immediately, let the page handle it
            setLoading(false);
            return;
          }
        }
      } else {
        console.error('[checkAuth] Unexpected error:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // First, try to get user from localStorage (set after login)
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('[AuthContext] Found user in localStorage:', userData);
            // Verify token still exists
            const token = getToken();
            if (token) {
              setUser(userData);
              setLoading(false);
              // Still call checkAuth to verify in background
              checkAuth().catch(() => {
                // If checkAuth fails, keep the user from localStorage
                console.log('[AuthContext] checkAuth failed, keeping user from localStorage');
              });
              return;
            } else {
              // Token not found, clear localStorage
              console.log('[AuthContext] Token not found, clearing localStorage');
              localStorage.removeItem('user');
            }
          } catch (e) {
            console.error('[AuthContext] Error parsing saved user:', e);
            localStorage.removeItem('user');
          }
        }
      }
      
      // No saved user or token, do full checkAuth
      await checkAuth();
    };
    
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose setUser function for direct updates
  const updateUser = (newUser: User | null) => {
    console.log('[updateUser] Called with:', newUser);
    setUser(newUser);
    setLoading(false);
    
    // Also save to localStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
        console.log('[updateUser] User saved to localStorage');
      } else {
        localStorage.removeItem('user');
        console.log('[updateUser] User removed from localStorage');
      }
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear user and tokens
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, setUser: updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

