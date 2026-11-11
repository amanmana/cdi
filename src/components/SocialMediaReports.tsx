import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReportsPage } from '../pages/ReportsPage';
import {
  FileText,
  BarChart3,
  Calendar,
  Download,
  Printer,
  Layers,
  Share2,
  User,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SocialMediaReportsProps {
  jobs: any[];
  user: any;
  currentUnit: string;
}

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CANONICAL_PILLARS = [
  'Innovation highlights',
  'Thought leadership',
  'Community',
  'Edutainment',
  'Employee advocacy',
  'Engagement',
];

const CANONICAL_PLATFORMS = [
  'Instagram',
  'Tiktok',
  'Facebook',
  'Facebook Repost',
  'LinkedIn',
  'LinkedIn Repost',
  'Threads',
  'Youtube',
  'Twitter',
];

const PILLAR_COLORS: Record<string, { bg: string; fill: string; border: string; text: string }> = {
  'innovation highlights': { bg: 'bg-blue-600', fill: '#2563eb', border: 'border-blue-700', text: 'text-blue-700' },
  'thought leadership': { bg: 'bg-amber-600', fill: '#d97706', border: 'border-amber-700', text: 'text-amber-700' },
  'community': { bg: 'bg-slate-500', fill: '#64748b', border: 'border-slate-600', text: 'text-slate-700' },
  'edutainment': { bg: 'bg-yellow-500', fill: '#eab308', border: 'border-yellow-600', text: 'text-yellow-700' },
  'employee advocacy': { bg: 'bg-cyan-600', fill: '#0891b2', border: 'border-cyan-700', text: 'text-cyan-700' },
  'engagement': { bg: 'bg-emerald-600', fill: '#059669', border: 'border-emerald-700', text: 'text-emerald-700' },
};

const DEFAULT_COLOR = { bg: 'bg-purple-600', fill: '#9333ea', border: 'border-purple-700', text: 'text-purple-700' };

export const SocialMediaReports: React.FC<SocialMediaReportsProps> = ({
  jobs,
  user,
  currentUnit,
}) => {
  // Current view: 'general' (Pillars & Platforms) vs 'individual' (Staff KPI) vs 'weekly' (Weekly Log)
  const [reportView, setReportView] = useState<'general' | 'individual' | 'weekly'>('general');

  // Year filter (default to current year, e.g. 2026)
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);

  // Staff filter for Individual Report (for leadership / Head Unit)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [expandedStaffList, setExpandedStaffList] = useState<Record<number, boolean>>({});

  // 1. Extract Years available in the dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentCalendarYear]);
    jobs.forEach((job) => {
      const dates = [job.completed_at, job.start_date, job.created_at, job.deadline];
      dates.forEach((d) => {
        if (d) {
          const y = new Date(d).getFullYear();
          if (!isNaN(y) && y >= 2020 && y <= 2035) {
            yearsSet.add(y);
          }
        }
      });
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [jobs, currentCalendarYear]);

  // Helper to resolve completion date (Option A) with fallbacks
  const getJobDate = (job: any): Date => {
    if (job.status === 'completed' || job.is_done) {
      if (job.completed_at) return new Date(job.completed_at);
      if (job.additional_data?.completed_at) return new Date(job.additional_data.completed_at);
      if (job.updated_at) return new Date(job.updated_at);
    }
    if (job.start_date) return new Date(job.start_date);
    if (job.deadline) return new Date(job.deadline);
    if (job.created_at) return new Date(job.created_at);
    return new Date();
  };

  // Helper to extract pillars & platforms from job
  const extractPillarsAndPlatforms = (job: any) => {
    const pillars: string[] = [];
    const platforms: string[] = [];
    const addData = job.additional_data || {};

    // 1. From selected_services
    if (Array.isArray(addData.selected_services)) {
      for (const s of addData.selected_services) {
        const f = s.fields || s.custom_fields || {};
        const p = f.pillar || f.Pillar;
        if (p) {
          if (Array.isArray(p)) pillars.push(...p);
          else if (typeof p === 'string') pillars.push(...p.split(',').map((str: string) => str.trim()));
        }
        const plat = f.platform || f.Platform || f.platforms || f.Platforms || f.social_media || f.Social_Media;
        if (plat) {
          if (Array.isArray(plat)) platforms.push(...plat);
          else if (typeof plat === 'string') platforms.push(...plat.split(',').map((str: string) => str.trim()));
        }
      }
    }

    // 2. From unit_assignments
    if (addData.unit_assignments && typeof addData.unit_assignments === 'object') {
      for (const [_, uMeta] of Object.entries(addData.unit_assignments as any)) {
        const f = (uMeta as any)?.custom_fields || (uMeta as any)?.fields || {};
        const p = f.pillar || f.Pillar;
        if (p) {
          if (Array.isArray(p)) pillars.push(...p);
          else if (typeof p === 'string') pillars.push(...p.split(',').map((str: string) => str.trim()));
        }
        const plat = f.platform || f.Platform || f.platforms || f.Platforms;
        if (plat) {
          if (Array.isArray(plat)) platforms.push(...plat);
          else if (typeof plat === 'string') platforms.push(...plat.split(',').map((str: string) => str.trim()));
        }
      }
    }

    // 3. From direct custom_fields
    const direct = addData.custom_fields_data || addData.custom_fields || {};
    const pDirect = direct.pillar || direct.Pillar;
    if (pDirect) {
      if (Array.isArray(pDirect)) pillars.push(...pDirect);
      else if (typeof pDirect === 'string') pillars.push(...pDirect.split(',').map((str: string) => str.trim()));
    }
    const platDirect = direct.platform || direct.Platform || direct.platforms;
    if (platDirect) {
      if (Array.isArray(platDirect)) platforms.push(...platDirect);
      else if (typeof platDirect === 'string') platforms.push(...platDirect.split(',').map((str: string) => str.trim()));
    }

    // Canonical matching for known pillars
    const cleanPillars = Array.from(new Set(pillars.filter(Boolean))).map((p) => {
      const pMatch = CANONICAL_PILLARS.find((cp) => cp.toLowerCase() === p.toLowerCase().trim());
      return pMatch || p.trim();
    });

    // Canonical matching for known platforms
    const cleanPlatforms = Array.from(new Set(platforms.filter(Boolean))).map((pl) => {
      const plMatch = CANONICAL_PLATFORMS.find((cpl) => cpl.toLowerCase() === pl.toLowerCase().trim());
      return plMatch || pl.trim();
    });

    return {
      pillars: cleanPillars.length > 0 ? cleanPillars : ['Unassigned Pillar'],
      platforms: cleanPlatforms.length > 0 ? cleanPlatforms : ['Unassigned Platform'],
    };
  };

  // 2. Filter jobs for the selected year (All Active + Completed)
  const yearlyJobs = useMemo(() => {
    return jobs.filter((job) => {
      const d = getJobDate(job);
      return d.getFullYear() === selectedYear;
    });
  }, [jobs, selectedYear]);

  // 3. Compute Dynamic Rows for Pillars & Platforms
  // Union of canonical defaults + any new/custom ones found in data
  const { allPillars, allPlatforms } = useMemo(() => {
    const pSet = new Set<string>(CANONICAL_PILLARS);
    const plSet = new Set<string>(CANONICAL_PLATFORMS);

    yearlyJobs.forEach((job) => {
      const { pillars, platforms } = extractPillarsAndPlatforms(job);
      pillars.forEach((p) => { if (p && p !== 'Unassigned Pillar') pSet.add(p); });
      platforms.forEach((pl) => { if (pl && pl !== 'Unassigned Platform') plSet.add(pl); });
    });

    return {
      allPillars: Array.from(pSet),
      allPlatforms: Array.from(plSet),
    };
  }, [yearlyJobs]);

  // 4. Matrix 1: Pillars by Month
  const pillarsMatrix = useMemo(() => {
    // 12 months array for each pillar
    const matrix: Record<string, number[]> = {};
    allPillars.forEach((p) => {
      matrix[p] = new Array(12).fill(0);
    });

    yearlyJobs.forEach((job) => {
      const d = getJobDate(job);
      const monthIdx = d.getMonth();
      const { pillars } = extractPillarsAndPlatforms(job);

      pillars.forEach((p) => {
        if (!matrix[p]) matrix[p] = new Array(12).fill(0);
        matrix[p][monthIdx] += 1;
      });
    });

    // Compute Monthly totals (columns) and row totals
    const monthlyTotals = new Array(12).fill(0);
    const rowTotals: Record<string, number> = {};

    allPillars.forEach((p) => {
      const total = (matrix[p] || []).reduce((sum, val, idx) => {
        monthlyTotals[idx] += val;
        return sum + val;
      }, 0);
      rowTotals[p] = total;
    });

    const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

    return {
      matrix,
      monthlyTotals,
      rowTotals,
      grandTotal,
    };
  }, [yearlyJobs, allPillars]);

  // 5. Matrix 2: Platforms by Month
  const platformsMatrix = useMemo(() => {
    const matrix: Record<string, number[]> = {};
    allPlatforms.forEach((pl) => {
      matrix[pl] = new Array(12).fill(0);
    });

    yearlyJobs.forEach((job) => {
      const d = getJobDate(job);
      const monthIdx = d.getMonth();
      const { platforms } = extractPillarsAndPlatforms(job);

      platforms.forEach((pl) => {
        if (!matrix[pl]) matrix[pl] = new Array(12).fill(0);
        matrix[pl][monthIdx] += 1;
      });
    });

    const monthlyTotals = new Array(12).fill(0);
    const rowTotals: Record<string, number> = {};

    allPlatforms.forEach((pl) => {
      const total = (matrix[pl] || []).reduce((sum, val, idx) => {
        monthlyTotals[idx] += val;
        return sum + val;
      }, 0);
      rowTotals[pl] = total;
    });

    const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

    return {
      matrix,
      monthlyTotals,
      rowTotals,
      grandTotal,
    };
  }, [yearlyJobs, allPlatforms]);

  // 6. Max Value for Chart Normalization
  const maxPillarMonthlyValue = useMemo(() => {
    let max = 0;
    allPillars.forEach((p) => {
      (pillarsMatrix.matrix[p] || []).forEach((val) => {
        if (val > max) max = val;
      });
    });
    return Math.max(max, 10);
  }, [allPillars, pillarsMatrix]);

  // 7. Individual Staff KPI Computations
  const isRegularStaff = user?.role === 'staff' && !user?.is_unit_head && !user?.is_acting_manager;

  const staffKpiData = useMemo(() => {
    const targetUnitClean = (currentUnit || 'Social Media').toLowerCase().trim();

    const staffMap: Record<number, {
      id: number;
      name: string;
      email: string;
      unit: string;
      totalAssigned: number;
      completed: number;
      inProgress: number;
      monthlyCounts: number[];
      pillarsCount: Record<string, number>;
      platformsCount: Record<string, number>;
      jobsList: any[];
    }> = {};

    yearlyJobs.forEach((job) => {
      const staffList = job.assigned_staff || job.assigned_staff_details || [];
      const d = getJobDate(job);
      const mIdx = d.getMonth();
      const { pillars, platforms } = extractPillarsAndPlatforms(job);
      const isDone = job.status === 'completed' || job.is_done;

      if (Array.isArray(staffList) && staffList.length > 0) {
        staffList.forEach((s: any) => {
          const sUnit = (s.unit || '').toLowerCase().trim();

          // STRICT UNIT FILTER: Only display staff who belong to Social Media unit!
          // Exclude cross-unit collaborators (e.g. Graphic & Web, Writer)
          const isUnitMember = Boolean(
            sUnit.includes('social') ||
            sUnit.includes('socmed') ||
            (targetUnitClean && sUnit === targetUnitClean)
          );

          if (!isUnitMember) {
            return;
          }

          const sId = Number(s.id);
          if (!staffMap[sId]) {
            staffMap[sId] = {
              id: sId,
              name: s.name || 'Unknown Staff',
              email: s.email || '',
              unit: s.unit || currentUnit,
              totalAssigned: 0,
              completed: 0,
              inProgress: 0,
              monthlyCounts: new Array(12).fill(0),
              pillarsCount: {},
              platformsCount: {},
              jobsList: [],
            };
          }

          staffMap[sId].totalAssigned += 1;
          if (isDone) staffMap[sId].completed += 1;
          else staffMap[sId].inProgress += 1;

          staffMap[sId].monthlyCounts[mIdx] += 1;
          pillars.forEach((p) => {
            staffMap[sId].pillarsCount[p] = (staffMap[sId].pillarsCount[p] || 0) + 1;
          });
          platforms.forEach((pl) => {
            staffMap[sId].platformsCount[pl] = (staffMap[sId].platformsCount[pl] || 0) + 1;
          });
          staffMap[sId].jobsList.push(job);
        });
      }
    });

    let list = Object.values(staffMap);

    // If regular staff, strictly filter to viewing ONLY their own report
    if (isRegularStaff) {
      list = list.filter((s) => s.id === Number(user?.id));
    }

    return list.sort((a, b) => b.completed - a.completed);
  }, [yearlyJobs, currentUnit, isRegularStaff, user?.id]);

  // CSV Export Handler (Downloads structured spreadsheet matching Image 2)
  const handleExportCSV = () => {
    const rows: string[][] = [];

    // Table 1: Pillars by Month
    rows.push([`PILLARS REPORT - ${selectedYear} (${currentUnit})`]);
    rows.push(['PILLARS', ...MONTH_NAMES, 'TOTAL']);

    allPillars.forEach((p) => {
      const counts = pillarsMatrix.matrix[p] || new Array(12).fill(0);
      rows.push([p, ...counts.map(String), String(pillarsMatrix.rowTotals[p] || 0)]);
    });
    rows.push(['TOTAL', ...pillarsMatrix.monthlyTotals.map(String), String(pillarsMatrix.grandTotal)]);
    rows.push([]);

    // Table 2: Platforms by Month
    rows.push([`PLATFORM REPORT - ${selectedYear} (${currentUnit})`]);
    rows.push(['SOCIAL MEDIA', ...MONTH_NAMES, 'TOTAL']);

    allPlatforms.forEach((pl) => {
      const counts = platformsMatrix.matrix[pl] || new Array(12).fill(0);
      rows.push([pl, ...counts.map(String), String(platformsMatrix.rowTotals[pl] || 0)]);
    });
    rows.push(['TOTAL', ...platformsMatrix.monthlyTotals.map(String), String(platformsMatrix.grandTotal)]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Social_Media_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top Performing Highlights
  const topPillar = useMemo(() => {
    let topName = 'N/A';
    let topCount = 0;
    Object.entries(pillarsMatrix.rowTotals).forEach(([p, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = p;
      }
    });
    return { name: topName, count: topCount };
  }, [pillarsMatrix]);

  const topPlatform = useMemo(() => {
    let topName = 'N/A';
    let topCount = 0;
    Object.entries(platformsMatrix.rowTotals).forEach(([pl, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = pl;
      }
    });
    return { name: topName, count: topCount };
  }, [platformsMatrix]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Media Intelligence & Reporting Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Content Analytics & Performance Matrix
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Data aggregated from internal job intake forms, dynamic client specifications, and publishing completions.
          </p>
        </div>

        {/* Action Controls: Year Selector & Export Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-black text-slate-900 text-xs focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs h-10 px-3.5 shadow-xs flex items-center gap-1.5"
            title="Download formatted CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl font-extrabold text-xs h-10 px-4 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Publications ({selectedYear})</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pillarsMatrix.grandTotal}</h3>
            <span className="text-[11px] font-bold text-slate-500">All Active & Completed Posts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Strategic Pillar</p>
            <h3 className="text-lg font-black text-slate-900 mt-1 truncate max-w-[160px]" title={topPillar.name}>
              {topPillar.name}
            </h3>
            <span className="text-[11px] font-bold text-indigo-600">{topPillar.count} published posts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-inner">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Publishing Channel</p>
            <h3 className="text-lg font-black text-slate-900 mt-1 truncate max-w-[160px]" title={topPlatform.name}>
              {topPlatform.name}
            </h3>
            <span className="text-[11px] font-bold text-emerald-600">{topPlatform.count} total distributions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Staff Specialists</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{staffKpiData.length}</h3>
            <span className="text-[11px] font-bold text-slate-500">Unit contributors in {selectedYear}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-inner">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setReportView('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
            reportView === 'general'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>General Report (Pillars & Platforms)</span>
        </button>

        <button
          type="button"
          onClick={() => setReportView('individual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
            reportView === 'individual'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Individual Staff KPI</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
            {staffKpiData.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setReportView('weekly')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
            reportView === 'weekly'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Activity Log</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: GENERAL REPORT (EXACT REPLICA OF IMAGE 2 SPREADSHEET) */}
      {/* ============================================================== */}
      {reportView === 'general' && (
        <div className="space-y-10">
          {/* 1. TABLE 1: PILLARS BY MONTH */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Content Pillars by Month ({selectedYear})</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monthly distribution of content strategy pillars published across the year.
                </p>
              </div>
              <span className="text-xs font-black bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100">
                Total: {pillarsMatrix.grandTotal} Posts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm w-full text-xs">
                <thead>
                  <tr className="bg-blue-900 text-white font-black text-[11px] uppercase tracking-wider border-b border-blue-950">
                    <th className="py-3 px-4 min-w-[200px]">Pillars</th>
                    {MONTH_SHORT.map((m) => (
                      <th key={m} className="text-center py-3 px-2.5 min-w-[50px]">{m}</th>
                    ))}
                    <th className="text-center py-3 px-4 min-w-[70px] bg-blue-950 text-amber-300 font-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allPillars.map((p, idx) => {
                    const counts = pillarsMatrix.matrix[p] || new Array(12).fill(0);
                    const rowTotal = pillarsMatrix.rowTotals[p] || 0;
                    const colorStyle = PILLAR_COLORS[p.toLowerCase()] || DEFAULT_COLOR;

                    return (
                      <tr key={p} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${colorStyle.bg}`} />
                          <span>{p}</span>
                        </td>
                        {counts.map((c, mIdx) => (
                          <td
                            key={mIdx}
                            className={`text-center py-2.5 px-2 font-semibold ${
                              c > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-300'
                            }`}
                          >
                            {c}
                          </td>
                        ))}
                        <td className="text-center py-2.5 px-4 font-black text-indigo-700 bg-slate-100/70">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs uppercase">
                    <td className="py-3 px-4 font-black">Total</td>
                    {pillarsMatrix.monthlyTotals.map((tot, idx) => (
                      <td key={idx} className="text-center py-3 px-2 font-black text-blue-900">
                        {tot}
                      </td>
                    ))}
                    <td className="text-center py-3 px-4 font-black text-white bg-blue-900 text-sm">
                      {pillarsMatrix.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2. TABLE 2: PLATFORM BY MONTH */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Publishing Platforms by Month ({selectedYear})</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monthly distribution of content deployed per social media platform.
                </p>
              </div>
              <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
                Total: {platformsMatrix.grandTotal} Deliverables
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider border-b border-slate-950">
                    <th className="py-3 px-4 min-w-[200px]">Social Media Platform</th>
                    {MONTH_SHORT.map((m) => (
                      <th key={m} className="text-center py-3 px-2.5 min-w-[50px]">{m}</th>
                    ))}
                    <th className="text-center py-3 px-4 min-w-[70px] bg-slate-950 text-amber-300 font-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allPlatforms.map((pl, idx) => {
                    const counts = platformsMatrix.matrix[pl] || new Array(12).fill(0);
                    const rowTotal = platformsMatrix.rowTotals[pl] || 0;

                    return (
                      <tr key={pl} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          {pl}
                        </td>
                        {counts.map((c, mIdx) => (
                          <td
                            key={mIdx}
                            className={`text-center py-2.5 px-2 font-semibold ${
                              c > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-300'
                            }`}
                          >
                            {c}
                          </td>
                        ))}
                        <td className="text-center py-2.5 px-4 font-black text-indigo-700 bg-slate-100/70">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs uppercase">
                    <td className="py-3 px-4 font-black">Total</td>
                    {platformsMatrix.monthlyTotals.map((tot, idx) => (
                      <td key={idx} className="text-center py-3 px-2 font-black text-slate-900">
                        {tot}
                      </td>
                    ))}
                    <td className="text-center py-3 px-4 font-black text-white bg-slate-900 text-sm">
                      {platformsMatrix.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 3. GROUPED BAR CHART: PILLARS BY MONTH (EXACT IMAGE 2 REPLICA) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight italic">
                  Pillars by Month ({selectedYear})
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Grouped comparative visualization of strategic focus across each calendar month.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-3">
                {allPillars.slice(0, 8).map((p) => {
                  const color = PILLAR_COLORS[p.toLowerCase()] || DEFAULT_COLOR;
                  return (
                    <div key={p} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className={`w-3 h-3 rounded-sm ${color.bg}`} />
                      <span>{p}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Grouped Bars Container */}
            <div className="pt-4 overflow-x-auto">
              <div className="min-w-[800px] h-72 flex items-end gap-3 pb-8 border-b border-slate-200 relative">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                </div>

                {/* 12 Months Bars Group */}
                {MONTH_SHORT.map((m, mIdx) => {
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                      <div className="flex items-end justify-center gap-0.5 w-full h-[85%] px-0.5">
                        {allPillars.map((p) => {
                          const val = (pillarsMatrix.matrix[p] || [])[mIdx] || 0;
                          const heightPct = maxPillarMonthlyValue > 0 ? (val / maxPillarMonthlyValue) * 100 : 0;
                          const color = PILLAR_COLORS[p.toLowerCase()] || DEFAULT_COLOR;

                          return (
                            <div
                              key={p}
                              className="relative flex-1 max-w-[12px] flex flex-col justify-end items-center group/bar"
                            >
                              {/* Hover Tooltip */}
                              {val > 0 && (
                                <div className="absolute -top-7 z-20 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
                                  {p}: {val}
                                </div>
                              )}
                              <div
                                style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                                className={`w-full rounded-t-xs transition-all ${color.bg} hover:opacity-90`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Month Label */}
                      <span className="text-[10px] font-black uppercase text-slate-500 mt-3 block">
                        {m}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: INDIVIDUAL STAFF KPI REPORT                            */}
      {/* ============================================================== */}
      {reportView === 'individual' && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Staff KPI Performance & Deliverables ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Detailed workload distribution, monthly output, and content delivery metrics per specialist.
              </p>
            </div>

            {/* Filter by staff (for Manager / Head Unit / Admin) */}
            {!isRegularStaff && staffKpiData.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Staff:</span>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="select select-sm select-bordered rounded-xl text-xs font-bold bg-white"
                >
                  <option value="all">All Staff Members ({staffKpiData.length})</option>
                  {staffKpiData.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Staff KPI Cards */}
          {staffKpiData.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-2">
              <User className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-extrabold text-slate-700">No Staff Activity Found in {selectedYear}</h4>
              <p className="text-xs text-slate-400">
                No tickets or publications were assigned to unit staff members in this calendar year.
              </p>
            </div>
          ) : (
            staffKpiData
              .filter((s) => selectedStaffId === 'all' || String(s.id) === selectedStaffId)
              .map((staff) => {
                const isExpanded = Boolean(expandedStaffList[staff.id]);
                const compRate = staff.totalAssigned > 0 ? Math.round((staff.completed / staff.totalAssigned) * 100) : 0;

                return (
                  <div
                    key={staff.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Staff Summary Card Header */}
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-600/20">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{staff.name}</h4>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {staff.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{staff.email}</p>
                        </div>
                      </div>

                      {/* KPI Summary Metrics */}
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap">
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned</span>
                          <span className="text-lg font-black text-slate-900">{staff.totalAssigned}</span>
                        </div>

                        <div className="text-center sm:text-right">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
                          <span className="text-lg font-black text-emerald-600">{staff.completed}</span>
                        </div>

                        <div className="text-center sm:text-right">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Progress</span>
                          <span className="text-lg font-black text-amber-600">{staff.inProgress}</span>
                        </div>

                        <div className="text-center sm:text-right pl-3 border-l border-slate-100">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Completion</span>
                          <span className="text-lg font-black text-indigo-600">{compRate}%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedStaffList({ ...expandedStaffList, [staff.id]: !isExpanded })}
                          className="btn btn-sm btn-ghost rounded-xl text-slate-600 font-bold text-xs flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Breakdown'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Breakdown Body */}
                    {isExpanded && (
                      <div className="p-6 md:p-8 bg-slate-50/50 space-y-6">
                        {/* Monthly Output Distribution */}
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                            Monthly Output Distribution ({selectedYear})
                          </h5>
                          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
                            {MONTH_SHORT.map((m, idx) => {
                              const count = staff.monthlyCounts[idx] || 0;
                              return (
                                <div
                                  key={m}
                                  className={`p-2.5 rounded-xl border text-xs ${
                                    count > 0 ? 'bg-white border-indigo-200 text-indigo-900 font-black shadow-2xs' : 'bg-slate-100/60 border-slate-200/60 text-slate-400 font-medium'
                                  }`}
                                >
                                  <span className="text-[9px] uppercase tracking-wider block text-slate-400">{m}</span>
                                  <span className="text-sm font-black mt-0.5 block">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Two Columns: Top Pillars & Top Platforms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Pillar Contribution
                            </span>
                            <div className="space-y-1.5">
                              {Object.entries(staff.pillarsCount).map(([pName, count]) => (
                                <div key={pName} className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700">{pName}</span>
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    {count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Platform Distribution
                            </span>
                            <div className="space-y-1.5">
                              {Object.entries(staff.platformsCount).map(([plName, count]) => (
                                <div key={plName} className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700">{plName}</span>
                                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Recent Jobs Handled */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Recent Assigned Requests ({staff.jobsList.length})
                          </span>
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {staff.jobsList.slice(0, 10).map((job: any) => (
                              <div
                                key={job.id}
                                className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-black text-indigo-700 shrink-0">#{job.ticket_no || job.id}</span>
                                  <span className="font-bold text-slate-800 truncate">{job.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {job.status === 'completed' ? 'Done' : 'Processing'}
                                  </span>
                                  <Link
                                    to={`/portal/job-requests/${job.id}`}
                                    className="text-slate-400 hover:text-indigo-600"
                                    title="Open ticket details"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: WEEKLY ACTIVITY LOG                                   */}
      {/* ============================================================== */}
      {reportView === 'weekly' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6">
          <ReportsPage embedded={true} overrideUnit={currentUnit} />
        </div>
      )}
    </div>
  );
};
