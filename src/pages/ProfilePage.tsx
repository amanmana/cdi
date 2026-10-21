import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, CheckCircle2, AlertCircle, Mail, Phone, Crown, Building2, ShieldCheck, Camera, Trash2, Upload } from 'lucide-react';
import { compressAvatar } from '../utils/imageCompressor';

export const ProfilePage: React.FC = () => {
  const { user, token, login, refreshUser } = useAuth();

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  // Profile / Email state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner text-blue-600"></span>
      </div>
    );
  }

  // Handle Profile / Email Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setProfileError('Sila masukkan alamat e-mel yang sah.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          login(data.token, data.user);
        } else {
          await refreshUser();
        }
        setProfileSuccess('Alamat e-mel dan maklumat profil anda berjaya dikemaskini.');
      } else {
        setProfileError(data.error || 'Gagal mengemaskini e-mel/profil.');
      }
    } catch (err: any) {
      console.error(err);
      setProfileError('Ralat sistem berlaku. Sila cuba sebentar lagi.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Kata laluan baharu dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setPasswordLoading(true);
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
        setPasswordSuccess('Kata laluan anda telah berjaya dikemaskini.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Gagal mengemaskini kata laluan.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Ralat sistem berlaku semasa menghubungi pelayan.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Avatar Upload with client-side compression
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setAvatarLoading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      // Compress client-side to max 200x200 square WebP (~15-25KB)
      const { blob } = await compressAvatar(file, 200, 200, 0.8);

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');

      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        setAvatarSuccess('Avatar photo updated successfully!');
        setTimeout(() => setAvatarSuccess(''), 4000);
      } else {
        setAvatarError(data.error || 'Failed to upload avatar.');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setAvatarError('An error occurred during image processing.');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  // Handle Remove Avatar
  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your avatar photo?')) return;

    setAvatarLoading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const res = await fetch('/api/auth/avatar', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        setAvatarSuccess('Avatar photo removed.');
        setTimeout(() => setAvatarSuccess(''), 4000);
      } else {
        setAvatarError(data.error || 'Failed to remove avatar.');
      }
    } catch (err) {
      console.error(err);
      setAvatarError('An error occurred while removing avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
            View your account details, edit your email address, and update your login password.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Info Card */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col items-center text-center space-y-4">
          {/* Avatar with Camera Trigger */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-3xl font-black flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden border-4 border-white ring-2 ring-blue-500/20">
              {avatarLoading ? (
                <span className="loading loading-spinner loading-md text-white"></span>
              ) : user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Quick Upload Floating Button */}
            <label
              htmlFor="avatar-file-input"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900/90 text-white hover:bg-blue-600 flex items-center justify-center shadow-md cursor-pointer transition-all border-2 border-white hover:scale-110"
              title="Upload new avatar photo"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarLoading}
              className="hidden"
            />
          </div>

          {/* Action buttons for Avatar */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="avatar-file-input"
              className="btn btn-xs rounded-xl font-bold text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border-none transition-all flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Change Photo</span>
            </label>
            {user.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarLoading}
                className="btn btn-xs btn-ghost text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all"
                title="Remove photo"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Avatar Feedback Messages */}
          {avatarSuccess && (
            <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              {avatarSuccess}
            </div>
          )}
          {avatarError && (
            <div className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 animate-in fade-in">
              {avatarError}
            </div>
          )}

          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{user.name}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 break-all">{user.email}</p>
          </div>
          <div className="pt-2 border-t border-slate-100 w-full flex flex-col gap-2.5 items-stretch">
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col items-start gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</span>
              <span className="badge bg-blue-100 text-blue-800 border-none badge-sm uppercase font-bold text-[10px]">
                {user.role} {user.is_acting_manager ? '(Acting Manager)' : ''}
              </span>
            </div>

            {Boolean(user.is_unit_head) && (
              <div className="bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-extrabold text-amber-800">Unit Head (Ketua Unit)</span>
              </div>
            )}

            {user.unit && (
              <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col items-start gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
                <span className="text-xs font-bold text-slate-700">{user.unit}</span>
              </div>
            )}

            {user.department_name && (
              <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col items-start gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</span>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {user.department_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Account Information & Email */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Edit Profile & Email Address
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                Account Details
              </span>
            </div>

            {profileSuccess && (
              <div className="alert bg-emerald-500 text-white shadow-md border-none rounded-2xl font-medium text-xs flex items-center gap-2 py-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="alert bg-rose-500 text-white shadow-md border-none rounded-2xl font-medium text-xs flex items-center gap-2 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="form-control">
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 pl-10 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1">
                  This email is used for login and receiving job notifications.
                </span>
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +60123456789"
                    className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 pl-10 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold rounded-xl w-full h-11 mt-2 shadow-lg shadow-blue-500/20 gap-2 normal-case text-xs uppercase tracking-wider"
              >
                {profileLoading ? (
                  <span className="loading loading-spinner loading-xs text-white"></span>
                ) : (
                  'Save Email & Profile'
                )}
              </button>
            </form>
          </div>

          {/* Card 2: Password Form Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Update Password
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                Security
              </span>
            </div>

            {passwordSuccess && (
              <div className="alert bg-emerald-500 text-white shadow-md border-none rounded-2xl font-medium text-xs flex items-center gap-2 py-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="alert bg-rose-500 text-white shadow-md border-none rounded-2xl font-medium text-xs flex items-center gap-2 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="form-control">
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  Current Password
                </label>
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
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  New Password
                </label>
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
                <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                  Confirm New Password
                </label>
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
                disabled={passwordLoading}
                className="btn btn-primary bg-slate-900 hover:bg-slate-800 border-none text-white font-extrabold rounded-xl w-full h-11 mt-2 shadow-lg shadow-slate-900/10 gap-2 normal-case text-xs uppercase tracking-wider"
              >
                {passwordLoading ? (
                  <span className="loading loading-spinner loading-xs text-white"></span>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
