import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Lightbulb,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  FileText,
  Sparkles
} from 'lucide-react';
import { 
  AIInsight, 
  DelayPrediction, 
  BusinessCaseOptimization, 
  CapExPhasing,
  generateInsights,
  predictDelay,
  optimizeBusinessCase,
  optimizeCapExPhasing
} from '../lib/aiInsights';
import { InvestmentRequest, ApprovalLog, KPI } from '../lib/supabase';

interface AIInsightsProps {
  request: InvestmentRequest;
  allRequests: InvestmentRequest[];
  approvalLogs: ApprovalLog[];
  kpis: KPI[];
  onApplyOptimization?: (optimization: any) => void;
}

const AIInsights: React.FC<AIInsightsProps> = ({
  request,
  allRequests,
  approvalLogs,
  kpis,
  onApplyOptimization
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [delayPrediction, setDelayPrediction] = useState<DelayPrediction | null>(null);
  const [businessCaseOpt, setBusinessCaseOpt] = useState<BusinessCaseOptimization | null>(null);
  const [capexPhasing, setCapexPhasing] = useState<CapExPhasing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'optimizations'>('insights');

  useEffect(() => {
    analyzeRequest();
  }, [request, allRequests, approvalLogs, kpis]);

  const analyzeRequest = async () => {
    setLoading(true);
    
    try {
      // Generate AI insights
      const generatedInsights = generateInsights(request, allRequests, approvalLogs, kpis);
      setInsights(generatedInsights);

      // Predict delays
      const prediction = predictDelay(request, allRequests, approvalLogs);
      setDelayPrediction(prediction);

      // Business case optimization
      const businessOpt = optimizeBusinessCase(request);
      setBusinessCaseOpt(businessOpt);

      // CapEx phasing optimization
      const phasing = optimizeCapExPhasing(request);
      setCapexPhasing(phasing);

    } catch (error) {
      console.error('Error analyzing request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'improvement': return <TrendingUp className="w-5 h-5" />;
      case 'prediction': return <Clock className="w-5 h-5" />;
      case 'optimization': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'process': return <BarChart3 className="w-4 h-4" />;
      case 'compliance': return <Shield className="w-4 h-4" />;
      case 'strategic': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleApplyOptimization = (optimization: any) => {
    if (onApplyOptimization) {
      onApplyOptimization(optimization);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing with AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600">Intelligent analysis and optimization recommendations</p>
            </div>
          </div>
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-700">
              {insights.length} insights found
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'insights', name: 'Insights', icon: Lightbulb, count: insights.length },
            { id: 'predictions', name: 'Predictions', icon: Clock, count: delayPrediction ? 1 : 0 },
            { id: 'optimizations', name: 'Optimizations', icon: Target, count: (businessCaseOpt?.suggestedTypes.length || 0) + (capexPhasing?.suggestedPhases.length || 0) }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">All Good!</p>
                <p>No critical issues found with this investment request.</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                    insight.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    insight.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    insight.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-3 ${
                        insight.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        insight.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getTypeIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(insight.severity)}`}>
                            {insight.severity}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            {getCategoryIcon(insight.category)}
                            <span className="ml-1">{insight.category}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                        
                        {expandedInsight === insight.id && (
                          <div className="mt-3 space-y-3">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <h5 className="font-medium text-gray-900 mb-1">Recommendation</h5>
                              <p className="text-sm text-gray-700">{insight.recommendation}</p>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <h5 className="font-medium text-gray-900 mb-1">Impact</h5>
                              <p className="text-sm text-gray-700">{insight.impact}</p>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <span>Confidence: {insight.confidence}%</span>
                                {insight.estimatedTimeToImplement && (
                                  <span className="ml-4">Time: {insight.estimatedTimeToImplement}</span>
                                )}
                              </div>
                              {insight.potentialSavings && (
                                <span className="text-green-600 font-medium">
                                  Potential savings: ${insight.potentialSavings.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setExpandedInsight(
                        expandedInsight === insight.id ? null : insight.id
                      )}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedInsight === insight.id ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && delayPrediction && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900">Approval Delay Prediction</h4>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {delayPrediction.confidence}% confidence
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {delayPrediction.predictedDelayDays}
                  </div>
                  <div className="text-sm text-gray-600">Predicted delay (days)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {delayPrediction.similarCases}
                  </div>
                  <div className="text-sm text-gray-600">Similar cases analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {delayPrediction.riskFactors.length}
                  </div>
                  <div className="text-sm text-gray-600">Risk factors identified</div>
                </div>
              </div>

              {delayPrediction.riskFactors.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Risk Factors</h5>
                  <ul className="space-y-1">
                    {delayPrediction.riskFactors.map((factor, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {delayPrediction.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {delayPrediction.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optimizations Tab */}
        {activeTab === 'optimizations' && (
          <div className="space-y-6">
            {/* Business Case Optimization */}
            {businessCaseOpt && businessCaseOpt.suggestedTypes.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Target className="w-6 h-6 text-green-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">Business Case Optimization</h4>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {businessCaseOpt.confidenceScore}% confidence
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{businessCaseOpt.reasoning}</p>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Suggested Additional Business Case Types</h5>
                  <div className="flex flex-wrap gap-2">
                    {businessCaseOpt.suggestedTypes.map((type) => (
                      <span key={type} className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {businessCaseOpt.potentialBenefits.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Potential Benefits</h5>
                    <ul className="space-y-1">
                      {businessCaseOpt.potentialBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleApplyOptimization({
                    type: 'businessCase',
                    data: businessCaseOpt
                  })}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Optimization
                </button>
              </div>
            )}

            {/* CapEx Phasing Optimization */}
            {capexPhasing && capexPhasing.suggestedPhases.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 text-purple-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">CapEx Phasing Optimization</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-600 font-medium">
                      ${capexPhasing.totalSavings.toLocaleString()} potential savings
                    </div>
                    <div className="text-xs text-gray-600">
                      {capexPhasing.riskReduction}% risk reduction
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  {capexPhasing.suggestedPhases.map((phase) => (
                    <div key={phase.phase} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          Phase {phase.phase} - {phase.year}
                        </h5>
                        <span className="text-lg font-bold text-purple-600">
                          ${phase.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{phase.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {phase.benefits.map((benefit, index) => (
                          <span key={index} className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleApplyOptimization({
                    type: 'capexPhasing',
                    data: capexPhasing
                  })}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Phasing
                </button>
              </div>
            )}

            {(!businessCaseOpt?.suggestedTypes.length && !capexPhasing?.suggestedPhases.length) && (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-2">Optimally Configured</p>
                <p>No optimization opportunities identified for this request.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;