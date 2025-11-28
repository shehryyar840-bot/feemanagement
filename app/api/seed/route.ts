// Temporary API endpoint to seed database
// DELETE THIS FILE AFTER SEEDING!
import { NextRequest } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Security check - only allow in development or with secret key
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'initialize-database-2025') {
      return errorResponse('Unauthorized', 403);
    }

    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return errorResponse('Database already seeded', 400);
    }

    // Create admin user
    const hashedPassword = await hash('password123', 10);

    await prisma.user.create({
      data: {
        email: 'admin@school.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Create a sample class
    const class1 = await prisma.class.create({
      data: {
        name: 'Class 1',
        description: 'First Grade',
        isActive: true,
      },
    });

    // Create fee structure for the class
    await prisma.feeStructure.create({
      data: {
        classId: class1.id,
        tuitionFee: 5000,
        labFee: 500,
        libraryFee: 300,
        sportsFee: 200,
        examFee: 1000,
        otherFee: 0,
        totalMonthlyFee: 7000,
      },
    });

    // Create a teacher user
    const teacherUser = await prisma.user.create({
      data: {
        email: 'teacher1@school.com',
        password: hashedPassword,
        name: 'Teacher One',
        role: 'TEACHER',
        isActive: true,
      },
    });

    // Create teacher profile
    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        employeeId: 'T001',
        phoneNumber: '1234567890',
        address: '123 School Street',
        qualification: 'B.Ed',
      },
    });

    // Assign teacher to class
    await prisma.classTeacher.create({
      data: {
        teacherId: teacher.id,
        classId: class1.id,
        isPrimary: true,
      },
    });

    return successResponse({
      message: 'Database seeded successfully!',
      users: 2,
      classes: 1,
      credentials: {
        admin: {
          email: 'admin@school.com',
          password: 'password123',
        },
        teacher: {
          email: 'teacher1@school.com',
          password: 'password123',
        },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return errorResponse(
      'An error occurred while seeding database: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}
