import {
  BarChart3,
  Bell,
  Database,
  DollarSign,
  Edit,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { UserProfile } from '../contexts/AuthContext';
import {
  useApprovalMatrix,
  useInvestmentRequests,
  useKPIs,
  useUserManagement,
} from '../hooks/useSupabase';
import { NotificationManager } from '../lib/notificationManager';
import { NotificationService } from '../lib/notifications';
import { ApprovalMatrix } from '../lib/supabase';
import StyledDropdown from './StyledDropdown';

const AdminPanel: React.FC = () => {
  const { requests } = useInvestmentRequests();
  const { matrix, updateMatrix } = useApprovalMatrix();
  const { kpis } = useKPIs();
  const {
    users,
    loading: usersLoading,
    createDemoUser,
    updateUser,
    toggleUserStatus,
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState('matrix');
  const [editingMatrix, setEditingMatrix] = useState<string | null>(null);
  const [newMatrix, setNewMatrix] = useState<Partial<ApprovalMatrix>>({});

  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'Submitter',
    department: 'General',
  });
  const [editingUserData, setEditingUserData] = useState<Partial<UserProfile>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const tabs = [
    { id: 'matrix', name: 'Approval Matrix', icon: Shield },
    { id: 'kpis', name: 'KPI Management', icon: TrendingUp },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'roi-impact', name: 'ROI Impact', icon: BarChart3 },
    { id: 'settings', name: 'System Settings', icon: Settings },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
  ];

  const handleEditMatrix = (matrixItem: ApprovalMatrix) => {
    setEditingMatrix(matrixItem.id);
    setNewMatrix(matrixItem);
  };

  const handleSaveMatrix = async () => {
    try {
      if (editingMatrix && editingMatrix !== 'new') {
        const updatedMatrix = matrix.map((m) =>
          m.id === editingMatrix ? { ...m, ...newMatrix } : m,
        );
        await updateMatrix(updatedMatrix);
      } else {
        const updatedMatrix = [
          ...matrix,
          {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...newMatrix,
          } as ApprovalMatrix,
        ];
        await updateMatrix(updatedMatrix);
      }
      setEditingMatrix(null);
      setNewMatrix({});
    } catch (error) {
      console.error('Error saving matrix:', error);
    }
  };

  const handleDeleteMatrix = async (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this approval level?')
    ) {
      try {
        const updatedMatrix = matrix.filter((m) => m.id !== id);
        await updateMatrix(updatedMatrix);
      } catch (error) {
        console.error('Error deleting matrix:', error);
      }
    }
  };

  // User management functions
  const handleCreateUser = async () => {
    try {
      await createDemoUser(newUser);
      setShowCreateUser(false);
      setNewUser({
        email: '',
        name: '',
        role: 'Submitter',
        department: 'General',
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditingUserData(user);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser, editingUserData);
        setEditingUser(null);
        setEditingUserData({});
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Quick demo user creation for hackathon
  const createDemoUsers = async () => {
    const demoUsers: Array<{
      name: string;
      email: string;
      role:
        | 'Admin'
        | 'Submitter'
        | 'Approver_L1'
        | 'Approver_L2'
        | 'Approver_L3'
        | 'Approver_L4';
      department: string;
    }> = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'Approver_L2',
        department: 'Finance',
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@company.com',
        role: 'Approver_L1',
        department: 'IT',
      },
      {
        name: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@company.com',
        role: 'Submitter',
        department: 'Marketing',
      },
      {
        name: 'David Kim',
        email: 'david.kim@company.com',
        role: 'Approver_L3',
        department: 'Manufacturing',
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@company.com',
        role: 'Submitter',
        department: 'R&D',
      },
    ];

    try {
      for (const userData of demoUsers) {
        await createDemoUser(userData);
      }
    } catch (error) {
      console.error('Error creating demo users:', error);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesDepartment =
      departmentFilter === 'All' || user.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
    byRole: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDepartment: users.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const getStatusStats = () => {
    const stats = requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const getDepartmentStats = () => {
    const stats = requests.reduce((acc, request) => {
      acc[request.department] = (acc[request.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const statusStats = getStatusStats();
  const departmentStats = getDepartmentStats();

  // Calculate system KPIs
  const totalInvestment = requests.reduce(
    (sum, req) => sum + (req.capex + req.opex),
    0,
  );
  const approvedRequests = requests.filter((req) => req.status === 'Approved');
  const approvalRate =
    requests.length > 0 ? (approvedRequests.length / requests.length) * 100 : 0;
  const avgIRR =
    kpis.length > 0
      ? kpis.reduce((sum, kpi) => sum + kpi.irr, 0) / kpis.length
      : 0;
  const inBudgetRequests = requests.filter((req) => req.is_in_budget);

  // Test notification function
  const testRejectionNotification = async () => {
    try {
      // Initialize notification service
      NotificationService.initializeDefault();

      // Create a test request
      const testRequest = {
        id: 'test-request-001',
        project_title: 'Test Project - New Manufacturing Line',
        capex: 500000,
        opex: 100000,
        currency: 'USD',
        department: 'Manufacturing',
        submitted_by: 'John Doe',
      };

      const rejectedBy = {
        name: 'Sarah Johnson',
        role: 'Approver_L2',
      };

      const rejectionComments =
        'This is a test rejection notification. The project requires additional financial analysis and risk assessment before approval.';

      // Send rejection notification
      const result = await NotificationService.sendRejectionNotification(
        testRequest,
        rejectedBy,
        rejectionComments,
        2, // Current level
      );

      if (result) {
        alert(
          '✅ Test rejection notification sent successfully!\n\nNote: In development mode, notifications are logged to console only.',
        );
      } else {
        alert(
          '⚠️ Test rejection notification failed.\n\nThis is expected if no next approver is found in the approval matrix or if notification services are not configured.\n\nCheck the browser console for detailed logs.',
        );
      }
    } catch (error) {
      console.error('Test notification error:', error);
      alert(
        `❌ Test notification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }\n\nCheck the browser console for detailed error information.`,
      );
    }
  };

  // Test approver notification function
  const testApproverNotification = async () => {
    try {
      console.log('Testing approver notification system...');

      // Test the NotificationManager.notifyApprovers function
      await NotificationManager.notifyApprovers(
        'test-request-002',
        'Test Project - Notification System',
        250000, // Medium priority amount
        'USD',
        'Test User',
        ['ESG', 'Cost Control'],
      );

      alert(
        '✅ Test approver notification sent successfully!\n\nCheck the notifications panel to see if approvers received the notification.',
      );
    } catch (error) {
      console.error('Test approver notification error:', error);
      alert(
        `❌ Test approver notification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }\n\nCheck the browser console for detailed error information.`,
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-purple-100">
          Manage system settings, users, and approval workflows
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Approval Matrix Tab */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Approval Matrix Configuration
                </h2>
                <button
                  onClick={() => {
                    setEditingMatrix('new');
                    setNewMatrix({
                      level: matrix.length + 1,
                      role: '',
                      department: 'All',
                      amount_min: 0,
                      amount_max: 0,
                      active: true,
                    });
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Level
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-xl">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matrix.map((matrixItem) => (
                      <tr key={matrixItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingMatrix === matrixItem.id ? (
                            <input
                              type="number"
                              value={newMatrix.level || ''}
                              onChange={(e) =>
                                setNewMatrix({
                                  ...newMatrix,
                                  level: parseInt(e.target.value),
                                })
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            matrixItem.level
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMatrix === matrixItem.id ? (
                            <input
                              type="text"
                              value={newMatrix.role || ''}
                              onChange={(e) =>
                                setNewMatrix({
                                  ...newMatrix,
                                  role: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            matrixItem.role
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMatrix === matrixItem.id ? (
                            <StyledDropdown
                              value={newMatrix.department || ''}
                              onChange={(e) =>
                                setNewMatrix({
                                  ...newMatrix,
                                  department: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="All">All</option>
                              <option value="IT">IT</option>
                              <option value="Manufacturing">
                                Manufacturing
                              </option>
                              <option value="Facilities">Facilities</option>
                              <option value="Logistics">Logistics</option>
                              <option value="R&D">R&D</option>
                              <option value="Sales">Sales</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Finance">Finance</option>
                              <option value="HR">HR</option>
                            </StyledDropdown>
                          ) : (
                            matrixItem.department
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMatrix === matrixItem.id ? (
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                value={newMatrix.amount_min || ''}
                                onChange={(e) =>
                                  setNewMatrix({
                                    ...newMatrix,
                                    amount_min: parseInt(e.target.value),
                                  })
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Min"
                              />
                              <input
                                type="number"
                                value={newMatrix.amount_max || ''}
                                onChange={(e) =>
                                  setNewMatrix({
                                    ...newMatrix,
                                    amount_max: parseInt(e.target.value),
                                  })
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Max"
                              />
                            </div>
                          ) : (
                            `$${matrixItem.amount_min.toLocaleString()} - $${
                              matrixItem.amount_max === 999999999
                                ? '∞'
                                : matrixItem.amount_max.toLocaleString()
                            }`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              matrixItem.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {matrixItem.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingMatrix === matrixItem.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveMatrix}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMatrix(null);
                                  setNewMatrix({});
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditMatrix(matrixItem)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteMatrix(matrixItem.id)
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {editingMatrix === 'new' && (
                      <tr className="bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <input
                            type="number"
                            value={newMatrix.level || ''}
                            onChange={(e) =>
                              setNewMatrix({
                                ...newMatrix,
                                level: parseInt(e.target.value),
                              })
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Level"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="text"
                            value={newMatrix.role || ''}
                            onChange={(e) =>
                              setNewMatrix({
                                ...newMatrix,
                                role: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Role"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <StyledDropdown
                            value={newMatrix.department || 'All'}
                            onChange={(e) =>
                              setNewMatrix({
                                ...newMatrix,
                                department: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="All">All</option>
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={newMatrix.amount_min || ''}
                              onChange={(e) =>
                                setNewMatrix({
                                  ...newMatrix,
                                  amount_min: parseInt(e.target.value),
                                })
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Min"
                            />
                            <input
                              type="number"
                              value={newMatrix.amount_max || ''}
                              onChange={(e) =>
                                setNewMatrix({
                                  ...newMatrix,
                                  amount_max: parseInt(e.target.value),
                                })
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Max"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveMatrix}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMatrix(null);
                                setNewMatrix({});
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KPI Management Tab */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                KPI Management
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Total Investment
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${(totalInvestment / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        Approval Rate
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {approvalRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">
                        Average IRR
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {avgIRR.toFixed(1)}%
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">
                        In Budget
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {inBudgetRequests.length}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Individual Project KPIs */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-md font-semibold text-gray-900">
                    Project KPIs
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IRR (%)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NPV ($)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payback Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Basis of Calculation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kpis.map((kpi) => (
                        <tr key={kpi.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {kpi.request_id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {kpi.irr}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${kpi.npv.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {kpi.payback_period} years
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {kpi.basis_of_calculation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                System Reports
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    Request Status Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(statusStats).map(([status, count]) => (
                      <div
                        key={status}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600">{status}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    Department Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(departmentStats).map(
                      ([department, count]) => (
                        <div
                          key={department}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">
                            {department}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    System Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Requests
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {requests.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Approval Levels
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {matrix.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        In Budget Requests
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {inBudgetRequests.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Investment Value
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${totalInvestment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs placeholders */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  User Management
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={createDemoUsers}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add Demo Users
                  </button>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </button>
                </div>
              </div>

              {/* User Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {userStats.total}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {userStats.active}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Inactive Users
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {userStats.inactive}
                      </p>
                    </div>
                    <UserX className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">
                        Departments
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {Object.keys(userStats.byDepartment).length}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <StyledDropdown
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Submitter">Submitter</option>
                      <option value="Approver_L1">Approver L1</option>
                      <option value="Approver_L2">Approver L2</option>
                      <option value="Approver_L3">Approver L3</option>
                      <option value="Approver_L4">Approver L4</option>
                    </StyledDropdown>
                    <StyledDropdown
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <option value="General">General</option>
                    </StyledDropdown>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUser === user.id ? (
                                <StyledDropdown
                                  value={editingUserData.role || user.role}
                                  onChange={(e) =>
                                    setEditingUserData({
                                      ...editingUserData,
                                      role: e.target.value as
                                        | 'Admin'
                                        | 'Submitter'
                                        | 'Approver_L1'
                                        | 'Approver_L2'
                                        | 'Approver_L3'
                                        | 'Approver_L4',
                                    })
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Submitter">Submitter</option>
                                  <option value="Approver_L1">
                                    Approver L1
                                  </option>
                                  <option value="Approver_L2">
                                    Approver L2
                                  </option>
                                  <option value="Approver_L3">
                                    Approver L3
                                  </option>
                                  <option value="Approver_L4">
                                    Approver L4
                                  </option>
                                </StyledDropdown>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {user.role.replace('_', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUser === user.id ? (
                                <StyledDropdown
                                  value={
                                    editingUserData.department ||
                                    user.department
                                  }
                                  onChange={(e) =>
                                    setEditingUserData({
                                      ...editingUserData,
                                      department: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="IT">IT</option>
                                  <option value="Manufacturing">
                                    Manufacturing
                                  </option>
                                  <option value="Facilities">Facilities</option>
                                  <option value="Logistics">Logistics</option>
                                  <option value="R&D">R&D</option>
                                  <option value="Sales">Sales</option>
                                  <option value="Marketing">Marketing</option>
                                  <option value="Finance">Finance</option>
                                  <option value="HR">HR</option>
                                  <option value="General">General</option>
                                </StyledDropdown>
                              ) : (
                                <span className="text-sm text-gray-900">
                                  {user.department}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  handleToggleUserStatus(user.id, user.active)
                                }
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                  user.active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {user.active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {editingUser === user.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSaveUser}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUser(null);
                                      setEditingUserData({});
                                    }}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {showCreateUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create New User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <StyledDropdown
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Submitter">Submitter</option>
                      <option value="Approver_L1">Approver L1</option>
                      <option value="Approver_L2">Approver L2</option>
                      <option value="Approver_L3">Approver L3</option>
                      <option value="Approver_L4">Approver L4</option>
                      <option value="Admin">Admin</option>
                    </StyledDropdown>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <StyledDropdown
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="General">General</option>
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
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                System Settings
              </h2>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Notification System
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test the rejection notification system to verify it's working
                  correctly.
                </p>
                <button
                  onClick={testRejectionNotification}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Test Rejection Notification
                </button>

                <button
                  onClick={testApproverNotification}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Approver Notification
                </button>
              </div>
            </div>
          )}

          {/* ROI Impact Tracking Tab */}
          {activeTab === 'roi-impact' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  ROI Impact Analysis
                </h2>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Formula:</span> ROI(d) = ROI₀ -
                  (r × d)
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4">ROI Decay Analysis</h3>
                <p className="text-purple-100 mb-4">
                  This analysis shows how approval delays impact project ROI.
                  Each week of delay reduces ROI based on project
                  characteristics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <div className="text-2xl font-bold">Base Decay Rate</div>
                    <div className="text-purple-100">0.75% per week</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <div className="text-2xl font-bold">
                      High Value Projects
                    </div>
                    <div className="text-purple-100">
                      +0.3% additional decay
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <div className="text-2xl font-bold">IPO/Compliance</div>
                    <div className="text-purple-100">
                      +0.5% additional decay
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project ROI Impact Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original ROI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current ROI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ROI Loss
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delay (weeks)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lost Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.slice(0, 5).map((request) => {
                        // Calculate ROI impact for demo
                        const originalROI = 15 + Math.random() * 10; // 15-25% ROI
                        const delayInWeeks = Math.random() * 8; // 0-8 weeks delay
                        const decayRate =
                          0.75 +
                          (request.capex + request.opex > 500000 ? 0.3 : 0) +
                          (request.business_case_type?.includes('IPO')
                            ? 0.5
                            : 0);
                        const roiDecay = decayRate * delayInWeeks;
                        const adjustedROI = Math.max(0, originalROI - roiDecay);
                        const roiLoss = originalROI - adjustedROI;
                        const totalAmount = request.capex + request.opex;
                        const projectedValue =
                          totalAmount * (originalROI / 100);
                        const adjustedValue = totalAmount * (adjustedROI / 100);
                        const lostValue = projectedValue - adjustedValue;

                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {request.project_title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.department}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-semibold text-green-600">
                                {originalROI.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span
                                className={`font-semibold ${
                                  adjustedROI < originalROI * 0.8
                                    ? 'text-red-600'
                                    : 'text-orange-600'
                                }`}
                              >
                                {adjustedROI.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-semibold text-red-600">
                                -{roiLoss.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {delayInWeeks.toFixed(1)} weeks
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-semibold text-red-600">
                                ${lostValue.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : request.status === 'Rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Total Financial Impact
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Lost Value:</span>
                      <span className="text-2xl font-bold text-red-600">
                        $
                        {requests
                          .slice(0, 5)
                          .reduce((sum, req) => {
                            const originalROI = 15 + Math.random() * 10;
                            const delayInWeeks = Math.random() * 8;
                            const decayRate =
                              0.75 + (req.capex + req.opex > 500000 ? 0.3 : 0);
                            const roiDecay = decayRate * delayInWeeks;
                            const adjustedROI = Math.max(
                              0,
                              originalROI - roiDecay,
                            );
                            const totalAmount = req.capex + req.opex;
                            const projectedValue =
                              totalAmount * (originalROI / 100);
                            const adjustedValue =
                              totalAmount * (adjustedROI / 100);
                            return sum + (projectedValue - adjustedValue);
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average ROI Loss:</span>
                      <span className="text-xl font-semibold text-orange-600">
                        -3.2%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Delay:</span>
                      <span className="text-xl font-semibold text-blue-600">
                        4.1 weeks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Decay Rate Factors
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Rate:</span>
                      <span className="font-semibold">0.75% per week</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        High Value (&gt;$500K):
                      </span>
                      <span className="font-semibold text-orange-600">
                        +0.30%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IPO Preparation:</span>
                      <span className="font-semibold text-red-600">+0.50%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Compliance Projects:
                      </span>
                      <span className="font-semibold text-red-600">+0.30%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expansion Projects:</span>
                      <span className="font-semibold text-orange-600">
                        +0.20%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
