import React, { useState } from 'react';
import {
  Sliders,
  RefreshCw,
  Save,
  Play,
  AlertCircle,
  Search,
  Plus,
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export default function AgentSettingsTab({
  metaOptions,
  prefForm,
  setPrefForm,
  handleSavePreferences,
  handleSaveAndTriggerAgent,
  savingProfile,
  isRunning,
  activeRun,
  agentLogs,
  fetchRunsAndLogs,
  setActiveTab,
  handleAddRole,
  handleRemoveRole,
  handleSelectRoleOption,
  newRoleInput,
  setNewRoleInput,
  handleAddLocation,
  handleRemoveLocation,
  handleSelectLocationOption,
  newLocationInput,
  setNewLocationInput,
  handleToggleWorkMode,
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  const validateForm = () => {
    const errs = {};
    const roles = (prefForm.target_roles || []).filter((r) => r && r.trim());
    if (roles.length === 0) {
      errs.target_roles = 'Please add at least one Target Role.';
    }
    if (!prefForm.work_modes || prefForm.work_modes.length === 0) {
      errs.work_modes = 'Please select at least one Work Mode (Remote, Hybrid, or Onsite).';
    }
    const locs = (prefForm.target_countries || []).filter((l) => l && l.trim());
    if (locs.length === 0) {
      errs.target_countries = 'Please add at least one Target Search Location.';
    }
    if (!prefForm.posted_within_days) {
      errs.posted_within_days = 'Please select a Date Posted filter.';
    }
    if (prefForm.min_salary === '' || prefForm.min_salary === null || Number(prefForm.min_salary) <= 0) {
      errs.min_salary = 'Please enter a valid minimum package (LPA).';
    }
    if (prefForm.max_salary === '' || prefForm.max_salary === null || Number(prefForm.max_salary) <= 0) {
      errs.max_salary = 'Please enter target package (LPA).';
    } else if (Number(prefForm.max_salary) < Number(prefForm.min_salary)) {
      errs.max_salary = 'Target package cannot be lower than minimum package.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSave = () => {
    if (!validateForm()) return;
    handleSavePreferences();
  };

  const onStartCycle = () => {
    if (!validateForm()) return;
    handleSaveAndTriggerAgent();
  };

  const handleAddRoleWithClear = (e) => {
    handleAddRole(e);
    setValidationErrors((prev) => ({ ...prev, target_roles: null }));
  };

  const handleSelectRoleOptionWithClear = (role) => {
    handleSelectRoleOption(role);
    setValidationErrors((prev) => ({ ...prev, target_roles: null }));
  };

  const handleToggleWorkModeWithClear = (mode) => {
    handleToggleWorkMode(mode);
    setValidationErrors((prev) => ({ ...prev, work_modes: null }));
  };

  const handleAddLocationWithClear = (e) => {
    handleAddLocation(e);
    setValidationErrors((prev) => ({ ...prev, target_countries: null }));
  };

  const handleSelectLocationOptionWithClear = (loc) => {
    handleSelectLocationOption(loc);
    setValidationErrors((prev) => ({ ...prev, target_countries: null }));
  };

  return (
    <div className="space-y-6">
      {/* Search Configuration Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Agent Search Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure target roles, locations, work modes, date freshness, and match score threshold. Runs autonomous discovery and scoring cycle.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              disabled={savingProfile || isRunning}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            >
              {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Settings</span>
            </button>
            <button
              onClick={onStartCycle}
              disabled={isRunning}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Discovering & Scoring Jobs...' : 'Start Agent Cycle'}</span>
            </button>
          </div>
        </div>

        {/* 1. Target Roles with Master IT Options & Live Search */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Target Roles ({prefForm.target_roles.length})</label>
            <span className="text-slate-400 text-[11px]">Type below to filter IT roles</span>
          </div>

          {/* Selected Roles Badges */}
          <div
            className={`flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border transition-all ${
              validationErrors.target_roles
                ? 'border-rose-400 bg-rose-50/20 shadow-xs'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            {(prefForm.target_roles || []).map((role) => (
              <span
                key={role}
                className="bg-white border border-slate-200 text-slate-800 font-medium px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {validationErrors.target_roles && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.target_roles}</span>
            </p>
          )}

          {/* Role Input with Type Search */}
          <form onSubmit={handleAddRoleWithClear} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => {
                  setNewRoleInput(e.target.value);
                  if (validationErrors.target_roles) {
                    setValidationErrors((prev) => ({ ...prev, target_roles: null }));
                  }
                }}
                placeholder="Search across 400+ roles or type custom role (e.g. Data Analyst, RPA, Python, Finance)..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Quick Level Variations */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-500 font-semibold">Level Prefixes:</span>
            {['Fresher', 'Junior', 'Associate', 'Executive', 'Senior', 'Lead', 'Manager', 'Intern'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  const curr = newRoleInput.trim();
                  if (!curr) {
                    setNewRoleInput(`${lvl} `);
                  } else if (!curr.toLowerCase().startsWith(lvl.toLowerCase())) {
                    setNewRoleInput(`${lvl} ${curr}`);
                  }
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-600 text-[10px] font-medium rounded border border-slate-200 transition-colors cursor-pointer"
              >
                + {lvl}
              </button>
            ))}
          </div>

          {/* Industry Category Filter Chips (18 Categories) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">
                Browse Roles by Industry ({Object.keys(metaOptions?.role_categories || {}).length || 18} Categories):
              </span>
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  Clear Filter (Show All)
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scroll-smooth">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {Object.keys(metaOptions?.role_categories || {}).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Master Taxonomy Dynamic Suggestion Pills */}
          <div className="pt-1 space-y-1.5">
            <span className="text-[11px] text-slate-500 font-semibold block">
              {newRoleInput.trim()
                ? `Matching Roles for "${newRoleInput}":`
                : selectedCategory !== 'All'
                ? `${selectedCategory} Roles (Click to add):`
                : 'Popular Roles (Click to add or select a category above):'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-lg bg-slate-50/50">
              {(() => {
                const pool =
                  selectedCategory !== 'All' && metaOptions?.role_categories?.[selectedCategory]
                    ? metaOptions.role_categories[selectedCategory]
                    : metaOptions?.roles || [];
                const search = newRoleInput.trim().toLowerCase();
                const filtered = pool.filter((r) => {
                  const matchSearch = search ? r.toLowerCase().includes(search) : true;
                  const notAdded = !(prefForm.target_roles || []).some((tr) => tr.toLowerCase() === r.toLowerCase());
                  return matchSearch && notAdded;
                });
                const displayList = filtered.slice(0, search ? 30 : selectedCategory !== 'All' ? 40 : 16);

                if (displayList.length === 0) {
                  return (
                    <span className="text-[11px] text-slate-400 py-1 px-2 italic">
                      No matching unselected roles found. Type in the box above to add a custom role.
                    </span>
                  );
                }

                return displayList.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSelectRoleOptionWithClear(role)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-emerald-500" />
                    <span>{role}</span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* 2. Allowed Work Modes */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Allowed Work Modes</label>
            <button
              type="button"
              onClick={() => {
                setPrefForm({ ...prefForm, work_modes: ['remote', 'hybrid'] });
                setValidationErrors((prev) => ({ ...prev, work_modes: null }));
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
            >
              ⚡ Both (Remote & Hybrid)
            </button>
          </div>
          <div
            className={`flex flex-wrap items-center gap-2 p-1.5 rounded-xl border transition-all ${
              validationErrors.work_modes ? 'border-rose-400 bg-rose-50/20' : 'border-transparent'
            }`}
          >
            {(metaOptions?.work_modes || ['remote', 'hybrid', 'onsite']).map((mode) => (
              <label
                key={mode}
                onClick={() => handleToggleWorkModeWithClear(mode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                  (prefForm.work_modes || []).includes(mode)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode === 'remote' ? '🌐 Remote' : mode === 'hybrid' ? '🏢 Hybrid' : '📍 Onsite'}
              </label>
            ))}
          </div>
          {validationErrors.work_modes && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.work_modes}</span>
            </p>
          )}
        </div>

        {/* 3. Target Search Locations with Kerala Hubs & Live Search */}
        <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Target Search Locations ({(prefForm.target_countries || []).length})</label>
            <span className="text-slate-400 text-[11px]">Type below to filter locations</span>
          </div>

          {/* Selected Locations Badges */}
          <div
            className={`flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border transition-all ${
              validationErrors.target_countries
                ? 'border-rose-400 bg-rose-50/20 shadow-xs'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            {(prefForm.target_countries || []).map((loc) => (
              <span
                key={loc}
                className="bg-white border border-slate-200 text-slate-800 font-medium px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {validationErrors.target_countries && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.target_countries}</span>
            </p>
          )}

          {/* Location Input with Type Search */}
          <form onSubmit={handleAddLocationWithClear} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => {
                  setNewLocationInput(e.target.value);
                  if (validationErrors.target_countries) {
                    setValidationErrors((prev) => ({ ...prev, target_countries: null }));
                  }
                }}
                placeholder="Type keyword to filter locations (e.g. Kerala, Kochi, Bangalore, Remote)..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Master Locations Dynamic Suggestion Pills */}
          <div className="pt-1 space-y-1.5">
            <span className="text-[11px] text-slate-500 font-semibold block">
              {newLocationInput.trim() ? `Matching Locations for "${newLocationInput}":` : 'Popular IT & Kerala Locations (Click to add):'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {(metaOptions?.locations || [])
                .filter((loc) => {
                  const matchSearch = newLocationInput.trim()
                    ? loc.toLowerCase().includes(newLocationInput.toLowerCase().trim())
                    : true;
                  const notAdded = !(prefForm.target_countries || []).some((l) => l.toLowerCase() === loc.toLowerCase());
                  return matchSearch && notAdded;
                })
                .slice(0, newLocationInput.trim() ? 15 : 8)
                .map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleSelectLocationOptionWithClear(loc)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{loc}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 4. Date Posted Freshness Filter */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Date Posted Filter</label>
            <span className="text-slate-400 text-[11px]">Filters out jobs posted earlier than selected threshold</span>
          </div>
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1 rounded-xl border transition-all ${
              validationErrors.posted_within_days ? 'border-rose-400 bg-rose-50/20' : 'border-transparent'
            }`}
          >
            {(metaOptions?.date_freshness?.length
              ? metaOptions.date_freshness
              : [
                  { days: 1, label: 'Today (Past 24 Hours)' },
                  { days: 3, label: 'Past 3 Days' },
                  { days: 7, label: 'Past 7 Days (Recommended)' },
                  { days: 14, label: 'Past 14 Days' },
                  { days: 30, label: 'Past 30 Days' },
                ]
            ).map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => {
                  setPrefForm({ ...prefForm, posted_within_days: opt.days });
                  setValidationErrors((prev) => ({ ...prev, posted_within_days: null }));
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  prefForm.posted_within_days === opt.days
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {validationErrors.posted_within_days && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.posted_within_days}</span>
            </p>
          )}
        </div>

        {/* 5. Expected Salary / Average LPA */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <label className="font-bold text-slate-800">Expected Salary / Average LPA</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Minimum (LPA / INR)</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 6"
                value={prefForm.min_salary || ''}
                onChange={(e) => {
                  setPrefForm({ ...prefForm, min_salary: e.target.value });
                  setValidationErrors((prev) => ({ ...prev, min_salary: null, max_salary: null }));
                }}
                className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all ${
                  validationErrors.min_salary ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                }`}
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Target / Average (LPA)</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 12"
                value={prefForm.max_salary || ''}
                onChange={(e) => {
                  setPrefForm({ ...prefForm, max_salary: e.target.value });
                  setValidationErrors((prev) => ({ ...prev, max_salary: null }));
                }}
                className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all ${
                  validationErrors.max_salary ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                }`}
              />
            </div>
          </div>
          {(validationErrors.min_salary || validationErrors.max_salary) && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.min_salary || validationErrors.max_salary}</span>
            </p>
          )}
          <span className="text-[11px] text-slate-400 block">
            Target package range: {prefForm.min_salary || 6} – {prefForm.max_salary || 15} LPA ({prefForm.currency || 'INR'})
          </span>
        </div>

        {/* 6. Minimum Match Score Threshold */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Minimum Match Score Threshold</label>
            <span className="font-black text-emerald-600 text-sm">{prefForm.min_match_score}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="90"
            value={prefForm.min_match_score}
            onChange={(e) => setPrefForm({ ...prefForm, min_match_score: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <span className="text-[11px] text-slate-400 block">
            Only jobs matching {prefForm.min_match_score}% or higher will be qualified and recommended.
          </span>
        </div>
      </div>

      {/* Run Outcome Notification Banner */}
      {!isRunning && activeRun?.status === 'COMPLETED' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900">
              <strong className="block text-slate-900">Last Agent Cycle Finished Successfully!</strong>
              <span>Discovered and scored matching jobs strictly based on your configured search settings.</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <span>View All in Discovered Jobs Feed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Audit Log Stream (Inline Real-Time Terminal) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Execution Audit Stream</span>
            {isRunning && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Active Run In-Progress
              </span>
            )}
          </div>
          <button
            onClick={() => fetchRunsAndLogs()}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {agentLogs.length > 0 ? (
            agentLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex items-center justify-between font-mono hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                    {log.stage}
                  </span>
                  <span className="text-slate-700">{log.message}</span>
                </div>
                <span className="text-slate-400 text-[11px] ml-4 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-mono">
              No audit events yet. Click "Start Cycle (Discover & Score 10 Jobs)" above to execute.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
