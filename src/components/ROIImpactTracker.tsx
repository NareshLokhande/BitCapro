import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  LineChart,
  Zap,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { useInvestmentRequests, useApprovalLogs, useKPIs } from '../hooks/useSupabase';
import {
  ROIImpactCalculator,
  ROIImpactData,
  ROITimelinePoint,
  calculateDynamicDecayRate,
  getROIImpactSeverity
} from '../lib/roiImpactCalculator';

interface ROIImpactTrackerProps {
  selectedBusinessCase?: string;
  selectedDepartment?: string;
  timeRange?: string;
}

const ROIImpactTracker: React.FC<ROIImpactTrackerProps> = ({
  selectedBusinessCase = 'All',
  selectedDepartment = 'All',
  timeRange = '90'
}) => {
  const { requests, loading: requestsLoading } = useInvestmentRequests();
  const { logs, loading: logsLoading } = useApprovalLogs();
  const { kpis, loading: kpisLoading } = useKPIs();
  
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [sortBy, setSortBy] = useState<'delay' | 'roiLoss' | 'valueLost'>('roiLoss');

  // Calculate ROI impact data
  const roiImpactData = useMemo(() => {
    if (!requests.length || !logs.length || !kpis.length) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

    return requests
      .filter(request => {
        if (new Date(request.submitted_date) < cutoffDate) return false;
        if (selectedBusinessCase !== 'All' && !request.business_case_type?.includes(selectedBusinessCase)) return false;
        if (selectedDepartment !== 'All' && request.department !== selectedDepartment) return false;
        return true;
      })
      .map(request => {
        // Get KPI data for original ROI
        const requestKPIs = kpis.filter(kpi => kpi.request_id === request.id);
        const originalROI = requestKPIs.length > 0 ? requestKPIs[0].irr : 15; // Default 15% if no KPI

        // Get approval timeline
        const requestLogs = logs
          .filter(log => log.request_id === request.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const finalApprovalDate = requestLogs.find(log => 
          log.status === 'Approved' || log.status === 'Rejected'
        )?.timestamp || null;

        // Calculate dynamic decay rate
        const decayRate = calculateDynamicDecayRate(
          request.base_currency_capex + request.base_currency_opex,
          request.business_case_type || [],
          request.department,
          request.priority
        );

        // Calculate ROI impact
        const impact = ROIImpactCalculator.calculateROIImpact(
          originalROI,
          request.submitted_date,
          finalApprovalDate,
          request.base_currency_capex + request.base_currency_opex,
          decayRate
        );

        return {
          ...impact,
          requestId: request.id,
          projectTitle: request.project_title,
          department: request.department,
          priority: request.priority,
          businessCaseTypes: request.business_case_type || [],
          status: request.status,
          investmentAmount: request.base_currency_capex + request.base_currency_opex,
          currency: request.currency
        };
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'delay':
            return b.delayInWeeks - a.delayInWeeks;
          case 'roiLoss':
            return b.roiLoss - a.roiLoss;
          case 'valueLost':
            return b.lostValue - a.lostValue;
          default:
            return b.roiLoss - a.roiLoss;
        }
      });
  }, [requests, logs, kpis, timeRange, selectedBusinessCase, selectedDepartment, sortBy]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return ROIImpactCalculator.calculateSummaryStats(roiImpactData);
  }, [roiImpactData]);

  // Generate timeline data for chart
  const timelineChartData = useMemo(() => {
    if (roiImpactData.length === 0) return [];

    // Get the request with the most significant ROI loss for timeline display
    const significantRequest = roiImpactData.reduce((prev, current) => 
      current.roiLoss > prev.roiLoss ? current : prev
    );

    if (!significantRequest) return [];

    return ROIImpactCalculator.generateROITimeline(
      significantRequest.originalROI,
      significantRequest.submissionDate,
      significantRequest.finalApprovalDate,
      significantRequest.decayRate
    );
  }, [roiImpactData]);

  // Aggregate data for department comparison
  const departmentImpactData = useMemo(() => {
    const deptData: Record<string, {
      totalRequests: number;
      averageDelay: number;
      totalROILoss: number;
      totalValueLost: number;
    }> = {};

    roiImpactData.forEach(impact => {
      const dept = impact.department || 'Unknown';
      if (!deptData[dept]) {
        deptData[dept] = {
          totalRequests: 0,
          averageDelay: 0,
          totalROILoss: 0,
          totalValueLost: 0
        };
      }

      deptData[dept].totalRequests += 1;
      deptData[dept].averageDelay += impact.delayInWeeks;
      deptData[dept].totalROILoss += impact.roiLoss;
      deptData[dept].totalValueLost += impact.lostValue;
    });

    return Object.entries(deptData).map(([department, data]) => ({
      department,
      ...data,
      averageDelay: data.averageDelay / data.totalRequests
    }));
  }, [roiImpactData]);

  if (requestsLoading || logsLoading || kpisLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating ROI impact...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-xl font-bold">ROI Impact Tracker</h3>
              <p className="text-red-100">Monitor how approval delays affect investment returns</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {ROIImpactCalculator.formatPercentage(summaryStats.totalROILoss)}
            </div>
            <div className="text-red-100 text-sm">Total ROI Loss</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Delay</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summaryStats.averageDelay.toFixed(1)} weeks
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI Decay Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {ROIImpactCalculator.formatPercentage(summaryStats.averageROIDecay)}
              </p>
              <p className="text-xs text-gray-500">per request</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Value Lost</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {ROIImpactCalculator.formatCurrency(summaryStats.totalValueLost)}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fastest Approval</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {summaryStats.fastestApproval.toFixed(1)} weeks
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Analysis Controls</h4>
          <button
            onClick={() => setShowDetailedView(!showDetailedView)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showDetailedView ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="roiLoss">ROI Loss</option>
              <option value="delay">Delay Time</option>
              <option value="valueLost">Value Lost</option>
            </select>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ROI Decay Formula</p>
                <p>ROI(d) = ROI₀ - (r × d), where d = delay in weeks, r = decay rate (0.1-2% per week based on project characteristics)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Timeline Chart */}
      {timelineChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">ROI Decay Timeline</h4>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'roi' ? `${value.toFixed(2)}%` : `${value.toFixed(2)}%`,
                    name === 'roi' ? 'Current ROI' : 'Cumulative Loss'
                  ]}
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeLoss" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Department Impact Comparison */}
      {departmentImpactData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Department Impact Comparison</h4>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentImpactData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'totalROILoss' ? `${value.toFixed(2)}%` : 
                    name === 'averageDelay' ? `${value.toFixed(1)} weeks` :
                    ROIImpactCalculator.formatCurrency(value),
                    name === 'totalROILoss' ? 'Total ROI Loss' :
                    name === 'averageDelay' ? 'Average Delay' :
                    name === 'totalValueLost' ? 'Total Value Lost' : name
                  ]}
                />
                <Bar dataKey="totalROILoss" fill="#EF4444" name="Total ROI Loss" />
                <Bar dataKey="averageDelay" fill="#F59E0B" name="Average Delay" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Request Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Request ROI Impact Analysis</h4>
          <p className="text-sm text-gray-600 mt-1">
            Showing {roiImpactData.length} requests with ROI impact analysis
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {roiImpactData.map((impact) => {
            const severity = getROIImpactSeverity(impact.roiLossPercentage);
            const isExpanded = expandedRequest === impact.requestId;
            
            return (
              <div key={impact.requestId} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedRequest(isExpanded ? null : impact.requestId)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mr-4">
                      <TrendingDown className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{impact.projectTitle}</h5>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{impact.department}</span>
                        <span>•</span>
                        <span>{impact.delayInWeeks.toFixed(1)} weeks delay</span>
                        <span>•</span>
                        <span className="font-medium text-red-600">
                          -{ROIImpactCalculator.formatPercentage(impact.roiLoss)} ROI
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {ROIImpactCalculator.formatCurrency(impact.lostValue)}
                      </div>
                      <div className="text-sm text-gray-500">Value Lost</div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${severity.color}`}>
                      {severity.level}
                    </span>
                    
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">ROI Analysis</h6>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Original ROI:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {ROIImpactCalculator.formatPercentage(impact.originalROI)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Current ROI:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {ROIImpactCalculator.formatPercentage(impact.adjustedROI)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ROI Loss:</span>
                            <span className="text-sm font-medium text-red-600">
                              -{ROIImpactCalculator.formatPercentage(impact.roiLoss)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Decay Rate:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {ROIImpactCalculator.formatPercentage(impact.decayRate)}/week
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">Timeline</h6>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Submitted:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(impact.submissionDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className="text-sm font-medium text-gray-900">{impact.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Delay:</span>
                            <span className="text-sm font-medium text-orange-600">
                              {impact.delayInWeeks.toFixed(1)} weeks
                            </span>
                          </div>
                          {impact.finalApprovalDate && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Approved:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(impact.finalApprovalDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">Financial Impact</h6>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Investment:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {ROIImpactCalculator.formatCurrency(impact.investmentAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Projected Value:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {ROIImpactCalculator.formatCurrency(impact.projectedValue)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Value Lost:</span>
                            <span className="text-sm font-medium text-red-600">
                              -{ROIImpactCalculator.formatCurrency(impact.lostValue)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Impact:</span>
                            <span className={`text-sm font-medium ${severity.color.split(' ')[0]}`}>
                              {severity.description}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {impact.businessCaseTypes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h6 className="font-medium text-gray-900 mb-2">Business Case Types</h6>
                        <div className="flex flex-wrap gap-2">
                          {impact.businessCaseTypes.map((type) => (
                            <span key={type} className="inline-flex px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {roiImpactData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">No ROI Impact Data</p>
              <p>No requests found with sufficient data for ROI impact analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ROIImpactTracker;