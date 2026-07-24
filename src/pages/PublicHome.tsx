import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

interface Unit {
  id: number;
  name: string;
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

export const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState<string>('Graphic');
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
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
          if (publicUnits.length > 0) {
            setSelectedUnit(publicUnits[0].name);
          }
        }
      })
      .catch((err) => {
        console.warn('Using default units:', err);
      });
  }, []);

  const currentUnitObj = units.find((u) => u.name === selectedUnit);

  const handleDynamicChange = (fieldId: string, val: string) => {
    setDynamicFields((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/public/job-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          title,
          description,
          unit: selectedUnit,
          additional_data: dynamicFields,
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 antialiased">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Hero Banner */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Submit a Job Request
          </h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">
            Fill in the details below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Card Form Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Top 8px Blue Accent Line */}
          <div className="h-2 bg-blue-600"></div>

          <div className="p-8 md:p-10 space-y-6">
            {error && (
              <div className="alert alert-error text-sm py-3 rounded-xl shadow-sm bg-rose-500 text-white border-none flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 2-Column Inputs: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label pt-0 pb-1.5">
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">
                      Your Full Name <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="client1"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1.5">
                    <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">
                      Email Address <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cdiclient@mimos.my"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Target Unit Pills Selection */}
              <div className="form-control">
                <label className="label pt-0 pb-2">
                  <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Select Target Unit <span className="text-rose-500">*</span>
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {units.map((u) => {
                    const isSelected = selectedUnit === u.name;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUnit(u.name)}
                        className={`h-12 rounded-xl text-sm font-bold transition-all duration-200 border flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {u.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Unit Schema Fields */}
              {currentUnitObj && currentUnitObj.form_schema && currentUnitObj.form_schema.length > 0 && (
                <div className="space-y-5 mt-8 mb-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                      {selectedUnit} Unit Requirements
                    </span>
                  </div>

                  <div className="space-y-5">
                    {currentUnitObj.form_schema.map((field) => (
                      <div key={field.id} className="form-control">
                        <label className="label pt-0 pb-1">
                          <span className="label-text font-bold text-slate-700 text-xs">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </span>
                        </label>

                        {field.type === 'select' && (
                          <select
                            required={field.required}
                            value={dynamicFields[field.id] || ''}
                            onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                            className="select select-bordered select-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                          >
                            <option value="">-- {field.placeholder || `Select ${field.label}`} --</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            required={field.required}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            value={dynamicFields[field.id] || ''}
                            onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                            className="textarea textarea-bordered bg-white border-slate-200 rounded-xl w-full h-24 text-xs font-medium"
                          ></textarea>
                        )}
                        
                        {field.type === 'radio' && (
                          <div className="space-y-2 mt-1">
                            {field.options?.map((opt) => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`dynamic_${field.id}`}
                                  value={opt}
                                  checked={dynamicFields[field.id] === opt}
                                  onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                  required={field.required}
                                  className="radio radio-primary radio-sm" 
                                />
                                <span className="text-sm text-slate-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <div className="space-y-2 mt-1">
                            {field.options?.map((opt) => {
                              // For checkbox, value is comma separated string
                              const currentValues = dynamicFields[field.id] ? dynamicFields[field.id].split(', ') : [];
                              const isChecked = currentValues.includes(opt);
                              
                              return (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    value={opt}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let newValues = [...currentValues];
                                      if (e.target.checked) {
                                        newValues.push(opt);
                                      } else {
                                        newValues = newValues.filter(v => v !== opt);
                                      }
                                      handleDynamicChange(field.id, newValues.join(', '));
                                    }}
                                    className="checkbox checkbox-primary checkbox-sm rounded" 
                                  />
                                  <span className="text-sm text-slate-700">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {['text', 'number', 'date'].includes(field.type) && (
                          <input
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            value={dynamicFields[field.id] || ''}
                            onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                            className="input input-bordered input-sm bg-white border-slate-200 rounded-xl w-full h-11 text-xs font-medium"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Title Field */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Title <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-xl text-sm font-medium text-slate-800"
                />
              </div>

              {/* Description Field */}
              <div className="form-control">
                <label className="label pt-0 pb-1.5">
                  <span className="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Description
                  </span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter additional description or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 transition-all rounded-2xl text-sm font-medium text-slate-800 p-4"
                ></textarea>
              </div>

              {/* Glowing Blue Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-14 normal-case text-base font-bold shadow-lg shadow-blue-500/30 rounded-xl bg-blue-600 hover:bg-blue-700 border-blue-600 text-white tracking-wider uppercase mt-4"
              >
                {loading ? <span className="loading loading-spinner"></span> : 'Submit Request'}
              </button>

              <p className="text-center text-xs text-slate-400 font-medium pt-2">
                By submitting, you agree to our privacy policy and terms.
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 font-medium space-y-1">
          <div className="font-bold text-slate-600">CCI</div>
          <div>Copyright © 2026 - All right reserved</div>
        </div>
      </div>
    </div>
  );
};
