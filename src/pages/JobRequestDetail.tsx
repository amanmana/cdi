import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Calendar,
  FileText,
  Send,
  ShieldCheck,
  MessageSquare,
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Copy,
  AlertCircle,
  X,
} from 'lucide-react';

export const JobRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [comment, setComment] = useState('');
  const [reportText, setReportText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Mark as Done Modal State
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);

  // Edit Report State
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [editingReportText, setEditingReportText] = useState('');

  // Manage Team Modal State
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);

  // View Notes Modal State for Completed Staff
  const [showViewNotesModal, setShowViewNotesModal] = useState(false);

  // Sub-task builder state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const fetchDetail = () => {
    fetch(`/api/job-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.request) {
          setData(resData);
          setStartDate(resData.request.start_date || new Date().toISOString().split('T')[0]);
          setDeadline(resData.request.deadline || '');
          if (resData.request.assigned_staff_ids) {
            setSelectedStaff(resData.request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();

    fetch('/api/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((tData) => {
        if (tData.staffMembers) setTeamMembers(tData.staffMembers);
      })
      .catch((err) => console.error(err));
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
        <p className="mt-3 text-xs text-slate-400 font-medium">Loading request details...</p>
      </div>
    );
  }

  if (!data || !data.request) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md mx-auto my-12">
        <h2 className="text-xl font-extrabold text-slate-800">Job request not found.</h2>
        <Link to="/portal/job-requests" className="btn btn-primary bg-indigo-600 border-indigo-600 text-white rounded-xl btn-sm mt-4 font-bold">
          Back to List
        </Link>
      </div>
    );
  }

  const { request, tasks, history, reports, canAct } = data;

  const handleOpenApproveModal = () => {
    if (!startDate) {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    setActionLoading(true);
    try {
      // 1. Update assigned team
      if (selectedStaff.length > 0) {
        await fetch(`/api/job-requests/${id}/update-team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ staff_ids: selectedStaff }),
        });
      }

      // 2. Update timeline
      await fetch(`/api/job-requests/${id}/update-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ start_date: startDate, deadline }),
      });

      // 3. Perform approval transition
      const res = await fetch(`/api/job-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: comment || 'Request approved. Proceed with implementation.' }),
      });

      const resData = await res.json();
      if (resData.success) {
        setShowApproveModal(false);
        setComment('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: rejectReason }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowRejectModal(false);
        setRejectReason('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment }),
      });
      const resData = await res.json();
      if (resData.success) {
        setComment('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/update-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staff_ids: selectedStaff }),
      });
      const resData = await res.json();
      if (resData.success) {
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTimeline = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/job-requests/${id}/update-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ start_date: startDate, deadline }),
      });
      fetchDetail();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddReport = async () => {
    if (!reportText.trim()) {
      alert('Please enter your progress update or note.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ report_text: reportText }),
      });
      const resData = await res.json();
      if (resData.success) {
        setReportText('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkMyPartDone = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/mark-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.success) {
        setShowMarkDoneModal(false);
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTeamAssignments = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/update-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staff_ids: selectedStaff }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowManageTeamModal(false);
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStaffSelection = (staffId: number) => {
    // If the logged-in user is staff, prevent them from removing themselves
    if (user?.role === 'staff' && staffId === user?.id) {
      return;
    }
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter((sid) => sid !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };

  const handleUpdateReport = async (reportId: number) => {
    if (!editingReportText.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ report_text: editingReportText }),
      });
      const resData = await res.json();
      if (resData.success) {
        setEditingReportId(null);
        setEditingReportText('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this note/report?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.success) {
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssignee) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assigned_to_user_id: parseInt(taskAssignee),
          due_date: taskDueDate,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssignee('');
        setTaskDueDate('');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/job-requests/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDetail();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/job-requests/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDetail();
    } finally {
      setActionLoading(false);
    }
  };


  const handleCopyHistory = () => {
    if (!history || history.length === 0) return;
    const historyText = history
      .map(
        (h: any) =>
          `[${h.created_at}] ${h.action} by ${h.actor_name || 'System'}${
            h.comment ? `: "${h.comment}"` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(historyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Not Set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderStatusCapsule = (status: string) => {
    if (status === 'manager_approval') {
      return (
        <span className="bg-amber-400 text-slate-950 font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
          MANAGER APPROVAL
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="bg-emerald-500 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
          COMPLETED
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="bg-rose-500 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
          REJECTED
        </span>
      );
    }
    return (
      <span className="bg-indigo-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
        STAFF PROCESSING
      </span>
    );
  };

  const getStepState = (stepNumber: number) => {
    const status = request.status;
    if (status === 'manager_approval') {
      if (stepNumber === 1 || stepNumber === 2) return 'active';
      return 'pending';
    }
    if (status === 'staff_processing') {
      if (stepNumber <= 3) return 'active';
      return 'pending';
    }
    if (status === 'completed') {
      return 'completed';
    }
    return 'pending';
  };

  const completedTasksCount = tasks ? tasks.filter((t: any) => t.status === 'completed').length : 0;
  const totalTasksCount = tasks ? tasks.length : 0;

  return (
    <div className="space-y-6 antialiased">
      {/* Top Header / Breadcrumb matching Reference Image 2 */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            REQUEST DETAILS
          </span>
          <Link
            to="/portal/job-requests"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5 mt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Requests List
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid Layout matching Reference Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Request Header Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
            {/* Top Title & Status Capsule Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                  REQUEST #{request.ticket_no}
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{request.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-500">INTERNAL ID: #{request.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase px-3 py-1 rounded-xl">
                    SUBMITTED ON {formatDateDisplay(request.created_at)}
                  </span>
                </div>
              </div>

              {/* Status Capsule Badge & Progress Indicator matching Reference Image */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mb-1"></span>
                  <span className="text-xs font-extrabold text-indigo-600">0%</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">PROGRESS</span>
                </div>

                <div>{renderStatusCapsule(request.status)}</div>
              </div>
            </div>

            {/* Client Info Soft Box */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    CLIENT NAME
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {request.client_name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    EMAIL
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {request.client_email}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TEAM ASSIGNMENT & STATUS
                  </span>

                  {/* EDIT Button matching Reference Image 2 */}
                  {(user?.role === 'admin' ||
                    user?.role === 'manager' ||
                    user?.is_acting_manager ||
                    (user?.role === 'staff' && request.status !== 'completed' && request.status !== 'rejected')) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (request.assigned_staff_ids) {
                          setSelectedStaff(request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
                        }
                        setShowManageTeamModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-extrabold uppercase flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> EDIT
                    </button>
                  )}
                </div>

                {data.staffDetails && data.staffDetails.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {data.staffDetails.map((s: any) => (
                      <div key={s.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">{s.name}</div>
                            <div className="text-[10px] font-semibold text-slate-400 truncate">{s.email}</div>
                          </div>
                        </div>
                        {s.is_done ? (
                          <span className="badge bg-emerald-500 text-white font-extrabold text-[9px] uppercase px-3 py-1 rounded-xl border-none tracking-wider shrink-0 gap-1 shadow-sm">
                            ✓ DONE
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500 font-extrabold text-[9px] uppercase px-2.5 py-1 border-none tracking-wider shrink-0">
                            PENDING
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic font-semibold block my-2">● Not yet assigned</span>
                )}
              </div>
            </div>

            {/* Project Requirements Soft Box */}
            <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/70 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>PROJECT REQUIREMENTS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Additional Form Data Fields */}
                {request.additional_data &&
                  Object.entries(request.additional_data).map(([k, v]) => (
                    <div key={k} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {k.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{String(v)}</span>
                    </div>
                  ))}

                {/* Detailed Description Field */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    DETAILED DESCRIPTION
                  </span>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {request.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Progress Stepper Card matching Reference Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-6">
              Workflow Progress
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-9 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {/* Step 1 */}
              <div className="relative flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center z-10 shadow-md">
                  1
                </div>
                <span className="text-sm font-bold text-slate-900">Submitted</span>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-center gap-4">
                <div
                  className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center z-10 shadow-md ${
                    getStepState(2) !== 'pending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-bold ${
                    getStepState(2) !== 'pending' ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Manager Review
                </span>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-center gap-4">
                <div
                  className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center z-10 shadow-md ${
                    getStepState(3) !== 'pending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-sm font-bold ${
                    getStepState(3) !== 'pending' ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Staff Processing
                </span>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-center gap-4">
                <div
                  className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center z-10 shadow-md ${
                    getStepState(4) === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  4
                </div>
                <span
                  className={`text-sm font-bold ${
                    getStepState(4) === 'completed' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Designer Sub-Tasks Breakdown (Admin only) */}
          {user?.role === 'admin' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-600" /> Designer Sub-Tasks Breakdown
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Create and assign specific tasks to designers for this job request.
                  </p>
                </div>
                {totalTasksCount > 0 && (
                  <span className="badge bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 border-none">
                    {completedTasksCount} of {totalTasksCount} Sub-tasks Completed
                  </span>
                )}
              </div>

              {/* Add Sub-Task Form */}
              {user?.role !== 'client' && (
                <form
                  onSubmit={handleCreateSubTask}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 mb-6"
                >
                  <div className="md:col-span-2">
                    <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Design FB Banner Concept A"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                    />
                  </div>

                  <div>
                    <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">
                      Assign Designer *
                    </label>
                    <select
                      required
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="select select-bordered select-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                    >
                      <option value="">-- Select Designer --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 shadow-md shadow-indigo-500/20"
                    >
                      <Plus className="w-4 h-4" /> Add Sub-Task
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            handleTaskStatusChange(
                              task.id,
                              task.status === 'completed' ? 'in_progress' : 'completed'
                            )
                          }
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            task.status === 'completed'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 bg-white text-transparent hover:border-indigo-600'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <h4
                            className={`font-bold text-sm ${
                              task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>
                              Assigned to: <strong className="text-indigo-600">{task.assigned_to_name}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Due: <strong className="text-slate-700">{task.due_date || 'N/A'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          className="select select-bordered select-xs bg-white border-slate-200 rounded-lg text-xs font-bold"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        {(user?.role === 'admin' ||
                          user?.role === 'manager' ||
                          user?.id === task.assigned_by_user_id) && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No sub-tasks created yet. Click "Add Sub-Task" to break down work for designers.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (1 Column Wide) matching Reference Image 2 */}
        <div className="space-y-6">
          {/* PROJECT TIMELINE Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>PROJECT TIMELINE</span>
            </div>

            <div className="space-y-4">
              {/* Start Date */}
              <div className="flex items-center gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    START DATE
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {formatDateDisplay(request.start_date)}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-3 bg-rose-50/40 p-3.5 rounded-2xl border border-rose-100/60">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block">
                    DATELINE / DEADLINE
                  </span>
                  <span className="text-xs font-extrabold text-rose-600">
                    {formatDateDisplay(request.deadline)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PART COMPLETED CARD WITH VIEW NOTE BUTTON (For completed Staff) */}
          {user?.role === 'staff' && !user?.is_acting_manager && (
            data?.staffDetails?.some((s: any) => s.id === user?.id && s.is_done) ||
            history?.some((h: any) => h.actor_id === user?.id && h.action === 'STAFF_DONE') ||
            request.status === 'completed'
          ) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-emerald-800 tracking-wider uppercase">
                  PART COMPLETED
                </h3>
                <p className="text-xs font-semibold text-emerald-600 leading-relaxed max-w-xs mx-auto">
                  You have finalized your work for this project.
                </p>
              </div>

              {/* View Note Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowViewNotesModal(true)}
                  className="btn w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl h-11 uppercase tracking-wider shadow-md gap-2 flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 text-emerald-400" /> View Note
                </button>
              </div>
            </div>
          )}

          {/* Workflow Actions Card (Hidden for Client and when Staff has completed their part) */}
          {user?.role !== 'client' &&
            !(user?.role === 'staff' && (
              data?.staffDetails?.some((s: any) => s.id === user?.id && s.is_done) ||
              history?.some((h: any) => h.actor_id === user?.id && h.action === 'STAFF_DONE') ||
              request.status === 'completed'
            )) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Workflow Actions</span>
              </div>

            {/* Note / Report Section (Staff Page Only) */}
            {user?.role === 'staff' && !user?.is_acting_manager && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  NOTE / REPORT
                </span>

                {reports && reports.length > 0 && (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {reports.map((r: any) => (
                      <div key={r.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/90 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-slate-400">
                            {r.created_at ? formatDateDisplay(r.created_at) : 'Recent'}
                          </div>

                          {/* Edit & Delete Action Icons matching Reference Image */}
                          {(user?.role === 'admin' || user?.role === 'manager' || user?.id === r.staff_id) && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReportId(r.id);
                                  setEditingReportText(r.report_text);
                                }}
                                className="text-blue-500 hover:text-blue-700 transition-colors p-0.5"
                                title="Edit Note"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(r.id)}
                                className="text-rose-500 hover:text-rose-700 transition-colors p-0.5"
                                title="Delete Note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800 leading-snug">
                          {r.report_text}
                        </div>

                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pt-0.5">
                          — {r.staff_name || 'STAFF'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Type your report or progress update here..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all resize-none shadow-inner"
                ></textarea>

                <button
                  type="button"
                  onClick={handleAddReport}
                  disabled={actionLoading}
                  className="btn w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl h-11 uppercase tracking-wider shadow-sm"
                >
                  {actionLoading ? <span className="loading loading-spinner"></span> : 'ADD NOTE / REPORT'}
                </button>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                JOB STATUS SUBMISSION
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Action Buttons based on Role & Status */}
            {canAct && (
              <div className="space-y-2">
                {request.status === 'manager_approval' && (user?.role === 'admin' || user?.role === 'manager') && (
                  <>
                    <button
                      onClick={handleOpenApproveModal}
                      disabled={actionLoading}
                      className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl h-12 border-none shadow-lg shadow-emerald-500/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" /> APPROVE REQUEST
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="btn w-full border border-rose-300 bg-white hover:bg-rose-50 text-rose-500 font-extrabold text-xs rounded-2xl h-12 uppercase tracking-wider gap-2"
                    >
                      <XCircle className="w-4.5 h-4.5" /> REJECT REQUEST
                    </button>
                  </>
                )}

                {request.status === 'staff_processing' && (
                  <>
                    {(data.staffDetails?.some((s: any) => s.id === user?.id && s.is_done) ||
                      history?.some((h: any) => h.actor_id === user?.id && h.action === 'STAFF_DONE')) ? (
                      /* PART COMPLETED Box matching Reference Image 1 & 2 */
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-6 text-center space-y-2 my-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                          <CheckCircle2 className="w-5.5 h-5.5 stroke-[2.5]" />
                        </div>
                        <div className="text-xs font-black text-emerald-800 tracking-wider uppercase">
                          PART COMPLETED
                        </div>
                        <div className="text-xs font-semibold text-emerald-600 leading-relaxed">
                          You have finalized your work for this project.
                        </div>
                      </div>
                    ) : (
                      /* Bright Cyan MARK MY PART AS DONE button for Staff */
                      <button
                        type="button"
                        onClick={() => setShowMarkDoneModal(true)}
                        disabled={actionLoading}
                        className="btn w-full bg-sky-400 hover:bg-sky-500 border-none text-white font-extrabold text-xs rounded-2xl h-12 uppercase tracking-wider shadow-lg shadow-sky-400/25 gap-2"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5" /> MARK MY PART AS DONE
                      </button>
                    )}

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button
                        onClick={handleComplete}
                        disabled={actionLoading}
                        className="btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl h-12 border-none shadow-lg shadow-indigo-500/20 uppercase tracking-wider gap-2 mt-2"
                      >
                        <ShieldCheck className="w-4.5 h-4.5" /> MARK PROJECT COMPLETED
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

          {/* Activity History Card matching Reference Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Activity History</h3>
              <button
                onClick={handleCopyHistory}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white btn-xs rounded-xl font-bold gap-1 normal-case px-3"
              >
                <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy History'}
              </button>
            </div>

            <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {history && history.length > 0 ? (
                history.map((h: any) => (
                  <div key={h.id} className="relative space-y-1">
                    <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full border-2 border-indigo-600 bg-white"></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {h.created_at}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 uppercase">{h.action}</div>
                    <div className="text-xs text-slate-500 font-semibold">
                      by {h.actor_name || 'System / Public'}
                    </div>
                    {h.comment && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs italic font-medium text-slate-600 mt-1">
                        "{(() => {
                          const comment = h.comment || '';
                          if (comment.includes('Updated assigned staff list:') || comment.includes('Updated team assignment to:')) {
                            const rawList = comment.split(':')[1]?.trim() || '';
                            if (rawList && /^[0-9,\s]+$/.test(rawList)) {
                              const ids = rawList.split(',').map((idStr: string) => parseInt(idStr.trim()));
                              const names = ids
                                .map((idNum: number) => teamMembers.find((tm) => tm.id === idNum)?.name)
                                .filter(Boolean);
                              if (names.length > 0) {
                                return `Updated team assignment to: ${names.join(', ')}`;
                              }
                            }
                          }
                          return comment;
                        })()}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No activity history logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE THIS REQUEST MODAL matching Reference Image 1 */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Modal Title & Subtitle */}
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Approve This Request?
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                This will move the request to the staff processing stage.
              </p>
            </div>

            {/* Assign to Staff Member Container matching Reference Image 1 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Assign to Staff Member
              </label>
              <div className="border border-blue-600 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2 bg-white">
                {teamMembers.map((m) => {
                  const isChecked = selectedStaff.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      onClick={() => {
                        if (isChecked) setSelectedStaff(selectedStaff.filter((sid) => sid !== m.id));
                        else setSelectedStaff([...selectedStaff, m.id]);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{m.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 font-semibold italic">
                Select one or more staff members to handle this project
              </p>
            </div>

            {/* Start Date & Deadline 2-Column Inputs matching Reference Image 1 */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl h-11 px-3 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl h-11 px-3 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Add a comment (optional) matching Reference Image 1 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Add a comment (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Instruction for staff..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
              ></textarea>
            </div>

            {/* Modal Bottom Action Buttons matching Reference Image 1 */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider px-3 py-2"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
                className="btn bg-emerald-500 hover:bg-emerald-600 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 uppercase tracking-wider shadow-lg shadow-emerald-500/25"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : 'CONFIRM & ASSIGN'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* REJECT THIS REQUEST MODAL matching Reference Image */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 space-y-6">
            {/* Modal Title in Red matching Reference Image */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-rose-500 uppercase tracking-wider">
                REJECT THIS REQUEST?
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Please provide a reason for this rejection for record purposes.
              </p>
            </div>

            {/* Rejection Reason Textarea matching Reference Image */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Rejection Reason
              </label>
              <textarea
                rows={4}
                placeholder="Tell the client why..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-blue-400 bg-white p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-none transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            {/* Modal Bottom Buttons matching Reference Image */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="text-xs font-black text-slate-600 hover:text-slate-900 uppercase tracking-wider px-4 py-2"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="btn bg-rose-500 hover:bg-rose-600 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 uppercase tracking-wider shadow-lg shadow-rose-500/25 gap-2"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : <><XCircle className="w-4 h-4" /> CONFIRM REJECTION</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK AS DONE CONFIRMATION MODAL matching Reference Image */}
      {showMarkDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-md w-full p-8 text-center space-y-6">
            {/* Big Question Mark Circle Icon matching Reference Image */}
            <div className="flex justify-center pt-2">
              <div className="w-20 h-20 rounded-full border-4 border-slate-300 flex items-center justify-center text-slate-400 font-light text-4xl leading-none">
                ?
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                Mark as Done?
              </h3>
              <p className="text-sm font-semibold text-slate-500 max-w-xs mx-auto leading-relaxed">
                This will notify the manager that your portion of the work is finished.
              </p>
            </div>

            {/* Modal Action Buttons matching Reference Image */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleMarkMyPartDone}
                disabled={actionLoading}
                className="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold text-xs rounded-2xl px-5 h-12 uppercase tracking-wider shadow-lg shadow-blue-500/25 flex-1"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : 'YES, I AM DONE!'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMarkDoneModal(false);
                  const textarea = document.querySelector('textarea');
                  if (textarea) textarea.focus();
                }}
                className="btn bg-slate-100 hover:bg-slate-200 border-none text-slate-600 font-extrabold text-xs rounded-2xl px-4 h-12 uppercase tracking-wider flex-1"
              >
                WAIT, LET ME ADD A NOTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REPORT MODAL matching Reference Image */}
      {editingReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 space-y-6">
            {/* Modal Title matching Reference Image */}
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Edit Report / Note
              </h3>
            </div>

            {/* Textarea matching Reference Image */}
            <div>
              <textarea
                rows={4}
                value={editingReportText}
                onChange={(e) => setEditingReportText(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-blue-500 bg-white p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-none transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            {/* Modal Bottom Buttons matching Reference Image */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => { setEditingReportId(null); setEditingReportText(''); }}
                className="text-xs font-black text-slate-600 hover:text-slate-900 uppercase tracking-wider px-4 py-2"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleUpdateReport(editingReportId)}
                disabled={actionLoading}
                className="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 shadow-lg shadow-blue-500/25"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : 'Update Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TEAM ASSIGNMENT MODAL matching Reference Image 3 */}
      {showManageTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 space-y-6">
            {/* Title & Subtitle matching Reference Image 3 */}
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Manage Team Assignment
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Add or remove staff assigned to this project.
              </p>
            </div>

            {/* Staff List with Checkboxes matching Reference Image 3 */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 max-h-64 overflow-y-auto space-y-2.5">
              {teamMembers && teamMembers.map((m: any) => {
                const isSelected = selectedStaff.includes(m.id);
                const isSelfStaff = user?.role === 'staff' && m.id === user?.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => !isSelfStaff && toggleStaffSelection(m.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isSelfStaff ? 'opacity-65 cursor-not-allowed bg-slate-100/50 border-slate-200' : 'cursor-pointer'
                    } ${
                      !isSelfStaff && isSelected
                        ? 'bg-white border-blue-500/80 shadow-sm'
                        : !isSelfStaff
                        ? 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'
                        : ''
                    }`}
                  >
                    {/* Custom Checkbox matching Image 3 */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? isSelfStaff 
                            ? 'bg-slate-400 text-white' 
                            : 'bg-blue-600 text-white' 
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="text-xs font-black">✓</span>}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {m.name} {isSelfStaff && <span className="text-[10px] text-slate-400 font-semibold italic">(You)</span>}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">{m.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Buttons matching Reference Image 3 */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowManageTeamModal(false)}
                className="text-xs font-black text-slate-600 hover:text-slate-900 uppercase tracking-wider px-4 py-2"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleUpdateTeamAssignments}
                disabled={actionLoading}
                className="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 shadow-lg shadow-blue-500/25"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : 'Update Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VIEW NOTES MODAL FOR COMPLETED STAFF */}
      {showViewNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Project Notes & Reports
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    All progress updates logged for this project.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewNotesModal(false)}
                className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes List Container */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {reports && reports.length > 0 ? (
                reports.map((r: any) => (
                  <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400">
                        {r.created_at ? formatDateDisplay(r.created_at) : 'Recent'}
                      </div>
                      <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                        — {r.staff_name || 'STAFF'}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-relaxed">
                      {r.report_text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic font-semibold">
                    No notes or reports submitted yet for this project.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Button */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowViewNotesModal(false)}
                className="btn bg-slate-100 hover:bg-slate-200 border-none text-slate-700 font-extrabold text-xs rounded-2xl px-6 h-11 uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
