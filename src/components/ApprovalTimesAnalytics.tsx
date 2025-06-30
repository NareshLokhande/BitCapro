import {
  BarChart3,
  CheckCircle,
  Clock,
  Filter,
  Timer,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApprovalLogs, useInvestmentRequests } from '../hooks/useSupabase';
import StyledDropdown from './StyledDropdown';

const ApprovalTimesAnalytics: React.FC = () => {
  const { requests, loading: requestsLoading } = useInvestmentRequests();
  const { logs, loading: logsLoading } = useApprovalLogs();

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [timeRangeFilter, setTimeRangeFilter] = useState('Last 12 Months');

  if (requestsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate approval times and metrics
  const approvalMetrics = useMemo(() => {
    const completedRequests = requests.filter(
      (req) => req.status === 'Approved' || req.status === 'Rejected',
    );

    const requestApprovalTimes = completedRequests
      .map((request) => {
        const requestLogs = logs.filter((log) => log.request_id === request.id);
        const approvalLog = requestLogs.find(
          (log) => log.status === 'Approved' || log.status === 'Rejected',
        );

        if (!approvalLog) return null;

        const submittedDate = new Date(request.submitted_date);
        const approvalDate = new Date(approvalLog.timestamp);
        const approvalTimeDays = Math.ceil(
          (approvalDate.getTime() - submittedDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          requestId: request.id,
          projectTitle: request.project_title,
          department: request.department,
          submittedDate,
          approvalDate,
          approvalTimeDays,
          status: approvalLog.status,
          totalAmount: request.base_currency_capex + request.base_currency_opex,
          level: approvalLog.level,
        };
      })
      .filter(Boolean);

    // Filter by department
    const filteredMetrics =
      departmentFilter === 'All'
        ? requestApprovalTimes
        : requestApprovalTimes.filter(
            (metric) => metric.department === departmentFilter,
          );

    // Filter by time range
    const now = new Date();
    const timeRangeFiltered = filteredMetrics.filter((metric) => {
      const monthsAgo = timeRangeFilter === 'Last 6 Months' ? 6 : 12;
      const cutoffDate = new Date(
        now.getFullYear(),
        now.getMonth() - monthsAgo,
        now.getDate(),
      );
      return metric.submittedDate >= cutoffDate;
    });

    return timeRangeFiltered;
  }, [requests, logs, departmentFilter, timeRangeFilter]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (approvalMetrics.length === 0) {
      return {
        averageApprovalTime: 0,
        medianApprovalTime: 0,
        fastestApproval: 0,
        slowestApproval: 0,
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        approvalRate: 0,
      };
    }

    const approvalTimes = approvalMetrics
      .map((m) => m.approvalTimeDays)
      .sort((a, b) => a - b);
    const averageApprovalTime =
      approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length;
    const medianApprovalTime =
      approvalTimes[Math.floor(approvalTimes.length / 2)];
    const fastestApproval = Math.min(...approvalTimes);
    const slowestApproval = Math.max(...approvalTimes);

    const approvedRequests = approvalMetrics.filter(
      (m) => m.status === 'Approved',
    ).length;
    const rejectedRequests = approvalMetrics.filter(
      (m) => m.status === 'Rejected',
    ).length;
    const approvalRate = (approvedRequests / approvalMetrics.length) * 100;

    return {
      averageApprovalTime: Math.round(averageApprovalTime),
      medianApprovalTime,
      fastestApproval,
      slowestApproval,
      totalRequests: approvalMetrics.length,
      approvedRequests,
      rejectedRequests,
      approvalRate,
    };
  }, [approvalMetrics]);

  // Prepare chart data
  const approvalTimeDistribution = useMemo(() => {
    const distribution = {
      '0-3 days': 0,
      '4-7 days': 0,
      '8-14 days': 0,
      '15-30 days': 0,
      '30+ days': 0,
    };

    approvalMetrics.forEach((metric) => {
      if (metric.approvalTimeDays <= 3) distribution['0-3 days']++;
      else if (metric.approvalTimeDays <= 7) distribution['4-7 days']++;
      else if (metric.approvalTimeDays <= 14) distribution['8-14 days']++;
      else if (metric.approvalTimeDays <= 30) distribution['15-30 days']++;
      else distribution['30+ days']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: (count / approvalMetrics.length) * 100,
    }));
  }, [approvalMetrics]);

  const departmentPerformance = useMemo(() => {
    const deptData = approvalMetrics.reduce((acc, metric) => {
      if (!acc[metric.department]) {
        acc[metric.department] = {
          totalRequests: 0,
          totalDays: 0,
          approvedRequests: 0,
        };
      }

      acc[metric.department].totalRequests++;
      acc[metric.department].totalDays += metric.approvalTimeDays;
      if (metric.status === 'Approved') {
        acc[metric.department].approvedRequests++;
      }

      return acc;
    }, {} as Record<string, { totalRequests: number; totalDays: number; approvedRequests: number }>);

    return Object.entries(deptData).map(([dept, data]) => ({
      department: dept,
      averageDays: Math.round(data.totalDays / data.totalRequests),
      approvalRate: (data.approvedRequests / data.totalRequests) * 100,
      totalRequests: data.totalRequests,
    }));
  }, [approvalMetrics]);

  const monthlyTrends = useMemo(() => {
    const monthlyData = approvalMetrics.reduce((acc, metric) => {
      const monthKey = `${metric.submittedDate.getFullYear()}-${String(
        metric.submittedDate.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalRequests: 0,
          totalDays: 0,
          approvedRequests: 0,
        };
      }

      acc[monthKey].totalRequests++;
      acc[monthKey].totalDays += metric.approvalTimeDays;
      if (metric.status === 'Approved') {
        acc[monthKey].approvedRequests++;
      }

      return acc;
    }, {} as Record<string, { month: string; totalRequests: number; totalDays: number; approvedRequests: number }>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((data) => ({
        month: data.month,
        averageDays: Math.round(data.totalDays / data.totalRequests),
        approvalRate: (data.approvedRequests / data.totalRequests) * 100,
        totalRequests: data.totalRequests,
      }));
  }, [approvalMetrics]);

  const getUniqueDepartments = () => {
    return [
      'All',
      ...Array.from(new Set(requests.map((req) => req.department))),
    ];
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Approval Times Analytics
            </h1>
            <p className="text-blue-100">
              Monitor approval efficiency and processing times across your
              organization
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {summaryMetrics.averageApprovalTime}
              </div>
              <div className="text-sm text-blue-100">Avg Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {summaryMetrics.approvalRate.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-100">Approval Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <StyledDropdown
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="All Departments"
            >
              {getUniqueDepartments().map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </StyledDropdown>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <StyledDropdown
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              placeholder="Time Range"
            >
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Last 12 Months">Last 12 Months</option>
            </StyledDropdown>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Approval Time
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summaryMetrics.averageApprovalTime} days
              </p>
              <p className="text-xs text-gray-500 mt-1">Mean processing time</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
              <Timer className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Median Approval Time
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summaryMetrics.medianApprovalTime} days
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Typical processing time
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summaryMetrics.approvalRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summaryMetrics.approvedRequests} of{' '}
                {summaryMetrics.totalRequests}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Processing Range
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summaryMetrics.fastestApproval}-
                {summaryMetrics.slowestApproval} days
              </p>
              <p className="text-xs text-gray-500 mt-1">Fastest to slowest</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Approval Time Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Approval Time Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={approvalTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value} requests (${(
                    (value / summaryMetrics.totalRequests) *
                    100
                  ).toFixed(1)}%)`,
                  'Number of Requests',
                ]}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: any) => [
                  name === 'averageDays'
                    ? `${value} days`
                    : `${value.toFixed(1)}%`,
                  name === 'averageDays' ? 'Average Days' : 'Approval Rate',
                ]}
              />
              <Bar dataKey="averageDays" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Approval Trends
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: any, name: any) => [
                name === 'averageDays'
                  ? `${value} days`
                  : `${value.toFixed(1)}%`,
                name === 'averageDays' ? 'Average Days' : 'Approval Rate',
              ]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="averageDays"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Average Days"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="approvalRate"
              stroke="#10B981"
              strokeWidth={2}
              name="Approval Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Approvals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Approvals
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Project
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Department
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Submitted
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Approved
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Days
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {approvalMetrics
                .sort(
                  (a, b) => b.approvalDate.getTime() - a.approvalDate.getTime(),
                )
                .slice(0, 10)
                .map((metric) => (
                  <tr
                    key={metric.requestId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {metric.projectTitle}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {metric.department}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {metric.submittedDate.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {metric.approvalDate.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {metric.approvalTimeDays} days
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          metric.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {metric.status === 'Approved' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {metric.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalTimesAnalytics;
