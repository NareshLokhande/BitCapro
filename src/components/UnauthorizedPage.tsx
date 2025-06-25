import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/app/dashboard"
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;