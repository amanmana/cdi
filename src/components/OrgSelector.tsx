import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  Building,
  RotateCcw
} from 'lucide-react';
import {
  ORG_HIERARCHY,
  ORG_COMPANIES,
  getSectorsForCompany,
  getDivisionsForSector,
  getDepartmentsForDivision,
  OrgNode
} from '../data/organizationHierarchy';

export interface OrgSelection {
  company: string;
  sector: string;
  division: string;
  department: string;
}

interface OrgSelectorProps {
  value: OrgSelection;
  onChange: (val: OrgSelection) => void;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  helperText?: string;
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  compact = false,
  title = 'Organization & Department',
  helperText = 'Select your company, sector, division, and department/unit'
}) => {
  // Mode: 'search' (Fast Predictive Search) vs 'manual' (Step-by-step Cascading Dropdowns)
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = Boolean(value.company && value.department);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results with intelligent relevance scoring
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Return top 8 prominent departments initially as suggestions
      return ORG_HIERARCHY.slice(0, 8);
    }

    const terms = q.split(/\s+/).filter(Boolean);

    return ORG_HIERARCHY.filter((item) => {
      return terms.every((term) => item.searchKey.includes(term));
    }).slice(0, 15);
  }, [searchQuery]);

  // Handle select from search
  const handleSelectNode = (node: OrgNode) => {
    onChange({
      company: node.company,
      sector: node.sector,
      division: node.division,
      department: node.department
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[highlightIndex]) {
        handleSelectNode(searchResults[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Cascading lists for Manual Mode
  const availableSectors = useMemo(() => {
    if (!value.company) return [];
    return getSectorsForCompany(value.company);
  }, [value.company]);

  const hasOnlyNaSector = availableSectors.length === 1 && availableSectors[0] === 'n/a';

  const availableDivisions = useMemo(() => {
    if (!value.company) return [];
    const sec = hasOnlyNaSector ? 'n/a' : value.sector;
    return getDivisionsForSector(value.company, sec);
  }, [value.company, value.sector, hasOnlyNaSector]);

  const availableDepartments = useMemo(() => {
    if (!value.company || !value.division) return [];
    const sec = hasOnlyNaSector ? 'n/a' : value.sector;
    return getDepartmentsForDivision(value.company, sec, value.division);
  }, [value.company, value.sector, value.division, hasOnlyNaSector]);

  // Handle manual changes with cascade reset
  const handleCompanyChange = (newCompany: string) => {
    const sectors = getSectorsForCompany(newCompany);
    const isNa = sectors.length === 1 && sectors[0] === 'n/a';
    const newSector = isNa ? 'n/a' : '';
    const divisions = getDivisionsForSector(newCompany, newSector);
    const newDivision = divisions.length === 1 ? divisions[0] : '';
    const depts = newDivision ? getDepartmentsForDivision(newCompany, newSector, newDivision) : [];
    const newDept = depts.length === 1 ? depts[0] : '';

    onChange({
      company: newCompany,
      sector: newSector,
      division: newDivision,
      department: newDept
    });
  };

  const handleSectorChange = (newSector: string) => {
    const divisions = getDivisionsForSector(value.company, newSector);
    const newDivision = divisions.length === 1 ? divisions[0] : '';
    const depts = newDivision ? getDepartmentsForDivision(value.company, newSector, newDivision) : [];
    const newDept = depts.length === 1 ? depts[0] : '';

    onChange({
      ...value,
      sector: newSector,
      division: newDivision,
      department: newDept
    });
  };

  const handleDivisionChange = (newDivision: string) => {
    const depts = getDepartmentsForDivision(value.company, value.sector, newDivision);
    const newDept = depts.length === 1 ? depts[0] : '';

    onChange({
      ...value,
      division: newDivision,
      department: newDept
    });
  };

  const handleDepartmentChange = (newDept: string) => {
    onChange({
      ...value,
      department: newDept
    });
  };

  const handleReset = () => {
    onChange({
      company: '',
      sector: '',
      division: '',
      department: ''
    });
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{title}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-400 font-medium">{helperText}</p>
          )}
        </div>

        {/* Toggle Mode Button */}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'search' ? 'manual' : 'search');
            setIsOpen(false);
          }}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-all shadow-2xs"
          title={mode === 'search' ? 'Switch to 4-tier cascading dropdowns' : 'Switch to instant predictive search'}
        >
          {mode === 'search' ? (
            <>
              <SlidersHorizontal className="w-3 h-3" />
              <span>Step-by-Step (Manual)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span>Fast Predictive Search</span>
            </>
          )}
        </button>
      </div>

      {/* VIEW A: DISPLAY SELECTED CARD (WHEN AN ENTRY IS SELECTED AND NOT IN ACTIVE SEARCH EDITING) */}
      {isSelected && !isOpen && (
        <div className="bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-4 shadow-xs space-y-2.5 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider px-2 border-none">
                  {value.company}
                </span>
                {value.sector && value.sector !== 'n/a' && (
                  <span className="badge badge-sm bg-indigo-100 text-indigo-800 font-bold text-[9px] uppercase tracking-wider border-indigo-200">
                    {value.sector}
                  </span>
                )}
              </div>

              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                <span className="text-blue-700">{value.department}</span>
              </div>

              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 flex-wrap">
                <span className="text-slate-400">Division:</span>
                <span className="font-semibold text-slate-700">{value.division}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                disabled={disabled}
                className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] gap-1 shadow-2xs"
              >
                <Search className="w-3 h-3 text-slate-500" />
                Change
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={disabled}
                className="btn btn-xs btn-ghost text-slate-400 hover:text-rose-600 rounded-lg p-1"
                title="Reset selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: MODE 1 — SMART PREDICTIVE SEARCH (DEFAULT) */}
      {mode === 'search' && (!isSelected || isOpen) && (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
                setHighlightIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Search by Department, Division, or Keyword (e.g. Finance, 3D, Corporate)..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Predictive Results Dropdown Popup */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/80 rounded-xl mb-1">
                <span>{searchQuery ? `Matching Departments (${searchResults.length})` : 'Popular / Suggested Departments'}</span>
                <span>Press Enter to select</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-6 text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">No departments found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Try searching for another keyword or switch to Step-by-Step selection.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('manual');
                      setIsOpen(false);
                    }}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Switch to Step-by-Step Cascading Dropdowns <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const isHighlighted = idx === highlightIndex;
                  return (
                    <button
                      key={`${item.company}-${item.division}-${item.department}-${idx}`}
                      type="button"
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => handleSelectNode(item)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2.5 group ${
                        isHighlighted ? 'bg-blue-50/80 text-blue-950' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-extrabold text-xs flex items-center gap-1.5">
                          <Layers className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="truncate">{item.department}</span>
                        </div>

                        {/* Breadcrumbs Path */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium flex-wrap">
                          <span className="font-bold text-slate-700">{item.company}</span>
                          {item.sector && item.sector !== 'n/a' && (
                            <>
                              <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                              <span className="text-indigo-600 font-semibold">{item.sector}</span>
                            </>
                          )}
                          <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                          <span className="text-slate-600">{item.division}</span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <span className={`badge badge-sm font-bold text-[9px] uppercase tracking-wider ${
                          isHighlighted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW C: MODE 2 — STEP-BY-STEP CASCADING DROPDOWNS (OPTION 2) */}
      {mode === 'manual' && (!isSelected || isOpen) && (
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Company Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                1. Company *
              </label>
              <select
                value={value.company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={disabled}
                className="select select-bordered select-sm w-full bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-600"
              >
                <option value="">-- Select Company --</option>
                {ORG_COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Sector Dropdown (Smart Skip if n/a) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                2. Sector {hasOnlyNaSector ? '(Not Applicable)' : '*'}
              </label>
              {hasOnlyNaSector ? (
                <div className="h-8 px-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center text-xs font-semibold text-slate-400 italic">
                  Not Applicable (Direct Subsidiary)
                </div>
              ) : (
                <select
                  value={value.sector}
                  onChange={(e) => handleSectorChange(e.target.value)}
                  disabled={disabled || !value.company}
                  className="select select-bordered select-sm w-full bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-600"
                >
                  <option value="">-- Select Sector --</option>
                  {availableSectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Division Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                3. Division *
              </label>
              <select
                value={value.division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                disabled={disabled || !value.company || (!hasOnlyNaSector && !value.sector)}
                className="select select-bordered select-sm w-full bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-600"
              >
                <option value="">-- Select Division --</option>
                {availableDivisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Department / Unit Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                4. Department / Unit *
              </label>
              <select
                value={value.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={disabled || !value.division}
                className="select select-bordered select-sm w-full bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-600"
              >
                <option value="">-- Select Department / Unit --</option>
                {availableDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSelected && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Complete Organization Hierarchy Selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg px-3 border-none"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
