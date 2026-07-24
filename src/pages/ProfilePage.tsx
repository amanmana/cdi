import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner text-blue-600"></span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Kata laluan baharu dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Kata laluan anda telah berjaya dikemas kini!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Gagal mengemas kini kata laluan.');
      }
    } catch (err) {
      console.error(err);
      setError('Ralat semasa menghubungi pelayan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Profile & Security
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            View your account details and update your login password.
          </p>
        </div>
      </div>

      {success && (
        <div className="alert bg-emerald-500 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert bg-rose-500 text-white shadow-lg border-none rounded-2xl font-medium text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Info Card */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-3xl font-black flex items-center justify-center shadow-md animate-in zoom-in-50 duration-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{user.name}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{user.email}</p>
          </div>
          <div className="pt-2 border-t border-slate-100 w-full flex flex-col gap-2.5 items-stretch">
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col items-start gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</span>
              <span className="badge bg-blue-100 text-blue-800 border-none badge-sm uppercase font-bold text-[10px]">
                {user.role} {user.is_acting_manager ? '(Acting Manager)' : ''}
              </span>
            </div>
            {user.unit && (
              <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col items-start gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
                <span className="text-xs font-bold text-slate-700">{user.unit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Password Form Card */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mb-5">
            <Key className="w-4 h-4 text-blue-600" />
            Update Password
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div className="form-control">
              <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div className="form-control">
              <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Verify new password"
                className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold rounded-xl w-full h-12 mt-4 shadow-lg shadow-blue-500/20 gap-2 normal-case text-xs uppercase tracking-wider"
            >
              {loading ? <span className="loading loading-spinner text-white"></span> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
