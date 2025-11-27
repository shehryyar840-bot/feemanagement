// app/api/classes/[id]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const classId = parseInt(params.id);

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: true,
        feeStructure: true,
        _count: {
          select: { students: true },
        },
      },
    });

    if (!classData) {
      return notFoundResponse('Class not found');
    }

    return successResponse(classData);
  } catch (error) {
    console.error('Fetch class error:', error);
    return errorResponse('An error occurred while fetching class', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can update classes
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update classes', 403);
    }

    const classId = parseInt(params.id);
    const body = await request.json();
    const { name, description, isActive } = body;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return notFoundResponse('Class not found');
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingClass.name) {
      const duplicateClass = await prisma.class.findUnique({
        where: { name },
      });

      if (duplicateClass) {
        return errorResponse('Class with this name already exists', 409);
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        name,
        description,
        isActive,
      },
    });

    return successResponse(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    return errorResponse('An error occurred while updating class', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can delete classes
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can delete classes', 403);
    }

    const classId = parseInt(params.id);

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!existingClass) {
      return notFoundResponse('Class not found');
    }

    // Check if class has students
    if (existingClass._count.students > 0) {
      return errorResponse('Cannot delete class with students. Please transfer students first.', 400);
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    return successResponse({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    return errorResponse('An error occurred while deleting class', 500);
  }
}
