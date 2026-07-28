import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Printer,
  Copy,
  Check,
  Filter,
  Calendar as CalendarIcon,
  UserCheck,
  Building2,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface ReportEntry {
  id: number;
  ticket_no: string;
  staff_name: string;
  client: string;
  project: string;
  task?: string;
  title: string;
  start_date: string;
  status: string;
  raw_status: string;
}

interface StaffReportGroup {
  staff_id: number;
  staff_name: string;
  staff_email: string;
  staff_unit: string;
  entries: ReportEntry[];
  total_count: number;
  completed_count: number;
  in_progress_count: number;
}

export const ReportsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<StaffReportGroup[]>([]);

  // Accordion Expand/Collapse State per Staff Member
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<number>>(new Set());

  // Modal State for Previewing & Copying Plain-Text Report
  const [previewModalText, setPreviewModalText] = useState<string | null>(null);
  const [previewStaffName, setPreviewStaffName] = useState<string>('');
  const [modalCopied, setModalCopied] = useState<boolean>(false);

  // Date State - Default to current week (Monday to Sunday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [staffListOptions, setStaffListOptions] = useState<any[]>([]);

  // Calculate Week End (Sunday)
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

  const formatDateForApi = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatDateForApi(currentWeekStart);
  const endDateStr = formatDateForApi(currentWeekEnd);

  // Fetch Reports from API
  const fetchReports = () => {
    setLoading(true);
    const query = new URLSearchParams({
      start_date: startDateStr,
      end_date: endDateStr,
      unit: selectedUnit,
      staff_id: selectedStaffId,
      status: selectedStatus,
    });

    fetch(`/api/job-requests/reports/weekly?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports);
          // Default to collapsed for all staff
          setExpandedStaffIds(new Set());
        }
      })
      .catch((err) => console.error('Error fetching reports:', err))
      .finally(() => setLoading(false));
  };

  const toggleStaffExpanded = (staffId: number) => {
    setExpandedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const activeIds = reports.filter((g) => g.entries.length > 0).map((g) => g.staff_id);
    setExpandedStaffIds(new Set(activeIds));
  };

  const handleCollapseAll = () => {
    setExpandedStaffIds(new Set());
  };

  // Copy Combined Plain-Text Report for ALL Staff Members
  const handleCopyAllStaffReports = () => {
    const activeGroups = reports.filter((g) => g.entries && g.entries.length > 0);
    if (activeGroups.length === 0) return;

    const dateRangeStr = formatHeaderDateRange(currentWeekStart, currentWeekEnd);

    const allFormattedBlocks = activeGroups.map((group) => {
      const headerLine = `*${group.staff_name} Weekly Reports ${dateRangeStr}*`;
      const lines = group.entries.map((entry, idx) => {
        const num = idx + 1;
        const taskPart = entry.task || entry.title;
        return `${group.staff_name} > ${num} > Client: ${entry.client} > Project: ${entry.project} > ${taskPart} > ${entry.start_date} > ${entry.status}`;
      });
      return `${headerLine}\n\n${lines.join('\n')}`;
    });

    const fullText = allFormattedBlocks.join('\n\n==================================================\n\n');
    setPreviewStaffName(user?.role === 'admin' ? 'All Units Combined' : `${user?.unit || 'All'} Department`);
    setPreviewModalText(fullText);
    setModalCopied(false);
  };

  // Fetch Staff Options for Filter Dropdown
  useEffect(() => {
    if (token && (user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager)) {
      fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            if (user?.role === 'manager' && user?.unit) {
              setStaffListOptions(data.filter((u) => (u.role === 'staff' || u.role === 'manager') && u.unit === user.unit));
            } else {
              setStaffListOptions(data.filter((u) => u.role === 'staff' || u.role === 'manager'));
            }
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  useEffect(() => {
    fetchReports();
  }, [startDateStr, endDateStr, selectedUnit, selectedStaffId, selectedStatus, token]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Format Date for Display e.g., "21 Jul 2026"
  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format Header Date Range e.g. "20–24 July 2026"
  const formatHeaderDateRange = (start: Date, end: Date) => {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleDateString('en-GB', { month: 'long' });
    const year = start.getFullYear();
    const endMonth = end.toLocaleDateString('en-GB', { month: 'long' });
    const endYear = end.getFullYear();

    if (month === endMonth && year === endYear) {
      return `${startDay}–${endDay} ${month} ${year}`;
    }
    return `${startDay} ${month} – ${endDay} ${endMonth} ${year}`;
  };

  // Open Preview Lightbox Modal for Staff Report (Exact User Requested Format)
  const handleOpenPreviewModal = (staffGroup: StaffReportGroup) => {
    if (!staffGroup.entries || staffGroup.entries.length === 0) return;

    const dateRangeStr = formatHeaderDateRange(currentWeekStart, currentWeekEnd);
    const headerLine = `*${staffGroup.staff_name} Weekly Reports ${dateRangeStr}*`;

    const lines = staffGroup.entries.map((entry, idx) => {
      const num = idx + 1;
      const taskPart = entry.task || entry.title;
      return `${staffGroup.staff_name} > ${num} > Client: ${entry.client} > Project: ${entry.project} > ${taskPart} > ${entry.start_date} > ${entry.status}`;
    });

    const formattedText = `${headerLine}\n\n${lines.join('\n')}`;
    setPreviewStaffName(staffGroup.staff_name);
    setPreviewModalText(formattedText);
    setModalCopied(false);
  };

  const handleCopyFromModal = () => {
    if (!previewModalText) return;
    navigator.clipboard.writeText(previewModalText).then(() => {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2500);
    });
  };

  const totalTasksOverall = reports.reduce((acc, curr) => acc + curr.total_count, 0);
  const totalCompletedOverall = reports.reduce((acc, curr) => acc + curr.completed_count, 0);
  const totalInProgressOverall = reports.reduce((acc, curr) => acc + curr.in_progress_count, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Weekly Work Reports
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Automated weekly job & activity logs per staff member.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          {(user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && (
            <button
              onClick={handleCopyAllStaffReports}
              className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl px-4 h-11 border-none shadow-md flex items-center gap-2 transition-all"
              title="Copy combined weekly report for all listed staff"
            >
              <Copy className="w-4 h-4" /> Copy All Reports
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="btn bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl px-5 h-11 border-none shadow-md flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Week Navigator & Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Week Selector Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="btn btn-sm btn-ghost btn-circle text-slate-600 hover:bg-slate-100"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-extrabold text-xs md:text-sm text-slate-800">
                {formatDisplayDate(currentWeekStart)} — {formatDisplayDate(currentWeekEnd)}
              </span>
            </div>

            <button
              onClick={handleNextWeek}
              className="btn btn-sm btn-ghost btn-circle text-slate-600 hover:bg-slate-100"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleCurrentWeek}
              className="btn btn-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border-none rounded-xl ml-2"
            >
              Current Week
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager) && (
              <>
                {/* Staff Filter */}
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="select select-bordered select-xs bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="all">
                      {user?.role === 'manager' && user?.unit ? `All ${user.unit} Staff` : 'All Staff Members'}
                    </option>
                    {staffListOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Filter - Only for Admin */}
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="select select-bordered select-xs bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="all">All Units</option>
                      <option value="Graphic">Graphic</option>
                      <option value="Translation">Translation</option>
                      <option value="Video">Video</option>
                      <option value="Writer">Writer</option>
                      <option value="Corporate Comm">Corporate Comm</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="select select-bordered select-xs bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed Only</option>
                <option value="staff_processing">Staff Processing Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Weekly Tasks</span>
              <span className="text-xl font-black text-slate-900">{totalTasksOverall}</span>
            </div>
            <FileText className="w-8 h-8 text-blue-500 opacity-60" />
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-black text-emerald-700">{totalCompletedOverall}</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
          </div>

          <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Staff Processing</span>
              <span className="text-xl font-black text-purple-700">{totalInProgressOverall}</span>
            </div>
            <Clock className="w-8 h-8 text-purple-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* Main Reports Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="mt-3 text-xs text-slate-400 font-medium">Generating weekly report data...</p>
        </div>
      ) : reports.length === 0 || totalTasksOverall === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No work records found for this week</h3>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different date range or adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar: Staff Count & Expand/Collapse All */}
          <div className="flex items-center justify-between px-2 pt-1 pb-1 print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Staff Reports ({reports.filter((g) => g.entries.length > 0).length})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 font-extrabold border border-slate-200 shadow-sm rounded-lg"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 font-extrabold border border-slate-200 shadow-sm rounded-lg"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* 2-Column Grid of Staff Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {reports
              .filter((group) => group.entries.length > 0)
              .map((group) => {
                const isExpanded = expandedStaffIds.has(group.staff_id);
                return (
                  <div
                    key={group.staff_id}
                    className={`bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden transition-all ${
                      isExpanded ? 'col-span-1 lg:col-span-2' : 'col-span-1'
                    }`}
                  >
                    {/* Staff Group Header (Clickable Accordion) */}
                    <div
                      onClick={() => toggleStaffExpanded(group.staff_id)}
                      className="bg-slate-900 hover:bg-slate-950 text-white p-4 md:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-base shrink-0 border border-white/10 shadow-inner">
                          {group.staff_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-base text-white tracking-tight">{group.staff_name}</h3>
                            {group.staff_unit && (
                              <span className="bg-white/15 text-blue-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                                {group.staff_unit}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{group.staff_email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end xl:self-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[11px] text-slate-300 font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                          <span className="text-emerald-400 font-bold">{group.completed_count} Done</span> • <span className="text-purple-300 font-bold">{group.in_progress_count} Processing</span>
                        </div>

                        <button
                          onClick={() => handleOpenPreviewModal(group)}
                          className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl border-none gap-1.5 shadow-md print:hidden"
                          title="Preview and copy plain-text formatted report"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </button>

                        <button
                          onClick={() => toggleStaffExpanded(group.staff_id)}
                          className="btn btn-sm btn-circle bg-white/10 hover:bg-white/20 text-white border-none shrink-0 print:hidden"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Job Entries Cards Container */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50/50 space-y-4 border-t border-slate-100 animate-in fade-in duration-150">
                        {group.entries.map((entry, idx) => (
                          <div
                            key={entry.id}
                            className={`bg-white rounded-2xl border p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-3.5 relative overflow-hidden ${
                              entry.status === 'Completed'
                                ? 'border-l-4 border-l-emerald-500 border-slate-200/80'
                                : 'border-l-4 border-l-purple-600 border-slate-200/80'
                            }`}
                          >
                            {/* Top Header Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                                {/* Number Badge */}
                                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </span>

                                {/* Ticket Badge */}
                                <Link
                                  to={`/portal/job-requests/${entry.id}`}
                                  className="text-xs font-mono font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1.5 group border border-blue-100"
                                  title="Click to view project details"
                                >
                                  <span>#{entry.ticket_no}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </Link>

                                {/* Client Tag */}
                                <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-200/60">
                                  CLIENT: <strong className="text-slate-900">{entry.client}</strong>
                                </span>

                                {/* Project Tag */}
                                <Link
                                  to={`/portal/job-requests/${entry.id}`}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-purple-100 transition-all"
                                  title="Click to view project details"
                                >
                                  PROJECT: <span className="text-purple-900">{entry.project}</span>
                                </Link>
                              </div>

                              {/* Status Capsule */}
                              <span
                                className={`inline-flex items-center justify-center font-extrabold uppercase rounded-full px-3.5 py-1 text-[10px] tracking-wider shadow-sm shrink-0 ${
                                  entry.status === 'Completed'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-purple-600 text-white'
                                }`}
                              >
                                {entry.status}
                              </span>
                            </div>

                            {/* Work Description Box */}
                            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                {entry.title}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-1 text-xs font-semibold">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>Start Date: <strong className="text-slate-800">{entry.start_date}</strong></span>
                              </div>

                              <Link
                                to={`/portal/job-requests/${entry.id}`}
                                className="btn btn-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold border-none rounded-xl px-3 gap-1 transition-all print:hidden"
                              >
                                <span>View Project</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR PREVIEWING & COPYING REPORT TEXT */}
      {previewModalText !== null && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-purple-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Weekly Work Report Preview</h3>
                  <p className="text-[11px] text-purple-100 font-medium">
                    Staff: {previewStaffName} ({formatDisplayDate(currentWeekStart)} — {formatDisplayDate(currentWeekEnd)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalText(null)}
                className="btn btn-sm btn-ghost btn-circle text-purple-100 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Body - Code/Text Box */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Below is the plain-text preview of your weekly report entries. Click <strong className="text-slate-800">Copy Text</strong> to copy to your clipboard.
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={previewModalText}
                  className="w-full h-64 bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none select-all leading-relaxed resize-none shadow-inner"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalText(null)}
                  className="btn btn-ghost hover:bg-slate-100 text-slate-600 font-extrabold text-xs rounded-xl px-5 h-11"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCopyFromModal}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl px-6 h-11 border-none shadow-md shadow-purple-500/25 flex items-center gap-2"
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" /> Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
