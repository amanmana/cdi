import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Edit3,
  ExternalLink,
  PlusCircle,
  X,
  Layers,
  FileText,
  User,
  Check,
  Trash2,
} from 'lucide-react';

interface UnitBreakdown {
  unit_id: number;
  unit_name: string;
  total_tasks: number;
  completed_tasks: number;
  is_done: boolean;
  jobs: any[];
}

interface ProjectDetail {
  id: number;
  code: string;
  title: string;
  description: string | null;
  created_by_user_id: number;
  creator_name: string;
  creator_role: string;
  creator_email: string;
  status: 'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  status_note: string | null;
  start_date: string | null;
  target_deadline: string | null;
  total_jobs: number;
  completed_jobs: number;
  progress_percent: number;
  unit_breakdown: UnitBreakdown[];
  jobs: any[];
  created_at: string;
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusVal, setStatusVal] = useState<'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled'>('active');
  const [statusNoteVal, setStatusNoteVal] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isDirectorOrAdmin = user?.role === 'director' || user?.role === 'admin';
  const canUpdateStatus = isDirectorOrAdmin || user?.role === 'manager' || user?.is_acting_manager;

  const fetchProject = async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        setStatusVal(data.project.status);
        setStatusNoteVal(data.project.status_note || '');
      } else {
        alert(data.error || 'Project not found.');
        navigate('/portal/projects');
      }
    } catch (err) {
      console.error('Failed to fetch project detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id, token]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/projects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: statusVal,
          status_note: statusNoteVal.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowStatusModal(false);
        fetchProject();
      } else {
        alert(data.error || 'Failed to update project status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete Mega Project "${project?.title}"? Linked job requests will be unlinked but preserved.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Project deleted successfully.');
        navigate('/portal/projects');
      } else {
        alert(data.error || 'Failed to delete project.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" /> On Hold
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Active In Progress
          </span>
        );
    }
  };

  const renderJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success text-white badge-xs uppercase font-extrabold px-2 py-0.5">COMPLETED</span>;
      case 'rejected':
        return <span className="badge badge-error text-white badge-xs uppercase font-extrabold px-2 py-0.5">REJECTED</span>;
      case 'on_hold':
        return <span className="badge badge-warning text-white badge-xs uppercase font-extrabold px-2 py-0.5">ON HOLD</span>;
      case 'manager_approval':
        return <span className="badge badge-info text-white badge-xs uppercase font-extrabold px-2 py-0.5">PENDING APPROVAL</span>;
      default:
        return <span className="badge bg-purple-600 text-white border-none badge-xs uppercase font-extrabold px-2 py-0.5">STAFF PROCESSING</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="text-xs font-bold text-slate-500">Loading project overview...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 antialiased">
      {/* Back button & Action controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/portal/projects')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mega Projects</span>
        </button>

        <div className="flex items-center gap-2.5">
          {canUpdateStatus && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Update Status & Notes</span>
            </button>
          )}

          {isDirectorOrAdmin && (
            <button
              type="button"
              onClick={handleDeleteProject}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Presentation Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-black px-3.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 tracking-wider">
                #{project.code}
              </span>
              {getStatusBadge(project.status)}
              <span className="text-xs text-slate-400 font-medium">
                Initiated by {project.creator_name} ({project.creator_role})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Timeline Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2 text-xs font-semibold shrink-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Project Timeline
            </div>
            {project.start_date && (
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Start: <strong className="font-bold">{project.start_date}</strong></span>
              </div>
            )}
            {project.target_deadline && (
              <div className="flex items-center gap-2 text-slate-900">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Target: <strong className="font-bold text-rose-600">{project.target_deadline}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Status Note Banner (Pending Third-Party / Finance / Revisions) */}
        {project.status_note && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wide text-amber-900 mr-2">
                Executive Status Note:
              </span>
              <span>{project.status_note}</span>
            </div>
          </div>
        )}

        {/* Master Progress Bar */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 uppercase tracking-wider">Collective Completion Progress</span>
              <span className="text-xs font-bold text-slate-400">
                ({project.completed_jobs} of {project.total_jobs} unit deliverables completed)
              </span>
            </div>
            <span
              className={`font-mono text-base sm:text-lg font-black ${
                project.progress_percent === 100
                  ? 'text-emerald-600'
                  : project.progress_percent > 50
                  ? 'text-blue-600'
                  : 'text-indigo-600'
              }`}
            >
              {project.progress_percent}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-4 p-0.5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                project.progress_percent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-600 shadow-md shadow-blue-500/30'
              }`}
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Participating Units Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Participating Units Status</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {project.unit_breakdown.filter((u) => u.is_done).length} of {project.unit_breakdown.length} units done
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.unit_breakdown.map((unit) => (
            <div
              key={unit.unit_id}
              className={`rounded-2xl p-4 border transition-all ${
                unit.is_done
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : unit.total_tasks > 0
                  ? 'bg-white border-slate-200/80'
                  : 'bg-slate-50/60 border-slate-200/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 line-clamp-1">
                  {unit.unit_name}
                </span>
                {unit.is_done ? (
                  <span className="badge badge-success text-white badge-xs font-bold uppercase gap-1">
                    <Check className="w-2.5 h-2.5" /> Done
                  </span>
                ) : unit.total_tasks > 0 ? (
                  <span className="badge badge-info text-white badge-xs font-bold uppercase">
                    In Progress
                  </span>
                ) : (
                  <span className="badge badge-ghost badge-xs font-medium">Pending Tasks</span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Deliverables:</span>
                <span className="font-mono font-bold text-slate-800">
                  {unit.completed_tasks} / {unit.total_tasks} completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Job Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Project Deliverables & Task Records ({project.jobs.length})
            </h3>
            <p className="text-xs text-slate-500">
              All official unit tasks and job requests contributing to this mega project
            </p>
          </div>

          <Link
            to="/portal/job-requests"
            className="btn btn-sm bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            + Link / Create Task
          </Link>
        </div>

        {project.jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No specific tasks logged under this project yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th>Ticket</th>
                  <th>Title & Description</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {project.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="font-mono font-bold text-blue-600 whitespace-nowrap">
                      #{job.ticket_no}
                    </td>
                    <td className="max-w-md">
                      <div className="font-extrabold text-slate-900 line-clamp-1">{job.title}</div>
                      {job.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{job.description}</div>
                      )}
                    </td>
                    <td className="font-bold text-slate-700 whitespace-nowrap">
                      {job.unit}
                    </td>
                    <td className="whitespace-nowrap">
                      {renderJobStatusBadge(job.status)}
                    </td>
                    <td className="whitespace-nowrap font-medium text-slate-500">
                      {job.deadline || 'No deadline'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/portal/job-requests/${job.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                  #{project.code}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">Update Project Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="active">🟢 Active / In Progress</option>
                  <option value="pending">🟡 Pending (Third-party / Finance / External Approval)</option>
                  <option value="completed">✅ Completed</option>
                  <option value="on_hold">🟠 On Hold</option>
                  <option value="cancelled">🔴 Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Status Note / Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Pending: Waiting for Finance department budget approval. Re-design tasks will follow."
                  value={statusNoteVal}
                  onChange={(e) => setStatusNoteVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">
                  This note is displayed to Director, Managers, and Units during tracking and presentations.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none text-white rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
