import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setValid(false);
        setError('Password reset token is missing or invalid.');
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setValid(true);
          setEmail(data.email || '');
        } else {
          setValid(false);
          setError(data.error || 'This reset link has expired or has already been used.');
        }
      } catch (err) {
        setValid(false);
        setError('Failed to verify password reset token.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setError('An error occurred while updating password.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-xs font-bold text-slate-500">Verifying security token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-3 group">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
              CDI Portal Reset
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-10 space-y-6 text-left">
          
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Password Updated Successfully!</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Redirecting to Sign In page in a few seconds...
                </p>
              </div>
              <Link
                to="/login"
                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl text-xs font-bold w-full h-11"
              >
                Sign In Now
              </Link>
            </div>
          ) : !valid ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Link Invalid or Expired</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {error || 'Please request a new password reset link from the Sign In page.'}
                </p>
              </div>
              <Link
                to="/login"
                className="btn bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl text-xs font-bold w-full h-11"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-black text-slate-900">Set New Password</h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Set a new password for account: <span className="font-bold text-slate-800">{email}</span>
                </p>
              </div>

              {error && (
                <div className="alert alert-error text-xs py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">New Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Confirm New Password *</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl w-full h-12 shadow-lg shadow-blue-500/25 border-none mt-2"
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
