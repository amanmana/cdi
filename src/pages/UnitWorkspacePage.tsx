import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportsPage } from './ReportsPage';
import {
  FolderKanban,
  Calendar as CalendarIcon,
  BarChart3,
  FileText,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Filter,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Send,
  CalendarDays,
  TrendingUp,
  PieChart as PieChartIcon,
  GripVertical,
  AlertTriangle,
  CalendarRange,
  Users,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

export const UnitWorkspacePage: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'kanban' }) => {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Available Units
  const [unitsList, setUnitsList] = useState<any[]>([]);

  // Current Selected Unit (for Director / Manager / Admin or user's unit)
  const isSuperUser = ['admin', 'manager', 'director'].includes(user?.role) || Boolean((user as any)?.is_acting_manager);
  const userUnitName = user?.unit || 'Social Media';
  const initialUnit = searchParams.get('unit') || userUnitName;
  const [currentUnit, setCurrentUnit] = useState<string>(initialUnit);

  // Active Tab Policy:
  // - Currently, ONLY Social Media requested a Kanban board workflow. All other units have Kanban hidden.
  // - Even for Social Media, Managers and Directors do not see Kanban (leadership operates at Calendar, Metrics, and Weekly Reports level).
  // - Head Unit (Azni) & Staff of Social Media (and Admin) have access to the Kanban board.
  const isSocialMediaUnit = currentUnit.toLowerCase().trim() === 'social media' || currentUnit.toLowerCase().includes('social');
  const isLeadership = user?.role === 'manager' || user?.role === 'director' || Boolean((user as any)?.is_acting_manager);
  const isKanbanEnabled = Boolean(isSocialMediaUnit && (!isLeadership || user?.role === 'admin'));

  // Active Tab: 'kanban' | 'calendar' | 'analytics' | 'reports'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam && tabParam !== 'kanban') return tabParam;
    if (tabParam === 'kanban') return isKanbanEnabled ? 'kanban' : 'calendar';
    return isKanbanEnabled ? defaultTab : 'calendar';
  });

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  // Filter & Search in Workspace
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [showCompletedOnKanban, setShowCompletedOnKanban] = useState<boolean>(false);

  // Compute Accessible Units based on strict role scoping:
  // - Admin & Director: All units
  // - Managers (Hazmi / Faizal) & Acting Managers: strictly limited to units under their department
  // - Head Unit: their assigned unit(s)
  // - Regular Staff: only their own assigned unit
  const accessibleUnits = useMemo(() => {
    if (!unitsList || unitsList.length === 0) return [];

    // Admin and Director have full oversight across all units
    if (user?.role === 'admin' || user?.role === 'director') {
      return unitsList;
    }

    // Managers & Acting Managers: strictly limited to units under their department
    if (user?.role === 'manager' || user?.is_acting_manager) {
      const managerDeptId = (user as any)?.managed_department_id || (user as any)?.acting_manager_department_id || user?.department_id;
      const managedUnitNames: string[] = (user as any)?.managed_units || [];
      const userUnit = user?.unit?.toLowerCase().trim();

      const filtered = unitsList.filter((u) => {
        if (managerDeptId && u.department_id && Number(u.department_id) === Number(managerDeptId)) {
          return true;
        }
        if (managedUnitNames.length > 0 && managedUnitNames.some((mu) => mu.toLowerCase().trim() === u.name.toLowerCase().trim())) {
          return true;
        }
        if (userUnit && u.name.toLowerCase().trim() === userUnit) {
          return true;
        }
        return false;
      });

      return filtered.length > 0 ? filtered : unitsList;
    }

    // Head Unit: can access their assigned unit(s)
    if (user?.is_unit_head && Array.isArray((user as any)?.managed_units) && (user as any).managed_units.length > 0) {
      const managedUnitNames: string[] = (user as any).managed_units;
      const filtered = unitsList.filter((u) => managedUnitNames.some((mu) => mu.toLowerCase().trim() === u.name.toLowerCase().trim()));
      return filtered.length > 0 ? filtered : unitsList;
    }

    // Regular Staff: only their own assigned unit
    if (user?.unit) {
      const matched = unitsList.filter((u) => u.name.toLowerCase().trim() === user.unit.toLowerCase().trim());
      if (matched.length > 0) return matched;
      return [{ id: 0, name: user.unit }];
    }

    return unitsList;
  }, [unitsList, user]);

  // Synchronize currentUnit with accessibleUnits
  useEffect(() => {
    if (accessibleUnits.length === 0) return;

    const requestedUnit = searchParams.get('unit');
    const isRequestedValid = requestedUnit && accessibleUnits.some((u) => u.name.toLowerCase().trim() === requestedUnit.toLowerCase().trim());

    if (isRequestedValid) {
      if (currentUnit.toLowerCase().trim() !== requestedUnit.toLowerCase().trim()) {
        setCurrentUnit(requestedUnit);
      }
      return;
    }

    // If current unit is not within accessible units, fallback to user's unit or the first accessible unit
    const isCurrentValid = accessibleUnits.some((u) => u.name.toLowerCase().trim() === currentUnit.toLowerCase().trim());
    if (!isCurrentValid) {
      const preferred = accessibleUnits.find((u) => user?.unit && u.name.toLowerCase().trim() === user.unit.toLowerCase().trim()) || accessibleUnits[0];
      if (preferred) {
        setCurrentUnit(preferred.name);
      }
    }
  }, [accessibleUnits, searchParams, currentUnit, user?.unit]);

  // Permissions:
  // - Managers and Directors are strictly VIEW-ONLY on Kanban columns (cannot Add/Edit/Delete/Reorder columns)
  // - Strictly only the actual Head Unit of the current unit (or Admin) can Add, Edit, Delete, or Reorder columns
  // - Head Unit, Admin, and Staff from Unit SocMed can move/drag cards between stages
  const isHeadOfCurrentUnit = Boolean(
    user?.is_unit_head && (
      (user?.unit && user.unit.toLowerCase().trim() === currentUnit.toLowerCase().trim()) ||
      ((user as any)?.managed_units && (user as any).managed_units.some((u: string) => u.toLowerCase().trim() === currentUnit.toLowerCase().trim()))
    )
  );
  const canManageColumns = Boolean(user?.role === 'admin' || isHeadOfCurrentUnit);

  const isSocMedUnitName = (u?: string | null) => {
    if (!u) return false;
    const s = u.toLowerCase().trim();
    return s === 'social media' || s === 'socmed' || s.includes('social') || s.includes('socmed');
  };

  const isCurrentUnitSocMed = isSocMedUnitName(currentUnit);
  const isUserSocMed = isSocMedUnitName(user?.unit);

  // Moving cards: Admin, Head of Current Unit, or Staff of SocMed
  const canMoveCards = Boolean(
    canManageColumns ||
    (isCurrentUnitSocMed && (isUserSocMed || user?.role === 'staff' || user?.role === 'admin'))
  );

  // Modals
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [selectedTaskPreview, setSelectedTaskPreview] = useState<any | null>(null);

  // Drag and Drop & Whiteboard Ordering State
  const [draggedJobId, setDraggedJobId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [stageOrders, setStageOrders] = useState<Record<string, number[]>>({});

  // Full View State for Kanban
  const [isKanbanFullscreen, setIsKanbanFullscreen] = useState<boolean>(false);
  const [kanbanFitMode, setKanbanFitMode] = useState<'fit' | 'scroll'>('fit');

  // Prevent background scrolling & handle Escape key in Full View
  useEffect(() => {
    if (isKanbanFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsKanbanFullscreen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isKanbanFullscreen]);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Gantt Chart State (Charts & Metrics Tab)
  const [ganttFilter, setGanttFilter] = useState<'all' | 'overlap' | 'overdue'>('all');
  const [ganttSearch, setGanttSearch] = useState<string>('');
  const [ganttSelectedStaff, setGanttSelectedStaff] = useState<string>('all');
  const [ganttViewMode, setGanttViewMode] = useState<'staff' | 'task'>('staff');
  const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const ganttScrollRef = useRef<HTMLDivElement>(null);

  const scrollToToday = () => {
    const todayIdx = ganttData.timelineDays.findIndex((d) => d.isToday);
    if (todayIdx >= 0 && ganttScrollRef.current) {
      const scrollPos = Math.max(0, todayIdx * 48 - 160);
      ganttScrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (ganttScrollRef.current) {
      ganttScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [ganttSelectedStaff]);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAllUsersList(data);
        })
        .catch(() => {});
    }
  }, [token]);

  const isStaffExpanded = (staffName: string) => {
    return expandedStaff[staffName] !== false; // Default: expanded
  };

  const toggleStaffExpand = (staffName: string) => {
    setExpandedStaff((prev) => ({
      ...prev,
      [staffName]: prev[staffName] === false ? true : false,
    }));
  };

  const expandAllStaff = () => {
    setExpandedStaff({});
  };

  const collapseAllStaff = (allNames: string[]) => {
    const next: Record<string, boolean> = {};
    allNames.forEach((name) => {
      next[name] = false;
    });
    setExpandedStaff(next);
  };

  // Sync tab with URL and enforce valid tab when Kanban is disabled
  useEffect(() => {
    if (!isKanbanEnabled && activeTab === 'kanban') {
      setActiveTab('calendar');
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', 'calendar');
      setSearchParams(newParams);
      return;
    }
    if (tabParam && tabParam !== activeTab) {
      if (!isKanbanEnabled && tabParam === 'kanban') {
        setActiveTab('calendar');
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', 'calendar');
        setSearchParams(newParams);
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, isKanbanEnabled, activeTab, searchParams, setSearchParams]);

  const handleTabChange = (tab: string) => {
    const targetTab = (!isKanbanEnabled && tab === 'kanban') ? 'calendar' : tab;
    setActiveTab(targetTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', targetTab);
    setSearchParams(newParams);
  };

  const handleUnitChange = (unitName: string) => {
    setCurrentUnit(unitName);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('unit', unitName);
    const targetIsSocMed = unitName.toLowerCase().trim() === 'social media' || unitName.toLowerCase().includes('social');
    const targetKanbanEnabled = Boolean(targetIsSocMed && (!isLeadership || user?.role === 'admin'));
    if (!targetKanbanEnabled && activeTab === 'kanban') {
      setActiveTab('calendar');
      newParams.set('tab', 'calendar');
    }
    setSearchParams(newParams);
  };

  // 1. Fetch available units
  useEffect(() => {
    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter((u) => u.name && !['administrator', 'admin'].includes(u.name.toLowerCase().trim()));
          setUnitsList(filtered);

          // If current unit is not set or empty, pick first unit
          if (!currentUnit && filtered.length > 0) {
            setCurrentUnit(filtered[0].name);
          }
        }
      })
      .catch((err) => console.error('Failed to load units:', err));
  }, []);

  // 2. Fetch Jobs & Kanban Columns for Current Unit
  const fetchData = async () => {
    if (!currentUnit) return;
    setLoading(true);

    try {
      // Fetch Kanban Columns & Stage Orders
      const colRes = await fetch(`/api/job-requests/kanban-columns/${encodeURIComponent(currentUnit)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const colData = await colRes.json().catch(() => ({}));
      if (colData.columns && Array.isArray(colData.columns)) {
        setKanbanColumns(colData.columns);
      } else {
        setKanbanColumns([
          { id: 'planning', label: 'Planning / Idea', color: 'slate' },
          { id: 'drafting', label: 'Drafting & Design', color: 'indigo' },
          { id: 'review', label: 'Review & Approval', color: 'amber' },
          { id: 'scheduled', label: 'Scheduled', color: 'blue' },
          { id: 'published', label: 'Published / Done', color: 'emerald' },
        ]);
      }
      if (colData.stage_orders && typeof colData.stage_orders === 'object') {
        setStageOrders(colData.stage_orders);
      }

      // Fetch All Job Requests (for this workspace unit)
      const jobRes = await fetch(`/api/job-requests?workspace_unit=${encodeURIComponent(currentUnit)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobData = await jobRes.json().catch(() => []);
      if (Array.isArray(jobData)) {
        setJobRequests(jobData);
      }
    } catch (err) {
      console.error('Error fetching unit workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUnit, token]);

  // Filter Jobs Belonging to Current Unit
  const unitJobs = useMemo(() => {
    const targetUnitLower = currentUnit.toLowerCase().trim();

    return jobRequests.filter((job) => {
      // 1. Job primary unit matches
      if (job.unit && job.unit.toLowerCase().trim() === targetUnitLower) return true;

      // 2. Origin/requester unit matches
      if (job.additional_data?.requester_unit && job.additional_data.requester_unit.toLowerCase().trim() === targetUnitLower) {
        return true;
      }

      // 3. Multi-target units
      const targets = job.additional_data?.target_units;
      if (Array.isArray(targets) && targets.some((t: string) => t && t.toLowerCase().trim() === targetUnitLower)) {
        return true;
      }

      // 4. Assistance requests
      const astList = job.additional_data?.assistance_requests;
      if (Array.isArray(astList) && astList.some((ast: any) => ast.target_unit && ast.target_unit.toLowerCase().trim() === targetUnitLower)) {
        return true;
      }

      // 5. Assigned staff belongs to this unit
      const staffList = job.assigned_staff || job.assigned_staff_details || [];
      if (Array.isArray(staffList) && staffList.some((s: any) => s.unit && s.unit.toLowerCase().trim() === targetUnitLower)) {
        return true;
      }

      return false;
    });
  }, [jobRequests, currentUnit]);

  // Unique list of staff involved in this unit's jobs (for filtering)
  const unitStaffMembers = useMemo(() => {
    const map = new Map<number, string>();
    const targetUnit = currentUnit.toLowerCase().trim();
    unitJobs.forEach((job) => {
      const staffList = job.assigned_staff || job.assigned_staff_details || [];
      if (Array.isArray(staffList)) {
        staffList.forEach((s: any) => {
          const sUnit = (s.unit || '').toLowerCase().trim();
          // Only include staff belonging to this unit
          if (s.id && s.name && (!sUnit || sUnit === targetUnit)) {
            map.set(Number(s.id), s.name);
          }
        });
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [unitJobs, currentUnit]);

  // Helper: Determine if task is finished / completed in system
  // NOTE: Kanban board is strictly a whiteboard. Moving a card to "Done" column does NOT complete the project.
  // The task only shows "Completed" when manually updated in the system (status === 'completed' or 'done').
  const isJobCompleted = (job: any): boolean => {
    return job.status === 'completed' || job.status === 'done';
  };

  // Helper: Render status badge matching the system status pills (Staff Processing, Head Unit Approval, etc.)
  const renderCardStatusBadge = (job: any) => {
    const isDone = isJobCompleted(job);
    const status = job.status;
    const isInterUnit = Boolean(job.additional_data?.is_inter_unit || job.ticket_no?.startsWith('IU'));

    if (isDone) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
          <span>Completed</span>
        </span>
      );
    }

    if (status === 'manager_approval') {
      if (isInterUnit) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-2xs">
            <span>Head Unit Approval</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
          <span>Manager Approval</span>
        </span>
      );
    }

    if (status === 'on_hold') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
          <span>On Hold</span>
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
          <span>Rejected</span>
        </span>
      );
    }

    // Default active work in progress
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
        <span>Staff Processing</span>
      </span>
    );
  };

  // Helper: Map a job into a kanban column ID
  const getJobStageId = (job: any): string => {
    if (kanbanColumns.length === 0) return 'planning';

    const savedStage = job.additional_data?.kanban_stage;
    if (savedStage) {
      // Find matching column by ID or label
      const matched = kanbanColumns.find(
        (c) => c.id.toLowerCase() === savedStage.toLowerCase() || c.label.toLowerCase() === savedStage.toLowerCase()
      );
      if (matched) return matched.id;
    }

    // Fallback: If completed, map to the last column (usually Published / Done)
    if (job.status === 'completed') {
      return kanbanColumns[kanbanColumns.length - 1].id;
    }

    // Default stage by status
    if (job.status === 'pending_approval') {
      return kanbanColumns[0].id;
    }

    // Otherwise, 2nd column (e.g. Drafting & Design) or 1st column
    if (kanbanColumns.length > 1) {
      return kanbanColumns[1].id;
    }
    return kanbanColumns[0].id;
  };

  // Filtered Jobs based on search & staff filter
  const filteredJobs = useMemo(() => {
    return unitJobs.filter((job) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (job.title || '').toLowerCase().includes(q);
        const ticketMatch = (job.ticket_no || '').toLowerCase().includes(q);
        const clientMatch = (job.client_name || '').toLowerCase().includes(q);
        const projectMatch = (job.project_name || '').toLowerCase().includes(q);
        if (!titleMatch && !ticketMatch && !clientMatch && !projectMatch) return false;
      }

      // Staff filter
      if (staffFilter !== 'all') {
        const staffIdNum = Number(staffFilter);
        const ids = (job.assigned_staff_ids || '').split(',').map((id: string) => Number(id.trim()));
        if (!ids.includes(staffIdNum)) return false;
      }

      // Pillar filter (if applicable for Social Media)
      if (pillarFilter !== 'all') {
        const customFields = job.additional_data?.custom_fields_data || {};
        const pillars = customFields.pillar || customFields.Pillar || [];
        const pillarArr = Array.isArray(pillars) ? pillars : [pillars];
        if (!pillarArr.some((p: any) => String(p).toLowerCase().includes(pillarFilter.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }, [unitJobs, searchQuery, staffFilter, pillarFilter]);

  // Filtered Jobs for Kanban board: strictly Current / Incomplete jobs (Work In Progress)
  const kanbanJobs = useMemo(() => {
    return filteredJobs.filter((job) => !isJobCompleted(job));
  }, [filteredJobs]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = unitJobs.length;
    const completed = unitJobs.filter((j) => isJobCompleted(j)).length;
    const unfinished = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, unfinished, rate };
  }, [unitJobs]);

  // Move / Reorder Card on Kanban Board (Supports Vertical Ordering + Stage Moving)
  const handleDropCard = async (jobId: number, targetStageId: string, targetIndex: number) => {
    if (!canMoveCards) return;
    const targetCol = kanbanColumns.find((c) => c.id === targetStageId);
    if (!targetCol) return;

    const currentJob = unitJobs.find((j) => j.id === jobId);
    if (!currentJob) return;
    const currentStageId = getJobStageId(currentJob);

    // Helper: get current ordered job IDs for a stage
    const getColJobIds = (stageId: string) => {
      const existing = stageOrders[stageId];
      if (existing && Array.isArray(existing) && existing.length > 0) {
        return [...existing];
      }
      return kanbanJobs.filter((j) => getJobStageId(j) === stageId).map((j) => j.id);
    };

    const sourceList = getColJobIds(currentStageId).filter((id) => id !== jobId);
    let targetList = currentStageId === targetStageId ? sourceList : getColJobIds(targetStageId).filter((id) => id !== jobId);

    const safeIdx = Math.max(0, Math.min(targetIndex, targetList.length));
    targetList.splice(safeIdx, 0, jobId);

    const newStageOrders: Record<string, number[]> = {
      ...stageOrders,
      [currentStageId]: sourceList,
      [targetStageId]: targetList,
    };

    // Optimistically update local stage orders
    setStageOrders(newStageOrders);

    // Optimistically update local whiteboard stage
    setJobRequests((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            additional_data: {
              ...(job.additional_data || {}),
              kanban_stage: targetStageId,
              kanban_stage_label: targetCol.label,
            },
          };
        }
        return job;
      })
    );

    try {
      await fetch(`/api/job-requests/kanban-order/${encodeURIComponent(currentUnit)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage_orders: newStageOrders,
          job_id: jobId,
          stage_id: targetStageId,
          stage_label: targetCol.label,
        }),
      });
    } catch (e) {
      console.error('Network error persisting card whiteboard order:', e);
    }
  };

  // Quick Move Card to a New Kanban Stage via Dropdown
  const handleMoveCard = (jobId: number, targetStageId: string) => {
    const existing = stageOrders[targetStageId] || [];
    handleDropCard(jobId, targetStageId, existing.length);
  };

  // Add Column Handler
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    const newId = newColumnName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const updated = [...kanbanColumns, { id: newId, label: newColumnName.trim() }];

    setKanbanColumns(updated);
    setNewColumnName('');
    setShowAddColumnModal(false);

    try {
      await fetch(`/api/job-requests/kanban-columns/${encodeURIComponent(currentUnit)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columns: updated }),
      });
    } catch (e) {
      console.error('Error saving new column:', e);
    }
  };

  // Edit Column Name
  const handleSaveEditColumn = async () => {
    if (!editingColumn || !editingColumn.label.trim()) return;

    const updated = kanbanColumns.map((c) => (c.id === editingColumn.id ? editingColumn : c));
    setKanbanColumns(updated);
    setEditingColumn(null);

    try {
      await fetch(`/api/job-requests/kanban-columns/${encodeURIComponent(currentUnit)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columns: updated }),
      });
    } catch (e) {
      console.error('Error saving updated column:', e);
    }
  };

  // Delete Column
  const handleDeleteColumn = async (colId: string) => {
    if (kanbanColumns.length <= 1) {
      alert('You must have at least one column on the board.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this column? Cards in this column will move to the first column.')) {
      return;
    }

    const updated = kanbanColumns.filter((c) => c.id !== colId);
    setKanbanColumns(updated);

    try {
      await fetch(`/api/job-requests/kanban-columns/${encodeURIComponent(currentUnit)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columns: updated }),
      });
    } catch (e) {
      console.error('Error deleting column:', e);
    }
  };

  // Move Column Left / Right
  const handleMoveColumn = async (colIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= kanbanColumns.length) return;

    const updated = [...kanbanColumns];
    const temp = updated[colIndex];
    updated[colIndex] = updated[targetIndex];
    updated[targetIndex] = temp;

    setKanbanColumns(updated);

    try {
      await fetch(`/api/job-requests/kanban-columns/${encodeURIComponent(currentUnit)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columns: updated }),
      });
    } catch (e) {
      console.error('Error reordering column:', e);
    }
  };

  // Calendar Helpers
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Mon, 6 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarDate]);

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredJobs.filter((job) => {
      const start = job.start_date ? job.start_date.split('T')[0] : '';
      const deadline = job.deadline ? job.deadline.split('T')[0] : '';
      return start === dateStr || deadline === dateStr;
    });
  };

  // Analytics Computations
  const analyticsData = useMemo(() => {
    // Pillars breakdown
    const pillarsMap: Record<string, number> = {};
    const categoriesMap: Record<string, number> = {};
    const staffWorkloadMap: Record<string, { total: number; completed: number; pending: number }> = {};

    unitJobs.forEach((job) => {
      const isComp = isJobCompleted(job);
      const cFields = job.additional_data?.custom_fields_data || {};

      // Pillars
      const p = cFields.pillar || cFields.Pillar;
      if (p) {
        const arr = Array.isArray(p) ? p : [p];
        arr.forEach((pillName: string) => {
          if (pillName) pillarsMap[pillName] = (pillarsMap[pillName] || 0) + 1;
        });
      }

      // Categories
      const cat = cFields.category || cFields.Category || cFields.content_type || 'General Work';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;

      // Staff Workload (strictly filtered to staff belonging to this unit)
      const staffList = job.assigned_staff || job.assigned_staff_details || [];
      if (Array.isArray(staffList)) {
        const targetUnit = currentUnit.toLowerCase().trim();
        staffList.forEach((s: any) => {
          const sUnit = (s.unit || '').toLowerCase().trim();
          // Filter out cross-unit collaborators who do not belong to this unit
          if (sUnit && sUnit !== targetUnit) {
            return;
          }

          const name = s.name || 'Unassigned';
          if (!staffWorkloadMap[name]) {
            staffWorkloadMap[name] = { total: 0, completed: 0, pending: 0 };
          }
          staffWorkloadMap[name].total += 1;
          if (isComp) staffWorkloadMap[name].completed += 1;
          else staffWorkloadMap[name].pending += 1;
        });
      }
    });

    return {
      pillars: Object.entries(pillarsMap).sort((a, b) => b[1] - a[1]),
      categories: Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]),
      staffWorkload: Object.entries(staffWorkloadMap).sort((a, b) => b[1].total - a[1].total),
    };
  }, [unitJobs]);

  // Lookup map for staff avatar URLs
  const staffAvatarMap = useMemo(() => {
    const map = new Map<string, string>();
    allUsersList.forEach((u) => {
      if (u.name && u.avatar_url) {
        map.set(u.name.toLowerCase().trim(), u.avatar_url);
      }
    });
    unitJobs.forEach((job) => {
      const list = job.assigned_staff || job.assigned_staff_details || [];
      if (Array.isArray(list)) {
        list.forEach((s: any) => {
          if (s.name && s.avatar_url) {
            map.set(s.name.toLowerCase().trim(), s.avatar_url);
          }
        });
      }
    });
    return map;
  }, [allUsersList, unitJobs]);

  // Incomplete Tasks & Gantt Chart Computations (Schedule & Overlap Timeline)
  const ganttData = useMemo(() => {
    // 1. Filter strictly to incomplete tasks
    const incomplete = unitJobs.filter((j) => !isJobCompleted(j));

    const today = new Date();
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 2. Parse start date & deadline for each incomplete job
    const jobsWithDates = incomplete.map((job) => {
      const rawStart = job.start_date || job.created_at;
      const parsedStart = rawStart ? new Date(rawStart) : new Date(todayNorm);
      const start = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate());

      const rawDeadline = job.deadline || job.target_completion_date;
      let parsedDeadline = rawDeadline ? new Date(rawDeadline) : new Date(start.getTime() + 7 * 86400000);
      let deadline = new Date(parsedDeadline.getFullYear(), parsedDeadline.getMonth(), parsedDeadline.getDate());

      if (deadline < start) {
        deadline = new Date(start.getTime() + 86400000);
      }

      const isOverdue = deadline < todayNorm;
      const durationDays = Math.max(1, Math.round((deadline.getTime() - start.getTime()) / 86400000) + 1);

      const targetUnit = currentUnit.toLowerCase().trim();
      const rawStaffList = job.assigned_staff || job.assigned_staff_details || [];
      const staffList = Array.isArray(rawStaffList)
        ? rawStaffList.filter((s: any) => {
            const sUnit = (s.unit || '').toLowerCase().trim();
            // Strictly include only staff who belong to currentUnit
            return !sUnit || sUnit === targetUnit;
          })
        : [];
      const staffNames = staffList.map((s: any) => s.name || s.staff_name).filter(Boolean);

      return {
        job,
        start,
        deadline,
        isOverdue,
        durationDays,
        staffNames,
      };
    });

    // 3. Detect schedule overlaps among incomplete tasks
    const jobsWithOverlaps = jobsWithDates.map((item) => {
      const overlapping = jobsWithDates.filter((other) => {
        if (other.job.id === item.job.id) return false;
        // Two intervals overlap if neither ends before the other starts
        return !(item.deadline < other.start || item.start > other.deadline);
      });

      const sharedStaff = item.staffNames.filter((name: string) =>
        overlapping.some((other) => other.staffNames.includes(name))
      );

      return {
        ...item,
        overlappingJobs: overlapping.map((o) => ({
          id: o.job.id,
          ticket_no: o.job.ticket_no || `#${o.job.id}`,
          title: o.job.title,
        })),
        hasOverlap: overlapping.length > 0,
        hasStaffOverlap: sharedStaff.length > 0,
        sharedStaff,
      };
    });

    const totalIncomplete = jobsWithOverlaps.length;
    const overdueCount = jobsWithOverlaps.filter((j) => j.isOverdue).length;
    const overlapCount = jobsWithOverlaps.filter((j) => j.hasOverlap).length;
    const onTrackCount = jobsWithOverlaps.filter((j) => !j.isOverdue).length;

    if (jobsWithOverlaps.length === 0) {
      return {
        jobs: [],
        staffGroups: [],
        unassignedJobs: [],
        totalStaffWithOverlaps: 0,
        timelineDays: [],
        monthHeaders: [],
        totalIncomplete: 0,
        overdueCount: 0,
        overlapCount: 0,
        onTrackCount: 0,
        windowStart: todayNorm,
        windowEnd: todayNorm,
        todayNorm,
      };
    }

    // Scope timeline window: if filtering by a specific staff or unassigned, scope date window to those tasks
    const scopeJobs = (ganttSelectedStaff !== 'all')
      ? jobsWithOverlaps.filter((item) => {
          if (ganttSelectedStaff === '__unassigned__') {
            return !item.staffNames || item.staffNames.length === 0;
          }
          return item.staffNames.includes(ganttSelectedStaff);
        })
      : jobsWithOverlaps;

    const targetJobsForWindow = scopeJobs.length > 0 ? scopeJobs : jobsWithOverlaps;

    let minTime = todayNorm.getTime();
    let maxTime = todayNorm.getTime();

    targetJobsForWindow.forEach((item) => {
      if (item.start.getTime() < minTime) minTime = item.start.getTime();
      if (item.deadline.getTime() > maxTime) maxTime = item.deadline.getTime();
    });

    // Pad timeline window by 3 days before min and 4 days after max
    const windowStart = new Date(minTime - 3 * 86400000);
    const windowEnd = new Date(maxTime + 4 * 86400000);

    // Minimum 14 days visible
    const totalDaysSpan = Math.round((windowEnd.getTime() - windowStart.getTime()) / 86400000);
    if (totalDaysSpan < 14) {
      windowEnd.setTime(windowStart.getTime() + 14 * 86400000);
    }

    // Generate timeline days array
    const timelineDays: Array<{
      date: Date;
      time: number;
      dateStr: string;
      dayNum: number;
      dayName: string;
      monthName: string;
      year: number;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    const curr = new Date(windowStart);
    while (curr <= windowEnd) {
      timelineDays.push({
        date: new Date(curr),
        time: curr.getTime(),
        dateStr: curr.toISOString().split('T')[0],
        dayNum: curr.getDate(),
        dayName: curr.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: curr.toLocaleDateString('en-US', { month: 'short' }),
        year: curr.getFullYear(),
        isToday: curr.getTime() === todayNorm.getTime(),
        isWeekend: curr.getDay() === 0 || curr.getDay() === 6,
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Month headers groupings
    const monthHeaders: Array<{ label: string; span: number }> = [];
    timelineDays.forEach((day) => {
      const label = `${day.monthName} ${day.year}`;
      const lastHeader = monthHeaders[monthHeaders.length - 1];
      if (lastHeader && lastHeader.label === label) {
        lastHeader.span += 1;
      } else {
        monthHeaders.push({ label, span: 1 });
      }
    });

    // Position coordinates for each task
    const positionedJobs = jobsWithOverlaps.map((item) => {
      const startIndex = Math.max(0, Math.round((item.start.getTime() - windowStart.getTime()) / 86400000));
      const endIndex = Math.min(timelineDays.length - 1, Math.round((item.deadline.getTime() - windowStart.getTime()) / 86400000));
      const spanDays = Math.max(1, endIndex - startIndex + 1);

      return {
        ...item,
        startIndex,
        endIndex,
        spanDays,
      };
    });

    // Sort: overdue first, then overlap, then by start date
    positionedJobs.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.hasOverlap && !b.hasOverlap) return -1;
      if (!a.hasOverlap && b.hasOverlap) return 1;
      return a.start.getTime() - b.start.getTime();
    });

    // Group incomplete tasks by individual staff member
    const staffGroupsMap = new Map<string, typeof positionedJobs>();
    const unassignedJobs: typeof positionedJobs = [];

    positionedJobs.forEach((item) => {
      if (!item.staffNames || item.staffNames.length === 0) {
        unassignedJobs.push(item);
      } else {
        item.staffNames.forEach((staffName: string) => {
          if (!staffGroupsMap.has(staffName)) {
            staffGroupsMap.set(staffName, []);
          }
          staffGroupsMap.get(staffName)!.push(item);
        });
      }
    });

    const staffGroupList = Array.from(staffGroupsMap.entries()).map(([staffName, sJobs]) => {
      // Find overlaps among this staff member's OWN tasks
      const sJobsWithStaffOverlap = sJobs.map((item) => {
        const staffOverlapping = sJobs.filter((other) => {
          if (other.job.id === item.job.id) return false;
          return !(item.deadline < other.start || item.start > other.deadline);
        });

        return {
          ...item,
          isSelfStaffOverlap: staffOverlapping.length > 0,
          selfStaffOverlappingCount: staffOverlapping.length,
          selfStaffOverlappingTickets: staffOverlapping.map((o) => o.job.ticket_no || `#${o.job.id}`),
        };
      });

      const totalTasks = sJobs.length;
      const staffOverlapCount = sJobsWithStaffOverlap.filter((j) => j.isSelfStaffOverlap).length;
      const staffOverdueCount = sJobsWithStaffOverlap.filter((j) => j.isOverdue).length;
      const avatarUrl = staffAvatarMap.get(staffName.toLowerCase().trim()) || null;

      return {
        staffName,
        staffAvatarUrl: avatarUrl,
        tasks: sJobsWithStaffOverlap,
        totalTasks,
        staffOverlapCount,
        hasStaffOverlap: staffOverlapCount > 0,
        staffOverdueCount,
      };
    });

    // Sort: Staff with internal task overlaps first, then by total tasks
    staffGroupList.sort((a, b) => {
      if (a.hasStaffOverlap && !b.hasStaffOverlap) return -1;
      if (!a.hasStaffOverlap && b.hasStaffOverlap) return 1;
      return b.totalTasks - a.totalTasks;
    });

    const totalStaffWithOverlaps = staffGroupList.filter((s) => s.hasStaffOverlap).length;

    return {
      jobs: positionedJobs,
      staffGroups: staffGroupList,
      unassignedJobs,
      totalStaffWithOverlaps,
      timelineDays,
      monthHeaders,
      totalIncomplete,
      overdueCount,
      overlapCount,
      onTrackCount,
      windowStart,
      windowEnd,
      todayNorm,
    };
  }, [unitJobs, currentUnit, staffAvatarMap, ganttSelectedStaff]);

  // Filtered Gantt Jobs for Search & Pill Filter (By Task View)
  const filteredGanttJobs = useMemo(() => {
    return ganttData.jobs.filter((item) => {
      if (ganttFilter === 'overlap' && !item.hasOverlap) return false;
      if (ganttFilter === 'overdue' && !item.isOverdue) return false;

      // Staff filter
      if (ganttSelectedStaff !== 'all') {
        if (ganttSelectedStaff === '__unassigned__') {
          if (item.staffNames && item.staffNames.length > 0) return false;
        } else {
          if (!item.staffNames.includes(ganttSelectedStaff)) return false;
        }
      }

      if (ganttSearch.trim()) {
        const q = ganttSearch.toLowerCase().trim();
        const titleMatch = (item.job.title || '').toLowerCase().includes(q);
        const ticketMatch = (item.job.ticket_no || '').toLowerCase().includes(q);
        const staffMatch = item.staffNames.some((s: string) => s.toLowerCase().includes(q));
        if (!titleMatch && !ticketMatch && !staffMatch) return false;
      }

      return true;
    });
  }, [ganttData.jobs, ganttFilter, ganttSearch, ganttSelectedStaff]);

  // Filtered Gantt Staff Groups for 'By Staff' (Resource) View
  const filteredGanttStaffGroups = useMemo(() => {
    return (ganttData.staffGroups || [])
      .filter((group) => {
        if (ganttSelectedStaff !== 'all') {
          if (ganttSelectedStaff === '__unassigned__') return false;
          if (group.staffName !== ganttSelectedStaff) return false;
        }
        return true;
      })
      .map((group) => {
        const filteredTasks = group.tasks.filter((item) => {
          if (ganttFilter === 'overlap' && !item.isSelfStaffOverlap) return false;
          if (ganttFilter === 'overdue' && !item.isOverdue) return false;

          if (ganttSearch.trim()) {
            const q = ganttSearch.toLowerCase().trim();
            const titleMatch = (item.job.title || '').toLowerCase().includes(q);
            const ticketMatch = (item.job.ticket_no || '').toLowerCase().includes(q);
            const staffMatch = group.staffName.toLowerCase().includes(q);
            if (!titleMatch && !ticketMatch && !staffMatch) return false;
          }
          return true;
        });

        return {
          ...group,
          tasks: filteredTasks,
        };
      })
      .filter((group) => group.tasks.length > 0);
  }, [ganttData.staffGroups, ganttFilter, ganttSearch, ganttSelectedStaff]);

  // Filtered Unassigned Jobs for 'By Staff' View
  const filteredUnassignedJobs = useMemo(() => {
    if (ganttSelectedStaff !== 'all' && ganttSelectedStaff !== '__unassigned__') {
      return [];
    }
    return (ganttData.unassignedJobs || []).filter((item) => {
      if (ganttFilter === 'overlap' && !item.hasOverlap) return false;
      if (ganttFilter === 'overdue' && !item.isOverdue) return false;
      if (ganttSearch.trim()) {
        const q = ganttSearch.toLowerCase().trim();
        const titleMatch = (item.job.title || '').toLowerCase().includes(q);
        const ticketMatch = (item.job.ticket_no || '').toLowerCase().includes(q);
        if (!titleMatch && !ticketMatch) return false;
      }
      return true;
    });
  }, [ganttData.unassignedJobs, ganttFilter, ganttSearch, ganttSelectedStaff]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & UNIT SELECTOR BANNER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/25 shrink-0 text-xl">
              {currentUnit.includes('Social') ? '📱' : currentUnit.includes('Graphic') ? '🎨' : currentUnit.includes('Event') ? '🎪' : '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {currentUnit} Workspace
                </h1>
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {currentUnit} Unit Hub
                </span>
                {isKanbanEnabled && canManageColumns && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800">
                    ★ Lead Controls Active
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                {isKanbanEnabled
                  ? 'Custom workflow board, content calendar by date, analytics, and weekly activity reports.'
                  : 'Content calendar by date, analytics metrics, and weekly activity reports.'}
              </p>
            </div>
          </div>

          {/* Unit Selector (strictly limited to accessible units for this user) */}
          <div className="flex flex-wrap items-center gap-3">
            {accessibleUnits.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-500 ml-2" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">Unit:</span>
                <select
                  value={currentUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  aria-label="Select Unit Workspace"
                  className="select select-sm bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {accessibleUnits.map((u) => (
                    <option key={u.id || u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Link to Job Requests List */}
            <Link
              to="/portal/job-requests"
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border-none shadow-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>All Job Requests</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Tasks</span>
              <span className="text-xl font-black text-slate-900">{stats.total}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Incomplete</span>
              </div>
              <span className="text-xl font-black text-rose-900">{stats.unfinished}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Completed</span>
              </div>
              <span className="text-xl font-black text-emerald-900">{stats.completed}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Completion Rate</span>
              <span className="text-xl font-black text-indigo-900">{stats.rate}%</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {isKanbanEnabled && (
          <button
            onClick={() => handleTabChange('kanban')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'kanban'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Kanban Board</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${activeTab === 'kanban' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {kanbanJobs.length}
            </span>
          </button>
        )}

        <button
          onClick={() => handleTabChange('calendar')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Content Calendar</span>
        </button>

        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Charts & Metrics</span>
        </button>

        <button
          onClick={() => handleTabChange('reports')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Weekly Reports</span>
        </button>
      </div>

      {/* 3. TAB 1: KANBAN BOARD (Exclusively for Social Media Unit) */}
      {isKanbanEnabled && activeTab === 'kanban' && (
        <div
          className={`space-y-4 transition-all duration-300 ${
            isKanbanFullscreen
              ? 'fixed inset-0 z-50 bg-slate-100 p-4 md:p-6 flex flex-col h-screen w-screen overflow-hidden'
              : ''
          }`}
        >
          {/* Top Fullscreen Header (only visible in fullscreen) */}
          {isKanbanFullscreen && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  📱
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span>Social Media Kanban Board</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
                      ⛶ Full View Whiteboard
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Paparan penuh interaktif • Tekan <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">Esc</kbd> atau klik 'Exit Full View' untuk kembali
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Fit Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setKanbanFitMode((prev) => (prev === 'fit' ? 'scroll' : 'fit'))}
                  className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  title={kanbanFitMode === 'fit' ? 'Switch to scrollable 320px columns' : 'Fit all columns to screen'}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{kanbanFitMode === 'fit' ? 'Fit Screen' : 'Scrollable (320px)'}</span>
                </button>

                {/* Exit Full View Button */}
                <button
                  type="button"
                  onClick={() => setIsKanbanFullscreen(false)}
                  className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl border-none shadow-sm flex items-center gap-1.5"
                  title="Exit Full View (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Full View</span>
                </button>
              </div>
            </div>
          )}

          {/* Board Filters & Actions */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search cards, tickets, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm input-bordered w-full pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              {/* Staff Filter */}
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="select select-sm select-bordered bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Assigned Staff</option>
                  {unitStaffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Fit Mode Toggle in normal toolbar */}
              {!isKanbanFullscreen && (
                <button
                  type="button"
                  onClick={() => setKanbanFitMode((prev) => (prev === 'fit' ? 'scroll' : 'fit'))}
                  className="btn btn-sm bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  title={kanbanFitMode === 'fit' ? 'Switch to scrollable 320px columns' : 'Fit all columns to screen'}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">{kanbanFitMode === 'fit' ? 'Fit Screen' : 'Scrollable'}</span>
                </button>
              )}

              {/* Full View Toggle Button */}
              <button
                type="button"
                onClick={() => setIsKanbanFullscreen((prev) => !prev)}
                className={`btn btn-sm rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs ${
                  isKanbanFullscreen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300'
                }`}
                title={isKanbanFullscreen ? 'Exit Full View (Esc)' : 'Expand Kanban to Full View'}
              >
                {isKanbanFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Exit Full View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Full View</span>
                  </>
                )}
              </button>

              {/* Head Unit Add Column Control */}
              {canManageColumns && (
                <button
                  onClick={() => setShowAddColumnModal(true)}
                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl border-none shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Column</span>
                </button>
              )}
            </div>
          </div>

          {/* Color Rule Guide Banner */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-extrabold text-slate-600">Card Status Legend:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold border border-purple-200">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Staff Processing</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-100 text-teal-800 font-bold border border-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span>Head Unit Approval</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 font-bold border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Manager Approval</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              💡 Drag and drop cards or select stage to update workflow
            </span>
          </div>

          {/* Kanban Columns Horizontal Container */}
          <div className={`flex gap-4 overflow-x-auto pb-6 pt-1 items-start ${isKanbanFullscreen ? 'flex-1 min-h-0' : 'min-h-[550px]'}`}>
            {kanbanColumns.map((col, index) => {
              const rawColJobs = kanbanJobs.filter((job) => getJobStageId(job) === col.id);
              const orderList = stageOrders[col.id];
              const colJobs = orderList && orderList.length > 0
                ? [...rawColJobs].sort((a, b) => {
                    const idxA = orderList.indexOf(a.id);
                    const idxB = orderList.indexOf(b.id);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return b.id - a.id;
                  })
                : rawColJobs;

              const isColumnDraggedOver = Boolean(canMoveCards && dragOverColId === col.id);
              // Filter out the dragged card if it is in this column so the drop slot represents where it will land!
              const displayJobs = isColumnDraggedOver && draggedJobId
                ? colJobs.filter((j) => j.id !== draggedJobId)
                : colJobs;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    if (!canMoveCards || !draggedJobId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColId !== col.id) {
                      setDragOverColId(col.id);
                    }
                  }}
                  onDragEnter={(e) => {
                    if (!canMoveCards || !draggedJobId) return;
                    e.preventDefault();
                    setDragOverColId(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (!canMoveCards) return;
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverColId === col.id) {
                      setDragOverColId(null);
                      setDragOverIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!canMoveCards) return;
                    e.preventDefault();
                    const idStr = e.dataTransfer.getData('text/plain');
                    const jobId = idStr ? Number(idStr) : draggedJobId;
                    const targetSlot = dragOverIndex !== null ? dragOverIndex : displayJobs.length;
                    if (jobId) {
                      handleDropCard(jobId, col.id, targetSlot);
                    }
                    setDraggedJobId(null);
                    setDragOverColId(null);
                    setDragOverIndex(null);
                  }}
                  className={`rounded-3xl border p-4 space-y-3.5 flex flex-col transition-all duration-200 ${
                    kanbanFitMode === 'fit'
                      ? 'flex-1 min-w-[240px] max-w-sm shrink-0 xl:shrink'
                      : 'w-80 shrink-0'
                  } ${
                    isKanbanFullscreen ? 'h-full max-h-full' : ''
                  } ${
                    isColumnDraggedOver
                      ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/60 shadow-lg scale-[1.01]'
                      : 'bg-slate-100/90 border-slate-200/80 shadow-xs'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 truncate">
                        {col.label}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200 shadow-2xs">
                        {colJobs.length}
                      </span>
                    </div>

                    {/* Column Edit / Move Controls for Head Unit */}
                    {canManageColumns && (
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveColumn(index, 'left')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
                            title="Move column left"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {index < kanbanColumns.length - 1 && (
                          <button
                            onClick={() => handleMoveColumn(index, 'right')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
                            title="Move column right"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingColumn(col)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white"
                          title="Rename column"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {kanbanColumns.length > 1 && (
                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white"
                            title="Delete column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cards inside this Column */}
                  <div
                    onDragOver={(e) => {
                      if (!canMoveCards || !draggedJobId) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverColId !== col.id) {
                        setDragOverColId(col.id);
                      }
                      if (displayJobs.length === 0) {
                        setDragOverIndex(0);
                      }
                    }}
                    className={`space-y-3 flex-1 overflow-y-auto pr-1 ${
                      isKanbanFullscreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-[70vh]'
                    }`}
                  >
                    {displayJobs.length === 0 ? (
                      <div
                        onDragOver={(e) => {
                          if (!canMoveCards || !draggedJobId) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverColId(col.id);
                          setDragOverIndex(0);
                        }}
                        onDrop={(e) => {
                          if (!canMoveCards) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const idStr = e.dataTransfer.getData('text/plain');
                          const jobId = idStr ? Number(idStr) : draggedJobId;
                          if (jobId) {
                            handleDropCard(jobId, col.id, 0);
                          }
                          setDraggedJobId(null);
                          setDragOverColId(null);
                          setDragOverIndex(null);
                        }}
                        className={`p-6 text-center border-2 border-dashed rounded-2xl text-xs font-bold transition-all duration-200 ${
                          isColumnDraggedOver
                            ? 'border-indigo-500 bg-indigo-100/80 text-indigo-700 ring-2 ring-indigo-300 shadow-sm animate-pulse scale-[1.01]'
                            : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {isColumnDraggedOver ? '⇩ Drop Card Here (Position #1)' : 'No tasks in this stage'}
                      </div>
                    ) : (
                      <>
                        {displayJobs.map((job, idx) => {
                          const isDone = isJobCompleted(job);
                          const cFields = job.additional_data?.custom_fields_data || {};
                          const pillars = cFields.pillar || cFields.Pillar;
                          const category = cFields.category || cFields.Category;
                          const isThisCardDragged = draggedJobId === job.id;

                          return (
                            <React.Fragment key={job.id}>
                              {/* Animated Opening Slot: Appears before this card when hovering over this position */}
                              {isColumnDraggedOver && dragOverIndex === idx && (
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverColId(col.id);
                                    setDragOverIndex(idx);
                                  }}
                                  onDrop={(e) => {
                                    if (!canMoveCards) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const idStr = e.dataTransfer.getData('text/plain');
                                    const jobId = idStr ? Number(idStr) : draggedJobId;
                                    if (jobId) {
                                      handleDropCard(jobId, col.id, idx);
                                    }
                                    setDraggedJobId(null);
                                    setDragOverColId(null);
                                    setDragOverIndex(null);
                                  }}
                                  className="h-16 rounded-2xl border-2 border-dashed border-indigo-500 bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-indigo-50/95 flex items-center justify-center gap-2 text-indigo-700 shadow-sm transition-all duration-200 ease-out animate-pulse ring-2 ring-indigo-300/60 my-2"
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                                    ⇩ Drop Card Here (Position #{idx + 1})
                                  </span>
                                </div>
                              )}

                              {/* Kanban Card */}
                              <div
                                draggable={canMoveCards}
                                onDragStart={(e) => {
                                  if (!canMoveCards) return;
                                  e.dataTransfer.setData('text/plain', String(job.id));
                                  e.dataTransfer.effectAllowed = 'move';

                                  // Physical lift effect: Tilt and elevate so browser drag ghost is tilted!
                                  const el = e.currentTarget;
                                  el.style.transform = 'rotate(-3deg) scale(1.03)';
                                  el.style.boxShadow = '0 25px 30px -5px rgba(99, 102, 241, 0.35)';

                                  setTimeout(() => {
                                    el.style.transform = '';
                                    el.style.boxShadow = '';
                                    setDraggedJobId(job.id);
                                  }, 0);
                                }}
                                onDragEnd={() => {
                                  setDraggedJobId(null);
                                  setDragOverColId(null);
                                  setDragOverIndex(null);
                                }}
                                onDragOver={(e) => {
                                  if (!canMoveCards || !draggedJobId) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';

                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const relY = e.clientY - rect.top;
                                  const isBottomHalf = relY > rect.height / 2;
                                  const targetSlot = isBottomHalf ? idx + 1 : idx;

                                  if (dragOverColId !== col.id || dragOverIndex !== targetSlot) {
                                    setDragOverColId(col.id);
                                    setDragOverIndex(targetSlot);
                                  }
                                }}
                                onDrop={(e) => {
                                  if (!canMoveCards) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const relY = e.clientY - rect.top;
                                  const isBottomHalf = relY > rect.height / 2;
                                  const targetSlot = isBottomHalf ? idx + 1 : idx;
                                  const idStr = e.dataTransfer.getData('text/plain');
                                  const jobId = idStr ? Number(idStr) : draggedJobId;
                                  if (jobId) {
                                    handleDropCard(jobId, col.id, targetSlot);
                                  }
                                  setDraggedJobId(null);
                                  setDragOverColId(null);
                                  setDragOverIndex(null);
                                }}
                                className={`p-4 rounded-2xl transition-all duration-200 ease-out space-y-2.5 select-none bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 border-l-4 ${
                                  isDone
                                    ? 'border-l-emerald-500 hover:border-emerald-400'
                                    : job.status === 'manager_approval'
                                    ? (Boolean(job.additional_data?.is_inter_unit || job.ticket_no?.startsWith('IU')) ? 'border-l-teal-500 hover:border-teal-400' : 'border-l-blue-500 hover:border-blue-400')
                                    : job.status === 'on_hold'
                                    ? 'border-l-amber-500 hover:border-amber-400'
                                    : 'border-l-purple-500 hover:border-purple-400'
                                } ${
                                  canMoveCards
                                    ? 'cursor-grab active:cursor-grabbing active:-rotate-2 active:scale-[1.03] active:shadow-2xl active:border-indigo-400 active:ring-2 active:ring-indigo-300'
                                    : 'cursor-default'
                                } ${
                                  isThisCardDragged
                                    ? 'opacity-35 scale-[0.98] border-2 border-dashed border-indigo-400 bg-indigo-50/40 -rotate-1'
                                    : ''
                                }`}
                              >
                                {/* Card Header: Ticket No + Exact CDI Status Badge */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    {canMoveCards && <GripVertical className="w-3.5 h-3.5 shrink-0 hover:text-slate-600" />}
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                      {job.ticket_no}
                                    </span>
                                  </div>
                                  {renderCardStatusBadge(job)}
                                </div>

                                {/* Job Title */}
                                <Link
                                  to={`/portal/job-requests/${job.id}`}
                                  className="font-extrabold text-xs text-slate-900 hover:text-indigo-600 line-clamp-2 block tracking-tight"
                                >
                                  {job.title}
                                </Link>

                                {/* Client & Project */}
                                {(job.client_name || job.project_name) && (
                                  <div className="text-[11px] text-slate-500 font-medium truncate">
                                    {job.client_name || 'Direct Task'} {job.project_name ? `• ${job.project_name}` : ''}
                                  </div>
                                )}

                                {/* Tags: Pillars & Category */}
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                  {job.additional_data?.is_direct_task && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      Direct Work
                                    </span>
                                  )}
                                  {category && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {category}
                                    </span>
                                  )}
                                  {pillars && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      {Array.isArray(pillars) ? pillars.join(', ') : pillars}
                                    </span>
                                  )}
                                </div>

                                {/* Footer: Date & Assignees */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                  <div className="flex items-center gap-1 truncate font-semibold">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>{job.deadline ? new Date(job.deadline).toLocaleDateString() : job.start_date || 'No Date'}</span>
                                  </div>

                                  {/* Assignees initials */}
                                  <div className="flex items-center -space-x-1 shrink-0">
                                    {Array.isArray(job.assigned_staff || job.assigned_staff_details) &&
                                      (job.assigned_staff || job.assigned_staff_details).slice(0, 3).map((s: any) => (
                                        <span
                                          key={s.id}
                                          className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 border border-white flex items-center justify-center font-black text-[9px]"
                                          title={s.name}
                                        >
                                          {(s.name || '?')[0]}
                                        </span>
                                      ))}
                                  </div>
                                </div>

                                {/* Quick Move Stage Dropdown (Head Unit / Admin only) or Read-Only Stage Badge */}
                                {canMoveCards ? (
                                  <div className="pt-1 flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Move to:
                                    </span>
                                    <select
                                      value={col.id}
                                      onChange={(e) => handleMoveCard(job.id, e.target.value)}
                                      className="select select-xs select-bordered bg-slate-50 border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                                    >
                                      {kanbanColumns.map((targetOption) => (
                                        <option key={targetOption.id} value={targetOption.id}>
                                          {targetOption.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Stage:
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50/80 border border-indigo-100/80 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                                      {col.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          );
                        })}

                        {/* Animated Opening Slot at the bottom of the column */}
                        {isColumnDraggedOver && dragOverIndex === displayJobs.length && (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverColId(col.id);
                              setDragOverIndex(displayJobs.length);
                            }}
                            onDrop={(e) => {
                              if (!canMoveCards) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const idStr = e.dataTransfer.getData('text/plain');
                              const jobId = idStr ? Number(idStr) : draggedJobId;
                              if (jobId) {
                                handleDropCard(jobId, col.id, displayJobs.length);
                              }
                              setDraggedJobId(null);
                              setDragOverColId(null);
                              setDragOverIndex(null);
                            }}
                            className="h-16 rounded-2xl border-2 border-dashed border-indigo-500 bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-indigo-50/95 flex items-center justify-center gap-2 text-indigo-700 shadow-sm transition-all duration-200 ease-out animate-pulse ring-2 ring-indigo-300/60 my-2"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                              ⇩ Drop Card Here (Position #{displayJobs.length + 1})
                            </span>
                          </div>
                        )}

                        {/* Bottom Drop Zone / Spacer */}
                        <div
                          onDragOver={(e) => {
                            if (!canMoveCards || !draggedJobId) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverColId(col.id);
                            setDragOverIndex(displayJobs.length);
                          }}
                          onDrop={(e) => {
                            if (!canMoveCards) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const idStr = e.dataTransfer.getData('text/plain');
                            const jobId = idStr ? Number(idStr) : draggedJobId;
                            if (jobId) {
                              handleDropCard(jobId, col.id, displayJobs.length);
                            }
                            setDraggedJobId(null);
                            setDragOverColId(null);
                            setDragOverIndex(null);
                          }}
                          className="h-8 w-full shrink-0"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: CONTENT CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Schedule and task deadlines for {currentUnit} Unit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="btn btn-sm btn-ghost btn-circle text-slate-600 hover:bg-slate-100"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border-none"
              >
                Today
              </button>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="btn btn-sm btn-ghost btn-circle text-slate-600 hover:bg-slate-100"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Day Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-purple-600">Sat</div>
            <div className="text-rose-600">Sun</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayObj, i) => {
              const dayJobs = getJobsForDate(dayObj.date);
              const isToday = dayObj.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[110px] md:min-h-[130px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    dayObj.isCurrentMonth
                      ? isToday
                        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-100 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white font-black'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>

                    {dayJobs.length > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                        {dayJobs.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks on this day */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[90px]">
                    {dayJobs.map((j) => {
                      const isDone = isJobCompleted(j);
                      return (
                        <Link
                          key={j.id}
                          to={`/portal/job-requests/${j.id}`}
                          className={`block p-1 rounded-lg text-[10px] font-bold truncate transition-all ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-900 border-l-2 border-l-emerald-600 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-900 border-l-2 border-l-rose-600 hover:bg-rose-200'
                          }`}
                          title={`${j.ticket_no}: ${j.title}`}
                        >
                          {isDone ? '🟢 ' : '🔴 '}
                          {j.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: CHARTS & METRICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Grid: Work Status Breakdown + Active Tasks Schedule Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Status Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Work Status Breakdown
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">Total: {stats.total}</span>
              </div>

              {/* Visual Bars */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-rose-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
                      <span>Incomplete (In Progress / Review)</span>
                    </span>
                    <span className="text-slate-800">{stats.unfinished} ({stats.total > 0 ? Math.round((stats.unfinished / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.total > 0 ? (stats.unfinished / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-emerald-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
                      <span>Completed (Published / Done)</span>
                    </span>
                    <span className="text-slate-800">{stats.completed} ({stats.rate}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Tasks Schedule Summary (Replaces Content Pillar Breakdown) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                      Active Schedule Overview
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Timeline signals for incomplete jobs ({currentUnit})</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black">
                  {ganttData.totalIncomplete} Active
                </span>
              </div>

              {/* 4 Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incomplete</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5 block">{ganttData.totalIncomplete}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Overlapping</span>
                  <span className="text-lg font-black text-amber-800 mt-0.5 block">{ganttData.overlapCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Overdue</span>
                  <span className="text-lg font-black text-rose-800 mt-0.5 block">{ganttData.overdueCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">On Track</span>
                  <span className="text-lg font-black text-emerald-800 mt-0.5 block">{ganttData.onTrackCount}</span>
                </div>
              </div>

              {/* Quick Notice Banner */}
              <div className="pt-1">
                {ganttData.overlapCount > 0 ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>{ganttData.overlapCount} tasks</strong> share overlapping timeframe windows in the schedule below.</span>
                  </div>
                ) : ganttData.overdueCount > 0 ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/60 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>{ganttData.overdueCount} tasks</strong> have passed their planned deadline dates.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All active incomplete tasks are operating on clear schedules.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Incomplete Tasks Schedule & Overlap Timeline (Gantt Chart) */}
          <div id="gantt-section" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 scroll-mt-24">
            {/* Gantt Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 tracking-tight">
                      Active Tasks Schedule & Overlap Timeline (Gantt)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                      Incomplete Tasks Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Visualizing active task duration (Start Date to Deadline) and identifying concurrent schedule overlaps for {currentUnit}.
                  </p>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Mode Switch: By Staff vs By Task */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setGanttViewMode('staff')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      ganttViewMode === 'staff'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>By Staff (Resource)</span>
                    {ganttData.totalStaffWithOverlaps > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-black">
                        {ganttData.totalStaffWithOverlaps} overlap
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setGanttViewMode('task')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      ganttViewMode === 'task'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>By Task</span>
                  </button>
                </div>

                {/* Staff Selector Dropdown (Cadangan 1 Dropdown) */}
                <div className="relative min-w-[210px]">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <select
                    value={ganttSelectedStaff}
                    onChange={(e) => setGanttSelectedStaff(e.target.value)}
                    className={`select select-sm select-bordered w-full pl-8 pr-8 rounded-xl text-xs font-black transition-all shadow-xs ${
                      ganttSelectedStaff !== 'all'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200/50'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    title="Filter by assigned staff member"
                  >
                    <option value="all">👥 All Staff ({ganttData.staffGroups.length})</option>
                    {ganttData.staffGroups.map((g) => (
                      <option key={g.staffName} value={g.staffName}>
                        {g.hasStaffOverlap ? '⚠️ ' : ''}{g.staffName} ({g.totalTasks} {g.totalTasks === 1 ? 'task' : 'tasks'}{g.hasStaffOverlap ? ` • ${g.staffOverlapCount} overlap` : ''})
                      </option>
                    ))}
                    {ganttData.unassignedJobs.length > 0 && (
                      <option value="__unassigned__">👤 Unassigned ({ganttData.unassignedJobs.length})</option>
                    )}
                  </select>
                  {ganttSelectedStaff !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setGanttSelectedStaff('all')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 font-black text-xs z-10 p-0.5"
                      title="Clear staff filter"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Expand / Collapse All (in By Staff mode) */}
                {ganttViewMode === 'staff' && ganttData.staffGroups.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={expandAllStaff}
                      className="text-slate-600 hover:text-indigo-600 transition-colors px-1 py-0.5"
                      title="Expand all staff groups"
                    >
                      Expand All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => collapseAllStaff(ganttData.staffGroups.map((g) => g.staffName))}
                      className="text-slate-600 hover:text-indigo-600 transition-colors px-1 py-0.5"
                      title="Collapse all staff groups"
                    >
                      Collapse All
                    </button>
                  </div>
                )}

                {/* Search Input */}
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ticket / title..."
                    value={ganttSearch}
                    onChange={(e) => setGanttSearch(e.target.value)}
                    className="input input-sm input-bordered w-full pl-8 rounded-xl text-xs font-medium focus:border-indigo-600"
                  />
                  {ganttSearch && (
                    <button
                      onClick={() => setGanttSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setGanttFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      ganttFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({ganttData.totalIncomplete})
                  </button>
                  <button
                    onClick={() => setGanttFilter('overlap')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                      ganttFilter === 'overlap'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    <span>Overlapping</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-current">
                      {ganttData.overlapCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setGanttFilter('overdue')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                      ganttFilter === 'overdue'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-rose-700 hover:text-rose-900'
                    }`}
                  >
                    <span>Overdue</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-400/30 text-current">
                      {ganttData.overdueCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0" />
                  <span className="font-extrabold text-slate-700 text-[11px]">Normal Active Task</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 shrink-0" />
                  <span className="font-extrabold text-amber-800 text-[11px]">Schedule Overlap (Concurrent)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3 rounded-md bg-gradient-to-r from-rose-500 to-red-600 shrink-0" />
                  <span className="font-extrabold text-rose-800 text-[11px]">Overdue (Past Deadline)</span>
                </div>
                <button
                  type="button"
                  onClick={scrollToToday}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200 cursor-pointer"
                  title="Click to jump to Today's timeline marker"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200 shrink-0" />
                  <span className="font-extrabold text-indigo-700 text-[11px]">Today (Jump)</span>
                </button>
              </div>
              <div className="text-[11px] font-semibold text-slate-400">
                {ganttSelectedStaff !== 'all' ? (
                  <span className="text-indigo-600 font-bold">
                    Filtered to: {ganttSelectedStaff === '__unassigned__' ? 'Unassigned' : ganttSelectedStaff} •{' '}
                  </span>
                ) : null}
                {ganttViewMode === 'staff'
                  ? `Showing ${filteredGanttStaffGroups.length} staff member${filteredGanttStaffGroups.length === 1 ? '' : 's'} (${filteredGanttStaffGroups.reduce((acc, g) => acc + g.tasks.length, 0)} tasks) of ${ganttData.totalIncomplete} incomplete tasks`
                  : `Showing ${filteredGanttJobs.length} of ${ganttData.totalIncomplete} incomplete tasks`}
              </div>
            </div>

            {/* Gantt Timeline Container */}
            {ganttData.totalIncomplete === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-black text-slate-800 text-sm">No Incomplete Tasks Scheduled</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All jobs for {currentUnit} are currently completed or published. New tasks will appear here automatically when created.
                </p>
              </div>
            ) : (ganttViewMode === 'staff' ? (filteredGanttStaffGroups.length === 0 && filteredUnassignedJobs.length === 0) : filteredGanttJobs.length === 0) ? (
              <div className="p-10 text-center rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <p className="text-xs text-slate-500 font-medium">No tasks found matching your filter criteria.</p>
                <button
                  onClick={() => {
                    setGanttFilter('all');
                    setGanttSearch('');
                    setGanttSelectedStaff('all');
                  }}
                  className="btn btn-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold border-none"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div ref={ganttScrollRef} className="overflow-x-auto scroll-smooth">
                  <div
                    className="inline-flex flex-col min-w-full"
                    style={{ minWidth: `${320 + ganttData.timelineDays.length * 48}px` }}
                  >
                    {/* HEADER ROW 1: MONTH GROUPINGS */}
                    <div className="flex border-b border-slate-200 bg-slate-100/90 text-xs">
                      <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-30 bg-slate-100/95 border-r border-slate-200 px-4 py-2 font-black text-slate-700 uppercase tracking-wider text-[11px] shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        {ganttViewMode === 'staff' ? 'Staff Member & Assigned Tasks' : 'Task & Staff Details'}
                      </div>
                      <div className="flex">
                        {ganttData.monthHeaders.map((m, idx) => (
                          <div
                            key={idx}
                            className="font-black text-slate-700 uppercase tracking-wider text-[11px] py-2 text-center border-r border-slate-200 shrink-0"
                            style={{ width: `${m.span * 48}px` }}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HEADER ROW 2: DAY NAMES & DATES */}
                    <div className="flex border-b border-slate-200 bg-slate-50 text-[10px]">
                      <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-30 bg-slate-50 border-r border-slate-200 px-4 py-2 font-extrabold text-slate-400 uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex items-center justify-between">
                        <span>{ganttViewMode === 'staff' ? 'Staff / Task Name' : 'Job Name & Status'}</span>
                        <span>Dates</span>
                      </div>
                      <div className="flex">
                        {ganttData.timelineDays.map((day) => (
                          <div
                            key={day.dateStr}
                            className={`w-[48px] min-w-[48px] py-1.5 text-center border-r border-slate-200/80 shrink-0 flex flex-col items-center justify-center transition-colors ${
                              day.isToday
                                ? 'bg-indigo-50/90 font-black text-indigo-700'
                                : day.isWeekend
                                ? 'bg-slate-100/60 text-slate-400 font-bold'
                                : 'text-slate-600 font-bold'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tighter opacity-80">{day.dayName}</span>
                            <span
                              className={`text-[11px] leading-tight ${
                                day.isToday ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black mt-0.5' : ''
                              }`}
                            >
                              {day.dayNum}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BODY ROWS: CONDITIONAL BY STAFF (RESOURCE) VS BY TASK */}
                    {ganttViewMode === 'staff' ? (
                      <div className="divide-y divide-slate-100">
                        {/* 1. Grouped Staff Rows */}
                        {filteredGanttStaffGroups.map((group) => {
                          const expanded = isStaffExpanded(group.staffName);

                          return (
                            <div key={group.staffName} className="flex flex-col border-b border-slate-100 last:border-b-0">
                              {/* Staff Parent Row */}
                              <div
                                onClick={() => toggleStaffExpand(group.staffName)}
                                className="flex bg-slate-50/90 hover:bg-slate-100/80 cursor-pointer transition-colors border-b border-slate-200/70 select-none group/staff"
                              >
                                {/* Sticky Left: Staff Info Header */}
                                <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-20 bg-slate-50/95 group-hover/staff:bg-slate-100/90 border-r border-slate-200 px-3.5 py-2 shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex flex-col justify-center gap-1.5">
                                  {/* Row 1: Chevron, Avatar, Full Staff Name */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStaffExpand(group.staffName);
                                      }}
                                    >
                                      {expanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      )}
                                    </button>
                                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 shadow-xs border border-slate-200/80 bg-slate-100 flex items-center justify-center">
                                      {group.staffAvatarUrl ? (
                                        <img src={group.staffAvatarUrl} alt={group.staffName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                          <User className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="font-black text-xs text-slate-900 tracking-tight block truncate">
                                        {group.staffName}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Row 2: Overlap, Overdue, Total Tasks */}
                                  <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                                    {group.hasStaffOverlap && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 animate-pulse">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span>{group.staffOverlapCount} OVERLAP</span>
                                      </span>
                                    )}
                                    {group.staffOverdueCount > 0 && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                        {group.staffOverdueCount} OVERDUE
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200/80 text-slate-700">
                                      {group.totalTasks} {group.totalTasks === 1 ? 'task' : 'tasks'}
                                    </span>
                                  </div>
                                </div>

                                {/* Right Timeline Grid Header Area */}
                                <div className="relative flex items-center h-14 shrink-0">
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {ganttData.timelineDays.map((day) => (
                                      <div
                                        key={day.dateStr}
                                        className={`w-[48px] min-w-[48px] h-full border-r border-slate-200/50 shrink-0 ${
                                          day.isToday
                                            ? 'bg-indigo-50/30 border-r border-indigo-300/80'
                                            : day.isWeekend
                                            ? 'bg-slate-100/50'
                                            : ''
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Child Tasks for this Staff */}
                              {expanded && (
                                <div className="divide-y divide-slate-100">
                                  {group.tasks.map((item) => {
                                    const barLeft = item.startIndex * 48 + 4;
                                    const barWidth = Math.max(40, item.spanDays * 48 - 8);

                                    return (
                                      <div key={item.job.id} className="flex hover:bg-slate-50/60 transition-colors group">
                                        {/* Left Sticky Column */}
                                        <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50/90 border-r border-slate-200 pl-8 pr-3.5 py-2.5 shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-1">
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded-md border border-indigo-200/60">
                                                {item.job.ticket_no || `#${item.job.id}`}
                                              </span>
                                              {item.isOverdue && (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 animate-pulse border border-rose-200">
                                                  OVERDUE
                                                </span>
                                              )}
                                              {item.isSelfStaffOverlap && (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                                  OVERLAP
                                                </span>
                                              )}
                                              {item.job.status && (
                                                <span className="text-[9px] font-bold text-slate-400 capitalize">
                                                  • {item.job.status.replace(/_/g, ' ')}
                                                </span>
                                              )}
                                            </div>

                                            {/* Job Title Link */}
                                            <Link
                                              to={`/portal/job-requests/${item.job.id}`}
                                              className="font-extrabold text-xs text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block mt-1 tracking-tight"
                                              title={item.job.title}
                                            >
                                              {item.job.title}
                                            </Link>
                                          </div>

                                          {/* Dates & Duration */}
                                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                                            <span className="font-semibold text-slate-500">
                                              {item.start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {item.deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                              {item.durationDays}d
                                            </span>
                                          </div>
                                        </div>

                                        {/* Right Timeline Grid Area */}
                                        <div className="relative flex items-center h-16 shrink-0">
                                          {/* Vertical Grid Lines */}
                                          <div className="absolute inset-0 flex pointer-events-none">
                                            {ganttData.timelineDays.map((day) => (
                                              <div
                                                key={day.dateStr}
                                                className={`w-[48px] min-w-[48px] h-full border-r border-slate-100 shrink-0 ${
                                                  day.isToday
                                                    ? 'bg-indigo-50/30 border-r border-indigo-300/80'
                                                    : day.isWeekend
                                                    ? 'bg-slate-50/60'
                                                    : ''
                                                }`}
                                              />
                                            ))}
                                          </div>

                                          {/* Gantt Bar */}
                                          <Link
                                            to={`/portal/job-requests/${item.job.id}`}
                                            className={`absolute top-2.5 bottom-2.5 rounded-xl flex items-center px-3 cursor-pointer transition-all hover:scale-[1.01] hover:brightness-105 group/bar shadow-md ${
                                              item.isOverdue
                                                ? 'bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400 text-white shadow-rose-500/20'
                                                : item.isSelfStaffOverlap
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-400 text-white shadow-amber-500/20 ring-2 ring-amber-300/40'
                                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-400 text-white shadow-indigo-500/20'
                                            }`}
                                            style={{
                                              left: `${barLeft}px`,
                                              width: `${barWidth}px`,
                                            }}
                                            title={`[${item.job.ticket_no || `#${item.job.id}`}] ${item.job.title}\nAssigned: ${group.staffName}\nDates: ${item.start.toLocaleDateString()} to ${item.deadline.toLocaleDateString()} (${item.durationDays}d)\n${
                                              item.isOverdue ? '⚠️ OVERDUE!\n' : ''
                                            }${item.isSelfStaffOverlap ? `⚠️ Concurrent with: ${item.selfStaffOverlappingTickets.join(', ')}` : ''}`}
                                          >
                                            <div className="flex items-center justify-between w-full overflow-hidden text-xs">
                                              <div className="flex items-center gap-1.5 truncate">
                                                {item.isOverdue ? (
                                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                ) : item.isSelfStaffOverlap ? (
                                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                ) : (
                                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                                )}
                                                <span className="font-extrabold truncate tracking-tight text-[11px]">
                                                  {item.job.ticket_no ? `${item.job.ticket_no} - ` : ''}{item.job.title}
                                                </span>
                                              </div>
                                              <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                                {item.durationDays}d
                                              </span>
                                            </div>
                                          </Link>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 2. Unassigned Tasks Section (if any) */}
                        {filteredUnassignedJobs.length > 0 && (
                          <div className="flex flex-col border-t-2 border-dashed border-slate-200">
                            {/* Unassigned Header */}
                            <div className="flex bg-slate-50/90 border-b border-slate-200">
                              <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-20 bg-slate-50/95 border-r border-slate-200 px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[11px] shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex items-center justify-between">
                                <span>Unassigned Tasks</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-600">
                                  {filteredUnassignedJobs.length}
                                </span>
                              </div>
                              <div className="relative flex items-center h-8 shrink-0">
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {ganttData.timelineDays.map((day) => (
                                    <div key={day.dateStr} className="w-[48px] min-w-[48px] h-full border-r border-slate-200/50 shrink-0" />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Unassigned Child Rows */}
                            <div className="divide-y divide-slate-100">
                              {filteredUnassignedJobs.map((item) => {
                                const barLeft = item.startIndex * 48 + 4;
                                const barWidth = Math.max(40, item.spanDays * 48 - 8);

                                return (
                                  <div key={item.job.id} className="flex hover:bg-slate-50/60 transition-colors group">
                                    <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50/90 border-r border-slate-200 pl-6 pr-3.5 py-2.5 shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-1">
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.2 rounded-md border border-slate-200">
                                            {item.job.ticket_no || `#${item.job.id}`}
                                          </span>
                                          {item.isOverdue && (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 animate-pulse border border-rose-200">
                                                  OVERDUE
                                                </span>
                                              )}
                                        </div>
                                        <Link
                                          to={`/portal/job-requests/${item.job.id}`}
                                          className="font-extrabold text-xs text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block mt-1 tracking-tight"
                                        >
                                          {item.job.title}
                                        </Link>
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                                        <span className="text-slate-400 italic">No staff assigned</span>
                                        <span className="font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                          {item.durationDays}d
                                        </span>
                                      </div>
                                    </div>

                                    <div className="relative flex items-center h-16 shrink-0">
                                      <div className="absolute inset-0 flex pointer-events-none">
                                        {ganttData.timelineDays.map((day) => (
                                          <div key={day.dateStr} className="w-[48px] min-w-[48px] h-full border-r border-slate-100 shrink-0" />
                                        ))}
                                      </div>

                                      <Link
                                        to={`/portal/job-requests/${item.job.id}`}
                                        className="absolute top-2.5 bottom-2.5 rounded-xl flex items-center px-3 cursor-pointer bg-slate-400 text-white shadow-sm hover:bg-slate-500 transition-colors"
                                        style={{ left: `${barLeft}px`, width: `${barWidth}px` }}
                                      >
                                        <span className="text-[11px] font-bold truncate">
                                          {item.job.ticket_no ? `${item.job.ticket_no} - ` : ''}{item.job.title}
                                        </span>
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* By Task View (Original Flat List) */
                      <div className="divide-y divide-slate-100">
                        {filteredGanttJobs.map((item) => {
                          const barLeft = item.startIndex * 48 + 4;
                          const barWidth = Math.max(40, item.spanDays * 48 - 8);

                          return (
                            <div key={item.job.id} className="flex hover:bg-slate-50/60 transition-colors group">
                              {/* Left Sticky Column */}
                              <div className="w-80 min-w-[320px] shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50/90 border-r border-slate-200 p-3.5 shadow-[2px_0_5px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-1.5">
                                <div>
                                  {/* Ticket & Badges */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                                      {item.job.ticket_no || `#${item.job.id}`}
                                    </span>
                                    {item.isOverdue && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 animate-pulse border border-rose-200">
                                        OVERDUE
                                      </span>
                                    )}
                                    {item.hasOverlap && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                        OVERLAP
                                      </span>
                                    )}
                                    {item.job.status && (
                                      <span className="text-[9px] font-bold text-slate-400 capitalize">
                                        • {item.job.status.replace(/_/g, ' ')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Job Title */}
                                  <Link
                                    to={`/portal/job-requests/${item.job.id}`}
                                    className="font-extrabold text-xs text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block mt-1 tracking-tight"
                                    title={item.job.title}
                                  >
                                    {item.job.title}
                                  </Link>

                                  {/* Client & Project Name */}
                                  {(item.job.client_name || item.job.project_name) && (
                                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                      {item.job.client_name} {item.job.project_name ? `• ${item.job.project_name}` : ''}
                                    </p>
                                  )}

                                  {/* Overlap Details Callout */}
                                  {item.hasOverlap && (
                                    <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[10px] text-amber-900 space-y-0.5">
                                      <div className="flex items-center gap-1 font-black">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>Overlaps with {item.overlappingJobs.length} {item.overlappingJobs.length === 1 ? 'task' : 'tasks'}:</span>
                                      </div>
                                      <div className="text-[9px] text-amber-800/90 font-semibold line-clamp-1">
                                        {item.overlappingJobs.map((o) => o.ticket_no).join(', ')}
                                      </div>
                                      {item.hasStaffOverlap && (
                                        <div className="text-[9px] text-amber-950 font-bold">
                                          Same staff: {item.sharedStaff.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Assignees & Duration */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                                  <div className="truncate max-w-[170px] font-bold text-slate-700">
                                    {item.staffNames.length > 0 ? (
                                      <span>👤 {item.staffNames.join(', ')}</span>
                                    ) : (
                                      <span className="text-slate-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                  <span className="font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.durationDays}d
                                  </span>
                                </div>
                              </div>

                              {/* Right Timeline Grid Area */}
                              <div className="relative flex items-center h-28 shrink-0">
                                {/* Vertical Grid Lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {ganttData.timelineDays.map((day) => (
                                    <div
                                      key={day.dateStr}
                                      className={`w-[48px] min-w-[48px] h-full border-r border-slate-100 shrink-0 ${
                                        day.isToday
                                          ? 'bg-indigo-50/30 border-r border-indigo-300/80'
                                          : day.isWeekend
                                          ? 'bg-slate-50/60'
                                          : ''
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Gantt Bar */}
                                <Link
                                  to={`/portal/job-requests/${item.job.id}`}
                                  className={`absolute top-4 bottom-4 rounded-xl flex items-center px-3 cursor-pointer transition-all hover:scale-[1.01] hover:brightness-105 group/bar shadow-md ${
                                    item.isOverdue
                                      ? 'bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400 text-white shadow-rose-500/20'
                                      : item.hasOverlap
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-400 text-white shadow-amber-500/20'
                                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-400 text-white shadow-indigo-500/20'
                                  }`}
                                  style={{
                                    left: `${barLeft}px`,
                                    width: `${barWidth}px`,
                                  }}
                                  title={`[${item.job.ticket_no || `#${item.job.id}`}] ${item.job.title}\nStart: ${item.start.toLocaleDateString()}\nDeadline: ${item.deadline.toLocaleDateString()} (${item.durationDays} days)\n${
                                    item.isOverdue ? '⚠️ OVERDUE!\n' : ''
                                  }${item.hasOverlap ? `⚠️ Overlaps with ${item.overlappingJobs.length} tasks: ${item.overlappingJobs.map((o) => o.ticket_no).join(', ')}\n` : ''}${
                                    item.staffNames.length > 0 ? `Staff: ${item.staffNames.join(', ')}` : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full overflow-hidden text-xs">
                                    <div className="flex items-center gap-1.5 truncate">
                                      {item.isOverdue ? (
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      ) : item.hasOverlap ? (
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                      )}
                                      <span className="font-extrabold truncate tracking-tight text-[11px]">
                                        {item.job.ticket_no ? `${item.job.ticket_no} - ` : ''}{item.job.title}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                      {item.durationDays}d
                                    </span>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Staff Workload Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Team Workload Breakdown ({currentUnit})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th>Staff Member</th>
                    <th>Total Tasks</th>
                    <th>
                      <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Incomplete
                      </span>
                    </th>
                    <th>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    </th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.staffWorkload.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-4 text-xs">
                        No staff members assigned yet
                      </td>
                    </tr>
                  ) : (
                    analyticsData.staffWorkload.map(([staffName, sStats]) => {
                      const staffRate = sStats.total > 0 ? Math.round((sStats.completed / sStats.total) * 100) : 0;
                      const isSelected = ganttSelectedStaff === staffName;

                      return (
                        <tr
                          key={staffName}
                          onClick={() => {
                            if (ganttSelectedStaff === staffName) {
                              setGanttSelectedStaff('all');
                            } else {
                              setGanttSelectedStaff(staffName);
                              const el = document.getElementById('gantt-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`hover:bg-indigo-50/50 cursor-pointer transition-colors group ${
                            isSelected ? 'bg-indigo-50/80 ring-1 ring-indigo-200' : ''
                          }`}
                          title={`Click to filter Gantt chart to ${staffName}`}
                        >
                          <td className="font-extrabold text-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={isSelected ? 'text-indigo-600 font-black' : ''}>{staffName}</span>
                              {isSelected ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-600 text-white">
                                  FILTERED
                                </span>
                              ) : (
                                <span className="text-[10px] text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  🔍 View in Gantt
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="font-bold text-slate-700">{sStats.total}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black">
                              {sStats.pending}
                            </span>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              {sStats.completed}
                            </span>
                          </td>
                          <td className="w-36">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${staffRate}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-slate-600">{staffRate}%</span>
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
      )}

      {/* 6. TAB 4: WEEKLY REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <ReportsPage embedded={true} overrideUnit={currentUnit} />
        </div>
      )}

      {/* MODAL: ADD KANBAN COLUMN */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                Add New Kanban Column
              </h3>
              <button onClick={() => setShowAddColumnModal(false)} className="btn btn-sm btn-circle btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Column Name / Stage:</label>
                <input
                  type="text"
                  placeholder="e.g. Asset Prep, Client Approval, etc."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  autoFocus
                  className="input input-bordered w-full rounded-xl text-xs font-semibold focus:border-indigo-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs"
                >
                  Save Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KANBAN COLUMN */}
      {editingColumn && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                Edit Column Name
              </h3>
              <button onClick={() => setEditingColumn(null)} className="btn btn-sm btn-circle btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Column Name:</label>
                <input
                  type="text"
                  value={editingColumn.label}
                  onChange={(e) => setEditingColumn({ ...editingColumn, label: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-xs font-semibold focus:border-indigo-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditColumn}
                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs"
                >
                  Update Column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
