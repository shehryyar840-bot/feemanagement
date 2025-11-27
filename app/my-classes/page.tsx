'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Users, Calendar, BookOpen } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { teachersApi } from '@/lib/api';
import type { ClassTeacher } from '@/lib/types';
import Link from 'next/link';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function MyClassesPage() {
  const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadMyClasses();
  }, []);

  const loadMyClasses = async () => {
    try {
      const data = await teachersApi.getMyClasses();
      setClassTeachers(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
      showToast('Failed to load your classes', 'error');
    }
  };

  const classes = classTeachers.map(ct => ct.class).filter((cls): cls is NonNullable<typeof cls> => Boolean(cls));

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Classes</h1>
          <p className="text-gray-600">View and manage your assigned classes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">
                  {classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Classes</p>
                <p className="text-3xl font-bold text-blue-600">
                  {classes.filter((c) => c.isActive).length}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-white p-3 rounded-lg">
                      <GraduationCap className="w-8 h-8 text-emerald-600" />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cls.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cls.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-4">{cls.name}</h3>
                  <p className="text-emerald-100">{cls.description || 'Class Description'}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">
                      <span className="font-semibold">{cls.students?.length || 0}</span> students
                      enrolled
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">
                      {cls.isActive ? 'Active Class' : 'Inactive Class'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
                    <Link
                      href={`/students?classId=${cls.id}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium text-center transition-colors"
                    >
                      View Students
                    </Link>
                    <Link
                      href="/attendance"
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
                    >
                      Mark Attendance
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-600">
              You have not been assigned to any classes yet. Please contact the administrator.
            </p>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-md ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-500 text-red-900'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 border-amber-500 text-amber-900'
                  : 'bg-blue-50 border-blue-500 text-blue-900'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
