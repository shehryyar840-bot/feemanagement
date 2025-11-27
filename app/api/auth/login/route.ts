// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { teacher: true },
    });

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse('Account is inactive', 403);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and token
    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        teacher: user.teacher,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}
