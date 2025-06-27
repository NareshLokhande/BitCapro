import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import ApprovalTracker from './components/ApprovalTracker';
import AuthGuard from './components/AuthGuard';
import Dashboard from './components/Dashboard';
import DraftManager from './components/DraftManager';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import SubmitRequest from './components/SubmitRequest';
import UnauthorizedPage from './components/UnauthorizedPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected app routes */}
          <Route
            path="/app"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="drafts"
              element={
                <AuthGuard requiredRole={['Submitter', 'Admin']}>
                  <DraftManager />
                </AuthGuard>
              }
            />
            <Route
              path="submit"
              element={
                <AuthGuard requiredRole={['Submitter', 'Admin']}>
                  <SubmitRequest />
                </AuthGuard>
              }
            />
            <Route path="tracker" element={<ApprovalTracker />} />
            <Route
              path="admin"
              element={
                <AuthGuard requiredRole={['Admin']}>
                  <AdminPanel />
                </AuthGuard>
              }
            />
          </Route>

          {/* Legacy routes for backward compatibility */}
          <Route
            path="/dashboard"
            element={<Navigate to="/app/dashboard" replace />}
          />
          <Route
            path="/submit"
            element={<Navigate to="/app/submit" replace />}
          />
          <Route
            path="/tracker"
            element={<Navigate to="/app/tracker" replace />}
          />
          <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
