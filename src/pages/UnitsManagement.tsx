import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FolderGit2,
  Plus,
  Trash2,
  Sliders,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Layers,
  Crown,
  Eye,
  EyeOff,
  Settings2,
  Users,
  Globe,
  Tag,
  Briefcase,
} from 'lucide-react';

interface SchemaField {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export const UnitsManagement: React.FC = () => {
  const { token, user } = useAuth();
  const isManager = user?.role === 'manager';

  // Navigation tab for Admin
  const [activeTab, setActiveTab] = useState<'structure' | 'builder'>('structure');

  // Main data states
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick unit add / rename
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDeptId, setNewUnitDeptId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Department modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', manager_id: '' });
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<any | null>(null);
  const [deletingDept, setDeletingDept] = useState(false);

  // Unit Configuration modal state
  const [unitConfigModalOpen, setUnitConfigModalOpen] = useState(false);
  const [configuringUnit, setConfiguringUnit] = useState<any | null>(null);
  const [unitConfigForm, setUnitConfigForm] = useState({
    name: '',
    department_id: '',
    public_label: '',
    is_public: true,
    head_id: '',
  });
  const [isSavingUnitConfig, setIsSavingUnitConfig] = useState(false);

  // Builder state
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // Unit deletion state
  const [unitToDelete, setUnitToDelete] = useState<any | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);

