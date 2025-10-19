'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { MonthlyTrend, ClassWiseStats, PaymentModeStats } from '@/lib/types';
import { formatCurrency, getCurrentYear } from '@/lib/utils';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function ReportsPage() {
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [classWiseStats, setClassWiseStats] = useState<ClassWiseStats[]>([]);
  const [paymentModeStats, setPaymentModeStats] = useState<PaymentModeStats[]>([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [monthly, classWise, paymentMode] = await Promise.all([
          dashboardApi.getMonthlyTrend(selectedYear),
          dashboardApi.getClassWiseStats(selectedYear),
          dashboardApi.getPaymentModeStats(selectedYear),
        ]);
        setMonthlyTrend(monthly);
        setClassWiseStats(classWise);
        setPaymentModeStats(paymentMode);
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    };

    loadReports();
  }, [selectedYear]);

  // Monthly Trend Chart Data
  const monthlyChartData = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [
      {
        label: 'Collected',
        data: monthlyTrend.map((m) => m.collected),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
      {
        label: 'Expected',
        data: monthlyTrend.map((m) => m.expected),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
      {
        label: 'Pending',
        data: monthlyTrend.map((m) => m.pending),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 2,
      },
    ],
  };

  // Class Wise Chart Data
  const classWiseChartData = {
    labels: classWiseStats.map((c) => c.className),
    datasets: [
      {
        label: 'Collected',
        data: classWiseStats.map((c) => c.totalCollected),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Pending',
        data: classWiseStats.map((c) => c.totalPending),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
      },
    ],
  };

  // Payment Mode Pie Chart Data
  const paymentModePieData = {
    labels: paymentModeStats.map((p) => p.mode),
    datasets: [
      {
        data: paymentModeStats.map((p) => p.totalAmount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into fee collection and trends
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={getCurrentYear() - 1}>{getCurrentYear() - 1}</option>
            <option value={getCurrentYear()}>{getCurrentYear()}</option>
            <option value={getCurrentYear() + 1}>{getCurrentYear() + 1}</option>
          </select>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Monthly Collection Trend
          </h2>
        </div>
        <div style={{ height: '400px' }}>
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Class Wise Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Class-Wise Collection
          </h2>
          <div style={{ height: '350px' }}>
            <Bar data={classWiseChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" />
            Payment Mode Distribution
          </h2>
          <div style={{ height: '350px' }}>
            <Pie data={paymentModePieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Wise Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Class-Wise Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classWiseStats.map((cls, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {cls.className}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cls.totalStudents}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(cls.totalCollected)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                      {formatCurrency(cls.totalPending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Mode Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Payment Mode Details
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentModeStats.map((mode, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {mode.mode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {mode.transactionCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(mode.totalAmount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {paymentModeStats.reduce((sum, m) => sum + m.transactionCount, 0)}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {formatCurrency(
                      paymentModeStats.reduce((sum, m) => sum + m.totalAmount, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Monthly Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Expected
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Collection %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyTrend.map((month, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(month.expected)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    {formatCurrency(month.collected)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                    {formatCurrency(month.pending)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              month.expected > 0
                                ? (month.collected / month.expected) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {month.expected > 0
                          ? ((month.collected / month.expected) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
