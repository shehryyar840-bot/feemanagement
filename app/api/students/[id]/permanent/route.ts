// app/api/students/[id]/permanent/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can permanently delete students
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can permanently delete students', 403);
    }

    const { id } = await params;
    const studentId = parseInt(id);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return notFoundResponse('Student not found');
    }

    // Permanently delete (cascades to fee records and attendance due to schema)
    await prisma.student.delete({
      where: { id: studentId },
    });

    return successResponse({ message: 'Student permanently deleted successfully' });
  } catch (error) {
    console.error('Permanent delete student error:', error);
    return errorResponse('An error occurred while permanently deleting student', 500);
  }
}
