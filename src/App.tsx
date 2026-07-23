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
import { GanttView } from './pages/GanttView';
import { TeamManagement } from './pages/TeamManagement';
import { UsersManagement } from './pages/UsersManagement';
import { UnitsManagement } from './pages/UnitsManagement';
import { SettingsPage } from './pages/SettingsPage';
import { BackupPage } from './pages/BackupPage';

const AdminIndexRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'staff' && !user?.is_acting_manager) {
    return <Navigate to="/admin/job-requests" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
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

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<ProtectedLayout />}>
                <Route index element={<AdminIndexRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="job-requests" element={<JobRequestsList />} />
                <Route path="job-requests/:id" element={<JobRequestDetail />} />
                <Route path="gantt" element={<GanttView />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="team-members" element={<TeamManagement />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="units" element={<UnitsManagement />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="backup" element={<BackupPage />} />
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
