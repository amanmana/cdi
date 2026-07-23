import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Clock, CheckCircle2, ArrowUpRight, Wrench, ShieldAlert, ListTodo, CheckSquare } from 'lucide-react';

interface Stats {
  totalRequests: number;
  pendingApprovals: number;
  processing: number;
  completed: number;
  totalStaff: number;
  totalUsers: number;
}

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();

  if (user && user.role === 'staff' && !user.is_acting_manager) {
    return <Navigate to="/admin/job-requests" replace />;
  }
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingApprovals: 0,
    processing: 0,
    completed: 0,
    totalStaff: 0,
    totalUsers: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/admin/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.recentRequests) setRecentRequests(data.recentRequests);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch('/api/staff/my-tasks', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((tasks) => {
        if (Array.isArray(tasks)) setMyTasks(tasks);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await fetch(`/api/job-requests/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingMyTasks = myTasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase px-3 py-1 rounded-full tracking-wider mb-3">
            ROLE: {user?.role} {user?.is_acting_manager ? '(Acting Manager)' : ''}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 text-sm mt-1.5 font-medium">
            Overview of CDI job request status and approval workflow.
          </p>
        </div>
        <Link
          to="/admin/job-requests"
          className="btn bg-white text-blue-600 hover:bg-blue-50 border-none font-bold px-6 rounded-2xl shadow-lg shadow-black/10 gap-2 shrink-0"
        >
          View All Requests <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Acting Manager Notice */}
      {user?.is_acting_manager && (
        <div className="alert bg-amber-500 text-white shadow-lg border-none rounded-2xl">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-bold">Active Authority Delegation (Acting Manager)</h3>
            <p className="text-xs">You currently hold manager authority for unit {user.acting_manager_unit}.</p>
          </div>
        </div>
      )}

      {/* Designer / Staff Assigned Tasks Card */}
      {(user?.role === 'staff' || user?.role === 'admin') && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" /> My Assigned Sub-Tasks ({pendingMyTasks.length} Pending)
            </h2>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                You have no sub-tasks assigned at the moment.
              </p>
            ) : (
              myTasks.map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleTaskStatusChange(t.id, t.status === 'completed' ? 'in_progress' : 'completed')}
                      className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        t.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-blue-600'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge bg-slate-200 text-slate-700 font-mono font-bold text-[10px] px-2">
                          #{t.ticket_no}
                        </span>
                        <h4 className={`font-bold text-sm ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {t.title}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Project: <strong className="text-slate-800">{t.job_title}</strong> ({t.job_unit})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={t.status}
                      onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                      className="select select-bordered select-xs bg-white border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Link to={`/admin/job-requests/${t.job_request_id}`} className="btn btn-ghost btn-xs text-blue-600 font-bold hover:bg-blue-50">
                      View Project
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalRequests}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{stats.pendingApprovals}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Staff Processing</span>
            <div className="text-3xl font-black text-indigo-600 mt-1">{stats.processing}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Completed Requests</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Job Requests</h2>
          <Link to="/admin/job-requests" className="text-xs text-blue-600 font-bold hover:underline">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-none">
                <th className="rounded-l-xl py-3">Ticket</th>
                <th className="py-3">Title</th>
                <th className="py-3">Client</th>
                <th className="py-3">Unit</th>
                <th className="py-3">Status</th>
                <th className="py-3">Submitted Date</th>
                <th className="rounded-r-xl py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <span className="loading loading-spinner text-blue-600"></span>
                  </td>
                </tr>
              ) : recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-slate-400 font-medium">
                    No job requests recorded yet.
                  </td>
                </tr>
              ) : (
                recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td>
                      <span className="badge bg-slate-100 text-slate-700 font-mono font-bold border-none text-xs px-2.5 py-1">
                        #{req.ticket_no}
                      </span>
                    </td>
                    <td className="font-bold text-slate-900 text-sm">{req.title}</td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800">{req.client_name}</div>
                      <div className="text-[10px] text-slate-400">{req.client_email}</div>
                    </td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700 border-none font-bold text-[10px] px-2 py-0.5">
                        {req.unit}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={req.status} stepName={req.current_step_name} />
                    </td>
                    <td className="text-xs text-slate-500 font-medium">{req.created_at}</td>
                    <td className="text-center">
                      <Link to={`/admin/job-requests/${req.id}`} className="btn btn-ghost btn-xs text-blue-600 font-bold hover:bg-blue-50">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
