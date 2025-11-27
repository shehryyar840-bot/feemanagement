// app/api/attendance/bulk-mark/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only teachers can mark attendance
    if (auth.user.role !== 'TEACHER') {
      return errorResponse('Only teachers can mark attendance', 403);
    }

    if (!auth.user.teacherId) {
      return errorResponse('Teacher profile not found', 404);
    }

    const body = await request.json();
    const { date, attendanceRecords } = body;

    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return errorResponse('Date and attendance records array are required', 400);
    }

    const attendanceDate = new Date(date);
    const results = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
      const { studentId, status, remarks } = record;

      if (!studentId || !status) {
        continue;
      }

      if (status !== 'PRESENT' && status !== 'ABSENT') {
        continue;
      }

      try {
        const attendance = await prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId,
              date: attendanceDate,
            },
          },
          update: {
            status,
            remarks,
            markedBy: auth.user.teacherId!,
          },
          create: {
            studentId,
            date: attendanceDate,
            status,
            remarks,
            markedBy: auth.user.teacherId!,
          },
          include: {
            student: true,
          },
        });

        results.push(attendance);
      } catch (error) {
        console.error(`Error marking attendance for student ${studentId}:`, error);
      }
    }

    return successResponse({
      message: `Successfully marked attendance for ${results.length} students`,
      records: results,
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    return errorResponse('An error occurred while marking attendance', 500);
  }
}
