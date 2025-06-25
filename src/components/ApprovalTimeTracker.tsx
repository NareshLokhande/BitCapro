import React, { useState, useMemo } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Filter,
  Calendar,
  Users,
  Target,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { useInvestmentRequests, useApprovalLogs } from '../hooks/useSupabase';
import { BUSINESS_CASE_TYPES } from '../lib/supabase';

interface ApprovalTimeData {
  level: number;
  businessCaseType: string;
  averageTime: number;
  requestCount: number;
  fastCount: number;
  averageCount: number;
  slowCount: number;
  bottleneckScore: number;
}

interface RequestTimelineData {
  requestId: string;
  projectTitle: string;
  businessCaseTypes: string[];
  totalTime: number;
  levelTimes: Array<{
    level: number;
    time: number;
    status: 'fast' | 'average' | 'slow';
    bottleneck: boolean;
  }>;
  status: string;
  department: string;
}

const ApprovalTimeTracker: React.FC = () => {
  const { requests, loading: requestsLoading } = useInvestmentRequests();
  const { logs, loading: logsLoading } = useApprovalLogs();
  const [selectedBusinessCase, setSelectedBusinessCase] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180' | '365'>('90');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Calculate approval time data
  const approvalTimeData = useMemo(() => {
    if (!requests.length || !logs.length) return [];

    const data: ApprovalTimeData[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

    // Group by business case type and level
    const groupedData: Record<string, Record<number, number[]>> = {};

    requests.forEach(request => {
      if (new Date(request.submitted_date) < cutoffDate) return;
      
      const businessCaseTypes = request.business_case_type || ['Unspecified'];
      const requestLogs = logs
        .filter(log => log.request_id === request.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (requestLogs.length === 0) return;

      // Calculate time at each level
      const levelTimes: Record<number, number> = {};
      let previousTime = new Date(request.submitted_date).getTime();

      requestLogs.forEach((log, index) => {
        const currentTime = new Date(log.timestamp).getTime();
        const timeAtLevel = Math.round((currentTime - previousTime) / (1000 * 60 * 60 * 24)); // days
        
        if (timeAtLevel > 0) {
          levelTimes[log.level] = timeAtLevel;
        }
        previousTime = currentTime;
      });

      // Add data for each business case type
      businessCaseTypes.forEach(businessCaseType => {
        if (!groupedData[businessCaseType]) {
          groupedData[businessCaseType] = {};
        }

        Object.entries(levelTimes).forEach(([level, time]) => {
          const levelNum = parseInt(level);
          if (!groupedData[businessCaseType][levelNum]) {
            groupedData[businessCaseType][levelNum] = [];
          }
          groupedData[businessCaseType][levelNum].push(time);
        });
      });
    });

    // Calculate statistics for each group
    Object.entries(groupedData).forEach(([businessCaseType, levels]) => {
      Object.entries(levels).forEach(([level, times]) => {
        const levelNum = parseInt(level);
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        // Define thresholds for fast/average/slow
        const fastThreshold = 2; // days
        const slowThreshold = 7; // days
        
        const fastCount = times.filter(time => time <= fastThreshold).length;
        const slowCount = times.filter(time => time >= slowThreshold).length;
        const averageCount = times.length - fastCount - slowCount;
        
        // Calculate bottleneck score (higher = more problematic)
        const bottleneckScore = (averageTime * 0.6) + (slowCount / times.length * 40);

        data.push({
          level: levelNum,
          businessCaseType,
          averageTime: Math.round(averageTime * 10) / 10,
          requestCount: times.length,
          fastCount,
          averageCount,
          slowCount,
          bottleneckScore: Math.round(bottleneckScore)
        });
      });
    });

    return data.sort((a, b) => {
      if (a.businessCaseType !== b.businessCaseType) {
        return a.businessCaseType.localeCompare(b.businessCaseType);
      }
      return a.level - b.level;
    });
  }, [requests, logs, timeRange]);

  // Calculate request timeline data
  const requestTimelineData = useMemo(() => {
    if (!requests.length || !logs.length) return [];

    const data: RequestTimelineData[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

    requests.forEach(request => {
      if (new Date(request.submitted_date) < cutoffDate) return;
      if (selectedBusinessCase !== 'All' && !request.business_case_type?.includes(selectedBusinessCase)) return;

      const requestLogs = logs
        .filter(log => log.request_id === request.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (requestLogs.length === 0) return;

      const levelTimes: Array<{ level: number; time: number; status: 'fast' | 'average' | 'slow'; bottleneck: boolean }> = [];
      let previousTime = new Date(request.submitted_date).getTime();
      let totalTime = 0;

      requestLogs.forEach(log => {
        const currentTime = new Date(log.timestamp).getTime();
        const timeAtLevel = Math.round((currentTime - previousTime) / (1000 * 60 * 60 * 24));
        
        if (timeAtLevel > 0) {
          totalTime += timeAtLevel;
          
          // Determine status
          let status: 'fast' | 'average' | 'slow' = 'average';
          if (timeAtLevel <= 2) status = 'fast';
          else if (timeAtLevel >= 7) status = 'slow';

          levelTimes.push({
            level: log.level,
            time: timeAtLevel,
            status,
            bottleneck: false // Will be calculated below
          });
        }
        previousTime = currentTime;
      });

      // Identify bottlenecks (levels that took significantly longer than others)
      if (levelTimes.length > 1) {
        const maxTime = Math.max(...levelTimes.map(lt => lt.time));
        levelTimes.forEach(lt => {
          lt.bottleneck = lt.time === maxTime && lt.time >= 5; // Bottleneck if longest and >= 5 days
        });
      }

      data.push({
        requestId: request.id,
        projectTitle: request.project_title,
        businessCaseTypes: request.business_case_type || [],
        totalTime,
        levelTimes,
        status: request.status,
        department: request.department
      });
    });

    return data.sort((a, b) => b.totalTime - a.totalTime);
  }, [requests, logs, timeRange, selectedBusinessCase]);

  // Filter data for display
  const filteredData = selectedBusinessCase === 'All' 
    ? approvalTimeData 
    : approvalTimeData.filter(d => d.businessCaseType === selectedBusinessCase);

  // Chart data for average times by level
  const chartData = useMemo(() => {
    const levelData: Record<number, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!levelData[item.level]) {
        levelData[item.level] = {};
      }
      levelData[item.level][item.businessCaseType] = item.averageTime;
    });

    return Object.entries(levelData).map(([level, businessCases]) => ({
      level: `Level ${level}`,
      ...businessCases
    }));
  }, [filteredData]);

  // Get performance badge
  const getPerformanceBadge = (averageTime: number, slowCount: number, totalCount: number) => {
    const slowPercentage = (slowCount / totalCount) * 100;
    
    if (averageTime <= 3 && slowPercentage <= 10) {
      return { label: 'Fast', color: 'bg-green-100 text-green-800 border-green-200', icon: <Zap className="w-3 h-3" /> };
    } else if (averageTime <= 6 && slowPercentage <= 25) {
      return { label: 'Average', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Clock className="w-3 h-3" /> };
    } else {
      return { label: 'Slow', color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertTriangle className="w-3 h-3" /> };
    }
  };

  // Get bottleneck indicator
  const getBottleneckIndicator = (bottleneckScore: number) => {
    if (bottleneckScore >= 30) {
      return { label: 'High Bottleneck', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
    } else if (bottleneckScore >= 15) {
      return { label: 'Medium Bottleneck', color: 'text-yellow-600', icon: <Clock className="w-4 h-4" /> };
    } else {
      return { label: 'Low Bottleneck', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> };
    }
  };

  if (requestsLoading || logsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading approval time data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-xl font-bold">Approval Time Tracker</h3>
              <p className="text-indigo-100">Monitor approval bottlenecks and processing times</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {filteredData.length > 0 
                ? Math.round(filteredData.reduce((sum, d) => sum + d.averageTime, 0) / filteredData.length * 10) / 10
                : 0
              }
            </div>
            <div className="text-indigo-100 text-sm">Avg Days</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h4 className="text-lg font-semibold text-gray-900">Filters</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Case Type</label>
            <select
              value={selectedBusinessCase}
              onChange={(e) => setSelectedBusinessCase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Business Cases</option>
              {BUSINESS_CASE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Focus Level</label>
            <select
              value={selectedLevel || ''}
              onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="1">Level 1 (Manager)</option>
              <option value="2">Level 2 (Director)</option>
              <option value="3">Level 3 (CFO)</option>
              <option value="4">Level 4 (CEO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredData.length > 0 
                  ? Math.round(filteredData.reduce((sum, d) => sum + d.averageTime, 0) / filteredData.length * 10) / 10
                  : 0
                } days
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fast Approvals</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredData.reduce((sum, d) => sum + d.fastCount, 0)}
              </p>
              <p className="text-xs text-gray-500">≤ 2 days</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Slow Approvals</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {filteredData.reduce((sum, d) => sum + d.slowCount, 0)}
              </p>
              <p className="text-xs text-gray-500">≥ 7 days</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bottlenecks</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {filteredData.filter(d => d.bottleneckScore >= 30).length}
              </p>
              <p className="text-xs text-gray-500">High impact</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-xl">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Average Processing Time by Level</h4>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value} days`, name]}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                {BUSINESS_CASE_TYPES.map((type, index) => (
                  <Bar 
                    key={type.value}
                    dataKey={type.value} 
                    fill={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                    name={type.label}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Approval Level Performance</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Case
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bottleneck Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData
                .filter(item => selectedLevel === null || item.level === selectedLevel)
                .map((item, index) => {
                  const performanceBadge = getPerformanceBadge(item.averageTime, item.slowCount, item.requestCount);
                  const bottleneckIndicator = getBottleneckIndicator(item.bottleneckScore);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                            <span className="text-sm font-bold">{item.level}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">Level {item.level}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {item.businessCaseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.averageTime} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${performanceBadge.color}`}>
                          {performanceBadge.icon}
                          <span className="ml-1">{performanceBadge.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span>{item.fastCount}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                            <span>{item.averageCount}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                            <span>{item.slowCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${bottleneckIndicator.color}`}>
                          {bottleneckIndicator.icon}
                          <span className="ml-1 text-sm font-medium">{bottleneckIndicator.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.requestCount}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Timeline Analysis */}
      {requestTimelineData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900">Request Timeline Analysis</h4>
            <p className="text-sm text-gray-600">Individual request processing times with bottleneck identification</p>
          </div>
          <div className="p-6 space-y-4">
            {requestTimelineData.slice(0, 10).map((request) => (
              <div key={request.requestId} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedRequest(
                    expandedRequest === request.requestId ? null : request.requestId
                  )}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mr-4">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{request.projectTitle}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{request.department}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm font-medium text-indigo-600">{request.totalTime} days total</span>
                        {request.levelTimes.some(lt => lt.bottleneck) && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-red-600 font-medium">Bottleneck detected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {request.businessCaseTypes.slice(0, 2).map((type) => (
                        <span key={type} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {type}
                        </span>
                      ))}
                      {request.businessCaseTypes.length > 2 && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          +{request.businessCaseTypes.length - 2}
                        </span>
                      )}
                    </div>
                    {expandedRequest === request.requestId ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>
                
                {expandedRequest === request.requestId && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="mt-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-3">Level Processing Times</h6>
                      <div className="space-y-2">
                        {request.levelTimes.map((levelTime, index) => {
                          const statusColor = {
                            fast: 'bg-green-100 text-green-800',
                            average: 'bg-blue-100 text-blue-800',
                            slow: 'bg-red-100 text-red-800'
                          }[levelTime.status];
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div className="flex items-center">
                                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                                  <span className="text-sm font-bold">{levelTime.level}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Level {levelTime.level}</span>
                                {levelTime.bottleneck && (
                                  <div className="ml-2 flex items-center text-red-600">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    <span className="text-xs font-medium">Bottleneck</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{levelTime.time} days</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                                  {levelTime.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTimeTracker;