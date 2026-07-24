import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Trash2, Plus, X, UserCheck, Calendar, CheckCircle2 } from 'lucide-react';

export const JobRequestsList: React.FC = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState(true);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('All');

  // Create Internal Job state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [newStartDate, setNewStartDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Self-Initiated Task Modal State
  const [showSelfModal, setShowSelfModal] = useState(false);
  const [selfTitle, setSelfTitle] = useState('');
  const [selfClient, setSelfClient] = useState('');
  const [selfProject, setSelfProject] = useState('');
  const [selfStartDate, setSelfStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selfStatus, setSelfStatus] = useState('completed');
  const [selfDescription, setSelfDescription] = useState('');
  const [submittingSelf, setSubmittingSelf] = useState(false);

  // Manage Presets State
  const [showManagePresetsModal, setShowManagePresetsModal] = useState(false);
  const [presetsTab, setPresetsTab] = useState<'client' | 'project'>('client');
  const [presetClients, setPresetClients] = useState<string[]>([]);
  const [presetProjects, setPresetProjects] = useState<string[]>([]);
  const [newPresetValue, setNewPresetValue] = useState('');
  const [loadingPresets, setLoadingPresets] = useState(false);

  const fetchPresets = async () => {
    setLoadingPresets(true);
    try {
      const res = await fetch('/api/job-requests/presets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.clients)) setPresetClients(data.clients);
      if (Array.isArray(data.projects)) setPresetProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPresets(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, [token]);

  const handleDeletePreset = async (type: 'client' | 'project', value: string) => {
    try {
      const res = await fetch('/api/job-requests/presets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, value }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'client') {
          setPresetClients((prev) => prev.filter((item) => item !== value));
        } else {
          setPresetProjects((prev) => prev.filter((item) => item !== value));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetValue.trim()) return;
    try {
      const res = await fetch('/api/job-requests/presets/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: presetsTab, value: newPresetValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPresetValue('');
        fetchPresets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSelfTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfTitle.trim()) {
      alert('Work title is required.');
      return;
    }
    setSubmittingSelf(true);
    try {
      const res = await fetch('/api/job-requests/self-initiated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: selfTitle,
          description: selfDescription,
          client_name: selfClient,
          project_name: selfProject,
          status: selfStatus,
          start_date: selfStartDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSelfModal(false);
        setSelfTitle('');
        setSelfClient('');
        setSelfProject('');
        setSelfDescription('');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to record task log.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while connecting to server.');
    } finally {
      setSubmittingSelf(false);
    }
  };

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.is_acting_manager;

  const fetchRequests = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);

    fetch(`/api/job-requests?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchUnits = () => {
    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter((u: any) => u.name !== 'Administrator');
          setUnitsList(filtered);
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchTeam = () => {
    if (!token) return;
    fetch('/api/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.staffMembers) setStaffMembers(data.staffMembers);
      })
      .catch((err) => console.error(err));
  };

  const urlSearchVal = searchParams.get('search') || '';
  useEffect(() => {
    setSearch(urlSearchVal);
  }, [urlSearchVal]);

  useEffect(() => {
    fetchRequests();
    fetchUnits();
    if (isManagerOrAdmin) {
      fetchTeam();
    }
  }, [token, search]);

  const handleOpenCreateModal = () => {
    setNewTitle('');
    setNewDescription('');
    setNewClientName('');
    setNewClientEmail('');
    setNewUnit(user?.acting_manager_unit || user?.unit || (unitsList[0]?.name || 'Graphic & Web'));
    setSelectedStaffIds([]);
    setNewStartDate('');
    setNewDeadline('');
    setIsCreateModalOpen(true);
  };

  const handleToggleStaffSelect = (staffId: number) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  const handleCreateInternalJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a project title.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/job-requests/create-internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          client_name: newClientName.trim() || 'Management Directive',
          client_email: newClientEmail.trim() || user?.email || 'internal@cdi.app',
          unit: newUnit || user?.acting_manager_unit || user?.unit || 'Graphic & Web',
          assigned_staff_ids: selectedStaffIds,
          start_date: newStartDate || null,
          deadline: newDeadline || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        fetchRequests();
        alert(`Internal job created successfully! (Ticket: ${data.ticket_no})`);
      } else {
        alert(data.error || 'Failed to create internal job.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating internal job.');
    } finally {
      setCreating(false);
    }
  };

  const currentJobs = requests.filter((r) => r.status !== 'completed' && r.status !== 'rejected');
  const historyJobs = requests.filter((r) => r.status === 'completed' || r.status === 'rejected');

  const fallbackUnits = Array.from(new Set(requests.map((r) => r.unit).filter(Boolean)));
  const finalUnitsList = unitsList.length > 0
    ? unitsList.map(u => ({ id: u.id, name: u.name }))
    : fallbackUnits.map((name, index) => ({ id: index + 100, name }));

  let displayedRequests = activeTab === 'current' ? currentJobs : historyJobs;

  if (selectedUnitFilter !== 'All') {
    displayedRequests = displayedRequests.filter((r) => {
      const unitObj = finalUnitsList.find(u => u.name === selectedUnitFilter);
      return r.unit === selectedUnitFilter || (unitObj && r.unit_id === unitObj.id);
    });
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this job request?')) return;
    try {
      const res = await fetch(`/api/job-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatusBadge = (status: string, stepName?: string) => {
    if (status === 'completed') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-emerald-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">COMPLETED</span>;
    }
    if (status === 'rejected') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-rose-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">REJECTED</span>;
    }
    if (status === 'manager_approval') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-blue-600 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">MANAGER APPROVAL</span>;
    }
    if (status === 'on_hold') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-amber-500 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">PENDING / ON HOLD</span>;
    }
    if (status === 'cancelled') {
      return <span className="inline-flex items-center justify-center whitespace-nowrap bg-slate-700 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">CANCELLED</span>;
    }
    return <span className="inline-flex items-center justify-center whitespace-nowrap bg-purple-600 text-white font-extrabold uppercase rounded-full px-4 py-1.5 text-[10px] tracking-wider shadow-sm">STAFF PROCESSING</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const activeManagerUnit = user?.acting_manager_unit || user?.unit;
  const filteredStaffMembers = user?.role === 'admin'
    ? staffMembers.filter(s => !newUnit || s.unit === newUnit)
    : staffMembers.filter(s => s.unit === activeManagerUnit);

  return (
    <div className="space-y-6 antialiased">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/60 shadow-inner w-fit">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'current'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CURRENT JOBS ({currentJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            HISTORY ({historyJobs.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Button for Staff, Manager & Admin to Add Tasks */}
          <button
            onClick={() => {
              setSelfTitle('');
              setSelfClient('');
              setSelfProject('');
              setSelfDescription('');
              setSelfStatus('completed');
              setShowSelfModal(true);
            }}
            className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl px-5 h-11 border-none shadow-md shadow-purple-500/25 flex items-center gap-2 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl px-5 h-11 border-none shadow-md shadow-blue-500/25 flex items-center gap-2 shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Internal Job</span>
            </button>
          )}

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search ID, Ticket, Client or Da..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered w-full h-11 bg-white border-slate-200 pl-10 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 shadow-sm"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
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
              {(activeTab === 'current' ? currentJobs : historyJobs).length}
            </span>
          </button>

          {finalUnitsList.map((unit) => {
            const count = (activeTab === 'current' ? currentJobs : historyJobs).filter(
              (r) => r.unit === unit.name || r.unit_id === unit.id
            ).length;

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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">CLIENT</th>
                <th className="py-3 px-4">CURRENT STATUS</th>
                <th className="py-3 px-4">ASSIGNED TO</th>
                <th className="py-3 px-4">TIMELINE</th>
                <th className="py-3 px-4">PROGRESS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-indigo-600"></span>
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 font-semibold">
                    No job requests found in {activeTab === 'current' ? 'Current Jobs' : 'History'}.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const totalTasks = req.total_staff || 0;
                  const completedTasks = req.completed_staff || 0;
                  const percent = req.status === 'completed' ? 100 : totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>#{req.id}</span>
                          {req.ticket_no?.startsWith('SELF') && (
                            <span
                              title="Direct Staff Task Entry"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-100 text-purple-700 border border-purple-200/80 shadow-sm shrink-0"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          {req.ticket_no}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm">{req.title}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {req.client_name} <span className="mx-1">•</span> {req.client_email}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        {renderStatusBadge(req.status, req.current_step_name)}
                      </td>
                      <td className="py-4 px-4 align-top text-xs font-semibold text-slate-700">
                        {req.assigned_staff && req.assigned_staff.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.assigned_staff.map((s: any, i: number) => (
                              <span key={s.id} className="inline-flex items-center gap-1 font-bold">
                                {s.is_done ? (
                                  <span className="text-emerald-500 font-extrabold" title="Completed">✓</span>
                                ) : (
                                  <span className="text-slate-300 font-extrabold" title="Pending">○</span>
                                )}
                                <span className={s.is_done ? 'text-slate-700' : 'text-slate-400 font-medium'}>{s.name}</span>
                                {i < req.assigned_staff.length - 1 && <span className="text-slate-300">,</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No staff assigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-xs">
                        {req.start_date || req.deadline ? (
                          <div>
                            {req.start_date && (
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                START: {formatDate(req.start_date)}
                              </div>
                            )}
                            {req.deadline && (
                              <div className="text-xs font-extrabold text-rose-600 mt-0.5">
                                Finish: {formatDate(req.deadline)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider italic">
                            NOT SCHEDULED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-xs w-36">
                        <div className="font-extrabold text-slate-700 text-[11px] mb-1">{percent}%</div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/portal/job-requests/${req.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-wider hover:underline"
                          >
                            VIEW DETAILS
                          </Link>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="text-rose-400 hover:text-rose-600 p-1"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Create Internal Job Request</h3>
                  <p className="text-xs text-slate-300 font-medium">Internal job request form / management directive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInternalJob} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    PROJECT / TASK TITLE <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corporate Annual Report 2026..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      REQUESTER NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Management Directive / Upper Management"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      REFERENCE EMAIL (OPTIONAL)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. requester@example.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>
                {user?.role === 'admin' ? (
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      RESPONSIBLE UNIT
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                    >
                      {unitsList.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      UNIT
                    </label>
                    <input
                      type="text"
                      disabled
                      value={activeManagerUnit || 'Graphic & Web'}
                      className="input input-bordered w-full h-11 bg-slate-100 border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    DESCRIPTION / SCOPE DETAILS
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter project description or scope details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="textarea textarea-bordered w-full bg-slate-50 border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600"
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      START DATE
                    </label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      TARGET DEADLINE
                    </label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      ASSIGN RESPONSIBLE STAFF
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold lowercase">
                      ({selectedStaffIds.length} selected)
                    </span>
                  </label>
                  {filteredStaffMembers.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                      No staff members available in this unit.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                      {filteredStaffMembers.map((staff) => {
                        const isSelected = selectedStaffIds.includes(staff.id);
                        return (
                          <div
                            key={staff.id}
                            onClick={() => handleToggleStaffSelect(staff.id)}
                            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {staff.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="font-extrabold text-xs text-slate-900 truncate">{staff.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{staff.email}</div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="checkbox checkbox-xs checkbox-primary rounded-md"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl px-6 h-11 border-none shadow-md shadow-blue-500/25 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Internal Job</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR SELF-INITIATED STAFF TASK LOGGING */}
      {showSelfModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-purple-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Add Direct Work Task</h3>
                  <p className="text-[11px] text-purple-100 font-medium">Official Work Record & Activity Log</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSelfModal(false)}
                className="btn btn-sm btn-ghost btn-circle text-purple-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateSelfTask} className="p-6 space-y-4">
              {/* 1. WORK TITLE */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  WORK TITLE <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Monthly CDI Portal Server Maintenance..."
                  value={selfTitle}
                  onChange={(e) => setSelfTitle(e.target.value)}
                  required
                  className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600"
                />
              </div>

              {/* 2 & 3. CLIENT & PROJECT (Smart Comboboxes with Saved Dropdowns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      CLIENT
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        fetchPresets();
                        setPresetsTab('client');
                        setShowManagePresetsModal(true);
                      }}
                      className="text-[10px] font-extrabold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-purple-500" /> Manage List
                    </button>
                  </div>
                  <input
                    type="text"
                    list="client-suggestions-list"
                    placeholder="Type or select Client..."
                    value={selfClient}
                    onChange={(e) => setSelfClient(e.target.value)}
                    className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600"
                  />
                  <datalist id="client-suggestions-list">
                    {presetClients.map((c, idx) => (
                      <option key={idx} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      PROJECT
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        fetchPresets();
                        setPresetsTab('project');
                        setShowManagePresetsModal(true);
                      }}
                      className="text-[10px] font-extrabold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-purple-500" /> Manage List
                    </button>
                  </div>
                  <input
                    type="text"
                    list="project-suggestions-list"
                    placeholder="Type or select Project..."
                    value={selfProject}
                    onChange={(e) => setSelfProject(e.target.value)}
                    className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600"
                  />
                  <datalist id="project-suggestions-list">
                    {presetProjects.map((p, idx) => (
                      <option key={idx} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 4 & 5. EXECUTION DATE & TASK STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    EXECUTION DATE
                  </label>
                  <input
                    type="date"
                    value={selfStartDate}
                    onChange={(e) => setSelfStartDate(e.target.value)}
                    className="input input-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    TASK STATUS
                  </label>
                  <select
                    value={selfStatus}
                    onChange={(e) => setSelfStatus(e.target.value)}
                    className="select select-bordered w-full h-11 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600"
                  >
                    <option value="completed">🟢 Completed</option>
                    <option value="staff_processing">🔵 In Progress</option>
                  </select>
                </div>
              </div>

              {/* 6. WORK DETAILS & OUTCOME SUMMARY */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  WORK DETAILS & OUTCOME SUMMARY
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe key activities performed and final results..."
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSelfModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSelf}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl px-6 h-11 border-none shadow-md shadow-purple-500/25 flex items-center gap-2"
                >
                  {submittingSelf ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Task Log</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR MANAGING SAVED CLIENTS & PROJECTS */}
      {showManagePresetsModal && (
        <div className="fixed inset-0 z-[9999] !mt-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0 border border-white/10">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Manage Saved Dropdown Items</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Remove unwanted or test entries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManagePresetsModal(false)}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setPresetsTab('client')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    presetsTab === 'client' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Clients ({presetClients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPresetsTab('project')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    presetsTab === 'project' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Projects ({presetProjects.length})
                </button>
              </div>

              {/* Add New Item Form */}
              <form onSubmit={handleAddPreset} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Add new ${presetsTab === 'client' ? 'Client' : 'Project'} name...`}
                  value={newPresetValue}
                  onChange={(e) => setNewPresetValue(e.target.value)}
                  className="input input-bordered input-sm flex-1 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-600 h-10"
                />
                <button
                  type="submit"
                  className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl px-4 h-10 border-none shadow-md"
                >
                  + Add
                </button>
              </form>

              {/* Items List with Trash Icons */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {loadingPresets ? (
                  <div className="text-center py-6">
                    <span className="loading loading-spinner loading-sm text-purple-600"></span>
                  </div>
                ) : (presetsTab === 'client' ? presetClients : presetProjects).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-100">
                    No saved {presetsTab} items found.
                  </div>
                ) : (
                  (presetsTab === 'client' ? presetClients : presetProjects).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-800 truncate pr-2">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(presetsTab, item)}
                        className="btn btn-xs btn-ghost btn-circle text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title={`Delete "${item}" from dropdown`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManagePresetsModal(false)}
                  className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl px-6 h-10 border-none"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
