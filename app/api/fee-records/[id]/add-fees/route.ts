// app/api/fee-records/[id]/add-fees/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can add fees
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can add fees to records', 403);
    }

    const feeRecordId = parseInt(params.id);
    const body = await request.json();
    const { examFee, otherFee } = body;

    // Check if fee record exists
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
    });

    if (!feeRecord) {
      return notFoundResponse('Fee record not found');
    }

    // Calculate new totals
    const newExamFee = feeRecord.examFee + (examFee || 0);
    const newOtherFee = feeRecord.otherFee + (otherFee || 0);
    const newTotalFee =
      feeRecord.tuitionFee +
      feeRecord.labFee +
      feeRecord.libraryFee +
      feeRecord.sportsFee +
      newExamFee +
      newOtherFee;
    const newBalance = newTotalFee - feeRecord.amountPaid;

    // Update fee record
    const updatedFeeRecord = await prisma.feeRecord.update({
      where: { id: feeRecordId },
      data: {
        examFee: newExamFee,
        otherFee: newOtherFee,
        totalFee: newTotalFee,
        balance: newBalance,
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
    console.error('Add fees error:', error);
    return errorResponse('An error occurred while adding fees', 500);
  }
}
