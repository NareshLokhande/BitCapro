import React, { useState } from 'react';
import { 
  Settings, 
  Users,
  Shield,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  DollarSign,
  Database
} from 'lucide-react';
import { useInvestmentRequests, useApprovalMatrix, useKPIs } from '../hooks/useSupabase';
import { ApprovalMatrix } from '../lib/supabase';

const AdminPanel: React.FC = () => {
  const { requests } = useInvestmentRequests();
  const { matrix, updateMatrix } = useApprovalMatrix();
  const { kpis } = useKPIs();
  const [activeTab, setActiveTab] = useState('matrix');
  const [editingMatrix, setEditingMatrix] = useState<string | null>(null);
  const [newMatrix, setNewMatrix] = useState<Partial<ApprovalMatrix>>({});

  const tabs = [
    { id: 'matrix', name: 'Approval Matrix', icon: Shield },
    { id: 'kpis', name: 'KPI Management', icon: TrendingUp },
    { id: 'users', name: 'User Management', icon: Users },
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
        const updatedMatrix = matrix.map(m => 
          m.id === editingMatrix ? { ...m, ...newMatrix } : m
        );
        await updateMatrix(updatedMatrix);
      } else {
        const updatedMatrix = [...matrix, { 
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newMatrix 
        } as ApprovalMatrix];
        await updateMatrix(updatedMatrix);
      }
      setEditingMatrix(null);
      setNewMatrix({});
    } catch (error) {
      console.error('Error saving matrix:', error);
    }
  };

  const handleDeleteMatrix = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this approval level?')) {
      try {
        const updatedMatrix = matrix.filter(m => m.id !== id);
        await updateMatrix(updatedMatrix);
      } catch (error) {
        console.error('Error deleting matrix:', error);
      }
    }
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
  const totalInvestment = requests.reduce((sum, req) => sum + (req.capex + req.opex), 0);
  const approvedRequests = requests.filter(req => req.status === 'Approved');
  const approvalRate = requests.length > 0 ? (approvedRequests.length / requests.length) * 100 : 0;
  const avgIRR = kpis.length > 0 ? kpis.reduce((sum, kpi) => sum + kpi.irr, 0) / kpis.length : 0;
  const inBudgetRequests = requests.filter(req => req.is_in_budget);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-purple-100">Manage system settings, users, and approval workflows</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Approval Matrix Configuration</h2>
                <button
                  onClick={() => {
                    setEditingMatrix('new');
                    setNewMatrix({
                      level: matrix.length + 1,
                      role: '',
                      department: 'All',
                      amount_min: 0,
                      amount_max: 0,
                      active: true
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
                              onChange={(e) => setNewMatrix({...newMatrix, level: parseInt(e.target.value)})}
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
                              onChange={(e) => setNewMatrix({...newMatrix, role: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            matrixItem.role
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMatrix === matrixItem.id ? (
                            <select
                              value={newMatrix.department || ''}
                              onChange={(e) => setNewMatrix({...newMatrix, department: e.target.value})}
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
                            </select>
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
                                onChange={(e) => setNewMatrix({...newMatrix, amount_min: parseInt(e.target.value)})}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Min"
                              />
                              <input
                                type="number"
                                value={newMatrix.amount_max || ''}
                                onChange={(e) => setNewMatrix({...newMatrix, amount_max: parseInt(e.target.value)})}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Max"
                              />
                            </div>
                          ) : (
                            `$${matrixItem.amount_min.toLocaleString()} - $${matrixItem.amount_max === 999999999 ? '∞' : matrixItem.amount_max.toLocaleString()}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            matrixItem.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
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
                                onClick={() => handleDeleteMatrix(matrixItem.id)}
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
                            onChange={(e) => setNewMatrix({...newMatrix, level: parseInt(e.target.value)})}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Level"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="text"
                            value={newMatrix.role || ''}
                            onChange={(e) => setNewMatrix({...newMatrix, role: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Role"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={newMatrix.department || 'All'}
                            onChange={(e) => setNewMatrix({...newMatrix, department: e.target.value})}
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
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={newMatrix.amount_min || ''}
                              onChange={(e) => setNewMatrix({...newMatrix, amount_min: parseInt(e.target.value)})}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Min"
                            />
                            <input
                              type="number"
                              value={newMatrix.amount_max || ''}
                              onChange={(e) => setNewMatrix({...newMatrix, amount_max: parseInt(e.target.value)})}
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
              <h2 className="text-lg font-semibold text-gray-900">KPI Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Investment</p>
                      <p className="text-2xl font-bold text-blue-900">${(totalInvestment / 1000000).toFixed(1)}M</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Approval Rate</p>
                      <p className="text-2xl font-bold text-green-900">{approvalRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Average IRR</p>
                      <p className="text-2xl font-bold text-purple-900">{avgIRR.toFixed(1)}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">In Budget</p>
                      <p className="text-2xl font-bold text-orange-900">{inBudgetRequests.length}</p>
                    </div>
                    <Database className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Individual Project KPIs */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-md font-semibold text-gray-900">Project KPIs</h3>
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
              <h2 className="text-lg font-semibold text-gray-900">System Reports</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Request Status Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(statusStats).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{status}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Department Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(departmentStats).map(([department, count]) => (
                      <div key={department} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{department}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Requests</span>
                      <span className="text-sm font-medium text-gray-900">{requests.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Approval Levels</span>
                      <span className="text-sm font-medium text-gray-900">{matrix.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">In Budget Requests</span>
                      <span className="text-sm font-medium text-green-600">
                        {inBudgetRequests.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Investment Value</span>
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
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>User Management functionality coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>System Settings functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;