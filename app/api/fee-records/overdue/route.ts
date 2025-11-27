// app/api/fee-records/overdue/route.ts
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

    const overdueFeeRecords = await prisma.feeRecord.findMany({
      where: {
        status: 'Overdue',
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    return successResponse(overdueFeeRecords);
  } catch (error) {
    console.error('Fetch overdue fee records error:', error);
    return errorResponse('An error occurred while fetching overdue fee records', 500);
  }
}
