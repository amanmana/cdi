import React, { useState, useMemo, useEffect } from 'react';
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
  Building2,
} from 'lucide-react';

interface SocialMediaReportsProps {
  jobs: any[];
  user: any;
  currentUnit: string;
  allUsers?: any[];
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

const COLOR_PALETTE = [
  { bg: 'bg-blue-600', fill: '#2563eb', border: 'border-blue-700', text: 'text-blue-700' },
  { bg: 'bg-amber-600', fill: '#d97706', border: 'border-amber-700', text: 'text-amber-700' },
  { bg: 'bg-slate-500', fill: '#64748b', border: 'border-slate-600', text: 'text-slate-700' },
  { bg: 'bg-yellow-500', fill: '#eab308', border: 'border-yellow-600', text: 'text-yellow-700' },
  { bg: 'bg-cyan-600', fill: '#0891b2', border: 'border-cyan-700', text: 'text-cyan-700' },
  { bg: 'bg-emerald-600', fill: '#059669', border: 'border-emerald-700', text: 'text-emerald-700' },
  { bg: 'bg-purple-600', fill: '#9333ea', border: 'border-purple-700', text: 'text-purple-700' },
  { bg: 'bg-rose-500', fill: '#f43f5e', border: 'border-rose-600', text: 'text-rose-700' },
  { bg: 'bg-teal-600', fill: '#0d9488', border: 'border-teal-700', text: 'text-teal-700' },
  { bg: 'bg-indigo-600', fill: '#4f46e5', border: 'border-indigo-700', text: 'text-indigo-700' },
];

const normalizePlatform = (raw: string): string => {
  const clean = raw.trim();
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('linke') && lower.includes('repost')) return 'LinkedIn Repost';
  if (lower.includes('linke')) return 'LinkedIn';
  if (lower.includes('face') && lower.includes('repost')) return 'Facebook Repost';
  if (lower.includes('face')) return 'Facebook';
  if (lower.includes('insta')) return 'Instagram';
  if (lower.includes('tik')) return 'Tiktok';
  if (lower.includes('you')) return 'Youtube';
  if (lower.includes('thread')) return 'Threads';
  if (lower.includes('twit') || lower === 'x') return 'Twitter';

  const match = CANONICAL_PLATFORMS.find((cp) => cp.toLowerCase() === clean.toLowerCase());
  return match || clean;
};

