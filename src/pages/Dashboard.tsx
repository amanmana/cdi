import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Clock, CheckCircle2, ArrowUpRight, Wrench, ShieldAlert, ListTodo, CheckSquare, PauseCircle, XCircle, FolderKanban, Users } from 'lucide-react';

interface Stats {
  totalRequests: number;
  pendingApprovals: number;
  processing: number;
  completed: number;
  onHold?: number;
  cancelled?: number;
  totalStaff: number;
  totalUsers: number;
}

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();

  if (user && user.role === 'director') {
    return <Navigate to="/portal/director-dashboard" replace />;
  }

  // Synchronous read from localStorage to eliminate image loading flicker
  const [bannerSettings, setBannerSettings] = useState<{
    type: string;
    imageUrl: string;
    isLoaded: boolean;
  }>(() => {
    try {
      const cached = localStorage.getItem('cdi_banner_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          type: parsed.type || '3d_mesh',
          imageUrl: parsed.imageUrl || '',
          isLoaded: true,
        };
      }
    } catch {}
    return {
      type: 'loading',
      imageUrl: '',
      isLoaded: false,
    };
  });

  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingApprovals: 0,
    processing: 0,
    completed: 0,
    onHold: 0,
    cancelled: 0,
    totalStaff: 0,
    totalUsers: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Public Banner & Theme Settings
  useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((data) => {
        const resolvedType = data.dashboard_banner_type || '3d_mesh';
        const resolvedUrl = data.dashboard_banner_image_url || '';
        const newSettings = {
          type: resolvedType,
          imageUrl: resolvedUrl,
          isLoaded: true,
        };
        setBannerSettings(newSettings);
        try {
          localStorage.setItem('cdi_banner_settings', JSON.stringify(newSettings));
        } catch {}
      })
      .catch(() => {
        setBannerSettings((prev) => ({ ...prev, isLoaded: true }));
      });
  }, []);

  // Preload custom image into browser cache
  useEffect(() => {
    if (bannerSettings.type === 'custom_image' && bannerSettings.imageUrl) {
      const img = new Image();
      img.src = bannerSettings.imageUrl;
    }
  }, [bannerSettings.imageUrl, bannerSettings.type]);

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

    fetch('/api/job-requests/staff/my-tasks', {
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

  // Filter tasks to display in My Assigned Sub-Tasks:
  // 1. Exclude any project where the whole job is 100% completed (e.g. 2/2 Done or completed job_status)
  // 2. For solo tasks, exclude if user already finished (is_user_done === true)
  // 3. For group projects, keep displayed as long as the overall project is not 100% done (even if current user already finished their part)
  const activeMyTasks = myTasks.filter((t) => {
    const isJobFullyCompleted =
      t.job_status === 'completed' ||
      (t.total_staff > 0 && t.completed_staff >= t.total_staff) ||
      (t.progress_percent >= 100);

    if (isJobFullyCompleted) {
      return false;
    }

    if (!t.is_group && (t.is_user_done || t.status === 'completed')) {
      return false;
    }

    return true;
  });

  const pendingMyTasks = activeMyTasks.filter((t) => !t.is_user_done);

  return (
    <div className="flex flex-col gap-8">
      {/* 3D Abstract Vibrant Hero Section or Custom Admin Background */}
      <div
        className={`relative overflow-hidden rounded-[2.5rem] border border-white/80 shadow-2xl shadow-indigo-900/5 p-6 sm:p-8 md:p-10 transition-all space-y-8 ${
          bannerSettings.type === 'custom_image' && bannerSettings.imageUrl
            ? 'bg-slate-900'
            : 'bg-gradient-to-br from-[#EEF4FF] via-[#E9EFFF] to-[#F3EEFF]'
        }`}
        style={
          bannerSettings.type === 'custom_image' && bannerSettings.imageUrl
            ? {
                backgroundImage: `url(${bannerSettings.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Soft Frosted Tint Overlay if Custom Image is active to keep text and white cards crisp */}
        {bannerSettings.type === 'custom_image' && bannerSettings.imageUrl && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none" />
        )}

        {/* Layer 1: 3D Organic Wave & Mesh Glow Art (Render ONLY when explicitly set to 3D Mesh, eliminating loading flicker) */}
        {bannerSettings.isLoaded && bannerSettings.type !== 'custom_image' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Luminous Glow Spheres */}
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-400/30 to-indigo-500/25 blur-3xl animate-pulse duration-1000"></div>
            <div className="absolute top-1/3 -right-10 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-400/30 via-indigo-400/25 to-pink-300/20 blur-3xl"></div>
            <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-gradient-to-r from-blue-300/30 to-cyan-400/20 blur-2xl"></div>

            {/* 3D Abstract Wave & Ribbon Vectors */}
            <svg
              className="absolute right-0 top-0 h-full w-full max-w-[700px] object-cover opacity-65 mix-blend-multiply pointer-events-none"
              viewBox="0 0 700 450"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#818CF8" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="waveGradB" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="sphere3D_1" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="25%" stopColor="#7DD3FC" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.4" />
                </radialGradient>
                <radialGradient id="sphere3D_2" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#C4B5FD" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#818CF8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#4338CA" stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {/* 3D Floating Glowing Spheres matching image 1 */}
              <circle cx="580" cy="110" r="120" fill="url(#sphere3D_1)" opacity="0.9" />
              <circle cx="340" cy="270" r="85" fill="url(#sphere3D_2)" opacity="0.85" />
              <circle cx="220" cy="140" r="45" fill="url(#sphere3D_1)" opacity="0.45" />

              {/* Dense 3D Beaded Ribbon Tubes & Waves (Multi-layered like Reference Image 1) */}
              <path
                d="M80,450 C220,240 320,320 460,160 C550,70 630,90 700,40"
                stroke="url(#waveGradA)"
                strokeWidth="32"
                strokeLinecap="round"
                strokeDasharray="4 16"
                opacity="0.45"
              />
              <path
                d="M110,450 C240,260 340,335 480,180 C565,90 640,105 710,55"
                stroke="url(#waveGradB)"
                strokeWidth="28"
                strokeLinecap="round"
                strokeDasharray="4 16"
                opacity="0.5"
              />
              <path
                d="M140,450 C265,280 360,350 500,200 C580,110 655,120 720,70"
                stroke="url(#waveGradA)"
                strokeWidth="24"
                strokeLinecap="round"
                strokeDasharray="4 16"
                opacity="0.55"
              />
              <path
                d="M170,450 C290,300 380,365 520,220 C600,130 670,135 730,85"
                stroke="#818CF8"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray="4 16"
                opacity="0.45"
              />
              <path
                d="M200,450 C315,320 400,380 540,240 C615,150 685,150 740,100"
                stroke="#A78BFA"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="4 16"
                opacity="0.35"
              />
            </svg>
          </div>
        )}

        {/* Content Section */}
        <div className="relative z-10 space-y-6 sm:space-y-8">
          {/* Top Bar: Title & Welcome Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none shadow-sm shadow-blue-500/30">
                  ROLE: {user?.role} {user?.is_acting_manager ? '(Acting Manager)' : ''}
                </span>
                <span className="badge bg-white/90 text-indigo-900 border border-indigo-200/70 font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs">
                  {user?.department_name || user?.acting_manager_unit || user?.unit || 'Creative Digital Innovation'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-xl leading-relaxed">
                {user?.role === 'staff'
                  ? `Overview of your assigned tasks, unit workload (${user?.unit || 'General'}), and active projects.`
                  : `Overview of ${user?.department_name || user?.acting_manager_unit || user?.unit || 'department'} job request status and approval workflow.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {user?.role === 'staff' && (
                <Link
                  to="/portal/workspace"
                  className="btn bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200/80 font-extrabold text-xs uppercase tracking-wider px-5 h-12 rounded-2xl shadow-sm gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  <span>My Workspace</span>
                </Link>
              )}
              <Link
                to="/portal/job-requests"
                className="btn bg-white hover:bg-slate-50 text-blue-700 border border-blue-200/80 font-extrabold text-xs uppercase tracking-wider px-6 h-12 rounded-2xl shadow-lg shadow-blue-500/10 gap-2 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{user?.role === 'staff' ? 'View My Requests' : 'View All Requests'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Floating Stats Tiles Grid (Integrated directly on top of 3D Canvas, like Reference Image 1) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 pt-2">
            {/* 1. Total Requests */}
            <Link
              to="/portal/job-requests?tab=all"
              className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-slate-300/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-700 transition-colors">
                  {user?.role === 'staff' ? 'My Projects' : 'Total Requests'}
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.totalRequests}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  {user?.role === 'staff' ? 'Assigned to me' : 'All submissions'}
                </div>
              </div>
            </Link>

            {/* 2. Pending Review (Managers) OR My Sub-Tasks (Staff) */}
            {user?.role === 'staff' ? (
              <a
                href="#my-subtasks"
                className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-blue-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 group-hover:text-blue-800 transition-colors">
                    My Sub-Tasks
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ListTodo className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                    {pendingMyTasks.length}
                  </div>
                  <div className="text-[10px] font-bold text-blue-500/80">Pending action</div>
                </div>
              </a>
            ) : (
              <Link
                to="/portal/job-requests?status=manager_approval"
                className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-blue-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 group-hover:text-blue-800 transition-colors">
                    Pending Review
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                    {stats.pendingApprovals}
                  </div>
                  <div className="text-[10px] font-bold text-blue-500/80">Needs review</div>
                </div>
              </Link>
            )}

            {/* 3. Staff Processing */}
            <Link
              to="/portal/job-requests?status=staff_processing"
              className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-purple-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 group-hover:text-purple-800 transition-colors">
                  Staff Processing
                </span>
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                  {stats.processing}
                </div>
                <div className="text-[10px] font-bold text-purple-500/80">In production</div>
              </div>
            </Link>

            {/* 4. On Hold */}
            <Link
              to="/portal/job-requests?status=on_hold"
              className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-amber-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 group-hover:text-amber-800 transition-colors">
                  On Hold
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <PauseCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                  {stats.onHold || 0}
                </div>
                <div className="text-[10px] font-bold text-amber-600/80">Paused work</div>
              </div>
            </Link>

            {/* 5. Cancelled */}
            <Link
              to="/portal/job-requests?tab=history&status=cancelled"
              className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-rose-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 group-hover:text-rose-800 transition-colors">
                  Cancelled
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  {stats.cancelled || 0}
                </div>
                <div className="text-[10px] font-bold text-rose-500/80">Terminated</div>
              </div>
            </Link>

            {/* 6. Completed Requests */}
            <Link
              to="/portal/job-requests?tab=history&status=completed"
              className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/90 shadow-md shadow-emerald-200/40 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 group-hover:text-emerald-800 transition-colors">
                  Completed
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {stats.completed}
                </div>
                <div className="text-[10px] font-bold text-emerald-600/80">Delivered</div>
              </div>
            </Link>
          </div>
        </div>
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
      {user?.role === 'staff' && (
        <div id="my-subtasks" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 scroll-mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" /> My Assigned Sub-Tasks ({activeMyTasks.length} Active)
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Pecahan tugasan peribadi anda. Untuk memuktamadkan kerja siap sepenuhnya bagi tiket utama, sila masuk ke projek berkenaan.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {activeMyTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                You have no active sub-tasks assigned at the moment.
              </p>
            ) : (
              activeMyTasks.map((t) => {
                const isDone = Boolean(t.is_user_done);
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-slate-50/70 border-slate-200/70'
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        t.is_group
                          ? 'bg-purple-50 border-purple-200/80 text-purple-600'
                          : isDone
                          ? 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                          : 'bg-indigo-50 border-indigo-200/80 text-indigo-600'
                      }`}>
                        {t.is_group ? (
                          <Users className="w-5 h-5" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <ListTodo className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-slate-200">
                            #{t.ticket_no}
                          </span>
                          <h4 className={`font-bold text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {t.title}
                          </h4>
                          {isDone && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                          Project: <strong className="text-slate-800">{t.job_title}</strong> {t.job_unit ? `(${t.job_unit})` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {/* Donut Chart for Group Projects */}
                      {t.is_group && (
                        <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 px-3 py-1.5 rounded-2xl border border-slate-200/80 shrink-0">
                          {/* Donut Chart SVG */}
                          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                              {/* Background track */}
                              <circle
                                cx="20"
                                cy="20"
                                r="15"
                                className="stroke-slate-200"
                                strokeWidth="3.5"
                                fill="transparent"
                              />
                              {/* Progress ring */}
                              <circle
                                cx="20"
                                cy="20"
                                r="15"
                                className={`${
                                  (t.progress_percent || 0) === 100
                                    ? 'stroke-emerald-500'
                                    : (t.progress_percent || 0) > 0
                                    ? 'stroke-indigo-600'
                                    : 'stroke-slate-300'
                                } transition-all duration-500 ease-out`}
                                strokeWidth="3.5"
                                strokeDasharray={2 * Math.PI * 15}
                                strokeDashoffset={2 * Math.PI * 15 * (1 - (t.progress_percent || 0) / 100)}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-[9.5px] font-black text-slate-800">
                              {t.progress_percent || 0}%
                            </span>
                          </div>

                          <div className="text-left hidden sm:block">
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Team Progress</div>
                            <div className="text-[11px] font-bold text-slate-700">
                              {t.completed_staff || 0}/{t.total_staff || 1} Done
                            </div>
                          </div>
                        </div>
                      )}

                      <Link
                        to={`/portal/job-requests/${t.job_request_id}`}
                        className="btn btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200/80 font-bold text-xs rounded-xl px-3.5 h-10 gap-1.5 shadow-2xs transition-all flex items-center shrink-0"
                      >
                        <span>View Project</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}



      {/* Recent Activity Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {user?.role === 'staff' ? 'My Recent Assigned Projects' : 'Recent Job Requests'}
          </h2>
          <Link to="/portal/job-requests" className="text-xs text-blue-600 font-bold hover:underline">
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
                      <StatusBadge
                        status={req.status}
                        stepName={req.current_step_name}
                        isInterUnit={req.ticket_no?.startsWith('IU') || req.additional_data?.is_inter_unit}
                      />
                    </td>
                    <td className="text-xs text-slate-500 font-medium">{req.created_at}</td>
                    <td className="text-center">
                      <Link to={`/portal/job-requests/${req.id}`} className="btn btn-ghost btn-xs text-blue-600 font-bold hover:bg-blue-50">
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
