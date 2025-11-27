// app/api/auth/logout/route.ts
import { successResponse } from '@/lib/api-response';

export async function POST() {
  // In JWT-based auth, logout is handled client-side by removing the token
  // This endpoint exists for consistency with the API structure
  return successResponse({ message: 'Logged out successfully' });
}
