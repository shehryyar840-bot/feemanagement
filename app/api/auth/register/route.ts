// app/api/auth/register/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, employeeId, phoneNumber, address, qualification } = body;

    if (!email || !password || !name || !employeeId || !phoneNumber) {
      return errorResponse('Required fields are missing', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Check if employee ID already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId },
    });

    if (existingTeacher) {
      return errorResponse('Employee ID already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and teacher profile in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeId,
            phoneNumber,
            address,
            qualification,
          },
        },
      },
      include: {
        teacher: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          teacher: user.teacher,
        },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('An error occurred during registration', 500);
  }
}
