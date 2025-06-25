import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  DollarSign,
  Building,
  MapPin,
  Target,
  TrendingUp,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Pause,
  MessageSquare,
  Shield,
  ArrowRight,
  Users,
  Brain,
  Sparkles
} from 'lucide-react';
import { useInvestmentRequests, useApprovalLogs, useKPIs, useApprovalMatrix } from '../hooks/useSupabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../lib/supabase';
import AIInsights from './AIInsights';

const ApprovalTracker: React.FC = () => {
  const { requests, loading: requestsLoading, updateRequest } = useInvestmentRequests();
  const { logs, loading: logsLoading, addLog } = useApprovalLogs();
  const { kpis, loading: kpisLoading } = useKPIs();
  const { matrix, loading: matrixLoading } = useApprovalMatrix();
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'hold'>('approve');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (requestsLoading || logsLoading || kpisLoading || matrixLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get user's approval level and role
  const getUserApprovalLevel = () => {
    if (!profile) return null;
    if (profile.role === 'Admin') return 0; // Admin can approve anything
    const match = profile.role.match(/Approver_L(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const userLevel = getUserApprovalLevel();

  // Get approval matrix rules for user
  const getUserApprovalRules = () => {
    if (!profile || !matrix) return [];
    return matrix.filter(rule => 
      rule.role === profile.role && 
      rule.active &&
      (rule.department === 'All' || rule.department === profile.department)
    );
  };

  const userApprovalRules = getUserApprovalRules();

  // Check if user can approve a specific request
  const canUserApprove = (request: any) => {
    if (!profile || !userLevel) return false;
    
    // Admin can approve anything
    if (profile.role === 'Admin') return true;
    
    // Check if request is at the user's approval level
    const expectedStatus = `Pending - Level ${userLevel}`;
    if (request.status !== expectedStatus && request.status !== 'Submitted') return false;
    
    // Check amount limits using base currency (USD)
    const totalAmount = request.base_currency_capex + request.base_currency_opex;
    return userApprovalRules.some(rule => 
      totalAmount >= rule.amount_min && 
      totalAmount <= rule.amount_max
    );
  };

  // Get next approval level
  const getNextApprovalLevel = (currentLevel: number) => {
    const nextLevel = currentLevel + 1;
    const nextLevelRule = matrix.find(rule => 
      rule.level === nextLevel && 
      rule.active
    );
    return nextLevelRule ? nextLevel : null;
  };

  // Filter requests based on user's role and permissions
  const getFilteredRequests = () => {
    let filtered = requests;

    // Filter by user's approval permissions
    if (profile?.role !== 'Admin') {
      filtered = requests.filter(request => {
        // Show requests user submitted
        if (request.user_id === user?.id) return true;
        
        // Show requests user can approve
        if (canUserApprove(request)) return true;
        
        // Show requests user has already acted on
        const userLogs = logs.filter(log => 
          log.request_id === request.id && 
          log.user_id === user?.id
        );
        if (userLogs.length > 0) return true;
        
        return false;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.submitted_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'On Hold':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review':
      case 'Pending - Level 1':
      case 'Pending - Level 2':
      case 'Pending - Level 3':
      case 'Pending - Level 4':
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

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Draft':
        return 10;
      case 'Submitted':
        return 25;
      case 'Pending - Level 1':
        return 35;
      case 'Pending - Level 2':
        return 50;
      case 'Pending - Level 3':
        return 65;
      case 'Pending - Level 4':
        return 80;
      case 'Under Review':
        return 50;
      case 'Approved':
        return 100;
      case 'Rejected':
        return 100;
      case 'On Hold':
        return 40;
      default:
        return 0;
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedRequest || !profile || !user) return;
    
    setIsSubmitting(true);
    try {
      const request = requests.find(r => r.id === selectedRequest);
      if (!request) return;

      // Create approval log entry
      const logData = {
        request_id: selectedRequest,
        approved_by: profile.name,
        role: profile.role,
        level: userLevel || 0,
        status: approvalAction === 'approve' ? 'Approved' : 
                approvalAction === 'reject' ? 'Rejected' : 'On Hold',
        comments: comments || null,
        timestamp: new Date().toISOString(),
        user_id: user.id
      };

      await addLog(logData);

      // Update request status
      let newStatus = request.status;
      
      if (approvalAction === 'approve') {
        const nextLevel = getNextApprovalLevel(userLevel || 0);
        if (nextLevel) {
          newStatus = `Pending - Level ${nextLevel}`;
        } else {
          newStatus = 'Approved';
        }
      } else if (approvalAction === 'reject') {
        newStatus = 'Rejected';
      } else if (approvalAction === 'hold') {
        newStatus = 'On Hold';
      }

      await updateRequest(selectedRequest, { 
        status: newStatus,
        last_updated: new Date().toISOString()
      });

      // Reset modal state
      setShowApprovalModal(false);
      setComments('');
      setApprovalAction('approve');
      
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRequestData = selectedRequest ? 
    requests.find(r => r.id === selectedRequest) : null;
  
  const relatedLogs = selectedRequest ? 
    logs.filter(log => log.request_id === selectedRequest) : [];

  const requestKPIs = selectedRequest ? 
    kpis.filter(kpi => kpi.request_id === selectedRequest) : [];

  const hasUserActedOnRequest = (requestId: string) => {
    return logs.some(log => 
      log.request_id === requestId && 
      log.user_id === user?.id
    );
  };

  const showAIInsightsForRequest = (request: any) => {
    setSelectedRequest(request.id);
    setShowAIInsights(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Approval Tracker</h1>
        <p className="text-indigo-100">Monitor and approve investment requests with AI-powered insights</p>
        {profile && (
          <div className="mt-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            <span className="font-semibold">{profile.role}</span>
            {userLevel && (
              <span className="ml-2 text-indigo-200">• Level {userLevel} Approver</span>
            )}
          </div>
        )}
      </div>

      {/* AI Insights Modal */}
      {showAIInsights && selectedRequestData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">AI Insights for {selectedRequestData.project_title}</h3>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <AIInsights
                request={selectedRequestData}
                allRequests={requests}
                approvalLogs={logs}
                kpis={kpis}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by project title, ID, or requestor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending - Level 1">Pending - Level 1</option>
              <option value="Pending - Level 2">Pending - Level 2</option>
              <option value="Pending - Level 3">Pending - Level 3</option>
              <option value="Pending - Level 4">Pending - Level 4</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredRequests.map((request) => {
            const canApprove = canUserApprove(request);
            const hasActed = hasUserActedOnRequest(request.id);
            const isOwner = request.user_id === user?.id;
            
            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
                  selectedRequest === request.id ? 'border-blue-500 shadow-md' : 'border-gray-100'
                }`}
                onClick={() => setSelectedRequest(request.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(request.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{request.project_title}</h3>
                        {canApprove && !hasActed && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Action Required
                          </span>
                        )}
                        {isOwner && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Your Request
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.department} • {request.category}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(request.capex + request.opex, request.currency)}
                      </div>
                      <div className="text-sm text-gray-500">Total Cost</div>
                      {request.currency !== 'USD' && (
                        <div className="text-xs text-gray-400">
                          ≈ ${(request.base_currency_capex + request.base_currency_opex).toLocaleString()} USD
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {request.legal_entity}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {request.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.is_in_budget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {request.is_in_budget ? 'In Budget' : 'Out of Budget'}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {request.currency}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      {request.submitted_by}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{getProgressPercentage(request.status)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          request.status === 'Approved' ? 'bg-green-500' :
                          request.status === 'Rejected' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${getProgressPercentage(request.status)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(request.submitted_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {request.purpose}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showAIInsightsForRequest(request);
                        }}
                        className="flex items-center px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                      >
                        <Brain className="w-3 h-3 mr-1" />
                        AI Insights
                      </button>
                      {canApprove && !hasActed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request.id);
                            setShowApprovalModal(true);
                          }}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Approve/Reject
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No investment requests found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Request Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {selectedRequestData ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => showAIInsightsForRequest(selectedRequestData)}
                    className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Insights
                  </button>
                  {canUserApprove(selectedRequestData) && !hasUserActedOnRequest(selectedRequestData.id) && (
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Take Action
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Title</label>
                  <p className="text-gray-900 font-medium">{selectedRequestData.project_title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Objective</label>
                  <p className="text-gray-900">{selectedRequestData.objective}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Request ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedRequestData.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">CapEx</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedRequestData.capex, selectedRequestData.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">OpEx</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedRequestData.opex, selectedRequestData.currency)}
                    </p>
                  </div>
                </div>

                {selectedRequestData.currency !== 'USD' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="text-sm font-medium text-blue-700">USD Equivalent (for approval)</label>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <div>
                        <p className="text-blue-900 font-semibold">
                          ${selectedRequestData.base_currency_capex.toLocaleString()} CapEx
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-900 font-semibold">
                          ${selectedRequestData.base_currency_opex.toLocaleString()} OpEx
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Exchange rate: 1 {selectedRequestData.currency} = {(1 / selectedRequestData.exchange_rate).toFixed(6)} USD
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Legal Entity</label>
                  <p className="text-gray-900">{selectedRequestData.legal_entity}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{selectedRequestData.location}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Purpose</label>
                  <p className="text-gray-900">{selectedRequestData.purpose}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Description</label>
                  <p className="text-gray-900 text-sm">{selectedRequestData.description}</p>
                </div>

                {/* Business Case Types */}
                {selectedRequestData.business_case_type && selectedRequestData.business_case_type.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Business Case Types</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequestData.business_case_type.map((caseType) => (
                        <span key={caseType} className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {caseType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Checklist */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Compliance Checklist</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`flex items-center ${selectedRequestData.strategic_fit ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.strategic_fit ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Strategic Fit
                    </div>
                    <div className={`flex items-center ${selectedRequestData.risk_assessment ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.risk_assessment ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Risk Assessment
                    </div>
                    <div className={`flex items-center ${selectedRequestData.supply_plan ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.supply_plan ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Supply Plan
                    </div>
                    <div className={`flex items-center ${selectedRequestData.legal_fit ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.legal_fit ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Legal Fit
                    </div>
                    <div className={`flex items-center ${selectedRequestData.it_fit ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.it_fit ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      IT Fit
                    </div>
                    <div className={`flex items-center ${selectedRequestData.hsseq_compliance ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedRequestData.hsseq_compliance ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      HSSEQ Compliance
                    </div>
                  </div>
                </div>
              </div>
              
              {/* KPIs */}
              {requestKPIs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Key Performance Indicators</h4>
                  <div className="space-y-3">
                    {requestKPIs.map((kpi) => (
                      <div key={kpi.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">IRR:</span>
                            <div className="font-semibold text-gray-900">{kpi.irr}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">NPV:</span>
                            <div className="font-semibold text-gray-900">${kpi.npv.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Payback:</span>
                            <div className="font-semibold text-gray-900">{kpi.payback_period} years</div>
                          </div>
                        </div>
                        {kpi.basis_of_calculation && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Basis:</span> {kpi.basis_of_calculation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Approval History */}
              {relatedLogs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Approval History</h4>
                  <div className="space-y-3">
                    {relatedLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {log.status === 'Approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {log.status === 'Rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                          {log.status === 'Under Review' && <Clock className="w-5 h-5 text-blue-600" />}
                          {log.status === 'On Hold' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{log.approved_by}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">{log.role} - Level {log.level}</p>
                          <p className="text-sm font-medium text-gray-900">{log.status}</p>
                          {log.comments && (
                            <p className="text-sm text-gray-600 mt-1">{log.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a request to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequestData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approval Action: {selectedRequestData.project_title}
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Total Amount: {formatCurrency(selectedRequestData.capex + selectedRequestData.opex, selectedRequestData.currency)}
              </p>
              {selectedRequestData.currency !== 'USD' && (
                <p className="text-sm text-gray-600 mb-2">
                  USD Equivalent: ${(selectedRequestData.base_currency_capex + selectedRequestData.base_currency_opex).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-600">Your Role: {profile?.role}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Action</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={approvalAction === 'approve'}
                    onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'hold')}
                    className="mr-3"
                  />
                  <ThumbsUp className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700 font-medium">Approve</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={approvalAction === 'reject'}
                    onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'hold')}
                    className="mr-3"
                  />
                  <ThumbsDown className="w-4 h-4 mr-2 text-red-600" />
                  <span className="text-red-700 font-medium">Reject</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="hold"
                    checked={approvalAction === 'hold'}
                    onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'hold')}
                    className="mr-3"
                  />
                  <Pause className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Put on Hold</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {approvalAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  approvalAction === 'approve' ? 'Optional: Add approval comments...' :
                  approvalAction === 'reject' ? 'Required: Explain reason for rejection...' :
                  'Optional: Explain reason for hold...'
                }
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setComments('');
                  setApprovalAction('approve');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
                disabled={isSubmitting || (approvalAction === 'reject' && !comments.trim())}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  approvalAction === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `${approvalAction === 'approve' ? 'Approve' : approvalAction === 'reject' ? 'Reject' : 'Hold'} Request`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTracker;