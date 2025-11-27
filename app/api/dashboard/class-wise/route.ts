// app/api/dashboard/class-wise/route.ts
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

    // Get all classes
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        students: {
          where: { isActive: true },
          include: {
            feeRecords: month && year
              ? {
                  where: {
                    month,
                    year: parseInt(year),
                  },
                }
              : true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const classWiseData = classes.map((classData) => {
      const students = classData.students;
      const totalStudents = students.length;

      let totalExpected = 0;
      let totalCollected = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      students.forEach((student) => {
        student.feeRecords.forEach((record) => {
          totalExpected += record.totalFee;
          totalCollected += record.amountPaid;

          if (record.status === 'Paid') paidCount++;
          else if (record.status === 'Pending') pendingCount++;
          else if (record.status === 'Overdue') overdueCount++;
        });
      });

      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      return {
        classId: classData.id,
        className: classData.name,
        totalStudents,
        totalExpected,
        totalCollected,
        pending: totalExpected - totalCollected,
        collectionRate: parseFloat(collectionRate.toFixed(2)),
        paymentBreakdown: {
          paid: paidCount,
          pending: pendingCount,
          overdue: overdueCount,
        },
      };
    });

    return successResponse({
      month,
      year,
      classWiseData,
    });
  } catch (error) {
    console.error('Fetch class-wise data error:', error);
    return errorResponse('An error occurred while fetching class-wise data', 500);
  }
}
