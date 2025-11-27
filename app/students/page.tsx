'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, User, Phone, Calendar } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { studentsApi, classesApi } from '@/lib/api';
import { Student, Class } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    dateOfBirth: '',
    classId: 0,
    rollNumber: '',
    phoneNumber: '',
    address: '',
    admissionDate: new Date().toISOString().split('T')[0],
    tuitionFee: 0,
    labFee: 0,
    libraryFee: 0,
    sportsFee: 0,
  });

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        studentsApi.getAll(),
        classesApi.getAll(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data', 'error');
    }
  };

  const handleCreate = useCallback(() => {
    setSelectedStudent(null);
    setFormData({
      name: '',
      fatherName: '',
      dateOfBirth: '',
      classId: classes[0]?.id || 0,
      rollNumber: '',
      phoneNumber: '',
      address: '',
      admissionDate: new Date().toISOString().split('T')[0],
      tuitionFee: 0,
      labFee: 0,
      libraryFee: 0,
      sportsFee: 0,
    });
    setShowModal(true);
  }, [classes]);

  const handleEdit = useCallback((student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      fatherName: student.fatherName,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      classId: student.classId,
      rollNumber: student.rollNumber,
      phoneNumber: student.phoneNumber,
      address: student.address || '',
      admissionDate: new Date(student.admissionDate).toISOString().split('T')[0],
      tuitionFee: student.tuitionFee || 0,
      labFee: student.labFee || 0,
      libraryFee: student.libraryFee || 0,
      sportsFee: student.sportsFee || 0,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStudent) {
        await studentsApi.update(selectedStudent.id, formData);
      } else {
        await studentsApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to save student', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, formData]);

  const handleDelete = useCallback(async (student: Student) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${student.name}"? This action cannot be undone and will also delete all associated fee records.`
      )
    ) {
      return;
    }
    try {
      await studentsApi.delete(student.id);
      showToast('Student deleted successfully', 'success');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to delete student', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize total monthly fee calculation (recurring fees only)
  const totalMonthlyFee = useMemo(() => {
    return formData.tuitionFee +
      formData.labFee +
      formData.libraryFee +
      formData.sportsFee;
  }, [formData.tuitionFee, formData.labFee, formData.libraryFee, formData.sportsFee]);

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-full">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{student.name}</p>
            <p className="text-sm text-gray-500">{student.rollNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'fatherName',
      label: "Father&apos;s Name",
      render: (student: Student) => (
        <span className="text-gray-900">{student.fatherName}</span>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (student: Student) => (
        <span className="font-medium text-gray-900">
          {student.class?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (student: Student) => (
        <div className="flex items-center gap-2 text-gray-900">
          <Phone className="w-4 h-4 text-gray-400" />
          {student.phoneNumber}
        </div>
      ),
    },
    {
      key: 'admissionDate',
      label: 'Admission Date',
      render: (student: Student) => (
        <div className="flex items-center gap-2 text-gray-900">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(student.admissionDate)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (student: Student) => (
        <Badge status={student.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (student: Student) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(student)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(student)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Student"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Students</h1>
          <p className="text-gray-600">
            Manage student enrollment and information
          </p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Add Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Students</p>
              <p className="text-3xl font-bold text-green-600">
                {students.filter((s) => s.isActive).length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-purple-600">{classes.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <DataTable
        data={students}
        columns={columns}
        searchPlaceholder="Search students by name, roll number, or phone..."
        emptyMessage="No students found. Add your first student!"
      />

      {/* Student Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter student name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father&apos;s Name *
              </label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) =>
                  setFormData({ ...formData, fatherName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter father's name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                required
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) =>
                  setFormData({ ...formData, rollNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="03001234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission Date *
              </label>
              <input
                type="date"
                required
                value={formData.admissionDate}
                onChange={(e) =>
                  setFormData({ ...formData, admissionDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter student address (optional)"
              />
            </div>

            {/* Fee Structure Section */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-2 border-t pt-4">
                Monthly Recurring Fee Structure
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                These fees will be charged every month. One-time fees (exam, books, etc.) can be added when generating monthly fee records.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuition Fee *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.tuitionFee}
                onChange={(e) =>
                  setFormData({ ...formData, tuitionFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Fee
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.labFee}
                onChange={(e) =>
                  setFormData({ ...formData, labFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Library Fee
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.libraryFee}
                onChange={(e) =>
                  setFormData({ ...formData, libraryFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports Fee
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sportsFee}
                onChange={(e) =>
                  setFormData({ ...formData, sportsFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Total Monthly Fee Display */}
            <div className="col-span-2">
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-emerald-500">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total Recurring Monthly Fee:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    Rs. {totalMonthlyFee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!selectedStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After adding a student, you need to manually generate monthly fee records from the Fee Records page. You can add one-time fees (exam, books, paper fund) when generating each month&apos;s fee.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedStudent ? 'Update Student' : 'Add Student'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

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
