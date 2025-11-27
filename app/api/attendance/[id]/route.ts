// app/api/attendance/[id]/route.ts
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

    // Only teachers and admins can delete attendance
    if (auth.user.role !== 'TEACHER' && auth.user.role !== 'ADMIN') {
      return errorResponse('Only teachers and admins can delete attendance records', 403);
    }

    const { id } = await params;
    const attendanceId = parseInt(id);

    // Check if attendance record exists
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      return notFoundResponse('Attendance record not found');
    }

    // If teacher, verify they marked this attendance
    if (auth.user.role === 'TEACHER' && auth.user.teacherId !== attendance.markedBy) {
      return errorResponse('You can only delete attendance records you marked', 403);
    }

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return successResponse({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return errorResponse('An error occurred while deleting attendance record', 500);
  }
}
