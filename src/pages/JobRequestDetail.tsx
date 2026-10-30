import React, { useEffect, useState, useMemo } from 'react';
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
  Wrench,
  Users,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
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

  // Inter-Unit Collaborative Handoff Modal State
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffType, setHandoffType] = useState<'pass' | 'request_revision'>('pass');
  const [handoffTargetStaffId, setHandoffTargetStaffId] = useState<number | ''>('');
  const [handoffNote, setHandoffNote] = useState('');
  const [handoffDraftUrl, setHandoffDraftUrl] = useState('');

  // View Notes Modal State for Completed Staff
  const [showViewNotesModal, setShowViewNotesModal] = useState(false);

  // Edit Timeline Modal State
  const [showEditTimelineModal, setShowEditTimelineModal] = useState(false);
  const [timelineReason, setTimelineReason] = useState('');

  // Status Change Modal State (Pending / Cancel)
  const [showStatusModal, setShowStatusModal] = useState<'on_hold' | 'cancelled' | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Sub-task builder state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Per-staff assigned task map state
  const [staffTasks, setStaffTasks] = useState<{ [staffId: number]: string }>({});

  // Unit filter tab state for modals: default to 'Head' for managers/admins, 'All' for staff
  const isManagerOrAdminUser = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'director' || user?.is_acting_manager;
  const [staffUnitFilter, setStaffUnitFilter] = useState<string>(isManagerOrAdminUser ? 'Head' : 'All');

  // Accessible staff for the current user and job request
  const accessibleTeamMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];
    return teamMembers.filter((m: any) => {
      // 1. Superusers (Admin and Director) see all staff
      if (user?.role === 'admin' || user?.role === 'director') return true;

      // 2. Managers and Acting Managers have department-wide visibility
      if (user?.role === 'manager' || user?.is_acting_manager) {
        const userDeptId = (user as any)?.managed_department_id || (user as any)?.department_id || (user as any)?.acting_manager_department_id;
        const reqDeptId = data?.request?.department_id;

        // Department ID match
        if (userDeptId && m.department_id && String(m.department_id) === String(userDeptId)) return true;
        if (reqDeptId && m.department_id && String(m.department_id) === String(reqDeptId)) return true;

        // Department Name match
        if (user?.department_name && m.department_name && user.department_name.toLowerCase().trim() === m.department_name.toLowerCase().trim()) return true;
        if (data?.request?.department_name && m.department_name && data.request.department_name.toLowerCase().trim() === m.department_name.toLowerCase().trim()) return true;

        // Fallback Unit match
        if (user?.unit && m.unit?.toLowerCase().trim() === user.unit?.toLowerCase().trim()) return true;
        if (data?.request?.unit && m.unit?.toLowerCase().trim() === data.request.unit?.toLowerCase().trim()) return true;

        return false;
      }

      // 3. Staff & Unit Heads: Strictly scoped to their managed unit(s) or own unit
      const managedUnits: string[] = (user as any)?.managed_units || [];
      const userUnit = user?.unit?.toLowerCase().trim();

      // Check if member belongs to any unit managed by this user
      if (managedUnits.length > 0) {
        if (m.unit && managedUnits.some((u: string) => u.toLowerCase().trim() === m.unit.toLowerCase().trim())) {
          return true;
        }
      }

      // Check if member belongs to user's own unit
      if (userUnit && m.unit?.toLowerCase().trim() === userUnit) {
        return true;
      }

      return false;
    });
  }, [teamMembers, user, data?.request]);

  // Unique units available among accessible staff
  const availableModalUnits = useMemo(() => {
    const unitSet = new Set<string>();
    accessibleTeamMembers.forEach((m) => {
      if (m.unit && m.unit.trim()) {
        unitSet.add(m.unit.trim());
      }
    });
    return Array.from(unitSet).sort();
  }, [accessibleTeamMembers]);

  // Filtered staff list based on active unit filter tab
  const filteredModalStaff = useMemo(() => {
    if (staffUnitFilter === 'Head') {
      const heads = accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head));
      return heads.length > 0 ? heads : accessibleTeamMembers;
    }
    if (staffUnitFilter === 'All') return accessibleTeamMembers;
    return accessibleTeamMembers.filter((m) => m.unit?.trim().toLowerCase() === staffUnitFilter.trim().toLowerCase());
  }, [accessibleTeamMembers, staffUnitFilter]);

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
          // Extract existing staff tasks
          const tMap: { [staffId: number]: string } = {};
          if (resData.request.additional_data?.staff_tasks) {
            Object.assign(tMap, resData.request.additional_data.staff_tasks);
          }
          if (resData.tasks && Array.isArray(resData.tasks)) {
            resData.tasks.forEach((t: any) => {
              if (t.assigned_to_user_id && t.title) {
                tMap[t.assigned_to_user_id] = t.title;
              }
            });
          }
          setStaffTasks(tMap);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
    if (id && user?.id) {
      try {
        const stored = localStorage.getItem(`opened_jobs_${user.id}`);
        const openedList: number[] = stored ? JSON.parse(stored) : [];
        if (!openedList.includes(Number(id))) {
          openedList.push(Number(id));
          localStorage.setItem(`opened_jobs_${user.id}`, JSON.stringify(openedList));
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetch('/api/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((tData) => {
        if (tData.staffMembers) setTeamMembers(tData.staffMembers);
      })
      .catch((err) => console.error(err));
  }, [id, token, user?.id]);

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

  const { request, targetUnitHead, tasks, history, reports, canAct } = data;
  const totalStaff = data.staffDetails?.length || 0;
  const completedStaff = data.staffDetails?.filter((s: any) => s.is_done).length || 0;
  const percent = request.status === 'completed' ? 100 : totalStaff > 0 ? Math.round((completedStaff / totalStaff) * 100) : 0;
  const isUserDone = data.staffDetails?.find((s: any) => s.id === user?.id)?.is_done || false;

  const approveLog = history?.find((h: any) => h.action === 'APPROVE');
  const managerComment = approveLog ? approveLog.comment : null;

  const handleOpenApproveModal = () => {
    if (!startDate) {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
    if (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'director' || user?.is_acting_manager) {
      setStaffUnitFilter('Head');
    }
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedStaff || selectedStaff.length === 0) {
      alert("Please select at least one staff member before approving this request.");
      return;
    }
    if (!deadline) {
      alert("Please set a deadline date before approving this request.");
      return;
    }
    if (startDate && deadline && deadline < startDate) {
      alert("Deadline date cannot be earlier than Start Date.");
      return;
    }
    setActionLoading(true);
    try {
      // 1. Update assigned team (for Inter-Unit jobs, preserve origin staff if already assigned)
      let combinedStaff = [...selectedStaff];
      if (request.additional_data?.origin_staff_id) {
        const oId = Number(request.additional_data.origin_staff_id);
        if (!combinedStaff.includes(oId)) {
          combinedStaff.push(oId);
        }
      } else if (request.assigned_staff_ids) {
        const existingIds = request.assigned_staff_ids.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n));
        existingIds.forEach((eid: number) => {
          if (!combinedStaff.includes(eid)) combinedStaff.push(eid);
        });
      }

      if (combinedStaff.length > 0) {
        await fetch(`/api/job-requests/${id}/update-team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ staff_ids: combinedStaff }),
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
    if (startDate && deadline && deadline < startDate) {
      alert("Deadline date cannot be earlier than Start Date.");
      return;
    }
    setActionLoading(true);
    try {
      await fetch(`/api/job-requests/${id}/update-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ start_date: startDate, deadline, reason: timelineReason }),
      });
      setShowEditTimelineModal(false);
      setTimelineReason('');
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
        body: JSON.stringify({
          staff_ids: selectedStaff,
          staff_tasks: staffTasks,
        }),
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

  const handleOpenHandoffModal = (type: 'pass' | 'request_revision') => {
    setHandoffType(type);
    setHandoffNote('');
    setHandoffDraftUrl('');

    // Pre-select first eligible other collaborator
    const otherCollaborators = (data?.staffDetails || []).filter(
      (s: any) => Number(s.id) !== Number(user?.id)
    );
    if (otherCollaborators.length > 0) {
      setHandoffTargetStaffId(Number(otherCollaborators[0].id));
    } else if (isInterUnitJob) {
      const addData = request.additional_data;
      if (addData?.origin_staff_id && Number(addData.origin_staff_id) !== Number(user?.id)) {
        setHandoffTargetStaffId(Number(addData.origin_staff_id));
      } else if (addData?.requester_id && Number(addData.requester_id) !== Number(user?.id)) {
        setHandoffTargetStaffId(Number(addData.requester_id));
      } else {
        setHandoffTargetStaffId('');
      }
    } else {
      setHandoffTargetStaffId('');
    }
    setShowHandoffModal(true);
  };

  const handleHandoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffTargetStaffId) {
      alert('Please select a collaborator to hand over or request revision from.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action_type: handoffType,
          target_staff_id: handoffTargetStaffId,
          note: handoffNote,
          draft_url: handoffDraftUrl,
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success) {
        setShowHandoffModal(false);
        setHandoffNote('');
        setHandoffDraftUrl('');
        fetchDetail();
      } else {
        alert(resData.error || resData.message || `Failed to submit handoff (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      console.error('Handoff error:', err);
      alert(`Network/Client error submitting handoff: ${err?.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStaffSelection = (staffId: number) => {
    // If the logged-in user is staff, prevent them from removing existing assigned team members
    if (user?.role === 'staff' && !user?.is_acting_manager) {
      const isAlreadyAssigned = Boolean(request.assigned_staff_ids?.split(',').map(Number).includes(staffId));
      if (isAlreadyAssigned) {
        return;
      }
    }
    // Prevent removing any staff who has already completed their part
    const projectStaffDetail = data.staffDetails?.find((s: any) => s.id === staffId);
    if (projectStaffDetail?.is_done) {
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


  const formatDateTimeMY = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      let str = dateStr.trim();
      if (!str.endsWith('Z') && !str.includes('+') && !str.includes('GMT')) {
        str = str.replace(' ', 'T') + 'Z';
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).replace(',', '');
    } catch {
      return dateStr;
    }
  };

  const handleCopyHistory = () => {
    if (!history || history.length === 0) return;
    const historyText = history
      .map(
        (h: any) =>
          `[${formatDateTimeMY(h.created_at)}] ${h.action} by ${h.actor_name || 'System'}${
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

  const isInterUnitJob = Boolean(
    request?.ticket_no?.startsWith('IU') ||
    request?.request_type === 'inter_unit' ||
    request?.additional_data?.is_inter_unit
  );

  const managedUnits: string[] = (user as any)?.managed_units || [];
  const managedUnitIds: number[] = (user as any)?.managed_unit_ids || [];
  const reqUnit = request?.unit?.toLowerCase().trim();
  const reqUnitId = request?.unit_id ? Number(request.unit_id) : null;
  const userUnit = user?.unit?.toLowerCase().trim();
  const userUnitId = user?.unit_id ? Number(user.unit_id) : null;

  const isTargetUnitHead = Boolean(
    isInterUnitJob &&
    user?.is_unit_head &&
    (
      (reqUnitId && managedUnitIds.includes(reqUnitId)) ||
      (reqUnit && managedUnits.some((u) => u.toLowerCase().trim() === reqUnit)) ||
      (reqUnitId && userUnitId && reqUnitId === userUnitId) ||
      (reqUnit && userUnit && reqUnit === userUnit)
    )
  );

  const renderStatusCapsule = (status: string) => {
    if (status === 'manager_approval') {
      if (isInterUnitJob) {
        const headName = targetUnitHead?.name || request.additional_data?.target_unit_head_name;
        return (
          <span className="bg-teal-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
            {headName ? `HEAD UNIT (${headName}) APPROVAL` : 'HEAD UNIT APPROVAL'}
          </span>
        );
      }
      return (
        <span className="bg-blue-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
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
    if (status === 'on_hold') {
      return (
        <span className="bg-amber-500 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> PENDING / ON HOLD
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="bg-slate-700 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5" /> CANCELLED
        </span>
      );
    }
    return (
      <span className="bg-purple-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm">
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
          {/* INTER-UNIT REQUEST HIGHLIGHT BANNER */}
          {(request.additional_data?.is_inter_unit || request.ticket_no?.startsWith('IU')) && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-indigo-500/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/20">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight uppercase">Inter-Unit Job Collaboration</h2>
                    <p className="text-[11px] text-blue-100 font-medium">
                      Direct cross-unit request between department unit heads
                    </p>
                  </div>
                </div>
                {request.additional_data?.priority && (
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    request.additional_data.priority === 'urgent'
                      ? 'bg-rose-500/30 text-rose-100 border-rose-300/40 animate-pulse'
                      : request.additional_data.priority === 'high'
                      ? 'bg-amber-500/30 text-amber-100 border-amber-300/40'
                      : 'bg-white/20 text-white border-white/20'
                  }`}>
                    Priority: {request.additional_data.priority}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/15 text-xs">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-black text-blue-200 uppercase tracking-wider block">Requested By</span>
                  <div className="font-extrabold text-white mt-0.5">
                    {request.additional_data?.requester_name || request.client_name}
                  </div>
                  <div className="text-[11px] text-blue-200">
                    Unit: <strong>{request.additional_data?.requester_unit || 'Head'}</strong>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-black text-blue-200 uppercase tracking-wider block">Target Handling Unit</span>
                  <div className="font-extrabold text-white mt-0.5">
                    {request.unit}
                    {(targetUnitHead?.name || request.additional_data?.target_unit_head_name) && (
                      <span className="text-blue-100 font-semibold ml-1">
                        ({targetUnitHead?.name || request.additional_data?.target_unit_head_name})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-blue-200">
                    Reviewer: <strong>Target Unit Head{(targetUnitHead?.name || request.additional_data?.target_unit_head_name) ? ` (${targetUnitHead?.name || request.additional_data?.target_unit_head_name})` : ''}</strong>
                  </div>
                </div>
              </div>

              {request.additional_data?.parent_job_id && (
                <div className="text-[11px] font-semibold text-blue-100 pt-1 flex items-center gap-1.5">
                  <span>Related Reference / Job ID:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg font-mono font-bold text-white">
                    #{request.additional_data.parent_job_id}
                  </span>
                </div>
              )}
            </div>
          )}

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
              <div className="flex items-center gap-5 shrink-0">
                <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
                    {/* Track circle */}
                    <circle
                      cx="25"
                      cy="25"
                      r="21"
                      className="stroke-slate-100"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="25"
                      cy="25"
                      r="21"
                      className="stroke-indigo-600 transition-all duration-500 ease-out"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 21}
                      strokeDashoffset={2 * Math.PI * 21 - (percent / 100) * (2 * Math.PI * 21)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inner Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-black text-indigo-600 leading-none">{percent}%</span>
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                      PROGRESS
                    </span>
                  </div>
                </div>

                <div>{renderStatusCapsule(request.status)}</div>
              </div>
            </div>

            {/* Dedicated Standalone TEAM ASSIGNMENT & STATUS Slate Card */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        TEAM ASSIGNMENT & STATUS
                      </h3>
                      {data.staffDetails && data.staffDetails.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700">
                          {data.staffDetails.filter((s: any) => s.is_done).length} / {data.staffDetails.length} DONE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Assigned staff team working on this project
                    </span>
                  </div>
                </div>

                {/* EDIT / INVITE Button */}
                {(request.status === 'staff_processing') && (user?.role === 'admin' ||
                  user?.role === 'manager' ||
                  user?.is_acting_manager ||
                  (user?.role === 'staff' && !isUserDone)) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (request.assigned_staff_ids) {
                        setSelectedStaff(request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
                      }
                      if (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'director' || user?.is_acting_manager) {
                        setStaffUnitFilter('Head');
                      } else {
                        setStaffUnitFilter('All');
                      }
                      setShowManageTeamModal(true);
                    }}
                    className="btn btn-sm btn-ghost text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-extrabold uppercase flex items-center gap-1.5 rounded-xl transition-all border border-blue-100/60 shadow-xs"
                  >
                    {user?.role === 'staff' && !user?.is_acting_manager ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> INVITE TEAM
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3.5 h-3.5" /> EDIT TEAM
                      </>
                    )}
                  </button>
                )}
              </div>

              {data.staffDetails && data.staffDetails.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {data.staffDetails.map((s: any) => (
                    <div key={s.id} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 shrink-0 shadow-inner overflow-hidden">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            s.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-slate-900 truncate">{s.name}</div>
                          <div className="text-[10px] font-semibold text-slate-400 truncate">{s.email}</div>

                        </div>
                      </div>
                      {s.is_done ? (
                        <span className="badge bg-emerald-500 text-white font-extrabold text-[9px] uppercase px-3 py-2 rounded-xl border-none tracking-wider shrink-0 gap-1 shadow-xs">
                          ✓ DONE
                        </span>
                      ) : (
                        <span className="badge bg-white text-slate-500 font-extrabold text-[9px] uppercase px-3 py-2 border border-slate-200/80 tracking-wider shrink-0">
                          PENDING
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400 font-semibold italic">
                  ● No staff assigned yet
                </div>
              )}
            </div>

            {/* Dedicated STAFF TASKS Card (Hidden for Client role) */}
            {user?.role !== 'client' && (
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-100 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                  <ListTodo className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    STAFF TASKS
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Individual task assignments for team members
                  </span>
                </div>
              </div>

              {data.staffDetails && data.staffDetails.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {data.staffDetails.map((s: any) => {
                    const tText = staffTasks[s.id];
                    const isSelf = Number(s.id) === Number(user?.id);
                    return (
                      <div
                        key={s.id}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                          isSelf
                            ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/15 shadow-sm'
                            : 'bg-slate-50/80 border-slate-200/70 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 overflow-hidden ${
                              isSelf ? 'bg-blue-600 text-white shadow-sm' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              s.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                              <span>{s.name}</span>
                              {isSelf && (
                                <span className="bg-blue-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 truncate">{s.email}</div>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          {tText ? (
                            <span className={`text-xs font-bold ${isSelf ? 'text-blue-950 font-extrabold' : 'text-slate-800'}`}>
                              {tText}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 italic">
                              No specific task assigned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400 font-semibold italic">
                  ● No staff assigned yet
                </div>
              )}
            </div>
            )}

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
            </div>

            {/* Project Requirements Soft Box */}
            <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/70 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>PROJECT REQUIREMENTS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Additional Form Data Fields (Filter out technical IDs, internal flags, and objects) */}
                {request.additional_data &&
                  Object.entries(request.additional_data)
                    .filter(([k, v]) => {
                      if (v === null || v === undefined || v === '' || typeof v === 'object') return false;
                      const lower = k.toLowerCase();
                      // Hide raw database IDs
                      if (lower.endsWith('_id') || lower === 'id' || lower.endsWith('_ids')) return false;
                      // Hide internal routing/type flags
                      if (['is_inter_unit', 'request_type', 'staff_tasks', 'handoff', 'collaborator_completed_notice'].includes(lower)) return false;
                      return true;
                    })
                    .map(([k, v]) => {
                      const labelMap: Record<string, string> = {
                        requester_name: 'REQUESTER (HEAD UNIT)',
                        requester_unit: 'ORIGIN UNIT',
                        origin_staff_name: 'ASSIGNED ORIGIN STAFF',
                        priority: 'PRIORITY',
                        parent_ticket_no: 'PARENT JOB TICKET',
                      };
                      const displayLabel = labelMap[k] || k.replace(/_/g, ' ').toUpperCase();

                      return (
                        <div key={k} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            {displayLabel}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {k === 'priority' ? String(v).toUpperCase() : String(v)}
                          </span>
                        </div>
                      );
                    })}

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

          {/* Comment from Manager Card */}
          {managerComment && user?.role !== 'client' && (
            <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100/70 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>COMMENT FROM MANAGER</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    MANAGER MESSAGE
                  </span>
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider bg-amber-50/60 px-2.5 py-0.5 rounded-md">
                    — {approveLog.actor_name || 'Manager'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {managerComment}
                </p>
              </div>
            </div>
          )}

          {/* Workflow Progress Stepper Card matching Reference Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 h-[300px]">
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
                  {isInterUnitJob ? 'Head Unit Review' : 'Manager Review'}
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


        </div>

        {/* RIGHT COLUMN (1 Column Wide) matching Reference Image 2 */}
        <div className="space-y-6">
          {/* Workflow Actions Card (Hidden for Client, Director, Rejected requests, and when completed) */}
          {user?.role !== 'client' &&
            user?.role !== 'director' &&
            request.status !== 'rejected' &&
            !(user?.role === 'staff' && !user?.is_unit_head && (
              data?.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) ||
              request.status === 'completed'
            )) &&
            !((user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && request.status === 'completed') && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  {isInterUnitJob && request.status === 'staff_processing' ? (
                    <>
                      <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                      <span>Collaboration Status</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Workflow Actions</span>
                    </>
                  )}
                </div>

                {isInterUnitJob && request.status === 'staff_processing' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    In Progress
                  </span>
                )}
              </div>

            {!(request.status === 'staff_processing' && (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager)) &&
             !(request.status === 'manager_approval' && !(
               user?.role === 'admin' ||
               (user?.role === 'manager' && !isInterUnitJob) ||
               user?.is_acting_manager ||
               (isInterUnitJob && isTargetUnitHead)
             )) && (
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                  JOB STATUS SUBMISSION
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            )}

            {/* Notice for Unit Heads & Staff viewing requests awaiting Manager Approval */}
            {request.status === 'manager_approval' && !(
              user?.role === 'admin' ||
              (user?.role === 'manager' && !isInterUnitJob) ||
              user?.is_acting_manager ||
              (isInterUnitJob && isTargetUnitHead)
            ) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1 my-2">
                <div className="text-xs font-bold text-slate-700">
                  {isInterUnitJob
                    ? `Awaiting Head Unit${(targetUnitHead?.name || request.additional_data?.target_unit_head_name) ? ` (${targetUnitHead?.name || request.additional_data?.target_unit_head_name})` : ''} Approval`
                    : 'Awaiting Manager Approval'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {isInterUnitJob
                    ? `Inter-Unit collaboration requests are reviewed and accepted exclusively by the Target Unit Head${(targetUnitHead?.name || request.additional_data?.target_unit_head_name) ? ` (${targetUnitHead?.name || request.additional_data?.target_unit_head_name})` : ''}.`
                    : 'Online client job requests are reviewed and approved exclusively by Department Managers.'}
                </div>
              </div>
            )}

            {/* Action Buttons based on Role & Status */}
            {canAct && (
              <div className="space-y-2">
                {request.status === 'manager_approval' && (
                  user?.role === 'admin' ||
                  (user?.role === 'manager' && !isInterUnitJob) ||
                  user?.is_acting_manager ||
                  (isInterUnitJob && isTargetUnitHead)
                ) && (
                  <>
                    <button
                      onClick={handleOpenApproveModal}
                      disabled={actionLoading}
                      className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl h-12 border-none shadow-lg shadow-emerald-500/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" /> {isInterUnitJob ? 'ACCEPT & ASSIGN TEAM' : 'APPROVE REQUEST'}
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
                    {selectedStaff.map(Number).includes(Number(user?.id)) && (
                      <div className="space-y-2">
                        {/* If Inter-Unit Collaboration, show the Agile Turn Indicator & Handoff Controls */}
                        {isInterUnitJob && (() => {
                          const handoff = request.additional_data?.handoff;
                          const originStaffId = request.additional_data?.origin_staff_id;
                          const originStaffName = request.additional_data?.origin_staff_name || request.additional_data?.requester_name;
                          const originStaffUnit = request.additional_data?.requester_unit || 'Origin Unit';

                          let holderId = handoff?.current_holder_id
                            ? Number(handoff.current_holder_id)
                            : (originStaffId ? Number(originStaffId) : null);
                          let holderName = handoff?.current_holder_name || originStaffName || 'Origin Staff';
                          let holderUnit = handoff?.current_holder_unit || originStaffUnit;

                          // Check who has finished
                          const finishedCollaborators = (data?.staffDetails || []).filter((s: any) => s.is_done);
                          const pendingCollaborators = (data?.staffDetails || []).filter((s: any) => !s.is_done);
                          const isHolderFinished = finishedCollaborators.some((s: any) => Number(s.id) === holderId);

                          // If the designated holder has already completed their part (e.g. Johan completed),
                          // the active turn naturally passes back to the pending collaborator(s) (e.g. Azuin)
                          let collaboratorCompletedNotice = false;
                          if (isHolderFinished && pendingCollaborators.length > 0) {
                            collaboratorCompletedNotice = true;
                            // Set holder to current user if they are among pending collaborators
                            if (pendingCollaborators.some((s: any) => Number(s.id) === Number(user?.id))) {
                              holderId = Number(user?.id);
                              holderName = user?.name || 'You';
                              holderUnit = user?.unit || '';
                            }
                          }

                          const isUserTurn = !holderId || Number(user?.id) === holderId;

                          return (
                            <div className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-4 space-y-3.5 text-left mb-3 shadow-xs">
                              {/* Header: Turn pill */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                                    Collaboration Turn
                                  </span>
                                  {holderId && Number(user?.id) === holderId ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Your Turn
                                    </span>
                                  ) : holderId ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                      Waiting
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                      Shared Active
                                    </span>
                                  )}
                                </div>

                                {/* Active Turn Sub-Banner */}
                                {holderId && Number(user?.id) === holderId ? (
                                  <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-black text-emerald-950">Active Action Required</div>
                                      <div className="text-[11px] font-medium text-emerald-800 leading-snug">
                                        {collaboratorCompletedNotice
                                          ? 'Collaborator has finalized their part. Ready to finalize.'
                                          : handoff?.last_action === 'REVISION_REQUESTED'
                                          ? 'Revision requested — please review changes and update.'
                                          : 'You hold the turn — prepare drafts and hand over when ready.'}
                                      </div>
                                    </div>
                                  </div>
                                ) : holderId ? (
                                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-slate-800">Waiting for Collaborator</div>
                                      <div className="text-[11px] font-medium text-slate-500 leading-snug">
                                        Currently with <strong className="text-slate-700">{holderName}</strong> ({holderUnit})
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Latest Note / History */}
                              {collaboratorCompletedNotice ? (
                                <div className="p-3 bg-white border border-emerald-200 rounded-2xl space-y-1">
                                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Collaborator Finalized</span>
                                  </div>
                                  <div className="text-slate-600 text-xs leading-relaxed font-medium">
                                    {finishedCollaborators.map((s: any) => s.name).join(', ')} has marked their portion as complete.
                                  </div>
                                </div>
                              ) : request.additional_data?.handoff?.last_note ? (
                                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-indigo-500" />
                                      Latest Note
                                    </span>
                                    <span className="text-slate-600 lowercase font-medium">
                                      {request.additional_data.handoff.last_actor_name} ({request.additional_data.handoff.last_actor_unit || 'Unit'})
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-800 font-medium italic leading-relaxed pl-2.5 border-l-2 border-indigo-500">
                                    "{request.additional_data.handoff.last_note}"
                                  </p>
                                  {request.additional_data.handoff.last_draft_url && (
                                    <div className="pt-1">
                                      <a
                                        href={request.additional_data.handoff.last_draft_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" /> View Shared Draft
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* Collaborative Action Buttons - Clean, spacious & designer-ready */}
                              {isUserTurn && (
                                <div className="space-y-2 pt-1">
                                  {collaboratorCompletedNotice ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setShowMarkDoneModal(true)}
                                        disabled={actionLoading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs py-3 px-4 rounded-2xl uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> FINALIZE & COMPLETE MY PART
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenHandoffModal('request_revision')}
                                        disabled={actionLoading}
                                        className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Need Changes? Request Revision
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Primary Hand Over Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenHandoffModal('pass')}
                                        disabled={actionLoading}
                                        className="w-full group bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs py-3 px-4 rounded-2xl uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                      >
                                        <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
                                        <span>Hand Over to Collaborator</span>
                                      </button>

                                      {/* Secondary Actions Grid */}
                                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenHandoffModal('request_revision')}
                                          disabled={actionLoading}
                                          className="w-full bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold text-[11px] py-2.5 px-2 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                          title="Request changes from collaborator"
                                        >
                                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          <span className="truncate">Request Revision</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setShowMarkDoneModal(true)}
                                          disabled={actionLoading}
                                          className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-bold text-[11px] py-2.5 px-2 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                          title="Finalize your involvement directly"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                          <span className="truncate">Finalize My Part</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* For Standard (non-inter-unit) jobs, show standard Mark My Part As Done */}
                        {!isInterUnitJob && (
                          data.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) ? (
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
                          )
                        )}

                        {/* If Inter-Unit staff already finalized their part */}
                        {isInterUnitJob && data.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) && (
                          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 text-center space-y-1 my-1">
                            <div className="text-[11px] font-black text-emerald-800 tracking-wider uppercase flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Your Part Finalized</span>
                            </div>
                            <div className="text-[10px] text-emerald-600">
                              You have marked your contribution as finalized for this project.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager || user?.is_unit_head) && (
                      isInterUnitJob ? (
                        /* Inter-Unit Collaboration Oversight Card for Managers & Unit Heads */
                        (() => {
                          const handoff = request.additional_data?.handoff;
                          const originStaffId = request.additional_data?.origin_staff_id;
                          const originStaffName = request.additional_data?.origin_staff_name || request.additional_data?.requester_name;
                          const originStaffUnit = request.additional_data?.requester_unit || 'Origin Unit';

                          let holderId = handoff?.current_holder_id
                            ? Number(handoff.current_holder_id)
                            : (originStaffId ? Number(originStaffId) : null);
                          let holderName = handoff?.current_holder_name || originStaffName || 'Origin Staff';
                          let holderUnit = handoff?.current_holder_unit || originStaffUnit;

                          const finishedCollaborators = (data?.staffDetails || []).filter((s: any) => s.is_done);
                          const pendingCollaborators = (data?.staffDetails || []).filter((s: any) => !s.is_done);
                          const isHolderFinished = finishedCollaborators.some((s: any) => Number(s.id) === holderId);

                          if (isHolderFinished && pendingCollaborators.length > 0) {
                            holderId = Number(pendingCollaborators[0].id);
                            holderName = pendingCollaborators[0].name;
                            holderUnit = pendingCollaborators[0].unit || '';
                          }

                          const isManagerUser = user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager;

                          return (
                            <div className="space-y-4 pt-1">
                              {/* Hero Turn Holder Spotlight */}
                              <div className="rounded-2xl bg-gradient-to-br from-indigo-50/60 to-slate-50/80 border border-indigo-100/70 p-4 space-y-3 shadow-2xs">
                                <div className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider flex items-center justify-between">
                                  <span>Sedang Diuruskan Oleh</span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                                    Active Turn
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                                    {holderName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-black text-slate-900 truncate">
                                      {holderName}
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                                      {holderUnit && <span>Unit: {holderUnit}</span>}
                                      <span className="text-slate-300">•</span>
                                      <span className="text-emerald-600 font-bold">Sedang Bertugas</span>
                                    </div>
                                  </div>
                                </div>

                                {handoff?.last_note && (
                                  <div className="border-l-2 border-indigo-400 pl-3 py-1 bg-white/70 rounded-r-xl text-xs text-slate-700 space-y-0.5 shadow-2xs">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Nota Serahan Terkini:
                                    </span>
                                    <p className="italic font-medium text-slate-800 leading-snug">
                                      "{handoff.last_note}"
                                    </p>
                                  </div>
                                )}

                                {handoff?.last_draft_url && (
                                  <div className="pt-0.5">
                                    <a
                                      href={handoff.last_draft_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Lihat Pautan Draf Fail
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Team Status Flow */}
                              <div className="space-y-2">
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-0.5">
                                  Status Pasukan Projek
                                </div>
                                <div className="space-y-1.5">
                                  {(data?.staffDetails || []).map((staff: any) => {
                                    const isHolder = Number(staff.id) === holderId;
                                    const isDone = staff.is_done;
                                    return (
                                      <div
                                        key={staff.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200/80 bg-slate-50/40 hover:bg-white transition-all text-xs"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                              isDone
                                                ? 'bg-emerald-500'
                                                : isHolder
                                                ? 'bg-indigo-600 ring-4 ring-indigo-100'
                                                : 'bg-slate-300'
                                            }`}
                                          />
                                          <span className="font-bold text-slate-800 truncate">{staff.name}</span>
                                          {staff.unit && (
                                            <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                              ({staff.unit})
                                            </span>
                                          )}
                                        </div>

                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            isDone
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                              : isHolder
                                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-black'
                                              : 'text-slate-400 bg-slate-100/60'
                                          }`}
                                        >
                                          {isDone ? '✓ Selesai' : isHolder ? '⚡ Aktif' : 'Menunggu'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Minimalist Info Banner */}
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>
                                  Projek selesai secara automatik apabila semua staf klik <b>Finalize My Part</b>.
                                </span>
                              </div>

                              {/* Clean Project Controls (Pending / Cancel) - Exclusively for Managers & Admins */}
                              {isManagerUser && (
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Tindakan Luar Jangka
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => { setStatusReason(''); setShowStatusModal('on_hold'); }}
                                      className="font-bold text-[11px] text-slate-500 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                      <Clock className="w-3 h-3 text-amber-500" /> Pending
                                    </button>
                                    <span className="text-slate-200">|</span>
                                    <button
                                      type="button"
                                      onClick={() => { setStatusReason(''); setShowStatusModal('cancelled'); }}
                                      className="font-bold text-[11px] text-slate-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                      <XCircle className="w-3 h-3 text-rose-500" /> Batal
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        /* Standard non-inter-unit Manager Controls */
                        (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && (
                          <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-100">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                              MANAGER STATUS CONTROLS
                            </div>
                            <button
                              type="button"
                              onClick={handleComplete}
                              disabled={actionLoading}
                              className="btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-indigo-500/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                            >
                              <ShieldCheck className="w-4 h-4" /> MARK PROJECT COMPLETED
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => { setStatusReason(''); setShowStatusModal('on_hold'); }}
                                disabled={actionLoading}
                                className="btn bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[11px] rounded-xl h-10 uppercase tracking-wider gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING
                              </button>

                              <button
                                type="button"
                                onClick={() => { setStatusReason(''); setShowStatusModal('cancelled'); }}
                                disabled={actionLoading}
                                className="btn bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-[11px] rounded-xl h-10 uppercase tracking-wider gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> CANCEL
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </>
                )}

                {/* Status controls when Project is On Hold or Cancelled */}
                {(request.status === 'on_hold' || request.status === 'cancelled') && (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && (
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    request.status === 'on_hold' ? 'bg-amber-50/50 border-amber-200/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        request.status === 'on_hold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {request.status === 'on_hold' ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Status: {request.status === 'on_hold' ? 'Pending / On Hold' : 'Cancelled'}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          {request.status === 'on_hold' ? 'Project Temporarily Paused' : 'Project Terminated'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-slate-100">
                      {request.status === 'on_hold'
                        ? 'This project is currently on hold. You can resume processing at any time.'
                        : 'This project has been cancelled. You can resume processing if needed.'}
                    </p>

                    <div className="flex flex-col gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const res = await fetch(`/api/job-requests/${id}/change-status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ new_status: 'staff_processing', reason: 'Resumed project processing' }),
                            });
                            const resData = await res.json();
                            if (resData.success) fetchDetail();
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="btn w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-blue-500/20 gap-2 normal-case tracking-wide"
                      >
                        <ShieldCheck className="w-4 h-4" /> Resume Processing
                      </button>

                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={actionLoading}
                        className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-emerald-500/20 gap-2 normal-case tracking-wide"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Completed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note / Report Section (Staff Page Only) */}
            {user?.role === 'staff' && !user?.is_acting_manager && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  NOTE / REPORT
                </span>

                {reports && reports.filter((r: any) => user?.role !== 'staff' || user?.is_acting_manager || r.staff_id === user?.id).length > 0 && (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {reports
                      .filter((r: any) => user?.role !== 'staff' || user?.is_acting_manager || r.staff_id === user?.id)
                      .map((r: any) => (
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

                {user?.role !== 'director' && (
                  <>
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
                  </>
                )}
              </div>
            )}

          </div>
        )}



          {/* PART COMPLETED CARD WITH VIEW NOTE BUTTON (For completed Staff) */}
          {user?.role === 'staff' && !user?.is_acting_manager &&
            data?.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) && (
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

          {/* SPECIAL STATUS REASON CARD (Placed ABOVE Project Timeline Card) */}
          {(request.status === 'on_hold' || request.status === 'cancelled' || request.status === 'rejected') && (() => {
            const isHold = request.status === 'on_hold';
            const isCancel = request.status === 'cancelled' || request.status === 'rejected';

            // Find matching workflow log for reason comment
            const statusLog = (history || []).find((h: any) => {
              if (isHold) {
                return h.action === 'STATUS_PENDING' || h.to_step_name === 'Pending / On Hold' || h.comment?.toLowerCase().includes('on_hold') || h.comment?.toLowerCase().includes('pending') || h.comment?.toLowerCase().includes('hentian') || h.comment?.toLowerCase().includes('hold');
              }
              if (isCancel) {
                return h.action === 'STATUS_CANCELLED' || h.action === 'REJECT' || h.action === 'STATUS_REJECTED' || h.to_step_name === 'Cancelled' || h.to_step_name === 'Rejected';
              }
              return false;
            }) || (history && history.length > 0 ? history[0] : null);

            const rawComment = statusLog?.comment || '';
            let cleanComment = rawComment;
            if (rawComment.includes('Status changed to') && rawComment.includes(':')) {
              cleanComment = rawComment.split(':')[1]?.trim() || rawComment;
            }

            const reasonText = request.rejection_reason || request.cancellation_reason || cleanComment || (isHold ? 'Project placed on temporary hold.' : 'Project request cancelled.');
            const actorName = statusLog?.actor_name || 'Manager';
            const logTime = statusLog?.created_at ? formatDateTimeMY(statusLog.created_at) : '';

            return (
              <div className={`rounded-3xl border p-6 space-y-4 shadow-xl transition-all ${
                isHold
                  ? 'bg-amber-50/90 border-amber-200 shadow-amber-500/10'
                  : 'bg-rose-50/90 border-rose-200 shadow-rose-500/10'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-200/60">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                    {isHold ? (
                      <>
                        <Clock className="w-4.5 h-4.5 text-amber-600" />
                        <span className="text-amber-900">HOLD REASON</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4.5 h-4.5 text-rose-600" />
                        <span className="text-rose-900">{request.status === 'rejected' ? 'REJECTION REASON' : 'CANCELLATION REASON'}</span>
                      </>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    isHold
                      ? 'bg-amber-100 text-amber-800 border-amber-300/80'
                      : 'bg-rose-100 text-rose-800 border-rose-300/80'
                  }`}>
                    {isHold ? 'ON HOLD' : request.status === 'rejected' ? 'REJECTED' : 'CANCELLED'}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border text-xs md:text-sm font-bold italic leading-relaxed ${
                  isHold
                    ? 'bg-white/95 border-amber-200/80 text-amber-950 shadow-xs'
                    : 'bg-white/95 border-rose-200/80 text-rose-950 shadow-xs'
                }`}>
                  "{reasonText}"
                </div>

                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 pt-0.5">
                  <span>Action by: <strong className="text-slate-800">{actorName}</strong></span>
                  {logTime && <span className="text-slate-400">{logTime}</span>}
                </div>
              </div>
            );
          })()}

          {/* PROJECT TIMELINE Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>PROJECT TIMELINE</span>
              </div>

              {(user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) &&
                request.status !== 'completed' &&
                request.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(request.start_date || new Date().toISOString().split('T')[0]);
                      setDeadline(request.deadline || '');
                      setShowEditTimelineModal(true);
                    }}
                    className="btn btn-xs btn-ghost text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-extrabold text-[10px] uppercase flex items-center gap-1.5 rounded-xl transition-all border border-blue-100/60 shadow-xs"
                  >
                    <Edit2 className="w-3 h-3" /> EDIT TIMELINE
                  </button>
                )}
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

          {/* Activity History Card matching Reference Image 2 */}
          {user?.role !== 'client' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 h-[480px] md:h-[520px] flex flex-col">
              <div className="flex items-center justify-between shrink-0 mb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Activity History</h3>
                <button
                  onClick={handleCopyHistory}
                  className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white btn-xs rounded-xl font-bold gap-1 normal-case px-3"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy History'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 pr-1">
                {history && history.length > 0 ? (
                  history.map((h: any) => (
                    <div key={h.id} className="relative space-y-1">
                      <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full border-2 border-indigo-600 bg-white"></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {formatDateTimeMY(h.created_at)}
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
          )}
        </div>
      </div>

      {/* APPROVE THIS REQUEST MODAL matching Reference Image 1 */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Modal Title & Subtitle */}
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {request.additional_data?.is_inter_unit || request.ticket_no?.startsWith('IU')
                  ? 'Accept & Assign Staff'
                  : 'Approve This Request?'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {request.additional_data?.is_inter_unit || request.ticket_no?.startsWith('IU')
                  ? 'Accept this request from another unit and assign tasks to your team members.'
                  : 'This will move the request to the staff processing stage.'}
              </p>
            </div>

            {/* Assign to Staff Member Container matching Reference Image 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800">
                Assign to Staff Member <span className="text-rose-500 font-bold">*</span>
              </label>

              {/* Unit Filter Tabs - Wrapped and directly visible */}
              {(availableModalUnits.length > 1 || accessibleTeamMembers.some((m) => Boolean(m.is_unit_head))) && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {/* Head Tab (Default for Manager) */}
                  <button
                    type="button"
                    onClick={() => setStaffUnitFilter('Head')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      staffUnitFilter === 'Head'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>Head</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        staffUnitFilter === 'Head' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head)).length}
                    </span>
                    {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head) && selectedStaff.includes(m.id)).length > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          staffUnitFilter === 'Head' ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head) && selectedStaff.includes(m.id)).length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffUnitFilter('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      staffUnitFilter === 'All'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>All</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        staffUnitFilter === 'All' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {accessibleTeamMembers.length}
                    </span>
                    {selectedStaff.length > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          staffUnitFilter === 'All' ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {selectedStaff.length}
                      </span>
                    )}
                  </button>
                  {availableModalUnits.map((u) => {
                    const unitStaff = accessibleTeamMembers.filter((m) => m.unit?.trim().toLowerCase() === u.trim().toLowerCase());
                    const selectedInUnit = unitStaff.filter((m) => selectedStaff.includes(m.id)).length;
                    const isSelectedTab = staffUnitFilter === u;

                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setStaffUnitFilter(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          isSelectedTab
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        <span>{u}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                            isSelectedTab ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {unitStaff.length}
                        </span>
                        {selectedInUnit > 0 && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              isSelectedTab ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {selectedInUnit}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                className={`border rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2 bg-white transition-all ${
                  selectedStaff.length === 0 ? 'border-rose-400 bg-rose-50/20' : 'border-blue-600'
                }`}
              >
                {filteredModalStaff.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                    No staff members found in this unit.
                  </div>
                ) : (
                  filteredModalStaff.map((m) => {
                    const isChecked = selectedStaff.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        onClick={() => {
                          if (isChecked) setSelectedStaff(selectedStaff.filter((sid) => sid !== m.id));
                          else setSelectedStaff([...selectedStaff, m.id]);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{m.name}</span>
                              {Boolean(m.is_unit_head) && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.2 rounded border border-amber-200">
                                  HEAD
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{m.email}</div>
                          </div>
                        </div>
                        {m.unit && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md shrink-0">
                            {m.unit}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {selectedStaff.length === 0 ? (
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>At least one staff member must be selected.</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-semibold italic">
                  Select one or more staff members to handle this project
                </p>
              )}
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
                  Deadline <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  min={startDate}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full bg-white border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none ${
                    startDate && deadline && deadline < startDate
                      ? 'border-rose-500 text-rose-600 focus:border-rose-600'
                      : 'border-slate-300 focus:border-blue-600'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Validation Warning Alert if Deadline < StartDate */}
            {startDate && deadline && deadline < startDate && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Deadline date cannot be earlier than Start Date ({startDate}).</span>
              </div>
            )}

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
                disabled={actionLoading || selectedStaff.length === 0 || Boolean(startDate && deadline && deadline < startDate)}
                className="btn bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 uppercase tracking-wider shadow-lg shadow-emerald-500/25"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : request.additional_data?.is_inter_unit || request.ticket_no?.startsWith('IU') ? 'CONFIRM ACCEPT & ASSIGN' : 'CONFIRM & ASSIGN'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* REJECT THIS REQUEST MODAL matching Reference Image */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
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

      {/* MARK AS DONE / FINALIZE CONFIRMATION MODAL */}
      {showMarkDoneModal && (
        <div
          className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMarkDoneModal(false);
          }}
        >
          <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-md w-full p-8 text-center space-y-6">
            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={() => setShowMarkDoneModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all shadow-xs"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Question Mark Circle Icon */}
            <div className="flex justify-center pt-2">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200 bg-slate-50/70 flex items-center justify-center text-slate-400 font-light text-4xl leading-none shadow-inner">
                ?
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {isInterUnitJob ? 'Finalize Without Handover?' : 'Mark as Done?'}
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                {isInterUnitJob
                  ? 'If your colleague is waiting for your draft or files, please use "Hand Over" instead. Only proceed here if you are completely ending your involvement.'
                  : 'This will notify the manager that your portion of the work is finished.'}
              </p>
            </div>

            {/* Modal Action Buttons */}
            {isInterUnitJob ? (
              <div className="space-y-2.5 pt-2">
                {/* Primary Action: Hand Over */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkDoneModal(false);
                    handleOpenHandoffModal('pass');
                  }}
                  className="w-full group bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300 shrink-0" />
                  <span>Hand Over Work Instead</span>
                </button>

                {/* Secondary Actions in 2-column grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={handleMarkMyPartDone}
                    disabled={actionLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-bold text-xs py-3 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {actionLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <span>Yes, Finalize Anyway</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMarkDoneModal(false);
                      if (user?.role === 'staff' && !user?.is_acting_manager) {
                        const textarea = document.querySelector('textarea');
                        if (textarea) textarea.focus();
                      }
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 active:scale-[0.99] text-slate-600 font-bold text-xs py-3 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{user?.role === 'staff' && !user?.is_acting_manager ? 'Add Note First' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleMarkMyPartDone}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Yes, I Am Done!</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMarkDoneModal(false);
                    if (user?.role === 'staff' && !user?.is_acting_manager) {
                      const textarea = document.querySelector('textarea');
                      if (textarea) textarea.focus();
                    }
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-600 font-bold text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center"
                >
                  <span>{user?.role === 'staff' && !user?.is_acting_manager ? 'Wait, Add Note' : 'Cancel'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT REPORT MODAL matching Reference Image */}
      {editingReportId && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
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

      {/* MANAGE / INVITE TEAM ASSIGNMENT MODAL */}
      {showManageTeamModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8 space-y-6">
            {/* Title & Subtitle */}
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {user?.role === 'staff' && !user?.is_acting_manager ? 'Invite Team Members' : 'Manage Team Assignment'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {user?.role === 'staff' && !user?.is_acting_manager
                  ? 'Invite staff members and specify tasks for this project.'
                  : 'Add or remove staff assigned to this project and set tasks.'}
              </p>
            </div>

            {/* Unit Filter Tabs - Directly visible and wrapped */}
            {(availableModalUnits.length > 1 || accessibleTeamMembers.some((m) => Boolean(m.is_unit_head))) && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                {/* Head Tab (Default for Manager) */}
                <button
                  type="button"
                  onClick={() => setStaffUnitFilter('Head')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    staffUnitFilter === 'Head'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>Head</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      staffUnitFilter === 'Head' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head)).length}
                  </span>
                  {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head) && selectedStaff.includes(m.id)).length > 0 && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        staffUnitFilter === 'Head' ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {accessibleTeamMembers.filter((m) => Boolean(m.is_unit_head) && selectedStaff.includes(m.id)).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStaffUnitFilter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    staffUnitFilter === 'All'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      staffUnitFilter === 'All' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {accessibleTeamMembers.length}
                  </span>
                  {selectedStaff.length > 0 && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        staffUnitFilter === 'All' ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedStaff.length}
                    </span>
                  )}
                </button>
                {availableModalUnits.map((u) => {
                  const unitStaff = accessibleTeamMembers.filter((m) => m.unit?.trim().toLowerCase() === u.trim().toLowerCase());
                  const selectedInUnit = unitStaff.filter((m) => selectedStaff.includes(m.id)).length;
                  const isSelectedTab = staffUnitFilter === u;

                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setStaffUnitFilter(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        isSelectedTab
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      <span>{u}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                          isSelectedTab ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {unitStaff.length}
                      </span>
                      {selectedInUnit > 0 && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            isSelectedTab ? 'bg-emerald-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {selectedInUnit}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Staff List with Checkboxes & Task Field */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 max-h-80 overflow-y-auto space-y-3">
              {filteredModalStaff.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No staff members found in this unit.
                </div>
              ) : (
                filteredModalStaff.map((m: any) => {
                  const isSelected = selectedStaff.includes(m.id);
                  const isSelfStaff = user?.role === 'staff' && m.id === user?.id;
                  const projectStaffDetail = data.staffDetails?.find((s: any) => s.id === m.id);
                  const isAlreadyDone = projectStaffDetail?.is_done || false;
                  const isAlreadyAssigned = Boolean(request.assigned_staff_ids?.split(',').map(Number).includes(m.id));

                  // For Staff role, lock staff who are already in the team from being removed
                  const isLocked = (user?.role === 'staff' && !user?.is_acting_manager)
                    ? (isSelfStaff || isAlreadyDone || isAlreadyAssigned)
                    : (isSelfStaff || isAlreadyDone);

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        isLocked ? 'opacity-75 bg-slate-100/50 border-slate-200' : 'cursor-pointer'
                      } ${
                        !isLocked && isSelected
                          ? 'bg-white border-blue-500/80 shadow-sm'
                          : !isLocked
                          ? 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'
                          : ''
                      }`}
                    >
                      <div
                        onClick={() => !isLocked && toggleStaffSelection(m.id)}
                        className="flex items-center gap-3 select-none"
                      >
                        {/* Custom Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected 
                              ? isLocked 
                                ? 'bg-slate-400 text-white' 
                                : 'bg-blue-600 text-white' 
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </div>

                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              {m.name} 
                              {Boolean(m.is_unit_head) && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.2 rounded border border-amber-200">
                                  HEAD
                                </span>
                              )}
                              {isSelfStaff && <span className="text-[10px] text-slate-400 font-semibold italic">(You)</span>}
                              {isAlreadyDone && <span className="text-[10px] text-emerald-600 font-semibold italic">(Done)</span>}
                              {!isSelfStaff && !isAlreadyDone && isAlreadyAssigned && (
                                <span className="text-[10px] text-blue-600 font-semibold italic">(In Team)</span>
                              )}
                            </span>
                            {m.unit && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                                {m.unit}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">{m.email}</div>
                        </div>
                      </div>

                      {/* Task Input for Selected Staff */}
                      {isSelected && (
                        <div className="pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                            Task / Role Description
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter task for ${m.name}...`}
                            value={staffTasks[m.id] || ''}
                            onChange={(e) => setStaffTasks({ ...staffTasks, [m.id]: e.target.value })}
                            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Buttons */}
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
                {actionLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : user?.role === 'staff' && !user?.is_acting_manager ? (
                  'Invite Team'
                ) : (
                  'Update Assignments'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VIEW NOTES MODAL FOR COMPLETED STAFF */}
      {showViewNotesModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
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
              {reports && reports.filter((r: any) => user?.role !== 'staff' || user?.is_acting_manager || r.staff_id === user?.id).length > 0 ? (
                reports
                  .filter((r: any) => user?.role !== 'staff' || user?.is_acting_manager || r.staff_id === user?.id)
                  .map((r: any) => (
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

      {/* CUSTOM LIGHTBOX MODAL FOR PENDING / CANCEL STATUS CHANGE */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden my-auto">
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${showStatusModal === 'on_hold' ? 'bg-amber-500' : 'bg-rose-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  {showStatusModal === 'on_hold' ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {showStatusModal === 'on_hold' ? 'Set Project to Pending / On Hold' : 'Cancel Project'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">Manager Workflow Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(null)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {showStatusModal === 'on_hold'
                  ? 'Please state the reason for placing this project on Pending / On Hold status:'
                  : 'Please state the reason for cancelling this project:'}
              </p>

              <textarea
                rows={3}
                placeholder={showStatusModal === 'on_hold' ? 'Example: Waiting for additional feedback from client...' : 'Example: Cancelled per management / client request...'}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all resize-none shadow-inner"
              ></textarea>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(null)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = showStatusModal;
                    const reason = statusReason.trim();
                    setActionLoading(true);
                    fetch(`/api/job-requests/${id}/change-status`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ new_status: target, reason: reason }),
                    })
                      .then((res) => res.json())
                      .then((resData) => {
                        if (resData.success) {
                          setShowStatusModal(null);
                          setStatusReason('');
                          fetchDetail();
                        } else {
                          alert(resData.error || 'Gagal mengemaskini status projek.');
                        }
                      })
                      .catch((err) => console.error(err))
                      .finally(() => setActionLoading(false));
                  }}
                  disabled={actionLoading}
                  className={`btn text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md gap-2 ${
                    showStatusModal === 'on_hold' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      {showStatusModal === 'on_hold' ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>Confirm {showStatusModal === 'on_hold' ? 'Pending / On Hold' : 'Cancel Project'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT TIMELINE MODAL */}
      {showEditTimelineModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Edit Project Timeline
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Update the Start Date and Deadline for this project.
              </p>
            </div>

            <div className="space-y-4 text-xs">
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
                  Deadline <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  min={startDate}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full bg-white border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none ${
                    startDate && deadline && deadline < startDate
                      ? 'border-rose-500 text-rose-600 focus:border-rose-600'
                      : 'border-slate-300 focus:border-blue-600'
                  }`}
                  required
                />
              </div>

              {startDate && deadline && deadline < startDate && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Deadline date cannot be earlier than Start Date ({startDate}).</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Reason for Timeline Change (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="E.g., Extension requested by client, scope changes..."
                  value={timelineReason}
                  onChange={(e) => setTimelineReason(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowEditTimelineModal(false)}
                className="text-xs font-black text-slate-600 hover:text-slate-900 uppercase tracking-wider px-4 py-2"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveTimeline}
                disabled={actionLoading || Boolean(startDate && deadline && deadline < startDate)}
                className="btn bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 shadow-lg shadow-blue-500/25"
              >
                {actionLoading ? <span className="loading loading-spinner"></span> : 'SAVE TIMELINE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTER-UNIT COLLABORATIVE HANDOFF MODAL */}
      {showHandoffModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-auto">
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${
              handoffType === 'request_revision'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  {handoffType === 'request_revision' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <ArrowLeftRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {handoffType === 'request_revision'
                      ? 'Request Cross-Check / Revision'
                      : 'Hand Over Work to Collaborator'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    {handoffType === 'request_revision'
                      ? 'Send draft back to peer for updates or copywriting review'
                      : 'Pass the baton to the next assigned collaborator'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHandoffModal(false)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleHandoffSubmit} className="p-6 md:p-8 space-y-4">
              {/* Target Collaborator Selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Collaborator <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={handoffTargetStaffId}
                  onChange={(e) => setHandoffTargetStaffId(Number(e.target.value))}
                  className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-600"
                >
                  <option value="">-- Choose Collaborator --</option>
                  {(() => {
                    // 1. Gather other collaborators from staffDetails
                    const others = (data?.staffDetails || []).filter((s: any) => Number(s.id) !== Number(user?.id));
                    
                    // 2. If inter-unit and others is empty, check origin_staff or requester from additional_data
                    if (others.length === 0 && isInterUnitJob) {
                      const addData = request.additional_data;
                      if (addData?.origin_staff_id && Number(addData.origin_staff_id) !== Number(user?.id)) {
                        others.push({
                          id: addData.origin_staff_id,
                          name: addData.origin_staff_name || 'Origin Unit Staff',
                          unit: addData.requester_unit || 'Origin Unit',
                        });
                      } else if (addData?.requester_id && Number(addData.requester_id) !== Number(user?.id)) {
                        others.push({
                          id: addData.requester_id,
                          name: addData.requester_name || 'Unit Head (Requester)',
                          unit: addData.requester_unit || 'Origin Unit',
                        });
                      }
                    }

                    if (others.length === 0) {
                      return (
                        <option value="" disabled>
                          -- No other collaborator assigned yet --
                        </option>
                      );
                    }

                    return others.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit || 'Assigned Staff'})
                      </option>
                    ));
                  })()}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  The selected colleague will receive an action notification on their Dashboard under this project.
                </p>
              </div>

              {/* Note / Instructions */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {handoffType === 'request_revision'
                    ? 'Revision Note / Feedback'
                    : 'Handoff Note / Context'}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    handoffType === 'request_revision'
                      ? 'e.g. Please trim heading text to fit 1 line, or check spelling on banner draft...'
                      : 'e.g. Copywriting drafted and approved on my end. Ready for your layout/design phase...'
                  }
                  value={handoffNote}
                  onChange={(e) => setHandoffNote(e.target.value)}
                  className="textarea textarea-bordered w-full bg-slate-50 border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-600 resize-none"
                ></textarea>
              </div>

              {/* Draft / Staging Link (Optional) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Draft URL / File Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or Figma link"
                  value={handoffDraftUrl}
                  onChange={(e) => setHandoffDraftUrl(e.target.value)}
                  className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHandoffModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !handoffTargetStaffId || !handoffNote.trim()}
                  className={`btn text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md transition-all gap-2 ${
                    handoffType === 'request_revision'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : handoffType === 'request_revision' ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Send Revision Request</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Confirm Hand Over</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
