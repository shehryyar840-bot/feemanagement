// app/api/teachers/[id]/assign-class/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can assign classes
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can assign classes to teachers', 403);
    }

    const teacherId = parseInt(params.id);
    const body = await request.json();
    const { classId, subject, isPrimary } = body;

    if (!classId) {
      return errorResponse('Class ID is required', 400);
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return notFoundResponse('Teacher not found');
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return notFoundResponse('Class not found');
    }

    // Check if already assigned
    const existingAssignment = await prisma.classTeacher.findUnique({
      where: {
        teacherId_classId: {
          teacherId,
          classId,
        },
      },
    });

    if (existingAssignment) {
      return errorResponse('Teacher is already assigned to this class', 409);
    }

    // Create assignment
    const assignment = await prisma.classTeacher.create({
      data: {
        teacherId,
        classId,
        subject,
        isPrimary: isPrimary || false,
      },
      include: {
        class: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return successResponse(assignment, 201);
  } catch (error) {
    console.error('Assign class error:', error);
    return errorResponse('An error occurred while assigning class', 500);
  }
}
