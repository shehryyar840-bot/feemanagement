// app/api/students/[id]/route.ts
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
    const studentId = parseInt(id);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        feeRecords: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!student) {
      return notFoundResponse('Student not found');
    }

    return successResponse(student);
  } catch (error) {
    console.error('Fetch student error:', error);
    return errorResponse('An error occurred while fetching student', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can update students
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can update students', 403);
    }

    const { id } = await params;
    const studentId = parseInt(id);
    const body = await request.json();

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return notFoundResponse('Student not found');
    }

    // If roll number is being changed, check for duplicates
    if (body.rollNumber && body.rollNumber !== existingStudent.rollNumber) {
      const duplicateStudent = await prisma.student.findUnique({
        where: { rollNumber: body.rollNumber },
      });

      if (duplicateStudent) {
        return errorResponse('Roll number already exists', 409);
      }
    }

    // If class is being changed, verify it exists
    if (body.classId && body.classId !== existingStudent.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: body.classId },
      });

      if (!classExists) {
        return errorResponse('Class not found', 404);
      }
    }

    // Calculate total monthly fee if any fee component is updated
    const totalMonthlyFee =
      (body.tuitionFee ?? existingStudent.tuitionFee) +
      (body.labFee ?? existingStudent.labFee) +
      (body.libraryFee ?? existingStudent.libraryFee) +
      (body.sportsFee ?? existingStudent.sportsFee) +
      (body.examFee ?? existingStudent.examFee) +
      (body.otherFee ?? existingStudent.otherFee);

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        admissionDate: body.admissionDate ? new Date(body.admissionDate) : undefined,
        totalMonthlyFee,
      },
      include: {
        class: true,
      },
    });

    return successResponse(updatedStudent);
  } catch (error) {
    console.error('Update student error:', error);
    return errorResponse('An error occurred while updating student', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can delete students
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can delete students', 403);
    }

    const { id } = await params;
    const studentId = parseInt(id);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return notFoundResponse('Student not found');
    }

    // Permanently delete student from database
    await prisma.student.delete({
      where: { id: studentId },
    });

    return successResponse({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse('An error occurred while deleting student', 500);
  }
}
