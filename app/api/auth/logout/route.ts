// app/api/auth/logout/route.ts
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  // In JWT-based auth, logout is handled client-side by removing the token
  // This endpoint exists for consistency with the API structure
  return successResponse({ message: 'Logged out successfully' });
}
