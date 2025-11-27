'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User doesn't have permission, redirect to their default page
        if (user.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/attendance');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  // Show nothing while checking auth
  if (isLoading || !user) {
    return null;
  }

  // Check role permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
