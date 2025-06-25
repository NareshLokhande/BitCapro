import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, Eye, EyeOff, AlertCircle, Zap, UserPlus, Users, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [creationStatus, setCreationStatus] = useState<string>('');

  const from = location.state?.from?.pathname || '/app/dashboard';
  const timeoutParam = searchParams.get('timeout');

  // Show timeout message if user was auto-logged out
  useEffect(() => {
    if (timeoutParam === 'true') {
      setError('Your session has expired due to inactivity. Please log in again.');
    }
  }, [timeoutParam]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const demoCredentials = [
    { email: 'admin@approvia.com', password: 'password123', role: 'Admin', name: 'System Administrator', department: 'IT' },
    { email: 'ceo@approvia.com', password: 'password123', role: 'Approver_L4', name: 'Emily Davis', department: 'Executive' },
    { email: 'cfo@approvia.com', password: 'password123', role: 'Approver_L3', name: 'Robert Chen', department: 'Finance' },
    { email: 'director1@approvia.com', password: 'password123', role: 'Approver_L2', name: 'Sarah Wilson', department: 'Operations' },
    { email: 'manager1@approvia.com', password: 'password123', role: 'Approver_L1', name: 'Mike Johnson', department: 'Engineering' },
    { email: 'john.doe@approvia.com', password: 'password123', role: 'Submitter', name: 'John Doe', department: 'Engineering' },
  ];

  const createDemoUsers = async () => {
    setIsCreatingUsers(true);
    setCreationStatus('Creating demo users...');
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-demo-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        if (result.successCount > 0) {
          setCreationStatus(`✅ Successfully created/updated ${result.successCount} demo users!`);
        }
        
        if (result.errorCount > 0) {
          setError(`Some users could not be created: ${result.errors.join(', ')}`);
        }
      } else {
        setError(result.error || 'Failed to create demo users');
        setCreationStatus('');
      }

    } catch (error) {
      console.error('Error creating demo users:', error);
      setError('Failed to create demo users. Please check your network connection and try again.');
      setCreationStatus('');
    } finally {
      setIsCreatingUsers(false);
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Bolt Badge */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Zap className="w-4 h-4 mr-2" />
          Built with Bolt
        </a>
      </div>

      <div className="max-w-6xl w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Approvia
                  </h1>
                  <p className="text-gray-500">Investment Management</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`border rounded-xl p-4 ${
                  timeoutParam === 'true' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {timeoutParam === 'true' ? (
                      <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <p className={`text-sm ${
                      timeoutParam === 'true' ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {creationStatus && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 text-sm">{creationStatus}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Demo Credentials</h3>
              <button
                onClick={createDemoUsers}
                disabled={isCreatingUsers}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingUsers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Demo Users
                  </>
                )}
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">First time setup required!</p>
                  <p>Click "Create Demo Users" above to add these users to your Supabase database, then you can log in with any of the credentials below.</p>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Auto Logout Feature</p>
                  <p>For security, you'll be automatically logged out after 30 minutes of inactivity. You'll receive a warning 5 minutes before logout.</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Click on any credential below to auto-fill the login form and test different user roles:
            </p>
            
            <div className="space-y-3">
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {cred.name}
                      </div>
                      <div className="text-sm text-gray-600">{cred.email}</div>
                      <div className="text-xs text-blue-600 font-medium">{cred.role} • {cred.department}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {cred.password}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-100 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-2">Role Permissions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Admin:</strong> Full system access, user management</li>
                <li><strong>Approver_L4 (CEO):</strong> Approve any amount, view all requests</li>
                <li><strong>Approver_L3 (CFO):</strong> Approve up to $500K, financial oversight</li>
                <li><strong>Approver_L2 (Director):</strong> Approve up to $200K, department oversight</li>
                <li><strong>Approver_L1 (Manager):</strong> Approve up to $50K, team oversight</li>
                <li><strong>Submitter:</strong> Create and submit requests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;