import React, { useEffect, useState, useMemo } from 'react';
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
  GripVertical
} from 'lucide-react';

interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

export const UnitWorkspacePage: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'kanban' }) => {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'kanban' | 'calendar' | 'analytics' | 'reports'
  const tabParam = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  // Available Units
  const [unitsList, setUnitsList] = useState<any[]>([]);

  // Current Selected Unit (for Director / Manager / Admin or user's unit)
  const isSuperUser = ['admin', 'manager', 'director'].includes(user?.role) || Boolean((user as any)?.is_acting_manager);
  const userUnitName = user?.unit || 'Social Media';
  const initialUnit = searchParams.get('unit') || userUnitName;
  const [currentUnit, setCurrentUnit] = useState<string>(initialUnit);

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  // Filter & Search in Workspace
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');

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
  // - Strictly only the actual Head Unit of the current unit (or Admin) can move cards between stages
  const isHeadOfCurrentUnit = Boolean(
    user?.is_unit_head && (
      (user?.unit && user.unit.toLowerCase().trim() === currentUnit.toLowerCase().trim()) ||
      ((user as any)?.managed_units && (user as any).managed_units.some((u: string) => u.toLowerCase().trim() === currentUnit.toLowerCase().trim()))
    )
  );
  const canManageColumns = Boolean(user?.role === 'admin' || isHeadOfCurrentUnit);
  const canMoveCards = canManageColumns;

  // Modals
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [selectedTaskPreview, setSelectedTaskPreview] = useState<any | null>(null);

  // Drag and Drop State
  const [draggedJobId, setDraggedJobId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  const handleUnitChange = (unitName: string) => {
    setCurrentUnit(unitName);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('unit', unitName);
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
      // Fetch Kanban Columns
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

      // Fetch All Job Requests (will be filtered for this unit)
      const jobRes = await fetch('/api/job-requests', {
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

  // Helper: Determine if task is finished / completed
  const isJobCompleted = (job: any): boolean => {
    if (job.status === 'completed' || job.status === 'done') return true;
    const stage = (job.additional_data?.kanban_stage || '').toLowerCase();
    if (stage === 'published' || stage.includes('done') || stage.includes('completed')) return true;
    return false;
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

  // Overall Stats
  const stats = useMemo(() => {
    const total = unitJobs.length;
    const completed = unitJobs.filter((j) => isJobCompleted(j)).length;
    const unfinished = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, unfinished, rate };
  }, [unitJobs]);

  // Move Card to a New Kanban Stage
  const handleMoveCard = async (jobId: number, targetStageId: string) => {
    if (!canMoveCards) return;
    const targetCol = kanbanColumns.find((c) => c.id === targetStageId);
    if (!targetCol) return;

    // Check if target column is the final completed column
    const isLastCol = kanbanColumns[kanbanColumns.length - 1].id === targetStageId;
    const isCompleted = isLastCol || targetCol.label.toLowerCase().includes('done') || targetCol.label.toLowerCase().includes('published');

    // Optimistically update local state
    setJobRequests((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            status: isCompleted ? 'completed' : (job.status === 'completed' ? 'staff_processing' : job.status),
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
      const res = await fetch(`/api/job-requests/${jobId}/kanban-stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage_id: targetStageId,
          stage_label: targetCol.label,
          is_completed: isCompleted,
        }),
      });
      if (!res.ok) {
        console.error('Failed to persist stage movement');
      }
    } catch (e) {
      console.error('Network error moving card:', e);
    }
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
                {canManageColumns && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800">
                    ★ Lead Controls Active
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                Custom workflow board, content calendar by date, analytics, and weekly activity reports.
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
            {filteredJobs.length}
          </span>
        </button>

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

      {/* 3. TAB 1: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
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

              {/* Pillar Filter (for Social Media) */}
              {currentUnit.toLowerCase().includes('social') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pillar:</span>
                  <select
                    value={pillarFilter}
                    onChange={(e) => setPillarFilter(e.target.value)}
                    className="select select-sm select-bordered bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="all">All Pillars</option>
                    <option value="Pillar 1">Pillar 1</option>
                    <option value="Pillar 2">Pillar 2</option>
                    <option value="Pillar 3">Pillar 3</option>
                  </select>
                </div>
              )}
            </div>

            {/* Head Unit Add Column Control */}
            {canManageColumns && (
              <button
                onClick={() => setShowAddColumnModal(true)}
                className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl border-none shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
              </button>
            )}
          </div>

          {/* Color Rule Guide Banner */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-600">Card Status Legend:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Incomplete (In Progress / Drafting / Review / Scheduled)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Completed (Published / Done)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {canMoveCards
                ? '💡 Head Unit can drag and drop cards or select stage to reorder workflow'
                : '🔒 Workflow planning and stages are managed exclusively by the Head Unit'}
            </span>
          </div>

          {/* Kanban Columns Horizontal Container */}
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[550px] items-start">
            {kanbanColumns.map((col, index) => {
              const colJobs = filteredJobs.filter((job) => getJobStageId(job) === col.id);
              const isColumnDraggedOver = Boolean(canMoveCards && dragOverColId === col.id);

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    if (!canMoveCards) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColId !== col.id) {
                      setDragOverColId(col.id);
                    }
                  }}
                  onDragEnter={(e) => {
                    if (!canMoveCards) return;
                    e.preventDefault();
                    setDragOverColId(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (!canMoveCards) return;
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverColId === col.id) {
                      setDragOverColId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!canMoveCards) return;
                    e.preventDefault();
                    setDragOverColId(null);
                    const idStr = e.dataTransfer.getData('text/plain');
                    const jobId = idStr ? Number(idStr) : draggedJobId;
                    if (jobId) {
                      handleMoveCard(jobId, col.id);
                    }
                    setDraggedJobId(null);
                  }}
                  className={`w-80 shrink-0 rounded-3xl border p-4 space-y-3.5 flex flex-col transition-all duration-200 ${
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
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                    {colJobs.length === 0 ? (
                      <div
                        className={`p-6 text-center border-2 border-dashed rounded-2xl text-xs font-semibold transition-all ${
                          isColumnDraggedOver
                            ? 'border-indigo-400 bg-indigo-100/50 text-indigo-700 animate-pulse'
                            : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {isColumnDraggedOver ? '⇩ Drop card here' : 'No tasks in this stage'}
                      </div>
                    ) : (
                      colJobs.map((job) => {
                        const isDone = isJobCompleted(job);
                        const cFields = job.additional_data?.custom_fields_data || {};
                        const pillars = cFields.pillar || cFields.Pillar;
                        const category = cFields.category || cFields.Category;
                        const isThisCardDragged = draggedJobId === job.id;

                        return (
                          <div
                            key={job.id}
                            draggable={canMoveCards}
                            onDragStart={(e) => {
                              if (!canMoveCards) return;
                              e.dataTransfer.setData('text/plain', String(job.id));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedJobId(job.id);
                            }}
                            onDragEnd={() => {
                              setDraggedJobId(null);
                              setDragOverColId(null);
                            }}
                            className={`p-4 rounded-2xl transition-all duration-150 space-y-2.5 select-none ${
                              canMoveCards ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                            } ${
                              isThisCardDragged
                                ? 'opacity-40 scale-[0.98] border-dashed border-indigo-500 shadow-inner rotate-1'
                                : ''
                            } ${
                              isDone
                                ? 'bg-white border-l-4 border-l-emerald-500 border border-emerald-200/80 shadow-xs hover:shadow-md hover:border-emerald-400'
                                : 'bg-white border-l-4 border-l-rose-500 border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-400'
                            }`}
                          >
                            {/* Card Header: Ticket No + Red / Green Status Badge */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                {canMoveCards && <GripVertical className="w-3.5 h-3.5 shrink-0 hover:text-slate-600" />}
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                  {job.ticket_no}
                                </span>
                              </div>
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Completed</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>Incomplete</span>
                                </span>
                              )}
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
                        );
                      })
                    )}

                    {/* Drop target indicator when dragging over a column that already has cards */}
                    {isColumnDraggedOver && colJobs.length > 0 && (
                      <div className="p-3 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-100/50 text-indigo-700 text-xs font-extrabold text-center animate-pulse flex items-center justify-center gap-2">
                        <span>⇩ Drop to move to {col.label}</span>
                      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown (Incomplete vs Completed) */}
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

            {/* Content Pillar Breakdown (Social Media) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Content Pillar Breakdown
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {analyticsData.pillars.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No pillar data recorded yet</p>
                ) : (
                  analyticsData.pillars.map(([pName, count]) => (
                    <div key={pName} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-extrabold text-slate-800">{pName}</span>
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-black">
                        {count} tasks
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                      return (
                        <tr key={staffName} className="hover:bg-slate-50">
                          <td className="font-extrabold text-slate-800 text-xs">{staffName}</td>
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
