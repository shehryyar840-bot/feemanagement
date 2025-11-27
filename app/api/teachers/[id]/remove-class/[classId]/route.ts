// app/api/teachers/[id]/remove-class/[classId]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; classId: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can remove class assignments
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can remove class assignments', 403);
    }

    const { id, classId } = await params;
    const teacherId = parseInt(id);
    const classIdNum = parseInt(classId);

    // Check if assignment exists
    const assignment = await prisma.classTeacher.findUnique({
      where: {
        teacherId_classId: {
          teacherId,
          classId: classIdNum,
        },
      },
    });

    if (!assignment) {
      return notFoundResponse('Class assignment not found');
    }

    // Delete assignment
    await prisma.classTeacher.delete({
      where: {
        teacherId_classId: {
          teacherId,
          classId: classIdNum,
        },
      },
    });

    return successResponse({ message: 'Class assignment removed successfully' });
  } catch (error) {
    console.error('Remove class assignment error:', error);
    return errorResponse('An error occurred while removing class assignment', 500);
  }
}
