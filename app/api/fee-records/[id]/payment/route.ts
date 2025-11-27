// app/api/fee-records/[id]/payment/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can record payments
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can record payments', 403);
    }

    const { id } = await params;
    const feeRecordId = parseInt(id);
    const body = await request.json();
    const { amountPaid, paymentMode, remarks } = body;

    if (!amountPaid || !paymentMode) {
      return errorResponse('Amount paid and payment mode are required', 400);
    }

    // Check if fee record exists
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
    });

    if (!feeRecord) {
      return notFoundResponse('Fee record not found');
    }

    // Calculate new total paid and balance
    const newAmountPaid = feeRecord.amountPaid + parseFloat(amountPaid);
    const newBalance = feeRecord.totalFee - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'Paid' : feeRecord.status;

    // Update fee record
    const updatedFeeRecord = await prisma.feeRecord.update({
      where: { id: feeRecordId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paymentDate: newStatus === 'Paid' ? new Date() : feeRecord.paymentDate,
        paymentMode,
        remarks,
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
    console.error('Record payment error:', error);
    return errorResponse('An error occurred while recording payment', 500);
  }
}
