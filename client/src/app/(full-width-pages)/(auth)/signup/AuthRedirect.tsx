'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSeller, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect authenticated users based on their role
      if (isAdmin) {
        router.replace('/admin');
      } else if (isSeller) {
        router.replace('/seller');
      }
    }
  }, [isAuthenticated, isAdmin, isSeller, loading, router]);

  // Show loading or nothing while checking auth status
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is authenticated, don't render the signup form (redirect is in progress)
  if (isAuthenticated) {
    return null;
  }

  // Render the signup form for non-authenticated users
  return <>{children}</>;
}