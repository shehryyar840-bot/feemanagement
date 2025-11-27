// app/api/dashboard/payment-modes/route.ts
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build where clause
    const where: any = {
      status: 'Paid',
      paymentMode: { not: null },
    };

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = parseInt(year);
    }

    // Get all paid fee records with payment modes
    const paidRecords = await prisma.feeRecord.findMany({
      where,
    });

    // Group by payment mode
    const paymentModes = ['Cash', 'Online', 'Cheque'];
    const paymentModeData = paymentModes.map((mode) => {
      const records = paidRecords.filter((r) => r.paymentMode === mode);
      const totalAmount = records.reduce((sum, r) => sum + r.amountPaid, 0);
      const count = records.length;

      return {
        mode,
        count,
        totalAmount,
      };
    });

    // Calculate totals
    const totalTransactions = paidRecords.length;
    const totalAmount = paidRecords.reduce((sum, r) => sum + r.amountPaid, 0);

    return successResponse({
      month,
      year,
      paymentModeData,
      summary: {
        totalTransactions,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Fetch payment modes data error:', error);
    return errorResponse('An error occurred while fetching payment modes data', 500);
  }
}
