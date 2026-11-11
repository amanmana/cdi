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
  Edit3,
  CheckSquare,
  Copy,
  AlertCircle,
  X,
  Wrench,
  Users,
  Building2,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
  Camera,
  Layers,
  User,
  RotateCcw,
  Eye,
  ArrowRight,
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

  // Unit Deliverable Milestone Modal State
  const [showUnitMilestoneModal, setShowUnitMilestoneModal] = useState(false);
  const [milestoneUnitName, setMilestoneUnitName] = useState('');
  const [milestoneServiceLabel, setMilestoneServiceLabel] = useState('');
  const [milestoneStartDate, setMilestoneStartDate] = useState('');
  const [milestoneDeadline, setMilestoneDeadline] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');
  const [milestoneSaving, setMilestoneSaving] = useState(false);

  // Specifications Modal State (View & Edit by Head of Unit / Staff)
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [activeSpecService, setActiveSpecService] = useState<any>(null);
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  const [specScope, setSpecScope] = useState('');
  const [specFields, setSpecFields] = useState<Record<string, string>>({});
  const [specGuidanceNotes, setSpecGuidanceNotes] = useState('');
  const [savingSpec, setSavingSpec] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status Change Modal State (Pending / Cancel / Reopen)
  const [showStatusModal, setShowStatusModal] = useState<'on_hold' | 'cancelled' | 'staff_processing' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [showForceCompleteModal, setShowForceCompleteModal] = useState(false);
  const [forceCompleteComment, setForceCompleteComment] = useState('');

  // Cross-Unit Assistance Modal State
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [showRequestAssistanceModal, setShowRequestAssistanceModal] = useState(false);
  const [assistanceTargetUnit, setAssistanceTargetUnit] = useState('');
  const [assistanceSuggestedStaffId, setAssistanceSuggestedStaffId] = useState<number | ''>('');
  const [assistanceTaskDesc, setAssistanceTaskDesc] = useState('');
  const [assistanceNotes, setAssistanceNotes] = useState('');

  // Respond Assistance Modal State (for Unit Head / Manager / Admin)
  const [showRespondAssistanceModal, setShowRespondAssistanceModal] = useState<any | null>(null);
  const [respondAssignedStaffId, setRespondAssignedStaffId] = useState<number | ''>('');
  const [respondTaskDesc, setRespondTaskDesc] = useState('');
  const [respondDeclineReason, setRespondDeclineReason] = useState('');
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

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

      // 2. Managers and Acting Managers have department-wide visibility strictly for their OWN department
      if (user?.role === 'manager' || user?.is_acting_manager) {
        const userDeptId = (user as any)?.managed_department_id || (user as any)?.department_id || (user as any)?.acting_manager_department_id;
        const reqDeptId = data?.request?.department_id;

        // If the job belongs to another department, a manager from a different department can only assign staff from their OWN managed department
        // (or if the job has no department, match manager's department)
        if (userDeptId && m.department_id && String(m.department_id) === String(userDeptId)) {
          return true;
        }

        // If user has a department name, match by user's department name
        if (user?.department_name && m.department_name && user.department_name.toLowerCase().trim() === m.department_name.toLowerCase().trim()) {
          return true;
        }

        // Fallback: match by manager's own unit
        if (user?.unit && m.unit?.toLowerCase().trim() === user.unit?.toLowerCase().trim()) {
          return true;
        }

        // If manager has managed units listed, allow those units
        const managedUnits: string[] = (user as any)?.managed_units || [];
        if (managedUnits.length > 0 && m.unit && managedUnits.some((u: string) => u.toLowerCase().trim() === m.unit.toLowerCase().trim())) {
          return true;
        }

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

    fetch('/api/public/units')
      .then((res) => res.json())
      .then((uData) => {
        if (Array.isArray(uData)) {
          setUnitsList(uData.filter((u: any) => u.name && !['administrator', 'admin'].includes(u.name.toLowerCase().trim())));
        }
      })
      .catch((err) => console.error('Failed to load units:', err));
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
      setStartDate(request.start_date || new Date().toISOString().split('T')[0]);
    }
    if (!deadline && request.deadline) {
      setDeadline(request.deadline);
    }
    if (isUnitHeadActor) {
      setStaffUnitFilter(myUnitName || user?.unit || 'All');
      if ((!selectedStaff || selectedStaff.length === 0) && myUnitMeta?.suggested_staff_id) {
        const rawSuggested = String(myUnitMeta.suggested_staff_id);
        const suggested = rawSuggested
          .split(',')
          .map((s: string) => Number(s.trim()))
          .filter((sid: number) => !isNaN(sid) && sid > 0 && !staffAssignedToOtherTracks[sid]);
        if (suggested.length > 0) {
          setSelectedStaff(suggested);
        } else {
          setSelectedStaff([]);
        }
      }
    } else {
      setSelectedStaff([]);
    }
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (isUnitHeadActor && (!selectedStaff || selectedStaff.length === 0)) {
      alert("Please select at least one staff member before assigning team.");
      return;
    }
    if (!deadline) {
      alert("Please set a deadline date before approving this request.");
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (deadline < todayStr) {
      alert("Deadline date cannot be earlier than today.");
      return;
    }
    if (startDate && deadline && deadline < startDate) {
      alert("Deadline date cannot be earlier than Start Date.");
      return;
    }
    setActionLoading(true);
    try {
      // 1. Update timeline
      if (startDate || deadline) {
        await fetch(`/api/job-requests/${id}/update-timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ start_date: startDate, deadline }),
        });
      }

      // 2. Perform approval transition & staff team assignment
      const res = await fetch(`/api/job-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          comment: comment || (isManagerActor ? 'Request approved by Manager. Forwarded to Unit Head for staff assignment.' : 'Staff team assigned by Unit Head.'),
          start_date: startDate,
          deadline: deadline,
          staff_ids: isUnitHeadActor ? selectedStaff : undefined,
          staff_tasks: isUnitHeadActor ? staffTasks : undefined,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setShowApproveModal(false);
        setComment('');
        fetchDetail();
      } else {
        alert(resData.error || 'Failed to approve request.');
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

  const handleComplete = async (overrideComment?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: overrideComment || comment }),
      });
      const resData = await res.json();
      if (resData.success) {
        setComment('');
        setShowForceCompleteModal(false);
        fetchDetail();
      } else {
        alert(resData.error || 'Gagal menandakan projek sebagai selesai.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Ralat semasa mengemaskini status projek.');
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
    const todayStr = new Date().toISOString().split('T')[0];
    if (deadline && deadline < todayStr) {
      alert("Deadline date cannot be earlier than today.");
      return;
    }
    if (startDate && deadline && deadline < startDate) {
      alert("Deadline date cannot be earlier than Start Date.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/update-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ start_date: startDate, deadline, reason: timelineReason }),
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || 'Failed to update timeline.');
        return;
      }
      setShowEditTimelineModal(false);
      setTimelineReason('');
      fetchDetail();
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUnitMilestoneModal = (
    uName: string,
    serviceLabel: string,
    curStart?: string,
    curDead?: string,
    curNote?: string
  ) => {
    setMilestoneUnitName(uName);
    setMilestoneServiceLabel(serviceLabel);
    setMilestoneStartDate(curStart || request?.start_date || new Date().toISOString().split('T')[0]);
    setMilestoneDeadline(curDead || request?.deadline || '');
    setMilestoneNote(curNote || '');
    setShowUnitMilestoneModal(true);
  };

  const handleSaveUnitMilestone = async () => {
    if (!milestoneDeadline) {
      alert('Please enter a milestone target deadline.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (milestoneDeadline < todayStr) {
      alert('Milestone deadline cannot be earlier than today.');
      return;
    }
    if (milestoneStartDate && milestoneDeadline && milestoneDeadline < milestoneStartDate) {
      alert('Milestone deadline cannot be earlier than start date.');
      return;
    }
    setMilestoneSaving(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/unit-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          unit_name: milestoneUnitName,
          service_label: milestoneServiceLabel,
          start_date: milestoneStartDate,
          deadline: milestoneDeadline,
          milestone_note: milestoneNote,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowUnitMilestoneModal(false);
        fetchDetail();
      } else {
        alert(resData.error || 'Failed to update milestone timeline.');
      }
    } catch (err: any) {
      alert('Error updating milestone timeline: ' + err.message);
    } finally {
      setMilestoneSaving(false);
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

  const handleRequestAssistanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistanceTargetUnit) {
      alert('Sila pilih unit sasaran (Target Unit).');
      return;
    }
    if (!assistanceTaskDesc.trim()) {
      alert('Sila nyatakan skop atau tugasan yang diperlukan.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/request-assistance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_unit: assistanceTargetUnit,
          suggested_staff_id: assistanceSuggestedStaffId || null,
          task_description: assistanceTaskDesc.trim(),
          notes: assistanceNotes.trim(),
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || resData.error) {
        alert(resData.error || 'Gagal menghantar permohonan bantuan.');
      } else {
        setShowRequestAssistanceModal(false);
        setAssistanceTargetUnit('');
        setAssistanceSuggestedStaffId('');
        setAssistanceTaskDesc('');
        setAssistanceNotes('');
        fetchDetail();
      }
    } catch (err: any) {
      alert(`Ralat: ${err?.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRespondModal = (ast: any) => {
    setShowRespondAssistanceModal(ast);
    setShowDeclineConfirm(false);
    setRespondAssignedStaffId(ast.suggested_staff_id ? Number(ast.suggested_staff_id) : '');
    setRespondTaskDesc(ast.task_description || '');
    setRespondDeclineReason('');
  };

  const handleRespondAssistanceSubmit = async (action: 'accept' | 'decline') => {
    if (!showRespondAssistanceModal) return;
    if (action === 'accept' && !respondAssignedStaffId) {
      alert('Sila pilih staf yang ingin ditugaskan.');
      return;
    }
    if (action === 'decline' && !respondDeclineReason.trim()) {
      alert('Sila nyatakan sebab permohonan ditolak.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/respond-assistance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_item_id: showRespondAssistanceModal.id,
          request_id: showRespondAssistanceModal.id,
          action,
          assigned_staff_id: action === 'accept' ? Number(respondAssignedStaffId) : undefined,
          task_description: action === 'accept' ? respondTaskDesc.trim() : undefined,
          decline_reason: action === 'decline' ? respondDeclineReason.trim() : undefined,
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || resData.error) {
        alert(resData.error || 'Gagal memproses permohonan bantuan.');
      } else {
        setShowRespondAssistanceModal(null);
        setShowDeclineConfirm(false);
        setRespondAssignedStaffId('');
        setRespondTaskDesc('');
        setRespondDeclineReason('');
        fetchDetail();
      }
    } catch (err: any) {
      alert(`Ralat: ${err?.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStaffSelection = (staffId: number) => {
    // If the logged-in user is regular staff (NOT manager, NOT acting manager, NOT unit head),
    // prevent them from removing existing assigned team members.
    // Unit Heads, Managers, Acting Managers, and Admins can manage and change team assignments freely.
    const isUnitHeadUser = Boolean(user?.is_unit_head && user.is_unit_head !== 0 && (user.is_unit_head as any) !== '0');
    const isRegularStaff = Boolean(user?.role === 'staff' && !user?.is_acting_manager && !isUnitHeadUser);
    if (isRegularStaff) {
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
  const formatDate = formatDateDisplay;

  const isInterUnitJob = Boolean(
    request?.ticket_no?.startsWith('IU') ||
    request?.request_type === 'inter_unit' ||
    request?.additional_data?.is_inter_unit
  );

  const isMultiUnitJob = Boolean(
    request?.ticket_no?.startsWith('MU') ||
    request?.additional_data?.is_multi_unit ||
    (Array.isArray(request?.additional_data?.target_units) && request.additional_data.target_units.length > 1)
  );

  const managedUnits: string[] = (user as any)?.managed_units || [];
  const managedUnitIds: number[] = (user as any)?.managed_unit_ids || [];
  const userDeptId = (user as any)?.managed_department_id || (user as any)?.department_id || (user as any)?.acting_manager_department_id;
  const reqUnit = request?.unit?.toLowerCase().trim();
  const reqUnitId = request?.unit_id ? Number(request.unit_id) : null;
  const userUnit = user?.unit?.toLowerCase().trim();
  const userUnitId = user?.unit_id ? Number(user.unit_id) : null;

  const multiTargetUnits: string[] = Array.isArray(request?.additional_data?.target_units)
    ? request.additional_data.target_units
    : (reqUnit ? [reqUnit] : []);
  const multiTargetUnitIds: number[] = Array.isArray(request?.additional_data?.target_unit_ids)
    ? request.additional_data.target_unit_ids
    : (reqUnitId ? [reqUnitId] : []);

  const isRequestUnitHead = Boolean(
    user?.is_unit_head &&
    user?.role !== 'manager' &&
    (
      (reqUnitId && managedUnitIds.includes(reqUnitId)) ||
      (reqUnit && managedUnits.some((u) => u.toLowerCase().trim() === reqUnit)) ||
      (reqUnitId && userUnitId && reqUnitId === userUnitId) ||
      (reqUnit && userUnit && reqUnit === userUnit) ||
      managedUnitIds.some((mId) => multiTargetUnitIds.includes(mId)) ||
      managedUnits.some((mUnit) => multiTargetUnits.some((tUnit) => tUnit.toLowerCase().trim() === mUnit.toLowerCase().trim())) ||
      (userUnit && multiTargetUnits.some((tUnit) => tUnit.toLowerCase().trim() === userUnit))
    )
  );

  const isTargetUnitHead = Boolean((isInterUnitJob || isMultiUnitJob) && isRequestUnitHead);

  const isDirectToHeadUnit = Boolean(
    request?.additional_data?.routing_target === 'head_unit' ||
    request?.current_step_name === 'Unit Head Review'
  );

  const isCustomServiceHeadUnit = Boolean(isRequestUnitHead && isDirectToHeadUnit);

  const isDepartmentManagerForJob = Boolean(
    (user?.role === 'manager' || user?.is_acting_manager) && (
      (request?.department_id && userDeptId && String(request.department_id) === String(userDeptId)) ||
      (isMultiUnitJob && multiTargetUnits.some((tUnit) => {
        return managedUnits.some((mu) => mu.toLowerCase().trim() === tUnit.toLowerCase().trim());
      })) ||
      (reqUnit && managedUnits.some((mu) => mu.toLowerCase().trim() === reqUnit))
    )
  );

  const isManagerActor = Boolean(
    user?.role === 'manager' || user?.is_acting_manager || user?.role === 'admin' || user?.role === 'director'
  );

  const isUnitHeadActor = Boolean(
    user?.is_unit_head && user?.role !== 'manager'
  );

  // Check ALL unit entries matching current Unit Head
  const myMatchingUnits = Object.entries(request?.additional_data?.unit_assignments || {}).filter(([uName, uMeta]: [string, any]) => {
    const targetUnit = (uMeta?.unit_name || uName).toLowerCase().trim();
    const cleanUName = uName.toLowerCase().trim();
    return managedUnits.some((mu) => {
      const m = mu.toLowerCase().trim();
      return m === targetUnit || m === cleanUName || cleanUName.startsWith(m + ' —') || cleanUName.startsWith(m + ' (');
    }) || (userUnit && (userUnit === targetUnit || userUnit === cleanUName || cleanUName.startsWith(userUnit + ' —') || cleanUName.startsWith(userUnit + ' (')));
  });
  const myUnitEntry = myMatchingUnits.find(([_, uMeta]: [string, any]) => uMeta?.status !== 'accepted' && (uMeta?.routing_target === 'head_unit' || uMeta?.manager_approved))
    || (myMatchingUnits.length > 0 ? myMatchingUnits[0] : null);
  const myUnitMeta: any = myUnitEntry ? myUnitEntry[1] : null;
  const myUnitName = myUnitMeta?.unit_name || (myUnitEntry ? myUnitEntry[0].split(' — ')[0] : (user?.unit || ''));

  // Is Unit Head waiting for Manager approval?
  // If ANY unit belonging to this Unit Head still needs Manager approval:
  const isUnitHeadWaitingManager = Boolean(
    isUnitHeadActor &&
    (
      myMatchingUnits.some(([_, uMeta]: [string, any]) => {
        const isMgrRoute = (uMeta?.routing_target || 'manager') === 'manager';
        return isMgrRoute && !uMeta?.manager_approved && uMeta?.status !== 'rejected';
      }) ||
      (!request?.additional_data?.unit_assignments && !isDirectToHeadUnit && (request?.additional_data?.routing_target || 'manager') === 'manager')
    )
  );

  // Check if this Unit Head has ALREADY assigned staff to their unit
  const hasMyUnitCompletedAssignment = Boolean(
    isUnitHeadActor &&
    myMatchingUnits.length > 0 &&
    myMatchingUnits.every(([_, uMeta]: [string, any]) => {
      const staffList = Array.isArray(uMeta?.assigned_staff_ids)
        ? uMeta.assigned_staff_ids
        : (typeof uMeta?.assigned_staff_ids === 'string' && uMeta.assigned_staff_ids.trim()
            ? uMeta.assigned_staff_ids.split(',').map((id: string) => Number(id.trim()))
            : []);
      return (uMeta?.status === 'accepted' || staffList.length > 0 || uMeta?.status === 'rejected');
    })
  );

  // Can this Unit Head assign staff?
  const canUnitHeadAct = Boolean(
    isUnitHeadActor &&
    !isUnitHeadWaitingManager &&
    !hasMyUnitCompletedAssignment &&
    (
      (isInterUnitJob && isTargetUnitHead) ||
      isDirectToHeadUnit ||
      myMatchingUnits.some(([_, uMeta]: [string, any]) => {
        return uMeta?.routing_target === 'head_unit' || uMeta?.manager_approved === true || uMeta?.status === 'awaiting_head_assignment';
      })
    )
  );

  // Check if any unit under manager's department needs manager approval
  const hasUnitNeedingManagerApproval = Boolean(
    request?.additional_data?.unit_assignments
      ? Object.entries(request.additional_data.unit_assignments).some(([uName, uMeta]: [string, any]) => {
          const targetUnit = (uMeta?.unit_name || uName).toLowerCase().trim();
          const cleanUName = uName.toLowerCase().trim();
          const belongsToMyDept = managedUnits.some((mu) => {
            const m = mu.toLowerCase().trim();
            return m === targetUnit || m === cleanUName || cleanUName.startsWith(m + ' —') || cleanUName.startsWith(m + ' (');
          }) || (userDeptId && Number(uMeta?.department_id) === Number(userDeptId));
          const isManagerRoute = (uMeta?.routing_target || 'manager') === 'manager';
          return belongsToMyDept && isManagerRoute && !uMeta?.manager_approved && uMeta?.status !== 'rejected';
        })
      : !isDirectToHeadUnit && (request?.additional_data?.routing_target || 'manager') === 'manager'
  );

  // Can Manager approve?
  const canManagerAct = Boolean(
    isManagerActor &&
    (
      user?.role === 'admin' ||
      user?.role === 'director' ||
      (isDepartmentManagerForJob && hasUnitNeedingManagerApproval)
    )
  );

  const canActOnManagerApproval = Boolean(
    isManagerActor ? canManagerAct : canUnitHeadAct
  );

  // Check if current manager has already approved their department's units
  const myApprovedUnits = Object.entries(request?.additional_data?.unit_assignments || {}).filter(([uName, uMeta]: [string, any]) => {
    const belongsToMyDept = managedUnits.some((mu) => mu.toLowerCase().trim() === uName.toLowerCase().trim()) ||
      (userDeptId && Number(uMeta?.department_id) === Number(userDeptId));
    return belongsToMyDept && uMeta?.manager_approved === true;
  });

  const hasMyDeptApproved = Boolean(
    isManagerActor && (
      (myApprovedUnits.length > 0 && !hasUnitNeedingManagerApproval) ||
      (request?.additional_data?.manager_approved === true && !hasUnitNeedingManagerApproval)
    )
  );

  const otherUnitsNeedingManager = Object.entries(request?.additional_data?.unit_assignments || {}).filter(([uName, uMeta]: [string, any]) => {
    const belongsToMyDept = managedUnits.some((mu) => mu.toLowerCase().trim() === uName.toLowerCase().trim()) ||
      (userDeptId && Number(uMeta?.department_id) === Number(userDeptId));
    const isManagerRoute = (uMeta?.routing_target || 'manager') === 'manager';
    return !belongsToMyDept && isManagerRoute && !uMeta?.manager_approved;
  });

  const approvedHeadNames = myApprovedUnits.map(([uName]) => {
    const matchingHead = (data?.targetUnitHeads || []).find(
      (h: any) => h.unit?.toLowerCase().trim() === uName.toLowerCase().trim()
    ) || (targetUnitHead?.unit?.toLowerCase().trim() === uName.toLowerCase().trim() ? targetUnitHead : null);
    return matchingHead?.name ? `${matchingHead.name} (${uName})` : uName;
  });

  const otherPendingManagers = otherUnitsNeedingManager.map(([uName]) => {
    const matchingMgr = ((data as any)?.targetManagers || []).find(
      (m: any) => m.unit?.toLowerCase().trim() === uName.toLowerCase().trim()
    );
    return matchingMgr?.name ? `${matchingMgr.name} (${uName})` : uName;
  });

  const targetHeadDisplayName =
    targetUnitHead?.name ||
    request?.additional_data?.target_unit_head_name ||
    (data?.targetUnitHeads && data.targetUnitHeads.length > 0 ? data.targetUnitHeads[0].name : null);

  const requesterUnit = request?.additional_data?.requester_unit?.toLowerCase().trim();
  const requesterId = request?.additional_data?.requester_id ? Number(request.additional_data.requester_id) : null;
  const isRequesterUnitHead = Boolean(
    isInterUnitJob &&
    user?.is_unit_head &&
    (
      (requesterId && Number(user?.id) === requesterId) ||
      (requesterUnit && userUnit && requesterUnit === userUnit) ||
      (requesterUnit && managedUnits.some((u) => u.toLowerCase().trim() === requesterUnit))
    )
  );

  const isCollaboratingUnitHead = isTargetUnitHead || isRequesterUnitHead;

  const isAssignedStaff = Boolean(
    (request?.assigned_staff_ids && request.assigned_staff_ids.split(',').map((s: string) => Number(s.trim())).includes(Number(user?.id))) ||
    (data?.staffDetails && data.staffDetails.some((s: any) => Number(s.id) === Number(user?.id))) ||
    (selectedStaff && selectedStaff.map(Number).includes(Number(user?.id)))
  );

  // Check if current user is an assigned staff in unit_assignments whose unit is approved/accepted
  const myAssignedMultiUnit = Object.entries(request?.additional_data?.unit_assignments || {}).find(([_, uMeta]: [string, any]) => {
    const ids = Array.isArray(uMeta?.assigned_staff_ids)
      ? uMeta.assigned_staff_ids.map(Number)
      : (typeof uMeta?.assigned_staff_ids === 'string'
          ? uMeta.assigned_staff_ids.split(',').map((id: string) => Number(id.trim()))
          : []);
    return ids.includes(Number(user?.id));
  });

  const isAssignedStaffInActiveMultiUnit = Boolean(
    isMultiUnitJob &&
    (isAssignedStaff || myAssignedMultiUnit) &&
    (
      !myAssignedMultiUnit ||
      myAssignedMultiUnit[1]?.manager_approved === true ||
      myAssignedMultiUnit[1]?.routing_target === 'head_unit' ||
      myAssignedMultiUnit[1]?.routing_target === 'staff' ||
      myAssignedMultiUnit[1]?.status === 'accepted'
    )
  );

  // Identify staff already assigned to other active sub-services/tracks in this request
  const staffAssignedToOtherTracks: Record<number, string> = {};
  if (request?.additional_data?.unit_assignments) {
    for (const [trackKey, trackMeta] of Object.entries(request.additional_data.unit_assignments as any)) {
      if (trackKey === myUnitEntry?.[0]) continue;
      if ((trackMeta?.status === 'accepted' || trackMeta?.routing_target === 'staff') && Array.isArray(trackMeta?.assigned_staff_ids)) {
        trackMeta.assigned_staff_ids.forEach((sid: number) => {
          staffAssignedToOtherTracks[sid] = trackMeta.service_name || trackKey;
        });
      }
    }
  }

  // Specifications View & Edit permissions
  const canEditServiceSpec = (srv: any) => {
    if (user?.role === 'admin' || user?.role === 'director') return true;
    if (!user?.is_unit_head) return false;
    const unitName = (srv?.target_unit_name || srv?.name || '').toLowerCase().trim();
    const userUnitClean = (userUnit || '').toLowerCase().trim();
    return Boolean(
      (userUnitClean && userUnitClean === unitName) ||
      managedUnits.some((mu) => mu.toLowerCase().trim() === unitName) ||
      (user?.unit_id && srv?.target_unit_id && Number(user.unit_id) === Number(srv.target_unit_id)) ||
      (srv?.target_unit_id && managedUnitIds.includes(Number(srv.target_unit_id)))
    );
  };

  const handleOpenSpecModal = (srv: any, startInEditMode: boolean = false) => {
    setActiveSpecService(srv);
    setSpecScope(srv.scope || '');
    setSpecFields(srv.fields ? { ...srv.fields } : {});
    const targetUnit = srv.target_unit_name || srv.name;
    const srvLabel = srv.display_label || srv.name;
    const uMeta = request?.additional_data?.unit_assignments?.[`${targetUnit} — ${srvLabel}`]
      || request?.additional_data?.unit_assignments?.[targetUnit]
      || request?.additional_data?.unit_assignments?.[srv.name]
      || Object.entries(request?.additional_data?.unit_assignments || {}).find(([k, m]: [string, any]) => 
           m?.service_name === srv.name || m?.service_name === srv.display_label || k.includes(srv.name) || k.includes(srv.display_label)
         )?.[1];
    setSpecGuidanceNotes(srv.head_guidance_notes || uMeta?.head_guidance_notes || '');
    setIsEditingSpec(startInEditMode && canEditServiceSpec(srv));
    setShowSpecModal(true);
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpecService) return;
    setSavingSpec(true);
    try {
      const res = await fetch(`/api/job-requests/${id}/update-specifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unit_name: activeSpecService.target_unit_name || activeSpecService.name,
          service_label: activeSpecService.display_label || activeSpecService.name,
          scope: specScope,
          custom_fields: specFields,
          head_guidance_notes: specGuidanceNotes,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setIsEditingSpec(false);
        setShowSpecModal(false);
        fetchDetail();
      } else {
        alert(resData.error || 'Failed to update specifications.');
      }
    } catch (err: any) {
      console.error('Error updating specifications:', err);
      alert('Error updating specifications: ' + err.message);
    } finally {
      setSavingSpec(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getAstRequesterBadge = (ast: any) => {
    if (!ast) return 'Staff';
    if (ast.requester_role === 'manager' || ast.requester_name?.toLowerCase().includes('faizal') || ast.requester_unit?.toLowerCase().trim() === 'manager') {
      return 'Manager';
    }
    if (ast.requester_role === 'admin' || ast.requester_unit?.toLowerCase().trim() === 'admin') {
      return 'Admin';
    }
    return ast.requester_unit || 'Staff';
  };

  const canUserRespondToAst = (ast: any) => {
    // Managers and Directors must NOT review or assign staff for cross-unit assistance (strictly between Unit Heads, with Admin override if needed)
    if (user?.role === 'manager' || user?.is_acting_manager || user?.role === 'director') {
      return false;
    }
    if (user?.role === 'admin') {
      return true;
    }
    if (ast.head_id && Number(user?.id) === Number(ast.head_id)) {
      return true;
    }
    if (user?.is_unit_head) {
      if (user?.unit && user.unit.toLowerCase().trim() === ast.target_unit?.toLowerCase().trim()) return true;
      if (managedUnits.some((mu) => mu.toLowerCase().trim() === ast.target_unit?.toLowerCase().trim())) return true;
    }
    return false;
  };

  // Strictly origin manager or admin can update timeline (Pilihan A)
  const canEditTimeline = (() => {
    if (user?.role === 'admin' || user?.role === 'director') return true;
    if (user?.role !== 'manager' && !user?.is_acting_manager) {
      if (!isInterUnitJob && isRequestUnitHead) return true;
      return false;
    }

    const userDeptId = (user as any)?.managed_department_id || (user as any)?.department_id || (user as any)?.acting_manager_department_id;
    const originDeptId = request?.origin_department_id || (!isInterUnitJob ? request?.department_id : null);

    if (originDeptId && userDeptId && String(originDeptId) === String(userDeptId)) {
      return true;
    }

    // Inter-Unit job matching by requester unit
    if (isInterUnitJob && requesterUnit) {
      if (managedUnits.some((u) => u.toLowerCase().trim() === requesterUnit)) {
        return true;
      }
      if (user?.unit && user.unit.toLowerCase().trim() === requesterUnit) {
        return true;
      }
      return false;
    }

    // Standard non-interunit job: match request's department or unit
    if (!isInterUnitJob) {
      if (request?.department_id && userDeptId && String(request.department_id) === String(userDeptId)) {
        return true;
      }
      if (request?.unit && managedUnits.some((u) => u.toLowerCase().trim() === request.unit.toLowerCase().trim())) {
        return true;
      }
    }

    return false;
  })();

  // Helper for unit badge styling
  const getUnitBadgeStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('graphic') || n.includes('design')) {
      return 'bg-purple-50 text-purple-700 border-purple-200/90 ring-purple-100';
    }
    if (n.includes('social') || n.includes('media') || n.includes('socmed')) {
      return 'bg-blue-50 text-blue-700 border-blue-200/90 ring-blue-100';
    }
    if (n.includes('event')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/90 ring-emerald-100';
    }
    if (n.includes('video') || n.includes('3d') || n.includes('multimedia')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/90 ring-amber-100';
    }
    if (n.includes('web') || n.includes('it') || n.includes('tech')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/90 ring-cyan-100';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/90 ring-indigo-100';
  };

  // Compute all participating units involved in this project for transparent oversight (pure calculation, no hook)
  const { participatingUnits, unitStaffCounts } = (() => {
    const canonicalMap = new Map<string, string>();
    const counts: Record<string, number> = {};

    const addUnit = (rawName?: string) => {
      if (!rawName) return null;
      const trimmed = rawName.trim();
      if (!trimmed) return null;
      const lower = trimmed.toLowerCase();
      if (!canonicalMap.has(lower)) {
        canonicalMap.set(lower, trimmed);
      }
      return canonicalMap.get(lower)!;
    };

    // 1. Primary request unit
    addUnit(request?.unit);

    // 2. Requester unit (origin unit)
    addUnit(request?.additional_data?.requester_unit);

    // 3. Multi-target units from inter-unit requests
    const targetUnits = request?.additional_data?.target_units;
    if (Array.isArray(targetUnits)) {
      targetUnits.forEach((u: string) => addUnit(u));
    } else if (typeof targetUnits === 'string') {
      targetUnits.split(',').forEach((u: string) => addUnit(u));
    }

    // 4. Units of all assigned staff
    if (Array.isArray(data?.staffDetails)) {
      data.staffDetails.forEach((s: any) => {
        if (s.unit) {
          const canonical = addUnit(s.unit);
          if (canonical) {
            counts[canonical] = (counts[canonical] || 0) + 1;
          }
        }
      });
    }

    // 5. Units from cross-unit assistance requests (accepted or pending)
    const astList = Array.isArray(request?.additional_data?.assistance_requests)
      ? request.additional_data.assistance_requests
      : [];
    astList.forEach((ast: any) => {
      if (ast.target_unit) addUnit(ast.target_unit);
      if (ast.requester_unit && !['staff', 'manager', 'admin', 'origin unit'].includes(ast.requester_unit.toLowerCase().trim())) {
        addUnit(ast.requester_unit);
      }
    });

    return {
      participatingUnits: Array.from(canonicalMap.values()),
      unitStaffCounts: counts,
    };
  })();

  // True when the logged-in user is the origin staff of an Inter-Unit job
  // (the person from the requester's unit who was assigned to do the requester-side work)
  const isCurrentUserOriginStaff = Boolean(
    isInterUnitJob &&
    request?.additional_data?.origin_staff_id &&
    Number(request.additional_data.origin_staff_id) === Number(user?.id)
  );

  const userUnitAssignments = request?.additional_data?.unit_assignments || {};
  const isUserUnitPending = Boolean(
    isInterUnitJob &&
    isTargetUnitHead &&
    multiTargetUnits.some((uName: string) => {
      const isUserUnit =
        managedUnits.some((mu) => mu.toLowerCase().trim() === uName.toLowerCase().trim()) ||
        (userUnit && userUnit === uName.toLowerCase().trim());
      if (!isUserUnit) return false;
      const meta = userUnitAssignments[uName];
      return !meta || meta.status !== 'accepted' || !Array.isArray(meta.assigned_staff_ids) || meta.assigned_staff_ids.length === 0;
    })
  );

  const renderStatusCapsule = (status: string) => {
    if (status === 'manager_approval' || ((isInterUnitJob || isMultiUnitJob) && status === 'staff_processing' && multiTargetUnits.length > 1)) {
      if (isInterUnitJob || isMultiUnitJob) {
        // Multi-Unit Live Badges
        if (multiTargetUnits.length > 1) {
          const unitAssignments = request.additional_data?.unit_assignments || {};
          return (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {multiTargetUnits.map((uName: string) => {
                const uMeta = unitAssignments[uName];
                const matchingHead = (data?.targetUnitHeads || []).find(
                  (h: any) => h.unit?.toLowerCase().trim() === uName.toLowerCase().trim()
                ) || (targetUnitHead?.unit?.toLowerCase().trim() === uName.toLowerCase().trim() ? targetUnitHead : null);
                const matchingMgr = ((data as any)?.targetManagers || []).find(
                  (m: any) => m.unit?.toLowerCase().trim() === uName.toLowerCase().trim()
                );
                const isUnitDirectToHead = uMeta?.routing_target === 'head_unit' || uMeta?.routing_target === 'staff';
                const approverDisplayName = isUnitDirectToHead
                  ? (uMeta?.head_name || matchingHead?.name || 'Head Unit')
                  : (!isDirectToHeadUnit && !isInterUnitJob && matchingMgr?.name)
                  ? matchingMgr.name
                  : (uMeta?.head_name || matchingHead?.name || 'Head');
                const isAccepted = uMeta?.status === 'accepted' || (Array.isArray(uMeta?.assigned_staff_ids) && uMeta.assigned_staff_ids.length > 0);
                const isManagerApproved = Boolean(uMeta?.manager_approved || uMeta?.routing_target === 'head_unit' || uMeta?.routing_target === 'staff');

                const pillClass = isAccepted
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : isManagerApproved
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                  : 'bg-amber-500 text-white border-amber-400 shadow-sm';

                const dotClass = (isAccepted || isManagerApproved)
                  ? 'bg-emerald-200'
                  : 'bg-amber-200 animate-pulse';

                const statusLabel = isAccepted
                  ? '✓ READY'
                  : isManagerApproved
                  ? '✓ APPROVED'
                  : 'APPROVAL';

                return (
                  <span
                    key={uName}
                    className={`inline-flex items-center gap-1.5 font-black uppercase text-[11px] px-3 py-1 rounded-xl tracking-wider shadow-2xs border transition-all whitespace-nowrap ${pillClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                    <span>{uName}</span>
                    <span className="opacity-80 font-semibold text-[10px]">({approverDisplayName})</span>
                    <span className="text-[9px] font-black uppercase opacity-95 pl-0.5">
                      {statusLabel}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        }

        // Single Unit Badge
        const headName = targetUnitHead?.name || request.additional_data?.target_unit_head_name;
        return (
          <span className="bg-teal-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
            <span>{headName ? `HEAD UNIT (${headName}) APPROVAL` : 'HEAD UNIT APPROVAL'}</span>
          </span>
        );
      }
      if (isDirectToHeadUnit || request?.current_step_name?.includes('Unit Head') || request?.current_step_name?.includes('Head Unit') || hasMyDeptApproved) {
        const headName = approvedHeadNames.length > 0 ? approvedHeadNames[0] : (targetHeadDisplayName || request.additional_data?.target_unit_head_name);
        return (
          <span className="bg-teal-600 text-white font-black uppercase text-xs px-4 py-2 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
            <span>{headName ? `UNIT HEAD REVIEW (${headName})` : 'UNIT HEAD REVIEW'}</span>
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
                  <span className="text-[10px] font-black text-blue-200 uppercase tracking-wider block">
                    {multiTargetUnits.length > 1 ? 'Target Handling Units' : 'Target Handling Unit'}
                  </span>
                  <div className="font-extrabold text-white mt-0.5 flex flex-wrap items-center gap-1.5">
                    {multiTargetUnits.length > 0 ? (
                      multiTargetUnits.map((uName: string) => {
                        const matchingHead = (data?.targetUnitHeads || []).find(
                          (h: any) => h.unit?.toLowerCase().trim() === uName.toLowerCase().trim()
                        ) || (targetUnitHead?.unit?.toLowerCase().trim() === uName.toLowerCase().trim() ? targetUnitHead : null);
                        return (
                          <span key={uName} className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg">
                            <span>{uName}</span>
                            {matchingHead && (
                              <span className="text-[10px] text-blue-200 font-semibold">({matchingHead.name})</span>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span>{request.unit}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-blue-200 mt-1">
                    Reviewer: <strong>Target Unit Head{multiTargetUnits.length > 1 ? 's' : ''}</strong>
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

          {/* CUSTOM CLIENT SERVICE HIGHLIGHT BANNER */}
          {request.additional_data?.service_name && (
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-purple-900/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 text-purple-200 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/40 text-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300/30">
                        Custom Client Service
                      </span>
                      {request.additional_data?.routing_target === 'staff' && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/40 text-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300/30">
                          ⚡ Direct to Staff
                        </span>
                      )}
                      {request.additional_data?.routing_target === 'head_unit' && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/40 text-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-300/30">
                          👑 Direct to Head Unit
                        </span>
                      )}
                      <span className="text-xs font-semibold text-purple-200">
                        Fulfillment: <strong className="text-white">{request.unit}</strong>
                      </span>
                    </div>
                    <h2 className="text-base font-black tracking-tight mt-1">
                      {request.additional_data.service_display_label || request.additional_data.service_name} Request
                    </h2>
                  </div>
                </div>

                {request.additional_data.suggested_staff_name && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2.5">
                    <span className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
                      Recommended Specialist:
                    </span>
                    <span className="text-xs font-black text-white bg-purple-500/40 px-2 py-0.5 rounded-lg border border-purple-300/30">
                      {request.additional_data.suggested_staff_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Request Header Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
            {/* Top Title & Status Capsule Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                  REQUEST #{request.ticket_no}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight break-words">
                  {request.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-500">INTERNAL ID: #{request.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase px-3 py-1 rounded-xl">
                    SUBMITTED ON {formatDateDisplay(request.created_at)}
                  </span>
                </div>
              </div>

              {/* Status Capsule Badge & Progress Indicator matching Reference Image */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
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

            {/* Participating Units Oversight Badges (Only shown when multiple units are collaborating) */}
            {user?.role !== 'client' && participatingUnits.length > 1 && (
              <div className="bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30 p-4 md:p-5 rounded-3xl border border-indigo-200/90 shadow-sm shadow-indigo-100/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-300 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Participating Units
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                          {participatingUnits.length} {participatingUnits.length === 1 ? 'Unit' : 'Units Involved'}
                        </span>
                        {participatingUnits.length > 1 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                            ✨ Multi-Unit Project
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Units and team members actively collaborating on this request
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400">
                    Oversight: <span className="text-indigo-600 font-bold">Transparent Active Team</span>
                  </div>
                </div>

                {/* Unit Badges Row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-indigo-100/70">
                  {participatingUnits.map((unitName) => {
                    const staffCount = unitStaffCounts[unitName] || 0;
                    const badgeColor = getUnitBadgeStyle(unitName);
                    return (
                      <div
                        key={unitName}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border shadow-xs text-xs font-bold transition-all ${badgeColor}`}
                      >
                        <Building2 className="w-3.5 h-3.5 opacity-80" />
                        <span className="font-extrabold">{unitName}</span>
                        {staffCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-white/95 text-slate-800 text-[10px] font-black border border-current/20 shadow-2xs">
                            {staffCount} {staffCount === 1 ? 'staff' : 'staffs'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-lg bg-white/70 text-slate-500 text-[10px] font-medium">
                            Assistance Unit
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dedicated Standalone CROSS-UNIT ASSISTANCE BANNER / CARD */}
            {(() => {
              if (user?.role === 'client') return null;
              const assistanceRequests: any[] = Array.isArray(request?.additional_data?.assistance_requests)
                ? request.additional_data.assistance_requests
                : [];
              if (assistanceRequests.length === 0) return null;

              const pendingList = assistanceRequests.filter((a) => a.status === 'pending');
              const resolvedList = assistanceRequests.filter((a) => a.status !== 'pending');

              return (
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-indigo-200/90 shadow-md shadow-indigo-50/50 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            CROSS-UNIT ASSISTANCE & COLLABORATION
                          </h3>
                          {pendingList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {pendingList.length} PENDING REVIEW
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Cross-unit assistance requests and staff endorsements
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List of Pending Assistance Requests */}
                  {pendingList.length > 0 && (
                    <div className="space-y-3">
                      {pendingList.map((ast) => {
                        const canRespond = canUserRespondToAst(ast);
                        return (
                          <div
                            key={ast.id}
                            className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg">
                                  Assistance Needed: {ast.target_unit} Unit
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Requested by <strong className="text-slate-800">{ast.requester_name}</strong> ({getAstRequesterBadge(ast)})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {ast.created_at ? new Date(ast.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>

                            <div className="bg-white/80 p-3 rounded-xl border border-amber-100 text-xs text-slate-800 space-y-1">
                              <div>
                                <strong className="text-slate-900 font-bold">Task / Scope: </strong>
                                <span className="text-slate-700">{ast.task_description}</span>
                              </div>
                              {ast.suggested_staff_name && (
                                <div className="text-[11px] text-indigo-700 font-semibold">
                                  ★ Suggested staff by requester: <strong>{ast.suggested_staff_name}</strong>
                                </div>
                              )}
                              {ast.notes && (
                                <div className="text-[11px] text-slate-500 italic">
                                  Notes: "{ast.notes}"
                                </div>
                              )}
                            </div>

                            {/* Action Buttons if user is Target Unit Head or Admin/Manager */}
                            {canRespond ? (
                              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRespondModal(ast)}
                                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl border-none shadow-sm gap-1.5 px-4"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Review & Assign Staff
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenRespondModal(ast);
                                    setShowDeclineConfirm(true);
                                  }}
                                  className="btn btn-sm btn-ghost text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl px-3"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-800 font-medium italic flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Waiting for {ast.target_unit} Head ({ast.head_name || 'Unit Head'}) to review and assign staff.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List of Resolved (Accepted / Declined) Requests */}
                  {resolvedList.length > 0 && (
                    <div className={`${pendingList.length > 0 ? 'pt-3 border-t border-slate-100' : 'pt-0'} space-y-2`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Assistance History
                      </span>
                      <div className="space-y-1.5">
                        {resolvedList.map((ast) => (
                          <div
                            key={ast.id}
                            className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {ast.status === 'accepted' ? (
                                <span className="badge bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border-none">
                                  ✓ ACCEPTED
                                </span>
                              ) : (
                                <span className="badge bg-rose-100 text-rose-800 font-extrabold text-[10px] border-none">
                                  DECLINED
                                </span>
                              )}
                              <span className="font-semibold text-slate-800">
                                {ast.target_unit} Unit
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                {ast.status === 'accepted'
                                  ? `— ${ast.assigned_staff_name} assigned by ${ast.assigned_by_name}`
                                  : `— Declined by ${ast.declined_by_name} (${ast.decline_reason || 'No reason'})`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {ast.accepted_at ? new Date(ast.accepted_at).toLocaleDateString() : ast.declined_at ? new Date(ast.declined_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dedicated Standalone TEAM ASSIGNMENT & STATUS Slate Card */}
            {user?.role !== 'client' && (
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        TEAM ASSIGNMENT & TASKS
                      </h3>
                      {data.staffDetails && data.staffDetails.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700">
                          {data.staffDetails.filter((s: any) => s.is_done).length} / {data.staffDetails.length} DONE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Assigned staff team working on this project & task responsibilities
                    </span>
                  </div>
                </div>

                {/* Team Assignment Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {request.status === 'staff_processing' && (
                    isAssignedStaff ||
                    isManagerOrAdminUser ||
                    isCollaboratingUnitHead ||
                    isRequestUnitHead ||
                    Boolean(user?.is_unit_head)
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssistanceTargetUnit('');
                        setAssistanceSuggestedStaffId('');
                        setAssistanceTaskDesc('');
                        setAssistanceNotes('');
                        setShowRequestAssistanceModal(true);
                      }}
                      className="btn btn-sm btn-ghost text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-xs font-bold rounded-xl gap-1.5 shadow-xs transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Request Unit Assistance
                    </button>
                  )}

                  {/* EDIT / INVITE / ASSIGN Button */}
                  {(request.status === 'staff_processing') && (
                    user?.role === 'admin' ||
                    user?.role === 'manager' ||
                    user?.is_acting_manager ||
                    (isInterUnitJob && isCollaboratingUnitHead) ||
                    (user?.role === 'staff' && !isUserDone)
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (request.assigned_staff_ids) {
                          setSelectedStaff(request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
                        }
                        if (isInterUnitJob && isCollaboratingUnitHead && user?.unit) {
                          setStaffUnitFilter(user.unit);
                        } else if (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'director' || user?.is_acting_manager) {
                          setStaffUnitFilter('Head');
                        } else {
                          setStaffUnitFilter('All');
                        }
                        setShowManageTeamModal(true);
                      }}
                      className="btn btn-sm btn-ghost text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-extrabold uppercase flex items-center gap-1.5 rounded-xl transition-all border border-blue-100/60 shadow-xs"
                    >
                      {isInterUnitJob && isCollaboratingUnitHead ? (
                        <>
                          <Users className="w-3.5 h-3.5" />
                          {isUserUnitPending
                            ? `ASSIGN ${user?.unit ? user.unit.toUpperCase() : 'UNIT'} STAFF`
                            : `MANAGE ${user?.unit ? user.unit.toUpperCase() : 'UNIT'} STAFF`}
                        </>
                      ) : Boolean(user?.is_unit_head) || user?.role === 'manager' || user?.role === 'admin' ? (
                        <>
                          <Users className="w-3.5 h-3.5" /> MANAGE TEAM
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> INVITE TEAM
                        </>
                      )}
                    </button>
                  )}
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
                        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isSelf
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/15 shadow-sm'
                            : 'bg-slate-50/80 border-slate-200/70 shadow-xs'
                        }`}
                      >
                        {/* Staff Profile & Task */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-inner ${
                              isSelf ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-800 border border-slate-200'
                            }`}
                          >
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              s.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 truncate">{s.name}</span>
                              {isSelf && (
                                <span className="bg-blue-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                                  YOU
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                • {s.unit || 'General'}
                              </span>
                            </div>

                            {/* Task Description */}
                            <div className="text-xs leading-relaxed">
                              {tText ? (
                                <span className={`font-semibold ${isSelf ? 'text-blue-950 font-bold' : 'text-slate-700'}`}>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1.5">Task:</span>
                                  {tText}
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400 italic">
                                  No specific task assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                          {s.is_done ? (
                            <span className="badge bg-emerald-500 text-white font-extrabold text-[10px] uppercase px-3 py-2.5 rounded-xl border-none tracking-wider gap-1 shadow-xs">
                              ✓ DONE
                            </span>
                          ) : (
                            <span className="badge bg-white text-slate-500 font-extrabold text-[10px] uppercase px-3 py-2.5 border border-slate-200/80 tracking-wider">
                              PENDING
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
                      if (['is_inter_unit', 'request_type', 'staff_tasks', 'handoff', 'collaborator_completed_notice', 'is_direct_task', 'custom_fields', 'is_multi_unit', 'target_units', 'target_unit_ids', 'unit_assignments', 'selected_services', 'routing_target', 'assistance_requests'].includes(lower)) return false;
                      // Hide internal Unit Kanban operational workflow states (unit-level tracking)
                      if (lower.includes('kanban')) return false;
                      // Hide duplicate service display label if service_name exists
                      if (lower === 'service_display_label' && request.additional_data?.service_name) return false;
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

            {/* Multi-Unit / Single-Unit Deliverables & Specifications Breakdown */}
            {(() => {
              const servicesList = (Array.isArray(request.additional_data?.selected_services) && request.additional_data.selected_services.length > 0)
                ? request.additional_data.selected_services
                : Object.entries(request.additional_data?.unit_assignments || {}).map(([uName, uMeta]: [string, any]) => ({
                    name: uName,
                    display_label: uMeta?.service_name || uName,
                    target_unit_name: uName,
                    scope: uMeta?.scope || '',
                    fields: uMeta?.custom_fields || {},
                  }));

              if (servicesList.length === 0 && !request.additional_data?.selected_services && !request.additional_data?.unit_assignments) {
                return null;
              }

              const isSingleUnit = servicesList.length === 1;

              return (
                <div className="bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-800 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>
                        Unit Deliverables & Specifications ({servicesList.length} {servicesList.length === 1 ? 'Unit' : 'Units'} Selected)
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                      {isSingleUnit ? 'Single-Unit Request' : 'Multi-Unit Request'}
                    </span>
                  </div>

                  <div className={`grid gap-4 ${isSingleUnit ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {servicesList.map((srv: any, idx: number) => {
                      const targetUnit = srv.target_unit_name || srv.name;
                      const srvLabel = srv.display_label || srv.name;
                      const uMeta = request.additional_data?.unit_assignments?.[`${targetUnit} — ${srvLabel}`]
                        || request.additional_data?.unit_assignments?.[targetUnit]
                        || request.additional_data?.unit_assignments?.[srv.name]
                        || Object.entries(request.additional_data?.unit_assignments || {}).find(([k, m]: [string, any]) => 
                             m?.service_name === srv.name || m?.service_name === srv.display_label || k.includes(srv.name) || k.includes(srv.display_label)
                           )?.[1];
                      const isAccepted = uMeta?.status === 'accepted' || (Array.isArray(uMeta?.assigned_staff_ids) && uMeta.assigned_staff_ids.length > 0);
                      const isRejected = uMeta?.status === 'rejected';
                      const isAwaitingHead = uMeta?.status === 'awaiting_head_assignment';

                      return (
                        <div key={idx} className="bg-white rounded-xl p-5 border border-indigo-100/70 shadow-sm space-y-3.5">
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">{srv.display_label || srv.name}</span>
                                {srv.department_tag && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                    {srv.department_tag}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                                Unit: {srv.target_unit_name || srv.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                              {canEditServiceSpec(srv) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSpecModal(srv, true)}
                                  className="btn btn-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl font-bold flex items-center gap-1 h-7 px-2.5 shadow-xs transition-all"
                                  title="Lihat & Sunting Keperluan Klien (Mod Ketua Unit)"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-600" />
                                  <span>View & Edit Specs</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSpecModal(srv, false)}
                                  className="btn btn-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1 h-7 px-2.5 shadow-xs transition-all"
                                  title="Lihat Spesifikasi Penuh (Modal Window)"
                                >
                                  <Eye className="w-3 h-3 text-slate-600" />
                                  <span>View Full Specs</span>
                                </button>
                              )}

                              <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0 ${
                                isRejected
                                  ? 'bg-rose-100 text-rose-800'
                                  : isAccepted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isAwaitingHead
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isRejected
                                  ? '✖ Ditolak'
                                  : isAccepted
                                  ? '✓ In Progress'
                                  : isAwaitingHead
                                  ? 'Menunggu Ketua Unit'
                                  : 'Menunggu Kelulusan'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Deliverable Scope & Brief
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenSpecModal(srv, canEditServiceSpec(srv))}
                                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Buka Penuh</span>
                              </button>
                            </div>
                            <p 
                              onClick={() => handleOpenSpecModal(srv, canEditServiceSpec(srv))}
                              className="text-xs font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50/30 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer leading-relaxed whitespace-pre-wrap"
                              title="Klik untuk lihat paparan penuh"
                            >
                              {srv.scope || 'No specific deliverable brief specified.'}
                            </p>
                          </div>

                          {srv.fields && Object.keys(srv.fields).length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Unit Specifications ({Object.keys(srv.fields).length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSpecModal(srv, canEditServiceSpec(srv))}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Lihat Penuh</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <div className={`grid gap-2 ${isSingleUnit ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2'}`}>
                                {Object.entries(srv.fields).map(([fk, fv]: [string, any]) => (
                                  <div 
                                    key={fk} 
                                    onClick={() => handleOpenSpecModal(srv, canEditServiceSpec(srv))}
                                    className="bg-slate-50/80 hover:bg-indigo-50/50 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer min-w-0 group"
                                    title="Klik untuk membuka tetingkap spesifikasi penuh"
                                  >
                                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase block truncate">
                                      {fk.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">
                                      {String(fv)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Head of Unit Guidance Notes for Staff (if present) */}
                          {(srv.head_guidance_notes || uMeta?.head_guidance_notes) && (
                            <div 
                              onClick={() => handleOpenSpecModal(srv, canEditServiceSpec(srv))}
                              className="p-3 bg-amber-50/80 hover:bg-amber-50 border border-amber-200 rounded-xl space-y-1 cursor-pointer transition-all"
                              title="Klik untuk kemaskini atau lihat arahan"
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Arahan Khas Ketua Unit untuk Staf</span>
                              </div>
                              <p className="text-xs font-semibold text-amber-950 leading-relaxed whitespace-pre-wrap">
                                {srv.head_guidance_notes || uMeta?.head_guidance_notes}
                              </p>
                            </div>
                          )}

                          {uMeta?.assigned_staff_names && uMeta.assigned_staff_names.length > 0 ? (
                            <div className="pt-1 flex items-center gap-1.5 text-xs text-indigo-700 font-bold bg-indigo-50/50 px-3 py-2 rounded-xl">
                              <User className="w-3.5 h-3.5" />
                              <span>Assigned Specialist: {uMeta.assigned_staff_names.join(', ')}</span>
                            </div>
                          ) : isAccepted ? null : (
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold italic bg-slate-50 px-3 py-1.5 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>{isAwaitingHead ? 'Menunggu Ketua Unit melantik staf' : 'Menunggu kelulusan Pengurus'}</span>
                            </div>
                          )}

                          {/* Unit Milestone Target Timeline */}
                          {(() => {
                            const compoundKey = `${srv.target_unit_name || srv.name} — ${srv.display_label || srv.name}`;
                            const targetUnitTrackKey = (request?.additional_data?.unit_assignments?.[compoundKey] ? compoundKey : null)
                              || (request?.additional_data?.unit_assignments?.[srv.display_label || srv.name] ? (srv.display_label || srv.name) : null)
                              || (request?.additional_data?.unit_assignments?.[srv.target_unit_name || srv.name] ? (srv.target_unit_name || srv.name) : null)
                              || compoundKey;
                            const serviceLabel = srv.display_label || srv.name;
                            const unitName = srv.target_unit_name || srv.name;
                            const unitDeadline = uMeta?.deadline || srv.deadline;
                            const unitStartDate = uMeta?.start_date || srv.start_date;
                            const unitMilestoneNote = uMeta?.milestone_note;

                            const canEditThisUnitMilestone = Boolean(
                              user?.role === 'admin' ||
                              user?.role === 'director' ||
                              (isManagerActor && (
                                (userDeptId && Number(uMeta?.department_id) === Number(userDeptId)) ||
                                managedUnits.some((mu) => mu.toLowerCase().trim() === unitName.toLowerCase().trim())
                              )) ||
                              (user?.is_unit_head && (
                                (userUnit && userUnit === unitName.toLowerCase().trim()) ||
                                managedUnits.some((mu) => mu.toLowerCase().trim() === unitName.toLowerCase().trim())
                              ))
                            );

                            return (
                              <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5 sm:mt-0">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Unit Milestone Target:
                                      </span>
                                      {unitDeadline && unitDeadline !== request.deadline ? (
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                                          Internal Target
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-slate-400">
                                          (Matches Master)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      <span className={unitDeadline && unitDeadline <= (request.deadline || '') ? 'text-indigo-900' : 'text-slate-800'}>
                                        {unitDeadline ? formatDate(unitDeadline) : (request.deadline ? formatDate(request.deadline) : 'Not scheduled')}
                                      </span>
                                      {unitStartDate && (
                                        <span className="text-[10px] font-medium text-slate-400">
                                          • Starts: {formatDate(unitStartDate)}
                                        </span>
                                      )}
                                    </div>
                                    {unitMilestoneNote && (
                                      <p className="text-[10px] font-medium text-indigo-900/80 italic mt-0.5">
                                        "{unitMilestoneNote}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {canEditThisUnitMilestone && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUnitMilestoneModal(targetUnitTrackKey, serviceLabel, unitStartDate, unitDeadline, unitMilestoneNote)}
                                    className="btn btn-ghost btn-xs text-indigo-600 hover:bg-indigo-100/70 font-black text-[10px] uppercase gap-1 px-2.5 py-1 h-7 rounded-lg border border-indigo-200/80 shadow-2xs shrink-0 self-end sm:self-center"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{unitDeadline ? 'Edit Milestone' : 'Set Milestone'}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
          {/* Workflow Actions Card (Hidden for Client, Director (unless inter-unit or completed), Rejected requests, and regular staff when completed) */}
          {user?.role !== 'client' &&
            (user?.role !== 'director' || (isInterUnitJob && request.status === 'staff_processing') || request.status === 'completed') &&
            request.status !== 'rejected' &&
            !(user?.role === 'staff' && !user?.is_unit_head && (
              (data?.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) &&
               (!isInterUnitJob || Number(request.additional_data?.handoff?.current_holder_id) !== Number(user?.id))) ||
              request.status === 'completed'
            )) && (
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
             !(request.status === 'manager_approval' && !canActOnManagerApproval && !isAssignedStaffInActiveMultiUnit) &&
             request.status !== 'completed' && (
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                  JOB STATUS SUBMISSION
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            )}

            {/* Notice for requests awaiting Review/Approval when user does not have direct action responsibility */}
            {request.status === 'manager_approval' && !canActOnManagerApproval && !hasMyUnitCompletedAssignment && (
              <div className={`p-4 rounded-2xl text-center space-y-1.5 my-2 border ${
                isAssignedStaffInActiveMultiUnit
                  ? 'bg-blue-50/90 border-blue-200/90'
                  : hasMyDeptApproved
                  ? 'bg-emerald-50/70 border-emerald-200/80'
                  : isUnitHeadWaitingManager
                  ? 'bg-amber-50/80 border-amber-200/90'
                  : isDirectToHeadUnit
                  ? 'bg-teal-50/70 border-teal-200/80'
                  : 'bg-slate-50 border-slate-200/80'
              }`}>
                {isAssignedStaffInActiveMultiUnit ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Your Work Is Active ({myAssignedMultiUnit ? myAssignedMultiUnit[0] : 'Assigned Unit'})
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Approved & Assigned by Head of Unit
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Your unit's work portion is active. You can begin drafting and finalize your part whenever ready, even while secondary manager approval for other units is pending.
                    </div>
                  </>
                ) : hasMyDeptApproved ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Approved by You (Manager)
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Handed Over to Head of Unit {approvedHeadNames.length > 0 ? `(${approvedHeadNames.join(', ')})` : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      You have approved this request. It has been handed over to the Head of Unit to assign staff team members.
                      {otherPendingManagers.length > 0 && (
                        <div className="mt-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-lg p-1.5">
                          ⏳ Waiting for secondary manager approval from: {otherPendingManagers.join(', ')}
                        </div>
                      )}
                    </div>
                  </>
                ) : isUnitHeadWaitingManager ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Awaiting Manager Approval
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Under Department Manager Review
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      This request is currently under review by the Department Manager. Once approved, you will be able to assign your unit's staff team.
                    </div>
                  </>
                ) : isDirectToHeadUnit ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      Direct to Unit Head
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Awaiting Unit Head Review & Assignment{targetHeadDisplayName ? ` (${targetHeadDisplayName})` : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      This request has been routed directly to the Unit Head for review and staff assignment without requiring Manager approval.
                    </div>
                  </>
                ) : isInterUnitJob ? (
                  <>
                    <div className="text-xs font-bold text-slate-700">
                      {multiTargetUnits.length > 1
                        ? `Awaiting Target Unit Heads (${multiTargetUnits.join(', ')}) Review`
                        : `Awaiting Head Unit${(targetUnitHead?.name || request.additional_data?.target_unit_head_name) ? ` (${targetUnitHead?.name || request.additional_data?.target_unit_head_name})` : ''} Approval`}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {isCurrentUserOriginStaff
                        ? `Target unit acceptance is pending — but you can start and finalize your own work portion independently.`
                        : `Inter-Unit collaboration requests are reviewed and accepted by the designated Unit Head(s).`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-slate-700">Awaiting Manager Approval</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Online client job requests are reviewed and approved exclusively by Department Managers.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Origin Staff Work Panel — shown during manager_approval for the inter-unit origin staff */}
            {isInterUnitJob &&
              request.status === 'manager_approval' &&
              isCurrentUserOriginStaff && (
                <div className="space-y-2 my-2">
                  {isUserDone ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Your Part Finalized</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                        You have completed your work portion. The target unit is still pending acceptance from their head.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                        <span className="text-xs font-black text-blue-800 uppercase tracking-wider">Your Work Is Active</span>
                      </div>
                      <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        Your own work portion can begin now — you don't need to wait for the target unit head to accept. Finalize your part whenever you're ready.
                      </p>
                      <button
                        onClick={() => setShowMarkDoneModal(true)}
                        disabled={actionLoading}
                        className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-emerald-500/20 uppercase tracking-wider gap-2 flex items-center justify-center transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Finalize My Part
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* Action Buttons & Oversight based on Role & Status */}
            {(canAct || user?.role === 'director' || user?.is_unit_head || hasUnitNeedingManagerApproval || isAssignedStaffInActiveMultiUnit || hasMyUnitCompletedAssignment) && (
              <div className="space-y-2">
                {(request.status === 'manager_approval' || hasUnitNeedingManagerApproval) && canActOnManagerApproval && (
                  <>
                    <button
                      onClick={handleOpenApproveModal}
                      disabled={actionLoading}
                      className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl h-12 border-none shadow-lg shadow-emerald-500/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" /> {isInterUnitJob ? 'ACCEPT & ASSIGN TEAM' : isUnitHeadActor ? 'ASSIGN STAFF TEAM' : 'APPROVE REQUEST'}
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

                {/* Unit Head assigned team status card & manage button */}
                {isUnitHeadActor && hasMyUnitCompletedAssignment && (request.status === 'manager_approval' || request.status === 'staff_processing') && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-2.5 shadow-xs mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                          {myUnitName ? `${myUnitName.toUpperCase()} TEAM ASSIGNED` : 'TEAM ASSIGNED'}
                        </span>
                      </div>
                      <span className="badge badge-sm bg-emerald-100 text-emerald-800 font-bold border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                      Staff team for {myUnitName || 'your unit'} has been assigned and is ready to work.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (request.assigned_staff_ids) {
                          setSelectedStaff(request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
                        }
                        if (myUnitName) {
                          setStaffUnitFilter(myUnitName);
                        } else if (user?.unit) {
                          setStaffUnitFilter(user.unit);
                        }
                        setShowManageTeamModal(true);
                      }}
                      className="btn w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl h-10 uppercase tracking-wider gap-2 flex items-center justify-center transition-all shadow-xs"
                    >
                      <Users className="w-4 h-4 text-emerald-600" /> MANAGE {myUnitName ? myUnitName.toUpperCase() : 'UNIT'} TEAM
                    </button>
                  </div>
                )}

                {(request.status === 'staff_processing' || isAssignedStaffInActiveMultiUnit) && (
                  <>
                    {/* Pending Cross-Unit Assistance Review Action */}
                    {(() => {
                      const astList: any[] = Array.isArray(request?.additional_data?.assistance_requests)
                        ? request.additional_data.assistance_requests
                        : [];
                      const myPendingAst = astList.find((a: any) => a.status === 'pending' && canUserRespondToAst(a));
                      if (!myPendingAst) return null;
                      return (
                        <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 space-y-3 mb-3 shadow-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                            <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                              Assistance Request Pending
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
                            {myPendingAst.requester_name} ({getAstRequesterBadge(myPendingAst)}) requested support from <strong>{myPendingAst.target_unit}</strong>.
                            {myPendingAst.suggested_staff_name && (
                              <span className="block mt-1 font-semibold text-indigo-900">
                                Suggested: {myPendingAst.suggested_staff_name}
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenRespondModal(myPendingAst)}
                            disabled={actionLoading}
                            className="btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-indigo-600/20 uppercase tracking-wider gap-2 flex items-center justify-center transition-all"
                          >
                            <UserPlus className="w-4 h-4" /> Review & Assign Staff
                          </button>
                        </div>
                      );
                    })()}

                    {/* Inter-Unit Collaborating Unit Head Action (Assign staff if pending, or manage team) */}
                    {isInterUnitJob && isCollaboratingUnitHead && (
                      <div className="space-y-2 mb-3">
                        {isUserUnitPending ? (
                          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3 shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                                {user?.unit ? `${user.unit.toUpperCase()} UNIT ASSIGNMENT PENDING` : 'UNIT ASSIGNMENT PENDING'}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                              This inter-unit collaboration has been activated. Please assign your {user?.unit || ''} staff to participate in this project.
                            </p>
                            <button
                              onClick={handleOpenApproveModal}
                              disabled={actionLoading}
                              className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-emerald-600/20 uppercase tracking-wider gap-2 flex items-center justify-center transition-all"
                            >
                              <UserPlus className="w-4 h-4" /> ASSIGN {user?.unit ? user.unit.toUpperCase() : 'UNIT'} STAFF
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (request.assigned_staff_ids) {
                                setSelectedStaff(request.assigned_staff_ids.split(',').map((s: string) => parseInt(s)));
                              }
                              if (user?.unit) {
                                setStaffUnitFilter(user.unit);
                              }
                              setShowManageTeamModal(true);
                            }}
                            className="btn w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-2xl h-11 uppercase tracking-wider gap-2 flex items-center justify-center transition-all shadow-xs"
                          >
                            <Users className="w-4 h-4 text-blue-600" /> MANAGE {user?.unit ? user.unit.toUpperCase() : 'UNIT'} TEAM
                          </button>
                        )}
                      </div>
                    )}

                    {(Boolean(
                      (request?.assigned_staff_ids && request.assigned_staff_ids.split(',').map((s: string) => Number(s.trim())).includes(Number(user?.id))) ||
                      (data?.staffDetails && data.staffDetails.some((s: any) => Number(s.id) === Number(user?.id))) ||
                      (selectedStaff && selectedStaff.map(Number).includes(Number(user?.id))) ||
                      (request?.additional_data?.origin_staff_id && Number(request.additional_data.origin_staff_id) === Number(user?.id)) ||
                      (request?.additional_data?.handoff?.current_holder_id && Number(request.additional_data.handoff.current_holder_id) === Number(user?.id))
                    )) && (
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
                          const isCurrentUserDone = finishedCollaborators.some((s: any) => Number(s.id) === Number(user?.id));

                          // If the designated holder has already completed their part,
                          // the active turn naturally passes to the pending collaborator(s)
                          if (isHolderFinished && pendingCollaborators.length > 0) {
                            holderId = Number(pendingCollaborators[0].id);
                            holderName = pendingCollaborators[0].name;
                            holderUnit = pendingCollaborators[0].unit || '';
                          }

                          // Collaborator finalized notification is only relevant for pending collaborators waiting to finalize
                          const collaboratorCompletedNotice = finishedCollaborators.length > 0 && !isCurrentUserDone;

                          // Active turn is only held if user has NOT finished their part yet
                          const isUserTurn = !isCurrentUserDone && (!holderId || Number(user?.id) === holderId);

                          // Extract latest collab message (from handoff state or history logs fallback)
                          let latestCollabNote = handoff?.last_note || '';
                          let latestCollabActor = handoff?.last_actor_name || '';
                          let latestCollabDraftUrl = handoff?.last_draft_url || '';

                          if (!latestCollabNote && history && history.length > 0) {
                            const lastCollabEntry = history.find(
                              (h: any) => h.action === 'COLLAB_HANDOFF' || h.action === 'COLLAB_REVISION_REQUEST'
                            );
                            if (lastCollabEntry && lastCollabEntry.comment) {
                              const noteMatch = lastCollabEntry.comment.match(/Note:\s*"([^"]+)"/i);
                              if (noteMatch && noteMatch[1]) {
                                latestCollabNote = noteMatch[1];
                                latestCollabActor = lastCollabEntry.actor_name || '';
                              }
                            }
                          }

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
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                      Shared Active
                                    </span>
                                  )}
                                </div>

                                {/* Active Turn Sub-Banner */}
                                {holderId && Number(user?.id) === holderId ? (
                                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5 shadow-xs">
                                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                      <div>
                                        <div className="text-xs font-black text-emerald-950">Active Action Required</div>
                                        <div className="text-[11px] font-medium text-emerald-800 leading-snug">
                                          {collaboratorCompletedNotice
                                            ? 'Collaborator has finalized their part. Ready to finalize.'
                                            : handoff?.last_action === 'REVISION_REQUESTED'
                                            ? 'Revision requested — please review changes and update.'
                                            : 'You hold the turn — prepare drafts and hand over when ready.'}
                                        </div>
                                      </div>

                                      {/* Standardized Handoff Note (Border-Left Accent Design) */}
                                      {latestCollabNote && (
                                        <div className="mt-2 border-l-2 border-emerald-500 pl-3 py-1 bg-white/70 rounded-r-xl text-xs space-y-0.5 shadow-2xs">
                                          <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">
                                            Latest Handoff Note from {latestCollabActor || 'Collaborator'}:
                                          </span>
                                          <p className="italic font-semibold text-xs text-emerald-950 leading-snug">
                                            "{latestCollabNote}"
                                          </p>
                                          {latestCollabDraftUrl && (
                                            <div className="pt-0.5">
                                              <a
                                                href={latestCollabDraftUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                                              >
                                                <ExternalLink className="w-3 h-3" /> View Shared Draft
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : holderId ? (
                                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-slate-800">Collaborator Active on Task</div>
                                      <div className="text-[11px] font-medium text-slate-500 leading-snug">
                                        Currently with <strong className="text-slate-700">{holderName}</strong> ({holderUnit})
                                      </div>
                                      {latestCollabNote && (
                                        <div className="mt-2 border-l-2 border-indigo-400 pl-3 py-1 bg-white/70 rounded-r-xl text-xs space-y-0.5 shadow-2xs">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Latest Handoff Note from {latestCollabActor || 'Sender'}:
                                          </span>
                                          <p className="italic font-medium text-slate-800 leading-snug">
                                            "{latestCollabNote}"
                                          </p>
                                          {latestCollabDraftUrl && (
                                            <div className="pt-0.5">
                                              <a
                                                href={latestCollabDraftUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                              >
                                                <ExternalLink className="w-3 h-3" /> View Shared Draft
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Collaborator Finalized Notification Banner */}
                              {collaboratorCompletedNotice && (
                                <div className="p-3 bg-white border border-emerald-200 rounded-2xl space-y-1">
                                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Collaborator Finalized</span>
                                  </div>
                                  <div className="text-slate-600 text-xs leading-relaxed font-medium">
                                    {finishedCollaborators.map((s: any) => s.name).join(', ')} has marked their portion as complete.
                                  </div>
                                </div>
                              )}

                              {/* Standalone Latest Note / Draft Link (only when there is no assigned turn holder box) */}
                              {latestCollabNote && !holderId && (
                                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-indigo-500" />
                                      Latest Handoff Note from {latestCollabActor} ({handoff?.last_actor_unit || 'Unit'})
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-800 font-medium italic leading-relaxed pl-2.5 border-l-2 border-indigo-500">
                                    "{latestCollabNote}"
                                  </p>
                                  {latestCollabDraftUrl && (
                                    <div className="pt-1">
                                      <a
                                        href={latestCollabDraftUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" /> View Shared Draft
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Collaborative Action Buttons - Clean, spacious & designer-ready */}
                              {isUserTurn ? (
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
                              ) : !isCurrentUserDone ? (
                                /* Parallel work completion: Allow collaborator to finalize their part even if someone else holds the primary drafting turn */
                                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowMarkDoneModal(true)}
                                    disabled={actionLoading}
                                    className="w-full bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200/90 font-bold text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
                                    title="Already finished your portion? Finalize directly without waiting for others."
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Completed Your Part? Finalize Now</span>
                                  </button>
                                </div>
                              ) : null}
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

                    {(user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager || user?.is_unit_head || user?.role === 'director') && (
                      isInterUnitJob ? (
                        /* Inter-Unit Collaboration Oversight Card for Managers, Unit Heads & Director */
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
                                  <span>Current Turn Holder</span>
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
                                      <span className="text-emerald-600 font-bold">Active on Task</span>
                                    </div>
                                  </div>
                                </div>

                                {handoff?.last_note && (
                                  <div className="border-l-2 border-indigo-400 pl-3 py-1 bg-white/70 rounded-r-xl text-xs text-slate-700 space-y-0.5 shadow-2xs">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Latest Handoff Note from {handoff.last_actor_name || 'Collaborator'}:
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
                                      <ExternalLink className="w-3.5 h-3.5" /> View Shared Draft Link
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Team Status Flow */}
                              <div className="space-y-2">
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-0.5">
                                  Project Team Status
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
                                                : 'bg-blue-400'
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
                                              : 'bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold'
                                          }`}
                                        >
                                          {isDone ? '✓ Completed' : isHolder ? '⚡ Active' : 'Active'}
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
                                  Project will automatically be marked as completed once all collaborators click <b>Finalize My Part</b>.
                                </span>
                              </div>

                              {/* Clean Project Controls (Pending / Cancel) - Exclusively for Managers & Admins */}
                              {isManagerUser && (
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Project Controls
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
                                      <XCircle className="w-3 h-3 text-rose-500" /> Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        /* Standard non-inter-unit Manager Controls */
                        (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && !hasUnitNeedingManagerApproval && (
                          <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-100">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                              {isMultiUnitJob
                                ? (user?.role === 'admin' || user?.role === 'director' ? 'ADMIN MASTER CONTROLS' : 'PROJECT STATUS CONTROLS')
                                : 'MANAGER STATUS CONTROLS'}
                            </div>

                            {/* Informational Banner for Multi-Unit Collaborations */}
                            {isMultiUnitJob && (
                              <div className="flex items-start gap-2 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span>
                                  Projek Multi-Unit diselesaikan secara automatik setelah semua staf unit menyelesaikan tugasan masing-masing ({completedStaff}/{totalStaff} staf selesai).
                                </span>
                              </div>
                            )}

                            {/* Single-Unit: Standard MARK PROJECT COMPLETED button */}
                            {!isMultiUnitJob && (
                              <button
                                type="button"
                                onClick={() => handleComplete()}
                                disabled={actionLoading}
                                className="btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-indigo-500/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                              >
                                <ShieldCheck className="w-4 h-4" /> MARK PROJECT COMPLETED
                              </button>
                            )}

                            {/* Multi-Unit: Strictly Admin / Director can Force Complete */}
                            {isMultiUnitJob && (user?.role === 'admin' || user?.role === 'director') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setForceCompleteComment('');
                                  setShowForceCompleteModal(true);
                                }}
                                disabled={actionLoading}
                                className="btn w-full bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-rose-600/20 uppercase tracking-wider gap-2 flex items-center justify-center"
                              >
                                <ShieldCheck className="w-4 h-4" /> FORCE COMPLETE (ADMIN OVERRIDE)
                              </button>
                            )}

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

                      {(!isMultiUnitJob || user?.role === 'admin' || user?.role === 'director') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isMultiUnitJob) {
                              setForceCompleteComment('');
                              setShowForceCompleteModal(true);
                            } else {
                              handleComplete();
                            }
                          }}
                          disabled={actionLoading}
                          className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-emerald-500/20 gap-2 normal-case tracking-wide"
                        >
                          <CheckCircle2 className="w-4 h-4" /> {isMultiUnitJob ? 'Force Complete (Admin Override)' : 'Mark Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Status controls when Project is Completed */}
                {request.status === 'completed' && (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager || user?.role === 'director') && (
                  <div className="p-6 rounded-3xl border border-emerald-200/80 bg-emerald-50/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Status: Completed
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600">
                          Projek Selesai Sepenuhnya
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-emerald-100">
                      Projek ini telah ditandakan selesai. Semua tugasan dan laporan telah dimuktamadkan.
                    </p>

                    {/* Admin / Director Reopen Option */}
                    {(user?.role === 'admin' || user?.role === 'director') && (
                      <div className="pt-2 border-t border-emerald-200/70 space-y-2">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          ADMIN OVERRIDE CONTROLS
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusReason('');
                            setShowStatusModal('staff_processing');
                          }}
                          disabled={actionLoading}
                          className="btn w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl h-11 border-none shadow-md shadow-slate-900/20 gap-2 normal-case tracking-wide flex items-center justify-center"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-400" /> Buka Semula Projek (Reopen)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Note / Report Section (Staff Page Only — also shown to Inter-Unit origin staff) */}
            {(user?.role === 'staff' && !user?.is_acting_manager || isCurrentUserOriginStaff) && (
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
          {(user?.role === 'staff' && !user?.is_acting_manager || isCurrentUserOriginStaff) &&
            data?.staffDetails?.some((s: any) => Number(s.id) === Number(user?.id) && s.is_done) &&
            (request.status === 'completed' || !isInterUnitJob || Number(request.additional_data?.handoff?.current_holder_id) !== Number(user?.id)) && (
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

              {canEditTimeline &&
                request.status !== 'completed' &&
                request.status !== 'rejected' ? (
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
                ) : isInterUnitJob && (user?.role === 'manager' || user?.is_acting_manager) ? (
                  <span className="text-[10px] text-slate-400 font-semibold italic bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                    Managed by {request.origin_department_name || request.additional_data?.requester_unit || 'Origin Unit'} Manager
                  </span>
                ) : null}
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
                {isInterUnitJob
                  ? 'Accept & Assign Staff'
                  : isManagerActor
                  ? 'Approve This Request?'
                  : `Assign Staff Team — ${myUnitName || 'Unit'}`}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {isInterUnitJob
                  ? 'Accept this request from another unit and assign tasks to your team members.'
                  : isManagerActor
                  ? 'Set the project start date and deadline. The request will be approved and forwarded to the Unit Head for staff assignment.'
                  : `Assign specialist staff from ${myUnitName || 'your unit'} to carry out this project's tasks.`}
              </p>
            </div>

            {/* Assign to Staff Member Container (Shown only for Unit Heads & Inter-Unit) */}
            {!isManagerActor && (
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Assign to Staff Member <span className="text-rose-500 font-bold">*</span>
                </label>

                {/* Unit Filter Tabs - Wrapped and directly visible */}
                {(availableModalUnits.length > 1 || accessibleTeamMembers.some((m) => Boolean(m.is_unit_head))) && !myUnitName && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
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
                      const lockedToService = staffAssignedToOtherTracks[m.id];
                      const isLocked = Boolean(lockedToService);

                      return (
                        <label
                          key={m.id}
                          onClick={() => {
                            if (isLocked) return;
                            if (isChecked) setSelectedStaff(selectedStaff.filter((sid) => sid !== m.id));
                            else setSelectedStaff([...selectedStaff, m.id]);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                            isLocked
                              ? 'opacity-60 bg-slate-50 cursor-not-allowed border border-slate-200'
                              : 'hover:bg-blue-50/50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isLocked
                                  ? 'border-slate-300 bg-slate-100 text-slate-400'
                                  : isChecked
                                  ? 'border-blue-600 bg-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <div className={`w-2.5 h-2.5 rounded-full ${isLocked ? 'bg-slate-400' : 'bg-blue-600'}`}></div>}
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{m.name}</span>
                                {Boolean(m.is_unit_head) && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.2 rounded border border-amber-200">
                                    HEAD
                                  </span>
                                )}
                                {isLocked && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    🔒 Dikhaskan untuk {lockedToService}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.unit ? `${m.unit} Unit` : 'General Unit'}</div>
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
            )}

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
                  min={startDate && startDate > new Date().toISOString().split('T')[0] ? startDate : new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full bg-white border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none ${
                    (startDate && deadline && deadline < startDate) || (deadline && deadline < new Date().toISOString().split('T')[0])
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
                disabled={actionLoading || (!isManagerActor && selectedStaff.length === 0) || Boolean(startDate && deadline && deadline < startDate)}
                className="btn bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-12 uppercase tracking-wider shadow-lg shadow-emerald-500/25"
              >
                {actionLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : isManagerActor ? (
                  'CONFIRM & APPROVE'
                ) : isInterUnitJob ? (
                  'CONFIRM ACCEPT & ASSIGN'
                ) : (
                  'CONFIRM & ASSIGN TEAM'
                )}
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
                {isInterUnitJob && isCollaboratingUnitHead
                  ? `Manage ${user?.unit || ''} Team Assignment`
                  : (user?.role === 'staff' && !user?.is_acting_manager && !Boolean(user?.is_unit_head && user.is_unit_head !== 0 && (user.is_unit_head as any) !== '0')
                    ? 'Invite Team Members'
                    : 'Manage Team Assignment')}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isInterUnitJob && isCollaboratingUnitHead
                  ? `Assign or update staff from ${user?.unit || 'your unit'} for this project.`
                  : (user?.role === 'staff' && !user?.is_acting_manager && !Boolean(user?.is_unit_head && user.is_unit_head !== 0 && (user.is_unit_head as any) !== '0')
                    ? 'Invite staff members and specify tasks for this project.'
                    : 'Add or remove staff assigned to this project and set tasks.')}
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
                  const lockedToService = staffAssignedToOtherTracks[m.id];
                  const isLockedToOtherService = Boolean(lockedToService);
                  // For regular staff, lock staff who are already in the team from being removed. Unit Heads can manage team.
                  const isUnitHeadUser = Boolean(user?.is_unit_head && user.is_unit_head !== 0 && (user.is_unit_head as any) !== '0');
                  const isRegularStaff = Boolean(user?.role === 'staff' && !user?.is_acting_manager && !isUnitHeadUser);
                  const isLocked = isRegularStaff
                    ? (isSelfStaff || isAlreadyDone || isAlreadyAssigned || isLockedToOtherService)
                    : (isAlreadyDone || isLockedToOtherService);

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
                              {isLockedToOtherService && (
                                <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  🔒 Dikhaskan untuk {lockedToService}
                                </span>
                              )}
                            </span>
                            {m.unit && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                                {m.unit}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.unit ? `${m.unit} Unit` : 'General Unit'}</div>
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
                ) : user?.role === 'staff' && !user?.is_acting_manager && !Boolean(user?.is_unit_head && user.is_unit_head !== 0 && (user.is_unit_head as any) !== '0') ? (
                  'Invite Team'
                ) : (
                  'Save Team Assignment'
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

      {/* CUSTOM LIGHTBOX MODAL FOR PENDING / CANCEL / REOPEN STATUS CHANGE */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden my-auto">
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${
              showStatusModal === 'on_hold'
                ? 'bg-amber-500'
                : showStatusModal === 'cancelled'
                ? 'bg-rose-600'
                : 'bg-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  {showStatusModal === 'on_hold' ? (
                    <Clock className="w-5 h-5" />
                  ) : showStatusModal === 'cancelled' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {showStatusModal === 'on_hold'
                      ? 'Set Project to Pending / On Hold'
                      : showStatusModal === 'cancelled'
                      ? 'Cancel Project'
                      : 'Buka Semula Projek (Reopen)'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    {showStatusModal === 'staff_processing' ? 'Admin Override Workflow' : 'Manager Workflow Verification'}
                  </p>
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
              {/* Multi-Unit Impact Warning */}
              {isMultiUnitJob && (
                <div className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
                  showStatusModal === 'on_hold'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : showStatusModal === 'cancelled'
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                }`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    showStatusModal === 'on_hold'
                      ? 'text-amber-600'
                      : showStatusModal === 'cancelled'
                      ? 'text-rose-600'
                      : 'text-indigo-600'
                  }`} />
                  <div>
                    <span className="font-bold">Amaran Projek Multi-Unit:</span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">
                      {showStatusModal === 'staff_processing'
                        ? `Membuka semula projek ini akan mengembalikan status kepada Staff Processing bagi SEMUA unit (${multiTargetUnits.join(', ')}).`
                        : `Projek ini melibatkan unit (${multiTargetUnits.join(', ')}). Tindakan ini akan menangguhkan/membatalkan kerja bagi SEMUA unit yang sedang bertugas.`}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {showStatusModal === 'on_hold'
                  ? 'Sila nyatakan sebab meletakkan projek ini dalam status Pending / On Hold:'
                  : showStatusModal === 'cancelled'
                  ? 'Sila nyatakan sebab membatalkan projek ini:'
                  : 'Sila nyatakan sebab membuka semula projek ini (cth: arahan pindaan kerja klien / tersilap klik selesai):'}
              </p>

              <textarea
                rows={3}
                placeholder={
                  showStatusModal === 'on_hold'
                    ? 'Contoh: Menunggu maklum balas tambahan daripada klien...'
                    : showStatusModal === 'cancelled'
                    ? 'Contoh: Dibatalkan atas permintaan pelanggan...'
                    : 'Contoh: Pindaan tambahan diperlukan oleh pihak pengurusan...'
                }
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
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = showStatusModal;
                    const reason = statusReason.trim();
                    if (!reason && target === 'staff_processing') {
                      alert('Sila nyatakan sebab membuka semula projek.');
                      return;
                    }
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
                    showStatusModal === 'on_hold'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : showStatusModal === 'cancelled'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                  }`}
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      {showStatusModal === 'on_hold' ? (
                        <Clock className="w-4 h-4" />
                      ) : showStatusModal === 'cancelled' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      <span>
                        {showStatusModal === 'on_hold'
                          ? 'Confirm Pending / On Hold'
                          : showStatusModal === 'cancelled'
                          ? 'Cancel Project'
                          : 'Sahkan Buka Semula'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM LIGHTBOX MODAL FOR FORCE COMPLETE (ADMIN OVERRIDE) */}
      {showForceCompleteModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 text-white flex items-center justify-between bg-rose-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    Admin Override: Force Complete
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">Multi-Unit Master Control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForceCompleteModal(false)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Warning Banner */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-black text-amber-950 uppercase tracking-wide">
                    Amaran Penutupan Paksa (Force Complete)
                  </div>
                  <p className="leading-relaxed">
                    Tindakan ini akan memintas proses biasa dan menandakan keseluruhan projek serta SEMUA unit ({multiTargetUnits.join(', ')}) sebagai SELESAI serta-merta.
                  </p>
                  <div className="pt-1.5 flex items-center gap-3 font-bold text-[11px] text-amber-800">
                    <span>Staf Selesai: {completedStaff} / {totalStaff}</span>
                    <span>•</span>
                    <span>Tugasan Selesai: {completedTasksCount} / {totalTasksCount}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sebab / Catatan Admin Override (Wajib):
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Arahan pihak pengurusan / telah disahkan selesai di luar sistem..."
                  value={forceCompleteComment}
                  onChange={(e) => setForceCompleteComment(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-600 focus:outline-none transition-all resize-none shadow-inner"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForceCompleteModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!forceCompleteComment.trim()) {
                      alert('Sila masukkan sebab atau catatan admin override.');
                      return;
                    }
                    handleComplete(forceCompleteComment.trim());
                  }}
                  disabled={actionLoading}
                  className="btn bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md shadow-rose-700/20 gap-2"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sahkan Selesai (Force Complete)</span>
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
                  min={startDate && startDate > new Date().toISOString().split('T')[0] ? startDate : new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full bg-white border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none ${
                    (startDate && deadline && deadline < startDate) || (deadline && deadline < new Date().toISOString().split('T')[0])
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

      {/* UNIT DELIVERABLE MILESTONE MODAL */}
      {showUnitMilestoneModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Unit Deliverable Milestone</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Set Timeline for {milestoneServiceLabel || milestoneUnitName}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Set internal start and target completion dates for this service's deliverables.
                {request?.deadline && (
                  <span className="block mt-1 text-slate-700 font-bold">
                    Master Project Deadline: {formatDate(request.deadline)}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                    Unit Start Date
                  </label>
                  <input
                    type="date"
                    value={milestoneStartDate}
                    onChange={(e) => setMilestoneStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl h-11 px-3 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                    Target Deadline <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={milestoneDeadline}
                    min={milestoneStartDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setMilestoneDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl h-11 px-3 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {milestoneStartDate && milestoneDeadline && milestoneDeadline < milestoneStartDate && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Target deadline cannot be earlier than start date.</span>
                </div>
              )}

              {request?.deadline && milestoneDeadline && milestoneDeadline > request.deadline && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Note: This target deadline is later than the Master Client Deadline ({formatDate(request.deadline)}).</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Milestone Deliverable Goal / Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Finalize visual creative draft for Social Media handoff..."
                  value={milestoneNote}
                  onChange={(e) => setMilestoneNote(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUnitMilestoneModal(false)}
                className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUnitMilestone}
                disabled={milestoneSaving || !milestoneDeadline || Boolean(milestoneStartDate && milestoneDeadline && milestoneDeadline < milestoneStartDate)}
                className="btn bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 border-none text-white font-extrabold text-xs rounded-2xl px-6 h-11 uppercase tracking-wider shadow-lg shadow-indigo-600/25"
              >
                {milestoneSaving ? <span className="loading loading-spinner"></span> : 'Save Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIT DELIVERABLES & SPECIFICATIONS MODAL (VIEW & EDIT) */}
      {showSpecModal && activeSpecService && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 md:p-8 space-y-6 relative overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Keperluan Klien & Spesifikasi Unit</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{activeSpecService.display_label || activeSpecService.name}</span>
                  {activeSpecService.department_tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {activeSpecService.department_tag}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Unit Pelaksana: <strong className="text-slate-800">{activeSpecService.target_unit_name || activeSpecService.name}</strong>
                  {canEditServiceSpec(activeSpecService) && (
                    <span className="ml-2 text-indigo-600 font-bold">• Kuasa Ketua Unit / Admin Aktif</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canEditServiceSpec(activeSpecService) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSpec(!isEditingSpec)}
                    className={`btn btn-xs rounded-xl font-bold h-8 px-3 border transition-all ${
                      isEditingSpec
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {isEditingSpec ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mod Lihat Sahaja</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sunting Maklumat</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSpecModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-800">
              {isEditingSpec && (
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs text-indigo-900 font-medium flex items-start gap-2.5">
                  <Edit3 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block">Mod Suntingan Ketua Unit Aktif</strong>
                    <span>
                      Anda boleh menambah baik, membetulkan, atau melengkapkan skop kerja dan jawapan spesifikasi di bawah. Sebarang perubahan akan disimpan untuk rujukan staf pelaksana unit.
                    </span>
                  </div>
                </div>
              )}

              {/* Scope & Brief */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Deliverable Scope & Brief
                  </label>
                  {!isEditingSpec && specScope && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard('scope', specScope)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {copiedKey === 'scope' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'scope' ? 'Disalin!' : 'Salin Skop'}</span>
                    </button>
                  )}
                </div>

                {isEditingSpec ? (
                  <textarea
                    rows={3}
                    value={specScope}
                    onChange={(e) => setSpecScope(e.target.value)}
                    placeholder="Masukkan skop ringkas permohonan untuk unit ini..."
                    className="textarea textarea-bordered w-full rounded-2xl text-xs font-medium bg-white p-3.5 focus:border-indigo-600 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap select-text">
                    {specScope || <span className="text-slate-400 italic">Tiada arahan skop khusus dinyatakan oleh klien.</span>}
                  </div>
                )}
              </div>

              {/* Dynamic Specifications & Intake Questions */}
              {Object.keys(specFields).length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Spesifikasi Unit ({Object.keys(specFields).length} Butiran Intake)
                    </label>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(specFields).map(([fk, fv]) => {
                      const fieldLabel = fk.replace(/_/g, ' ').toUpperCase();
                      return (
                        <div key={fk} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                              {fieldLabel}
                            </span>
                            {!isEditingSpec && fv && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fk, String(fv))}
                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                              >
                                {copiedKey === fk ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === fk ? 'Disalin' : 'Salin'}</span>
                              </button>
                            )}
                          </div>

                          {isEditingSpec ? (
                            String(fv).length > 80 || String(fv).includes('\n') ? (
                              <textarea
                                rows={2}
                                value={String(fv)}
                                onChange={(e) => setSpecFields({ ...specFields, [fk]: e.target.value })}
                                className="textarea textarea-bordered w-full rounded-xl text-xs font-medium bg-white p-2.5 focus:border-indigo-600 focus:outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={String(fv)}
                                onChange={(e) => setSpecFields({ ...specFields, [fk]: e.target.value })}
                                className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold bg-white px-3 focus:border-indigo-600 focus:outline-none"
                              />
                            )
                          ) : (
                            <p className="text-xs font-bold text-slate-800 break-words leading-relaxed select-text">
                              {String(fv) || <span className="text-slate-400 italic font-normal">Tiada maklumat diisi</span>}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Head of Unit Guidance Notes for Staff */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Arahan & Nota Khas Ketua Unit untuk Staf</span>
                </div>

                {isEditingSpec ? (
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      value={specGuidanceNotes}
                      onChange={(e) => setSpecGuidanceNotes(e.target.value)}
                      placeholder="Masukkan nota panduan khas untuk staf pelaksana unit anda (cth: saiz kanvas, garis panduan warna, penekanan utama)..."
                      className="textarea textarea-bordered w-full rounded-2xl text-xs font-medium bg-amber-50/40 border-amber-200 focus:border-amber-400 p-3.5 focus:outline-none leading-relaxed"
                    />
                    <span className="text-[10px] text-slate-400 block italic">
                      Nota ini akan dipaparkan secara khusus di atas kad tugasan staf unit.
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs font-medium text-amber-900 leading-relaxed whitespace-pre-wrap select-text">
                    {specGuidanceNotes || (
                      <span className="text-amber-700/60 italic">
                        Tiada arahan tambahan khusus daripada Ketua Unit buat masa ini.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                {activeSpecService.specifications_updated_by ? (
                  <span>Dikemaskini oleh: <strong className="text-slate-600">{activeSpecService.specifications_updated_by}</strong></span>
                ) : (
                  <span>Input asal daripada borang awam pelanggan.</span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSpecModal(false)}
                  className="btn btn-sm btn-ghost text-slate-600 font-extrabold text-xs rounded-xl h-10 px-4"
                >
                  Tutup
                </button>
                {isEditingSpec && (
                  <button
                    type="button"
                    onClick={handleSaveSpec}
                    disabled={savingSpec}
                    className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl h-10 px-5 shadow-md shadow-indigo-600/25 border-none"
                  >
                    {savingSpec ? <span className="loading loading-spinner loading-xs"></span> : 'Simpan Spesifikasi'}
                  </button>
                )}
              </div>
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

      {/* REQUEST CROSS-UNIT ASSISTANCE MODAL */}
      {showRequestAssistanceModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    Request Unit Assistance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Request collaboration or help from another unit for #{request.ticket_no}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestAssistanceModal(false)}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestAssistanceSubmit} className="space-y-4 text-xs">
              {/* Target Unit Dropdown */}
              <div>
                <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                  Target Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assistanceTargetUnit}
                  onChange={(e) => {
                    setAssistanceTargetUnit(e.target.value);
                    setAssistanceSuggestedStaffId('');
                  }}
                  required
                  className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-600"
                >
                  <option value="">-- Choose Unit to Request Assistance From --</option>
                  {unitsList
                    .filter((u) => u.name && u.name.toLowerCase().trim() !== (request.unit || '').toLowerCase().trim())
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.display_label || u.name} {u.department_name ? `(${u.department_name})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Suggested Staff (Filtered by chosen target unit) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Suggested Staff Member <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {assistanceTargetUnit && (
                    <span className="text-[10px] text-indigo-600 font-bold">
                      {teamMembers.filter((m) => m.unit?.toLowerCase().trim() === assistanceTargetUnit.toLowerCase().trim()).length} staff available
                    </span>
                  )}
                </div>
                <select
                  value={assistanceSuggestedStaffId}
                  onChange={(e) => setAssistanceSuggestedStaffId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!assistanceTargetUnit}
                  className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- No preference / Let Unit Head decide --</option>
                  {assistanceTargetUnit &&
                    teamMembers
                      .filter((m) => m.unit?.toLowerCase().trim() === assistanceTargetUnit.toLowerCase().trim())
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.is_unit_head ? '(Unit Head)' : ''}
                        </option>
                      ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  You may suggest a specific staff member (e.g. Amalina for Writer). The Unit Head will review and can confirm or reassign.
                </p>
              </div>

              {/* Task / Scope Description */}
              <div>
                <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                  Required Task / Scope of Work <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify what assistance is needed (e.g. Penulisan skrip video, copywriting kapsyen media sosial, semakan teks)..."
                  value={assistanceTaskDesc}
                  onChange={(e) => setAssistanceTaskDesc(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all resize-none shadow-inner"
                ></textarea>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                  Additional Notes / Deadlines <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Any extra context or target deadline for this task..."
                  value={assistanceNotes}
                  onChange={(e) => setAssistanceNotes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all resize-none shadow-inner"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestAssistanceModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !assistanceTargetUnit || !assistanceTaskDesc.trim()}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md shadow-indigo-600/20 gap-2"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Assistance Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESPOND TO ASSISTANCE MODAL (FOR UNIT HEAD / MANAGER / ADMIN) */}
      {showRespondAssistanceModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {showDeclineConfirm ? 'Decline Assistance Request' : 'Review & Assign Unit Staff'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Unit {showRespondAssistanceModal.target_unit} Endorsement for #{request.ticket_no}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRespondAssistanceModal(null);
                  setShowDeclineConfirm(false);
                }}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Requester:</span>
                <span className="font-extrabold text-slate-900">
                  {showRespondAssistanceModal.requester_name} ({getAstRequesterBadge(showRespondAssistanceModal)})
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-semibold shrink-0">Task Scope:</span>
                <span className="font-medium text-slate-800 text-right">
                  {showRespondAssistanceModal.task_description}
                </span>
              </div>
              {showRespondAssistanceModal.suggested_staff_name && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Suggested Staff:</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    ★ {showRespondAssistanceModal.suggested_staff_name}
                  </span>
                </div>
              )}
              {showRespondAssistanceModal.notes && (
                <div className="flex items-start justify-between gap-2 border-t border-slate-200/50 pt-1.5 mt-1.5">
                  <span className="text-slate-500 font-semibold shrink-0">Notes:</span>
                  <span className="text-slate-600 italic text-right">
                    "{showRespondAssistanceModal.notes}"
                  </span>
                </div>
              )}
            </div>

            {!showDeclineConfirm ? (
              <div className="space-y-4 text-xs">
                {/* Staff Assignment Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-extrabold text-slate-800 text-xs">
                      Assign Staff Member from {showRespondAssistanceModal.target_unit} <span className="text-rose-500">*</span>
                    </label>
                    {showRespondAssistanceModal.suggested_staff_id && Number(respondAssignedStaffId) === Number(showRespondAssistanceModal.suggested_staff_id) ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        ✓ Requester Suggestion
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">
                        Unit Head Choice
                      </span>
                    )}
                  </div>

                  <select
                    value={respondAssignedStaffId}
                    onChange={(e) => setRespondAssignedStaffId(e.target.value ? Number(e.target.value) : '')}
                    className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-600"
                  >
                    <option value="">-- Choose Staff Member to Assign --</option>
                    {teamMembers
                      .filter((m) => m.unit?.toLowerCase().trim() === showRespondAssistanceModal.target_unit?.toLowerCase().trim())
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.is_unit_head ? '(Unit Head)' : ''} {showRespondAssistanceModal.suggested_staff_id === m.id ? '★ Suggested' : ''}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can confirm the requester's suggestion or choose another qualified staff member from your unit.
                  </p>
                </div>

                {/* Task Instructions */}
                <div>
                  <label className="block font-extrabold text-slate-800 text-xs mb-1.5">
                    Task Instructions / Scope for Assigned Staff
                  </label>
                  <textarea
                    rows={3}
                    value={respondTaskDesc}
                    onChange={(e) => setRespondTaskDesc(e.target.value)}
                    placeholder="Enter or refine instructions for the assigned staff..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all resize-none shadow-inner"
                  ></textarea>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeclineConfirm(true)}
                    className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Decline Request
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRespondAssistanceModal(null)}
                      className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading || !respondAssignedStaffId}
                      onClick={() => handleRespondAssistanceSubmit('accept')}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md shadow-indigo-600/20 gap-2"
                    >
                      {actionLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Assign Staff</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Decline Form */
              <div className="space-y-4 text-xs">
                <p className="text-xs text-slate-600 font-medium">
                  Please provide a reason for declining this cross-unit assistance request:
                </p>
                <textarea
                  rows={3}
                  value={respondDeclineReason}
                  onChange={(e) => setRespondDeclineReason(e.target.value)}
                  placeholder="e.g. Unit staff currently at full capacity, deadline too tight, or outside unit scope..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-600 focus:outline-none transition-all resize-none shadow-inner"
                ></textarea>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeclineConfirm(false)}
                    className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Back to Assign
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading || !respondDeclineReason.trim()}
                    onClick={() => handleRespondAssistanceSubmit('decline')}
                    className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md shadow-rose-600/20 gap-2"
                  >
                    {actionLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Confirm Decline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
