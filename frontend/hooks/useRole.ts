'use client';

import { useAuth } from '@/lib/auth';

/**
 * Custom hook to check user role and permissions
 * @returns Object with role checking methods
 */
export function useRole() {
  const { user, loading } = useAuth();

  return {
    // Check if user is admin
    isAdmin: user?.role === 'admin',
    
    // Check if user is regular user
    isUser: user?.role === 'user',
    
    // Check if user is authenticated
    isAuthenticated: !!user,
    
    // Get user role
    role: user?.role,
    
    // Get full user object
    user,
    
    // Loading state
    loading,
  };
}

