import React from 'react';
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
              Configure target roles, locations, work modes, date freshness, and match score threshold. Runs strictly on-demand (Max 10 jobs per cycle).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSavePreferences()}
              disabled={savingProfile || isRunning}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            >
              {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Settings</span>
            </button>
            <button
              onClick={handleSaveAndTriggerAgent}
              disabled={isRunning}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Processing 10 Jobs...' : 'Start Cycle (Discover & Score 10 Jobs)'}</span>
            </button>
          </div>
        </div>

        {/* Validation Warning Alert if required fields are missing */}
        {(!prefForm.target_roles.length || !prefForm.target_countries.length || !prefForm.work_modes.length) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Configuration Required:</strong> Target Roles, Target Locations, and Allowed Work Modes must all be configured before starting the Agent cycle.
            </span>
          </div>
        )}

        {/* 1. Target Roles with Master IT Options & Live Search */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">Target Roles ({prefForm.target_roles.length})</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Required *
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Type below to filter IT roles</span>
          </div>

          {/* Selected Roles Badges */}
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 rounded-xl border border-slate-200">
            {prefForm.target_roles.map((role) => (
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

          {/* Role Input with Type Search */}
          <form onSubmit={handleAddRole} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="Type keyword to filter IT roles (e.g. Python, Full Stack, DevOps)..."
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

          {/* Master IT Roles Dynamic Suggestion Pills */}
          <div className="pt-1 space-y-1.5">
            <span className="text-[11px] text-slate-500 font-semibold block">
              {newRoleInput.trim() ? `Matching Roles for "${newRoleInput}":` : 'Popular IT Roles (Click to add):'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {(metaOptions?.roles || [])
                .filter((r) => {
                  const matchSearch = newRoleInput.trim()
                    ? r.toLowerCase().includes(newRoleInput.toLowerCase().trim())
                    : true;
                  const notAdded = !prefForm.target_roles.some((tr) => tr.toLowerCase() === r.toLowerCase());
                  return matchSearch && notAdded;
                })
                .slice(0, newRoleInput.trim() ? 15 : 8)
                .map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSelectRoleOption(role)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{role}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 2. Allowed Work Modes */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">Allowed Work Modes</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Required *
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrefForm({ ...prefForm, work_modes: ['remote', 'hybrid'] })}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
            >
              ⚡ Both (Remote & Hybrid)
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(metaOptions?.work_modes || ['remote', 'hybrid', 'onsite']).map((mode) => (
              <label
                key={mode}
                onClick={() => handleToggleWorkMode(mode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                  prefForm.work_modes.includes(mode)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode === 'remote' ? '🌐 Remote' : mode === 'hybrid' ? '🏢 Hybrid' : '📍 Onsite'}
              </label>
            ))}
          </div>
        </div>

        {/* 3. Target Search Locations with Kerala Hubs & Live Search */}
        <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">Target Search Locations ({prefForm.target_countries.length})</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Required *
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Type below to filter locations</span>
          </div>

          {/* Selected Locations Badges */}
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 rounded-xl border border-slate-200">
            {prefForm.target_countries.map((loc) => (
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

          {/* Location Input with Type Search */}
          <form onSubmit={handleAddLocation} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
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
                  const notAdded = !prefForm.target_countries.some((l) => l.toLowerCase() === loc.toLowerCase());
                  return matchSearch && notAdded;
                })
                .slice(0, newLocationInput.trim() ? 15 : 8)
                .map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleSelectLocationOption(loc)}
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
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">Date Posted Filter</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Required *
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Filters out jobs posted earlier than selected threshold</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                onClick={() => setPrefForm({ ...prefForm, posted_within_days: opt.days })}
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
        </div>

        {/* 5. Expected Salary / Average LPA */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-800">Expected Salary / Average LPA</label>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Required *
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Minimum (LPA / INR)</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 6"
                value={prefForm.min_salary || ''}
                onChange={(e) => setPrefForm({ ...prefForm, min_salary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Target / Average (LPA)</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 12"
                value={prefForm.max_salary || ''}
                onChange={(e) => setPrefForm({ ...prefForm, max_salary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Target package range: {prefForm.min_salary || 6} – {prefForm.max_salary || 15} LPA ({prefForm.currency || 'INR'})
          </span>
        </div>

        {/* 6. Minimum Match Score Threshold */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">Minimum Match Score Threshold</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Required *
              </span>
            </div>
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
