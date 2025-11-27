// app/api/fee-records/generate/route.ts
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

    // Only admins can generate fee records
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can generate fee records', 403);
    }

    const body = await request.json();
    const { month, year, classId, dueDate, additionalExamFee, additionalOtherFee } = body;

    if (!month || !year) {
      return errorResponse('Month and year are required', 400);
    }

    // Get students based on classId filter
    const where: any = { isActive: true };
    if (classId) {
      where.classId = classId;
    }

    const students = await prisma.student.findMany({
      where,
    });

    if (students.length === 0) {
      return errorResponse('No active students found', 404);
    }

    const createdRecords = [];
    const skippedRecords = [];

    // Generate fee records for each student
    for (const student of students) {
      // Check if record already exists
      const existing = await prisma.feeRecord.findUnique({
        where: {
          studentId_month_year: {
            studentId: student.id,
            month,
            year,
          },
        },
      });

      if (existing) {
        skippedRecords.push({
          studentId: student.id,
          studentName: student.name,
          reason: 'Record already exists',
        });
        continue;
      }

      // Calculate total fee including any additional fees
      const examFee = student.examFee + (additionalExamFee || 0);
      const otherFee = student.otherFee + (additionalOtherFee || 0);
      const totalFee =
        student.tuitionFee +
        student.labFee +
        student.libraryFee +
        student.sportsFee +
        examFee +
        otherFee;

      // Create fee record
      const feeRecord = await prisma.feeRecord.create({
        data: {
          studentId: student.id,
          month,
          year,
          tuitionFee: student.tuitionFee,
          labFee: student.labFee,
          libraryFee: student.libraryFee,
          sportsFee: student.sportsFee,
          examFee,
          otherFee,
          totalFee,
          balance: totalFee,
          dueDate: dueDate ? new Date(dueDate) : new Date(year, getMonthNumber(month), 10),
          status: 'Pending',
        },
        include: {
          student: {
            include: {
              class: true,
            },
          },
        },
      });

      createdRecords.push(feeRecord);
    }

    return successResponse({
      message: `Generated ${createdRecords.length} fee records successfully`,
      created: createdRecords.length,
      skipped: skippedRecords.length,
      records: createdRecords,
      skippedRecords,
    }, 201);
  } catch (error) {
    console.error('Generate fee records error:', error);
    return errorResponse('An error occurred while generating fee records', 500);
  }
}

// Helper function to get month number from month name
function getMonthNumber(monthName: string): number {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.indexOf(monthName);
}
