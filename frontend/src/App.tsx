import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useTimeEntryStore } from './store/timeEntryStore';
import { useToastStore } from './store/toastStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TimeEntriesPage from './pages/TimeEntriesPage';
import TasksPage from './pages/TasksPage';
import TaskTemplatesPage from './pages/TaskTemplatesPage';
import TeamManagementPage from './pages/TeamManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import ProjectTemplatesPage from './pages/ProjectTemplatesPage';
import APIKeysPage from './pages/APIKeysPage';
import AdvancedDashboardPage from './pages/AdvancedDashboardPage';
import ExportPage from './pages/ExportPage';
import EnhancedLayout from './components/Layout/EnhancedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import TimerDescriptionDialog from './components/TimerDescriptionDialog';
import ToastContainer from './components/ToastContainer';
import ThemeProvider from './providers/ThemeProvider';

function App() {
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();
  const { pendingTimeEntry, completePendingTimeEntry, clearPendingTimeEntry } = useTimeEntryStore();
  const { toasts, removeToast } = useToastStore();
  const location = useLocation();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users on root path
  const showLandingPage = !isAuthenticated && location.pathname === '/';

  return (
    <ThemeProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={showLandingPage ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
        </Route>

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProjectsPage />} />
        </Route>

        <Route
          path="/time-entries"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TimeEntriesPage />} />
        </Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserProfilePage />} />
        </Route>

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TasksPage />} />
        </Route>

        <Route
          path="/task-templates"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TaskTemplatesPage />} />
        </Route>

        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeamManagementPage />} />
        </Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SettingsPage />} />
        </Route>

        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrganizationSettingsPage />} />
        </Route>

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AnalyticsPage />} />
        </Route>

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ReportsPage />} />
        </Route>

        <Route
          path="/project-templates"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProjectTemplatesPage />} />
        </Route>

        <Route
          path="/api-keys"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<APIKeysPage />} />
        </Route>

        <Route
          path="/advanced-dashboard"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdvancedDashboardPage />} />
        </Route>

        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <EnhancedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExportPage />} />
        </Route>

        {/* Catch all route */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>

      {/* Global Components */}

      {/* Timer Description Dialog */}
      {pendingTimeEntry && (
        <TimerDescriptionDialog
          timeEntry={pendingTimeEntry}
          onSave={(description, taskId) => {
            completePendingTimeEntry(description, taskId);
          }}
          onCancel={clearPendingTimeEntry}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ThemeProvider>
  );
}

export default App;