export const SocialMediaReports: React.FC<SocialMediaReportsProps> = ({
  jobs,
  user,
  currentUnit,
  allUsers,
}) => {
  const isSocMed = Boolean(
    currentUnit.toLowerCase().includes('social') ||
    currentUnit.toLowerCase().includes('socmed')
  );

  // Current view: 'general' (Pillars & Platforms) vs 'individual' (Staff KPI) vs 'weekly' (Weekly Log)
  const [reportView, setReportView] = useState<'general' | 'individual' | 'weekly'>(
    isSocMed ? 'general' : 'individual'
  );

  useEffect(() => {
    if (!isSocMed && reportView === 'general') {
      setReportView('individual');
    }
  }, [isSocMed, currentUnit]);

  // Year filter (default to current year, e.g. 2026)
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);

  // Staff filter for Individual Report (for leadership / Head Unit)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [expandedStaffList, setExpandedStaffList] = useState<Record<number, boolean>>({});

  // Chart visual presentation: 'clustered' (Excel replica) vs 'stacked'
  const [chartStyle, setChartStyle] = useState<'clustered' | 'stacked'>('clustered');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{ pillar: string; month: string; val: number; x: number; y: number } | null>(null);

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

    const checkObj = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        const kLower = k.toLowerCase().replace(/[^a-z]/g, '');
        if (kLower.includes('pillar')) {
          if (Array.isArray(v)) pillars.push(...v);
          else if (typeof v === 'string') pillars.push(...v.split(',').map((s: string) => s.trim()));
        }
        if (
          kLower.includes('plat') || // matches platorm, platform, platforms
          kLower.includes('channel') ||
          kLower.includes('socmed') ||
          kLower.includes('socialmedia')
        ) {
          if (Array.isArray(v)) platforms.push(...v);
          else if (typeof v === 'string') platforms.push(...v.split(',').map((s: string) => s.trim()));
        }
      }
    };

    // 1. From selected_services
    if (Array.isArray(addData.selected_services)) {
      for (const s of addData.selected_services) {
        checkObj(s.fields);
        checkObj(s.custom_fields);
      }
    }

    // 2. From unit_assignments
    if (addData.unit_assignments && typeof addData.unit_assignments === 'object') {
      for (const [_, uMeta] of Object.entries(addData.unit_assignments as any)) {
        checkObj((uMeta as any)?.fields);
        checkObj((uMeta as any)?.custom_fields);
      }
    }

    // 3. Direct from additional_data & custom_fields
    checkObj(addData.custom_fields);
    checkObj(addData.custom_fields_data);
    checkObj(addData);

    // Canonical matching for known pillars
    const cleanPillars = Array.from(new Set(pillars.filter(Boolean))).map((p) => {
      const pMatch = CANONICAL_PILLARS.find((cp) => cp.toLowerCase() === p.toLowerCase().trim());
      return pMatch || p.trim();
    });

    // Canonical matching for known platforms
    const cleanPlatforms = Array.from(new Set(platforms.filter(Boolean)))
      .map(normalizePlatform)
      .filter((p) => p && !['true', 'false', 'null', 'undefined'].includes(p.toLowerCase()));

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

  // 6. Dynamic Y-Axis scale calculation for executive chart
  const yAxisConfig = useMemo(() => {
    let max = 0;
    if (chartStyle === 'stacked') {
      pillarsMatrix.monthlyTotals.forEach((tot) => {
        if (tot > max) max = tot;
      });
    } else {
      allPillars.forEach((p) => {
        (pillarsMatrix.matrix[p] || []).forEach((val) => {
          if (val > max) max = val;
        });
      });
    }

    if (max <= 5) return { yMax: 5, ticks: [0, 1, 2, 3, 4, 5] };
    if (max <= 10) return { yMax: 10, ticks: [0, 2, 4, 6, 8, 10] };
    if (max <= 20) return { yMax: 20, ticks: [0, 5, 10, 15, 20] };
    if (max <= 50) return { yMax: 50, ticks: [0, 10, 20, 30, 40, 50] };
    if (max <= 100) return { yMax: 100, ticks: [0, 20, 40, 60, 80, 100] };
    if (max <= 200) return { yMax: 200, ticks: [0, 40, 80, 120, 160, 200] };

    const step = Math.ceil(max / 5 / 10) * 10;
    const yMax = step * 5;
    return {
      yMax,
      ticks: [0, step, step * 2, step * 3, step * 4, yMax],
    };
  }, [allPillars, pillarsMatrix, chartStyle]);

  // 7. Individual Staff KPI Computations
  const isRegularStaff = user?.role === 'staff' && !user?.is_unit_head && !user?.is_acting_manager;

  const staffKpiData = useMemo(() => {
    const targetUnitClean = (currentUnit || '').toLowerCase().trim();

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
      servicesCount: Record<string, number>;
      jobsList: any[];
    }> = {};

    // 1. Pre-populate all active unit staff from allUsers (if available)
    if (Array.isArray(allUsers) && allUsers.length > 0) {
      allUsers.forEach((u: any) => {
        const uUnit = (u.unit || '').toLowerCase().trim();
        const isMatch = Boolean(
          (targetUnitClean && uUnit === targetUnitClean) ||
          (isSocMed && (uUnit.includes('social') || uUnit.includes('socmed')))
        );
        if (isMatch && (u.role === 'staff' || u.is_unit_head)) {
          const uId = Number(u.id);
          staffMap[uId] = {
            id: uId,
            name: u.name,
            email: u.email,
            unit: u.unit || currentUnit,
            totalAssigned: 0,
            completed: 0,
            inProgress: 0,
            monthlyCounts: new Array(12).fill(0),
            pillarsCount: {},
            platformsCount: {},
            servicesCount: {},
            jobsList: [],
          };
        }
      });
    }

    // 2. Aggregate yearly jobs
    yearlyJobs.forEach((job) => {
      const staffList = job.assigned_staff || job.assigned_staff_details || [];
      const d = getJobDate(job);
      const mIdx = d.getMonth();
      const { pillars, platforms } = extractPillarsAndPlatforms(job);
      const isDone = job.status === 'completed' || job.is_done;

      // Extract services or categories for breakdown
      const serviceNames: string[] = [];
      const addData = job.additional_data || {};
      if (Array.isArray(addData.selected_services)) {
        addData.selected_services.forEach((s: any) => {
          if (s.title) serviceNames.push(s.title);
          else if (s.name) serviceNames.push(s.name);
        });
      }
      if (serviceNames.length === 0 && job.title) {
        serviceNames.push(job.title);
      }

      if (Array.isArray(staffList) && staffList.length > 0) {
        staffList.forEach((s: any) => {
          const sUnit = (s.unit || '').toLowerCase().trim();

          // STRICT UNIT FILTER: Only display staff who belong to current unit!
          // Exclude cross-unit collaborators (e.g. Graphic & Web, Writer)
          const isUnitMember = Boolean(
            (targetUnitClean && sUnit === targetUnitClean) ||
            (isSocMed && (sUnit.includes('social') || sUnit.includes('socmed')))
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
              servicesCount: {},
              jobsList: [],
            };
          }

          staffMap[sId].totalAssigned += 1;
          if (isDone) staffMap[sId].completed += 1;
          else staffMap[sId].inProgress += 1;

          staffMap[sId].monthlyCounts[mIdx] += 1;

          if (isSocMed) {
            pillars.forEach((p) => {
              staffMap[sId].pillarsCount[p] = (staffMap[sId].pillarsCount[p] || 0) + 1;
            });
            platforms.forEach((pl) => {
              staffMap[sId].platformsCount[pl] = (staffMap[sId].platformsCount[pl] || 0) + 1;
            });
          } else {
            serviceNames.forEach((srv) => {
              staffMap[sId].servicesCount[srv] = (staffMap[sId].servicesCount[srv] || 0) + 1;
            });
          }

          staffMap[sId].jobsList.push(job);
        });
      }
    });

    let list = Object.values(staffMap);

    // If regular staff, strictly filter to viewing ONLY their own report
    if (isRegularStaff) {
      list = list.filter((s) => s.id === Number(user?.id));
    }

    // Sort each staff's jobsList by date descending (newest first)
    list.forEach((s) => {
      s.jobsList.sort((a, b) => getJobDate(b).getTime() - getJobDate(a).getTime());
    });

    return list.sort((a, b) => b.completed - a.completed);
  }, [yearlyJobs, currentUnit, isRegularStaff, user?.id, allUsers, isSocMed]);

  // Overall Unit Performance Stats for current year
  const yearlyUnitStats = useMemo(() => {
    const total = yearlyJobs.length;
    const completed = yearlyJobs.filter((j) => j.status === 'completed' || j.is_done).length;
    const inProgress = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, rate };
  }, [yearlyJobs]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows: string[][] = [];

    if (isSocMed) {
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
      rows.push([]);
    }

    // Staff KPI Performance Table (included for all units!)
    rows.push([`STAFF KPI PERFORMANCE REPORT - ${selectedYear} (${currentUnit})`]);
    rows.push(['STAFF NAME', 'EMAIL', 'UNIT', 'ASSIGNED', 'COMPLETED', 'IN PROGRESS', 'COMPLETION RATE', ...MONTH_NAMES, 'DELIVERABLES']);
    staffKpiData.forEach((staff) => {
      const compRate = staff.totalAssigned > 0 ? `${Math.round((staff.completed / staff.totalAssigned) * 100)}%` : '0%';
      const categories = Object.keys(staff.servicesCount || staff.pillarsCount || {}).join('; ');
      rows.push([
        staff.name,
        staff.email,
        staff.unit,
        String(staff.totalAssigned),
        String(staff.completed),
        String(staff.inProgress),
        compRate,
        ...staff.monthlyCounts.map(String),
        categories || 'General Tasks',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenameUnit = currentUnit.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `${filenameUnit}_KPI_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Section-specific PDF / Print Handler (clean landscape executive preview)
  const handlePrintSection = (elementId: string, title: string) => {
    const elem = document.getElementById(elementId);
    if (!elem) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
      window.print();
      return;
    }

    const clonedElem = elem.cloneNode(true) as HTMLElement;
    clonedElem.querySelectorAll('.no-print, button').forEach((el) => el.remove());

    const contentHtml = clonedElem.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${selectedYear}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            @page {
              size: landscape;
              margin: 15mm 12mm;
            }
            body {
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff;
              color: #0f172a;
              padding: 24px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 6px;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5;">Corporate Digital Innovation (CDI)</span>
              <h1 style="font-size: 20px; font-weight: 900; margin: 2px 0 0 0; color: #0f172a;">${title}</h1>
              <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Unit: ${currentUnit} • Calendar Year: ${selectedYear} • Generated on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div style="text-align: right;">
              <span style="background-color: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase;">Executive Presentation Report</span>
            </div>
          </div>
          <div style="margin-top: 12px;">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            {isSocMed ? <Share2 className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{currentUnit} Intelligence & Reporting Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {isSocMed ? 'Content Analytics & Performance Matrix' : `${currentUnit} Performance & Staff KPI Matrix`}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isSocMed
              ? 'Data aggregated from internal job intake forms, dynamic client specifications, and publishing completions.'
              : 'Data aggregated from assigned tickets, specialist workload allocations, and job completions.'}
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
      {isSocMed ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Requests ({selectedYear})</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{yearlyUnitStats.total}</h3>
              <span className="text-[11px] font-bold text-slate-500">All Active & Completed</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Completed Requests</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{yearlyUnitStats.completed}</h3>
              <span className="text-[11px] font-bold text-slate-500">Finalized deliverables</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Completion Rate</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{yearlyUnitStats.rate}%</h3>
              <span className="text-[11px] font-bold text-slate-500">{yearlyUnitStats.inProgress} currently in progress</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">Active Staff Specialists</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">{staffKpiData.length}</h3>
              <span className="text-[11px] font-bold text-slate-500">Unit contributors in {selectedYear}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-inner">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
        {isSocMed && (
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
        )}

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
          <div id="table-pillars" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Content Pillars by Month ({selectedYear})</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monthly distribution of content strategy pillars published across the year.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100">
                  Total: {pillarsMatrix.grandTotal} Posts
                </span>
                <button
                  type="button"
                  onClick={() => handlePrintSection('table-pillars', `Content Pillars by Month (${selectedYear})`)}
                  className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 transition-all h-8 px-2.5"
                  title="Export this table as PDF"
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                  <span>Export PDF</span>
                </button>
              </div>
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
                    const colorStyle = PILLAR_COLORS[p.toLowerCase()] || COLOR_PALETTE[idx % COLOR_PALETTE.length];

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
          <div id="table-platforms" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Publishing Platforms by Month ({selectedYear})</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monthly distribution of content deployed per social media platform.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
                  Total: {platformsMatrix.grandTotal} Deliverables
                </span>
                <button
                  type="button"
                  onClick={() => handlePrintSection('table-platforms', `Publishing Platforms by Month (${selectedYear})`)}
                  className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 transition-all h-8 px-2.5"
                  title="Export this table as PDF"
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                  <span>Export PDF</span>
                </button>
              </div>
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

          {/* 3. GROUPED BAR CHART: PILLARS BY MONTH (EXECUTIVE EXCEL REPLICA) */}
          <div id="chart-pillars" className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-6">
            {/* Top Bar: Title, Chart Mode Switcher, and Export Action */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight italic">
                    Pillars by Month ({selectedYear})
                  </h3>
                  <span className="badge badge-sm font-bold bg-slate-100 text-slate-700 border-slate-200">
                    {pillarsMatrix.grandTotal} Total Publications
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Standard grouped column distribution of strategic content pillars across 12 calendar months.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Switcher: Clustered vs Stacked */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setChartStyle('clustered')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      chartStyle === 'clustered'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>Clustered</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartStyle('stacked')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      chartStyle === 'stacked'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📈</span>
                    <span>Stacked</span>
                  </button>
                </div>

                {/* Export PDF Button */}
                <button
                  type="button"
                  onClick={() => handlePrintSection('chart-pillars', `Pillars by Month Chart (${selectedYear})`)}
                  className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all"
                  title="Export this chart as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div className="w-full overflow-x-auto relative pt-2">
              <div className="min-w-[850px] w-full">
                {(() => {
                  // Coordinate specifications for 1000 x 410 viewBox
                  const svgWidth = 1000;
                  const svgHeight = 410;
                  const plotX = 65;
                  const plotRight = 780;
                  const plotWidth = plotRight - plotX; // 715px
                  const plotTop = 35;
                  const plotBottom = 370;
                  const plotHeight = plotBottom - plotTop; // 335px
                  const monthSlotWidth = plotWidth / 12; // ~59.58px per month

                  const { yMax, ticks } = yAxisConfig;

                  return (
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-auto select-none font-sans"
                      style={{ maxHeight: '460px' }}
                    >
                      {/* 1. Horizontal Grid Lines & Y-Axis Labels */}
                      {ticks.map((tickVal) => {
                        const yPos = plotBottom - (tickVal / yMax) * plotHeight;
                        const isZero = tickVal === 0;

                        return (
                          <g key={`tick-${tickVal}`}>
                            {/* Horizontal Line */}
                            <line
                              x1={plotX}
                              y1={yPos}
                              x2={plotRight}
                              y2={yPos}
                              stroke={isZero ? '#94a3b8' : '#e2e8f0'}
                              strokeWidth={isZero ? 1.5 : 1}
                              strokeDasharray={isZero ? 'none' : '3,3'}
                            />
                            {/* Tick Label */}
                            <text
                              x={plotX - 12}
                              y={yPos + 4}
                              textAnchor="end"
                              className="text-[11px] font-semibold fill-slate-500"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* 2. Left Y-Axis Vertical Line */}
                      <line
                        x1={plotX}
                        y1={plotTop - 5}
                        x2={plotX}
                        y2={plotBottom}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />

                      {/* 3. Monthly Columns & Bars */}
                      {MONTH_NAMES.map((mName, mIdx) => {
                        const slotCenterX = plotX + mIdx * monthSlotWidth + monthSlotWidth / 2;
                        const shortMonth = MONTH_SHORT[mIdx].toUpperCase();

                        // Ticks on baseline
                        const tickX = plotX + (mIdx + 1) * monthSlotWidth;

                        return (
                          <g key={mName}>
                            {/* Baseline month separator tick */}
                            {mIdx < 11 && (
                              <line
                                x1={tickX}
                                y1={plotBottom}
                                x2={tickX}
                                y2={plotBottom + 4}
                                stroke="#cbd5e1"
                                strokeWidth={1}
                              />
                            )}

                            {/* Single Month Label below baseline */}
                            <text
                              x={slotCenterX}
                              y={plotBottom + 20}
                              textAnchor="middle"
                              className="text-[10px] font-extrabold fill-slate-700 tracking-wider uppercase"
                            >
                              {shortMonth}
                            </text>

                            {/* --- BARS RENDERING: CLUSTERED MODE --- */}
                            {chartStyle === 'clustered' && (() => {
                              const numPillars = allPillars.length;
                              const clusterWidth = Math.min(monthSlotWidth * 0.88, 52);
                              const barWidth = Math.max(clusterWidth / numPillars, 5);
                              const groupStartX = slotCenterX - (numPillars * barWidth) / 2;

                              return allPillars.map((p, pIdx) => {
                                const val = (pillarsMatrix.matrix[p] || [])[mIdx] || 0;
                                const color = PILLAR_COLORS[p.toLowerCase()] || COLOR_PALETTE[pIdx % COLOR_PALETTE.length];
                                const barX = groupStartX + pIdx * barWidth;
                                const barHeight = val > 0 ? (val / yMax) * plotHeight : 0;
                                const barY = plotBottom - barHeight;

                                if (val === 0) return null;

                                return (
                                  <g
                                    key={p}
                                    className="cursor-pointer transition-opacity hover:opacity-85"
                                    onMouseEnter={(e) => {
                                      setHoveredChartPoint({
                                        pillar: p,
                                        month: mName,
                                        val,
                                        x: barX + barWidth / 2,
                                        y: barY,
                                      });
                                    }}
                                    onMouseLeave={() => setHoveredChartPoint(null)}
                                  >
                                    {/* Bar Rectangle with rounded top */}
                                    <rect
                                      x={barX + 0.5}
                                      y={barY}
                                      width={Math.max(barWidth - 1, 3)}
                                      height={barHeight}
                                      fill={color.fill}
                                      rx={2}
                                      className="transition-all"
                                    />

                                    {/* Value Number above bar */}
                                    <text
                                      x={barX + (barWidth - 1) / 2}
                                      y={barY - 4}
                                      textAnchor="middle"
                                      className="text-[9px] font-black fill-slate-800"
                                    >
                                      {val}
                                    </text>
                                  </g>
                                );
                              });
                            })()}

                            {/* --- BARS RENDERING: STACKED MODE --- */}
                            {chartStyle === 'stacked' && (() => {
                              const stackColWidth = 28;
                              const stackColX = slotCenterX - stackColWidth / 2;
                              let accumY = plotBottom;
                              const monthTotal = pillarsMatrix.monthlyTotals[mIdx] || 0;

                              return (
                                <g key={`stacked-${mIdx}`}>
                                  {allPillars.map((p, pIdx) => {
                                    const val = (pillarsMatrix.matrix[p] || [])[mIdx] || 0;
                                    if (val === 0) return null;

                                    const color = PILLAR_COLORS[p.toLowerCase()] || COLOR_PALETTE[pIdx % COLOR_PALETTE.length];
                                    const segHeight = (val / yMax) * plotHeight;
                                    const segY = accumY - segHeight;
                                    accumY = segY;

                                    return (
                                      <g
                                        key={p}
                                        className="cursor-pointer transition-opacity hover:opacity-85"
                                        onMouseEnter={() => {
                                          setHoveredChartPoint({
                                            pillar: p,
                                            month: mName,
                                            val,
                                            x: slotCenterX,
                                            y: segY,
                                          });
                                        }}
                                        onMouseLeave={() => setHoveredChartPoint(null)}
                                      >
                                        <rect
                                          x={stackColX}
                                          y={segY}
                                          width={stackColWidth}
                                          height={segHeight}
                                          fill={color.fill}
                                          rx={segY === plotBottom - segHeight ? 2 : 0}
                                        />
                                        {segHeight >= 14 && (
                                          <text
                                            x={slotCenterX}
                                            y={segY + segHeight / 2 + 3}
                                            textAnchor="middle"
                                            className="text-[9px] font-black fill-white pointer-events-none"
                                          >
                                            {val}
                                          </text>
                                        )}
                                      </g>
                                    );
                                  })}

                                  {/* Total on top of stacked bar */}
                                  {monthTotal > 0 && (
                                    <text
                                      x={slotCenterX}
                                      y={accumY - 5}
                                      textAnchor="middle"
                                      className="text-[10px] font-black fill-slate-800"
                                    >
                                      {monthTotal}
                                    </text>
                                  )}
                                </g>
                              );
                            })()}
                          </g>
                        );
                      })}

                      {/* 4. Bottom Baseline Axis */}
                      <line
                        x1={plotX}
                        y1={plotBottom}
                        x2={plotRight}
                        y2={plotBottom}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />

                      {/* 5. Right-Side Vertical Legend (Exact Excel Replica) */}
                      <g transform={`translate(${plotRight + 25}, ${plotTop})`}>
                        {/* Legend Background Box */}
                        <rect
                          x={0}
                          y={-10}
                          width={180}
                          height={Math.max(allPillars.length * 28 + 35, 140)}
                          fill="#f8fafc"
                          stroke="#e2e8f0"
                          strokeWidth={1}
                          rx={8}
                        />

                        {/* Legend Header */}
                        <text
                          x={12}
                          y={12}
                          className="text-[10px] font-black fill-slate-500 uppercase tracking-wider"
                        >
                          Strategic Pillars
                        </text>

                        {/* Legend Items */}
                        {allPillars.map((p, pIdx) => {
                          const color = PILLAR_COLORS[p.toLowerCase()] || COLOR_PALETTE[pIdx % COLOR_PALETTE.length];
                          const itemY = 32 + pIdx * 25;
                          const totalForPillar = pillarsMatrix.rowTotals[p] || 0;

                          return (
                            <g key={p} className="select-none cursor-default">
                              {/* Color Box */}
                              <rect
                                x={12}
                                y={itemY - 9}
                                width={11}
                                height={11}
                                rx={2}
                                fill={color.fill}
                              />
                              {/* Pillar Label (truncated if long) */}
                              <text
                                x={30}
                                y={itemY}
                                className="text-[10.5px] font-semibold fill-slate-700"
                              >
                                {p.length > 18 ? `${p.slice(0, 17)}…` : p}
                              </text>
                              {/* Pillar Total Count */}
                              <text
                                x={168}
                                y={itemY}
                                textAnchor="end"
                                className="text-[10px] font-black fill-slate-400"
                              >
                                {totalForPillar}
                              </text>
                            </g>
                          );
                        })}
                      </g>

                      {/* 6. Hover Tooltip Overlay */}
                      {hoveredChartPoint && (
                        <g
                          transform={`translate(${Math.min(
                            Math.max(hoveredChartPoint.x, 80),
                            plotRight - 70
                          )}, ${Math.max(hoveredChartPoint.y - 45, 15)})`}
                          className="pointer-events-none"
                        >
                          <rect
                            x={-75}
                            y={0}
                            width={150}
                            height={38}
                            rx={6}
                            fill="#0f172a"
                            className="shadow-xl"
                          />
                          <text
                            x={0}
                            y={15}
                            textAnchor="middle"
                            className="text-[9.5px] font-bold fill-slate-300"
                          >
                            {hoveredChartPoint.month} • {hoveredChartPoint.pillar}
                          </text>
                          <text
                            x={0}
                            y={29}
                            textAnchor="middle"
                            className="text-[11px] font-black fill-emerald-400"
                          >
                            {hoveredChartPoint.val} {hoveredChartPoint.val === 1 ? 'publication' : 'publications'}
                          </text>
                        </g>
                      )}
                    </svg>
                  );
                })()}
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

                        {/* Breakdown: Pillars & Platforms (for SocMed) vs Service Deliverables (for Other Units) */}
                        {isSocMed ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Pillar Contribution
                              </span>
                              <div className="space-y-1.5">
                                {Object.entries(staff.pillarsCount).length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">No pillars recorded</span>
                                ) : (
                                  Object.entries(staff.pillarsCount).map(([pName, count]) => (
                                    <div key={pName} className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-700">{pName}</span>
                                      <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        {count}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Platform Distribution
                              </span>
                              <div className="space-y-1.5">
                                {Object.entries(staff.platformsCount).length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">No platforms recorded</span>
                                ) : (
                                  Object.entries(staff.platformsCount).map(([plName, count]) => (
                                    <div key={plName} className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-700">{plName}</span>
                                      <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                        {count}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Deliverable & Service Category Contribution
                            </span>
                            {Object.keys(staff.servicesCount).length === 0 ? (
                              <span className="text-xs text-slate-400 italic">No specific service categories recorded</span>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(staff.servicesCount).map(([sName, count]) => (
                                  <div key={sName} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                    <span className="font-bold text-slate-700 truncate pr-2" title={sName}>{sName}</span>
                                    <span className="font-extrabold text-indigo-600 bg-white border border-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                                      {count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assigned Requests Handled in Selected Year */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Assigned Requests in {selectedYear} ({staff.jobsList.length} Total)
                            </span>
                            {staff.jobsList.length > 10 && (
                              <span className="text-[10px] font-bold text-slate-400">
                                Showing latest 10 of {staff.jobsList.length}
                              </span>
                            )}
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
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
