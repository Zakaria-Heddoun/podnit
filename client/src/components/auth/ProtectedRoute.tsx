'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'employee';
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/signin' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading, isAdmin, isSeller, isEmployee } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !hasRedirected) {
      if (!isAuthenticated) {
        // Store the current URL as the redirect target
        const currentPath = window.location.pathname;
        if (currentPath !== '/signin' && currentPath !== '/signup') {
          localStorage.setItem('redirect_url', currentPath);
        }
        
        // User is not authenticated, redirect to signin
        setHasRedirected(true);
        router.push(redirectTo);
        return;
      }

      if (requiredRole) {
        let hasRequiredRole = false;
        if (requiredRole === 'admin' && isAdmin) {
          hasRequiredRole = true;
        } else if (requiredRole === 'seller' && isSeller) {
          hasRequiredRole = true;
        } else if (requiredRole === 'employee' && isEmployee) {
          hasRequiredRole = true;
        }

        if (!hasRequiredRole) {
          // User doesn't have the required role
          setHasRedirected(true);
          if (isAdmin) {
            router.push('/admin');
          } else if (isSeller) {
            router.push('/seller');
          } else if (isEmployee) {
            router.push('/employee/dashboard');
          } else {
            router.push('/signin');
          }
          return;
        }
      }
    }
  }, [isAuthenticated, user, loading, requiredRole, router, redirectTo, hasRedirected, isAdmin, isSeller, isEmployee]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has required role
  let hasRequiredRole = true;
  if (requiredRole) {
    if (requiredRole === 'admin') {
      hasRequiredRole = isAdmin;
    } else if (requiredRole === 'seller') {
      hasRequiredRole = isSeller;
    } else if (requiredRole === 'employee') {
      hasRequiredRole = isEmployee;
    }
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-gray-600">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}