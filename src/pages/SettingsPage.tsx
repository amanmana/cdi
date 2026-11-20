import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Database,
  X,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Clock,
  FileText,
  CheckSquare,
  ClipboardList,
  History,
  Users,
  Layers,
  Building2,
  FolderKanban,
  Check,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Palette,
  Eye,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';

  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };
  const [appName, setAppName] = useState('CDI Job Request System');
  const [appEmail, setAppEmail] = useState('admin@example.com');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  // Client form deadline alert settings
  const [deadlineAlertEnabled, setDeadlineAlertEnabled] = useState(true);
  const [deadlineMinDays, setDeadlineMinDays] = useState(2);
  const [deadlineAlertMessage, setDeadlineAlertMessage] = useState(
    'Notice: The selected target completion deadline is on short notice (within {days} days). Urgent requests are subject to approval and team schedule availability.'
  );

  // Unit Kanban Whiteboard feature toggles (Self-service Admin control)
  const [allUnits, setAllUnits] = useState<any[]>([
    { id: 11, name: 'Social Media' },
    { id: 5, name: 'Graphic' },
    { id: 13, name: 'Web' },
    { id: 9, name: 'Writer' },
    { id: 16, name: '3D Modelling & Video' },
    { id: 14, name: 'Rapid Prototyping Lab' },
    { id: 15, name: 'Events Mangements' },
  ]);
  const [enabledKanbanUnits, setEnabledKanbanUnits] = useState<string[]>(['Social Media']);

  // Dashboard Banner & Theme Settings
  const [bannerType, setBannerType] = useState<'3d_mesh' | 'custom_image'>('3d_mesh');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  
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
        if (data.email_notifications_enabled !== undefined) {
          setEmailEnabled(data.email_notifications_enabled === 'true' || data.email_notifications_enabled === 'on' || data.email_notifications_enabled === '1');
        }
        if (data.deadline_alert_enabled !== undefined) {
          setDeadlineAlertEnabled(data.deadline_alert_enabled === 'true' || data.deadline_alert_enabled === '1' || data.deadline_alert_enabled === 'on');
        }
        if (data.deadline_min_days) {
          setDeadlineMinDays(parseInt(data.deadline_min_days, 10) || 2);
        }
        if (data.deadline_alert_message) {
          setDeadlineAlertMessage(data.deadline_alert_message);
        }
        if (data.dashboard_banner_type) {
          setBannerType(data.dashboard_banner_type === 'custom_image' ? 'custom_image' : '3d_mesh');
        }
        if (data.dashboard_banner_image_url) {
          setBannerImageUrl(data.dashboard_banner_image_url);
        }
        if (data.kanban_enabled_units) {
          try {
            const parsed = JSON.parse(data.kanban_enabled_units);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEnabledKanbanUnits(parsed);
            }
          } catch {}
        }
      });

    // Fetch all active units
    fetch('/api/admin/units', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setAllUnits(data);
        else if (data && Array.isArray(data.units) && data.units.length > 0) setAllUnits(data.units);
      })
      .catch(() => {
        fetch('/api/public/units')
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d) && d.length > 0) setAllUnits(d);
          })
          .catch(() => {});
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
        email_notifications_enabled: emailEnabled ? 'true' : 'false',
        deadline_alert_enabled: deadlineAlertEnabled ? 'true' : 'false',
        deadline_min_days: String(deadlineMinDays),
        deadline_alert_message: deadlineAlertMessage,
        kanban_enabled_units: JSON.stringify(enabledKanbanUnits),
        dashboard_banner_type: bannerType,
        dashboard_banner_image_url: bannerImageUrl,
      }),
    });
    try {
      localStorage.setItem('cdi_banner_settings', JSON.stringify({
        type: bannerType,
        imageUrl: bannerImageUrl,
        isLoaded: true,
      }));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      alert('Fail imej melebihi saiz maksimum 6MB. Sila pilih gambar yang lebih kecil.');
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const res = await fetch('/api/admin/dashboard-banner-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerImageUrl(data.banner_url);
        setBannerType('custom_image');
        try {
          localStorage.setItem('cdi_banner_settings', JSON.stringify({
            type: 'custom_image',
            imageUrl: data.banner_url,
            isLoaded: true,
          }));
        } catch {}
        setBannerSuccess('Gambar latar belakang Dashboard berjaya dimuat naik dan diaktifkan!');
        setTimeout(() => setBannerSuccess(null), 4000);
      } else {
        alert(data.error || 'Gagal memuat naik gambar latar belakang.');
      }
    } catch (err) {
      console.error(err);
      alert('Ralat berlaku semasa memuat naik gambar.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleResetBanner = async () => {
    setBannerType('3d_mesh');
    setBannerImageUrl('');
    try {
      localStorage.setItem('cdi_banner_settings', JSON.stringify({
        type: '3d_mesh',
        imageUrl: '',
        isLoaded: true,
      }));
    } catch {}
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        dashboard_banner_type: '3d_mesh',
        dashboard_banner_image_url: '',
      }),
    });
    setBannerSuccess('Latar belakang Dashboard telah diset semula kepada 3D Abstract Mesh asal!');
    setTimeout(() => setBannerSuccess(null), 4000);
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

  const tabs = [
    {
      id: 'general',
      label: 'General Settings',
      icon: Settings,
    },
    {
      id: 'banner',
      label: 'Dashboard Banner',
      icon: ImageIcon,
      badge: bannerType === 'custom_image' ? 'Custom Image' : '3D Mesh',
      badgeColor: bannerType === 'custom_image' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-blue-100 text-blue-700',
    },
    {
      id: 'email',
      label: 'Email Notifications',
      icon: Mail,
      badge: emailEnabled ? 'ON' : 'OFF',
      badgeColor: emailEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
    },
    {
      id: 'deadline',
      label: 'Deadline Notice',
      icon: Clock,
      badge: deadlineAlertEnabled ? `${deadlineMinDays}d Active` : 'OFF',
      badgeColor: deadlineAlertEnabled ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500',
    },
    {
      id: 'kanban',
      label: 'Kanban Whiteboards',
      icon: FolderKanban,
      badge: `${enabledKanbanUnits.length} Unit`,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'database',
      label: 'Database Maintenance',
      icon: Database,
      badge: 'Danger',
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Settings & Administration
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Pusat konfigurasi aplikasi, emel automatik, notis permohonan, papan Kanban dan penyelenggaraan data.
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert bg-emerald-500 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>System settings saved successfully.</span>
        </div>
      )}

      {bannerSuccess && (
        <div className="alert bg-blue-600 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {clearSuccess && (
        <div className="alert bg-emerald-600 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{clearSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/80 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab #1: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>General App Settings & Branding</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure application name, system contact email, and primary branding color.
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">
                  Admin System Email
                </label>
                <input
                  type="email"
                  required
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">
                  Primary Brand Color
                </label>
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
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Settings take effect immediately upon saving.</span>
              <button
                type="submit"
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs"
              >
                <Save className="w-4 h-4" /> Save General Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab #1.5: Dashboard Banner & Visual Style */}
      {activeTab === 'banner' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Dashboard Welcome Banner & Background Image</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih gaya visual atau muat naik gambar sendiri untuk latar belakang Hero Banner di Dashboard tanpa perlu ubah kod.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetBanner}
                  className="btn btn-ghost btn-xs text-slate-600 hover:bg-slate-100 gap-1.5 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset to 3D Mesh</span>
                </button>
              </div>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: 3D Abstract Mesh */}
              <div
                onClick={() => setBannerType('3d_mesh')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  bannerType === '3d_mesh'
                    ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">3D Fluid Mesh (Default)</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Bertenaga, vektor 3D bebola & tiub berombak</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="banner_choice"
                    checked={bannerType === '3d_mesh'}
                    onChange={() => setBannerType('3d_mesh')}
                    className="radio radio-primary radio-sm mt-1"
                  />
                </div>
                <div className="h-16 rounded-xl bg-gradient-to-br from-[#EEF4FF] via-[#E9EFFF] to-[#F3EEFF] border border-slate-200/80 p-2 relative overflow-hidden flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Vibrant 3D Vector Background
                  </span>
                </div>
              </div>

              {/* Option B: Custom Image */}
              <div
                onClick={() => setBannerType('custom_image')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  bannerType === 'custom_image'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Custom Uploaded Image</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Muat naik gambar sendiri atau pautan imej</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="banner_choice"
                    checked={bannerType === 'custom_image'}
                    onChange={() => setBannerType('custom_image')}
                    className="radio radio-secondary radio-sm mt-1"
                  />
                </div>
                <div
                  className="h-16 rounded-xl border border-slate-200/80 p-2 relative overflow-hidden flex items-center justify-center bg-slate-100 bg-cover bg-center"
                  style={bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})` } : undefined}
                >
                  {!bannerImageUrl && (
                    <span className="text-[10px] font-bold text-slate-400">Tiada gambar dimuat naik lagi</span>
                  )}
                </div>
              </div>
            </div>

            {/* Upload & Image URL Controls (Active when Custom Image selected) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Muat Naik Gambar Baharu (Upload Image to Cloudflare R2)</span>
              </h4>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 gap-2 cursor-pointer normal-case h-11 px-5 shrink-0">
                  {uploadingBanner ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Sedang Muat Naik...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Pilih Gambar dari Komputer</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploadingBanner}
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={bannerImageUrl}
                    onChange={(e) => {
                      setBannerImageUrl(e.target.value);
                      setBannerType('custom_image');
                    }}
                    placeholder="Atau masukkan pautan URL gambar (contoh: https://... atau /api/media/...)"
                    className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Format disokong: PNG, JPG, WebP. Had saiz fail: 6MB.</span>
                {bannerImageUrl && (
                  <span className="text-indigo-600 font-bold truncate max-w-xs">
                    Aktif: {bannerImageUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Live Miniature Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pratonton Langsung Dashboard Hero Banner (Live Preview)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {bannerType === 'custom_image' ? 'Mod Gambar Tersuai' : 'Mod 3D Mesh Vector'}
                </span>
              </div>

              <div
                className={`relative overflow-hidden rounded-3xl border border-white/80 p-6 transition-all shadow-md ${
                  bannerType === 'custom_image' && bannerImageUrl
                    ? 'bg-slate-900 bg-cover bg-center'
                    : 'bg-gradient-to-br from-[#EEF4FF] via-[#E9EFFF] to-[#F3EEFF]'
                }`}
                style={
                  bannerType === 'custom_image' && bannerImageUrl
                    ? { backgroundImage: `url(${bannerImageUrl})` }
                    : undefined
                }
              >
                {bannerType === 'custom_image' && bannerImageUrl && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none" />
                )}

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="badge bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 border-none mb-1">
                        ROLE: ADMIN
                      </span>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">
                        Welcome back, Admin!
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Overview of department job request status and approval workflow.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['Total', 'Review', 'Processing', 'On Hold', 'Cancelled', 'Completed'].map((label, idx) => (
                      <div
                        key={idx}
                        className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-white/90 shadow-sm text-center"
                      >
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
                          {label}
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5">
                          {[26, 0, 20, 0, 0, 13][idx]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Pilihan banner akan terus terpapar kepada semua pengguna di Dashboard sebaik sahaja disimpan.
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs"
              >
                <Save className="w-4 h-4" /> Save Banner Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab #2: Email Notifications */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span>Automated Email Notifications</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Controls automated dispatch of emails to Managers, Head Units, and Clients upon submission and updates.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      emailEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Email Notifications Master Switch</span>
                      <span
                        className={`badge border-none font-black text-[10px] uppercase px-2.5 py-1 rounded-lg ${
                          emailEnabled ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                        }`}
                      >
                        {emailEnabled ? '🟢 ON — Emails Active' : '🔴 OFF — Emails Disabled'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Toggle whether the system sends real-time email notifications for form events.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setEmailEnabled(true)}
                    className={`btn btn-sm rounded-xl font-extrabold text-xs px-4 border-none transition-all ${
                      emailEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    ON (Enable)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailEnabled(false)}
                    className={`btn btn-sm rounded-xl font-extrabold text-xs px-4 border-none transition-all ${
                      !emailEnabled
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    OFF (Disable)
                  </button>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2.5 transition-colors ${
                  emailEnabled
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {emailEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div>
                  {emailEnabled ? (
                    <span>
                      <strong>Status: ENABLED (ON).</strong> All automated emails will be dispatched to Managers and
                      Clients upon form submissions, status changes, and staff assignments.
                    </span>
                  ) : (
                    <span>
                      <strong>Status: DISABLED (OFF).</strong> Email dispatches are completely paused. No emails will be
                      sent when forms are submitted or updated (prevents disturbance during testing / development).
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Remember to click save to record email settings.</span>
              <button
                type="submit"
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs"
              >
                <Save className="w-4 h-4" /> Save Email Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab #3: Deadline Notice */}
      {activeTab === 'deadline' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Client Form Target Deadline Notice & Alert</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Displays a real-time notice banner to the client when they select a target completion deadline on short notice.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      deadlineAlertEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Deadline Notice Feature</span>
                      <span
                        className={`badge border-none font-black text-[10px] uppercase px-2.5 py-1 rounded-lg ${
                          deadlineAlertEnabled ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-400 text-white'
                        }`}
                      >
                        {deadlineAlertEnabled ? '🟢 Active' : '⚪ Disabled'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Show client caution banner if requested deadline is shorter than minimum threshold.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setDeadlineAlertEnabled(true)}
                    className={`btn btn-sm rounded-xl font-extrabold text-xs px-4 border-none transition-all ${
                      deadlineAlertEnabled
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineAlertEnabled(false)}
                    className={`btn btn-sm rounded-xl font-extrabold text-xs px-4 border-none transition-all ${
                      !deadlineAlertEnabled
                        ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Disable
                  </button>
                </div>
              </div>

              {deadlineAlertEnabled && (
                <div className="space-y-4 pt-4 border-t border-slate-200/60">
                  {/* Minimum Days Threshold */}
                  <div className="form-control">
                    <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">
                      Notice Days Threshold
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={deadlineMinDays}
                        onChange={(e) => setDeadlineMinDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input input-bordered input-sm bg-white border-slate-300 rounded-xl w-24 h-11 text-sm font-bold text-center focus:border-amber-600"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        Days or less from the submission date.
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Example: If set to <strong>{deadlineMinDays}</strong> days, any request submitted today with a
                      deadline {deadlineMinDays === 1 ? 'today or tomorrow' : `within ${deadlineMinDays} days`} will
                      trigger this alert.
                    </p>
                  </div>

                  {/* Custom Message to User */}
                  <div className="form-control">
                    <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">
                      Custom Alert Message
                    </label>
                    <textarea
                      rows={3}
                      value={deadlineAlertMessage}
                      onChange={(e) => setDeadlineAlertMessage(e.target.value)}
                      placeholder="Enter custom alert message for clients..."
                      className="textarea textarea-bordered bg-white border-slate-300 rounded-xl text-xs font-medium focus:border-amber-600 leading-relaxed p-3.5"
                    ></textarea>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Tip: Use the <code className="bg-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">&#123;days&#125;</code> tag to automatically inject the threshold days number.
                    </p>
                  </div>

                  {/* Live Preview for Admin */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Live Preview (Client Form Appearance):
                    </span>
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex items-start gap-3 shadow-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="text-xs font-black uppercase text-amber-900 tracking-wide">
                          SHORT-NOTICE REQUEST ({deadlineMinDays} DAYS)
                        </div>
                        <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                          {deadlineAlertMessage.replace('{days}', String(deadlineMinDays))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Settings update immediately across all request forms.</span>
              <button
                type="submit"
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-blue-500/20 gap-2 normal-case text-xs"
              >
                <Save className="w-4 h-4" /> Save Deadline Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab #4: Kanban Whiteboards */}
      {activeTab === 'kanban' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-indigo-600" />
                  <span>Unit Kanban Whiteboards</span>
                  <span className="badge bg-indigo-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-lg border-none shadow-sm">
                    Self-Service Admin Control
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tandakan (tick) unit yang dibenarkan menggunakan papan KANBAN Whiteboard. KANBAN akan automatik tersedia sebagai <strong>Tab #1</strong> apabila staf & Head Unit unit tersebut membuka Workspace mereka.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const validUnitNames = allUnits
                      .filter((u) => u.name && u.name !== 'Administrator')
                      .map((u) => u.name);
                    setEnabledKanbanUnits(validUnitNames);
                  }}
                  className="btn btn-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => setEnabledKanbanUnits(['Social Media'])}
                  className="btn btn-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold"
                >
                  Reset (SocMed Sahaja)
                </button>
              </div>
            </div>

            {/* Units Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allUnits
                .filter((u) => u.name && u.name !== 'Administrator')
                .map((u) => {
                  const isChecked = enabledKanbanUnits.some(
                    (name) => name && name.toLowerCase().trim() === u.name.toLowerCase().trim()
                  );
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400 text-indigo-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEnabledKanbanUnits((prev) => [...prev, u.name]);
                          } else {
                            setEnabledKanbanUnits((prev) =>
                              prev.filter((name) => name.toLowerCase().trim() !== u.name.toLowerCase().trim())
                            );
                          }
                        }}
                        className="checkbox checkbox-sm checkbox-primary rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs truncate block font-bold">{u.name}</span>
                        {isChecked ? (
                          <span className="text-[10px] text-indigo-600 font-extrabold block">
                            ● KANBAN Tab #1 Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Standard Table View
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {enabledKanbanUnits.length} daripada {allUnits.filter((u) => u.name && u.name !== 'Administrator').length} unit aktif dengan papan Kanban.
              </span>
              <button
                type="submit"
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white font-bold rounded-xl h-11 px-6 shadow-md shadow-indigo-500/20 gap-2 normal-case text-xs"
              >
                <Save className="w-4 h-4" /> Save Kanban Permissions
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab #5: Database Maintenance */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-500/5 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
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

          {/* Transparent Table Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Tables to be Cleared */}
            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-rose-200/60">
                <div className="font-extrabold text-xs text-rose-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tables Yang Akan Dikosongkan (6 Tables):</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded-md">
                  Permanently Cleared
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <FolderKanban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">projects</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua projek induk organisasi Mega Projects (#MTP)</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">job_requests</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua tiket permohonan kerja client & metadata penugasan</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <CheckSquare className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">job_tasks</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua sub-tugasan staf & status kerja pereka/penulis</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <ClipboardList className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">staff_reports</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua laporan kemajuan & entri pelaporan mingguan staf</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <History className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">workflow_logs</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua sejarah log audit & transaksi status permohonan</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-start gap-2 shadow-xs">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-rose-950">delegations</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua jadual lantikan pemangku pengurus terdahulu</div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-rose-700 font-bold bg-rose-100/60 p-2 rounded-lg flex items-center gap-1.5">
                <span>⚡ ID Sequence: Auto-increment projek, tiket & rekod di atas di-reset ke 1.</span>
              </div>
            </div>

            {/* Column 2: Tables Preserved / Untouched */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tables Yang Kekal Selamat (4 Tables):</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-md">
                  100% Preserved
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-start gap-2 shadow-xs">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-emerald-950">users</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua akaun pengguna, peranan, kata laluan & profil kakitangan</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-start gap-2 shadow-xs">
                  <Layers className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-emerald-950">units</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua unit perkhidmatan, ketua unit & dynamic form schema</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-start gap-2 shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-emerald-950">departments</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua struktur hierarki jabatan & lantikan pengurus jabatan</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-start gap-2 shadow-xs">
                  <Settings className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-emerald-950">system_settings</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semua konfigurasi sistem, emel, notis & parameter keselamatan</div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-emerald-800 font-bold bg-emerald-100/60 p-2 rounded-lg flex items-center gap-1.5">
                <span>✅ Akaun login kakitangan & konfigurasi sistem dijamin tidak terjejas sama sekali.</span>
              </div>
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
      )}

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
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Tindakan ini adalah KEKAL dan TIDAK BOLEH diundur!</span>
                </div>
                <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                  Semua rekod dalam 6 table transaksi (<strong>projects</strong>, <strong>job_requests</strong>, <strong>job_tasks</strong>, <strong>staff_reports</strong>, <strong>workflow_logs</strong>, <strong>delegations</strong>) akan dipadamkan dari Cloudflare D1.
                </p>
                <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>4 Table Master (<strong>users</strong>, <strong>units</strong>, <strong>departments</strong>, <strong>system_settings</strong>) kekal 100% selamat.</span>
                </div>
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


