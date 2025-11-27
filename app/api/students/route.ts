// app/api/students/route.ts
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
    const classId = searchParams.get('classId');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (classId) {
      where.classId = parseInt(classId);
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }],
    });

    return successResponse(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    return errorResponse('An error occurred while fetching students', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can create students
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can create students', 403);
    }

    const body = await request.json();
    const {
      name,
      fatherName,
      dateOfBirth,
      classId,
      rollNumber,
      phoneNumber,
      address,
      tuitionFee,
      labFee,
      libraryFee,
      sportsFee,
      examFee,
      otherFee,
      admissionDate,
    } = body;

    if (!name || !fatherName || !classId || !rollNumber || !phoneNumber) {
      return errorResponse('Required fields are missing', 400);
    }

    // Check if roll number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber },
    });

    if (existingStudent) {
      return errorResponse('Roll number already exists', 409);
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return errorResponse('Class not found', 404);
    }

    // Calculate total monthly fee
    const totalMonthlyFee =
      (tuitionFee || 0) +
      (labFee || 0) +
      (libraryFee || 0) +
      (sportsFee || 0) +
      (examFee || 0) +
      (otherFee || 0);

    const student = await prisma.student.create({
      data: {
        name,
        fatherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        classId,
        rollNumber,
        phoneNumber,
        address,
        tuitionFee: tuitionFee || 0,
        labFee: labFee || 0,
        libraryFee: libraryFee || 0,
        sportsFee: sportsFee || 0,
        examFee: examFee || 0,
        otherFee: otherFee || 0,
        totalMonthlyFee,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      },
      include: {
        class: true,
      },
    });

    return successResponse(student, 201);
  } catch (error) {
    console.error('Create student error:', error);
    return errorResponse('An error occurred while creating student', 500);
  }
}
