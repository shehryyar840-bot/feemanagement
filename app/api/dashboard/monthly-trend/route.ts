// app/api/dashboard/monthly-trend/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Get all fee records for the year
    const feeRecords = await prisma.feeRecord.findMany({
      where: { year },
    });

    // Group by month
    const monthlyData = MONTHS.map((month) => {
      const monthRecords = feeRecords.filter((r) => r.month === month);

      const expected = monthRecords.reduce((sum, r) => sum + r.totalFee, 0);
      const collected = monthRecords.reduce((sum, r) => sum + r.amountPaid, 0);
      const pending = monthRecords
        .filter((r) => r.status === 'Pending')
        .reduce((sum, r) => sum + r.balance, 0);
      const overdue = monthRecords
        .filter((r) => r.status === 'Overdue')
        .reduce((sum, r) => sum + r.balance, 0);

      return {
        month,
        expected,
        collected,
        pending,
        overdue,
        collectionRate: expected > 0 ? parseFloat(((collected / expected) * 100).toFixed(2)) : 0,
      };
    });

    return successResponse({
      year,
      monthlyData,
    });
  } catch (error) {
    console.error('Fetch monthly trend error:', error);
    return errorResponse('An error occurred while fetching monthly trend', 500);
  }
}
