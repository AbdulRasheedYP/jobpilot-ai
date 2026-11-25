import React from 'react';
import {
  Globe,
  ExternalLink,
  Check,
  CheckCircle2,
  Sliders,
  Bot,
  SearchX,
  Play,
} from 'lucide-react';

export default function JobsTab({
  jobs,
  loading,
  handleMarkApplied,
  hasEverRun,
  setActiveTab,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agent-Matched Opportunities</h2>
          <p className="text-xs text-slate-500">
            Job listings discovered and scored by the Agent combining your CV facts and search preferences.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('agent')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Agent Search Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map((job) => {
            const fitScore = job.match_score !== undefined && job.match_score !== null ? job.match_score : null;
            const reasons = job.decision_reasons || [];
            const matchedSkillsList = job.matched_skills || [];

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                    {job.is_remote && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        Remote
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      <span>Source: {job.source_name || 'Direct Portal'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-800">{job.company_name}</span>
                    <span>•</span>
                    <span>{job.location || 'Remote'}</span>
                    {(job.application_url || job.canonical_url) && (
                      <>
                        <span>•</span>
                        <a
                          href={job.application_url || job.canonical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                          title="Open original job posting"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Visit {job.source_name || 'Portal'}</span>
                        </a>
                      </>
                    )}
                  </p>

                  {reasons && reasons.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Match Rationale:</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                        {reasons.slice(0, 3).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills_required &&
                      job.skills_required.map((s) => {
                        const isMatched = matchedSkillsList.some(
                          (ms) => ms.toLowerCase() === s.toLowerCase()
                        );
                        return (
                          <span
                            key={s}
                            className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                              isMatched
                                ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s} {isMatched ? '✓' : ''}
                          </span>
                        );
                      })}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right">
                    <div
                      className={`text-2xl font-black ${
                        fitScore && fitScore >= 80
                          ? 'text-emerald-600'
                          : fitScore && fitScore >= 50
                          ? 'text-blue-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {fitScore !== null && fitScore > 0 ? `${Math.round(fitScore)}%` : '—'}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">CV Match Fit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={job.application_url || job.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      title="Open employer application page"
                    >
                      <span>Apply on Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {job.is_applied ? (
                      <span className="py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkApplied(job.id)}
                        className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title="Mark this job as applied in your tracker"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mark Applied</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : !hasEverRun ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100">
              <Bot className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Agent Cycle Not Yet Run</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4 leading-relaxed">
              Jobs are discovered and scored strictly during the Agent Cycle by combining your CV facts and your search preferences.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Configure your Target Roles, Locations, Work Mode, and Salary, then run the cycle.
            </p>
            <button
              onClick={() => setActiveTab('agent')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Go to Agent Search Settings
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 border border-amber-100">
              <SearchX className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">No Matching Jobs Found</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              The agent ran but no jobs matched your current search filters. Try broadening your locations or adding more target roles in Agent Settings.
            </p>
            <button
              onClick={() => setActiveTab('agent')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              Adjust Agent Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
