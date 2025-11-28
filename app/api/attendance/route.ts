// app/api/attendance/route.ts
import { NextRequest } from 'next/server';
import { Prisma, AttendanceStatus } from '@prisma/client';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    const where: Prisma.AttendanceWhereInput = {};

    if (classId) {
      where.student = {
        classId: parseInt(classId),
      };
    }

    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    // Build date filter
    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo);
      }
      where.date = dateFilter;
    }

    if (status) {
      where.status = status as AttendanceStatus;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
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
      orderBy: { date: 'desc' },
    });

    return successResponse(attendance);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return errorResponse('An error occurred while fetching attendance', 500);
  }
}
