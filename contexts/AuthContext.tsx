'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User, LoginData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch {
      // Token invalid, clear it
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginData) => {
    try {
      const { user: userData, token } = await authApi.login(credentials);
      localStorage.setItem('token', token);
      setUser(userData);

      // Redirect based on role
      if (userData.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/attendance');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
