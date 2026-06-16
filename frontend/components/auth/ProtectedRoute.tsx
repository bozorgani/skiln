'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Component to protect routes based on authentication and role
 * @param children - Content to render if access is granted
 * @param requireAdmin - If true, only admin users can access
 * @param redirectTo - Redirect URL if access is denied (default: '/login' or '/')
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      router.replace(redirectTo || '/login');
      return;
    }

    // Require admin but user is not admin
    if (requireAdmin && user.role !== 'admin') {
      router.replace(redirectTo || '/');
      return;
    }
  }, [user, loading, requireAdmin, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Require admin but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  return <>{children}</>;
}

