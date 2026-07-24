import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, CheckCircle2, Trash2, AlertTriangle, Database, X, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [appName, setAppName] = useState('CDI Job Request System');
  const [appEmail, setAppEmail] = useState('admin@example.com');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [saved, setSaved] = useState(false);
  
  // Database maintenance state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.app_name) setAppName(data.app_name);
        if (data.app_email) setAppEmail(data.app_email);
        if (data.primary_color) setPrimaryColor(data.primary_color);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        app_name: appName,
        app_email: appEmail,
        primary_color: primaryColor,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleOpenConfirmModal = () => {
    setConfirmPhrase('');
    setIsConfirmModalOpen(true);
  };

  const handleExecuteClearTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase.trim().toLowerCase() !== 'clear data') {
      alert('Security verification failed. Please type "clear data" exactly.');
      return;
    }

    setClearing(true);
    try {
      const res = await fetch('/api/admin/clear-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirm_text: confirmPhrase.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsConfirmModalOpen(false);
        setClearSuccess(data.message);
        setTimeout(() => setClearSuccess(null), 6000);
      } else {
        alert(data.error || 'Failed to clear transaction database.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while clearing database.');
    } finally {
      setClearing(false);
    }
  };

  const isPhraseValid = confirmPhrase.trim().toLowerCase() === 'clear data';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Settings & Branding
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Configure application name, system email, and primary brand color.
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert bg-emerald-500 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>System settings saved successfully.</span>
        </div>
      )}

      {clearSuccess && (
        <div className="alert bg-emerald-600 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{clearSuccess}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-control">
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Application Name</label>
            <input
              type="text"
              required
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="form-control">
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Admin System Email</label>
            <input
              type="email"
              required
              value={appEmail}
              onChange={(e) => setAppEmail(e.target.value)}
              className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="form-control">
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Primary Brand Color</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-11 h-11 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl font-mono text-sm font-bold flex-1 h-11"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl w-full h-12 mt-4 shadow-lg shadow-blue-500/20 gap-2 normal-case text-sm"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </form>
      </div>

      {/* Database Maintenance / Danger Zone Card */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-500/5 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Database Maintenance</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                Admin Danger Zone
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Clear test data and reset transaction history while preserving user accounts and configuration.
            </p>
          </div>
        </div>

        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs text-rose-800 space-y-1.5 font-medium">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <Database className="w-4 h-4 text-rose-600" />
            What will be cleared:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
            <li>All Job Requests (`job_requests`)</li>
            <li>All Sub-Tasks (`job_tasks`) & Staff Reports (`staff_reports`)</li>
            <li>All Workflow History Logs (`workflow_logs`) & Delegations (`delegations`)</li>
            <li>Ticket ID sequence will be reset to 1</li>
          </ul>
          <div className="font-bold text-emerald-700 pt-1 text-[11px]">
            ✅ Users table (`users`), Units (`units`), and System Settings will remain untouched.
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenConfirmModal}
          className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl w-full h-12 border-none shadow-lg shadow-rose-500/20 gap-2 normal-case text-sm transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Transaction Database (Preserve Users)</span>
        </button>
      </div>

      {/* 2-Step Verification Modal (Cloudflare/GitHub Style) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-rose-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Confirm Database Reset</h3>
                  <p className="text-xs text-rose-100 font-medium">2-Step Security Verification Required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-rose-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleExecuteClearTransactions} className="p-6 space-y-5">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>This action CANNOT be undone!</span>
                </div>
                <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                  You are about to permanently delete all <strong>Job Requests</strong>, <strong>Tasks</strong>, <strong>Reports</strong>, and <strong>Logs</strong> from Cloudflare D1 database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  To confirm, please type <span className="bg-slate-100 text-rose-600 px-2 py-0.5 rounded font-mono border border-slate-200 select-all">clear data</span> below:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Type 'clear data' to verify..."
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  className="input input-bordered w-full h-11 bg-slate-50 border-slate-300 rounded-xl text-sm font-semibold font-mono focus:bg-white focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isPhraseValid || clearing}
                  className={`btn font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md transition-all ${
                    isPhraseValid
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {clearing ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Clearing Database...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Clear Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


