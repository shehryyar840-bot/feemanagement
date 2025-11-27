// app/api/fee-records/[id]/status/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can update fee status
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update fee status', 403);
    }

    const { id } = await params;
    const feeRecordId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return errorResponse('Status is required', 400);
    }

    if (!['Paid', 'Pending', 'Overdue'].includes(status)) {
      return errorResponse('Invalid status value', 400);
    }

    // Check if fee record exists
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
    });

    if (!feeRecord) {
      return notFoundResponse('Fee record not found');
    }

    // Update fee record status
    const updatedFeeRecord = await prisma.feeRecord.update({
      where: { id: feeRecordId },
      data: {
        status,
        paymentDate: status === 'Paid' ? new Date() : null,
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    return successResponse(updatedFeeRecord);
  } catch (error) {
    console.error('Update fee status error:', error);
    return errorResponse('An error occurred while updating fee status', 500);
  }
}
