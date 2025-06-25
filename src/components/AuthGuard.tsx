import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('AuthGuard timeout reached, forcing redirect');
      setTimeoutReached(true);
    }, 8000); // 8 second timeout

    return () => clearTimeout(timer);
  }, []);

  // If timeout reached and still loading, force redirect
  if (timeoutReached && loading) {
    console.log('AuthGuard timeout - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading spinner while authentication is being determined
  if (loading && !timeoutReached) {
    return <LoadingSpinner timeout={8000} onTimeout={() => setTimeoutReached(true)} />;
  }

  // If no user after loading is complete, redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRole && profile && !requiredRole.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If we have a user, allow access (even without profile)
  if (user) {
    return <>{children}</>;
  }

  // Fallback - redirect to login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default AuthGuard;