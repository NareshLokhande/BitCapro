import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardCheck, 
  Settings,
  Menu,
  X,
  CheckCircle2,
  Home,
  LogOut,
  User,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isSubmitter, resetTimeout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset timeout on any user interaction within the layout
  useEffect(() => {
    resetTimeout();
  }, [location.pathname, resetTimeout]);

  // Handle sidebar collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false); // Always expanded on mobile (controlled by mobileMenuOpen)
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Submitter', 'Approver_L1', 'Approver_L2', 'Approver_L3', 'Approver_L4'] },
    { name: 'Submit Request', href: '/app/submit', icon: PlusCircle, roles: ['Submitter', 'Admin'] },
    { name: 'Approval Tracker', href: '/app/tracker', icon: ClipboardCheck, roles: ['Admin', 'Submitter', 'Approver_L1', 'Approver_L2', 'Approver_L3', 'Approver_L4'] },
    { name: 'Admin Settings', href: '/app/admin', icon: Settings, roles: ['Admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !profile || item.roles.includes(profile.role)
  );

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Approver_L4':
        return 'bg-purple-100 text-purple-800';
      case 'Approver_L3':
        return 'bg-indigo-100 text-indigo-800';
      case 'Approver_L2':
        return 'bg-blue-100 text-blue-800';
      case 'Approver_L1':
        return 'bg-green-100 text-green-800';
      case 'Submitter':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Approver_L1':
        return 'Manager';
      case 'Approver_L2':
        return 'Director';
      case 'Approver_L3':
        return 'CFO';
      case 'Approver_L4':
        return 'CEO';
      default:
        return role;
    }
  };

  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72';
  const contentMargin = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop sidebar collapse button */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-2 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 ${
            sidebarCollapsed ? 'translate-x-12' : 'translate-x-64'
          }`}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Session timeout indicator */}
      <div className="fixed top-4 right-4 z-40">
        <div className="flex items-center px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-xs text-gray-600">
          <Clock className="w-3 h-3 mr-1" />
          Auto-logout: 30min
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white shadow-2xl border-r border-gray-100 transform transition-all duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center px-8 py-8 border-b border-gray-100 transition-all duration-300 ${
            sidebarCollapsed ? 'px-4 justify-center' : ''
          }`}>
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="ml-4 transition-opacity duration-300">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Approvia
                </h1>
                <p className="text-sm text-gray-500">Investment Management</p>
              </div>
            )}
          </div>

          {/* User Info */}
          {profile && (
            <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 ${
              sidebarCollapsed ? 'px-4' : ''
            }`}>
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-sm font-semibold text-white">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1 transition-opacity duration-300">
                    <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-500">{profile.department}</p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="mt-2 transition-opacity duration-300">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(profile.role)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplayName(profile.role)}
                  </span>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="mt-2 flex justify-center">
                  <div className={`w-3 h-3 rounded-full ${getRoleColor(profile.role).includes('red') ? 'bg-red-500' : 
                    getRoleColor(profile.role).includes('purple') ? 'bg-purple-500' :
                    getRoleColor(profile.role).includes('indigo') ? 'bg-indigo-500' :
                    getRoleColor(profile.role).includes('blue') ? 'bg-blue-500' :
                    getRoleColor(profile.role).includes('green') ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 px-6 py-8 space-y-2 transition-all duration-300 ${
            sidebarCollapsed ? 'px-4' : ''
          }`}>
            {/* Back to Landing Page */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 mb-4 ${
                sidebarCollapsed ? 'justify-center px-2' : ''
              }`}
              title={sidebarCollapsed ? "Back to Home" : ""}
            >
              <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              {!sidebarCollapsed && (
                <span className="ml-3 transition-opacity duration-300">Back to Home</span>
              )}
            </Link>

            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    resetTimeout(); // Reset timeout on navigation
                  }}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? item.name : ""}
                >
                  <Icon className={`w-5 h-5 transition-colors ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 transition-opacity duration-300">{item.name}</span>
                      {active && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className={`px-6 py-6 border-t border-gray-100 transition-all duration-300 ${
            sidebarCollapsed ? 'px-4' : ''
          }`}>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center px-2' : ''
              }`}
              title={sidebarCollapsed ? "Sign Out" : ""}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="ml-3 transition-opacity duration-300">Sign Out</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${contentMargin}`}>
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;