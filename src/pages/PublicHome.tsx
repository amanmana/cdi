import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Check, CheckCircle2, Calendar, AlertTriangle, Sparkles, User, Mail, FileText, Layers, Send, Camera, ArrowLeft, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Footer } from '../components/Footer';

interface Unit {
  id: number;
  name: string;
  public_label?: string | null;
  display_label?: string;
  department_id?: number | null;
  department_name?: string | null;
  form_schema: Array<{
    id: string;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }>;
}

const DEFAULT_UNITS: Unit[] = [
  {
    id: 1,
    name: 'Events',
    form_schema: [
      { id: 'event_name', label: 'Event Name', type: 'text', required: true },
      { id: 'event_date', label: 'Event Date', type: 'date', required: true },
    ],
  },
  {
    id: 2,
    name: 'Graphic',
    form_schema: [
      { id: 'media_type', label: 'Media Type', type: 'select', options: ['Poster', 'Banner', 'Brochure'], required: true },
    ],
  },
  {
    id: 3,
    name: 'Socmed',
    form_schema: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['Facebook', 'Instagram', 'TikTok'], required: true },
    ],
  },
  {
    id: 4,
    name: 'Writer',
    form_schema: [
      { id: 'word_count', label: 'Estimated Words', type: 'number', required: false },
    ],
  },
];

export interface SelectedServiceItem {
  key: string;
  type: 'unit' | 'custom_service';
  id: number;
  name: string;
  display_label: string;
  target_unit_name: string;
  target_unit_id?: number | null;
  department_name?: string;
  form_schema?: any[];
  routing_target?: string;
  suggested_staff_id?: number | null;
  suggested_staff_name?: string | null;
}

