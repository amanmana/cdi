import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Download } from 'lucide-react';

export const BackupPage: React.FC = () => {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(false);

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
    } finally {
      setDownloading(false);
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
            Backup & Export
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Export Cloudflare D1 database records to JSON format.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Export D1 Database Backup</h3>
          <p className="text-xs text-slate-500 font-medium mb-5">
            Download a complete backup of users, job requests, workflows, and reports in JSON format.
          </p>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20 gap-2 normal-case text-xs"
          >
            <Download className="w-4 h-4" /> {downloading ? 'Exporting...' : 'Export To JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
