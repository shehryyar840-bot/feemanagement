// app/api/auth/change-password/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long', 400);
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('An error occurred while changing password', 500);
  }
}
