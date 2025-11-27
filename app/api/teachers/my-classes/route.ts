// app/api/teachers/my-classes/route.ts
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

    // Only teachers can access their classes
    if (auth.user.role !== 'TEACHER') {
      return errorResponse('Only teachers can access this endpoint', 403);
    }

    if (!auth.user.teacherId) {
      return errorResponse('Teacher profile not found', 404);
    }

    // Get all classes assigned to the authenticated teacher
    const classAssignments = await prisma.classTeacher.findMany({
      where: { teacherId: auth.user.teacherId },
      include: {
        class: {
          include: {
            students: {
              where: { isActive: true },
              orderBy: { rollNumber: 'asc' },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    return successResponse(classAssignments);
  } catch (error) {
    console.error('Fetch my classes error:', error);
    return errorResponse('An error occurred while fetching your classes', 500);
  }
}
