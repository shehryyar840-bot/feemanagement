// app/api/fee-structures/class/[classId]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const { classId } = await params;
    const classIdNum = parseInt(classId);

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { classId: classIdNum },
      include: {
        class: true,
      },
    });

    if (!feeStructure) {
      return notFoundResponse('Fee structure not found for this class');
    }

    return successResponse(feeStructure);
  } catch (error) {
    console.error('Fetch fee structure error:', error);
    return errorResponse('An error occurred while fetching fee structure', 500);
  }
}
