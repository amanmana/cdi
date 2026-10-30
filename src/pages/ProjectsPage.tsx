import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderKanban,
  Edit3,
  SlidersHorizontal,
  X,
  FileText,
  Building2,
  Check,
} from 'lucide-react';

interface UnitSummary {
  id: number;
  name: string;
  has_task: boolean;
  is_completed: boolean;
}

interface MegaProject {
  id: number;
  code: string;
  title: string;
  description: string | null;
  created_by_user_id: number;
  creator_name: string;
  creator_role: string;
  status: 'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  status_note: string | null;
  start_date: string | null;
  target_deadline: string | null;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  progress_percent: number;
  assigned_units: UnitSummary[];
  created_at: string;
}

interface UnitItem {
  id: number;
  name: string;
  department_name?: string;
}

export const ProjectsPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<MegaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsList, setUnitsList] = useState<UnitItem[]>([]);

  // Create Project Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStartDate, setCreateStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [createDeadline, setCreateDeadline] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  // Status Change Modal state
  const [statusModalProject, setStatusModalProject] = useState<MegaProject | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled'>('active');
  const [newStatusNote, setNewStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled'>('all');

  const isDirectorOrAdmin = user?.role === 'director' || user?.role === 'admin';
  const canUpdateStatus = isDirectorOrAdmin || user?.role === 'manager' || user?.is_acting_manager;

  const fetchProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch mega projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/public/units');
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter((u: any) => u.name !== 'Administrator');
        setUnitsList(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUnits();
  }, [token]);

  const toggleUnitSelection = (unitId: number) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCode.trim()) {
      alert('Please enter a project code (e.g. MTP2026).');
      return;
    }
    if (!createTitle.trim()) {
      alert('Please enter a project title.');
      return;
    }
    if (selectedUnitIds.length === 0) {
      alert('Please select at least one participating unit.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (createDeadline && createDeadline < todayStr) {
      alert('Target Completion Deadline cannot be earlier than today.');
      return;
    }
    if (createStartDate && createDeadline && createDeadline < createStartDate) {
      alert('Target Completion Deadline cannot be earlier than Start Date.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: createCode.trim().toUpperCase(),
          title: createTitle.trim(),
          description: createDescription.trim(),
          start_date: createStartDate,
          target_deadline: createDeadline || null,
          unit_ids: selectedUnitIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setCreateCode('');
        setCreateTitle('');
        setCreateDescription('');
        setCreateDeadline('');
        setSelectedUnitIds([]);
        fetchProjects();
      } else {
        alert(data.error || 'Failed to create Mega Project.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error while creating project.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalProject) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/projects/${statusModalProject.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: newStatus,
          status_note: newStatusNote.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusModalProject(null);
        fetchProjects();
      } else {
        alert(data.error || 'Failed to update project status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error while updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusModal = (project: MegaProject) => {
    setStatusModalProject(project);
    setNewStatus(project.status);
    setNewStatusNote(project.status_note || '');
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed (100%)
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" /> On Hold
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Active In Progress
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-extrabold uppercase tracking-wider">
            <FolderKanban className="w-3.5 h-3.5" /> Project-as-a-Base Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Mega Projects Management
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl font-medium">
            Multi-unit cross-department project coordination. Track collective milestones, unit deliverables, and overall completion percentages.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchProjects}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isDirectorOrAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary bg-blue-600 hover:bg-blue-500 border-none text-white rounded-2xl px-5 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Mega Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Quick KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Badges */}
        <div className="bg-white p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/80 shadow-2xs overflow-x-auto">
          {(['all', 'active', 'pending', 'completed', 'on_hold', 'cancelled'] as const).map((tab) => {
            const count = tab === 'all' ? projects.length : projects.filter((p) => p.status === tab).length;
            const labels: Record<string, string> = {
              all: 'All Projects',
              active: 'Active',
              pending: 'Pending Review',
              completed: 'Completed',
              on_hold: 'On Hold',
              cancelled: 'Cancelled',
            };

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {labels[tab]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Cards List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-xs font-bold text-slate-500">Loading mega projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">No Mega Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              {statusFilter === 'all'
                ? 'No mega projects have been initiated yet. Directors can launch cross-department mega projects using the button above.'
                : `No projects currently match status "${statusFilter}".`}
            </p>
          </div>
          {isDirectorOrAdmin && statusFilter === 'all' && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary bg-blue-600 hover:bg-blue-500 border-none text-white rounded-2xl px-6 font-bold text-xs uppercase"
            >
              + Launch First Mega Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-100 hover:shadow-xl hover:border-blue-200 transition-all p-6 sm:p-8 space-y-6"
            >
              {/* Card Header: Code, Title, Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 tracking-wider">
                      #{project.code}
                    </span>
                    {getStatusBadge(project.status)}
                    <span className="text-xs text-slate-400 font-medium">
                      Initiated by {project.creator_name} ({project.creator_role})
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {project.title}
                  </h2>

                  {project.description && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {canUpdateStatus && (
                    <button
                      type="button"
                      onClick={() => openStatusModal(project)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Update Status</span>
                    </button>
                  )}

                  <Link
                    to={`/portal/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <span>View Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Status Note Callout Banner if Pending / On Hold / Custom Note */}
              {project.status_note && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold uppercase tracking-wide text-amber-800 mr-1.5">
                      Status Note:
                    </span>
                    <span>{project.status_note}</span>
                  </div>
                </div>
              )}

              {/* Progress Bar & KPI Indicators */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 uppercase tracking-wider">Overall Project Progress</span>
                    <span className="text-[11px] font-bold text-slate-400">
                      ({project.completed_jobs} of {project.total_jobs} unit tasks completed)
                    </span>
                  </div>
                  <span
                    className={`font-mono text-sm font-black ${
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

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-200/70 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      project.progress_percent === 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm shadow-blue-500/30'
                    }`}
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Participating Units Breakdown & Timeline */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                {/* Participating Units Tags */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Assigned Units:
                  </span>
                  {project.assigned_units.map((unit) => (
                    <span
                      key={unit.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs border ${
                        unit.is_completed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : unit.has_task
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {unit.is_completed ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      )}
                      <span>{unit.name}</span>
                    </span>
                  ))}
                </div>

                {/* Timeline Info */}
                <div className="flex items-center gap-4 text-slate-500 font-semibold shrink-0">
                  {project.start_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Start: {project.start_date}</span>
                    </div>
                  )}
                  {project.target_deadline && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-slate-800 font-bold">Target: {project.target_deadline}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MEGA PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Create New Mega Project</h3>
                  <p className="text-xs text-slate-500">Director initiative for cross-unit collaborative project</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Project Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MTP2026"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Short unique code</span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Majlis Transformasi Perkhidmatan 2026"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Description & Master Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key deliverables, instructions, and objectives for participating units..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Target Completion Deadline
                  </label>
                  <input
                    type="date"
                    value={createDeadline}
                    min={createStartDate && createStartDate > new Date().toISOString().split('T')[0] ? createStartDate : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCreateDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Participating Units Selection (Multiple Selection) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Select Participating Units *
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">
                    {selectedUnitIds.length} unit(s) selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  The system will automatically spawn initial deliverables tickets for each selected unit upon creation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                  {unitsList.map((unit) => {
                    const isSelected = selectedUnitIds.includes(unit.id);
                    return (
                      <div
                        key={unit.id}
                        onClick={() => toggleUnitSelection(unit.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold truncate">{unit.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none text-white rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/25"
                >
                  {creating ? 'Creating Project & Tasks...' : 'Create & Delegate Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL (Director, Admin, Manager) */}
      {statusModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                  #{statusModalProject.code}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">Update Project Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalProject(null)}
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
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="active">🟢 Active / In Progress</option>
                  <option value="pending">🟡 Pending (Third-party / Finance / Approval)</option>
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
                  value={newStatusNote}
                  onChange={(e) => setNewStatusNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">
                  This note is displayed to Director, Managers, and Units during tracking and presentations.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalProject(null)}
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
