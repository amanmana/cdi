import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [appName, setAppName] = useState('CDI Job Request System');
  const [appEmail, setAppEmail] = useState('admin@example.com');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [saved, setSaved] = useState(false);

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
    </div>
  );
};
