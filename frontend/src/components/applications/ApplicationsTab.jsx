import React from 'react';
import { ExternalLink, Eye, Trash2 } from 'lucide-react';

export default function ApplicationsTab({
  applications,
  resumes,
  setViewingApp,
  setModalTab,
  handleDeleteApplication,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Application Status & Audit Tracker</h2>
          <p className="text-xs text-slate-500">
            Real-time status, verifiable employer submission receipts, and tailored documents.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Role & Company</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Submission Receipt</th>
              <th className="py-3 px-4">Submitted At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {applications.length > 0 ? (
              applications.map((app) => {
                const jobTitle = app.job?.title || 'Software Developer';
                const company = app.job?.company_name || 'Employer';
                const sourceName = app.source_name || app.job?.source_name || 'Portal';
                const receiptCode = app.confirmation_evidence?.receipt_code || '—';
                const cvName =
                  app.resume_file_name ||
                  (resumes && resumes[0]?.file_name) ||
                  'Uploaded CV';

                return (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{jobTitle}</span>
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          🌐 {sourceName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                        <span>{company}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">CV: {cvName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          app.status === 'APPLIED_CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'READY' || app.status === 'PREPARED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                      {receiptCode}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString()
                        : app.created_at
                        ? new Date(app.created_at).toLocaleDateString()
                        : 'Pending'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Open Employer Portal Link */}
                        {(app.job?.application_url || app.job?.canonical_url) && (
                          <a
                            href={app.job.application_url || app.job.canonical_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Open live employer job page"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-600" />
                            <span>Portal</span>
                          </a>
                        )}

                        {/* View Application & Uploaded CV Button */}
                        <button
                          onClick={() => {
                            setViewingApp(app);
                            setModalTab('resume');
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>View</span>
                        </button>

                        {/* Delete / Un-track application */}
                        <button
                          onClick={() => handleDeleteApplication(app.id, app.job_id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No applications tracked yet. Go to "Discovered Jobs" to find matches and self-apply!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
