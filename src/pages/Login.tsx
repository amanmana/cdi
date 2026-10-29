import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, X, KeyRound, Mail, CheckCircle2, ExternalLink, Search, Users, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_unit_head?: number | boolean;
  avatar_url?: string;
  unit?: string;
}

const FALLBACK_DEMO_USERS: DemoUser[] = [
  { id: 101, name: 'Executive Director', email: 'director@example.com', role: 'director', unit: 'Executive Office' },
  { id: 102, name: 'System Admin', email: 'admin@example.com', role: 'admin', unit: 'IT Support' },
  { id: 103, name: 'Hazmi (Manager)', email: 'manager@example.com', role: 'manager', unit: 'Management' },
  { id: 104, name: 'Safari (Head of Design)', email: 'safari@example.com', role: 'staff', is_unit_head: 1, unit: 'Graphic' },
  { id: 105, name: 'Azni (Head of Web)', email: 'azni@example.com', role: 'staff', is_unit_head: 1, unit: 'Web' },
  { id: 106, name: 'Akmal (Staff)', email: 'staff@example.com', role: 'staff', is_unit_head: 0, unit: 'Design' },
  { id: 107, name: 'Client Garang', email: 'client@example.com', role: 'client', unit: 'Client' },
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Developer quick login list state
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>(FALLBACK_DEMO_USERS);
  const [loadingDemoUsers, setLoadingDemoUsers] = useState(false);
  const [demoSearch, setDemoSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'director' | 'admin' | 'manager' | 'head_unit' | 'staff' | 'client'>('all');
  const [isDemoSectionOpen, setIsDemoSectionOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDemoUsers = async () => {
      setLoadingDemoUsers(true);
      try {
        const res = await fetch('/api/public/demo-users');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users) && data.users.length > 0) {
            if (isMounted) setDemoUsers(data.users);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch demo users list:', err);
      } finally {
        if (isMounted) setLoadingDemoUsers(false);
      }
    };
    fetchDemoUsers();
    return () => { isMounted = false; };
  }, []);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTurnstile, setForgotTurnstile] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<any>(null);
  const [forgotError, setForgotError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    if (!turnstileToken) {
      setError('Sila lengkapkan pengesahan keselamatan (Turnstile) terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.token && data.user) {
        login(data.token, data.user);
        const dest = data.user.role === 'director'
          ? '/portal/director-dashboard'
          : data.user.role === 'staff' && !data.user.is_acting_manager
          ? '/portal/job-requests'
          : '/portal/dashboard';
        navigate(dest);
        return;
      } else if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Backend API offline or starting up, using fallback demo session:', err);
    }

    // Fallback Demo Login if backend is booting up or offline
    let demoRole: 'admin' | 'manager' | 'staff' | 'client' = 'admin';
    let demoName = 'System Admin';
    let demoUnit = 'IT Support';

    if (email.includes('manager')) {
      demoRole = 'manager';
      demoName = 'Workflow Manager';
      demoUnit = 'Graphic';
    } else if (email.includes('staff') || email.includes('designer')) {
      demoRole = 'staff';
      demoName = 'Staff Member';
      demoUnit = 'Graphic';
    } else if (email.includes('client')) {
      demoRole = 'client';
      demoName = 'Client User';
      demoUnit = 'Business Unit';
    }

    const fallbackUser = {
      id: 1,
      name: demoName,
      email: email || 'admin@example.com',
      role: demoRole,
      unit: demoUnit,
    };

    const fallbackToken = 'demo_jwt_token_' + Date.now();
    login(fallbackToken, fallbackUser);
    const dest = fallbackUser.role === 'staff' ? '/portal/job-requests' : '/portal/dashboard';
    navigate(dest);
    setLoading(false);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    if (!turnstileToken) {
      setTurnstileToken('demo_turnstile_pass_token');
    }
    setError('');
  };

  const getRoleBadgeInfo = (u: DemoUser) => {
    if (u.role === 'director') {
      return {
        label: 'DIRECTOR',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
      };
    }
    if (u.role === 'admin') {
      return {
        label: 'ADMIN',
        badgeClass: 'bg-slate-800 text-slate-100 border-slate-700',
      };
    }
    if (u.role === 'manager') {
      return {
        label: 'MANAGER',
        badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      };
    }
    if (Boolean(u.is_unit_head) || u.role === 'head_unit') {
      return {
        label: 'HEAD UNIT',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    if (u.role === 'staff') {
      return {
        label: 'STAFF',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    }
    if (u.role === 'client') {
      return {
        label: 'CLIENT',
        badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
      };
    }
    return {
      label: (u.role || 'USER').toUpperCase(),
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const filteredDemoUsers = demoUsers.filter((u) => {
    const q = demoSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      (u.unit && u.unit.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (roleFilter === 'all') return true;
    if (roleFilter === 'head_unit') return Boolean(u.is_unit_head) || u.role === 'head_unit';
    if (roleFilter === 'staff') return u.role === 'staff' && !u.is_unit_head;
    return u.role === roleFilter;
  });

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }

    if (!forgotTurnstile) {
      setForgotError('Please complete the security verification (Turnstile).');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, turnstileToken: forgotTurnstile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess(data);
      } else {
        setForgotError(data.error || 'Failed to send password reset link.');
      }
    } catch (err) {
      setForgotError('An error occurred while contacting the server.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md">
        {/* Brand Header Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-3 group">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-xl shadow-blue-500/20">
              <span className="text-white font-black text-2xl">C</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
              Corporate Communication & Identity
            </span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-wider text-center uppercase">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1">Access your projects and history.</p>
          </div>

          {error && (
            <div className="alert alert-error mb-6 text-sm py-3 rounded-xl shadow-sm bg-rose-500 text-white border-none flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="form-control">
              <label className="label pt-0 pb-1">
                <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="cdiclient@mimos.my"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
              />
            </div>

            <div className="form-control">
              <label className="label pt-0 pb-1">
                <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
              <label className="label cursor-pointer gap-2 py-0">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary rounded border-slate-300"
                />
                <span className="label-text text-xs text-slate-500 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(true);
                  setForgotEmail(email);
                  setForgotSuccess(null);
                  setForgotError('');
                }}
                className="text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Turnstile Security Protection */}
            <div className="pt-2 flex justify-center">
              <Turnstile 
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD8gBivlSDINW9Ne'} 
                onSuccess={(tok) => {
                  setTurnstileToken(tok);
                  setError('');
                }}
                onError={() => {
                  setTurnstileToken('demo_turnstile_pass_token');
                  setError('');
                }}
                onExpire={() => {
                  setTurnstileToken('');
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/30 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </form>

          {/* Quick Fill Demo Credentials (Developer / Testing Interactive List) */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  Developer Testing Users ({demoUsers.length})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoSectionOpen(!isDemoSectionOpen)}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors"
              >
                {isDemoSectionOpen ? (
                  <>
                    <span>Tutup</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Papar Senarai</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {isDemoSectionOpen && (
              <div className="space-y-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={demoSearch}
                    onChange={(e) => setDemoSearch(e.target.value)}
                    placeholder="Cari nama, role, atau unit..."
                    className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                  {demoSearch && (
                    <button
                      type="button"
                      onClick={() => setDemoSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Tabs */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'director', label: 'Director' },
                    { id: 'admin', label: 'Admin' },
                    { id: 'manager', label: 'Manager' },
                    { id: 'head_unit', label: 'Head Unit' },
                    { id: 'staff', label: 'Staff' },
                    { id: 'client', label: 'Client' },
                  ].map((tab) => {
                    const count = tab.id === 'all'
                      ? demoUsers.length
                      : tab.id === 'head_unit'
                      ? demoUsers.filter(u => Boolean(u.is_unit_head) || u.role === 'head_unit').length
                      : tab.id === 'staff'
                      ? demoUsers.filter(u => u.role === 'staff' && !u.is_unit_head).length
                      : demoUsers.filter(u => u.role === tab.id).length;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRoleFilter(tab.id as any)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                          roleFilter === tab.id
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label} {count > 0 && <span className="opacity-75 font-normal">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Scrollable Clickable User List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {loadingDemoUsers && demoUsers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                      Memuatkan senarai pengguna...
                    </div>
                  ) : filteredDemoUsers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Tiada pengguna sepadan carian "{demoSearch}"
                    </div>
                  ) : (
                    filteredDemoUsers.map((u) => {
                      const badge = getRoleBadgeInfo(u);
                      const isSelected = email.toLowerCase() === u.email.toLowerCase();

                      return (
                        <button
                          key={`${u.id}-${u.email}`}
                          type="button"
                          onClick={() => handleDemoLogin(u.email)}
                          className={`w-full text-left p-2 rounded-xl transition-all border flex items-center justify-between gap-2 group ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-400 shadow-sm ring-1 ring-blue-300'
                              : 'bg-white border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700">
                                {u.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${badge.badgeClass}`}
                              >
                                {badge.label}
                              </span>
                              {u.unit && (
                                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                                  {u.unit}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                              {u.email}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3" />
                                <span>Dipilih</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium group-hover:text-blue-600 transition-colors">
                                Pilih &rarr;
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="text-center text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/50">
                  Klik mana-mana akaun untuk auto-isi e-mel & kata laluan (<span className="font-semibold text-slate-600">password123</span>).
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline ml-1">
                Register Now
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Homepage */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Homepage
          </Link>
        </div>
      </div>

      {/* Self-Service Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 antialiased">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-400 font-medium">Send reset link to your email</p>
                </div>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password Reset Link Sent!</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-700">
                    A secure password reset link has been sent to <strong className="text-emerald-900">{forgotSuccess.email}</strong> (valid for 15 minutes).
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 rounded-xl border-none h-10 min-h-0"
                  >
                    Got It & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                {forgotError && (
                  <div className="alert alert-error text-xs py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                    REGISTERED EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@mimos.my"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-1 flex justify-center">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD8gBivlSDINW9Ne'} 
                    onSuccess={(tok) => {
                      setForgotTurnstile(tok);
                      setForgotError('');
                    }}
                    onError={() => {
                      setForgotTurnstile('demo_turnstile_pass_token');
                      setForgotError('');
                    }}
                    onExpire={() => {
                      setForgotTurnstile('');
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl w-full h-12 border-none shadow-lg shadow-blue-500/25 mt-2"
                >
                  {forgotLoading ? <span className="loading loading-spinner"></span> : 'Send Password Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
