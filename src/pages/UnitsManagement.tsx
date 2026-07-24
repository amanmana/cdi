import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, Plus, Trash2, Sliders, Edit2, Check, X } from 'lucide-react';

interface SchemaField {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export const UnitsManagement: React.FC = () => {
  const { token } = useAuth();
  const [units, setUnits] = useState<any[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);

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
      });
  };

  useEffect(() => {
    fetchUnits();
  }, [token]);

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
    setSelectedUnit(null);
    fetchUnits();
  };

  const handleDeleteUnit = async (u: any) => {
    if (!window.confirm(`Adakah anda pasti ingin memadam unit "${u.name}"?`)) return;
    const res = await fetch(`/api/admin/units/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (selectedUnit?.id === u.id) setSelectedUnit(null);
      fetchUnits();
    } else {
      alert(data.error || 'Gagal memadam unit.');
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
            Units Management & Form Builder
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Manage service units and build custom unit form schemas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Units List & Add Unit */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
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
                      <button onClick={() => handleDeleteUnit(u)} className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl" title="Delete unit">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form Builder Panel */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          {selectedUnit ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dynamic Form Builder: {selectedUnit.name}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Add custom fields required when clients submit a request.</p>
                </div>
                <button onClick={handleSaveSchema} className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5 h-10 border-none shadow-md shadow-blue-500/20">
                  Save Form Schema
                </button>
              </div>

              {/* Field Generator Inputs */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
                <div className="md:col-span-3">
                  <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">Field Label</label>
                  <input
                    type="text"
                    placeholder="e.g. PC Asset Tag"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">Input Type</label>
                  <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="select select-bordered select-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10">
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
                  <div className="md:col-span-4">
                    <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">Options (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-4">
                    <label className="label text-[11px] font-bold text-slate-700 uppercase tracking-wider py-1">Placeholder (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Enter the serial number..."
                      value={fieldPlaceholder}
                      onChange={(e) => setFieldPlaceholder(e.target.value)}
                      className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full text-xs h-10"
                    />
                  </div>
                )}

                <div className="md:col-span-2 flex flex-col justify-end gap-2 pb-0">
                  <label className="label cursor-pointer justify-start gap-2 py-0 mb-1">
                    <input
                      type="checkbox"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                      className="checkbox checkbox-primary checkbox-xs rounded"
                    />
                    <span className="label-text text-xs text-slate-600 font-bold">Required</span>
                  </label>
                  <button type="button" onClick={handleAddField} className={`btn btn-sm text-white font-bold rounded-xl w-full h-9 ${editingFieldIndex !== null ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : 'bg-blue-600 hover:bg-blue-700 border-blue-600'}`}>
                    {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </div>

              {/* Schema Preview */}
              <h3 className="font-bold text-sm text-slate-900 mb-3">Live Form Preview ({schemaFields.length} fields)</h3>
              <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                {schemaFields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No dynamic fields added yet. Add a field above to see the preview.</p>
                ) : (
                  schemaFields.map((f, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group flex gap-4 transition-all hover:border-blue-300 hover:shadow-md">
                      <div className="flex-1 pr-10">
                        <label className="label text-sm font-bold text-slate-800 py-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        
                        {f.type === 'text' && (
                          <input type="text" placeholder={f.placeholder} className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-sm" disabled />
                        )}
                        
                        {f.type === 'textarea' && (
                          <textarea placeholder={f.placeholder} className="textarea textarea-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-sm h-24" disabled></textarea>
                        )}
                        
                        {f.type === 'number' && (
                          <input type="number" placeholder={f.placeholder} className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-sm" disabled />
                        )}
                        
                        {f.type === 'date' && (
                          <input type="date" className="input input-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-sm text-slate-400" disabled />
                        )}
                        
                        {f.type === 'select' && (
                          <select className="select select-bordered bg-slate-50 border-slate-200 rounded-xl w-full text-sm" disabled>
                            <option value="">{f.placeholder || 'Select an option'}</option>
                            {f.options?.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        
                        {f.type === 'radio' && (
                          <div className="space-y-3 mt-3">
                            {f.options?.map((opt, i) => (
                              <label key={i} className="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name={`radio_preview_${index}`} className="radio radio-primary radio-sm" disabled />
                                <span className="text-sm font-medium text-slate-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {f.type === 'checkbox' && (
                          <div className="space-y-3 mt-3">
                            {f.options?.map((opt, i) => (
                              <label key={i} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm rounded" disabled />
                                <span className="text-sm font-medium text-slate-700">{opt}</span>
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
    </div>
  );
};
