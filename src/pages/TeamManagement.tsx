import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, MoreVertical, Edit2, Trash2, X, FileText, CheckCircle2 } from 'lucide-react';

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  unit: string;
  status?: string;
  assigned_jobs_count?: number;
  completed_jobs_count?: number;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
];

export const TeamManagement: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('Graphic');

  // Reports Modal State
  const [selectedReportsStaff, setSelectedReportsStaff] = useState<StaffMember | null>(null);

  // Active Dropdown Row ID
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const fetchTeamData = () => {
    setLoading(true);
    fetch('/api/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.staffMembers)) {
          setStaffMembers(data.staffMembers);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUnits(data);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchTeamData();
  }, [token]);

  const handleOpenAddModal = (staff: StaffMember | null = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFullName(staff.name);
      setEmailAddress(staff.email);
      setInitialPassword('');
      setAssignedUnit(staff.unit || 'Graphic');
    } else {
      setEditingStaff(null);
      setFullName('');
      setEmailAddress('');
      setInitialPassword('');
      setAssignedUnit('Graphic');
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !emailAddress) return;

    const endpoint = editingStaff ? `/api/admin/users/${editingStaff.id}` : '/api/admin/users';
    const method = editingStaff ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fullName,
          email: emailAddress,
          password: initialPassword || 'password123',
          role: 'staff',
          unit: assignedUnit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchTeamData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveMember = async (id: number) => {
    if (!window.confirm('Are you sure you want to archive this team member?')) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeamData();
    } catch (err) {
      console.error(err);
    } finally {
      setOpenDropdownId(null);
    }
  };

  const getUnitPillStyle = (unitName?: string) => {
    switch (unitName?.toUpperCase()) {
      case 'GRAPHIC':
        return 'bg-purple-100/70 text-purple-700 font-bold';
      case 'WRITER':
        return 'bg-emerald-100/70 text-emerald-700 font-bold';
      case 'SOCMED':
        return 'bg-rose-100/70 text-rose-700 font-bold';
      case 'EVENTS':
        return 'bg-amber-100/70 text-amber-700 font-bold';
      default:
        return 'bg-blue-100/70 text-blue-700 font-bold';
    }
  };

  const filteredStaffMembers = user?.role === 'manager' && user?.unit
    ? staffMembers.filter((m) => m.unit?.toLowerCase().trim() === user.unit?.toLowerCase().trim())
    : selectedUnitFilter === 'All'
      ? staffMembers
      : staffMembers.filter((m) => m.unit === selectedUnitFilter);

  return (
    <div className="space-y-6 antialiased">
      {/* Top Header matching Reference Image 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Workload</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            REAL-TIME CAPACITY VIEW
          </p>
        </div>
      </div>

      {/* Main Team Members Container Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 overflow-hidden">
        {/* Card Header Sub-Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">TEAM MEMBERS</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Monitor performance and workload of staff in your unit
            </p>
          </div>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">
            {filteredStaffMembers.length} STAFF
          </span>
        </div>

        {/* Unit Filter Tabs */}
        {user?.role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <button
              onClick={() => setSelectedUnitFilter('All')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 ${
                selectedUnitFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
              }`}
            >
              <span>ALL UNITS</span>
              <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-black rounded-lg ${
                selectedUnitFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {staffMembers.length}
              </span>
            </button>

            {units.filter((u: any) => u.name !== 'Administrator').map((unit) => {
              const count = staffMembers.filter((m) => m.unit === unit.name).length;

              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitFilter(unit.name)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 ${
                    selectedUnitFilter === unit.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                  }`}
                >
                  <span className="uppercase">{unit.name}</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-black rounded-lg ${
                    selectedUnitFilter === unit.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Team Members Table matching Reference Image 1 */}
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">UNIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">PERFORMANCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-blue-600"></span>
                  </td>
                </tr>
              ) : filteredStaffMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm text-slate-400 font-semibold">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredStaffMembers.map((member, idx) => {
                  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const isDropdownOpen = openDropdownId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      {/* Name Column with Solid Initial Avatar */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl ${colorClass} text-white font-extrabold text-base flex items-center justify-center shadow-md`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                            <div className="text-xs text-slate-400 font-medium">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Unit Column with Soft Pill Badge */}
                      <td className="py-4 px-4 align-middle">
                        <span className={`px-3 py-1 rounded-xl text-[11px] uppercase tracking-wider ${getUnitPillStyle(member.unit)}`}>
                          {member.unit || 'GRAPHIC'}
                        </span>
                      </td>

                      {/* Status Column with Active Green Indicator */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>ACTIVE</span>
                        </div>
                      </td>

                      {/* Performance / Actions Column matching Image 1 */}
                      <td className="py-4 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* View Reports Button */}
                          <button
                            onClick={() => setSelectedReportsStaff(member)}
                            className="btn btn-outline border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-700 btn-sm rounded-xl font-bold text-xs normal-case h-9 px-4 bg-white"
                          >
                            View Reports
                          </button>

                          {/* View Jobs Button */}
                          <button
                            onClick={() => navigate(`/portal/job-requests?search=${member.name}`)}
                            className="btn btn-primary btn-sm rounded-xl font-bold text-xs normal-case h-9 px-4 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-sm"
                          >
                            View Jobs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ADD NEW TEAM MEMBER matching Reference Image 2 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            {/* Modal Dark Blue Header Bar matching Reference Image 2 */}
            <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                {editingStaff ? 'EDIT TEAM MEMBER' : 'ADD NEW TEAM MEMBER'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveStaff} className="p-6 md:p-8 space-y-5">
              {/* Full Name */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    FULL NAME
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Suhairi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm font-medium text-slate-800"
                />
              </div>

              {/* Email Address */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    EMAIL ADDRESS
                  </span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm font-medium text-slate-800"
                />
              </div>

              {/* Initial Password */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    INITIAL PASSWORD
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm font-medium text-slate-800"
                />
              </div>

              {/* Assigned Unit Dropdown */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    ASSIGNED UNIT
                  </span>
                </label>
                <select
                  value={assignedUnit}
                  onChange={(e) => setAssignedUnit(e.target.value)}
                  className="select select-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm font-medium text-slate-800"
                >
                  {units.length > 0 ? (
                    units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Graphic">Graphic</option>
                      <option value="Writer">Writer</option>
                      <option value="Socmed">Socmed</option>
                      <option value="Events">Events</option>
                    </>
                  )}
                </select>
              </div>

              {/* Modal Buttons matching Reference Image 2 */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary h-12 px-8 flex-1 normal-case text-sm font-bold shadow-lg shadow-blue-500/25 rounded-xl bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                >
                  {editingStaff ? 'Update Staff' : 'Register Staff'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost h-12 px-6 normal-case text-xs font-black tracking-wider text-slate-500 hover:text-slate-800 uppercase"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports Summary Modal */}
      {selectedReportsStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedReportsStaff.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedReportsStaff.email} • {selectedReportsStaff.unit}</p>
              </div>
              <button onClick={() => setSelectedReportsStaff(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-center">
                <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-2xl font-black text-blue-700">{selectedReportsStaff.assigned_jobs_count || 0}</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Assigned Tasks</div>
              </div>
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <div className="text-2xl font-black text-emerald-700">{selectedReportsStaff.completed_jobs_count || 0}</div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Completed Tasks</div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  const staffName = selectedReportsStaff.name;
                  setSelectedReportsStaff(null);
                  navigate(`/portal/job-requests?search=${staffName}`);
                }}
                className="btn btn-primary w-full h-12 normal-case font-bold rounded-xl bg-blue-600 text-white"
              >
                View Detailed Workload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
