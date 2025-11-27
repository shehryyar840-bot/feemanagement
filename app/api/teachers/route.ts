// app/api/teachers/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        classTeachers: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(teachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    return errorResponse('An error occurred while fetching teachers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can create teachers
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can create teachers', 403);
    }

    const body = await request.json();
    const { email, password, name, employeeId, phoneNumber, address, qualification, joiningDate } = body;

    if (!email || !password || !name || !employeeId || !phoneNumber) {
      return errorResponse('Required fields are missing', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('Email already exists', 409);
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

    // Create user and teacher
    const teacher = await prisma.teacher.create({
      data: {
        employeeId,
        phoneNumber,
        address,
        qualification,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: 'TEACHER',
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return successResponse(teacher, 201);
  } catch (error) {
    console.error('Create teacher error:', error);
    return errorResponse('An error occurred while creating teacher', 500);
  }
}
