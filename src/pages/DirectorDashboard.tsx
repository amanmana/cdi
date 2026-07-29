import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FolderCheck,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  CheckCircle2,
  Hourglass,
  Calendar,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';

interface ExecutiveKPIs {
  total_projects: number;
  completed_projects: number;
  active_projects: number;
  pending_approval: number;
  on_hold_cancelled: number;
  completion_rate: number;
}

interface UnitBreakdown {
  unit_id: number;
  unit_name: string;
  total_projects: number;
  completed_projects: number;
  active_projects: number;
  pending_projects: number;
  staff_count: number;
  completion_rate: number;
}

interface StatusItem {
  label: string;
  value: number;
  color: string;
}

interface SlaHealth {
  sla_compliance_rate: number;
  on_time_count: number;
  overdue_count: number;
  active_count: number;
}

interface ClientDemandItem {
  client_name: string;
  client_email: string;
  project_count: number;
  completed_count: number;
  percentage_share: number;
}

interface ClientProfile {
  name: string;
  email: string;
  company: string;
  phone?: string;
  role: string;
}

interface ProjectItem {
  id: number;
  ticket_no: string;
  title: string;
  client_name: string;
  client_email: string;
  status: string;
  current_step_name: string;
  unit_name: string;
  start_date: string;
  deadline: string;
  assigned_staff_names: string[];
  created_at: string;
}

