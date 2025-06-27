import {
  AlertCircle,
  Bell,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useInvestmentRequests } from '../hooks/useSupabase';
import { formatCurrency, InvestmentRequest } from '../lib/supabase';
import StyledDropdown from './StyledDropdown';

const DraftManager: React.FC = () => {
  const navigate = useNavigate();
  const { fetchDrafts, deleteDraft, completeDraft } = useInvestmentRequests();
  const { notifications } = useNotifications();
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedDraft, setSelectedDraft] = useState<InvestmentRequest | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const userDrafts = await fetchDrafts();
      setDrafts(userDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      setDeletingDraft(draftId);
      await deleteDraft(draftId);
      setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
      setShowDeleteModal(false);
      setSelectedDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    } finally {
      setDeletingDraft(null);
    }
  };

  const handleCompleteDraft = async (draft: InvestmentRequest) => {
    try {
      await completeDraft(draft.id, {
        status: 'Submitted',
        submitted_date: new Date().toISOString(),
      });
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      // Optionally redirect to approval tracker or show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete draft');
    }
  };

  const handleEditDraft = (draft: InvestmentRequest) => {
    // Store the draft in sessionStorage for the SubmitRequest component to access
    sessionStorage.setItem('editingDraft', JSON.stringify(draft));
    navigate('/app/submit');
  };

  const handleNewRequest = () => {
    // Clear any stored draft
    sessionStorage.removeItem('editingDraft');
    navigate('/app/submit');
  };

  const filteredDrafts = drafts.filter((draft) => {
    const matchesSearch =
      draft.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.objective.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === 'All' || draft.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

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

  const getBusinessCaseIcons = (businessCaseTypes: string[] = []) => {
    return businessCaseTypes.map((type, index) => (
      <span
        key={index}
        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-1"
      >
        {type}
      </span>
    ));
  };

  // Helper function to check if a draft has unread notifications
  const hasUnreadNotifications = (draftId: string) => {
    return notifications.some(
      (notification: any) =>
        notification.request_id === draftId && !notification.read,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Draft Manager</h1>
            <p className="text-blue-100">
              Manage and complete your saved investment request drafts
            </p>
            {profile && (
              <div className="mt-2 text-blue-200">
                Managing drafts for:{' '}
                <span className="font-semibold">{profile.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleNewRequest}
            className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
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
                placeholder="Search drafts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="md:w-48">
            <StyledDropdown
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="All Departments"
            >
              <option value="All">All Departments</option>
              <option value="IT">IT</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Facilities">Facilities</option>
              <option value="Logistics">Logistics</option>
              <option value="R&D">R&D</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </StyledDropdown>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Drafts ({filteredDrafts.length})
          </h2>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No drafts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || departmentFilter !== 'All'
                ? 'No drafts match your current filters.'
                : "You haven't created any drafts yet."}
            </p>
            <button
              onClick={handleNewRequest}
              className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Draft
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {draft.project_title}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          draft.priority,
                        )}`}
                      >
                        {draft.priority}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        Draft
                      </span>
                      {hasUnreadNotifications(draft.id) && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          <Bell className="w-3 h-3 mr-1" />
                          Updates
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {draft.objective}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.department}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        {formatCurrency(
                          draft.capex + draft.opex,
                          draft.currency,
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.start_year} - {draft.end_year}
                      </div>
                    </div>

                    {draft.business_case_type &&
                      draft.business_case_type.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Business Case Types:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {getBusinessCaseIcons(draft.business_case_type)}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center text-xs text-gray-500">
                      <span>
                        Last updated:{' '}
                        {new Date(draft.last_updated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditDraft(draft)}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleCompleteDraft(draft)}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Submit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDraft(draft);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Draft
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedDraft.project_title}"?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDraft(selectedDraft.id)}
                disabled={deletingDraft === selectedDraft.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingDraft === selectedDraft.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftManager;
