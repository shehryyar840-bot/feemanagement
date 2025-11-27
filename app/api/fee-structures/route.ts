// app/api/fee-structures/route.ts
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

    const feeStructures = await prisma.feeStructure.findMany({
      include: {
        class: true,
      },
      orderBy: { classId: 'asc' },
    });

    return successResponse(feeStructures);
  } catch (error) {
    console.error('Fetch fee structures error:', error);
    return errorResponse('An error occurred while fetching fee structures', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can create fee structures
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can create fee structures', 403);
    }

    const body = await request.json();
    const { classId, tuitionFee, labFee, libraryFee, sportsFee, examFee, otherFee } = body;

    if (!classId || tuitionFee === undefined) {
      return errorResponse('Class ID and tuition fee are required', 400);
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return errorResponse('Class not found', 404);
    }

    // Check if fee structure already exists for this class
    const existing = await prisma.feeStructure.findUnique({
      where: { classId },
    });

    if (existing) {
      return errorResponse('Fee structure already exists for this class', 409);
    }

    // Calculate total monthly fee
    const totalMonthlyFee =
      (tuitionFee || 0) +
      (labFee || 0) +
      (libraryFee || 0) +
      (sportsFee || 0) +
      (examFee || 0) +
      (otherFee || 0);

    const feeStructure = await prisma.feeStructure.create({
      data: {
        classId,
        tuitionFee: tuitionFee || 0,
        labFee: labFee || 0,
        libraryFee: libraryFee || 0,
        sportsFee: sportsFee || 0,
        examFee: examFee || 0,
        otherFee: otherFee || 0,
        totalMonthlyFee,
      },
      include: {
        class: true,
      },
    });

    return successResponse(feeStructure, 201);
  } catch (error) {
    console.error('Create fee structure error:', error);
    return errorResponse('An error occurred while creating fee structure', 500);
  }
}
