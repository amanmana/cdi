import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
  Sparkles,
  Camera,
} from 'lucide-react';

export interface CustomService {
  id: number;
  name: string;
  display_label: string;
  description: string;
  department_id: number | null;
  target_unit_id: number;
  target_unit_name: string;
  suggested_staff_id: number | string | null;
  suggested_staff_name: string | null;
  routing_target?: 'manager' | 'head_unit' | 'staff';
  is_active: boolean;
  form_schema: SchemaField[];
  department_name?: string;
  unit_display_name?: string;
}

interface SchemaField {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
  scope?: 'public' | 'internal' | 'both';
}

const getFieldScope = (f: SchemaField | any): 'public' | 'internal' | 'both' => {
  return f?.scope || 'public';
};

export const UnitsManagement: React.FC = () => {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const isHeadUnit = Boolean(user?.is_unit_head);

  // If user is not Admin or Head Unit (e.g. Manager or regular staff), redirect to Dashboard
  if (user && !isAdmin && !isHeadUnit) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  // Navigation tab for Admin
  const [activeTab, setActiveTab] = useState<'structure' | 'services' | 'builder'>('structure');

  // Main data states
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Service modal state
  const [customServiceModalOpen, setCustomServiceModalOpen] = useState(false);
  const [editingCustomService, setEditingCustomService] = useState<CustomService | null>(null);
  const [customServiceForm, setCustomServiceForm] = useState({
    name: '',
    display_label: '',
    description: '',
    department_id: '',
    target_unit_id: '',
    suggested_staff_ids: [] as number[],
    routing_target: 'manager' as 'manager' | 'head_unit' | 'staff',
    is_active: true,
  });
  const [isSavingCustomService, setIsSavingCustomService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<CustomService | null>(null);
  const [deletingService, setDeletingService] = useState(false);

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
    routing_target: 'manager',
    suggested_staff_id: '',
    suggested_staff_name: '',
  });
  const [isSavingUnitConfig, setIsSavingUnitConfig] = useState(false);

  // Builder state
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [builderTab, setBuilderTab] = useState<'public' | 'internal'>('public');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [shareWithOtherForm, setShareWithOtherForm] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [isSavingSchema, setIsSavingSchema] = useState(false);

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

  const fetchCustomServices = async () => {
    try {
      const res = await fetch('/api/admin/custom-services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setCustomServices(data);
    } catch (err) {
      console.error('Failed to fetch custom services:', err);
    }
  };

  const refreshAll = () => {
    fetchDepartments();
    fetchUnits();
    fetchUsers();
    if (isAdmin) fetchCustomServices();
  };

  const handleOpenAddCustomService = () => {
    setEditingCustomService(null);
    const defaultUnit = units.find((u) => u.name.toLowerCase().includes('event')) || units[0];
    setCustomServiceForm({
      name: '',
      display_label: '',
      description: '',
      department_id: defaultUnit?.department_id ? String(defaultUnit.department_id) : '',
      target_unit_id: defaultUnit ? String(defaultUnit.id) : '',
      suggested_staff_ids: [],
      routing_target: 'manager',
      is_active: true,
    });
    setCustomServiceModalOpen(true);
  };

  const handleOpenEditCustomService = (service: CustomService) => {
    setEditingCustomService(service);
    const parsedStaffIds: number[] = service.suggested_staff_id
      ? String(service.suggested_staff_id)
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0)
      : [];

    setCustomServiceForm({
      name: service.name,
      display_label: service.display_label || service.name,
      description: service.description || '',
      department_id: service.department_id ? String(service.department_id) : '',
      target_unit_id: String(service.target_unit_id),
      suggested_staff_ids: parsedStaffIds,
      routing_target: service.routing_target || 'manager',
      is_active: service.is_active,
    });
    setCustomServiceModalOpen(true);
  };

  const handleSaveCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customServiceForm.name.trim() || !customServiceForm.target_unit_id) return;
    setIsSavingCustomService(true);
    try {
      const payload = {
        name: customServiceForm.name.trim(),
        display_label: customServiceForm.display_label.trim() || customServiceForm.name.trim(),
        description: customServiceForm.description.trim(),
        department_id: customServiceForm.department_id ? Number(customServiceForm.department_id) : undefined,
        target_unit_id: Number(customServiceForm.target_unit_id),
        suggested_staff_ids: customServiceForm.suggested_staff_ids,
        suggested_staff_id: customServiceForm.suggested_staff_ids.join(',') || null,
        routing_target: customServiceForm.routing_target,
        is_active: customServiceForm.is_active,
      };

      if (editingCustomService) {
        await fetch(`/api/admin/custom-services/${editingCustomService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/custom-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      setCustomServiceModalOpen(false);
      fetchCustomServices();
      setAlertModal({
        title: editingCustomService ? 'Service Updated' : 'Service Created',
        message: `Custom service '${payload.name}' has been saved successfully.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to save custom service:', err);
      setAlertModal({
        title: 'Error',
        message: 'Failed to save custom service.',
        type: 'error',
      });
    } finally {
      setIsSavingCustomService(false);
    }
  };

  const handleToggleServiceActive = async (service: CustomService) => {
    try {
      await fetch(`/api/admin/custom-services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      fetchCustomServices();
    } catch (err) {
      console.error('Failed to toggle service status:', err);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    setDeletingService(true);
    try {
      await fetch(`/api/admin/custom-services/${serviceToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setServiceToDelete(null);
      fetchCustomServices();
      setAlertModal({
        title: 'Service Deleted',
        message: 'The custom service has been removed.',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to delete custom service:', err);
      setAlertModal({
        title: 'Error',
        message: 'Failed to delete custom service.',
        type: 'error',
      });
    } finally {
      setDeletingService(false);
    }
  };

  const handleOpenServiceBuilder = (service: CustomService) => {
    const serviceObj = {
      ...service,
      is_custom_service: true,
      name: `[Service] ${service.name}`,
    };
    setSelectedUnit(serviceObj);
    const existing = service.form_schema || [];
    const normalized = existing.map((f: any) => ({
      ...f,
      scope: getFieldScope(f),
    }));
    setSchemaFields(normalized);
    resetFieldForm();
    setActiveTab('builder');
  };

  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token]);

  // Filter accessible units for Head Unit vs Admin
  const accessibleUnits = useMemo(() => {
    if (isAdmin) return units;
    if (isHeadUnit) {
      const filtered = units.filter((u) => {
        if (u.head_id && user?.id && Number(u.head_id) === Number(user.id)) return true;
        if (user?.unit_id && u.id && Number(u.id) === Number(user.unit_id)) return true;
        if (user?.unit && u.name && u.name.toLowerCase().trim() === user.unit.toLowerCase().trim()) return true;
        const managedUnits: string[] = (user as any)?.managed_units || [];
        if (managedUnits.some((m) => m.toLowerCase().trim() === u.name.toLowerCase().trim())) return true;
        const managedUnitIds: number[] = (user as any)?.managed_unit_ids || [];
        if (managedUnitIds.includes(u.id)) return true;
        return false;
      });
      return filtered;
    }
    return [];
  }, [units, user, isAdmin, isHeadUnit]);

  // For Head Unit: auto-select their first accessible unit and lock to builder view
  useEffect(() => {
    if (isHeadUnit && !isAdmin) {
      setActiveTab('builder');
      if (accessibleUnits.length > 0 && !selectedUnit) {
        handleOpenBuilder(accessibleUnits[0]);
      }
    }
  }, [isHeadUnit, isAdmin, accessibleUnits, selectedUnit]);

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
      routing_target: u.routing_target || 'manager',
      suggested_staff_id: u.suggested_staff_id ? String(u.suggested_staff_id) : '',
      suggested_staff_name: u.suggested_staff_name || '',
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
          routing_target: unitConfigForm.routing_target || 'manager',
          suggested_staff_id: unitConfigForm.suggested_staff_id ? Number(unitConfigForm.suggested_staff_id) : null,
          suggested_staff_name: unitConfigForm.suggested_staff_name || null,
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
    const normalized = (unit.form_schema || []).map((f: any) => ({
      ...f,
      scope: getFieldScope(f),
    }));
    setSchemaFields(normalized);
    resetFieldForm();
    setActiveTab('builder');
  };

  const resetFieldForm = () => {
    setEditingFieldIndex(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setFieldPlaceholder('');
    setShareWithOtherForm(false);
  };

  const switchBuilderTab = (tab: 'public' | 'internal') => {
    setBuilderTab(tab);
    resetFieldForm();
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) return;
    const fieldId = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isOptionsType = ['select', 'radio', 'checkbox'].includes(fieldType);
    const parsedOptions = isOptionsType ? fieldOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined;

    if (isOptionsType && (!parsedOptions || parsedOptions.length === 0)) {
      alert('Please enter at least one option (comma-separated) for Dropdown, Radio, or Checkbox fields.');
      return;
    }

    const targetScope: 'public' | 'internal' | 'both' = shareWithOtherForm
      ? 'both'
      : builderTab === 'public'
      ? 'public'
      : 'internal';

    const newField: SchemaField = {
      id: editingFieldIndex !== null ? schemaFields[editingFieldIndex].id : fieldId,
      label: fieldLabel.trim(),
      type: fieldType,
      options: parsedOptions,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
      scope: targetScope,
    };

    if (editingFieldIndex !== null) {
      const updatedFields = [...schemaFields];
      updatedFields[editingFieldIndex] = newField;
      setSchemaFields(updatedFields);
      setEditingFieldIndex(null);
    } else {
      setSchemaFields([...schemaFields, newField]);
    }

    resetFieldForm();
  };

  const handleEditField = (index: number) => {
    const field = schemaFields[index];
    if (!field) return;
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldOptions(field.options ? field.options.join(', ') : '');
    setFieldRequired(field.required);
    setFieldPlaceholder(field.placeholder || '');
    setShareWithOtherForm(field.scope === 'both');
    setEditingFieldIndex(index);
  };

  const handleMoveFieldInTab = (indexInSchema: number, direction: 'up' | 'down') => {
    const currentTabFields = schemaFields.filter((f) =>
      builderTab === 'public' ? getFieldScope(f) !== 'internal' : getFieldScope(f) !== 'public'
    );
    const targetField = schemaFields[indexInSchema];
    if (!targetField) return;
    const tabIdx = currentTabFields.findIndex((f) => f.id === targetField.id);
    if (tabIdx === -1) return;
    if (direction === 'up' && tabIdx === 0) return;
    if (direction === 'down' && tabIdx === currentTabFields.length - 1) return;

    const swapWithField = currentTabFields[direction === 'up' ? tabIdx - 1 : tabIdx + 1];
    const idxA = indexInSchema;
    const idxB = schemaFields.findIndex((f) => f.id === swapWithField.id);
    if (idxB === -1) return;

    const next = [...schemaFields];
    const temp = next[idxA];
    next[idxA] = next[idxB];
    next[idxB] = temp;
    setSchemaFields(next);
  };

  const handleRemoveField = (index: number) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
    if (editingFieldIndex === index) {
      resetFieldForm();
    }
  };

  const handleSaveSchema = async () => {
    if (!selectedUnit) return;
    setIsSavingSchema(true);
    try {
      if (selectedUnit.is_custom_service) {
        await fetch(`/api/admin/custom-services/${selectedUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ form_schema: schemaFields }),
        });
      } else {
        await fetch(`/api/admin/units/${selectedUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ form_schema: schemaFields }),
        });
      }

      setSelectedUnit({
        ...selectedUnit,
        form_schema: schemaFields,
      });

      refreshAll();
      setAlertModal({
        title: 'Form Schema Saved',
        message: 'The form schema has been saved successfully!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to save schema:', err);
      setAlertModal({
        title: 'Error',
        message: 'Failed to save form schema.',
        type: 'error',
      });
    } finally {
      setIsSavingSchema(false);
    }
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
              {isHeadUnit && !isAdmin ? 'Form Builder' : 'Organization Structure & Units'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {isHeadUnit && !isAdmin
                ? 'Manage dynamic form schemas and additional requirements for your unit.'
                : 'Manage departments, unit public labels, visibility, unit heads, and custom dynamic forms.'}
            </p>
          </div>
        </div>

        {/* Tab switch for Admin */}
        {isAdmin && (
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
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Custom Services</span>
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
      {isAdmin && activeTab === 'structure' && (
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
      {/* TAB 2: CUSTOM CLIENT SERVICES (ADMIN ONLY)               */}
      {/* ========================================================= */}
      {isAdmin && activeTab === 'services' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/60">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Client Intake Customization</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Custom Client Services
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Create dedicated service intake buttons for clients (e.g., <strong>Photography</strong>) without creating new organizational units.
                Requests automatically route to the fulfillment unit (e.g., <strong>Events Management</strong>) and notify the Unit Head for assignment.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCustomService}
              className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl h-11 px-5 border-none shadow-lg shadow-purple-500/25 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Service</span>
            </button>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {customServices.map((service) => {
              const questionCount = service.form_schema?.length || 0;
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-xl ${
                    service.is_active
                      ? 'border-slate-100 shadow-slate-200/50 hover:border-purple-200'
                      : 'border-slate-200/60 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Department Tag & Status Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                        {service.department_name || 'CORPORATE EVENT'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleServiceActive(service)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${
                          service.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200/70 text-slate-500 border border-slate-300'
                        }`}
                        title={service.is_active ? 'Active on Public Form (Click to hide)' : 'Hidden (Click to show)'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{service.is_active ? 'PUBLIC ACTIVE' : 'HIDDEN'}</span>
                      </button>
                    </div>

                    {/* Service Name & Description */}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {service.display_label || service.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {service.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Routing & Assignment Info */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold text-[11px]">Fulfillment Unit:</span>
                        <span className="font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                          {service.target_unit_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold text-[11px]">Suggested Specialist:</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                          {service.suggested_staff_name || 'Unit Head Assigns'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold text-[11px]">Workflow Route:</span>
                        <span className={`font-black text-[10px] px-2 py-0.5 rounded-md border ${
                          service.routing_target === 'staff'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : service.routing_target === 'head_unit'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {service.routing_target === 'staff'
                            ? `⚡ Direct to Staff (${service.suggested_staff_name || 'Staff'})`
                            : service.routing_target === 'head_unit'
                            ? '👑 Direct to Head Unit'
                            : '🏢 Dept. Manager Review'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold text-[11px]">Dynamic Intake Questions:</span>
                        <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenServiceBuilder(service)}
                      className="btn btn-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl font-bold flex items-center gap-1.5 h-8 px-3"
                      title="Configure dynamic questions for this service"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Questions ({questionCount})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCustomService(service)}
                        className="btn btn-ghost btn-xs text-slate-600 hover:text-indigo-600 rounded-xl h-8 px-2.5 font-bold"
                        title="Edit service details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceToDelete(service)}
                        className="btn btn-ghost btn-xs text-rose-500 hover:bg-rose-50 rounded-xl h-8 px-2"
                        title="Delete custom service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {customServices.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl p-12 border border-slate-100 text-center shadow-xl shadow-slate-200/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">No Custom Services Configured</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click 'Add Custom Service' above to create custom buttons like Photography for clients.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FORM BUILDER VIEW (VERTICAL STACK LAYOUT)          */}
      {/* ========================================================= */}
      {(isHeadUnit || activeTab === 'builder') && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. TOP CARD: MY UNITS / SELECT UNIT */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isHeadUnit && !isAdmin ? (accessibleUnits.length > 1 ? 'My Units' : 'My Unit') : 'Select Unit'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Select a unit below to configure its dynamic intake and task forms.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-slate-200/60">
                {accessibleUnits.length} {accessibleUnits.length === 1 ? 'Unit' : 'Units'}
              </span>
            </div>

            {/* Grid of Unit Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {accessibleUnits.map((u) => {
                const isSelected = selectedUnit?.id === u.id;
                const pubCount = (u.form_schema || []).filter((f: any) => getFieldScope(f) !== 'internal').length;
                const intCount = (u.form_schema || []).filter((f: any) => getFieldScope(f) !== 'public').length;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleOpenBuilder(u)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-bold text-sm truncate ${
                          isSelected ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {u.name}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-lg shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" /> Active
                        </span>
                      )}
                    </div>

                    {u.department_name && (
                      <div className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
                        🏢 {u.department_name}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] font-bold">
                      <span className="text-blue-600">🌐 {pubCount} Public</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-purple-600">🏢 {intCount} Internal</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MAIN SECTION: FORM BUILDER WORKBENCH (FULL WIDTH) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            {selectedUnit ? (
              <div className="space-y-6">
                {/* Header Bar with Save Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Dynamic Form Builder
                      </span>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900">
                        {selectedUnit.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Customize dynamic form fields for public client requests and internal staff tasks for this unit.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSchema}
                    disabled={isSavingSchema}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl px-6 h-11 border-none shadow-md shadow-blue-500/25 shrink-0 flex items-center gap-2"
                  >
                    {isSavingSchema ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Save Form Schema</span>
                      </>
                    )}
                  </button>
                </div>

                {/* PRIMARY TABS: PUBLIC INTAKE vs INTERNAL STAFF TASK */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
                  <button
                    type="button"
                    onClick={() => switchBuilderTab('public')}
                    className={`flex items-center gap-2.5 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all -mb-px rounded-t-xl ${
                      builderTab === 'public'
                        ? 'border-blue-600 text-blue-600 bg-blue-50/60 font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>🌐 Client Intake Form</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        builderTab === 'public' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {schemaFields.filter((f) => getFieldScope(f) !== 'internal').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchBuilderTab('internal')}
                    className={`flex items-center gap-2.5 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all -mb-px rounded-t-xl ${
                      builderTab === 'internal'
                        ? 'border-purple-600 text-purple-600 bg-purple-50/60 font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>🏢 Internal Staff Task Form</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        builderTab === 'internal' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {schemaFields.filter((f) => getFieldScope(f) !== 'public').length}
                    </span>
                  </button>
                </div>

                {/* TAB EXPLANATION BANNER */}
                {builderTab === 'public' ? (
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-blue-900">
                        🌐 Client Intake Form
                      </h3>
                      <p className="text-[11px] text-blue-700/80 mt-0.5 font-medium leading-relaxed">
                        Fields configured below will be displayed on the Public Portal for clients to fill in when submitting a new job request for this unit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-purple-900">
                        🏢 Internal Staff Task Form
                      </h3>
                      <p className="text-[11px] text-purple-700/80 mt-0.5 font-medium leading-relaxed">
                        Fields configured below will be specifically displayed in the <strong>"+ Add Task"</strong> modal when staff or the Head Unit log direct work for this unit (e.g. Content Pillar, Category, Specifications, etc.).
                      </p>
                    </div>
                  </div>
                )}

                {/* WORKBENCH: SIDE-BY-SIDE BUILDER GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Vertical Field Creator Card */}
                  <div className="xl:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2.5">
                      {editingFieldIndex !== null
                        ? builderTab === 'public'
                          ? '⚡ Edit Public Form Field'
                          : '⚡ Edit Staff Task Field'
                        : builderTab === 'public'
                        ? '✨ Add Field to Public Form'
                        : '✨ Add Field to Staff Task Form'}
                    </h3>

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Field Label *
                      </label>
                      <input
                        type="text"
                        placeholder={
                          builderTab === 'public'
                            ? 'e.g. Artwork Dimension (cm), Target Audience'
                            : 'e.g. Content Pillar, Campaign Tag, Asset Format'
                        }
                        value={fieldLabel}
                        onChange={(e) => setFieldLabel(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-semibold focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Input Type (Field Type)
                      </label>
                      <select
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value)}
                        className="select select-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                      >
                        <option value="text">Text Input (Single Line)</option>
                        <option value="textarea">Textarea (Multi-line Text)</option>
                        <option value="number">Number Input (Numeric)</option>
                        <option value="date">Date Picker (Calendar Date)</option>
                        <option value="select">Dropdown Select (Single Choice)</option>
                        <option value="radio">Radio Buttons (Single Choice)</option>
                        <option value="checkbox">Checkboxes (Multiple Choices)</option>
                      </select>
                    </div>

                    {['select', 'radio', 'checkbox'].includes(fieldType) && (
                      <div>
                        <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                          Options (Comma-Separated) *
                        </label>
                        <input
                          type="text"
                          placeholder="Option 1, Option 2, Option 3"
                          value={fieldOptions}
                          onChange={(e) => setFieldOptions(e.target.value)}
                          className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                        />
                      </div>
                    )}

                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">
                        Placeholder / Helper Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1920×1080 px or Select category..."
                        value={fieldPlaceholder}
                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10 font-medium"
                      />
                    </div>

                    {/* Mandatory Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="reqCheck"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="checkbox checkbox-primary checkbox-sm rounded-lg"
                      />
                      <label htmlFor="reqCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Mandatory (Required Field)
                      </label>
                    </div>

                    {/* Intuitive Cross-Form Share Checkbox */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="shareOtherFormCheck"
                          checked={shareWithOtherForm}
                          onChange={(e) => setShareWithOtherForm(e.target.checked)}
                          className="checkbox checkbox-sm rounded-lg mt-0.5 checkbox-accent"
                        />
                        <label htmlFor="shareOtherFormCheck" className="text-[11px] font-semibold text-slate-700 cursor-pointer leading-tight">
                          {builderTab === 'public'
                            ? '🔄 Also include this field in Staff Task Form (+ Add Task)'
                            : '🔄 Also include this field in Client Intake Form'}
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 pl-6">
                        {shareWithOtherForm
                          ? 'This field will appear in BOTH forms (Client Intake & Internal Tasks).'
                          : builderTab === 'public'
                          ? 'This field will only appear in the Client Intake Form.'
                          : 'This field will only appear in the Staff Task Form.'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddField}
                        className={`btn text-white font-bold text-xs rounded-xl flex-1 h-10 border-none shadow-sm ${
                          builderTab === 'public' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {editingFieldIndex !== null
                          ? 'Update Field'
                          : builderTab === 'public'
                          ? 'Add to Client Form'
                          : 'Add to Staff Form'}
                      </button>
                      {editingFieldIndex !== null && (
                        <button
                          onClick={resetFieldForm}
                          className="btn btn-ghost text-slate-500 font-bold text-xs rounded-xl h-10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Filtered Configured Fields List & Live Preview */}
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    {/* Active Fields List for this Tab */}
                    {(() => {
                      const displayedFields = schemaFields
                        .map((f, rawIdx) => ({ f, rawIdx }))
                        .filter(({ f }) => (builderTab === 'public' ? getFieldScope(f) !== 'internal' : getFieldScope(f) !== 'public'));

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                              {builderTab === 'public' ? (
                                <>
                                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Client Intake Fields ({displayedFields.length})</span>
                                </>
                              ) : (
                                <>
                                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Internal Staff Task Fields ({displayedFields.length})</span>
                                </>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                              {builderTab === 'public' ? (
                                <>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Public Only</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Shared (Both Forms)</span>
                                </>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Internal Only</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Shared (Both Forms)</span>
                                </>
                              )}
                            </div>
                          </div>

                          {displayedFields.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                              No fields configured for {builderTab === 'public' ? 'Client Intake Form' : 'Internal Staff Task Form'} yet. Use the panel on the left to add your first field.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {displayedFields.map(({ f, rawIdx }, tabIdx) => (
                                <div
                                  key={f.id || rawIdx}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                    editingFieldIndex === rawIdx
                                      ? 'bg-blue-50/60 border-blue-300'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                      {tabIdx + 1}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-xs text-slate-900">{f.label}</span>
                                        {f.required && (
                                          <span className="text-[9px] text-rose-600 font-black uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                            Required
                                          </span>
                                        )}
                                        {getFieldScope(f) === 'both' ? (
                                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-emerald-200">
                                            🔄 Shared (Public & Staff)
                                          </span>
                                        ) : getFieldScope(f) === 'internal' ? (
                                          <span className="text-[9px] bg-purple-50 text-purple-700 font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-purple-200">
                                            🏢 Staff Task Only
                                          </span>
                                        ) : (
                                          <span className="text-[9px] bg-blue-50 text-blue-700 font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-blue-200">
                                            🌐 Public Only
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
                                      onClick={() => handleMoveFieldInTab(rawIdx, 'up')}
                                      disabled={tabIdx === 0}
                                      className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveFieldInTab(rawIdx, 'down')}
                                      disabled={tabIdx === displayedFields.length - 1}
                                      className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleEditField(rawIdx)}
                                      className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 rounded-lg p-1.5"
                                      title="Edit Field"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveField(rawIdx)}
                                      className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-lg p-1.5"
                                      title="Delete Field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Live Preview Dedicated to this Tab */}
                          {displayedFields.length > 0 && (
                            <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Eye className={`w-4 h-4 ${builderTab === 'public' ? 'text-blue-600' : 'text-purple-600'}`} />
                                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">
                                    {builderTab === 'public'
                                      ? 'Live Form Preview: Client Intake Form'
                                      : 'Live Form Preview: Staff Task Form (+ Add Task)'}
                                  </h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  builderTab === 'public'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {builderTab === 'public' ? 'Client View' : 'Staff Modal View'}
                                </span>
                              </div>

                              {builderTab === 'internal' ? (
                                /* Internal Task Modal Spec Card Style */
                                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-4">
                                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                    <div className="flex items-center gap-2">
                                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                      <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                                        {selectedUnit.name.toUpperCase()} SPECIFICATIONS
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 border border-purple-200 px-2 py-0.5 rounded-full">
                                      Internal Form
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {displayedFields.map(({ f }) => (
                                      <div key={f.id} className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                          {f.label}
                                          {f.required && <span className="text-rose-500">*</span>}
                                        </label>
                                        {f.type === 'textarea' ? (
                                          <textarea
                                            placeholder={f.placeholder || ''}
                                            disabled
                                            rows={2}
                                            className="textarea textarea-bordered w-full text-xs rounded-xl bg-white border-purple-200"
                                          />
                                        ) : f.type === 'select' ? (
                                          <select
                                            disabled
                                            className="select select-bordered w-full text-xs rounded-xl bg-white border-purple-200 h-9 font-medium"
                                          >
                                            <option>{f.placeholder || '-- Select an option --'}</option>
                                            {f.options?.map((opt, i) => (
                                              <option key={i}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : f.type === 'radio' ? (
                                          <div className="flex flex-wrap gap-3 pt-1">
                                            {f.options?.map((opt, i) => (
                                              <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                                <input type="radio" disabled name={f.id} className="radio radio-xs radio-primary" />
                                                {opt}
                                              </label>
                                            ))}
                                          </div>
                                        ) : f.type === 'checkbox' ? (
                                          <div className="flex flex-wrap gap-2 pt-1">
                                            {f.options?.map((opt, i) => (
                                              <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-white text-[11px] font-semibold text-slate-700">
                                                <input type="checkbox" disabled className="checkbox checkbox-xs checkbox-primary" />
                                                {opt}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <input
                                            type={f.type}
                                            placeholder={f.placeholder || ''}
                                            disabled
                                            className="input input-bordered w-full text-xs rounded-xl bg-white border-purple-200 h-9 font-medium"
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                /* Public Portal Style */
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200">
                                  {displayedFields.map(({ f }) => (
                                    <div key={f.id} className="space-y-1">
                                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        {f.label}
                                        {f.required && <span className="text-rose-500">*</span>}
                                      </label>
                                      {f.type === 'textarea' ? (
                                        <textarea
                                          placeholder={f.placeholder || ''}
                                          disabled
                                          rows={2}
                                          className="textarea textarea-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200"
                                        />
                                      ) : f.type === 'select' ? (
                                        <select
                                          disabled
                                          className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
                                        >
                                          <option>{f.placeholder || '-- Select an option --'}</option>
                                          {f.options?.map((opt, i) => (
                                            <option key={i}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : f.type === 'radio' ? (
                                        <div className="flex flex-wrap gap-3 pt-1">
                                          {f.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                              <input type="radio" disabled name={f.id} className="radio radio-xs" />
                                              {opt}
                                            </label>
                                          ))}
                                        </div>
                                      ) : f.type === 'checkbox' ? (
                                        <div className="flex flex-wrap gap-3 pt-1">
                                          {f.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                              <input type="checkbox" disabled className="checkbox checkbox-xs" />
                                              {opt}
                                            </label>
                                          ))}
                                        </div>
                                      ) : (
                                        <input
                                          type={f.type}
                                          placeholder={f.placeholder || ''}
                                          disabled
                                          className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-base text-slate-700">
                  {accessibleUnits.length === 0 ? 'Tiada Unit Ditemui' : 'Sila Pilih Unit di Atas'}
                </h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
                  {accessibleUnits.length === 0
                    ? 'Akaun anda tidak ditugaskan sebagai Ketua Unit bagi mana-mana unit. Sila hubungi pentadbir.'
                    : 'Sila klik salah satu unit pada kad di atas untuk membina dan menyesuaikan skema borang dinamik unit tersebut.'}
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

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Suggested Specialist Staff (Pilihan)
                </label>
                <select
                  value={unitConfigForm.suggested_staff_id}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const found = usersList.find((u) => String(u.id) === String(sid));
                    setUnitConfigForm({
                      ...unitConfigForm,
                      suggested_staff_id: sid,
                      suggested_staff_name: found ? found.name : '',
                    });
                  }}
                  className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                >
                  <option value="">-- No Suggested Staff (Let Unit Head decide) --</option>
                  {usersList
                    .filter((u) => {
                      if (!configuringUnit) return false;
                      const uUnit = (u.unit || '').toLowerCase().trim();
                      const cfgUnit = (configuringUnit.name || '').toLowerCase().trim();
                      return u.role === 'staff' && (u.unit_id === configuringUnit.id || uUnit === cfgUnit);
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.unit || configuringUnit.name}) — {u.email}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Cadangan staf pakar untuk penugasan pantas atau penugasan terus (Direct to Staff).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Workflow Entry Route (Laluan Permohonan Awal) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    unitConfigForm.routing_target === 'manager'
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">🏢 Manager (Default)</span>
                      <input
                        type="radio"
                        name="unit_routing_target"
                        value="manager"
                        checked={unitConfigForm.routing_target === 'manager'}
                        onChange={() => setUnitConfigForm({ ...unitConfigForm, routing_target: 'manager' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Melalui semakan & kelulusan Pengurus Jabatan biasa.
                    </span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    unitConfigForm.routing_target === 'head_unit'
                      ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">👑 Head of Unit</span>
                      <input
                        type="radio"
                        name="unit_routing_target"
                        value="head_unit"
                        checked={unitConfigForm.routing_target === 'head_unit'}
                        onChange={() => setUnitConfigForm({ ...unitConfigForm, routing_target: 'head_unit' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Langkau Pengurus; terus ke Unit Head untuk semakan & lantik staf.
                    </span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    unitConfigForm.routing_target === 'staff'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">⚡ Direct to Staff</span>
                      <input
                        type="radio"
                        name="unit_routing_target"
                        value="staff"
                        checked={unitConfigForm.routing_target === 'staff'}
                        onChange={() => setUnitConfigForm({ ...unitConfigForm, routing_target: 'staff' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Auto-approve & auto-assign terus ke staf pakar. Staf terus mula kerja!
                    </span>
                  </label>
                </div>
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
      {/* MODAL: ADD / EDIT CUSTOM SERVICE                          */}
      {/* ========================================================= */}
      {customServiceModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-purple-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {editingCustomService ? 'Edit Custom Service' : 'Add Custom Service'}
                  </h3>
                  <p className="text-[11px] text-purple-200 font-medium">
                    Create a dedicated client button without adding a new unit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomServiceModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-purple-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomService} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photography"
                    value={customServiceForm.name}
                    onChange={(e) => setCustomServiceForm({ ...customServiceForm, name: e.target.value })}
                    className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Public Button Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photography"
                    value={customServiceForm.display_label}
                    onChange={(e) => setCustomServiceForm({ ...customServiceForm, display_label: e.target.value })}
                    className="input input-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Service Description / Deliverable</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official event photo coverage, corporate portraits & documentation..."
                  value={customServiceForm.description}
                  onChange={(e) => setCustomServiceForm({ ...customServiceForm, description: e.target.value })}
                  className="textarea textarea-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 font-medium focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Fulfillment Unit *</label>
                  <select
                    required
                    value={customServiceForm.target_unit_id}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const matchedUnit = units.find((u) => String(u.id) === uId);
                      setCustomServiceForm({
                        ...customServiceForm,
                        target_unit_id: uId,
                        department_id: matchedUnit?.department_id ? String(matchedUnit.department_id) : customServiceForm.department_id,
                        suggested_staff_ids: [],
                      });
                    }}
                    className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-bold focus:bg-white"
                  >
                    <option value="">Select Target Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.department_name ? `(${u.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Tickets will be routed to this unit's queue.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Department Tag</label>
                  <select
                    value={customServiceForm.department_id}
                    onChange={(e) => setCustomServiceForm({ ...customServiceForm, department_id: e.target.value })}
                    className="select select-bordered w-full text-xs rounded-xl bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Badge displayed on the public card.</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Suggested Specialist Staff / Direct Assign Staff (Pilihan)
                  </label>
                  {customServiceForm.suggested_staff_ids.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomServiceForm({ ...customServiceForm, suggested_staff_ids: [] })}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline"
                    >
                      Kosongkan Pilihan
                    </button>
                  )}
                </div>

                {(() => {
                  const eligibleStaff = usersList.filter((u) => {
                    if (!customServiceForm.target_unit_id) return false;
                    const selectedUnitObj = units.find((unit) => String(unit.id) === customServiceForm.target_unit_id);
                    if (!selectedUnitObj) return false;
                    return (
                      Number(u.unit_id) === Number(selectedUnitObj.id) ||
                      (u.unit && u.unit.toLowerCase().trim() === selectedUnitObj.name.toLowerCase().trim())
                    );
                  });

                  if (!customServiceForm.target_unit_id) {
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400">
                        Sila pilih <strong>Fulfillment Unit</strong> terlebih dahulu untuk melihat senarai staf.
                      </div>
                    );
                  }

                  if (eligibleStaff.length === 0) {
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                        Tiada staf didaftarkan di bawah unit ini.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {eligibleStaff.map((u) => {
                          const isSelected = customServiceForm.suggested_staff_ids.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-400 text-purple-950 font-semibold shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const nextIds = isSelected
                                    ? customServiceForm.suggested_staff_ids.filter((id) => id !== u.id)
                                    : [...customServiceForm.suggested_staff_ids, u.id];
                                  setCustomServiceForm({ ...customServiceForm, suggested_staff_ids: nextIds });
                                }}
                                className="checkbox checkbox-xs checkbox-primary rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-bold text-slate-800">{u.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                              </div>
                              {u.is_unit_head === 1 && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-black shrink-0">HEAD</span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        {customServiceForm.routing_target === 'staff' ? (
                          customServiceForm.suggested_staff_ids.length > 0 ? (
                            <span className="text-purple-700 font-semibold">
                              ✓ {customServiceForm.suggested_staff_ids.length} staf dipilih. Permohonan akan terus ditugaskan kepada staf ini dengan status <strong>Staff Processing</strong>.
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg block border border-amber-200/80">
                              ⚡ <strong>Failsafe Aktif:</strong> Tiada staf khusus dipilih. Sistem akan menugaskan <strong>semua staf unit</strong> ({eligibleStaff.length} orang) secara automatik sekiranya laluan <em>Direct to Staff</em> dipilih.
                            </span>
                          )
                        ) : (
                          <span>
                            Cadangan staf untuk rujukan pantas Ketua Unit semasa membuat agihan tugas.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Workflow Entry Route (Laluan Permohonan Awal) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    customServiceForm.routing_target === 'manager'
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">🏢 Manager (Default)</span>
                      <input
                        type="radio"
                        name="routing_target"
                        value="manager"
                        checked={customServiceForm.routing_target === 'manager'}
                        onChange={() => setCustomServiceForm({ ...customServiceForm, routing_target: 'manager' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Melalui semakan & kelulusan Pengurus Jabatan biasa.
                    </span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    customServiceForm.routing_target === 'head_unit'
                      ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">👑 Head of Unit</span>
                      <input
                        type="radio"
                        name="routing_target"
                        value="head_unit"
                        checked={customServiceForm.routing_target === 'head_unit'}
                        onChange={() => setCustomServiceForm({ ...customServiceForm, routing_target: 'head_unit' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Langkau Pengurus; terus ke Unit Head (cth: Laurence) untuk assign staf.
                    </span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left ${
                    customServiceForm.routing_target === 'staff'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">⚡ Direct to Staff</span>
                      <input
                        type="radio"
                        name="routing_target"
                        value="staff"
                        checked={customServiceForm.routing_target === 'staff'}
                        onChange={() => setCustomServiceForm({ ...customServiceForm, routing_target: 'staff' })}
                        className="radio radio-primary radio-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      Auto-approve & auto-assign terus ke staf (cth: Zainal). Staf terus mula kerja!
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customServiceForm.is_active}
                    onChange={(e) => setCustomServiceForm({ ...customServiceForm, is_active: e.target.checked })}
                    className="checkbox checkbox-primary checkbox-sm rounded-lg"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Show as active button on public job request form
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomServiceModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomService}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-purple-500/20"
                >
                  {isSavingCustomService ? 'Saving...' : editingCustomService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CUSTOM SERVICE CONFIRMATION                 */}
      {/* ========================================================= */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Delete Custom Service</h3>
                  <p className="text-[11px] text-white/80 font-medium">Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium leading-relaxed">
                Are you sure you want to delete custom service <strong>"{serviceToDelete.name}"</strong>?
                <br />
                <span className="text-[11px] text-rose-700 font-normal mt-1 block">
                  The button will be removed from the public form. Existing submitted jobs will not be affected.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceToDelete(null)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteService}
                  disabled={deletingService}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-rose-500/20"
                >
                  {deletingService ? 'Deleting...' : 'Delete Service'}
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
