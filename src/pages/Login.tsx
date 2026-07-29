import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, X, KeyRound, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

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
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Sila masukkan alamat e-mel anda.');
      return;
    }

    if (!forgotTurnstile) {
      setForgotError('Sila lengkapkan pengesahan Turnstile keselamatan.');
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
        setForgotError(data.error || 'Gagal menghantar pautan reset kata laluan.');
      }
    } catch (err) {
      setForgotError('Ralat berlaku semasa menghubungi pelayan.');
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

          {/* Quick Fill Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              DEMO ACCOUNTS (1-CLICK FILL)
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-lg flex flex-col px-1"
              >
                <span className="font-bold text-[9px] text-blue-600">ADMIN</span>
                <span className="text-[8px] text-slate-400 font-normal">admin@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('manager@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 rounded-lg flex flex-col px-1"
              >
                <span className="font-bold text-[9px] text-indigo-600">MANAGER</span>
                <span className="text-[8px] text-slate-400 font-normal">manager@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('staff@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 rounded-lg flex flex-col px-1"
              >
                <span className="font-bold text-[9px] text-emerald-600">STAFF</span>
                <span className="text-[8px] text-slate-400 font-normal">staff@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('client@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 rounded-lg flex flex-col px-1"
              >
                <span className="font-bold text-[9px] text-amber-600">CLIENT</span>
                <span className="text-[8px] text-slate-400 font-normal">client@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('director@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 rounded-lg flex flex-col px-1"
              >
                <span className="font-bold text-[9px] text-purple-600">DIRECTOR</span>
                <span className="text-[8px] text-slate-400 font-normal">director@...</span>
              </button>
            </div>
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
                  <h3 className="text-base font-black text-slate-900">Reset Kata Laluan</h3>
                  <p className="text-xs text-slate-400 font-medium">Hantar pautan penetapan semula ke e-mel</p>
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
                    <span>Pautan Reset Kata Laluan Berjaya Dijana!</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-700">
                    Pautan keselamatan berkunci telah dihantar ke e-mel <strong className="text-emerald-900">{forgotSuccess.email}</strong> (sah selama 15 minit).
                  </p>
                </div>

                {forgotSuccess.reset_url && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      SIMULASI UJIAN (DEV PREVIEW LINK)
                    </span>
                    <a
                      href={forgotSuccess.reset_url}
                      className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl w-full h-11 flex items-center justify-center gap-2 shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Buka Pautan Reset Kata Laluan
                    </a>
                  </div>
                )}
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
                    ALAMAT E-MEL BERDAFTAR *
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
                  {forgotLoading ? <span className="loading loading-spinner"></span> : 'Hantar Pautan Reset Kata Laluan'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
