import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, RefreshCw, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const GanttView: React.FC = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGantt = () => {
    setLoading(true);
    fetch('/api/admin/gantt', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGantt();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gantt Chart Timeline
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Visualization of job request schedules and progress.
            </p>
          </div>
        </div>

        <button
          onClick={fetchGantt}
          className="btn btn-outline border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-600 btn-sm gap-2 rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Main Gantt Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16">
              <span className="loading loading-spinner loading-lg text-blue-600"></span>
              <p className="mt-3 text-xs text-slate-400 font-medium">Loading timeline data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h2 className="text-lg font-bold text-slate-700">No tasks found</h2>
              <p className="text-xs text-slate-500 mt-1">No job requests recorded to display on the Gantt chart.</p>
            </div>
          ) : (
            items.map((item) => {
              const progress = item.total_staff > 0 ? Math.round((item.completed_staff / item.total_staff) * 100) : 0;
              return (
                <div key={item.id} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-white text-slate-700 font-mono font-bold text-xs border border-slate-200 px-2.5 py-1">
                        #{item.ticket_no}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="badge bg-blue-50 text-blue-700 border-none font-bold text-[10px] px-2 py-0.5">
                        {item.unit}
                      </span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Staff: <strong className="text-slate-800">{item.assigned_staff_name || 'Unassigned'}</strong></span>
                    <span>
                      Start: <strong className="text-slate-800">{item.start_date || 'TBD'}</strong> | End: <strong className="text-rose-600">{item.deadline || 'TBD'}</strong>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.status === 'completed'
                          ? 'bg-emerald-500'
                          : item.status === 'staff_processing'
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: item.status === 'completed' ? '100%' : `${Math.max(progress, 15)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