export const DirectorDashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [kpis, setKpis] = useState<ExecutiveKPIs>({
    total_projects: 0,
    completed_projects: 0,
    active_projects: 0,
    pending_approval: 0,
    on_hold_cancelled: 0,
    completion_rate: 0,
  });
  const [units, setUnits] = useState<UnitBreakdown[]>([]);
  const [statusDist, setStatusDist] = useState<StatusItem[]>([]);
  const [slaHealth, setSlaHealth] = useState<SlaHealth>({
    sla_compliance_rate: 100,
    on_time_count: 0,
    overdue_count: 0,
    active_count: 0,
  });
  const [clientDemand, setClientDemand] = useState<ClientDemandItem[]>([]);

  // Timeframe Filter State (Default: 2026 / All Months)
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Drill Deep Modal State
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('All Projects');
  const [drillProjects, setDrillProjects] = useState<ProjectItem[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillSearch, setDrillSearch] = useState('');
  const [drillUnitFilter, setDrillUnitFilter] = useState('all');
  const [drillStatusFilter, setDrillStatusFilter] = useState('all');
  const [drillClientFilter, setDrillClientFilter] = useState('all');
  const [drillClientProfile, setDrillClientProfile] = useState<ClientProfile | null>(null);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/director/stats?year=${selectedYear}&month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.kpis) setKpis(data.kpis);
      if (data.unit_breakdown) setUnits(data.unit_breakdown);
      if (data.status_distribution) setStatusDist(data.status_distribution);
      if (data.sla_health) setSlaHealth(data.sla_health);
      if (data.client_demand) setClientDemand(data.client_demand);
    } catch (err) {
      console.error('Error loading director stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, selectedYear, selectedMonth]);

  const openDrillModal = async (title: string, unitFilter = 'all', statusFilter = 'all') => {
    setDrillTitle(title);
    setDrillUnitFilter(unitFilter);
    setDrillStatusFilter(statusFilter);
    setDrillClientFilter('all');
    setDrillSearch('');
    setDrillModalOpen(true);
    fetchDrillProjects(unitFilter, statusFilter, '', 'all');
  };

  const openDrillModalClient = async (title: string, clientName: string) => {
    setDrillTitle(title);
    setDrillUnitFilter('all');
    setDrillStatusFilter('all');
    setDrillClientFilter(clientName);
    setDrillSearch('');
    setDrillModalOpen(true);
    fetchDrillProjects('all', 'all', '', clientName);
  };

  const fetchDrillProjects = async (unit: string, status: string, search: string, client = drillClientFilter) => {
    setDrillLoading(true);
    try {
      const params = new URLSearchParams();
      if (unit && unit !== 'all') params.append('unit', unit);
      if (status && status !== 'all') params.append('status', status);
      if (client && client !== 'all') params.append('client', client);
      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedMonth && selectedMonth !== 'all') params.append('month', selectedMonth);
      if (search) params.append('search', search);

      const res = await fetch(`/api/director/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDrillProjects(data.projects || []);
      setDrillClientProfile(data.client_profile || null);
    } catch (err) {
      console.error('Error loading drill-deep projects:', err);
    } finally {
      setDrillLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">COMPLETED</span>;
      case 'staff_processing':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">IN PROCESSING</span>;
      case 'manager_approval':
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">PENDING APPROVAL</span>;
      case 'on_hold':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">ON HOLD</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">{status.toUpperCase()}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="loading loading-spinner loading-lg text-purple-600"></div>
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
            Loading Executive Intelligence...
          </p>
        </div>
      </div>
    );
  }

  // Calculate SVG Pie/Donut Chart Paths
  const totalDist = statusDist.reduce((acc, curr) => acc + curr.value, 0);
  let accumulatedAngle = 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* EXECUTIVE HERO HEADER */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> EXECUTIVE OVERVIEW & INTELLIGENCE
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Director Executive Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium max-w-xl">
              Cross-departmental performance monitoring, live project status tracking, and workload insights across all operational units.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs rounded-xl px-4 gap-2 uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => openDrillModal('All System Projects', 'all', 'all')}
              className="btn btn-sm bg-purple-600 hover:bg-purple-500 text-white border-none font-extrabold text-xs rounded-xl px-5 gap-2 uppercase tracking-wider shadow-lg shadow-purple-600/30"
            >
              <Eye className="w-3.5 h-3.5" /> Drill Deep (All)
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE TIMEFRAME FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Executive Timeframe Filter
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              Showing data for {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`} {selectedMonth !== 'all' ? `(Month ${selectedMonth})` : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setSelectedYear('2026'); setSelectedMonth('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedYear === '2026' && selectedMonth === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahun Ini (2026)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedYear('2026'); setSelectedMonth('07'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedYear === '2026' && selectedMonth === '07'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini (Julai)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedYear === 'all' && selectedMonth === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Keseluruhan (All Time)
            </button>
          </div>

          {/* Year Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-500 hidden sm:inline">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:border-purple-600 focus:outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="all">All Years</option>
            </select>
          </div>

          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-500 hidden sm:inline">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:border-purple-600 focus:outline-none"
            >
              <option value="all">All Months (Jan-Dec)</option>
              <option value="01">January (01)</option>
              <option value="02">February (02)</option>
              <option value="03">March (03)</option>
              <option value="04">April (04)</option>
              <option value="05">May (05)</option>
              <option value="06">June (06)</option>
              <option value="07">July (07)</option>
              <option value="08">August (08)</option>
              <option value="09">September (09)</option>
              <option value="10">October (10)</option>
              <option value="11">November (11)</option>
              <option value="12">December (12)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Projects */}
        <div
          onClick={() => openDrillModal('All System Projects', 'all', 'all')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              TOTAL SYSTEM PROJECTS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.total_projects}
            </span>
            <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
              100% Total
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            Across all service departments
          </p>
        </div>

        {/* KPI 2: Completion Rate */}
        <div
          onClick={() => openDrillModal('Completed Projects', 'all', 'completed')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              COMPLETED PROJECTS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.completed_projects}
            </span>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {kpis.completion_rate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.completion_rate}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 3: In Processing */}
        <div
          onClick={() => openDrillModal('Active In-Processing Projects', 'all', 'active')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              STAFF IN-PROCESSING
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.active_projects}
            </span>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
              Active Load
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            Currently worked on by staff
          </p>
        </div>

        {/* KPI 4: Pending Manager Review */}
        <div
          onClick={() => openDrillModal('Pending Approval Projects', 'all', 'pending')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              PENDING APPROVAL
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.pending_approval}
            </span>
            <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
              Awaiting Action
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            Requests awaiting manager review
          </p>
        </div>
      </div>

      {/* MULTI-UNIT OVERVIEW GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" /> Unit-by-Unit Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Click any unit card to drill deep into its project list.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {units
            .filter((u) => !['administrator', 'admin', 'it support', 'executive management'].includes(u.unit_name.toLowerCase().trim()))
            .map((u) => (
            <div
              key={u.unit_id}
              onClick={() => openDrillModal(`Unit: ${u.unit_name}`, u.unit_name, 'all')}
              className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl transition-all cursor-pointer group space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                    {u.unit_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {u.unit_name} Unit
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {u.staff_count} Staff Assigned
                    </span>
                  </div>
                </div>

                <span className="text-xs font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 flex items-center gap-1 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  Drill <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">TOTAL</span>
                  <span className="text-base font-black text-slate-800">{u.total_projects}</span>
                </div>
                <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100/60">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">ACTIVE</span>
                  <span className="text-base font-black text-blue-700">{u.active_projects}</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100/60">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">DONE</span>
                  <span className="text-base font-black text-emerald-700">{u.completed_projects}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-extrabold">
                  <span className="text-slate-400">Completion Rate</span>
                  <span className="text-slate-800">{u.completion_rate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${u.completion_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-5 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Status Distribution</h3>
          </div>

          {/* Donut Visual */}
          <div className="relative flex items-center justify-center py-4">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {statusDist.map((item, idx) => {
                const percentage = totalDist > 0 ? (item.value / totalDist) * 100 : 0;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -accumulatedAngle;
                accumulatedAngle += percentage;
                return (
                  <path
                    key={idx}
                    stroke={item.color}
                    strokeWidth="4"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    className="transition-all duration-700"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900">{totalDist}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Projects</span>
            </div>
          </div>

          {/* Legend List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {statusDist.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                  <span className="font-extrabold text-slate-700">{s.label}</span>
                </div>
                <span className="font-black text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Workload Comparison Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Unit Workload Comparison</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Active vs Completed</span>
          </div>

          <div className="space-y-4 pt-2">
            {units
              .filter((u) => !['administrator', 'admin', 'it support', 'executive management'].includes(u.unit_name.toLowerCase().trim()))
              .map((u) => (
              <div key={u.unit_id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{u.unit_name} Unit</span>
                  <span className="text-slate-500">
                    <span className="text-blue-600 font-extrabold">{u.active_projects} active</span> / {u.total_projects} total
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-2xl h-4 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${u.total_projects > 0 ? (u.completed_projects / u.total_projects) * 100 : 0}%` }}
                    title={`Completed: ${u.completed_projects}`}
                  ></div>
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${u.total_projects > 0 ? (u.active_projects / u.total_projects) * 100 : 0}%` }}
                    title={`Active: ${u.active_projects}`}
                  ></div>
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${u.total_projects > 0 ? (u.pending_projects / u.total_projects) * 100 : 0}%` }}
                    title={`Pending: ${u.pending_projects}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-emerald-500"></div> Completed</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-blue-500"></div> Active Processing</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-amber-400"></div> Pending Approval</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SLA & CLIENT DEMAND REPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadangan 1: SLA & On-Time Delivery Health */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> SLA & On-Time Delivery Health
            </h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">
              CEO Executive Metric
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                SYSTEM SLA COMPLIANCE
              </span>
              <div className="text-3xl font-black text-emerald-400">
                {slaHealth.sla_compliance_rate}%
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {slaHealth.overdue_count === 0
                  ? 'All projects are currently within target SLA deadlines.'
                  : `${slaHealth.overdue_count} project(s) currently exceeding deadline.`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-1">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">ON-TIME DONE</span>
              <span className="text-lg font-black text-slate-900">{slaHealth.on_time_count}</span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase block">PROCESSING</span>
              <span className="text-lg font-black text-blue-700">{slaHealth.active_count}</span>
            </div>
            <div className={`p-3 rounded-2xl border ${slaHealth.overdue_count > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              <span className="text-[10px] font-bold uppercase block">OVERDUE</span>
              <span className="text-lg font-black">{slaHealth.overdue_count}</span>
            </div>
          </div>
        </div>

        {/* Cadangan 3: Top Client Department Resource Allocation */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" /> Top Client Department Resource Demand
            </h3>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Workload Share</span>
          </div>

          <div className="space-y-2 pt-1">
            {clientDemand.length > 0 ? (
              clientDemand.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => openDrillModalClient(`Projects for Client: ${c.client_name}`, c.client_name)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/70 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer group space-y-1.5 shadow-2xs"
                  title={`Click to view all projects for ${c.client_name}`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 group-hover:text-purple-700 font-extrabold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      {c.client_name}
                      <span className="text-[10px] text-purple-600 bg-purple-100/70 font-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Drill Deep ➔
                      </span>
                    </span>
                    <span className="text-purple-600 font-black">{c.project_count} Projects ({c.percentage_share}%)</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.percentage_share}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">No client request data logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* DRILL-DEEP INTERACTIVE MODAL */}
      {drillModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">
                    DRILL-DEEP INTELLIGENCE VIEW
                  </span>
                  {drillClientFilter !== 'all' && (
                    <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      Client: {drillClientFilter}
                      <button
                        onClick={() => {
                          setDrillClientFilter('all');
                          setDrillClientProfile(null);
                          setDrillTitle('All Projects');
                          fetchDrillProjects(drillUnitFilter, drillStatusFilter, drillSearch, 'all');
                        }}
                        className="hover:text-purple-200 font-black ml-1 text-xs"
                        title="Clear Client Filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">{drillTitle}</h3>
              </div>
              <button
                onClick={() => setDrillModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Executive Profile Card */}
            {drillClientProfile && drillClientFilter !== 'all' && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-700/40 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center font-black text-lg text-purple-300 shrink-0 shadow-inner">
                    {drillClientProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white tracking-tight">{drillClientProfile.name}</h4>
                      <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-md border border-purple-400/20">
                        {drillClientProfile.role || 'Client'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-purple-200/80 font-medium mt-1">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-400" /> {drillClientProfile.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" /> {drillClientProfile.company}
                      </span>
                      {drillClientProfile.phone && drillClientProfile.phone !== 'Not specified' && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-purple-400" /> {drillClientProfile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-purple-700/50 pt-2.5 sm:pt-0 sm:pl-5 shrink-0">
                  <div className="text-left sm:text-center">
                    <span className="text-[10px] font-bold text-purple-300/70 uppercase block tracking-wider">TOTAL CLIENT PROJECTS</span>
                    <span className="text-lg font-black text-white">{drillProjects.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search ticket, title, client..."
                  value={drillSearch}
                  onChange={(e) => {
                    setDrillSearch(e.target.value);
                    fetchDrillProjects(drillUnitFilter, drillStatusFilter, e.target.value, drillClientFilter);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={drillUnitFilter}
                  onChange={(e) => {
                    setDrillUnitFilter(e.target.value);
                    fetchDrillProjects(e.target.value, drillStatusFilter, drillSearch, drillClientFilter);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
                >
                  <option value="all">All Service Units</option>
                  {units.map((u) => (
                    <option key={u.unit_id} value={u.unit_name}>{u.unit_name} Unit</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={drillStatusFilter}
                  onChange={(e) => {
                    setDrillStatusFilter(e.target.value);
                    fetchDrillProjects(drillUnitFilter, e.target.value, drillSearch, drillClientFilter);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="active">Active Staff Processing</option>
                  <option value="pending">Pending Approval</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            {/* Drill Deep Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {drillLoading ? (
                <div className="py-12 text-center">
                  <div className="loading loading-spinner loading-md text-purple-600"></div>
                </div>
              ) : drillProjects.length > 0 ? (
                drillProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          #{p.ticket_no}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{p.unit_name} Unit</span>
                        {getStatusBadge(p.status)}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">{p.title}</h4>
                      <div className="text-xs text-slate-500 font-medium">
                        Client: <span className="font-bold text-slate-700">{p.client_name}</span> ({p.client_email})
                      </div>
                      {p.assigned_staff_names && p.assigned_staff_names.length > 0 && (
                        <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 pt-0.5">
                          <Users className="w-3 h-3" /> Staff: {p.assigned_staff_names.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[11px] font-semibold text-slate-400 hidden sm:block">
                        <div>Start: {p.start_date || '-'}</div>
                        <div>Deadline: {p.deadline || '-'}</div>
                      </div>

                      <Link
                        to={`/portal/job-requests/${p.id}`}
                        target="_blank"
                        className="btn btn-xs bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] rounded-xl px-3 py-1.5 gap-1 uppercase"
                      >
                        <Eye className="w-3 h-3" /> View Project
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No projects match your drill-deep filter criteria.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Showing {drillProjects.length} projects</span>
              <button
                onClick={() => setDrillModalOpen(false)}
                className="btn btn-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg px-4"
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
