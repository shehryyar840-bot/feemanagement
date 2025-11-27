'use client';

import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { feeRecordsApi, classesApi } from '@/lib/api';
import { FeeRecord, Class, Student } from '@/lib/types';
import { formatCurrency, getCurrentMonth, getCurrentYear, MONTHS } from '@/lib/utils';

export default function ClassWisePage() {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  const loadData = useCallback(async () => {
    try {
      const [recordsData, classesData] = await Promise.all([
        feeRecordsApi.getAll(),
        classesApi.getAll(),
      ]);
      setFeeRecords(recordsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter records by selected month and year
  const filteredRecords = feeRecords.filter(
    (record) => record.month === selectedMonth && record.year === selectedYear
  );

  // Calculate class-wise stats
  const classWiseStats = classes
    .map((cls) => {
      const classRecords = filteredRecords.filter((r) => r.student?.classId === cls.id);
      const paid = classRecords.filter((r) => r.status === 'Paid');
      const pending = classRecords.filter((r) => r.status === 'Pending');
      const overdue = classRecords.filter((r) => r.status === 'Overdue');
      const paidStudents = [...new Set(paid.map((r) => r.student))].filter((s): s is Student => s !== undefined && s !== null);
      const pendingStudents = [...new Set(pending.map((r) => r.student))].filter((s): s is Student => s !== undefined && s !== null);
      const overdueStudents = [...new Set(overdue.map((r) => r.student))].filter((s): s is Student => s !== undefined && s !== null);

      return {
        classId: cls.id,
        className: cls.name,
        total: classRecords.length,
        paid: paid.length,
        pending: pending.length,
        overdue: overdue.length,
        collected: classRecords.reduce((sum, r) => sum + r.amountPaid, 0),
        expectedTotal: classRecords.reduce((sum, r) => sum + r.totalFee, 0),
        paidStudents,
        pendingStudents,
        overdueStudents,
      };
    })
    .filter((stat) => stat.total > 0); // Only show classes with records

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Class-Wise View</h1>
          <p className="text-gray-600">
            View payment status and student details by class
          </p>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={getCurrentMonth()}>{getCurrentMonth()} (Current)</option>
              <option value="──" disabled>── Other Months ──</option>
              {MONTHS.filter((m) => m !== getCurrentMonth()).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={getCurrentYear() - 1}>{getCurrentYear() - 1}</option>
              <option value={getCurrentYear()}>{getCurrentYear()}</option>
              <option value={getCurrentYear() + 1}>{getCurrentYear() + 1}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedMonth(getCurrentMonth());
                setSelectedYear(getCurrentYear());
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Reset to Current Month
            </button>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Classes</p>
          <p className="text-3xl font-bold text-emerald-600">{classWiseStats.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">
            {classWiseStats.reduce((sum, c) => sum + c.total, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-3xl font-bold text-green-600">
            {classWiseStats.reduce((sum, c) => sum + c.paid, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(classWiseStats.reduce((sum, c) => sum + c.collected, 0))}
          </p>
        </div>
      </div>

      {/* Class Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {selectedMonth} {selectedYear} - Class Details
        </h2>

        {classWiseStats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              No fee records found for {selectedMonth} {selectedYear}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classWiseStats.map((classStat) => (
              <div
                key={classStat.classId}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Class Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{classStat.className}</h3>
                      <p className="text-emerald-100">
                        {classStat.total} Student{classStat.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-100">Collection Rate</p>
                      <p className="text-3xl font-bold">
                        {classStat.total > 0
                          ? ((classStat.paid / classStat.total) * 100).toFixed(0)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{classStat.paid}</p>
                      <p className="text-xs text-gray-600">Paid</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{classStat.pending}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{classStat.overdue}</p>
                      <p className="text-xs text-gray-600">Overdue</p>
                    </div>
                  </div>

                  {/* Money Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Expected Total:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(classStat.expectedTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Collected:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(classStat.collected)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="text-sm font-medium text-gray-900">Outstanding:</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(classStat.expectedTotal - classStat.collected)}
                      </span>
                    </div>
                  </div>

                  {/* Students Who Paid */}
                  {classStat.paidStudents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Students Who Paid ({classStat.paid})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {classStat.paidStudents.map((student: Student, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-md border border-green-200"
                          >
                            {student?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Students */}
                  {classStat.pendingStudents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        Pending Students ({classStat.pending})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {classStat.pendingStudents.map((student: Student, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200"
                          >
                            {student?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overdue Students */}
                  {classStat.overdueStudents.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Overdue Students ({classStat.overdue})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {classStat.overdueStudents.map((student: Student, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-md border border-red-200"
                          >
                            {student?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
