import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

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
        setError('Pautan penetapan semula kata laluan tidak sah atau hilang.');
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
          setError(data.error || 'Pautan ini telah tamat tempoh atau telah digunakan.');
        }
      } catch (err) {
        setValid(false);
        setError('Gagal mengesahkan token penetapan semula kata laluan.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Pengesahan kata laluan tidak sepadan.');
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
        setError(data.error || 'Gagal mengemas kini kata laluan.');
      }
    } catch (err) {
      setError('Ralat berlaku semasa mengemas kini kata laluan.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-xs font-bold text-slate-500">Mengesahkan pautan keselamatan...</p>
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
                <h2 className="text-xl font-black text-slate-900">Kata Laluan Berjaya Dikemas Kini!</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Anda akan dipindahkan ke halaman Log Masuk dalam beberapa saat...
                </p>
              </div>
              <Link
                to="/login"
                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl text-xs font-bold w-full h-11"
              >
                Log Masuk Sekarang
              </Link>
            </div>
          ) : !valid ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Pautan Tidak Sah atau Tamat Tempoh</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {error || 'Sila pohon pautan penetapan semula kata laluan baharu di borang Log Masuk.'}
                </p>
              </div>
              <Link
                to="/login"
                className="btn bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl text-xs font-bold w-full h-11"
              >
                Kembali ke Log Masuk
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-black text-slate-900">Tetapkan Kata Laluan Baharu</h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Menetapkan kata laluan baharu untuk akaun: <span className="font-bold text-slate-800">{email}</span>
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
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Kata Laluan Baharu *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Sekurang-kurangnya 6 aksara"
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
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Sahkan Kata Laluan Baharu *</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Taip semula kata laluan baharu"
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
                  {loading ? <span className="loading loading-spinner"></span> : 'Kemas Kini Kata Laluan'}
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
            Kembali ke Log Masuk
          </Link>
        </div>

      </div>
    </div>
  );
};
