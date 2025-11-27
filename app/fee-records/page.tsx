'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Filter, Receipt, CheckCircle, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { feeRecordsApi, classesApi } from '@/lib/api';
import { FeeRecord, Class } from '@/lib/types';
import { formatCurrency, formatDate, MONTHS, getCurrentYear, getCurrentMonth } from '@/lib/utils';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function FeeRecordsPage() {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
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
  const [generateData, setGenerateData] = useState({
    month: getCurrentMonth(),
    year: getCurrentYear(),
    classId: 'all',
    dueDate: '',
    examFee: 0,
    otherFee: 0,
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
      const [recordsData, classesData] = await Promise.all([
        feeRecordsApi.getAll(),
        classesApi.getAll(),
      ]);
      setFeeRecords(recordsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data', 'error');
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
      showToast('Payment recorded successfully', 'success');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to record payment', 'error');
    }
  };

  const handleGenerateFees = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await feeRecordsApi.generateMonthlyFees({
        month: generateData.month,
        year: generateData.year,
        classId: generateData.classId !== 'all' ? parseInt(generateData.classId) : undefined,
        dueDate: generateData.dueDate || undefined,
        examFee: generateData.examFee,
        otherFee: generateData.otherFee,
      });

      setShowGenerateModal(false);
      showToast(`Generated ${result.created.length} fee record(s). Skipped ${result.skipped.length} existing record(s).`, 'success');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to generate fee records', 'error');
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
        <Button onClick={() => setShowGenerateModal(true)} icon={Plus}>
          Generate Monthly Fees
        </Button>
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

      {/* Generate Monthly Fees Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Monthly Fee Records"
        size="lg"
      >
        <form onSubmit={handleGenerateFees} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> This will create fee records for all active students (or selected class) for the specified month.
              Recurring fees (tuition, lab, library, sports) are automatically included.
              You can optionally add one-time fees (exam, books, paper fund) that will be applied to all students in the selected scope.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <select
                required
                value={generateData.month}
                onChange={(e) => setGenerateData({ ...generateData, month: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                required
                min="2020"
                max="2100"
                value={generateData.year}
                onChange={(e) => setGenerateData({ ...generateData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class (Optional)
              </label>
              <select
                value={generateData.classId}
                onChange={(e) => setGenerateData({ ...generateData, classId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Active Students</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={generateData.dueDate}
                onChange={(e) => setGenerateData({ ...generateData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Defaults to 10th of the month"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              One-Time Fees (Optional)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add one-time fees that will be applied to all students in the selected scope (e.g., exam fee, books, paper fund).
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Fee / Test Fee
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={generateData.examFee}
                  onChange={(e) => setGenerateData({ ...generateData, examFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Fee (Books / Paper Fund / etc.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={generateData.otherFee}
                  onChange={(e) => setGenerateData({ ...generateData, otherFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Generate Fee Records
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
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
