'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Filter, Receipt, CheckCircle } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { feeRecordsApi, studentsApi, classesApi } from '@/lib/api';
import { FeeRecord, Student, Class } from '@/lib/types';
import { formatCurrency, formatDate, MONTHS, getCurrentYear, getCurrentMonth } from '@/lib/utils';

export default function FeeRecordsPage() {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    month: getCurrentMonth(), // Default to current month
    year: getCurrentYear(),
    classId: 'all',
    studentSearch: '',
  });
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    paymentMode: 'Cash' as 'Cash' | 'Online' | 'Cheque',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsData, studentsData, classesData] = await Promise.all([
        feeRecordsApi.getAll(),
        studentsApi.getAll(),
        classesApi.getAll(),
      ]);
      setFeeRecords(recordsData);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (record: FeeRecord) => {
    setSelectedRecord(record);
    setPaymentData({
      amountPaid: record.balance,
      paymentMode: 'Cash',
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await feeRecordsApi.recordPayment(selectedRecord.id, paymentData);
      setShowPaymentModal(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to record payment');
    }
  };

  // Filter records
  const filteredRecords = feeRecords.filter((record) => {
    if (filters.status !== 'all' && record.status.toLowerCase() !== filters.status) {
      return false;
    }
    if (filters.month !== 'all' && record.month !== filters.month) {
      return false;
    }
    if (record.year !== filters.year) {
      return false;
    }
    if (filters.classId !== 'all' && record.student?.classId !== parseInt(filters.classId)) {
      return false;
    }
    if (filters.studentSearch) {
      const searchLower = filters.studentSearch.toLowerCase();
      const nameMatch = record.student?.name.toLowerCase().includes(searchLower);
      const rollMatch = record.student?.rollNumber.toLowerCase().includes(searchLower);
      if (!nameMatch && !rollMatch) return false;
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: filteredRecords.length,
    paid: filteredRecords.filter((r) => r.status === 'Paid').length,
    pending: filteredRecords.filter((r) => r.status === 'Pending').length,
    overdue: filteredRecords.filter((r) => r.status === 'Overdue').length,
    totalCollected: filteredRecords.reduce((sum, r) => sum + r.amountPaid, 0),
    totalPending: filteredRecords.reduce((sum, r) => sum + r.balance, 0),
  };


  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (record: FeeRecord) => (
        <div>
          <p className="font-semibold text-gray-900">{record.student?.name}</p>
          <p className="text-sm text-gray-500">{record.student?.rollNumber}</p>
        </div>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (record: FeeRecord) => (
        <span className="text-gray-900">{record.student?.class?.name}</span>
      ),
    },
    {
      key: 'month',
      label: 'Month',
      render: (record: FeeRecord) => (
        <span className="text-gray-900">{`${record.month} ${record.year}`}</span>
      ),
    },
    {
      key: 'totalFee',
      label: 'Total Fee',
      render: (record: FeeRecord) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(record.totalFee)}
        </span>
      ),
    },
    {
      key: 'amountPaid',
      label: 'Paid',
      render: (record: FeeRecord) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(record.amountPaid)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (record: FeeRecord) => (
        <span className="font-semibold text-red-600">
          {formatCurrency(record.balance)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (record: FeeRecord) => (
        <span className="text-gray-900">{formatDate(record.dueDate)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (record: FeeRecord) => <Badge status={record.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (record: FeeRecord) => (
        <div className="flex gap-2">
          {record.status !== 'Paid' && (
            <button
              onClick={() => handleRecordPayment(record)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              Pay
            </button>
          )}
          {record.status === 'Paid' && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Paid
            </span>
          )}
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Fee Records</h1>
          <p className="text-gray-600">
            Showing {filters.month === 'all' ? 'all months' : filters.month} {filters.year} fee records
            {filters.month !== 'all' && ' (change month to view previous records)'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Collected</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(stats.totalCollected)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Outstanding</p>
          <p className="text-lg font-bold text-orange-600">
            {formatCurrency(stats.totalPending)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={getCurrentMonth()}>
                {getCurrentMonth()} (Current)
              </option>
              <option value="all">── All Months ──</option>
              {MONTHS.filter((m) => m !== getCurrentMonth()).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={getCurrentYear() - 1}>{getCurrentYear() - 1}</option>
              <option value={getCurrentYear()}>{getCurrentYear()}</option>
              <option value={getCurrentYear() + 1}>{getCurrentYear() + 1}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <input
              type="text"
              value={filters.studentSearch}
              onChange={(e) =>
                setFilters({ ...filters, studentSearch: e.target.value })
              }
              placeholder="Name or Roll No"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() =>
              setFilters({
                status: 'all',
                month: getCurrentMonth(), // Reset to current month
                year: getCurrentYear(),
                classId: 'all',
                studentSearch: '',
              })
            }
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Reset to Current Month
          </button>
        </div>
      </div>

      {/* Fee Records Table */}
      <DataTable
        data={filteredRecords}
        columns={columns}
        searchable={false}
        emptyMessage="No fee records found for the selected filters"
      />

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        {selectedRecord && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Student Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Student:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedRecord.student?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Month:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedRecord.month} {selectedRecord.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Fee:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(selectedRecord.totalFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Already Paid:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(selectedRecord.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="text-sm font-semibold text-gray-900">
                  Balance Due:
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(selectedRecord.balance)}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                max={selectedRecord.balance}
                step="0.01"
                value={paymentData.amountPaid}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amountPaid: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatCurrency(selectedRecord.balance)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paymentMode: e.target.value as 'Cash' | 'Online' | 'Cheque',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={paymentData.remarks}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, remarks: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Optional payment notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="success" className="flex-1">
                <Receipt className="w-5 h-5" />
                Record Payment
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
