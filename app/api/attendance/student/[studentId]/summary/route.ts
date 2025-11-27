// app/api/attendance/student/[studentId]/summary/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const studentId = parseInt(params.studentId);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      return notFoundResponse('Student not found');
    }

    // Get all attendance records for this student
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    // Calculate summary
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentDays = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return successResponse({
      student,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      },
      recentRecords: attendanceRecords.slice(0, 30),
    });
  } catch (error) {
    console.error('Fetch student attendance summary error:', error);
    return errorResponse('An error occurred while fetching attendance summary', 500);
  }
}
