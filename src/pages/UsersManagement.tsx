import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, Edit2, Trash2, Users, Building2, UserCircle2, ExternalLink } from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Main section tab: 'staff' | 'clients'
  const [mainTab, setMainTab] = useState<'staff' | 'clients'>('staff');
  // Unit sub-tab for internal staff
  const [activeUnitTab, setActiveUnitTab] = useState<string>('all');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff' | 'client'>('staff');
  const [unit, setUnit] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchUsers = () => {
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); });

    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUnits(data); });
  };

  useEffect(() => { fetchUsers(); }, [token]);

  // Separate internal staff vs clients
  const internalUsers = users.filter((u) => u.role !== 'client');
  const clientUsers = users.filter((u) => u.role === 'client');

  // Unit groups derived from the `units` table — shows ALL units, even empty ones
  const unitGroups = units.map((u) => u.name).sort();

  const filteredInternalUsers =
    activeUnitTab === 'all'
      ? internalUsers
      : internalUsers.filter((u) => (u.unit || '').trim() === activeUnitTab);

  const handleOpenModal = (u: any = null) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setEmail(u.email);
      setPassword('');
      setRole(u.role);
      setUnit(u.unit || '');
      setOrganisation(u.organisation || '');
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole(mainTab === 'clients' ? 'client' : 'staff');
      setUnit('');
      setOrganisation('');
    }
    setShowModal(true);
    setSaveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    // Frontend validation: unit is mandatory for internal staff
    if (role !== 'client' && !unit) {
      setSaveError('Please select a unit before saving.');
      return;
    }

    const endpoint = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, password, role, unit: role === 'client' ? '' : unit }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchUsers();
      } else {
        setSaveError(data.error || 'Failed to save. Please try again.');
      }
    } catch {
      setSaveError('Network error. Please check your connection.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'admin':   return <span className="badge bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">ADMIN</span>;
      case 'manager': return <span className="badge bg-amber-50 text-amber-600 border border-amber-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">MANAGER</span>;
      case 'staff':   return <span className="badge bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">STAFF</span>;
      default:        return <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg">CLIENT</span>;
    }
  };

  const unitColorMap: Record<string, { active: string; inactive: string; badge: string; inactiveBadge: string }> = {
    'IT Support': { active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/25', inactive: 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200', badge: 'bg-white/25 text-white', inactiveBadge: 'bg-rose-100 text-rose-600' },
    'Graphic':    { active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/25',  inactive: 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200',   badge: 'bg-white/25 text-white', inactiveBadge: 'bg-blue-100 text-blue-600' },
    'Events':     { active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/25', inactive: 'bg-white text-violet-600 hover:bg-violet-50 border border-violet-200', badge: 'bg-white/25 text-white', inactiveBadge: 'bg-violet-100 text-violet-600' },
    'Socmed':     { active: 'bg-pink-600 text-white shadow-lg shadow-pink-500/25',  inactive: 'bg-white text-pink-600 hover:bg-pink-50 border border-pink-200',   badge: 'bg-white/25 text-white', inactiveBadge: 'bg-pink-100 text-pink-600' },
    'Writer':     { active: 'bg-teal-600 text-white shadow-lg shadow-teal-500/25',  inactive: 'bg-white text-teal-600 hover:bg-teal-50 border border-teal-200',   badge: 'bg-white/25 text-white', inactiveBadge: 'bg-teal-100 text-teal-600' },
    'Website':    { active: 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25',  inactive: 'bg-white text-cyan-600 hover:bg-cyan-50 border border-cyan-200',   badge: 'bg-white/25 text-white', inactiveBadge: 'bg-cyan-100 text-cyan-600' },
  };
  const defaultColor = { active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25', inactive: 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200', badge: 'bg-white/25 text-white', inactiveBadge: 'bg-indigo-100 text-indigo-600' };

  const getUnitTabStyle = (tabKey: string) => {
    const isActive = activeUnitTab === tabKey;
    if (tabKey === 'all') return isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200';
    const c = unitColorMap[tabKey] || defaultColor;
    return isActive ? c.active : c.inactive;
  };
  const getUnitBadgeStyle = (tabKey: string) => {
    const isActive = activeUnitTab === tabKey;
    if (tabKey === 'all') return isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600';
    const c = unitColorMap[tabKey] || defaultColor;
    return isActive ? c.badge : c.inactiveBadge;
  };
  const getUnitTabCount = (tabKey: string) =>
    tabKey === 'all' ? internalUsers.length
      : internalUsers.filter((u) => (u.unit || '').trim() === tabKey).length;

  const isClientModal = role === 'client';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Manage system accounts, roles, and unit assignments.</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-bold btn-sm gap-2 rounded-xl shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add {mainTab === 'clients' ? 'Client' : 'User'}
        </button>
      </div>

      {/* Main Section Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setMainTab('staff')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${mainTab === 'staff' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" />
          Internal Staff
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${mainTab === 'staff' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
            {internalUsers.length}
          </span>
        </button>
        <button
          onClick={() => setMainTab('clients')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${mainTab === 'clients' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 className="w-4 h-4" />
          Clients
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${mainTab === 'clients' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
            {clientUsers.length}
          </span>
        </button>
      </div>

      {/* ── INTERNAL STAFF SECTION ── */}
      {mainTab === 'staff' && (
        <>
          {/* Unit Sub-tabs */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveUnitTab('all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${getUnitTabStyle('all')}`}>
              <Users className="w-3.5 h-3.5" /> All Staff
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getUnitBadgeStyle('all')}`}>{getUnitTabCount('all')}</span>
            </button>
            {unitGroups.map((unitName) => (
              <button key={unitName} onClick={() => setActiveUnitTab(unitName)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${getUnitTabStyle(unitName)}`}>
                {unitName}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getUnitBadgeStyle(unitName)}`}>{getUnitTabCount(unitName)}</span>
              </button>
            ))}
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            {filteredInternalUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Users className="w-12 h-12 opacity-30" />
                <p className="font-semibold text-sm">No staff in this unit yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="rounded-l-xl py-3">ID</th>
                      <th className="py-3">Full Name</th>
                      <th className="py-3">Email Address</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Unit</th>
                      <th className="rounded-r-xl py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInternalUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <td className="font-mono text-xs text-slate-500 py-3">#{u.id}</td>
                        <td className="font-bold text-sm text-slate-900">{u.name}</td>
                        <td className="text-xs text-slate-600 font-medium">{u.email}</td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td className="text-xs font-medium text-slate-700">{u.unit || '-'}</td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleOpenModal(u)} className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(u.id)} className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CLIENTS SECTION ── */}
      {mainTab === 'clients' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">External Clients</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Users from outside the organization who submit job requests.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">{clientUsers.length} client{clientUsers.length !== 1 ? 's' : ''}</span>
          </div>

          {clientUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <UserCircle2 className="w-12 h-12 opacity-30" />
              <p className="font-semibold text-sm">No client accounts yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="rounded-l-xl py-3">ID</th>
                    <th className="py-3">Full Name</th>
                    <th className="py-3">Email Address</th>
                    <th className="py-3">Role</th>
                    <th className="rounded-r-xl py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td className="font-mono text-xs text-slate-500 py-3">#{u.id}</td>
                      <td className="font-bold text-sm text-slate-900">{u.name}</td>
                      <td className="text-xs text-slate-600 font-medium">{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenModal(u)} className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(u.id)} className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-md">
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isClientModal ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                {isClientModal ? <UserCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{editingUser ? 'Edit User' : isClientModal ? 'Add New Client' : 'Add New Staff'}</h3>
            </div>

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
                  {mainTab === 'clients' || editingUser?.role === 'client' ? (
                    <option value="client">Client</option>
                  ) : (
                    <>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </>
                  )}
                </select>
              </div>

              {/* Unit field — only for internal staff */}
              {!isClientModal && (
                <div>
                  <div className="flex items-center justify-between py-1">
                    <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider py-0">Unit</label>
                    <a
                      href="/portal/units"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      Manage Units <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <select
                    required
                    value={unit}
                    onChange={(e) => { setUnit(e.target.value); setSaveError(''); }}
                    className={`select select-bordered select-sm bg-slate-50 rounded-xl w-full h-11 text-sm font-medium ${!unit ? 'border-slate-200' : 'border-emerald-400'}`}
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map((un) => <option key={un.id} value={un.name}>{un.name}</option>)}
                  </select>
                </div>
              )}

              {/* Error Banner */}
              {saveError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  <span className="text-rose-500">⚠</span> {saveError}
                </div>
              )}

              <div className="modal-action mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm rounded-xl">Cancel</button>
                <button type="submit" className={`btn btn-sm text-white font-bold rounded-xl px-5 border-none ${isClientModal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
