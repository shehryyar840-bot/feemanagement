// app/api/fee-records/update-overdue/route.ts
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

    // Only admins can update overdue status
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update overdue status', 403);
    }

    const today = new Date();

    // Find all pending records with due date in the past
    const overdueRecords = await prisma.feeRecord.updateMany({
      where: {
        status: 'Pending',
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: 'Overdue',
      },
    });

    return successResponse({
      message: `Updated ${overdueRecords.count} records to overdue status`,
      count: overdueRecords.count,
    });
  } catch (error) {
    console.error('Update overdue error:', error);
    return errorResponse('An error occurred while updating overdue status', 500);
  }
}