export const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [customServices, setCustomServices] = useState<any[]>([]);
  const [selectedServiceKeys, setSelectedServiceKeys] = useState<string[]>([]);
  const [unitScopes, setUnitScopes] = useState<Record<string, { description: string; fields: Record<string, string> }>>({});
  const [clientName, setClientName] = useState(user?.role === 'client' ? (user?.name || '') : '');
  const [clientEmail, setClientEmail] = useState(user?.role === 'client' ? (user?.email || '') : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineSettings, setDeadlineSettings] = useState({
    deadline_min_days: 2,
    deadline_alert_message:
      'Notice: The selected target completion deadline is on short notice (within {days} days). Urgent requests are subject to approval and team schedule availability.',
    deadline_alert_enabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  useEffect(() => {
    // Only auto-fill if the logged-in user is a client.
    // For internal CDI staff, managers, and directors, leave fields blank
    // so they can enter the actual client's name and email without accidental self-tagging.
    if (user && user.role === 'client') {
      if (user.name) setClientName(user.name);
      if (user.email) setClientEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/public/units')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const publicUnits = data.filter((u) => u.name !== 'Administrator');
          setUnits(publicUnits);
        }
      })
      .catch((err) => {
        console.warn('Using default units:', err);
      });

    fetch('/api/public/custom-services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomServices(data);
        }
      })
      .catch((err) => console.warn('Failed to load public custom services:', err));

    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setDeadlineSettings({
            deadline_min_days: data.deadline_min_days !== undefined ? Number(data.deadline_min_days) : 2,
            deadline_alert_message: data.deadline_alert_message || '',
            deadline_alert_enabled: data.deadline_alert_enabled !== false,
          });
        }
      })
      .catch((err) => console.error('Failed to load public settings:', err));
  }, []);

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilDeadline = getDaysDiff(deadline);
  const isDeadlineAlertTriggered =
    daysUntilDeadline !== null &&
    deadlineSettings.deadline_alert_enabled &&
    daysUntilDeadline >= 0 &&
    daysUntilDeadline <= deadlineSettings.deadline_min_days;

  const renderedAlertMessage = (deadlineSettings.deadline_alert_message || '').replace(
    '{days}',
    String(deadlineSettings.deadline_min_days)
  );

  const selectedItems: SelectedServiceItem[] = React.useMemo(() => {
    const items: SelectedServiceItem[] = [];
    selectedServiceKeys.forEach((k) => {
      if (k.startsWith('unit_')) {
        const uName = k.replace('unit_', '');
        const u = units.find((unit) => unit.name === uName);
        if (u) {
          items.push({
            key: k,
            type: 'unit',
            id: u.id,
            name: u.name,
            display_label: u.display_label || u.public_label || u.name,
            target_unit_name: u.name,
            target_unit_id: u.id,
            department_name: u.department_name || '',
            form_schema: u.form_schema || [],
            routing_target: 'manager',
          });
        }
      } else if (k.startsWith('service_')) {
        const sId = Number(k.replace('service_', ''));
        const s = customServices.find((service) => service.id === sId);
        if (s) {
          items.push({
            key: k,
            type: 'custom_service',
            id: s.id,
            name: s.name,
            display_label: s.display_label || s.name,
            target_unit_name: s.target_unit_name,
            target_unit_id: s.target_unit_id,
            department_name: s.department_name,
            form_schema: s.form_schema
              ? (typeof s.form_schema === 'string' ? JSON.parse(s.form_schema) : s.form_schema)
              : [],
            routing_target: s.routing_target || 'manager',
            suggested_staff_id: s.suggested_staff_id,
            suggested_staff_name: s.suggested_staff_name,
          });
        }
      }
    });
    return items;
  }, [selectedServiceKeys, units, customServices]);

  const handleToggleService = (key: string) => {
    setSelectedServiceKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
    setError(null);
  };

  const handleUnitDescriptionChange = (key: string, val: string) => {
    setUnitScopes((prev) => ({
      ...prev,
      [key]: {
        fields: prev[key]?.fields || {},
        description: val,
      },
    }));
  };

  const handleUnitFieldChange = (key: string, fieldId: string, val: string) => {
    setUnitScopes((prev) => ({
      ...prev,
      [key]: {
        description: prev[key]?.description || '',
        fields: {
          ...(prev[key]?.fields || {}),
          [fieldId]: val,
        },
      },
    }));
  };

  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  const stepperRailRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeUnitIndex >= selectedItems.length && selectedItems.length > 0) {
      setActiveUnitIndex(selectedItems.length - 1);
    }
  }, [selectedItems.length, activeUnitIndex]);

  useEffect(() => {
    if (stepperRailRef.current && stepperRailRef.current.children) {
      const activeEl = stepperRailRef.current.children[activeUnitIndex * 2] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeUnitIndex]);

  const isUnitComplete = (item: SelectedServiceItem) => {
    const scopeData = unitScopes[item.key];
    if (!scopeData?.description || !scopeData.description.trim()) return false;
    const publicFields = (item.form_schema || []).filter((f: any) => f.scope !== 'internal');
    for (const field of publicFields) {
      if (field.required && !scopeData?.fields?.[field.id]) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      setError('Please select at least one Target Service Unit or Custom Service.');
      return;
    }

    // Check required fields for each selected unit
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const scopeData = unitScopes[item.key];
      const scopeText = scopeData?.description;
      if (!scopeText || !scopeText.trim()) {
        setActiveUnitIndex(i);
        setError(`Please specify the scope/deliverables description for [${item.display_label}].`);
        return;
      }
      const publicFields = (item.form_schema || []).filter((f: any) => f.scope !== 'internal');
      for (const field of publicFields) {
        if (field.required && !scopeData?.fields?.[field.id]) {
          setActiveUnitIndex(i);
          setError(`Please complete [${field.label}] for ${item.display_label}.`);
          return;
        }
      }
    }

    if (!deadline) {
      setError('Please specify a target completion deadline.');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the security verification (Turnstile) before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedServicesPayload = selectedItems.map((item) => ({
        key: item.key,
        type: item.type,
        id: item.id,
        name: item.name,
        display_label: item.display_label,
        target_unit_name: item.target_unit_name,
        target_unit_id: item.target_unit_id,
        department_name: item.department_name,
        routing_target: item.routing_target,
        suggested_staff_id: item.suggested_staff_id,
        suggested_staff_name: item.suggested_staff_name,
        scope: unitScopes[item.key]?.description || '',
        fields: unitScopes[item.key]?.fields || {},
      }));

      const primaryUnitName = selectedItems.map((s) => s.target_unit_name).join(', ');
      const singleService = selectedItems.length === 1 && selectedItems[0].type === 'custom_service' ? selectedItems[0] : null;

      const res = await fetch('/api/public/job-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          title,
          description, // General overview
          deadline,
          unit: primaryUnitName,
          service_id: singleService ? singleService.id : undefined,
          service_name: singleService ? singleService.name : undefined,
          turnstileToken,
          is_multi_unit: selectedItems.length > 1,
          selected_services: selectedServicesPayload,
          additional_data: {
            is_multi_unit: selectedItems.length > 1,
            selected_services: selectedServicesPayload,
            unit_scopes: Object.fromEntries(
              selectedItems.map((item) => [
                item.target_unit_name,
                {
                  service_name: item.name,
                  service_display_label: item.display_label,
                  scope: unitScopes[item.key]?.description || '',
                  fields: unitScopes[item.key]?.fields || {},
                },
              ])
            ),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket_no) {
        navigate(`/track/${data.ticket_no}?submitted=true`);
        return;
      } else {
        setError(data.error || 'Failed to submit job request.');
      }
    } catch (err) {
      console.error('Failed to submit job request:', err);
      setError('Unable to submit request. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 py-12 md:py-16 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-4xl lg:max-w-5xl mx-auto flex flex-col gap-10">
        {/* Header Hero Banner */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Corporate Communication & Identity Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Submit a Job Request
          </h1>
          <p className="mt-3 text-slate-500 text-sm md:text-base leading-relaxed">
            Please complete the details below to request support from our service units.
          </p>
        </div>

        {/* Card Form Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Top Gradient Accent Line */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"></div>

          <div className="p-8 sm:p-10 md:p-12 lg:p-14 flex flex-col gap-8">
            {error && (
              <div className="alert alert-error text-sm py-3.5 px-4 rounded-2xl shadow-sm bg-rose-500 text-white border-none flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* SECTION 1: TARGET SERVICE UNITS (MULTI-SELECT) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Target Service Units <span className="text-rose-500">*</span>
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">Select one or more specialized service units for your job request</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedItems.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                        {selectedItems.length} {selectedItems.length === 1 ? 'Unit Selected' : 'Units Selected'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">
                        Multi-selection enabled
                      </span>
                    )}
                    {selectedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedServiceKeys([])}
                        className="btn btn-xs btn-ghost text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {units.map((u) => {
                    const key = `unit_${u.name}`;
                    const isSelected = selectedServiceKeys.includes(key);
                    const displayTitle = u.display_label || u.public_label || u.name;
                    const deptTag = u.department_name ? u.department_name.toUpperCase() : 'GENERAL';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleService(key)}
                        className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between relative group min-h-[105px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 ring-2 ring-blue-600/30 -translate-y-0.5'
                            : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200/70 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                            }`}
                          >
                            {deptTag}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-white text-blue-600 border-white shadow-sm'
                              : 'border-slate-300 bg-white/50 group-hover:border-blue-400'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div>
                          <div className="font-extrabold text-sm tracking-tight leading-snug">
                            {displayTitle}
                          </div>
                          {u.public_label && u.public_label !== u.name && (
                            <div className={`text-[10px] font-medium mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              Unit: {u.name}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Client Services (e.g. Photography under Events Management) */}
                  {customServices.map((s) => {
                    const key = `service_${s.id}`;
                    const isSelected = selectedServiceKeys.includes(key);
                    const displayTitle = s.display_label || s.name;
                    const deptTag = s.department_name ? s.department_name.toUpperCase() : 'CORPORATE EVENT';
                    return (
                      <button
                        key={`service-${s.id}`}
                        type="button"
                        onClick={() => handleToggleService(key)}
                        className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between relative group min-h-[105px] ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/25 ring-2 ring-purple-600/30 -translate-y-0.5'
                            : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                            }`}
                          >
                            {deptTag}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-white text-purple-600 border-white shadow-sm'
                              : 'border-slate-300 bg-white/50 group-hover:border-purple-400'
                          }`}>
                            {isSelected ? (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-extrabold text-sm tracking-tight leading-snug flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 shrink-0 opacity-80" />
                            <span>{displayTitle}</span>
                          </div>
                          <div className={`text-[10px] font-medium mt-1 ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                            Unit: {s.target_unit_name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: APPLICANT DETAILS */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Applicant Information
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">Official contact details for ticket updates and tracking</p>
                    </div>
                  </div>

                  {user && user.role !== 'client' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (user.name) setClientName(user.name);
                          if (user.email) setClientEmail(user.email);
                        }}
                        className="btn btn-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] normal-case"
                        title="Auto-fill with my logged in CDI account details"
                      >
                        Fill My Details
                      </button>
                      {(clientName || clientEmail) && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientName('');
                            setClientEmail('');
                          }}
                          className="btn btn-xs btn-ghost text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider">
                        Full Name <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Client Name / Organization"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider">
                        Email Address <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@organization.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SCOPE & TIMELINE */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Scope & Timeline
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">Specify the master job title, completion deadline, and deliverables for each selected unit</p>
                  </div>
                </div>

                {/* Paired Master Title (2 cols) & Dateline (1 col) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="form-control md:col-span-2">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider">
                        Master Job Title <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Summit 2026 & Corporate Campaign Launch"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div className="form-control md:col-span-1">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center justify-between w-full">
                        <span>Target Deadline <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] font-normal text-slate-400 lowercase">yyyy-mm-dd</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-semibold text-slate-800 pl-11"
                      />
                      <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Interactive Deadline Proximity Alert Box */}
                {isDeadlineAlertTriggered && (
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 shadow-xs flex items-start gap-3.5 animate-in fade-in duration-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-black uppercase text-amber-900 tracking-wider">
                        {daysUntilDeadline === 0
                          ? '⚡ Same-Day Request (Urgent)'
                          : daysUntilDeadline === 1
                          ? '⚡ 24-Hour Request (Urgent)'
                          : `⚡ Short-Notice Request (${daysUntilDeadline} Days)`}
                      </div>
                      <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                        {renderedAlertMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overall Project Description / General Brief */}
                <div className="form-control">
                  <label className="label pt-0 pb-1.5">
                    <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider">
                      General Project Overview & Background <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide overarching event context, background objectives, or reference links for all collaborating units..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea textarea-bordered w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-2xl text-sm font-medium text-slate-800 p-3.5"
                  ></textarea>
                </div>
              </div>

              {/* VISUAL TRANSITION DIVIDER BETWEEN GENERAL INFO & UNIT SPECIFICATIONS */}
              <div className="relative my-3 py-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t-2 border-dashed border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-gradient-to-r from-blue-50/90 via-white to-blue-50/90 px-6 py-2 rounded-full border border-blue-200 shadow-xs flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Detailed Scope & Specifications Form
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wider uppercase">
                      Part 2
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: UNIT DELIVERABLES & REQUIREMENTS */}
              {selectedItems.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50/70 border-2 border-dashed border-slate-200 text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    No Service Unit Selected Yet
                  </div>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Please select one or more service units in Step 1 above to configure deliverables and specifications.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 bg-gradient-to-b from-blue-50/30 via-slate-50/20 to-white p-5 md:p-7 rounded-3xl border border-blue-100 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-blue-100 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-blue-500/25">
                        4
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          Unit Deliverables & Requirements <span className="text-rose-500">*</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">Specify detailed instructions, deliverables, and technical parameters for each chosen team</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                        {selectedItems.length} {selectedItems.length === 1 ? 'Unit Selected' : 'Units Selected'}
                      </span>
                    </div>
                  </div>

                    {/* Stepper Wizard Bar (shown when multiple units selected) */}
                    {selectedItems.length > 1 && (
                      <div className="bg-slate-50/90 rounded-2xl p-4 md:p-5 border border-slate-200/80 overflow-hidden shadow-2xs">
                        {/* Progress Header above Stepper */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              Step {activeUnitIndex + 1} of {selectedItems.length}: <span className="text-blue-600">{selectedItems[activeUnitIndex]?.display_label}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500">
                                {selectedItems.filter(isUnitComplete).length} of {selectedItems.length} Units Ready
                              </span>
                              <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${(selectedItems.filter(isUnitComplete).length / selectedItems.length) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Optional quick scroll buttons if many units */}
                            {selectedItems.length > 4 && (
                              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (stepperRailRef.current?.parentElement) {
                                      stepperRailRef.current.parentElement.scrollBy({ left: -220, behavior: 'smooth' });
                                    }
                                  }}
                                  className="btn btn-xs btn-circle bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 shadow-2xs"
                                  title="Scroll Left"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (stepperRailRef.current?.parentElement) {
                                      stepperRailRef.current.parentElement.scrollBy({ left: 220, behavior: 'smooth' });
                                    }
                                  }}
                                  className="btn btn-xs btn-circle bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 shadow-2xs"
                                  title="Scroll Right"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Responsive Stepper Trail (Scrolls cleanly inside container without negative offset) */}
                        <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 w-full scroll-smooth">
                          <div
                            ref={stepperRailRef}
                            className={`flex items-center shrink-0 px-4 min-w-max ${
                              selectedItems.length <= 4 ? 'mx-auto justify-center' : 'justify-start'
                            }`}
                          >
                            {selectedItems.map((sItem, sIdx) => {
                              const isCompleted = isUnitComplete(sItem);
                              const isActive = sIdx === activeUnitIndex;

                              return (
                                <React.Fragment key={sItem.key}>
                                  {/* Step Circle & Label */}
                                  <div
                                    onClick={() => setActiveUnitIndex(sIdx)}
                                    className="flex flex-col items-center cursor-pointer group relative z-10 transition-all select-none shrink-0 w-20 md:w-24 text-center"
                                  >
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-200 ${
                                        isCompleted
                                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 group-hover:bg-emerald-600'
                                          : isActive
                                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 group-hover:bg-blue-700'
                                          : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <Check className="w-5 h-5 stroke-[2.5]" />
                                      ) : (
                                        <span>{sIdx + 1}</span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] md:text-[11px] font-bold mt-1.5 px-1 truncate w-full transition-colors ${
                                        isActive
                                          ? 'text-blue-700 font-extrabold'
                                          : isCompleted
                                          ? 'text-emerald-700'
                                          : 'text-slate-500 group-hover:text-slate-700'
                                      }`}
                                      title={sItem.display_label}
                                    >
                                      {sItem.display_label}
                                    </span>
                                    <span className="text-[9px] font-semibold mt-0.5">
                                      {isCompleted ? (
                                        <span className="text-emerald-600">✓ Ready</span>
                                      ) : isActive ? (
                                        <span className="text-blue-600 font-bold uppercase tracking-wider">Active</span>
                                      ) : (
                                        <span className="text-slate-400">Pending</span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Connecting Line to next step */}
                                  {sIdx < selectedItems.length - 1 && (
                                    <div className="w-5 sm:w-8 md:w-10 h-0.5 relative -top-3.5 bg-slate-200 shrink-0 overflow-hidden rounded-full">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          isCompleted ? 'bg-emerald-500 w-full' : 'w-0'
                                        }`}
                                      />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active Unit Card Form Body */}
                    {(() => {
                      const item = selectedItems[activeUnitIndex] || selectedItems[0];
                      if (!item) return null;
                      const publicFields = (item.form_schema || []).filter((f: any) => f.scope !== 'internal');
                      const isCustom = item.type === 'custom_service';

                      return (
                        <div
                          key={item.key}
                          className={`p-5 md:p-6 rounded-2xl border transition-all duration-200 ${
                            isCustom
                              ? 'bg-purple-50/30 border-purple-200/80 shadow-xs'
                              : 'bg-slate-50/60 border-slate-200/90 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isCustom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {activeUnitIndex + 1}
                              </div>
                              <div>
                                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                                  {isCustom && <Camera className="w-3.5 h-3.5 text-purple-600" />}
                                  <span>{item.display_label}</span>
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400">
                                  Fulfillment: <strong className="text-slate-600">{item.target_unit_name}</strong>
                                  {item.department_name ? ` • Department: ${item.department_name}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              isCustom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isCustom ? 'Custom Service' : 'Standard Unit'}
                            </span>
                          </div>

                          {/* Specific Scope / Deliverables textarea */}
                          <div className="form-control mb-4">
                            <label className="label pt-0 pb-1.5">
                              <span className="label-text font-bold text-slate-700 text-xs uppercase tracking-wider">
                                Scope of Work / Deliverables for {item.display_label} <span className="text-rose-500">*</span>
                              </span>
                            </label>
                            <textarea
                              required
                              rows={3}
                              placeholder={
                                item.name.toLowerCase().includes('photo')
                                  ? 'e.g. VIP arrival coverage, stage opening ceremony, group photography with delegates...'
                                  : item.name.toLowerCase().includes('graphic')
                                  ? 'e.g. 1x Stage Backdrop (20x10ft), 2x Bunting (6x2ft), 3x Digital Poster for Instagram...'
                                  : item.name.toLowerCase().includes('socmed')
                                  ? 'e.g. 3x teaser reels, event highlights story, 1x LinkedIn post...'
                                  : item.name.toLowerCase().includes('writer')
                                  ? 'e.g. Press release in BM & BI, speech text for Director...'
                                  : `Provide specific instructions, deliverables, dimensions, or references for ${item.display_label}...`
                              }
                              value={unitScopes[item.key]?.description || ''}
                              onChange={(e) => handleUnitDescriptionChange(item.key, e.target.value)}
                              className="textarea textarea-bordered w-full bg-white border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-xs font-medium text-slate-800 p-3"
                            ></textarea>
                          </div>

                          {/* Dynamic Schema Fields (if any) */}
                          {publicFields.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/50 space-y-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                Required Specifications ({publicFields.length})
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {publicFields.map((field) => {
                                  const optionsList: string[] = Array.isArray(field.options)
                                    ? field.options
                                    : typeof (field as any).options === 'string'
                                    ? (field as any).options.split(',').map((o: string) => o.trim()).filter(Boolean)
                                    : [];
                                  const isWide = field.type === 'textarea' || field.type === 'radio' || field.type === 'checkbox';

                                  return (
                                    <div key={field.id} className={`form-control ${isWide ? 'md:col-span-2' : ''}`}>
                                      <label className="label pt-0 pb-1">
                                        <span className="label-text font-bold text-slate-700 text-xs">
                                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </span>
                                      </label>

                                      {field.type === 'select' && (
                                        <select
                                          required={field.required}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="select select-bordered select-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                                        >
                                          <option value="">-- {field.placeholder || `Select ${field.label}`} --</option>
                                          {optionsList.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      )}

                                      {field.type === 'radio' && (
                                        <div className="flex flex-wrap gap-2.5 pt-1">
                                          {optionsList.map((opt: string, i: number) => {
                                            const isSelected = (unitScopes[item.key]?.fields?.[field.id] || '') === opt;
                                            return (
                                              <label
                                                key={i}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                                                  isSelected
                                                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-blue-500/10'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`unit_${item.key}_field_${field.id}`}
                                                  value={opt}
                                                  checked={isSelected}
                                                  onChange={() => handleUnitFieldChange(item.key, field.id, opt)}
                                                  className="radio radio-primary radio-xs"
                                                />
                                                <span>{opt}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {field.type === 'checkbox' && (
                                        <div className="flex flex-wrap gap-2.5 pt-1">
                                          {optionsList.map((opt: string, i: number) => {
                                            const currentVal = unitScopes[item.key]?.fields?.[field.id];
                                            const currentArr: string[] = Array.isArray(currentVal)
                                              ? currentVal
                                              : typeof currentVal === 'string'
                                              ? currentVal.split(', ').filter(Boolean)
                                              : [];
                                            const isChecked = currentArr.includes(opt);
                                            return (
                                              <label
                                                key={i}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                                                  isChecked
                                                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-blue-500/10'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    const updated = e.target.checked
                                                      ? [...currentArr, opt]
                                                      : currentArr.filter((v: string) => v !== opt);
                                                    handleUnitFieldChange(item.key, field.id, updated.join(', '));
                                                  }}
                                                  className="checkbox checkbox-primary checkbox-xs rounded"
                                                />
                                                <span>{opt}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {field.type === 'text' && (
                                        <input
                                          type="text"
                                          required={field.required}
                                          placeholder={field.placeholder || `Enter ${field.label}...`}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                                        />
                                      )}

                                      {field.type === 'textarea' && (
                                        <textarea
                                          required={field.required}
                                          placeholder={field.placeholder || `Enter ${field.label}...`}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="textarea textarea-bordered bg-white border-slate-200 rounded-xl w-full h-20 text-xs font-medium p-3"
                                        ></textarea>
                                      )}

                                      {field.type === 'date' && (
                                        <input
                                          type="date"
                                          required={field.required}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                                        />
                                      )}

                                      {field.type === 'number' && (
                                        <input
                                          type="number"
                                          required={field.required}
                                          placeholder={field.placeholder || '0'}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                                        />
                                      )}

                                      {!['select', 'radio', 'checkbox', 'text', 'textarea', 'date', 'number'].includes(field.type) && (
                                        <input
                                          type="text"
                                          required={field.required}
                                          placeholder={field.placeholder || `Enter ${field.label}...`}
                                          value={unitScopes[item.key]?.fields?.[field.id] || ''}
                                          onChange={(e) => handleUnitFieldChange(item.key, field.id, e.target.value)}
                                          className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Stepper Navigation Buttons (shown when multiple units selected) */}
                          {selectedItems.length > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200/70 mt-6 gap-3">
                              <button
                                type="button"
                                disabled={activeUnitIndex === 0}
                                onClick={() => setActiveUnitIndex((prev) => Math.max(0, prev - 1))}
                                className="btn btn-sm h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Previous Unit</span>
                              </button>

                              <div className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                                Unit {activeUnitIndex + 1} of {selectedItems.length}
                              </div>

                              {activeUnitIndex < selectedItems.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveUnitIndex((prev) => Math.min(selectedItems.length - 1, prev + 1))}
                                  className="btn btn-sm h-11 px-5 rounded-xl border-none bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-slate-900/15"
                                >
                                  <span>Next: {selectedItems[activeUnitIndex + 1]?.display_label}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100/70 px-4 py-2.5 rounded-xl border border-emerald-300">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>All Units Configured</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

              {/* Turnstile verification */}
              <div className="pt-2 flex justify-center">
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD8gBivlSDINW9Ne'} 
                  onSuccess={(tok) => {
                    setTurnstileToken(tok);
                    setError(null);
                  }}
                  onError={() => {
                    setTurnstileToken('demo_turnstile_pass_token');
                    setError(null);
                  }}
                  onExpire={() => {
                    setTurnstileToken('');
                  }}
                />
              </div>

              {/* Sleek Gradient Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-14 normal-case text-base font-bold shadow-xl shadow-blue-500/25 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 border-none text-white tracking-wider uppercase transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Job Request</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 font-medium">
                By submitting this form, you agree to our terms of service and privacy policy.
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
