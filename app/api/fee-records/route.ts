// app/api/fee-records/route.ts
import { NextRequest } from 'next/server';
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
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const classId = searchParams.get('classId');

    const where: any = {};

    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    if (classId) {
      where.student = {
        classId: parseInt(classId),
      };
    }

    const feeRecords = await prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { studentId: 'asc' }],
    });

    return successResponse(feeRecords);
  } catch (error) {
    console.error('Fetch fee records error:', error);
    return errorResponse('An error occurred while fetching fee records', 500);
  }
}
