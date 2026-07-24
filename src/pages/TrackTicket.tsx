import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle2, Clock, Calendar, ArrowLeft, AlertCircle, Search, ListTodo } from 'lucide-react';

interface TicketData {
  request: {
    id: number;
    ticket_no: string;
    client_name: string;
    client_email: string;
    title: string;
    description: string;
    unit: string;
    status: string;
    current_step_name: string;
    assigned_staff_name: string;
    start_date: string | null;
    deadline: string | null;
    total_staff: number;
    completed_staff: number;
    additional_data: Record<string, any> | null;
    created_at: string;
  };
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    due_date: string | null;
  }>;
  history: Array<{
    id: number;
    action: string;
    actor_name: string;
    from_step_name: string;
    to_step_name: string;
    comment: string;
    created_at: string;
  }>;
  reports: Array<{
    id: number;
    staff_name: string;
    report_text: string;
    created_at: string;
  }>;
}

export const TrackTicket: React.FC = () => {
  const { ticket } = useParams<{ ticket: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const submitted = searchParams.get('submitted') === 'true';

  const [inputTicket, setInputTicket] = useState(ticket || '');
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTicket = (ticketNo: string) => {
    if (!ticketNo) return;
    setLoading(true);
    setError('');
    fetch(`/api/public/track/${ticketNo}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          setError(resData.error);
          setData(null);
        } else {
          setData(resData);
        }
      })
      .catch(() => {
        setError('Failed to fetch ticket status.');
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ticket) {
      setInputTicket(ticket);
      fetchTicket(ticket);
    }
  }, [ticket]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTicket.trim()) {
      navigate(`/track/${inputTicket.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 antialiased">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Hero Banner */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Track Your Request
          </h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">
            Enter your Tracking Number to check the real-time status of your project.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-xl">#</span>
              </div>
              <input
                type="text"
                required
                placeholder="Enter Tracking Number (e.g. AB123456)"
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 h-14 pl-10 pr-4 text-base font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all uppercase"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary h-14 px-8 normal-case text-base font-bold bg-blue-600 hover:bg-blue-700 border-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25"
            >
              Track Now
            </button>
          </form>
        </div>

        {submitted && (
          <div className="alert alert-success bg-emerald-500 text-white border-none shadow-lg rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold">Request Submitted Successfully!</h3>
              <div className="text-xs">
                Your tracking number is: <strong className="underline text-sm font-mono">{ticket}</strong>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="mt-3 text-xs text-slate-400 font-medium">Fetching request details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-80" />
            <h2 className="text-xl font-bold text-slate-800">No request found</h2>
            <p className="text-slate-500 text-sm mt-1">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header Status Bar */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{data.request.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span>Tracking Number: <strong className="font-mono text-slate-700">{data.request.ticket_no}</strong></span>
                  <span>•</span>
                  <span>Unit: <strong className="text-slate-700">{data.request.unit}</strong></span>
                  <span>•</span>
                  <span>Submitted on {data.request.created_at}</span>
                </div>
              </div>
              <StatusBadge status={data.request.status} stepName={data.request.current_step_name} />
            </div>

            {/* Vertical Stepper Timeline */}
            <div className="p-8 md:p-12 bg-white">
              <div className="max-w-md mx-auto relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"></div>
                <div className="space-y-8">
                  {[
                    { key: 'submitted', label: 'Request Submitted' },
                    { key: 'manager_approval', label: 'Manager Review' },
                    { key: 'staff_processing', label: 'Staff Processing' },
                    { key: 'completed', label: data.request.status === 'rejected' ? 'Rejected' : 'Completed' },
                  ].map((step, idx) => {
                    const isDone =
                      (step.key === 'submitted' && true) ||
                      (step.key === 'manager_approval' && data.request.status !== 'manager_approval') ||
                      (step.key === 'staff_processing' && (data.request.status === 'completed' || (data.request.total_staff > 0 && data.request.completed_staff === data.request.total_staff))) ||
                      (step.key === 'completed' && (data.request.status === 'completed' || data.request.status === 'rejected'));

                    const isActive =
                      (step.key === 'manager_approval' && data.request.status === 'manager_approval') ||
                      (step.key === 'staff_processing' && data.request.status === 'staff_processing' && !isDone) ||
                      (step.key === 'completed' && (data.request.status === 'completed' || data.request.status === 'rejected'));

                    return (
                      <div key={step.key} className="flex items-start gap-5 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                            isDone
                              ? data.request.status === 'rejected' && step.key === 'completed'
                                ? 'bg-rose-500 text-white shadow-rose-200'
                                : 'bg-blue-600 text-white shadow-blue-200'
                              : isActive
                                ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-blue-100 shadow-lg'
                                : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="pt-1">
                          <h4 className={`font-bold text-sm ${isDone ? 'text-slate-800' : isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`}>
                            {step.label}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task Breakdown for Client */}
            {data.tasks && data.tasks.length > 0 && (
              <div className="bg-slate-50/70 border-t border-slate-100 p-8">
                <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-blue-600" /> Project Sub-Tasks Progress
                </h3>
                <div className="space-y-2">
                  {data.tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-xs">
                      <span className={`font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {t.title}
                      </span>
                      <span className={`badge border-none font-bold text-[10px] uppercase px-2 py-0.5 ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Overview Stats */}
            <div className="bg-slate-50 border-t border-slate-100 p-8">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Project Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Project Start
                  </span>
                  <strong className="text-sm text-slate-800">{data.request.start_date || 'TBD'}</strong>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Project Deadline
                  </span>
                  <strong className="text-sm text-rose-600">{data.request.deadline || 'TBD'}</strong>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Assigned Staff
                  </span>
                  <strong className="text-sm text-slate-800">{data.request.assigned_staff_name || 'Pending assignment'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tired of manual tracking Box matching Reference Image 2 */}
        <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100/80 text-center space-y-3 max-w-2xl mx-auto shadow-sm">
          <h3 className="text-base font-bold text-slate-800">
            Tired of manual tracking?
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Register with your email to see all your projects in one place.
          </p>
          <div className="pt-1">
            <Link
              to="/register"
              className="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold text-xs rounded-full px-6 h-10 shadow-md shadow-blue-500/20"
            >
              Register My Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 font-medium space-y-1 pt-6">
          <div className="font-bold text-slate-600">CCI</div>
          <div>Copyright © 2026 - All right reserved</div>
        </div>
      </div>
    </div>
  );
};
