import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, Shield, LayoutDashboard, PlusCircle, User, Bell, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface NotificationItem {
  id: number;
  ticket_no: string;
  title: string;
  status: string;
  unit: string;
  message: string;
  created_at: string;
}

export const Navbar: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [trackTicket, setTrackTicket] = useState('');
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // Use SAME key as JobRequestsList + JobRequestDetail so read state is always in sync
  const [readIds, setReadIds] = useState<number[]>([]);

  // Re-load from localStorage once user.id is available (fixes async auth timing)
  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`opened_jobs_${user.id}`);
        setReadIds(stored ? JSON.parse(stored) : []);
      } catch {
        setReadIds([]);
      }
    }
  }, [user?.id]);

  // Also re-sync whenever notifications load (in case jobs were opened via table)
  useEffect(() => {
    if (user?.id && notifications.length > 0) {
      try {
        const stored = localStorage.getItem(`opened_jobs_${user.id}`);
        setReadIds(stored ? JSON.parse(stored) : []);
      } catch {
        setReadIds([]);
      }
    }
  }, [notifications, user?.id]);

  const fetchNotifications = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'staff' && !user.is_acting_manager) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const unreadList = notifications.filter((n) => !readIds.includes(n.id));
  const unreadCount = unreadList.length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    // Merge with existing opened_jobs so we don't overwrite jobs opened via table
    const merged = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(merged);
    try {
      localStorage.setItem(`opened_jobs_${user?.id}`, JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  };

  const closeDropdown = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleNotifClick = (id: number, ticketNo: string) => {
    closeDropdown();
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem(`opened_jobs_${user?.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    navigate(`/portal/job-requests/${id}`);
  };

  if (location.pathname === '/login') {
    return null;
  }

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
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
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
            <>
              {/* NOTIFICATION BELL — Staff only */}
              {user.role === 'staff' && !user.is_acting_manager && (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="relative w-10 h-10 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shadow-xs flex items-center justify-center cursor-pointer hover:bg-slate-200 hover:text-slate-900 transition-all"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center animate-pulse border-2 border-white shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div tabIndex={0} className="mt-3 z-[99] p-0 shadow-2xl dropdown-content bg-white rounded-3xl w-80 md:w-96 border border-slate-100 overflow-hidden">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <h3 className="font-extrabold text-xs tracking-wider uppercase">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-blue-300 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        No recent notifications logged.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !readIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n.id, n.ticket_no)}
                            className={`p-4 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-start gap-3 relative ${
                              isUnread ? 'bg-blue-50/30' : 'bg-white'
                            }`}
                          >
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-rose-500 absolute left-2 top-5"></div>
                            )}
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isUnread ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Sparkles className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  #{n.ticket_no}
                                </span>
                                {isUnread && (
                                  <span className="text-[9px] font-extrabold text-white bg-rose-500 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-900 truncate mt-1">{n.title}</h4>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => { closeDropdown(); navigate('/portal/job-requests'); }}
                      className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                    >
                      View All Job Requests &rarr;
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* USER PROFILE DROPDOWN */}
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
                    {user.role === 'director' ? (
                      <Link to="/portal/director-dashboard" className="py-2.5 font-medium text-slate-700">
                        <LayoutDashboard className="w-4 h-4 text-purple-600" /> Executive Dashboard
                      </Link>
                    ) : user.role === 'staff' && !user.is_acting_manager ? (
                      <Link to="/portal/job-requests" className="py-2.5 font-medium text-slate-700">
                        <LayoutDashboard className="w-4 h-4 text-blue-600" /> Job Requests
                      </Link>
                    ) : (
                      <Link to="/portal/dashboard" className="py-2.5 font-medium text-slate-700">
                        <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard
                      </Link>
                    )}
                  </li>

                  <li>
                    <Link to="/portal/profile" className="py-2.5 font-medium text-slate-700">
                      <User className="w-4 h-4 text-blue-600" /> My Profile
                    </Link>
                  </li>

                  <li>
                    <button onClick={logout} className="py-2.5 text-rose-600 font-medium">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </>
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
