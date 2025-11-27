// app/api/fee-structures/[id]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can update fee structures
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update fee structures', 403);
    }

    const feeStructureId = parseInt(params.id);
    const body = await request.json();

    // Check if fee structure exists
    const existing = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!existing) {
      return notFoundResponse('Fee structure not found');
    }

    // Calculate total monthly fee
    const totalMonthlyFee =
      (body.tuitionFee ?? existing.tuitionFee) +
      (body.labFee ?? existing.labFee) +
      (body.libraryFee ?? existing.libraryFee) +
      (body.sportsFee ?? existing.sportsFee) +
      (body.examFee ?? existing.examFee) +
      (body.otherFee ?? existing.otherFee);

    const updatedFeeStructure = await prisma.feeStructure.update({
      where: { id: feeStructureId },
      data: {
        tuitionFee: body.tuitionFee,
        labFee: body.labFee,
        libraryFee: body.libraryFee,
        sportsFee: body.sportsFee,
        examFee: body.examFee,
        otherFee: body.otherFee,
        totalMonthlyFee,
      },
      include: {
        class: true,
      },
    });

    return successResponse(updatedFeeStructure);
  } catch (error) {
    console.error('Update fee structure error:', error);
    return errorResponse('An error occurred while updating fee structure', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can delete fee structures
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can delete fee structures', 403);
    }

    const feeStructureId = parseInt(params.id);

    // Check if fee structure exists
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      return notFoundResponse('Fee structure not found');
    }

    await prisma.feeStructure.delete({
      where: { id: feeStructureId },
    });

    return successResponse({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Delete fee structure error:', error);
    return errorResponse('An error occurred while deleting fee structure', 500);
  }
}
