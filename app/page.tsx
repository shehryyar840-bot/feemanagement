'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on role
        if (user.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/attendance');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  return null;
}
