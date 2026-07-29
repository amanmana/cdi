import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { PublicHome } from './pages/PublicHome';
import { TrackTicket } from './pages/TrackTicket';
import { RegisterPage } from './pages/RegisterPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { JobRequestsList } from './pages/JobRequestsList';
import { JobRequestDetail } from './pages/JobRequestDetail';
import { ReportsPage } from './pages/ReportsPage';
import { TeamManagement } from './pages/TeamManagement';
import { UsersManagement } from './pages/UsersManagement';
import { UnitsManagement } from './pages/UnitsManagement';
import { SettingsPage } from './pages/SettingsPage';
import { BackupPage } from './pages/BackupPage';
import { ProfilePage } from './pages/ProfilePage';
import { DirectorDashboard } from './pages/DirectorDashboard';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

const AdminIndexRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'director') {
    return <Navigate to="/portal/director-dashboard" replace />;
  }
  if (user?.role === 'staff' && !user?.is_acting_manager) {
    return <Navigate to="/portal/job-requests" replace />;
  }
  return <Navigate to="/portal/dashboard" replace />;
};

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4.25rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 bg-slate-50 overflow-y-auto min-h-[calc(100vh-4.25rem)]">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicHome />} />
              <Route path="/track" element={<TrackTicket />} />
              <Route path="/track/:ticket" element={<TrackTicket />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<TermsPrivacyPage />} />
              <Route path="/privacy" element={<TermsPrivacyPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Admin Routes */}
              <Route path="/portal" element={<ProtectedLayout />}>
                <Route index element={<AdminIndexRedirect />} />
                <Route path="director-dashboard" element={<DirectorDashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="job-requests" element={<JobRequestsList />} />
                <Route path="job-requests/:id" element={<JobRequestDetail />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="gantt" element={<Navigate to="/portal/reports" replace />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="team-members" element={<TeamManagement />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="units" element={<UnitsManagement />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="backup" element={<BackupPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
