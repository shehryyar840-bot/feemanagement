// app/api/fee-records/pending/route.ts
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

    const pendingFeeRecords = await prisma.feeRecord.findMany({
      where: {
        status: 'Pending',
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

    return successResponse(pendingFeeRecords);
  } catch (error) {
    console.error('Fetch pending fee records error:', error);
    return errorResponse('An error occurred while fetching pending fee records', 500);
  }
}
