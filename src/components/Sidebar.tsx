import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Calendar, Users, FolderGit2, Settings, HardDrive, Shield, Globe } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const links = [
    { to: '/portal/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'manager', 'client'] },
    { to: '/portal/job-requests', label: user?.role === 'client' ? 'My Requests' : 'Job Requests', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'manager', 'staff', 'client'] },
    { to: '/portal/gantt', label: 'Gantt Chart', icon: <Calendar className="w-5 h-5" />, roles: ['admin', 'manager', 'staff'] },
    { to: '/portal/team', label: 'Team Members', icon: <Users className="w-5 h-5" />, roles: ['admin', 'manager'] },
    { to: '/portal/units', label: 'Units & Forms', icon: <FolderGit2 className="w-5 h-5" />, roles: ['admin', 'manager'] },
    { to: '/portal/users', label: 'User Management', icon: <Shield className="w-5 h-5" />, roles: ['admin'] },
    { to: '/portal/settings', label: 'System Settings', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
    { to: '/portal/backup', label: 'Backup & Restore', icon: <HardDrive className="w-5 h-5" />, roles: ['admin'] },
  ];

  const allowedLinks = links.filter((link) => user && link.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4.25rem)] p-5 hidden md:block shrink-0">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4">
        Navigation
      </div>
      <ul className="space-y-1.5 p-0">
        {allowedLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          </li>
        ))}

        {/* View Public Site Link matching Image 4 */}
        <li className="pt-4 mt-4 border-t border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            <Globe className="w-5 h-5" />
            <span>View Public Site</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};
