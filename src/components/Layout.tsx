import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Types
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

// Constants
const SIDEBAR_WIDTHS = {
  expanded: 'w-72',
  collapsed: 'w-20',
} as const;

const CONTENT_MARGINS = {
  expanded: 'lg:pl-72',
  collapsed: 'lg:pl-20',
} as const;

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, resetTimeout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation configuration
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: LayoutDashboard,
      roles: [
        'Admin',
        'Submitter',
        'Approver_L1',
        'Approver_L2',
        'Approver_L3',
        'Approver_L4',
      ],
    },
    {
      name: 'Drafts',
      href: '/app/drafts',
      icon: FileText,
      roles: ['Submitter', 'Admin'],
    },
    {
      name: 'Submit Request',
      href: '/app/submit',
      icon: PlusCircle,
      roles: ['Submitter', 'Admin'],
    },
    {
      name: 'Approval Tracker',
      href: '/app/tracker',
      icon: ClipboardCheck,
      roles: [
        'Admin',
        'Submitter',
        'Approver_L1',
        'Approver_L2',
        'Approver_L3',
        'Approver_L4',
      ],
    },
    {
      name: 'Admin Settings',
      href: '/app/admin',
      icon: Settings,
      roles: ['Admin'],
    },
  ];

  // Effects
  useEffect(() => {
    resetTimeout();
  }, [location.pathname, resetTimeout]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Event handlers
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigationClick = () => {
    setMobileMenuOpen(false);
    resetTimeout();
  };

  // Utility functions
  const filteredNavigation = navigation.filter(
    (item) => !profile || item.roles.includes(profile.role),
  );

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      Admin: 'bg-red-100 text-red-800',
      Approver_L4: 'bg-purple-100 text-purple-800',
      Approver_L3: 'bg-indigo-100 text-indigo-800',
      Approver_L2: 'bg-blue-100 text-blue-800',
      Approver_L1: 'bg-green-100 text-green-800',
      Submitter: 'bg-gray-100 text-gray-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      Approver_L1: 'Manager',
      Approver_L2: 'Director',
      Approver_L3: 'CFO',
      Approver_L4: 'CEO',
    };
    return roleNames[role] || role;
  };

  const getRoleIndicatorColor = (role: string) => {
    const indicatorColors: Record<string, string> = {
      Admin: 'bg-red-500',
      Approver_L4: 'bg-purple-500',
      Approver_L3: 'bg-indigo-500',
      Approver_L2: 'bg-blue-500',
      Approver_L1: 'bg-green-500',
      Submitter: 'bg-gray-500',
    };
    return indicatorColors[role] || 'bg-gray-500';
  };

  // Computed values
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_WIDTHS.collapsed
    : SIDEBAR_WIDTHS.expanded;
  const contentMargin = sidebarCollapsed
    ? CONTENT_MARGINS.collapsed
    : CONTENT_MARGINS.expanded;
  const collapseButtonTransform = sidebarCollapsed
    ? 'translate-x-12'
    : 'translate-x-64';

  // Component renderers
  const renderLogo = () => (
    <div
      className={`flex items-center py-8 border-b border-gray-100 ${
        sidebarCollapsed ? 'px-4 justify-center' : 'px-8'
      }`}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
        <CheckCircle2 className="w-7 h-7 text-white" />
      </div>
      {!sidebarCollapsed && (
        <div className="ml-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Approvia
          </h1>
          <p className="text-sm text-gray-500">Investment Management</p>
        </div>
      )}
    </div>
  );

  const renderUserInfo = () => {
    if (!profile) return null;

    return (
      <div
        className={`py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 ${
          sidebarCollapsed ? 'px-4' : 'px-6'
        }`}
      >
        <div
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-sm font-semibold text-white">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">
                {profile.name}
              </p>
              <p className="text-xs text-gray-500">{profile.department}</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed ? (
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                profile.role,
              )}`}
            >
              <Shield className="w-3 h-3 mr-1" />
              {getRoleDisplayName(profile.role)}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${getRoleIndicatorColor(
                profile.role,
              )}`}
            />
          </div>
        )}
      </div>
    );
  };

  const renderNavigation = () => (
    <nav
      className={`flex-1 py-8 space-y-2 ${sidebarCollapsed ? 'px-4' : 'px-6'}`}
    >
      <Link
        to="/"
        onClick={handleNavigationClick}
        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 mb-4 ${
          sidebarCollapsed ? 'justify-center px-2' : ''
        }`}
        title={sidebarCollapsed ? 'Back to Home' : ''}
      >
        <Home
          className={`text-gray-400 group-hover:text-gray-600 ${
            sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'
          }`}
        />
        {!sidebarCollapsed && <span className="ml-3">Back to Home</span>}
      </Link>

      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={handleNavigationClick}
            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? item.name : ''}
          >
            <Icon
              className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${
                active
                  ? 'text-blue-600'
                  : 'text-gray-500 group-hover:text-gray-700'
              }`}
            />
            {!sidebarCollapsed && (
              <>
                <span className="ml-3">{item.name}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderSignOut = () => (
    <div
      className={`py-6 border-t border-gray-100 ${
        sidebarCollapsed ? 'px-4' : 'px-6'
      }`}
    >
      <button
        onClick={handleSignOut}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ${
          sidebarCollapsed ? 'justify-center px-2' : ''
        }`}
        title={sidebarCollapsed ? 'Sign Out' : ''}
      >
        <LogOut
          className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} text-red-500`}
        />
        {!sidebarCollapsed && <span className="ml-3">Sign Out</span>}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={handleMobileMenuToggle}
          className="p-2 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop collapse button */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <button
          onClick={handleSidebarToggle}
          className={`p-2 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 ${collapseButtonTransform}`}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          )}
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
      <div
        className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white shadow-2xl border-r border-gray-100 transform transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {renderLogo()}
          {renderUserInfo()}
          {renderNavigation()}
          {renderSignOut()}
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${contentMargin}`}>
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
