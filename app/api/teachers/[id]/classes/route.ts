// app/api/teachers/[id]/classes/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const teacherId = parseInt(params.id);

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return notFoundResponse('Teacher not found');
    }

    // Get all classes assigned to this teacher
    const classAssignments = await prisma.classTeacher.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    return successResponse(classAssignments);
  } catch (error) {
    console.error('Fetch teacher classes error:', error);
    return errorResponse('An error occurred while fetching teacher classes', 500);
  }
}
