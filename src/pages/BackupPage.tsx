import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Download, Upload, CheckCircle2, AlertTriangle, FileJson, RefreshCw } from 'lucide-react';

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
        const hasValidTables =
          json &&
          typeof json === 'object' &&
          (Array.isArray(json.users) ||
            Array.isArray(json.units) ||
            Array.isArray(json.job_requests) ||
            Array.isArray(json.system_settings) ||
            Array.isArray(json.job_tasks));

        if (hasValidTables) {
          setParsedData(json);
        } else {
          setParsedData(null);
          setRestoreStatus({
            success: false,
            message: 'Invalid Backup File: The selected JSON file is not a valid CDI System backup. Database remains untouched.',
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
    <div className="space-y-6 max-w-3xl">
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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
        
        {/* Export Card */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export D1 Database Backup</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Download a full JSON snapshot of users, units, job requests, sub-tasks, workflow logs, and system settings.
          </p>
          <div className="pt-2">
            <button
              onClick={handleExport}
              disabled={downloading}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs border-none"
            >
              {downloading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Exporting JSON...</span>
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

        {/* Restore / Import Card */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import & Restore D1 Database</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Upload a JSON backup file to restore database records and recover system state.
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
            <div className="bg-white p-5 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <span>Backup File Content Summary ({fileName})</span>
                </div>
                {parsedData.timestamp && (
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Backup Date: {new Date(parsedData.timestamp).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-base font-black text-slate-900">
                    {Array.isArray(parsedData.users) ? parsedData.users.length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Users</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-base font-black text-slate-900">
                    {Array.isArray(parsedData.units) ? parsedData.units.length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Units</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-base font-black text-slate-900">
                    {Array.isArray(parsedData.job_requests) ? parsedData.job_requests.length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Job Requests</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-base font-black text-slate-900">
                    {Array.isArray(parsedData.workflow_logs) ? parsedData.workflow_logs.length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Workflow Logs</div>
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
                        ? 'bg-blue-50/60 border-blue-500 text-blue-900 shadow-sm'
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
                        Replaces database with backup data. Ensures 100% exact state match.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      restoreMode === 'merge'
                        ? 'bg-blue-50/60 border-blue-500 text-blue-900 shadow-sm'
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
                        Inserts missing records and updates existing ones without deleting current data.
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
                      <span>Restoring Database Records...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Restore Database from Backup JSON</span>
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

