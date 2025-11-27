'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AttendanceMarkingView from '@/components/attendance/AttendanceMarkingView';
import AttendanceReportsView from '@/components/attendance/AttendanceReportsView';

export default function AttendancePage() {
  const { isAdmin } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
      {isAdmin ? <AttendanceReportsView /> : <AttendanceMarkingView />}
    </ProtectedRoute>
  );
}
