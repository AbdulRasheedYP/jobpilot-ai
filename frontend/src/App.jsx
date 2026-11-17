import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  Send,
  Eye,
  Check,
  Building,
  MapPin,
  Clock,
  Award,
  Zap,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState({
    total_jobs: 14,
    total_matches: 12,
    strong_matches: 4,
    total_applications: 3,
    applied_confirmed: 2,
    needs_action: 1,
    auto_apply_enabled: true,
    daily_application_limit: 5,
    daily_applications_used: 2
  });

  const [jobs, setJobs] = useState([
    {
      id: 'job-001',
      title: 'Junior Python Developer',
      company_name: 'Apex Tech Solutions',
      location: 'Bangalore, India',
      is_remote: true,
      salary_min: 500000,
      salary_max: 800000,
      currency: 'INR',
      score: 87.5,
      eligibility: 'PASS',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Git'],
      reasons: ['Strong Python & FastAPI match', 'Full remote work flexibility', 'Junior/Fresher aligned experience']
    },
    {
      id: 'job-002',
      title: 'Full Stack Software Engineer (Python/React)',
      company_name: 'Innovate Labs',
      location: 'Kochi, India',
      is_remote: false,
      salary_min: 600000,
      salary_max: 1000000,
      currency: 'INR',
      score: 82.0,
      eligibility: 'PASS',
      skills: ['Python', 'React', 'Docker'],
      reasons: ['Python + React stack match', 'Target role alignment', 'Education credential verified']
    },
    {
      id: 'job-003',
      title: 'Backend Developer (Django)',
      company_name: 'CloudBridge Global',
      location: 'Remote',
      is_remote: true,
      salary_min: 700000,
      salary_max: 1100000,
      currency: 'INR',
      score: 74.0,
      eligibility: 'PASS',
      skills: ['Python', 'Django', 'REST API'],
      reasons: ['Core Python skills match', 'Remote friendly']
    }
  ]);

  const [applications, setApplications] = useState([
    {
      id: 'app-101',
      job_title: 'Junior Python Developer',
      company_name: 'Apex Tech Solutions',
      status: 'APPLIED_CONFIRMED',
      receipt_code: 'REC-MOCK-9F8A2B1C33',
      submitted_at: '2026-11-15 16:51',
      notes: 'Submission verified with employer portal receipt.'
    },
    {
      id: 'app-102',
      job_title: 'Full Stack Software Engineer (Python/React)',
      company_name: 'Innovate Labs',
      status: 'APPLIED_CONFIRMED',
      receipt_code: 'REC-MOCK-4E1D9902A8',
      submitted_at: '2026-11-15 17:10',
      notes: 'Automated application complete.'
    },
    {
      id: 'app-103',
      job_title: 'Backend Developer (Django)',
      company_name: 'CloudBridge Global',
      status: 'NEEDS_USER_INPUT',
      receipt_code: null,
      submitted_at: null,
      notes: 'Candidate review required for specific screening answers.'
    }
  ]);

  const [agentLogs, setAgentLogs] = useState([
    { stage: 'INIT', message: 'Agent run #run-8921 initiated.', timestamp: '11:29:43' },
    { stage: 'DISCOVERY', message: 'Scanning Arbeitnow & Mock Portal feeds... Found 3 new listings.', timestamp: '11:30:05' },
    { stage: 'MATCHING', message: 'Evaluated 12 jobs: 4 strong matches (>=80%).', timestamp: '11:30:19' },
    { stage: 'PREPARATION', message: 'ATS resume tailored using verified candidate facts only (Zero-Hallucination Guard OK).', timestamp: '11:30:35' },
    { stage: 'AUTO_APPLY', message: 'Auto-apply policy verified: Submitted 2 applications with official receipts.', timestamp: '11:31:02' },
    { stage: 'COMPLETED', message: 'Agent cycle completed successfully. System standing by for next scheduled interval.', timestamp: '11:31:15' }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const handleRunAgent = () => {
    setIsRunning(true);
    setTimeout(() => {
      setAgentLogs(prev => [
        { stage: 'DISCOVERY', message: 'Live scan triggered: Checking Arbeitnow API for new Python roles...', timestamp: new Date().toLocaleTimeString() },
        { stage: 'MATCHING', message: 'Scoring engine verified 2 new listings.', timestamp: new Date().toLocaleTimeString() },
        ...prev
      ]);
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                JobPilot AI
                <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">v1.0 Cloud</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Autonomous 24/7 Job Search & Application Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-semibold">Agent Online</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Hallucination Guard Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col gap-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'jobs', label: 'Discovered Jobs', icon: Briefcase },
            { id: 'applications', label: 'Applications Tracker', icon: CheckCircle2 },
            { id: 'profile', label: 'Profile & Preferences', icon: UserCheck },
            { id: 'agent', label: 'Agent Control & Logs', icon: Bot },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  active 
                    ? 'border-emerald-600 text-emerald-600 font-semibold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discovered Jobs</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{kpis.total_jobs}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Live Sync</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strong Matches (≥80%)</span>
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

            {/* Quick Agent Status & Top Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-slate-900">Top Scored Job Matches</h2>
                  <button onClick={() => setActiveTab('jobs')} className="text-xs text-emerald-600 font-semibold hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-4">
                  {jobs.slice(0, 2).map(job => (
                    <div key={job.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-all flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.company_name}</span>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {job.skills.map(s => (
                            <span key={s} className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                          {job.score}% Match
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">Eligible: {job.eligibility}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Quick Control */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-2">Autonomous Agent</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automated background loop scans permitted sources, scores opportunities, prepares tailored CVs, and auto-submits where authorized.
                  </p>
                  
                  <div className="mt-5 space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span>Daily Apply Quota</span>
                      <span className="font-bold text-slate-900">{kpis.daily_applications_used} / {kpis.daily_application_limit}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span>Auto-Apply Status</span>
                      <span className="font-bold text-emerald-600">Enabled</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>Permitted Sources</span>
                      <span className="font-bold text-slate-900">Arbeitnow, Mock Portal</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRunAgent}
                  disabled={isRunning}
                  className="mt-6 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Running Agent Cycle...' : 'Trigger Agent Run Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Discovered Jobs */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Discovered Job Opportunities</h2>
                <p className="text-xs text-slate-500">Live feed deduplicated by canonical URL with explainable match scores.</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500 font-medium">Filter: Remote Only</span>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                      {job.is_remote && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Remote</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                      <span className="font-semibold text-slate-800">{job.company_name}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">₹{(job.salary_min / 100000).toFixed(1)}L - ₹{(job.salary_max / 100000).toFixed(1)}L</span>
                    </p>
                    
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Match Rationale:</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                        {job.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.map(s => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600">{job.score}%</div>
                      <span className="text-[11px] text-slate-500 font-medium">Decision: Strong Match</span>
                    </div>
                    <button className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5">
                      <span>Prepare CV</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Applications Tracker */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Application Status & Audit Tracker</h2>
                <p className="text-xs text-slate-500">Real-time status, verifiable employer submission receipts, and action items.</p>
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
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div>{app.job_title}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{app.company_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          app.status === 'APPLIED_CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status === 'APPLIED_CONFIRMED' ? 'Applied Confirmed' : 'Action Required'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                        {app.receipt_code || '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {app.submitted_at || 'Pending Review'}
                      </td>
                      <td className="py-4 px-4 text-slate-500 max-w-xs truncate">
                        {app.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Profile & Preferences */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified Candidate Facts</span>
              </h2>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">Jane Doe</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Email & Phone</span>
                  <span className="text-slate-800">candidate@example.com • +91 9876543210</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Confirmed Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git'].map(s => (
                      <span key={s} className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Education</span>
                  <span className="text-slate-800">B.Tech in Computer Science, XYZ University (2024)</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Notice Period & Sponsorship</span>
                  <span className="text-slate-800">Immediate (0 days) • Authorized to work without sponsorship</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Job Preferences & Safety Policy</span>
              </h2>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Auto-Apply Enabled</span>
                  <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-full text-[11px]">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Minimum Match Threshold</span>
                  <span className="font-bold text-slate-900">65%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Daily Submission Limit</span>
                  <span className="font-bold text-slate-900">5 applications/day</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-slate-700">Target Roles</span>
                  <span className="font-bold text-slate-900">Python Developer, Backend Developer</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Agent Control & Logs */}
        {activeTab === 'agent' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Agent Audit Trail & Execution Terminal</h2>
                <p className="text-xs text-slate-500">Live deterministic events stream recorded by JobPilot AI.</p>
              </div>
              <button
                onClick={handleRunAgent}
                disabled={isRunning}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Trigger Cycle</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 font-mono text-xs p-5 rounded-xl border border-slate-800 space-y-3 max-h-96 overflow-y-auto">
              {agentLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    log.stage === 'DISCOVERY' ? 'bg-blue-900 text-blue-200' :
                    log.stage === 'MATCHING' ? 'bg-purple-900 text-purple-200' :
                    log.stage === 'PREPARATION' ? 'bg-amber-900 text-amber-200' :
                    log.stage === 'AUTO_APPLY' ? 'bg-emerald-900 text-emerald-200' :
                    'bg-slate-800 text-slate-300'
                  }`}>{log.stage}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
