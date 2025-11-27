// app/api/attendance/class/[classId]/date/[date]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { classId: string; date: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const classId = parseInt(params.classId);
    const date = new Date(params.date);

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        isActive: true,
      },
      include: {
        class: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Get attendance records for this class and date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        student: {
          classId,
        },
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        student: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create a map of student attendance
    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.studentId, record])
    );

    // Combine students with their attendance status
    const result = students.map((student) => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
    }));

    return successResponse(result);
  } catch (error) {
    console.error('Fetch class attendance error:', error);
    return errorResponse('An error occurred while fetching class attendance', 500);
  }
}
