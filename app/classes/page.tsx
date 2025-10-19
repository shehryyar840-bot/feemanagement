'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, GraduationCap, DollarSign } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { classesApi, feeStructuresApi } from '@/lib/api';
import { Class } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [feeData, setFeeData] = useState({
    tuitionFee: 0,
    labFee: 0,
    libraryFee: 0,
    sportsFee: 0,
    examFee: 0,
    otherFee: 0,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
      alert('Failed to load classes');
    }
  };

  const handleCreateClass = () => {
    setSelectedClass(null);
    setFormData({ name: '', description: '' });
    setShowClassModal(true);
  };

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({ name: cls.name, description: cls.description || '' });
    setShowClassModal(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        await classesApi.update(selectedClass.id, formData);
      } else {
        await classesApi.create(formData);
      }
      setShowClassModal(false);
      loadClasses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to save class');
    }
  };

  const handleDeleteClass = async (cls: Class) => {
    if (!confirm(`Delete class "${cls.name}"? This will fail if students are enrolled.`)) {
      return;
    }
    try {
      await classesApi.delete(cls.id);
      loadClasses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to delete class');
    }
  };

  const handleManageFees = (cls: Class) => {
    setSelectedClass(cls);
    if (cls.feeStructure) {
      setFeeData({
        tuitionFee: cls.feeStructure.tuitionFee,
        labFee: cls.feeStructure.labFee,
        libraryFee: cls.feeStructure.libraryFee,
        sportsFee: cls.feeStructure.sportsFee,
        examFee: cls.feeStructure.examFee,
        otherFee: cls.feeStructure.otherFee,
      });
    } else {
      setFeeData({
        tuitionFee: 0,
        labFee: 0,
        libraryFee: 0,
        sportsFee: 0,
        examFee: 0,
        otherFee: 0,
      });
    }
    setShowFeeModal(true);
  };

  const handleSubmitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      if (selectedClass.feeStructure) {
        await feeStructuresApi.update(selectedClass.feeStructure.id, feeData);
      } else {
        await feeStructuresApi.create({ ...feeData, classId: selectedClass.id });
      }
      setShowFeeModal(false);
      loadClasses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to save fee structure');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Class Name',
      render: (cls: Class) => (
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{cls.name}</p>
            {cls.description && (
              <p className="text-sm text-gray-500">{cls.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'students',
      label: 'Total Students',
      render: (cls: Class) => (
        <span className="font-medium text-gray-900">
          {cls._count?.students || 0}
        </span>
      ),
    },
    {
      key: 'monthlyFee',
      label: 'Monthly Fee',
      render: (cls: Class) => (
        <span className="font-semibold text-green-600">
          {cls.feeStructure
            ? formatCurrency(cls.feeStructure.totalMonthlyFee)
            : 'Not Set'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (cls: Class) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            cls.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {cls.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (cls: Class) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleManageFees(cls)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Manage Fees"
          >
            <DollarSign className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleEditClass(cls)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDeleteClass(cls)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  const totalMonthlyFee = feeData.tuitionFee + feeData.labFee + feeData.libraryFee +
                          feeData.sportsFee + feeData.examFee + feeData.otherFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Classes</h1>
          <p className="text-gray-600">Manage classes and their fee structures</p>
        </div>
        <Button onClick={handleCreateClass} icon={Plus}>
          Add Class
        </Button>
      </div>

      {/* Classes Table */}
      <DataTable
        data={classes}
        columns={columns}
        searchPlaceholder="Search classes..."
        emptyMessage="No classes found. Create your first class!"
      />

      {/* Class Modal */}
      <Modal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
      >
        <form onSubmit={handleSubmitClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Class 1, Nursery, Grade 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedClass ? 'Update Class' : 'Create Class'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowClassModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fee Structure Modal */}
      <Modal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        title={`Fee Structure - ${selectedClass?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitFee} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuition Fee *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={feeData.tuitionFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, tuitionFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                value={feeData.labFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, labFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                value={feeData.libraryFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, libraryFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                value={feeData.sportsFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, sportsFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Fee
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeData.examFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, examFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Fee
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeData.otherFee}
                onChange={(e) =>
                  setFeeData({ ...feeData, otherFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total Monthly Fee:
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalMonthlyFee)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedClass?.feeStructure ? 'Update Fee Structure' : 'Create Fee Structure'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFeeModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
