// app/api/attendance/class/[classId]/report/route.ts
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const classId = parseInt(params.classId);
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return notFoundResponse('Class not found');
    }

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        isActive: true,
      },
      include: {
        attendances: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Calculate summary for each student
    const report = students.map((student) => {
      const totalDays = student.attendances.length;
      const presentDays = student.attendances.filter((a) => a.status === 'PRESENT').length;
      const absentDays = student.attendances.filter((a) => a.status === 'ABSENT').length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        },
      };
    });

    return successResponse({
      class: classData,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      report,
    });
  } catch (error) {
    console.error('Fetch class attendance report error:', error);
    return errorResponse('An error occurred while fetching class attendance report', 500);
  }
}
