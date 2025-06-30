import {
  AlertCircle,
  CheckCircle2,
  Home,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  timeout?: number;
  onTimeout?: () => void;
  showTimeoutImmediately?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  timeout = 8000,
  onTimeout,
  showTimeoutImmediately = false,
}) => {
  const [showTimeout, setShowTimeout] = useState(showTimeoutImmediately);
  const [countdown, setCountdown] = useState(Math.floor(timeout / 1000));

  useEffect(() => {
    if (showTimeoutImmediately) {
      return;
    }

    const timer = setTimeout(() => {
      setShowTimeout(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [timeout, onTimeout, showTimeoutImmediately]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoLogin = () => {
    window.location.href = '/login';
  };

  if (showTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BitCapro
              </h1>
              <p className="text-sm text-gray-500">Investment Management</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Issue
            </h2>
            <p className="text-gray-600 mb-6">
              The application is taking longer than expected to load. This might
              be due to authentication issues or a slow connection.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoLogin}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Go to Login
              </button>

              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Retry Loading
              </button>

              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BitCapro
            </h1>
            <p className="text-sm text-gray-500">Investment Management</p>
          </div>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
        <p className="text-gray-400 text-sm mt-2">
          Please wait while we initialize your session
        </p>
        {countdown > 0 && (
          <p className="text-gray-400 text-xs mt-2">Timeout in {countdown}s</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
