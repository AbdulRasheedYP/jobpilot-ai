import React from 'react';
import {
  Globe,
  Building,
  ExternalLink,
  X,
  FileCheck,
  Check,
  Copy,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function ApplicationDetailModal({
  viewingApp,
  setViewingApp,
  modalTab,
  setModalTab,
  resumes,
  profile,
  handleCopyResume,
  copied,
  handleSubmitApplication,
}) {
  if (!viewingApp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {viewingApp.job?.title || 'Job Application'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  viewingApp.status === 'APPLIED_CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : viewingApp.status === 'READY' || viewingApp.status === 'PREPARED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {viewingApp.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Source: {viewingApp.source_name || viewingApp.job?.source_name || 'Direct Portal'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{viewingApp.job?.company_name || 'Employer'}</span>
              <span>•</span>
              <span>{viewingApp.job?.location || 'Remote'}</span>
              {(viewingApp.job?.application_url || viewingApp.job?.canonical_url) && (
                <>
                  <span>•</span>
                  <a
                    href={viewingApp.job?.application_url || viewingApp.job?.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Portal Posting</span>
                  </a>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setViewingApp(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setModalTab('resume')}
            className={`py-3 px-4 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
              modalTab === 'resume'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Attached Uploaded CV
          </button>
          <button
            onClick={() => setModalTab('answers')}
            className={`py-3 px-4 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
              modalTab === 'answers'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Screening Q&A ({viewingApp.answers?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          {modalTab === 'resume' && (
            <div className="space-y-4">
              {/* Attached File Banner */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      {viewingApp.resume_file_name || (resumes && resumes[0]?.file_name) || 'Uploaded Resume Attached'}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Using your verified original uploaded CV file (No AI embellishments)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
                  Original CV
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  CV Details & Verified Facts
                </span>
                <button
                  onClick={() => handleCopyResume(viewingApp.tailored_resume_text)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed shadow-inner max-h-96 overflow-y-auto">
                {viewingApp.tailored_resume_text ||
                  `Candidate Name: ${profile?.full_name || 'Candidate'}\nEmail: ${profile?.email || 'N/A'}\nPhone: ${profile?.phone || 'Not provided'}\nAttached File: ${viewingApp.resume_file_name || (resumes && resumes[0]?.file_name) || 'Uploaded CV'}\n\nKEY VERIFIED SKILLS\n${profile?.skills?.length ? profile.skills.join(', ') : 'No skills recorded'}\n\nSTATUS\nYour verified uploaded CV document will be transmitted directly with this application.`}
              </pre>
            </div>
          )}

          {modalTab === 'answers' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                Application Screening Form Answers
              </span>
              {viewingApp.answers && viewingApp.answers.length > 0 ? (
                viewingApp.answers.map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="text-xs font-bold text-slate-900">{ans.question}</div>
                    <div className="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-md border border-slate-100">
                      {ans.answer}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Standard candidate screening answers prepared from verified profile.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified with Zero-Hallucination Policy</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewingApp(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            {(viewingApp.status === 'READY' || viewingApp.status === 'PREPARED') && (
              <button
                onClick={() => handleSubmitApplication(viewingApp.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Application Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