  // Alert/Notification modal
  const [alertModal, setAlertModal] = useState<{
    title?: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
  } | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/admin/units', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setUnits(data);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsersList(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const refreshAll = () => {
    fetchDepartments();
    fetchUnits();
    fetchUsers();
  };

  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token]);

  // For manager: auto-select their own unit and lock to builder view
  useEffect(() => {
    if (isManager) {
      setActiveTab('builder');
      if (units.length > 0 && !selectedUnit) {
        const managerUnit = units.find(
          (u) => u.name === user?.unit || u.name === user?.acting_manager_unit
        );
        if (managerUnit) {
          handleOpenBuilder(managerUnit);
          setIsSidebarCollapsed(true);
        }
      }
    }
  }, [isManager, units, user]);

  // ==========================================
  // DEPARTMENT HANDLERS
  // ==========================================
  const handleOpenAddDeptModal = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '', manager_id: '' });
    setDeptModalOpen(true);
  };

  const handleOpenEditDeptModal = (d: any) => {
    setEditingDept(d);
    setDeptForm({
      name: d.name || '',
      description: d.description || '',
      manager_id: d.manager_id ? String(d.manager_id) : '',
    });
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    setIsSavingDept(true);
    try {
      const endpoint = editingDept ? `/api/admin/departments/${editingDept.id}` : '/api/admin/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: deptForm.name.trim(),
          description: deptForm.description.trim() || null,
          manager_id: deptForm.manager_id ? Number(deptForm.manager_id) : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeptModalOpen(false);
        refreshAll();
        setAlertModal({
          title: 'Success',
          message: editingDept ? 'Department updated successfully.' : 'Department created successfully.',
          type: 'success',
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: data.error || 'Failed to save department.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err?.message || 'Failed to save department.',
        type: 'error',
      });
    } finally {
      setIsSavingDept(false);
    }
  };

  const confirmDeleteDept = async () => {
    if (!deptToDelete) return;
    setDeletingDept(true);
    try {
      const res = await fetch(`/api/admin/departments/${deptToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeptToDelete(null);
        refreshAll();
        setAlertModal({
          title: 'Department Deleted',
          message: 'The department has been removed. Associated units and staff have been unlinked.',
          type: 'success',
        });
      } else {
        setDeptToDelete(null);
        setAlertModal({
          title: 'Error',
          message: data.error || 'Failed to delete department.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setDeptToDelete(null);
      setAlertModal({
        title: 'Error',
        message: err?.message || 'Failed to delete department.',
        type: 'error',
      });
    } finally {
      setDeletingDept(false);
    }
  };

  // ==========================================
  // UNIT CONFIGURATION HANDLERS
  // ==========================================
  const handleOpenConfigUnitModal = (u: any) => {
    setConfiguringUnit(u);
    setUnitConfigForm({
      name: u.name || '',
      department_id: u.department_id ? String(u.department_id) : '',
      public_label: u.public_label || '',
      is_public: u.is_public !== undefined ? Boolean(u.is_public) : true,
      head_id: u.head_id ? String(u.head_id) : '',
    });
    setUnitConfigModalOpen(true);
  };

  const handleSaveUnitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringUnit) return;

    setIsSavingUnitConfig(true);
    try {
      const res = await fetch(`/api/admin/units/${configuringUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: unitConfigForm.name.trim(),
          department_id: unitConfigForm.department_id ? Number(unitConfigForm.department_id) : null,
          public_label: unitConfigForm.public_label.trim() || null,
          is_public: unitConfigForm.is_public ? 1 : 0,
          head_id: unitConfigForm.head_id ? Number(unitConfigForm.head_id) : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUnitConfigModalOpen(false);
        refreshAll();
        setAlertModal({
          title: 'Unit Updated',
          message: 'Unit organizational structure and public display settings updated successfully.',
          type: 'success',
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: data.error || 'Failed to update unit settings.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err?.message || 'Failed to update unit settings.',
        type: 'error',
      });
    } finally {
      setIsSavingUnitConfig(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newUnitName.trim(),
        department_id: newUnitDeptId ? Number(newUnitDeptId) : null,
      }),
    });

    setNewUnitName('');
    setNewUnitDeptId('');
    refreshAll();
  };

  const handleStartRename = (u: any) => {
    setEditingUnitId(u.id);
    setEditingUnitName(u.name);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const handleRenameUnit = async (id: number) => {
    const trimmed = editingUnitName.trim();
    if (!trimmed) return;
    await fetch(`/api/admin/units/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: trimmed }),
    });
    setEditingUnitId(null);
    setEditingUnitName('');
    refreshAll();
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setDeletingUnit(true);
    try {
      const res = await fetch(`/api/admin/units/${unitToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (selectedUnit?.id === unitToDelete.id) setSelectedUnit(null);
        refreshAll();
        setUnitToDelete(null);
      } else {
        const errorMsg = data.error || 'Failed to delete unit.';
        setUnitToDelete(null);
        setAlertModal({
          title: 'Cannot Delete Unit',
          message: errorMsg,
          type: 'warning',
        });
      }
    } catch (err: any) {
      console.error('Failed to delete unit:', err);
      setUnitToDelete(null);
      setAlertModal({
        title: 'Error',
        message: err?.message || 'Failed to delete unit.',
        type: 'error',
      });
    } finally {
      setDeletingUnit(false);
    }
  };

  // ==========================================
  // FORM BUILDER HANDLERS
  // ==========================================
  const handleOpenBuilder = (unit: any) => {
    setSelectedUnit(unit);
    setSchemaFields(unit.form_schema || []);
    setEditingFieldIndex(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setFieldPlaceholder('');
    setActiveTab('builder');
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) return;
    const fieldId = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isOptionsType = ['select', 'radio', 'checkbox'].includes(fieldType);

    const newField: SchemaField = {
      id: fieldId,
      label: fieldLabel.trim(),
      type: fieldType,
      options: isOptionsType ? fieldOptions.split(',').map((o) => o.trim()).filter((o) => o) : undefined,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
    };

    if (editingFieldIndex !== null) {
      const updatedFields = [...schemaFields];
      updatedFields[editingFieldIndex] = newField;
      setSchemaFields(updatedFields);
      setEditingFieldIndex(null);
    } else {
      setSchemaFields([...schemaFields, newField]);
    }

    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setFieldPlaceholder('');
  };

  const handleEditField = (index: number) => {
    const field = schemaFields[index];
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldOptions(field.options ? field.options.join(', ') : '');
    setFieldRequired(field.required);
    setFieldPlaceholder(field.placeholder || '');
    setEditingFieldIndex(index);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === schemaFields.length - 1) return;

    const updatedFields = [...schemaFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[targetIndex];
    updatedFields[targetIndex] = temp;
    setSchemaFields(updatedFields);
  };

  const handleRemoveField = (index: number) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
    if (editingFieldIndex === index) {
      setEditingFieldIndex(null);
      setFieldLabel('');
      setFieldPlaceholder('');
    }
  };

  const handleSaveSchema = async () => {
    if (!selectedUnit) return;
    await fetch(`/api/admin/units/${selectedUnit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ form_schema: schemaFields }),
    });

    setSelectedUnit({
      ...selectedUnit,
      form_schema: schemaFields,
    });

    refreshAll();
    setAlertModal({
      title: 'Form Schema Saved',
      message: 'Form schema saved successfully!',
      type: 'success',
    });
  };

  // Managers/Admin list for department manager selection
  const managerCandidates = usersList.filter((u) => ['manager', 'admin'].includes(u.role));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isManager ? 'Form Builder' : 'Organization Structure & Units'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {isManager
                ? 'Manage form schema for your unit.'
                : 'Manage departments, unit public labels, visibility, unit heads, and custom dynamic forms.'}
            </p>
          </div>
        </div>

        {/* Tab switch for Admin */}
        {!isManager && (
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'structure'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Departments & Units</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'builder'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Form Builder</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DEPARTMENTS & ORG STRUCTURE (ADMIN ONLY)           */}
      {/* ========================================================= */}
      {!isManager && activeTab === 'structure' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* SECTION 1: DEPARTMENTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Departments (Jabatan)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Departments group multiple units together under a supervising Manager (e.g., Design Department, Corp. Comm.).
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddDeptModal}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl h-10 px-4 border-none shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-blue-200 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-blue-100">
                          Dept #{dept.id}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">{dept.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDeptModal(dept)}
                          className="btn btn-ghost btn-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-1.5"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeptToDelete(dept)}
                          className="btn btn-ghost btn-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {dept.description && (
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{dept.description}</p>
                    )}

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Manager:</span>
                        <span className="text-blue-700 font-extrabold">
                          {dept.manager_name ? dept.manager_name : 'No Manager Assigned'}
                        </span>
                      </div>
                      {dept.manager_email && (
                        <div className="text-[10px] text-slate-400 pl-5">{dept.manager_email}</div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                        Units under this department ({dept.units?.length || 0}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.units && dept.units.length > 0 ? (
                          dept.units.map((u: any) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                            >
                              <span>{u.name}</span>
                              {u.head_name && (
                                <span className="text-[10px] text-amber-600 font-extrabold" title={`Head: ${u.head_name}`}>
                                  (Head: {u.head_name.split(' ')[0]})
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No units assigned yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>{dept.units_count || 0} Units</span>
                    <span>{dept.staff_count || 0} Staff members</span>
                  </div>
                </div>
              ))}

              {departments.length === 0 && (
                <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-medium">
                  No departments found. Click "+ Add Department" above to create one.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: UNITS CONFIGURATION & PUBLIC DISPLAY */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Units & Public Display Settings
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure department assignments, custom public display names, visibility on the client request form, and Unit Heads.
                </p>
              </div>

              {/* Quick Add Unit form */}
              <form onSubmit={handleAddUnit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="New Unit Name..."
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="input input-bordered input-sm bg-white border-slate-200 rounded-xl text-xs font-medium h-9 w-40 focus:border-blue-600"
                />
                <select
                  value={newUnitDeptId}
                  onChange={(e) => setNewUnitDeptId(e.target.value)}
                  className="select select-bordered select-sm bg-white border-slate-200 rounded-xl text-xs h-9 font-medium"
                >
                  <option value="">No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 border-blue-600 text-white rounded-xl h-9 px-3"
                  title="Add Unit"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 pl-6">Unit Name (Internal)</th>
                      <th className="py-4">Department</th>
                      <th className="py-4">Public Display Label</th>
                      <th className="py-4">Public Form Visibility</th>
                      <th className="py-4">Unit Head</th>
                      <th className="py-4">Staff Count</th>
                      <th className="py-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {units.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 pl-6 font-bold text-slate-900">
                          {editingUnitId === u.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                ref={renameInputRef}
                                type="text"
                                value={editingUnitName}
                                onChange={(e) => setEditingUnitName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameUnit(u.id);
                                  if (e.key === 'Escape') {
                                    setEditingUnitId(null);
                                    setEditingUnitName('');
                                  }
                                }}
                                className="input input-bordered input-xs bg-white border-blue-300 rounded-lg h-8 text-xs font-bold w-40"
                              />
                              <button
                                onClick={() => handleRenameUnit(u.id)}
                                className="btn btn-xs bg-blue-600 text-white rounded-lg w-7 h-7 p-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUnitId(null);
                                  setEditingUnitName('');
                                }}
                                className="btn btn-xs btn-ghost text-slate-400 rounded-lg w-7 h-7 p-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{u.name}</span>
                              <button
                                onClick={() => handleStartRename(u)}
                                className="text-slate-300 hover:text-slate-600 transition-colors"
                                title="Rename unit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-4">
                          {u.department_name ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                              <Building2 className="w-3 h-3" />
                              {u.department_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>

                        <td className="py-4">
                          <span className="font-semibold text-slate-800">
                            {u.public_label ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 font-bold">
                                {u.public_label}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Defaults to "{u.name}"</span>
                            )}
                          </span>
                        </td>

                        <td className="py-4">
                          {u.is_public ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold">
                              <Eye className="w-3 h-3" />
                              Visible on Public Form
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold">
                              <EyeOff className="w-3 h-3" />
                              Hidden (Internal Only)
                            </span>
                          )}
                        </td>

                        <td className="py-4">
                          {u.head_name ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                              <Crown className="w-3 h-3 text-amber-500" />
                              {u.head_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>

                        <td className="py-4 text-slate-600 font-semibold">{u.staff_count || 0}</td>

                        <td className="py-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenConfigUnitModal(u)}
                              className="btn btn-outline btn-xs border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl font-bold gap-1"
                              title="Configure Department, Public Label & Head"
                            >
                              <Settings2 className="w-3 h-3" />
                              Configure
                            </button>
                            {u.name !== 'Administrator' && (
                              <button
                                type="button"
                                onClick={() => handleOpenBuilder(u)}
                                className="btn btn-outline btn-xs border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold gap-1"
                                title="Open Form Builder for this unit"
                              >
                                <Sliders className="w-3 h-3" />
                                Form
                              </button>
                            )}
                            {u.name !== 'Administrator' && (
                              <button
                                type="button"
                                onClick={() => setUnitToDelete(u)}
                                className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                                title="Delete unit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FORM BUILDER VIEW                                   */}
      {/* ========================================================= */}
      {(isManager || activeTab === 'builder') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
          {/* Left: Units List — hidden for manager */}
          {!isManager && (
            <div
              className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300 ${
                isSidebarCollapsed && selectedUnit
                  ? 'hidden lg:none lg:w-0 lg:p-0 lg:opacity-0 lg:overflow-hidden'
                  : 'block'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Select Unit</h2>
                <span className="text-xs text-slate-400 font-medium">{units.length} Units</span>
              </div>

              <div className="space-y-2">
                {units.map((u) => {
                  const isSelected = selectedUnit?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleOpenBuilder(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70 hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs truncate ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {u.name}
                          </span>
                          {u.department_name && (
                            <span className="text-[10px] bg-white/80 border border-slate-200 text-slate-500 font-extrabold px-1.5 py-0.2 rounded-md">
                              {u.department_name}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {u.form_schema?.length || 0} custom fields
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right: Form Builder Panel */}
          <div
            className={`bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 transition-all duration-300 ${
              isManager || (isSidebarCollapsed && selectedUnit) ? 'lg:col-span-3' : 'lg:col-span-2'
            }`}
          >
            {selectedUnit ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    {!isManager && (
                      <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="btn btn-outline btn-sm rounded-xl px-3 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 hidden lg:flex items-center gap-1.5 font-bold text-xs"
                        title={isSidebarCollapsed ? 'Show Units List' : 'Minimize Units List'}
                      >
                        {isSidebarCollapsed ? (
                          <>
                            <ChevronRight className="w-4 h-4 text-blue-600" />
                            Show Units List
                          </>
                        ) : (
                          <>
                            <ChevronLeft className="w-4 h-4 text-blue-600" />
                            Minimize List
                          </>
                        )}
                      </button>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Dynamic Form Builder: {selectedUnit.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Add custom fields required when clients submit a job request for this unit.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSchema}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-blue-500/20 shrink-0"
                  >
                    Save Form Schema
                  </button>
                </div>

                {/* Side-by-Side Builder Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  {/* Left: Vertical Field Creator Card */}
                  <div className="xl:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2.5">
                      {editingFieldIndex !== null ? '⚡ Edit Field Settings' : '✨ Add New Field'}
                    </h3>

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Field Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Artwork Dimension (cm)"
                        value={fieldLabel}
                        onChange={(e) => setFieldLabel(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                      />
                    </div>

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Input Type
                      </label>
                      <select
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value)}
                        className="select select-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                      >
                        <option value="text">Text Input</option>
                        <option value="textarea">Textarea (Long Text)</option>
                        <option value="number">Number Input</option>
                        <option value="date">Date Picker</option>
                        <option value="select">Select Dropdown</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                      </select>
                    </div>

                    {['select', 'radio', 'checkbox'].includes(fieldType) && (
                      <div>
                        <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                          Options (comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Print, Digital, Video"
                          value={fieldOptions}
                          onChange={(e) => setFieldOptions(e.target.value)}
                          className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                        />
                      </div>
                    )}

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Placeholder / Hint Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1920x1080 px"
                        value={fieldPlaceholder}
                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="reqCheck"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="checkbox checkbox-primary checkbox-sm rounded-lg"
                      />
                      <label htmlFor="reqCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Mark field as Mandatory (Required)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddField}
                        className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex-1 h-10 border-none shadow-sm"
                      >
                        {editingFieldIndex !== null ? 'Update Field' : 'Insert Field'}
                      </button>
                      {editingFieldIndex !== null && (
                        <button
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setFieldLabel('');
                            setFieldPlaceholder('');
                            setFieldOptions('');
                            setFieldRequired(false);
                          }}
                          className="btn btn-ghost text-slate-500 font-bold text-xs rounded-xl h-10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Active Fields List & Live Client Preview */}
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    {/* Active Fields list */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                        Configured Form Fields ({schemaFields.length})
                      </h3>
                      {schemaFields.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                          No custom fields added yet. Use the panel on the left to add your first field.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {schemaFields.map((f, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                editingFieldIndex === idx
                                  ? 'bg-blue-50/60 border-blue-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900">{f.label}</span>
                                    {f.required && (
                                      <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    Type: <span className="capitalize text-slate-600">{f.type}</span>
                                    {f.options && f.options.length > 0 && (
                                      <span> • Options: {f.options.join(', ')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveField(idx, 'up')}
                                  disabled={idx === 0}
                                  className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveField(idx, 'down')}
                                  disabled={idx === schemaFields.length - 1}
                                  className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditField(idx)}
                                  className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 rounded-lg p-1.5"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(idx)}
                                  className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-lg p-1.5"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Preview Box */}
                    {schemaFields.length > 0 && (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">
                            Client Form Preview
                          </h4>
                        </div>
                        <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
                          {schemaFields.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                {field.label}
                                {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              {field.type === 'textarea' ? (
                                <textarea
                                  placeholder={field.placeholder || ''}
                                  disabled
                                  rows={2}
                                  className="textarea textarea-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200"
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  disabled
                                  className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
                                >
                                  <option>{field.placeholder || 'Select an option...'}</option>
                                  {field.options?.map((opt, i) => (
                                    <option key={i}>{opt}</option>
                                  ))}
                                </select>
                              ) : field.type === 'radio' ? (
                                <div className="flex flex-wrap gap-3 pt-1">
                                  {field.options?.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <input type="radio" disabled name={field.id} className="radio radio-xs" />
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              ) : field.type === 'checkbox' ? (
                                <div className="flex flex-wrap gap-3 pt-1">
                                  {field.options?.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <input type="checkbox" disabled className="checkbox checkbox-xs" />
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  placeholder={field.placeholder || ''}
                                  disabled
                                  className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-base text-slate-700">No Unit Selected</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
                  Please pick a unit from the left panel to build and customize its dynamic form schema.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT DEPARTMENT                              */}
      {/* ========================================================= */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {editingDept ? 'Edit Department' : 'Create Department'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Organizational Structure</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeptModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Department, Corp. Comm."
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Department Manager</label>
                <select
                  value={deptForm.manager_id}
                  onChange={(e) => setDeptForm({ ...deptForm, manager_id: e.target.value })}
                  className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                >
                  <option value="">No Manager Assigned</option>
                  {managerCandidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email}) — [{m.role.toUpperCase()}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  The Manager will oversee all job requests across all sub-units in this department.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of department scope..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="textarea textarea-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 font-medium focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDept}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-blue-500/20"
                >
                  {isSavingDept ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIGURE UNIT SETTINGS                             */}
      {/* ========================================================= */}
      {unitConfigModalOpen && configuringUnit && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Configure Unit Settings</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {configuringUnit.name} ({configuringUnit.staff_count || 0} Staff)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnitConfigModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnitConfig} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Unit Internal Name *</label>
                <input
                  type="text"
                  required
                  value={unitConfigForm.name}
                  onChange={(e) => setUnitConfigForm({ ...unitConfigForm, name: e.target.value })}
                  className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-bold focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Used internally by staff and managers.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Assigned Department</label>
                <select
                  value={unitConfigForm.department_id}
                  onChange={(e) => setUnitConfigForm({ ...unitConfigForm, department_id: e.target.value })}
                  className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                >
                  <option value="">No Department (Independent Unit)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.manager_name ? `(Manager: ${d.manager_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  The department manager can view and assign tasks to staff in this unit.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Public Display Label (Client Request Form)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Graphic Design (leave blank to default to "${unitConfigForm.name}")`}
                  value={unitConfigForm.public_label}
                  onChange={(e) => setUnitConfigForm({ ...unitConfigForm, public_label: e.target.value })}
                  className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Custom label shown to public/clients when selecting this unit on the job request form.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-800">Show on Public Request Form</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    If disabled, this unit won't be selectable by clients on the public form.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={unitConfigForm.is_public}
                  onChange={(e) => setUnitConfigForm({ ...unitConfigForm, is_public: e.target.checked })}
                  className="checkbox checkbox-primary checkbox-sm rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Unit Head (Ketua Unit)</label>
                <select
                  value={unitConfigForm.head_id}
                  onChange={(e) => setUnitConfigForm({ ...unitConfigForm, head_id: e.target.value })}
                  className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                >
                  <option value="">No Unit Head Assigned</option>
                  {usersList
                    .filter((u) => ['staff', 'manager'].includes(u.role))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.unit || 'No Unit'}) — {u.email}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  The Unit Head receives tasks assigned by the Manager and can invite staff & distribute work for their unit's projects.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnitConfigModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUnitConfig}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-indigo-500/20"
                >
                  {isSavingUnitConfig ? 'Saving...' : 'Save Unit Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE DEPARTMENT CONFIRMATION                      */}
      {/* ========================================================= */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Delete Department</h3>
                  <p className="text-[11px] text-white/80 font-medium">Safety Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium leading-relaxed">
                Are you sure you want to delete department <strong>"{deptToDelete.name}"</strong>?
                <br />
                <span className="text-[11px] text-rose-700 font-normal mt-1 block">
                  All units under this department ({deptToDelete.units?.length || 0}) and staff will have their department unassigned. No units or jobs will be deleted.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeptToDelete(null)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDept}
                  disabled={deletingDept}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-rose-500/20"
                >
                  {deletingDept ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE UNIT CONFIRMATION                            */}
      {/* ========================================================= */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Delete Unit</h3>
                  <p className="text-[11px] text-white/80 font-medium">Safety Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium leading-relaxed">
                Are you sure you want to delete unit <strong>"{unitToDelete.name}"</strong>?
                <br />
                <span className="text-[11px] text-rose-700 font-normal mt-1 block">
                  This action cannot be undone. Units with existing job requests cannot be deleted.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnitToDelete(null)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUnit}
                  disabled={deletingUnit}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-rose-500/20"
                >
                  {deletingUnit ? 'Deleting...' : 'Delete Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CUSTOM ALERT NOTIFICATION                          */}
      {/* ========================================================= */}
      {alertModal && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-6 text-white flex items-center justify-between ${
                alertModal.type === 'success'
                  ? 'bg-emerald-600'
                  : alertModal.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  {alertModal.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {alertModal.title || (alertModal.type === 'success' ? 'Success' : 'Notice')}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">System Notification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div
                className={`p-4 rounded-2xl border text-xs font-medium leading-relaxed ${
                  alertModal.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : alertModal.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {alertModal.message}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAlertModal(null)}
                  className="btn bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl h-11 w-full border-none shadow-md shadow-slate-900/10"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
