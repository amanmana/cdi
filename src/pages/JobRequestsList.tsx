import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Trash2 } from 'lucide-react';

export const JobRequestsList: React.FC = () => {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);

    fetch(`/api/job-requests?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [token, search]);

  const currentJobs = requests.filter((r) => r.status !== 'completed' && r.status !== 'rejected');
  const historyJobs = requests.filter((r) => r.status === 'completed' || r.status === 'rejected');

  const displayedRequests = activeTab === 'current' ? currentJobs : historyJobs;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this job request?')) return;
    try {
      const res = await fetch(`/api/job-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatusBadge = (status: string, stepName?: string) => {
    if (status === 'completed') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-emerald-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">COMPLETED</span>;
    }
    if (status === 'rejected') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-rose-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">REJECTED</span>;
    }
    if (status === 'manager_approval') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-amber-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">MANAGER APPROVAL</span>;
    }
    return <span className="inline-flex items-center justify-center whitespace-nowrap bg-indigo-600 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">{stepName ? stepName.toUpperCase() : 'STAFF PROCESSING'}</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Top Header Controls: Pill Tabs + Floating Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented Filter Pill Tabs */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/60 shadow-inner w-fit">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'current'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CURRENT JOBS ({currentJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            HISTORY ({historyJobs.length})
          </button>
        </div>

        {/* Right Floating Search Input matching Reference UI */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search ID, Ticket, Client or Da..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full h-11 bg-white border-slate-200 pl-10 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 shadow-sm"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main Job Requests Data Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">CLIENT</th>
                <th className="py-3 px-4">CURRENT STATUS</th>
                <th className="py-3 px-4">ASSIGNED TO</th>
                <th className="py-3 px-4">TIMELINE</th>
                <th className="py-3 px-4">PROGRESS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-indigo-600"></span>
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 font-semibold">
                    No job requests found in {activeTab === 'current' ? 'Current Jobs' : 'History'}.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const totalTasks = req.total_staff || 0;
                  const completedTasks = req.completed_staff || 0;
                  const percent = req.status === 'completed' ? 100 : totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      {/* ID & Ticket Link */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-slate-900 text-sm">#{req.id}</div>
                        <div className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          {req.ticket_no}
                        </div>
                      </td>

                      {/* Title & Client Email */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm">{req.title}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {req.client_name} <span className="mx-1">•</span> {req.client_email}
                        </div>
                      </td>

                      {/* Current Status Capsule Badge */}
                      <td className="py-4 px-4 align-top">
                        {renderStatusBadge(req.status, req.current_step_name)}
                      </td>

                      {/* Assigned Staff List with Checkmarks */}
                      <td className="py-4 px-4 align-top text-xs font-semibold text-slate-700">
                        {req.assigned_staff_name ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.assigned_staff_name.split(',').map((name: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 text-slate-700 font-bold">
                                <span className="text-emerald-500 font-extrabold">✓</span> {name.trim()}
                                {i < req.assigned_staff_name.split(',').length - 1 && <span className="text-slate-300">,</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      {/* Timeline Dates */}
                      <td className="py-4 px-4 align-top text-xs">
                        {req.start_date || req.deadline ? (
                          <div>
                            {req.start_date && (
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                START: {formatDate(req.start_date)}
                              </div>
                            )}
                            {req.deadline && (
                              <div className="text-xs font-extrabold text-rose-600 mt-0.5">
                                Finish: {formatDate(req.deadline)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider italic">
                            NOT SCHEDULED
                          </span>
                        )}
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="py-4 px-4 align-top text-xs w-36">
                        <div className="font-extrabold text-slate-700 text-[11px] mb-1">{percent}%</div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/portal/job-requests/${req.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-wider hover:underline"
                          >
                            VIEW DETAILS
                          </Link>

                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="text-rose-400 hover:text-rose-600 p-1"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
