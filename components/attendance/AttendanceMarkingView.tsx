'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { attendanceApi, classesApi } from '@/lib/api';
import type { Class, Student, AttendanceStatus } from '@/lib/types';

interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function AttendanceMarkingView() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<number, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
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
      loadStudents();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadExistingAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedDate, students.length]);

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

  const loadStudents = async () => {
    if (!selectedClassId) return;
    try {
      const classData = await classesApi.getById(selectedClassId);
      setStudents(classData.students || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      showToast('Failed to load students', 'error');
    }
  };

  const loadExistingAttendance = async () => {
    if (!selectedClassId || students.length === 0) {
      setIsAlreadyMarked(false);
      return;
    }

    try {
      // API returns students array with nested attendances
      const response = await attendanceApi.getClassAttendance(selectedClassId, selectedDate) as unknown as Array<{
        student: Student;
        attendance: { status: AttendanceStatus; studentId: number } | null;
      }>;

      const attendanceMap = new Map<number, AttendanceStatus>();
      let recordCount = 0;

      response.forEach((item) => {
        if (item.attendance) {
          attendanceMap.set(item.attendance.studentId, item.attendance.status);
          recordCount++;
        }
      });

      setAttendance(attendanceMap);

      // Only mark as already marked if ALL students have attendance records
      const allStudentsMarked = students.length > 0 && recordCount === students.length;
      console.log('Attendance check:', {
        studentsCount: students.length,
        recordsCount: recordCount,
        isMarked: allStudentsMarked,
        date: selectedDate
      });
      setIsAlreadyMarked(allStudentsMarked);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance(new Map());
      setIsAlreadyMarked(false);
    }
  };

  const handleMarkAttendance = useCallback((studentId: number, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedClassId || attendance.size === 0) {
      showToast('Please mark attendance for at least one student', 'warning');
      return;
    }

    setLoading(true);
    try {
      const records: AttendanceRecord[] = Array.from(attendance.entries())
        .filter(([studentId, status]) => studentId != null && status != null)
        .map(([studentId, status]) => ({
          studentId,
          status,
        }));

      if (records.length === 0) {
        showToast('No valid attendance records to save', 'warning');
        setLoading(false);
        return;
      }

      await attendanceApi.bulkMark({
        classId: selectedClassId,
        date: selectedDate,
        records,
      });

      showToast('Attendance marked successfully!', 'success');
      // Reload attendance to show saved data
      loadExistingAttendance();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to mark attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap = new Map<number, AttendanceStatus>();
    students.forEach((student) => {
      newMap.set(student.id, status);
    });
    setAttendance(newMap);
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    return status === 'PRESENT' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusColor = (status: AttendanceStatus) => {
    return status === 'PRESENT'
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-red-100 text-red-700 border-red-300';
  };

  const statusButtons: { status: AttendanceStatus; label: string; color: string }[] = [
    { status: 'PRESENT', label: 'Present', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { status: 'ABSENT', label: 'Absent', color: 'bg-red-600 hover:bg-red-700' },
  ];

  const stats = {
    present: Array.from(attendance.values()).filter((s) => s === 'PRESENT').length,
    absent: Array.from(attendance.values()).filter((s) => s === 'ABSENT').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
        <p className="text-gray-600">Record student attendance for the selected class</p>
      </div>

      {/* Warning when attendance is already marked */}
      {isAlreadyMarked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-lg">Attendance Already Marked</p>
              <p className="text-sm text-amber-800 mt-1">
                Attendance for <span className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</span> has already been recorded for this class.
                All marking options have been disabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                console.log('Date changed to:', e.target.value);
                setSelectedDate(e.target.value);
                setIsAlreadyMarked(false); // Reset when date changes
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Mark All Buttons */}
        {students.length > 0 && !isAlreadyMarked && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Mark All:</p>
            <div className="flex flex-wrap gap-2">
              {statusButtons.map(({ status, label, color }) => (
                <button
                  key={status}
                  onClick={() => handleMarkAll(status)}
                  className={`px-4 py-2 ${color} text-white rounded-lg text-sm font-medium transition-colors`}
                >
                  Mark All {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {attendance.size > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Marked</p>
                <p className="text-2xl font-bold text-gray-900">{attendance.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      {selectedClassId && students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Students ({students.length})
                </h2>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || attendance.size === 0 || isAlreadyMarked}
                className={isAlreadyMarked ? 'opacity-60 cursor-not-allowed' : ''}
              >
                {loading ? 'Saving...' : isAlreadyMarked ? 'Attendance Already Marked' : 'Save Attendance'}
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {students.map((student) => {
              const currentStatus = attendance.get(student.id);
              return (
                <div
                  key={student.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    currentStatus ? getStatusColor(currentStatus) : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-3 rounded-full">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                      </div>
                      {currentStatus && (
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(currentStatus)}
                          <span className="text-sm font-medium">{currentStatus}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {statusButtons.map(({ status, label, color }) => (
                        <button
                          key={status}
                          onClick={() => handleMarkAttendance(student.id, status)}
                          disabled={isAlreadyMarked}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentStatus === status
                              ? color + ' text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          } ${isAlreadyMarked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isAlreadyMarked ? 'Attendance already marked for this date' : label}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedClassId && students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No students found in this class</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a class to mark attendance</p>
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
  );
}
