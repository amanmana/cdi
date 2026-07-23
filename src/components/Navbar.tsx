import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, Shield, LayoutDashboard, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [trackTicket, setTrackTicket] = useState('');

  if (location.pathname === '/login') {
    return null;
  }

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackTicket.trim()) {
      navigate(`/track/${trackTicket.trim()}`);
      setTrackTicket('');
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 transform group-hover:rotate-6 transition-transform">
            C
          </div>
          <span className="text-base font-black text-slate-800 tracking-tight uppercase hidden sm:inline">
            Corporate Communication & Identity
          </span>
          <span className="text-base font-black text-slate-800 tracking-tight uppercase sm:hidden">
            CCI
          </span>
        </Link>



        {/* Right Navigation Links matching Image 1 & 2 */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            to="/track"
            className={`text-xs font-bold hover:text-blue-600 transition-colors hidden sm:inline-block ${
              location.pathname.startsWith('/track') ? 'text-blue-600 font-extrabold' : 'text-slate-600'
            }`}
          >
            Track Request
          </Link>

          {!user && (
            <Link
              to="/register"
              className={`text-xs font-bold hover:text-blue-600 transition-colors hidden sm:inline-block ${
                location.pathname === '/register' ? 'text-blue-600 font-extrabold' : 'text-slate-600'
              }`}
            >
              Register
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-full"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">Submit Request</span>
          </Link>

          {user ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm border border-blue-500 shadow-md flex items-center justify-center leading-none cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-white rounded-2xl w-64 border border-slate-100">
                <li className="menu-title px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 font-normal">{user.email}</div>
                  <div className="mt-1">
                    <span className="badge bg-blue-100 text-blue-800 border-none badge-sm uppercase font-bold text-[10px]">
                      {user.role} {user.is_acting_manager ? '(Acting Manager)' : ''}
                    </span>
                  </div>
                </li>

                <li>
                  {user.role === 'staff' && !user.is_acting_manager ? (
                    <Link to="/admin/job-requests" className="py-2.5 font-medium text-slate-700">
                      <LayoutDashboard className="w-4 h-4 text-blue-600" /> Job Requests
                    </Link>
                  ) : (
                    <Link to="/admin/dashboard" className="py-2.5 font-medium text-slate-700">
                      <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard
                    </Link>
                  )}
                </li>

                <li>
                  <button onClick={logout} className="py-2.5 text-rose-600 font-medium">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-sm rounded-full px-5 bg-blue-600 hover:bg-blue-700 border-none text-white font-extrabold shadow-md shadow-blue-500/20 gap-1.5"
            >
              <Shield className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
