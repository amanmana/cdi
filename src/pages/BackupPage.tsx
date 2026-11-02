import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  Building2,
  Layers,
  Users,
  FolderKanban,
  FileText,
  CheckSquare,
  ClipboardList,
  History,
  ShieldCheck,
  Settings,
  Database,
  Check,
} from 'lucide-react';

interface SystemTableDef {
  key: string;
  name: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_TABLES: SystemTableDef[] = [
  { key: 'departments', name: 'departments', label: 'Jabatan (Departments)', desc: 'Organizational departments & manager IDs', icon: Building2 },
  { key: 'units', name: 'units', label: 'Unit Perkhidmatan (Units)', desc: 'Service units, heads & dynamic form schemas', icon: Layers },
  { key: 'users', name: 'users', label: 'Pengguna & Akses (Users)', desc: 'User accounts, roles & department links', icon: Users },
  { key: 'projects', name: 'projects', label: 'Mega Projects (#MTP)', desc: 'Strategic multi-unit initiatives & milestones', icon: FolderKanban },
  { key: 'job_requests', name: 'job_requests', label: 'Permohonan Kerja (Job Requests)', desc: 'Client tickets & assignment metadata', icon: FileText },
  { key: 'job_tasks', name: 'job_tasks', label: 'Sub-tugasan Staf (Job Tasks)', desc: 'Staff deliverables & task progress', icon: CheckSquare },
  { key: 'staff_reports', name: 'staff_reports', label: 'Laporan Staf (Progress Reports)', desc: 'Weekly & task progress reporting entries', icon: ClipboardList },
  { key: 'workflow_logs', name: 'workflow_logs', label: 'Jejak Audit (Workflow Logs)', desc: 'Complete activity history & status transitions', icon: History },
  { key: 'delegations', name: 'delegations', label: 'Delegasi Pengurus (Delegations)', desc: 'Acting manager assignment schedules', icon: ShieldCheck },
  { key: 'system_settings', name: 'system_settings', label: 'Tetapan Sistem (System Settings)', desc: 'Global configurations & alert parameters', icon: Settings },
];

export const BackupPage: React.FC = () => {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `cdi_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to export database backup.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRestoreStatus(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const rawData = json?.data || json;
        const hasValidTables =
          rawData &&
          typeof rawData === 'object' &&
          (Array.isArray(rawData.users) ||
            Array.isArray(rawData.units) ||
            Array.isArray(rawData.departments) ||
            Array.isArray(rawData.projects) ||
            Array.isArray(rawData.job_requests) ||
            Array.isArray(rawData.system_settings) ||
            Array.isArray(rawData.job_tasks));

        if (hasValidTables) {
          setParsedData(json);
        } else {
          setParsedData(null);
          setRestoreStatus({
            success: false,
            message: 'Invalid Backup File: The selected JSON file does not contain recognized CDI System database tables. Database remains untouched.',
          });
        }
      } catch (err) {
        setParsedData(null);
        setRestoreStatus({
          success: false,
          message: 'Failed to parse file. Please select a valid JSON backup file.',
        });
      }
    };

    reader.readAsText(file);
  };

  const getTableCount = (tableKey: string): number => {
    if (!parsedData) return 0;
    if (parsedData.tables && typeof parsedData.tables[tableKey] === 'number') {
      return parsedData.tables[tableKey];
    }
    const rawData = parsedData.data || parsedData;
    if (Array.isArray(rawData[tableKey])) {
      return rawData[tableKey].length;
    }
    return 0;
  };

  const getTotalRecords = (): number => {
    if (!parsedData) return 0;
    if (typeof parsedData.total_records === 'number') return parsedData.total_records;
    return SYSTEM_TABLES.reduce((sum, t) => sum + getTableCount(t.key), 0);
  };

  const handleRestore = async () => {
    if (!parsedData) return;

    const isOverwrite = restoreMode === 'overwrite';
    const confirmMsg = isOverwrite
      ? '⚠️ WARNING: Full Overwrite mode will REPLACE all existing database data with the records in this backup file.\n\nAre you sure you want to proceed?'
      : 'Merge mode will add/update records from this backup file into the existing database.\n\nProceed with restore?';

    if (!window.confirm(confirmMsg)) return;

    setUploading(true);
    setRestoreStatus(null);

    try {
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: restoreMode,
          data: parsedData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRestoreStatus({ success: true, message: data.message });
      } else {
        setRestoreStatus({ success: false, message: data.error || 'Failed to restore database.' });
      }
    } catch (err: any) {
      console.error(err);
      setRestoreStatus({ success: false, message: err?.message || 'An error occurred during restore.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Backup & Restore
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Export Cloudflare D1 database or restore database records from JSON backup files.
          </p>
        </div>
      </div>

      {restoreStatus && (
        <div
          className={`alert text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2 ${
            restoreStatus.success ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {restoreStatus.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-8">
        
        {/* ========================================================= */}
        {/* EXPORT CARD                                               */}
        {/* ========================================================= */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export D1 Database Backup</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-700 border border-blue-200/60">
              {SYSTEM_TABLES.length} Tables Included
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Download a full JSON snapshot of all 10 Cloudflare D1 tables including departments, service units, users, mega projects, job requests, sub-tasks, progress reports, audit logs, delegations, and system settings.
          </p>

          {/* Table Inventory Badges */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Covered Database Tables (10 Tables):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SYSTEM_TABLES.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.key}
                    className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                    title={t.desc}
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-700 truncate">
                      {t.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleExport}
              disabled={downloading}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs border-none"
            >
              {downloading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Exporting Full JSON Backup...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export To JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RESTORE / IMPORT CARD                                     */}
        {/* ========================================================= */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import & Restore D1 Database</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Upload a JSON backup file to inspect its table records, review data counts, and restore system state.
          </p>

          {/* File Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Backup File (.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="file-input file-input-bordered bg-white border-slate-200 rounded-xl w-full text-xs font-medium h-11"
            />
          </div>

          {/* Parsed Backup Data Preview Box */}
          {parsedData && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <FileJson className="w-4 h-4 text-indigo-600" />
                  <span>Backup File Inventory: <span className="font-mono text-indigo-700">{fileName}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    Total: {getTotalRecords()} Records
                  </span>
                  {parsedData.timestamp && (
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      Date: {new Date(parsedData.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Complete 10 Tables Breakdown Grid */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Table-by-Table Breakdown:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SYSTEM_TABLES.map((t) => {
                    const count = getTableCount(t.key);
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.key}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          count > 0
                            ? 'bg-indigo-50/40 border-indigo-100'
                            : 'bg-slate-50 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-slate-900 truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">
                              {t.label}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            count > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Options */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Restore Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setRestoreMode('overwrite')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      restoreMode === 'overwrite'
                        ? 'bg-indigo-50/60 border-indigo-500 text-indigo-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                      className="radio radio-xs radio-primary mt-0.5"
                    />
                    <div>
                      <div className="font-extrabold text-xs">Full Overwrite (Recommended)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Purges existing tables and restores exact backup state in topological dependency order.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      restoreMode === 'merge'
                        ? 'bg-indigo-50/60 border-indigo-500 text-indigo-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="radio radio-xs radio-primary mt-0.5"
                    />
                    <div>
                      <div className="font-extrabold text-xs">Smart Merge</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Inserts missing records and updates matching IDs without deleting records present only in current database.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Restore Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={uploading}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl h-11 w-full border-none shadow-md shadow-indigo-500/20 gap-2 normal-case text-xs transition-all"
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Restoring Database Records ({getTotalRecords()} total items)...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Restore Database from Backup JSON ({getTotalRecords()} records)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
