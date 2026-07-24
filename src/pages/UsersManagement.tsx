import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, Edit2, Trash2, Users } from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff' | 'client'>('staff');
  const [unit, setUnit] = useState('');

  const fetchUsers = () => {
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      });

    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUnits(data);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Derive unique unit groups from user data dynamically
  const unitGroups = Array.from(
    new Set(users.map((u) => (u.unit && u.unit.trim() ? u.unit.trim() : 'Unassigned')))
  ).sort();

  const filteredUsers =
    activeTab === 'all'
      ? users
      : users.filter((u) => (u.unit && u.unit.trim() ? u.unit.trim() : 'Unassigned') === activeTab);

  const handleOpenModal = (u: any = null) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setEmail(u.email);
      setPassword('');
      setRole(u.role);
      setUnit(u.unit || '');
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      setUnit('');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, email, password, role, unit }),
    });

    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      fetchUsers();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return <span className="badge bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">ADMIN</span>;
      case 'manager':
        return <span className="badge bg-amber-50 text-amber-600 border border-amber-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">MANAGER</span>;
      case 'staff':
        return <span className="badge bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">STAFF</span>;
      default:
        return <span className="badge bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">CLIENT</span>;
    }
  };

  const getTabCount = (tabUnit: string) =>
    tabUnit === 'all'
      ? users.length
      : users.filter((u) => (u.unit && u.unit.trim() ? u.unit.trim() : 'Unassigned') === tabUnit).length;

  const unitColorMap: Record<string, { active: string; inactive: string; badge: string; inactiveBadge: string }> = {
    'IT Support': {
      active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/25',
      inactive: 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-rose-100 text-rose-600',
    },
    'Graphic': {
      active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/25',
      inactive: 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-blue-100 text-blue-600',
    },
    'Events': {
      active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/25',
      inactive: 'bg-white text-violet-600 hover:bg-violet-50 border border-violet-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-violet-100 text-violet-600',
    },
    'Socmed': {
      active: 'bg-pink-600 text-white shadow-lg shadow-pink-500/25',
      inactive: 'bg-white text-pink-600 hover:bg-pink-50 border border-pink-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-pink-100 text-pink-600',
    },
    'Writer': {
      active: 'bg-teal-600 text-white shadow-lg shadow-teal-500/25',
      inactive: 'bg-white text-teal-600 hover:bg-teal-50 border border-teal-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-teal-100 text-teal-600',
    },
    'KV': {
      active: 'bg-amber-600 text-white shadow-lg shadow-amber-500/25',
      inactive: 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200',
      badge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-amber-100 text-amber-600',
    },
  };

  const defaultColor = {
    active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25',
    inactive: 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200',
    badge: 'bg-white/25 text-white',
    inactiveBadge: 'bg-indigo-100 text-indigo-600',
  };

  const getTabStyle = (tabKey: string) => {
    const isActive = activeTab === tabKey;
    if (tabKey === 'all') {
      return isActive
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200';
    }
    const color = unitColorMap[tabKey] || defaultColor;
    return isActive ? color.active : color.inactive;
  };

  const getBadgeStyle = (tabKey: string) => {
    const isActive = activeTab === tabKey;
    if (tabKey === 'all') {
      return isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600';
    }
    const color = unitColorMap[tabKey] || defaultColor;
    return isActive ? color.badge : color.inactiveBadge;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Manage system accounts, roles, and unit assignments.
            </p>
          </div>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold btn-sm gap-2 rounded-xl shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Unit Tabs */}
      <div className="flex flex-wrap gap-2">
        {/* All Tab */}
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${getTabStyle('all')}`}
        >
          <Users className="w-3.5 h-3.5" />
          All Users
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getBadgeStyle('all')}`}>
            {getTabCount('all')}
          </span>
        </button>

        {/* Dynamic Unit Tabs */}
        {unitGroups.map((unitName) => (
          <button
            key={unitName}
            onClick={() => setActiveTab(unitName)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${getTabStyle(unitName)}`}
          >
            {unitName}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getBadgeStyle(unitName)}`}>
              {getTabCount(unitName)}
            </span>
          </button>
        ))}
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Users className="w-12 h-12 opacity-30" />
            <p className="font-semibold text-sm">No users in this unit yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-none">
                  <th className="rounded-l-xl py-3">ID</th>
                  <th className="py-3">Full Name</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Unit</th>
                  <th className="rounded-r-xl py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <td className="font-mono text-xs text-slate-500 py-3">#{u.id}</td>
                    <td className="font-bold text-sm text-slate-900">{u.name}</td>
                    <td className="text-xs text-slate-600 font-medium">{u.email}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td className="text-xs font-medium text-slate-700">{u.unit || '-'}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleOpenModal(u)} className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 rounded-xl">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-md">
            <h3 className="font-bold text-lg text-slate-900 mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium" />
              </div>
              <div>
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium" />
              </div>
              <div>
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Password {editingUser && '(Leave blank to keep unchanged)'}</label>
                <input type="password" required={!editingUser} value={password} onChange={(e) => setPassword(e.target.value)} className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium" />
              </div>
              <div>
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className="select select-bordered select-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-1">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="select select-bordered select-sm bg-slate-50 border-slate-200 rounded-xl w-full h-11 text-sm font-medium">
                  <option value="">-- Select Unit --</option>
                  {units.map((un) => (
                    <option key={un.id} value={un.name}>
                      {un.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action mt-6 pt-4 border-t border-slate-100 flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold rounded-xl px-5">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
