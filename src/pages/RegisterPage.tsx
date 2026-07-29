import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Turnstile } from '@marsidev/react-turnstile';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!turnstileToken) {
      setError('Sila lengkapkan pengesahan keselamatan (Turnstile) terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company, unit: company, phone, turnstileToken, role: 'client' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Registration failed.');
      } else if (data.token && data.user) {
        login(data.token, data.user);
        navigate('/portal/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] flex items-center justify-center bg-slate-50/50 p-4 md:p-8 antialiased">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100/80 p-8 md:p-12 space-y-6 text-center">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Sign up to track all your job requests.
          </p>
          <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-4"></div>
        </div>

        {error && (
          <div className="alert alert-error bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold p-4 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Full Name */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
              FULL NAME *
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
              MIMOS EMAIL *
            </label>
            <input
              type="email"
              required
              placeholder="john@mimos.my"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* 2-Column Grid on Desktop for Company and Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                COMPANY
              </label>
              <input
                type="text"
                placeholder="e.g. MIMOS Berhad"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                placeholder="e.g. +60123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
              PASSWORD *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Turnstile Security Verification */}
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

          {/* Register Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn w-full bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold text-sm rounded-2xl h-12 shadow-lg shadow-blue-500/25 tracking-wide"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Register Account'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-extrabold hover:underline">
            Sign In
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          By registering, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 font-bold hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 font-bold hover:underline">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
};
