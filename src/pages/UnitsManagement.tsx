import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, Plus, Trash2, Sliders, Edit2, Check, X, ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
  const [units, setUnits] = useState<any[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Lightbox Modal state
  const [unitToDelete, setUnitToDelete] = useState<any | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title?: string; message: string; type?: 'error' | 'warning' | 'info' | 'success' } | null>(null);

  // Builder state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // Rename state
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const fetchUnits = () => {
    fetch('/api/admin/units', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUnits(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchUnits();
  }, [token]);

  // For manager: auto-select their own unit and collapse the left panel
  useEffect(() => {
    if (isManager && units.length > 0 && !selectedUnit) {
      const managerUnit = units.find(
        (u) => u.name === user?.unit || u.name === user?.acting_manager_unit
      );
      if (managerUnit) {
        handleOpenBuilder(managerUnit);
        setIsSidebarCollapsed(true);
      }
    }
  }, [isManager, units, user]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newUnitName }),
    });

    setNewUnitName('');
    fetchUnits();
  };

  const handleOpenBuilder = (unit: any) => {
    setSelectedUnit(unit);
    setSchemaFields(unit.form_schema || []);
    setEditingFieldIndex(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setFieldPlaceholder('');
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) return;
    const fieldId = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isOptionsType = ['select', 'radio', 'checkbox'].includes(fieldType);
    
    const newField: SchemaField = {
      id: fieldId,
      label: fieldLabel.trim(),
      type: fieldType,
      options: isOptionsType ? fieldOptions.split(',').map((o) => o.trim()).filter(o => o) : undefined,
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
    
    // Update local state to keep builder open with the saved schema
    setSelectedUnit({
      ...selectedUnit,
      form_schema: schemaFields
    });
    
    fetchUnits();
    setAlertModal({
      title: 'Form Schema Saved',
      message: 'Form schema saved successfully!',
      type: 'success',
    });
  };

  const handlePromptDeleteUnit = (u: any) => {
    setUnitToDelete(u);
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
        fetchUnits();
        setUnitToDelete(null);
      } else {
        const errorMsg = data.error || 'Gagal memadam unit.';
        setUnitToDelete(null);
        setAlertModal({
          title: 'Tidak Boleh Memadam Unit',
          message: errorMsg,
          type: 'warning',
        });
      }
    } catch (err: any) {
      console.error('Failed to delete unit:', err);
      setUnitToDelete(null);
      setAlertModal({
        title: 'Ralat Pemadaman Unit',
        message: err?.message || 'Gagal memadam unit.',
        type: 'error',
      });
    } finally {
      setDeletingUnit(false);
    }
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
    fetchUnits();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
          <FolderGit2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isManager ? 'Form Builder' : 'Units Management & Form Builder'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            {isManager ? `Manage form schema for your unit.` : 'Manage service units and build custom unit form schemas.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Units List & Add Unit — hidden for manager */}
        {!isManager && <div className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300 ${
          isSidebarCollapsed && selectedUnit ? 'hidden lg:none lg:w-0 lg:p-0 lg:opacity-0 lg:overflow-hidden' : 'block'
        }`}>
          <h2 className="text-base font-bold text-slate-900 mb-4">Add New Unit</h2>
          <form onSubmit={handleAddUnit} className="flex gap-2 mb-6">
            <input
              type="text"
              required
              placeholder="Unit Name (e.g. Networking)..."
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              className="input input-bordered input-sm bg-slate-50 border-slate-200 rounded-xl flex-1 text-xs font-medium h-10 focus:bg-white focus:border-blue-600"
            />
            <button type="submit" className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 border-blue-600 text-white rounded-xl h-10 px-3">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-widest mb-3">Units List</h3>
          <div className="space-y-2.5">
            {units.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
                <div className="flex-1 min-w-0">
                  {editingUnitId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingUnitName}
                        onChange={(e) => setEditingUnitName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameUnit(u.id);
                          if (e.key === 'Escape') { setEditingUnitId(null); setEditingUnitName(''); }
                        }}
                        className="input input-bordered input-xs bg-white border-blue-300 rounded-lg flex-1 h-8 text-sm font-bold focus:border-blue-500 w-full"
                      />
                      <button
                        onClick={() => handleRenameUnit(u.id)}
                        className="btn btn-xs bg-blue-600 hover:bg-blue-700 border-blue-600 text-white rounded-lg w-7 h-7 p-0 flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingUnitId(null); setEditingUnitName(''); }}
                        className="btn btn-xs btn-ghost text-slate-400 hover:bg-slate-100 rounded-lg w-7 h-7 p-0 flex items-center justify-center shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-sm text-slate-900">{u.name} ({u.staff_count || 0})</div>
                      <div className="text-[10px] text-slate-400 font-medium">{u.form_schema?.length || 0} dynamic form fields</div>
                    </>
                  )}
                </div>

                {editingUnitId !== u.id && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleStartRename(u)} className="btn btn-ghost btn-xs text-slate-500 hover:bg-slate-200 rounded-xl" title="Rename unit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {u.name !== 'Administrator' && (
                      <button onClick={() => handleOpenBuilder(u)} className="btn btn-outline btn-xs border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl gap-1 font-bold">
                        <Sliders className="w-3 h-3" /> Form
                      </button>
                    )}
                    {u.name !== 'Administrator' && (
                      <button onClick={() => handlePromptDeleteUnit(u)} className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl" title="Delete unit">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>}

        {/* Right: Form Builder Panel */}
        <div className={`bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 transition-all duration-300 ${
          isManager || (isSidebarCollapsed && selectedUnit) ? 'lg:col-span-3' : 'lg:col-span-2'
        }`}>
          {selectedUnit ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  {!isManager && <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="btn btn-outline btn-sm rounded-xl px-3 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 hidden lg:flex items-center gap-1.5 font-bold text-xs"
                    title={isSidebarCollapsed ? "Show Units List" : "Minimize Units List"}
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
                  </button>}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Dynamic Form Builder: {selectedUnit.name}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Add custom fields required when clients submit a request.</p>
                  </div>
                </div>
                <button onClick={handleSaveSchema} className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-blue-500/20 shrink-0">
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
                    <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">Field Label</label>
                    <input
                      type="text"
                      placeholder="e.g. PC Asset Tag"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                      className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                    />
                  </div>

                  <div>
                    <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">Input Type</label>
                    <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="select select-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10">
                      <option value="text">Text Input</option>
                      <option value="textarea">Textarea (Long Text)</option>
                      <option value="number">Number Input</option>
                      <option value="date">Date Picker</option>
                      <option value="select">Select Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkboxes</option>
                    </select>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(fieldType) ? (
                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">Options (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="Option 1, Option 2, Option 3"
                        value={fieldOptions}
                        onChange={(e) => setFieldOptions(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-wider py-0.5">Placeholder (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Enter the serial number..."
                        value={fieldPlaceholder}
                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                        className="input input-bordered bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-1">
                    <label className="label cursor-pointer justify-start gap-2 py-0">
                      <input
                        type="checkbox"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="checkbox checkbox-primary checkbox-xs rounded"
                      />
                      <span className="label-text text-xs text-slate-600 font-bold">Required Field</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <button type="button" onClick={handleAddField} className={`btn btn-sm text-white font-bold rounded-xl w-full h-9 border-none shadow ${editingFieldIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                    </button>
                    
                    {editingFieldIndex !== null && (
                      <button type="button" onClick={() => {
                        setEditingFieldIndex(null);
                        setFieldLabel('');
                        setFieldType('text');
                        setFieldOptions('');
                        setFieldRequired(false);
                        setFieldPlaceholder('');
                      }} className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-600 font-bold rounded-xl w-full h-8">
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Live Form Preview & Layout */}
                <div className="xl:col-span-8 flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>Live Form Preview</span>
                    <span className="badge badge-sm badge-ghost text-slate-500 font-bold rounded-lg">{schemaFields.length} fields</span>
                  </h3>
                  
                  <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl min-h-[300px]">
                    {schemaFields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                        <p className="text-xs italic">No dynamic fields added yet.</p>
                        <p className="text-[10px] mt-1">Use the panel on the left to add fields to this unit's form.</p>
                      </div>
                    ) : (
                      schemaFields.map((f, index) => (
                        <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group flex gap-4 transition-all hover:border-blue-300 hover:shadow-md">
                          <div className="flex-1 pr-12">
                            <label className="label text-xs font-bold text-slate-700 py-0.5">
                              {f.label} {f.required && <span className="text-rose-500">*</span>}
                            </label>
                            
                            {f.type === 'text' && (
                              <input type="text" placeholder={f.placeholder} className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-xs h-9" disabled />
                            )}
                            
                            {f.type === 'textarea' && (
                              <textarea placeholder={f.placeholder} className="textarea textarea-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-xs h-16" disabled></textarea>
                            )}
                            
                            {f.type === 'number' && (
                              <input type="number" placeholder={f.placeholder} className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-xs h-9" disabled />
                            )}
                            
                            {f.type === 'date' && (
                              <input type="date" className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-xs h-9 text-slate-400" disabled />
                            )}
                            
                            {f.type === 'select' && (
                              <select className="select select-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-xs h-9" disabled>
                                <option value="">{f.placeholder || 'Select an option'}</option>
                                {f.options?.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            
                            {f.type === 'radio' && (
                              <div className="space-y-2 mt-2">
                                {f.options?.map((opt, i) => (
                                  <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="radio" name={`radio_preview_${index}`} className="radio radio-primary radio-xs" disabled />
                                    <span className="text-xs font-semibold text-slate-600">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {f.type === 'checkbox' && (
                              <div className="space-y-2 mt-2">
                                {f.options?.map((opt, i) => (
                                  <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="checkbox" className="checkbox checkbox-primary checkbox-xs rounded" disabled />
                                    <span className="text-xs font-semibold text-slate-600">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons for this field */}
                          <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-1 bg-white p-1 rounded-xl shadow-lg border border-slate-100">
                              <div className="flex gap-1">
                                <button onClick={() => handleMoveField(index, 'up')} disabled={index === 0} className="btn btn-xs btn-square btn-ghost text-slate-400 hover:text-slate-700 rounded-lg">
                                  ↑
                                </button>
                                <button onClick={() => handleMoveField(index, 'down')} disabled={index === schemaFields.length - 1} className="btn btn-xs btn-square btn-ghost text-slate-400 hover:text-slate-700 rounded-lg">
                                  ↓
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleEditField(index)} className="btn btn-xs btn-square btn-ghost text-blue-600 hover:bg-blue-50 rounded-lg">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleRemoveField(index)} className="btn btn-xs btn-square btn-ghost text-rose-600 hover:bg-rose-50 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <Sliders className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-600" />
              <h3 className="text-base font-bold text-slate-700">Select Target Unit</h3>
              <p className="text-xs mt-1">Select a unit on the left to build a custom application form.</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Lightbox Confirmation Modal for Deleting Unit */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-rose-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Confirm Unit Deletion</h3>
                  <p className="text-xs text-rose-100 font-medium">Security Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                className="btn btn-sm btn-ghost btn-circle text-rose-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-5">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>This action CANNOT be undone!</span>
                </div>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">
                  Are you sure you want to delete the unit <strong className="font-extrabold text-slate-900">"{unitToDelete.name}"</strong>?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnitToDelete(null)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUnit}
                  disabled={deletingUnit}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 h-11 border-none shadow-md shadow-rose-500/25 transition-all gap-2"
                >
                  {deletingUnit ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>OK (Delete Unit)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Lightbox Alert / Notice Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 !mt-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
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

            {/* Modal Content */}
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

              {/* Action Button */}
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
