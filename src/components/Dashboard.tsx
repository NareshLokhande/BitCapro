import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Globe,
  Leaf,
  MapPin,
  Package,
  PieChart,
  Scale,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useInvestmentRequests, useKPIs } from '../hooks/useSupabase';
import {
  CarbonFootprintData,
  ESGCalculator,
  formatEmissions,
} from '../lib/esgCalculator';
import {
  formatCurrencyAmount,
  formatNumber,
  getCurrencySymbol,
} from '../lib/supabase';
import ApprovalTimesAnalytics from './ApprovalTimesAnalytics';
import ROIImpactTracker from './ROIImpactTracker';
import StyledDropdown from './StyledDropdown';

const Dashboard: React.FC = () => {
  const { requests, loading: requestsLoading } = useInvestmentRequests();
  const { kpis, loading: kpisLoading } = useKPIs();

  // Filter states
  const [businessCaseFilter, setBusinessCaseFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [activeWidget, setActiveWidget] = useState<
    'overview' | 'approval-times' | 'roi-impact'
  >('overview');

  if (requestsLoading || kpisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Apply filters
  const filteredRequests = requests.filter((request) => {
    if (
      businessCaseFilter !== 'All' &&
      !request.business_case_type?.includes(businessCaseFilter)
    ) {
      return false;
    }
    if (yearFilter !== 'All' && request.start_year.toString() !== yearFilter) {
      return false;
    }
    if (departmentFilter !== 'All' && request.department !== departmentFilter) {
      return false;
    }
    return true;
  });

  // Calculate metrics using base currency (USD) for consistency
  const totalInvestment = filteredRequests.reduce(
    (sum, req) => sum + (req.base_currency_capex + req.base_currency_opex),
    0,
  );
  const approvedRequests = filteredRequests.filter(
    (req) => req.status === 'Approved',
  );
  const pendingRequests = filteredRequests.filter((req) =>
    ['Under Review', 'Submitted'].includes(req.status),
  );
  const approvalRate =
    filteredRequests.length > 0
      ? (approvedRequests.length / filteredRequests.length) * 100
      : 0;
  const avgROI =
    kpis.length > 0
      ? kpis.reduce((sum, kpi) => sum + kpi.irr, 0) / kpis.length
      : 0;

  // Enhanced decision-making metrics
  const highPriorityRequests = filteredRequests.filter((req) =>
    ['High', 'Critical'].includes(req.priority),
  );
  const outOfBudgetRequests = filteredRequests.filter(
    (req) => !req.is_in_budget,
  );
  const avgProcessingTime = 15; // Days - would come from actual data
  const budgetUtilization =
    (filteredRequests.filter((req) => req.is_in_budget).length /
      filteredRequests.length) *
    100;

  // Risk metrics
  const highRiskRequests = filteredRequests.filter(
    (req) =>
      req.business_case_type?.includes('Compliance') ||
      req.business_case_type?.includes('ESG') ||
      req.priority === 'Critical',
  );
  const riskScore = (highRiskRequests.length / filteredRequests.length) * 100;

  // Performance trends (simulated data for now)
  const previousQuarterInvestment = totalInvestment * 0.85; // 15% growth
  const investmentGrowth =
    ((totalInvestment - previousQuarterInvestment) /
      previousQuarterInvestment) *
    100;
  const previousQuarterApprovalRate = approvalRate - 2.5; // 2.5% improvement
  const approvalRateImprovement = approvalRate - previousQuarterApprovalRate;

  // ESG specific calculations
  const esgRequests = filteredRequests.filter((req) =>
    req.business_case_type?.includes('ESG'),
  );
  const totalCarbonFootprint = esgRequests.reduce((sum, req) => {
    if (
      req.carbon_footprint_data &&
      Object.keys(req.carbon_footprint_data).length > 0
    ) {
      const impact = ESGCalculator.calculateCarbonFootprint(
        req.carbon_footprint_data as CarbonFootprintData,
      );
      return sum + impact.totalEmissions;
    }
    return sum;
  }, 0);

  const totalCarbonReduction = esgRequests.reduce((sum, req) => {
    if (
      req.carbon_footprint_data &&
      Object.keys(req.carbon_footprint_data).length > 0
    ) {
      const impact = ESGCalculator.calculateCarbonFootprint(
        req.carbon_footprint_data as CarbonFootprintData,
      );
      return sum + impact.reductionPotential;
    }
    return sum;
  }, 0);

  const avgESGScore =
    esgRequests.length > 0
      ? esgRequests.reduce((sum, req) => {
          if (
            req.carbon_footprint_data &&
            Object.keys(req.carbon_footprint_data).length > 0
          ) {
            const impact = ESGCalculator.calculateCarbonFootprint(
              req.carbon_footprint_data as CarbonFootprintData,
            );
            return sum + impact.esgScore;
          }
          return sum;
        }, 0) / esgRequests.length
      : 0;

  // Get unique values for filters
  const uniqueYears = [
    ...new Set(requests.map((req) => req.start_year.toString())),
  ].sort();
  const uniqueDepartments = [
    ...new Set(requests.map((req) => req.department)),
  ].sort();
  const uniqueBusinessCaseTypes = [
    ...new Set(requests.flatMap((req) => req.business_case_type || [])),
  ].sort();

  // Chart data by department (using base currency)
  const departmentData = filteredRequests.reduce((acc, req) => {
    acc[req.department] =
      (acc[req.department] || 0) +
      (req.base_currency_capex + req.base_currency_opex);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(departmentData).map(([dept, amount]) => ({
    department: dept,
    amount: amount / 1000, // Convert to thousands
  }));

  // Business Case Type data
  const businessCaseData = filteredRequests.reduce((acc, req) => {
    if (req.business_case_type && req.business_case_type.length > 0) {
      req.business_case_type.forEach((caseType) => {
        acc[caseType] =
          (acc[caseType] || 0) +
          (req.base_currency_capex + req.base_currency_opex);
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const businessCaseChartData = Object.entries(businessCaseData).map(
    ([caseType, amount]) => ({
      businessCase: caseType,
      amount: amount / 1000, // Convert to thousands
    }),
  );

  // ESG Impact Chart Data
  const esgImpactData = esgRequests
    .map((req) => {
      if (
        req.carbon_footprint_data &&
        Object.keys(req.carbon_footprint_data).length > 0
      ) {
        const impact = ESGCalculator.calculateCarbonFootprint(
          req.carbon_footprint_data as CarbonFootprintData,
        );
        return {
          name: req.project_title.substring(0, 20) + '...',
          emissions: impact.totalEmissions,
          reduction: impact.reductionPotential,
          esgScore: impact.esgScore,
          investment: (req.base_currency_capex + req.base_currency_opex) / 1000,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Currency distribution data
  const currencyData = filteredRequests.reduce((acc, req) => {
    acc[req.currency] = (acc[req.currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = filteredRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
  ];

  const monthlyData = [
    { month: 'Jan', requests: 12, approved: 8, investment: 2400 },
    { month: 'Feb', requests: 19, approved: 13, investment: 1398 },
    { month: 'Mar', requests: 15, approved: 12, investment: 3200 },
    { month: 'Apr', requests: 22, approved: 18, investment: 2780 },
    { month: 'May', requests: 18, approved: 15, investment: 1890 },
    { month: 'Jun', requests: 25, approved: 20, investment: 2390 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Submitted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Custom label function for pie chart that handles responsive display
  const renderCustomizedLabel = (props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend component for better mobile display
  const CustomLegend = ({
    payload,
  }: {
    payload: Array<{ value: string; color: string }>;
  }) => (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  const getBusinessCaseIcon = (caseType: string) => {
    switch (caseType) {
      case 'ESG':
        return <Leaf className="w-4 h-4" />;
      case 'IPO Prep':
        return <TrendingUp className="w-4 h-4" />;
      case 'Compliance':
        return <Scale className="w-4 h-4" />;
      case 'Expansion':
        return <Globe className="w-4 h-4" />;
      case 'Asset Creation':
        return <Package className="w-4 h-4" />;
      case 'Cost Control':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Investment Dashboard</h1>
            <p className="text-blue-100">
              Monitor and analyze investment requests across your organization
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredRequests.length}
              </div>
              <div className="text-sm text-blue-100">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${formatNumber(totalInvestment)}
              </div>
              <div className="text-sm text-blue-100">
                Total Investment (USD)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Dashboard Views
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveWidget('overview')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWidget === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveWidget('approval-times')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWidget === 'approval-times'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Timer className="w-4 h-4 mr-2" />
            Approval Times
          </button>
          <button
            onClick={() => setActiveWidget('roi-impact')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWidget === 'roi-impact'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            ROI Impact
          </button>
        </div>
      </div>

      {/* Conditional Widget Rendering */}
      {activeWidget === 'approval-times' ? (
        <ApprovalTimesAnalytics />
      ) : activeWidget === 'roi-impact' ? (
        <ROIImpactTracker />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Case Type
                </label>
                <StyledDropdown
                  value={businessCaseFilter}
                  onChange={(e) => setBusinessCaseFilter(e.target.value)}
                  placeholder="All Business Cases"
                >
                  <option value="All">All Business Cases</option>
                  {uniqueBusinessCaseTypes.map((caseType) => (
                    <option key={caseType} value={caseType}>
                      {caseType}
                    </option>
                  ))}
                </StyledDropdown>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <StyledDropdown
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="All Years"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </StyledDropdown>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <StyledDropdown
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  placeholder="All Departments"
                >
                  <option value="All">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </StyledDropdown>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setBusinessCaseFilter('All');
                    setYearFilter('All');
                    setDepartmentFilter('All');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Investment
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${formatNumber(totalInvestment)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">USD Equivalent</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {investmentGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    investmentGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {investmentGrowth >= 0 ? '+' : ''}
                  {investmentGrowth.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs last quarter
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Approval Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {approvalRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">YTD 2024</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {approvalRateImprovement >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    approvalRateImprovement >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {approvalRateImprovement >= 0 ? '+' : ''}
                  {approvalRateImprovement.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs last quarter
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average IRR
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {avgROI.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Portfolio Average
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600 font-medium">
                  Target: 12.0%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs benchmark</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Reviews
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {pendingRequests.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting Action</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Timer className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600 font-medium">
                  {avgProcessingTime} days
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  avg processing
                </span>
              </div>
            </div>
          </div>

          {/* Decision-Making Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">
                  Risk Analysis
                </h3>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Risk Score</span>
                  <span className="text-lg font-bold text-red-900">
                    {riskScore.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">
                    High Risk Projects
                  </span>
                  <span className="text-lg font-bold text-red-900">
                    {highRiskRequests.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Out of Budget</span>
                  <span className="text-lg font-bold text-red-900">
                    {outOfBudgetRequests.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Performance Metrics
                </h3>
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">
                    Budget Utilization
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    {budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">High Priority</span>
                  <span className="text-lg font-bold text-blue-900">
                    {highPriorityRequests.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Processing Time</span>
                  <span className="text-lg font-bold text-blue-900">
                    {avgProcessingTime} days
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">
                  ESG Impact
                </h3>
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">ESG Projects</span>
                  <span className="text-lg font-bold text-green-900">
                    {esgRequests.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">
                    Carbon Reduction
                  </span>
                  <span className="text-lg font-bold text-green-900">
                    {formatEmissions(totalCarbonReduction)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Avg ESG Score</span>
                  <span className="text-lg font-bold text-green-900">
                    {avgESGScore.toFixed(0)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ESG Impact Cards */}
          {esgRequests.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <Leaf className="w-5 h-5 mr-2" />
                ESG Impact Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {esgRequests.length}
                  </div>
                  <div className="text-sm text-green-700">ESG Projects</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {formatEmissions(totalCarbonFootprint)}
                  </div>
                  <div className="text-sm text-green-700">Total Emissions</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {formatEmissions(totalCarbonReduction)}
                  </div>
                  <div className="text-sm text-green-700">
                    Reduction Potential
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {avgESGScore.toFixed(0)}/100
                  </div>
                  <div className="text-sm text-green-700">Avg ESG Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Insights & Recommendations */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-purple-900 flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                Actionable Insights & Recommendations
              </h3>
              <Eye className="w-5 h-5 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                  Priority Actions Required
                </h4>
                <div className="space-y-4">
                  {pendingRequests.length > 5 && (
                    <div className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          High Pending Requests
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          {pendingRequests.length} requests awaiting review.
                          Consider expediting high-priority items.
                        </p>
                      </div>
                    </div>
                  )}

                  {outOfBudgetRequests.length > 0 && (
                    <div className="flex items-start p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Budget Overruns Detected
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {outOfBudgetRequests.length} projects exceed budget.
                          Review and adjust allocations.
                        </p>
                      </div>
                    </div>
                  )}

                  {riskScore > 30 && (
                    <div className="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          Elevated Risk Level
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Risk score of {riskScore.toFixed(1)}% requires
                          additional oversight and monitoring.
                        </p>
                      </div>
                    </div>
                  )}

                  {avgROI < 10 && (
                    <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Below Target ROI
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Average IRR of {avgROI.toFixed(1)}% is below 12%
                          target. Review project selection criteria.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Performance Insights
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Investment Growth
                      </p>
                      <p className="text-xs text-green-700">
                        Quarter over quarter
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          investmentGrowth >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {investmentGrowth >= 0 ? '+' : ''}
                        {investmentGrowth.toFixed(1)}%
                      </p>
                      <p className="text-xs text-green-700">
                        {investmentGrowth >= 0 ? 'Positive' : 'Declining'} trend
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Approval Efficiency
                      </p>
                      <p className="text-xs text-blue-700">Rate improvement</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          approvalRateImprovement >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {approvalRateImprovement >= 0 ? '+' : ''}
                        {approvalRateImprovement.toFixed(1)}%
                      </p>
                      <p className="text-xs text-blue-700">
                        {approvalRateImprovement >= 0
                          ? 'Improving'
                          : 'Declining'}{' '}
                        performance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <p className="text-sm font-medium text-purple-900">
                        Budget Utilization
                      </p>
                      <p className="text-xs text-purple-700">
                        Efficiency metric
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          budgetUtilization >= 80
                            ? 'text-green-600'
                            : budgetUtilization >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {budgetUtilization.toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-700">
                        {budgetUtilization >= 80
                          ? 'Excellent'
                          : budgetUtilization >= 60
                          ? 'Good'
                          : 'Needs attention'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Processing Speed
                      </p>
                      <p className="text-xs text-orange-700">Average days</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          avgProcessingTime <= 10
                            ? 'text-green-600'
                            : avgProcessingTime <= 20
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {avgProcessingTime} days
                      </p>
                      <p className="text-xs text-orange-700">
                        {avgProcessingTime <= 10
                          ? 'Fast'
                          : avgProcessingTime <= 20
                          ? 'Moderate'
                          : 'Slow'}{' '}
                        processing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Investment by Department */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Investment by Department
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="department"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value}K USD`,
                        'Investment',
                      ]}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Request Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Status Distribution
                </h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      labelStyle={{ color: '#374151' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend below the chart */}
              <CustomLegend
                payload={pieData.map((item, index) => ({
                  value: item.name,
                  color: COLORS[index % COLORS.length],
                }))}
              />
            </div>
          </div>

          {/* Trend Analysis & Forecasting */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-indigo-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3" />
                Trend Analysis & Forecasting
              </h3>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Investment Trends */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                  Investment Trends
                </h4>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${formatNumber(totalInvestment)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Investment
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Growth Rate</span>
                    <span
                      className={`text-lg font-bold ${
                        investmentGrowth >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {investmentGrowth >= 0 ? '+' : ''}
                      {investmentGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Projected Q4</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${formatNumber(totalInvestment * 1.15)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Trends */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Approval Trends
                </h4>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {approvalRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Current Rate</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Improvement</span>
                    <span
                      className={`text-lg font-bold ${
                        approvalRateImprovement >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {approvalRateImprovement >= 0 ? '+' : ''}
                      {approvalRateImprovement.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Target Rate</span>
                    <span className="text-lg font-bold text-purple-600">
                      85%
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk & Performance */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                  Risk & Performance
                </h4>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {riskScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Avg ROI</span>
                    <span
                      className={`text-lg font-bold ${
                        avgROI >= 12 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {avgROI.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Processing</span>
                    <span
                      className={`text-lg font-bold ${
                        avgProcessingTime <= 15
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {avgProcessingTime} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                6-Month Forecast
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value}K USD`,
                        'Investment',
                      ]}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="investment"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.1}
                      name="Investment ($K USD)"
                    />
                    <Line
                      type="monotone"
                      dataKey="approved"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Approved Requests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Business Case Type Investment */}
          {businessCaseChartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Investment by Business Case Type
                </h3>
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessCaseChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="businessCase"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value}K USD`,
                        'Investment',
                      ]}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#8B5CF6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ESG Impact Chart */}
          {esgImpactData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  ESG Impact vs Investment
                </h3>
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={esgImpactData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'emissions' || name === 'reduction') {
                          return [`${value.toFixed(1)} tons CO₂e`, name];
                        }
                        if (name === 'investment') {
                          return [`$${value}K USD`, name];
                        }
                        return [value, name];
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="emissions"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      name="emissions"
                    />
                    <Area
                      type="monotone"
                      dataKey="reduction"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="reduction"
                    />
                    <Line
                      type="monotone"
                      dataKey="investment"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="investment"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Currency Distribution */}
          {Object.keys(currencyData).length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Currency Distribution
                </h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(currencyData).map(([currency, count]) => (
                  <div
                    key={currency}
                    className="text-center p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">{currency}</div>
                    <div className="text-xs text-gray-500">
                      {getCurrencySymbol(currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Investment Trends
              </h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="investment"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    name="Investment ($K USD)"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Approved Requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Investment Requests
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Legal Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.slice(0, 10).map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.project_title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.department}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {request.business_case_type
                            ?.slice(0, 2)
                            .map((caseType) => (
                              <span
                                key={caseType}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {getBusinessCaseIcon(caseType)}
                                <span className="ml-1">{caseType}</span>
                              </span>
                            ))}
                          {request.business_case_type &&
                            request.business_case_type.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{request.business_case_type.length - 2}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {request.legal_entity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {request.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrencyAmount(
                            request.capex + request.opex,
                            request.currency,
                          )}
                        </div>
                        {request.currency !== 'USD' && (
                          <div className="text-xs text-gray-500">
                            ≈ $
                            {(
                              request.base_currency_capex +
                              request.base_currency_opex
                            ).toLocaleString()}{' '}
                            USD
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {request.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            request.priority,
                          )}`}
                        >
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            request.status,
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.is_in_budget
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.is_in_budget ? 'In Budget' : 'Out of Budget'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No investment requests found matching your criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
