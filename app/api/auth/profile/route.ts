// app/api/auth/profile/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Fetch complete user profile
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { teacher: true },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      teacher: user.teacher,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return errorResponse('An error occurred while fetching profile', 500);
  }
}
