// app/api/attendance/mark/route.ts
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
    const { studentId, date, status, remarks } = body;

    if (!studentId || !date || !status) {
      return errorResponse('Student ID, date, and status are required', 400);
    }

    if (status !== 'PRESENT' && status !== 'ABSENT') {
      return errorResponse('Status must be PRESENT or ABSENT', 400);
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    const attendanceDate = new Date(date);

    // Upsert attendance record
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
        markedBy: auth.user.teacherId,
      },
      create: {
        studentId,
        date: attendanceDate,
        status,
        remarks,
        markedBy: auth.user.teacherId,
      },
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
              },
            },
          },
        },
      },
    });

    return successResponse(attendance, 201);
  } catch (error) {
    console.error('Mark attendance error:', error);
    return errorResponse('An error occurred while marking attendance', 500);
  }
}
