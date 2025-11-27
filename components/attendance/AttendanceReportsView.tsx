'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { attendanceApi, classesApi } from '@/lib/api';
import type { Class, ClassAttendanceReport } from '@/lib/types';

type ViewMode = 'daily' | 'monthly' | 'classwise';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function AttendanceReportsView() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [classReport, setClassReport] = useState<ClassAttendanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      if (viewMode === 'daily') {
        loadDailyAttendance();
      } else if (viewMode === 'classwise' || viewMode === 'monthly') {
        loadClassReport();
      }
    }
  }, [selectedClassId, selectedDate, viewMode]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      showToast('Failed to load classes', 'error');
    }
  };

  const loadDailyAttendance = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      // API returns students array with nested attendances
      const studentsWithAttendance = await attendanceApi.getClassAttendance(selectedClassId, selectedDate);

      // Flatten the nested attendance records
      const attendanceRecords: any[] = [];
      studentsWithAttendance.forEach((student: any) => {
        if (student.attendances && student.attendances.length > 0) {
          student.attendances.forEach((record: any) => {
            // Add student info to the record for display
            attendanceRecords.push({
              ...record,
              student: {
                name: student.name,
                rollNumber: student.rollNumber
              }
            });
          });
        }
      });

      setDailyRecords(attendanceRecords);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setDailyRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassReport = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const report = await attendanceApi.getClassReport(selectedClassId);
      setClassReport(report);
    } catch (error) {
      console.error('Failed to load report:', error);
      setClassReport([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'PRESENT' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'PRESENT'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const dailyStats = {
    present: dailyRecords.filter((r) => r.status === 'PRESENT').length,
    absent: dailyRecords.filter((r) => r.status === 'ABSENT').length,
    total: dailyRecords.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
        <p className="text-gray-600">View attendance statistics and reports by class</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class *
            </label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode *</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="daily">Daily Report</option>
              <option value="monthly">Monthly Summary</option>
              <option value="classwise">Class-wise Summary</option>
            </select>
          </div>

          {viewMode === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Daily Report */}
      {viewMode === 'daily' && (
        <>
          {/* Stats */}
          {dailyRecords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{dailyStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-3xl font-bold text-green-600">{dailyStats.present}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dailyStats.total > 0
                        ? ((dailyStats.present / dailyStats.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-3xl font-bold text-red-600">{dailyStats.absent}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dailyStats.total > 0
                        ? ((dailyStats.absent / dailyStats.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Records Table */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : dailyRecords.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Daily Attendance - {new Date(selectedDate).toLocaleDateString()}
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Marked By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dailyRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{record.student?.name}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {record.student?.rollNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                record.status
                              )}`}
                            >
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.markedByTeacher?.user?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found for this date</p>
            </div>
          )}
        </>
      )}

      {/* Monthly/Class-wise Report */}
      {(viewMode === 'monthly' || viewMode === 'classwise') && (
        <>
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : classReport.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {viewMode === 'monthly' ? 'Monthly' : 'Class-wise'} Attendance Summary
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Total Days
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Present
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classReport.map((record) => (
                      <tr key={record.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{record.name}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{record.rollNumber}</td>
                        <td className="px-6 py-4 text-center text-gray-900">
                          {record.total}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                            {record.present}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                            {record.absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              record.percentage >= 75
                                ? 'bg-green-100 text-green-700'
                                : record.percentage >= 60
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {record.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance summary available</p>
            </div>
          )}
        </>
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
  );
}
