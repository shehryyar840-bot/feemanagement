// app/api/classes/route.ts
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

    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(classes);
  } catch (error) {
    console.error('Fetch classes error:', error);
    return errorResponse('An error occurred while fetching classes', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return unauthorizedResponse(auth.error);
    }

    // Only admins can create classes
    if (auth.user.role !== 'ADMIN') {
      return errorResponse('Only admins can create classes', 403);
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return errorResponse('Class name is required', 400);
    }

    // Check if class already exists
    const existingClass = await prisma.class.findUnique({
      where: { name },
    });

    if (existingClass) {
      return errorResponse('Class with this name already exists', 409);
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
      },
    });

    return successResponse(newClass, 201);
  } catch (error) {
    console.error('Create class error:', error);
    return errorResponse('An error occurred while creating class', 500);
  }
}
