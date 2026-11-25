import React from 'react';
import {
  Sliders,
  Building,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function OverviewTab({ kpis, jobs, setActiveTab }) {
  return (
    <div className="flex flex-col gap-8">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discovered Jobs</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.total_jobs}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Live Sync</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strong Matches (≥75%)</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">{kpis.strong_matches}</span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">High Fit</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Submissions</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-blue-600">{kpis.applied_confirmed}</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Verified Proof</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Required</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{kpis.needs_action}</span>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Review Needed</span>
          </div>
        </div>
      </div>

      {/* Top Scored Job Matches Board */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-5 border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Top Scored Job Matches</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live job listings scored and ordered strictly by candidate match. Click 'Apply on Site' to open original employer posting directly in a new tab.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('agent')}
              className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agent Search Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              View All ({jobs.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.length > 0 ? (
            jobs.slice(0, 6).map((job) => {
              const score = job.match_score || 0;
              return (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-white transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{job.company_name}</span>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{job.location || 'Remote'}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-emerald-600">
                          {score > 0 ? `${score.toFixed(0)}%` : 'New'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">Fit Score</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills_required &&
                        job.skills_required.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {s}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {job.is_applied ? '✓ Already Applied' : 'Ready to apply'}
                    </span>
                    <a
                      href={job.canonical_url || job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <span>Apply on Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 text-xs">
              No jobs discovered yet. Go to "Agent Search Settings" to configure roles and start the agent cycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
