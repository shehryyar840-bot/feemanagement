'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, UserCheck, Mail, Phone, Award, BookOpen, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { teachersApi, classesApi } from '@/lib/api';
import type { Teacher, Class } from '@/lib/types';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    employeeId: '',
    phoneNumber: '',
    address: '',
    qualification: '',
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
      const [teachersData, classesData] = await Promise.all([
        teachersApi.getAll(),
        classesApi.getAll(),
      ]);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data', 'error');
    }
  };

  const handleCreate = useCallback(() => {
    setSelectedTeacher(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      employeeId: '',
      phoneNumber: '',
      address: '',
      qualification: '',
    });
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      email: teacher.user?.email || '',
      password: '',
      name: teacher.user?.name || '',
      employeeId: teacher.employeeId,
      phoneNumber: teacher.phoneNumber,
      address: teacher.address || '',
      qualification: teacher.qualification || '',
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTeacher) {
        await teachersApi.update(selectedTeacher.id, {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          qualification: formData.qualification,
        });
      } else {
        await teachersApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to save teacher', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacher, formData]);

  const handleDelete = useCallback(async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to deactivate "${teacher.user?.name}"?`)) {
      return;
    }
    try {
      await teachersApi.delete(teacher.id);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to deactivate teacher', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAssignModal = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowAssignModal(true);
  }, []);

  const handleAssignClass = useCallback(async (classId: number, subject?: string) => {
    if (!selectedTeacher) return;
    try {
      await teachersApi.assignToClass(selectedTeacher.id, {
        classId,
        subject,
        isPrimary: false,
      });
      loadData();
      showToast('Class assigned successfully!', 'success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to assign class', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacher]);

  const handleUnassignClass = useCallback(async (classId: number) => {
    if (!selectedTeacher) return;
    try {
      await teachersApi.removeFromClass(selectedTeacher.id, classId);
      loadData();
      showToast('Class unassigned successfully!', 'success');
    } catch (error: unknown) {
      const err = error as { response?:{ data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to unassign class', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacher]);

  const columns = [
    {
      key: 'teacher',
      label: 'Teacher',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-full">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{teacher.user?.name}</p>
            <p className="text-sm text-gray-500">{teacher.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2 text-gray-900">
          <Mail className="w-4 h-4 text-gray-400" />
          {teacher.user?.email}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2 text-gray-900">
          <Phone className="w-4 h-4 text-gray-400" />
          {teacher.phoneNumber}
        </div>
      ),
    },
    {
      key: 'qualification',
      label: 'Qualification',
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2 text-gray-900">
          <Award className="w-4 h-4 text-gray-400" />
          {teacher.qualification || 'N/A'}
        </div>
      ),
    },
    {
      key: 'classes',
      label: 'Classes',
      render: (teacher: Teacher) => (
        <span className="text-gray-900">
          {teacher.classTeachers?.length || 0} classes
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (teacher: Teacher) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenAssignModal(teacher)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Manage Classes"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleEdit(teacher)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(teacher)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Deactivate"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Teachers</h1>
            <p className="text-gray-600">Manage teacher accounts and assignments</p>
          </div>
          <Button onClick={handleCreate} icon={Plus}>
            Add Teacher
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <UserCheck className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Teachers</p>
                <p className="text-3xl font-bold text-green-600">
                  {teachers.filter((t) => t.user?.isActive).length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <UserCheck className="w-8 h-8 text-green-600" />
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
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <DataTable
          data={teachers}
          columns={columns}
          searchPlaceholder="Search teachers by name, email, or employee ID..."
          emptyMessage="No teachers found. Add your first teacher!"
        />

        {/* Teacher Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!selectedTeacher}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="teacher@school.com"
                />
              </div>

              {!selectedTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required={!selectedTeacher}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!selectedTeacher}
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., T001"
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
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="03001234567"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., M.Ed, B.Sc"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter teacher address (optional)"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
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

        {/* Assign Classes Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTeacher(null);
          }}
          title={`Manage Classes - ${selectedTeacher?.user?.name || ''}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Current Assigned Classes */}
            {selectedTeacher && selectedTeacher.classTeachers && selectedTeacher.classTeachers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Assigned Classes</h3>
                <div className="space-y-2">
                  {selectedTeacher.classTeachers.map((ct) => (
                    <div
                      key={ct.id}
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {String(ct.class?.name || 'Unknown')} - {String(ct.class?.section || '')}
                          </p>
                          {ct.subject && (
                            <p className="text-sm text-gray-600">Subject: {ct.subject}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignClass(ct.classId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Classes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Classes</h3>
              {classes.filter(
                (cls) =>
                  !selectedTeacher?.classTeachers?.some((ct) => ct.classId === cls.id)
              ).length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {classes
                    .filter(
                      (cls) =>
                        !selectedTeacher?.classTeachers?.some((ct) => ct.classId === cls.id)
                    )
                    .map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {cls.name} - {String(cls.section || '')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {cls.students?.length || 0} students
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignClass(cls.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  All classes have been assigned to this teacher
                </p>
              )}
            </div>
          </div>
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
    </ProtectedRoute>
  );
}
