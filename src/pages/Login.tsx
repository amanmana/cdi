import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.token && data.user) {
        login(data.token, data.user);
        const dest = data.user.role === 'staff' && !data.user.is_acting_manager ? '/admin/job-requests' : '/admin/dashboard';
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
      demoUnit = 'Events';
    } else if (email.includes('staff') || email.includes('designer')) {
      demoRole = 'staff';
      demoName = 'Staff Member';
      demoUnit = 'Graphic';
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
    const dest = fallbackUser.role === 'staff' ? '/admin/job-requests' : '/admin/dashboard';
    navigate(dest);
    setLoading(false);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
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
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
              />
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

              <a className="text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors" href="#">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/30 mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              DEMO ACCOUNTS (1-CLICK FILL)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-lg flex flex-col"
              >
                <span className="font-bold text-[10px] text-blue-600">ADMIN</span>
                <span className="text-[9px] text-slate-400 font-normal">admin@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('manager@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 rounded-lg flex flex-col"
              >
                <span className="font-bold text-[10px] text-indigo-600">MANAGER</span>
                <span className="text-[9px] text-slate-400 font-normal">manager@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('staff@example.com')}
                className="btn btn-outline btn-xs h-auto py-1.5 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 rounded-lg flex flex-col"
              >
                <span className="font-bold text-[10px] text-emerald-600">STAFF</span>
                <span className="text-[9px] text-slate-400 font-normal">staff@...</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              Don't have an account?{' '}
              <a href="#" className="text-blue-600 font-bold hover:underline ml-1">
                Register Now
              </a>
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
    </div>
  );
};
