// app/api/teachers/[id]/route.ts
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const teacherId = parseInt(id);

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        classTeachers: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      return notFoundResponse('Teacher not found');
    }

    return successResponse(teacher);
  } catch (error) {
    console.error('Fetch teacher error:', error);
    return errorResponse('An error occurred while fetching teacher', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can update teachers
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update teachers', 403);
    }

    const { id } = await params;
    const teacherId = parseInt(id);
    const body = await request.json();

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!existingTeacher) {
      return notFoundResponse('Teacher not found');
    }

    // If employee ID is being changed, check for duplicates
    if (body.employeeId && body.employeeId !== existingTeacher.employeeId) {
      const duplicateTeacher = await prisma.teacher.findUnique({
        where: { employeeId: body.employeeId },
      });

      if (duplicateTeacher) {
        return errorResponse('Employee ID already exists', 409);
      }
    }

    // Update teacher and user
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        employeeId: body.employeeId,
        phoneNumber: body.phoneNumber,
        address: body.address,
        qualification: body.qualification,
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined,
        user: {
          update: {
            name: body.name,
            email: body.email,
            isActive: body.isActive,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
        classTeachers: {
          include: {
            class: true,
          },
        },
      },
    });

    return successResponse(updatedTeacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    return errorResponse('An error occurred while updating teacher', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can delete teachers
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can delete teachers', 403);
    }

    const { id } = await params;
    const teacherId = parseInt(id);

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return notFoundResponse('Teacher not found');
    }

    // Soft delete by deactivating the user account
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false },
    });

    return successResponse({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return errorResponse('An error occurred while deleting teacher', 500);
  }
}
