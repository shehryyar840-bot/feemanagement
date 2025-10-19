'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { dashboardApi } from '@/lib/api';
import { DashboardStats, FeeRecord } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  // Use default values if stats not loaded yet
  const summary = stats?.summary || {
    totalStudents: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
  };

  const statusBreakdown = stats?.statusBreakdown || {
    paid: 0,
    pending: 0,
    overdue: 0,
  };

  const recentOverdue = stats?.recentOverdue || [];

  // Table columns for recent overdue
  const overdueColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (record: FeeRecord) => (
        <div>
          <p className="font-medium text-gray-900">{record.student?.name}</p>
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
      key: 'balance',
      label: 'Amount Due',
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
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s your fee management overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={summary.totalStudents}
          icon={Users}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          isCurrency={false}
        />
        <StatCard
          title="Total Collected"
          value={summary.totalCollected}
          icon={Wallet}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Pending Fees"
          value={summary.totalPending}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Overdue Fees"
          value={summary.totalOverdue}
          icon={AlertCircle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Payment Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Summary Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Payment Status Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-gray-600 font-medium">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {statusBreakdown.paid}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue > 0
                    ? (
                        (statusBreakdown.paid /
                          (statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statusBreakdown.pending}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue > 0
                    ? (
                        (statusBreakdown.pending /
                          (statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="text-sm text-gray-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {statusBreakdown.overdue}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue > 0
                    ? (
                        (statusBreakdown.overdue /
                          (statusBreakdown.paid + statusBreakdown.pending + statusBreakdown.overdue)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Financial Summary
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {summary.totalCollected + summary.totalPending + summary.totalOverdue > 0
                    ? (
                        (summary.totalCollected /
                          (summary.totalCollected + summary.totalPending + summary.totalOverdue)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary.totalCollected + summary.totalPending + summary.totalOverdue > 0
                        ? (
                            (summary.totalCollected /
                              (summary.totalCollected + summary.totalPending + summary.totalOverdue)) *
                            100
                          ).toFixed(1)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Expected</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(
                    summary.totalCollected + summary.totalPending + summary.totalOverdue
                  )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Outstanding</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(summary.totalPending + summary.totalOverdue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Overdue Table */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-7 h-7 text-red-600" />
          Recent Overdue Payments
        </h2>
        <DataTable
          data={recentOverdue}
          columns={overdueColumns}
          searchable={false}
          emptyMessage="No overdue payments! Great job! 🎉"
        />
      </div>
    </div>
  );
}
