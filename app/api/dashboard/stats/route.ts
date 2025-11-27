// app/api/dashboard/stats/route.ts
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

    // Get total students
    const totalStudents = await prisma.student.count({
      where: { isActive: true },
    });

    // Get fee statistics
    const feeRecords = await prisma.feeRecord.findMany();

    const totalCollected = feeRecords.reduce((sum, record) => sum + record.amountPaid, 0);
    const totalExpected = feeRecords.reduce((sum, record) => sum + record.totalFee, 0);
    const pendingFees = feeRecords
      .filter((r) => r.status === 'Pending')
      .reduce((sum, record) => sum + record.balance, 0);
    const overdueFees = feeRecords
      .filter((r) => r.status === 'Overdue')
      .reduce((sum, record) => sum + record.balance, 0);

    // Payment status breakdown
    const paidCount = feeRecords.filter((r) => r.status === 'Paid').length;
    const pendingCount = feeRecords.filter((r) => r.status === 'Pending').length;
    const overdueCount = feeRecords.filter((r) => r.status === 'Overdue').length;

    // Collection rate
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // Recent overdue payments
    const recentOverdue = await prisma.feeRecord.findMany({
      where: { status: 'Overdue' },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    return successResponse({
      totalStudents,
      totalCollected,
      totalExpected,
      pendingFees,
      overdueFees,
      paymentStatusBreakdown: {
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
      },
      collectionRate: parseFloat(collectionRate.toFixed(2)),
      recentOverdue,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return errorResponse('An error occurred while fetching dashboard stats', 500);
  }
}
