// lib/middleware.ts - Authentication middleware for API routes
import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from './auth';
import prisma from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEACHER';
    teacherId?: number;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: AuthenticatedRequest['user'];
  error?: string;
}> {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { teacher: true },
  });

  if (!user || !user.isActive) {
    return { authenticated: false, error: 'User not found or inactive' };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teacherId: user.teacher?.id,
    },
  };
}

export function requireRole(userRole: 'ADMIN' | 'TEACHER', allowedRoles: ('ADMIN' | 'TEACHER')[]): boolean {
  return allowedRoles.includes(userRole);
}
