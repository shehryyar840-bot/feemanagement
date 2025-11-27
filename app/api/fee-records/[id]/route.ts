// app/api/fee-records/[id]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const feeRecordId = parseInt(params.id);

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!feeRecord) {
      return notFoundResponse('Fee record not found');
    }

    return successResponse(feeRecord);
  } catch (error) {
    console.error('Fetch fee record error:', error);
    return errorResponse('An error occurred while fetching fee record', 500);
  }
}
